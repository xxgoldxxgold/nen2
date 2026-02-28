-- NEN2 v2 Data-Only Schema (no auth references, no RLS)
-- For nen2 Supabase instance (data only, auth handled by gc2)

-- Drop old tables if they exist
drop table if exists public.blog_post_tags cascade;
drop table if exists public.blog_post_categories cascade;
drop table if exists public.blog_categories cascade;
drop table if exists public.blog_tags cascade;
drop table if exists public.blog_posts cascade;
drop table if exists public.post_tags cascade;
drop table if exists public.posts cascade;
drop table if exists public.images cascade;
drop table if exists public.ai_usage_logs cascade;
drop table if exists public.tags cascade;
drop table if exists public.profiles cascade;
drop table if exists public.users cascade;

-- ============================================
-- PROFILES
-- ============================================
create table public.profiles (
  id uuid primary key,
  username varchar(30) unique not null,
  display_name varchar(50) not null,
  email text,
  avatar_url text,
  bio text,
  plan text default 'free',
  ai_credits_remaining integer default 10,
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
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title varchar(200) not null,
  slug varchar(200) not null,
  content text,
  content_html text,
  excerpt varchar(300),
  cover_image_url text,
  status text default 'draft',
  seo_score integer default 0,
  meta_description varchar(160),
  published_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  constraint uq_post_user_slug unique (user_id, slug)
);
create index idx_posts_user on public.posts(user_id);
create index idx_posts_status on public.posts(status);
create index idx_posts_published on public.posts(published_at desc);
create index idx_posts_user_status on public.posts(user_id, status);

-- ============================================
-- TAGS
-- ============================================
create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name varchar(50) unique not null,
  created_at timestamptz default now() not null
);

-- ============================================
-- POST_TAGS
-- ============================================
create table public.post_tags (
  post_id uuid not null references public.posts(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (post_id, tag_id)
);

-- ============================================
-- IMAGES
-- ============================================
create table public.images (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null,
  url text not null,
  file_name text,
  file_size integer,
  content_type text,
  created_at timestamptz default now() not null
);
create index idx_images_user on public.images(user_id);

-- ============================================
-- AI_USAGE_LOGS
-- ============================================
create table public.ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  tokens_used integer default 0,
  created_at timestamptz default now() not null
);
create index idx_ai_usage_user on public.ai_usage_logs(user_id);
create index idx_ai_usage_created on public.ai_usage_logs(created_at);

-- ============================================
-- TRIGGERS: auto-update updated_at
-- ============================================
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

-- ============================================
-- DISABLE RLS (auth handled by gc2)
-- ============================================
alter table public.profiles disable row level security;
alter table public.posts disable row level security;
alter table public.tags disable row level security;
alter table public.post_tags disable row level security;
alter table public.images disable row level security;
alter table public.ai_usage_logs disable row level security;
