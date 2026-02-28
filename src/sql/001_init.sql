-- NEN2 v2 Schema - Clean Start
-- Run in Supabase SQL Editor (nen2 instance)

create extension if not exists "pgcrypto";

-- ============================================
-- PROFILES (renamed from users)
-- ============================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username varchar(30) unique not null,
  display_name varchar(50) not null,
  email text,
  avatar_url text,
  bio text,
  plan text default 'free' check (plan in ('free', 'pro', 'business')),
  ai_credits_remaining integer default 10,
  -- Flat design columns (no more blog_settings jsonb)
  accent_color varchar(7) default '#5c6b4a',
  heading_font varchar(100) default 'Noto Serif JP',
  body_font varchar(100) default 'Noto Sans JP',
  header_image_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ============================================
-- POSTS
-- ============================================
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title varchar(200) not null,
  slug varchar(200) not null,
  content text,              -- markdown source
  content_html text,         -- rendered HTML
  excerpt varchar(300),
  cover_image_url text,
  status text default 'draft' check (status in ('draft', 'published')),
  seo_score integer default 0 check (seo_score >= 0 and seo_score <= 100),
  meta_description varchar(160),
  published_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  constraint uq_post_user_slug unique (user_id, slug)
);
create index if not exists idx_posts_user on public.posts(user_id);
create index if not exists idx_posts_status on public.posts(status);
create index if not exists idx_posts_published on public.posts(published_at desc);
create index if not exists idx_posts_user_status on public.posts(user_id, status);

-- ============================================
-- TAGS (global)
-- ============================================
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name varchar(50) unique not null,
  created_at timestamptz default now() not null
);

-- ============================================
-- POST_TAGS (many-to-many)
-- ============================================
create table if not exists public.post_tags (
  post_id uuid not null references public.posts(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (post_id, tag_id)
);

-- ============================================
-- IMAGES (upload tracking)
-- ============================================
create table if not exists public.images (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null,
  url text not null,
  file_name text,
  file_size integer,
  content_type text,
  created_at timestamptz default now() not null
);
create index if not exists idx_images_user on public.images(user_id);

-- ============================================
-- AI_USAGE_LOGS (design type removed)
-- ============================================
create table if not exists public.ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('generate', 'rewrite', 'suggest', 'seo_analyze', 'generate_image', 'suggest_tags')),
  tokens_used integer default 0,
  created_at timestamptz default now() not null
);
create index if not exists idx_ai_usage_user on public.ai_usage_logs(user_id);
create index if not exists idx_ai_usage_created on public.ai_usage_logs(created_at);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Profiles
alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Posts
alter table public.posts enable row level security;

create policy "Published posts are viewable by everyone"
  on public.posts for select
  using (status = 'published' or auth.uid() = user_id);

create policy "Users can insert own posts"
  on public.posts for insert with check (auth.uid() = user_id);

create policy "Users can update own posts"
  on public.posts for update using (auth.uid() = user_id);

create policy "Users can delete own posts"
  on public.posts for delete using (auth.uid() = user_id);

-- Tags
alter table public.tags enable row level security;

create policy "Tags are viewable by everyone"
  on public.tags for select using (true);

create policy "Authenticated users can create tags"
  on public.tags for insert with check (auth.role() = 'authenticated');

-- Post Tags
alter table public.post_tags enable row level security;

create policy "Post tags are viewable by everyone"
  on public.post_tags for select using (true);

create policy "Users can manage post tags for own posts"
  on public.post_tags for all
  using (exists (select 1 from public.posts where posts.id = post_id and posts.user_id = auth.uid()));

-- Images
alter table public.images enable row level security;

create policy "Users can view own images"
  on public.images for select using (auth.uid() = user_id);

create policy "Users can insert own images"
  on public.images for insert with check (auth.uid() = user_id);

create policy "Users can delete own images"
  on public.images for delete using (auth.uid() = user_id);

-- AI Usage Logs
alter table public.ai_usage_logs enable row level security;

create policy "Users can view own AI usage"
  on public.ai_usage_logs for select using (auth.uid() = user_id);

create policy "Users can insert own AI usage"
  on public.ai_usage_logs for insert with check (auth.uid() = user_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-create profile on signup (gc2 auth)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, username, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do update set
    email = excluded.email,
    display_name = coalesce(excluded.display_name, profiles.display_name),
    updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-update updated_at
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.update_updated_at();

create trigger update_posts_updated_at
  before update on public.posts
  for each row execute procedure public.update_updated_at();
