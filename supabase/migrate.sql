-- NEN2 Migration: gc2と共存するためのスキーマ
-- Supabase SQL Editorで実行してください

-- ============================================
-- USERS: 既存テーブルにNEN2用カラムを追加
-- ============================================
alter table public.users add column if not exists plan text default 'free' check (plan in ('free', 'pro', 'business'));
alter table public.users add column if not exists ai_credits_remaining integer default 10;
alter table public.users add column if not exists blog_settings jsonb default '{
  "template": "default",
  "primaryColor": "#3b82f6",
  "fontFamily": "sans-serif",
  "headerStyle": "simple",
  "showSidebar": true
}'::jsonb;

-- ============================================
-- BLOG_POSTS (NEN2専用)
-- ============================================
create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title varchar(200) not null,
  slug varchar(200) not null,
  content text,
  content_html text,
  excerpt varchar(300),
  cover_image_url text,
  status text default 'draft' check (status in ('draft', 'published', 'scheduled')),
  seo_score integer default 0 check (seo_score >= 0 and seo_score <= 100),
  meta_description varchar(160),
  published_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  constraint uq_blog_post_user_slug unique (user_id, slug)
);
create index if not exists idx_blog_posts_user on public.blog_posts(user_id);
create index if not exists idx_blog_posts_status on public.blog_posts(status);
create index if not exists idx_blog_posts_published on public.blog_posts(published_at desc);

-- ============================================
-- BLOG_CATEGORIES
-- ============================================
create table if not exists public.blog_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name varchar(50) not null,
  slug varchar(50) not null,
  created_at timestamptz default now() not null,
  constraint uq_blog_category_user_slug unique (user_id, slug)
);

-- ============================================
-- BLOG_TAGS
-- ============================================
create table if not exists public.blog_tags (
  id uuid primary key default gen_random_uuid(),
  name varchar(50) unique not null,
  created_at timestamptz default now() not null
);

-- ============================================
-- BLOG_POST_CATEGORIES
-- ============================================
create table if not exists public.blog_post_categories (
  post_id uuid not null references public.blog_posts(id) on delete cascade,
  category_id uuid not null references public.blog_categories(id) on delete cascade,
  primary key (post_id, category_id)
);

-- ============================================
-- BLOG_POST_TAGS
-- ============================================
create table if not exists public.blog_post_tags (
  post_id uuid not null references public.blog_posts(id) on delete cascade,
  tag_id uuid not null references public.blog_tags(id) on delete cascade,
  primary key (post_id, tag_id)
);

-- ============================================
-- AI_USAGE_LOGS
-- ============================================
create table if not exists public.ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null check (type in ('generate', 'rewrite', 'suggest', 'seo_analyze', 'generate_image', 'suggest_tags', 'design')),
  tokens_used integer default 0,
  created_at timestamptz default now() not null
);
create index if not exists idx_ai_usage_user on public.ai_usage_logs(user_id);
create index if not exists idx_ai_usage_created on public.ai_usage_logs(created_at);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Blog Posts
alter table public.blog_posts enable row level security;

create policy "Published blog posts are viewable by everyone"
  on public.blog_posts for select
  using (status = 'published' or auth.uid() = user_id);

create policy "Users can insert own blog posts"
  on public.blog_posts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own blog posts"
  on public.blog_posts for update
  using (auth.uid() = user_id);

create policy "Users can delete own blog posts"
  on public.blog_posts for delete
  using (auth.uid() = user_id);

-- Blog Categories
alter table public.blog_categories enable row level security;

create policy "Blog categories are viewable by everyone"
  on public.blog_categories for select using (true);

create policy "Users can manage own blog categories"
  on public.blog_categories for all using (auth.uid() = user_id);

-- Blog Tags
alter table public.blog_tags enable row level security;

create policy "Blog tags are viewable by everyone"
  on public.blog_tags for select using (true);

create policy "Authenticated users can create blog tags"
  on public.blog_tags for insert with check (auth.role() = 'authenticated');

-- Blog Post Categories
alter table public.blog_post_categories enable row level security;

create policy "Blog post categories are viewable by everyone"
  on public.blog_post_categories for select using (true);

create policy "Users can manage blog post categories for own posts"
  on public.blog_post_categories for all
  using (exists (select 1 from public.blog_posts where blog_posts.id = post_id and blog_posts.user_id = auth.uid()));

-- Blog Post Tags
alter table public.blog_post_tags enable row level security;

create policy "Blog post tags are viewable by everyone"
  on public.blog_post_tags for select using (true);

create policy "Users can manage blog post tags for own posts"
  on public.blog_post_tags for all
  using (exists (select 1 from public.blog_posts where blog_posts.id = post_id and blog_posts.user_id = auth.uid()));

-- AI Usage Logs
alter table public.ai_usage_logs enable row level security;

create policy "Users can view own AI usage"
  on public.ai_usage_logs for select using (auth.uid() = user_id);

create policy "Users can insert own AI usage"
  on public.ai_usage_logs for insert with check (auth.uid() = user_id);

-- ============================================
-- TRIGGER: Auto-update updated_at for blog_posts
-- ============================================
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_blog_posts_updated_at on public.blog_posts;
create trigger update_blog_posts_updated_at
  before update on public.blog_posts
  for each row execute procedure public.update_updated_at();
