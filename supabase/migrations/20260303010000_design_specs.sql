-- ============================================
-- DESIGN_SPECS: デザイン仕様書
-- ============================================
create table if not exists public.design_specs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  app_name text default 'NEN2',
  raw_input text not null,
  category text not null check (category in ('UI', 'UX', 'パフォーマンス', 'アクセシビリティ', 'その他')),
  title text not null,
  summary text,
  priority text default '中' check (priority in ('高', '中', '低')),
  spec_json jsonb not null,
  status text default 'new' check (status in ('new', 'adopted', 'rejected')),
  vote_count integer default 0,
  created_at timestamptz default now() not null
);

create index if not exists idx_design_specs_user on public.design_specs(user_id);
create index if not exists idx_design_specs_status on public.design_specs(status);
create index if not exists idx_design_specs_category on public.design_specs(category);
create index if not exists idx_design_specs_votes on public.design_specs(vote_count desc);
create index if not exists idx_design_specs_created on public.design_specs(created_at desc);

-- ============================================
-- SPEC_VOTES: 仕様書への投票
-- ============================================
create table if not exists public.spec_votes (
  id uuid primary key default gen_random_uuid(),
  spec_id uuid not null references public.design_specs(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz default now() not null,
  constraint uq_spec_vote unique (spec_id, user_id)
);

create index if not exists idx_spec_votes_spec on public.spec_votes(spec_id);
create index if not exists idx_spec_votes_user on public.spec_votes(user_id);
