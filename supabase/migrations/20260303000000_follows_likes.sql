-- ============================================
-- USER_FOLLOWS: フォロー機能
-- ============================================
create table if not exists public.user_follows (
  follower_id uuid not null references public.users(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz default now() not null,
  primary key (follower_id, user_id),
  constraint no_self_follow check (follower_id != user_id)
);

create index if not exists idx_user_follows_user on public.user_follows(user_id);
create index if not exists idx_user_follows_follower on public.user_follows(follower_id);

-- ============================================
-- POST_LIKES: いいね機能
-- ============================================
create table if not exists public.post_likes (
  user_id uuid not null references public.users(id) on delete cascade,
  post_id uuid not null references public.blog_posts(id) on delete cascade,
  created_at timestamptz default now() not null,
  primary key (user_id, post_id)
);

create index if not exists idx_post_likes_post on public.post_likes(post_id);
create index if not exists idx_post_likes_user on public.post_likes(user_id);
