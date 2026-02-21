-- NEN2 DB: RLSを無効化
-- nen2のSupabaseではauth機能を使わない（認証はgc2側）ため、auth.uid()が機能しない。
-- アプリレベルで認証・認可を担保する:
--   - ミドルウェアでgc2認証チェック済み（/dashboard, /admin保護）
--   - 全クエリがuser_idでスコープ済み
--   - APIルートはgetUser()で認証確認済み
--
-- Supabase SQL Editorで実行してください。

-- 既存のRLSポリシーを削除
DROP POLICY IF EXISTS "Published blog posts are viewable by everyone" ON public.blog_posts;
DROP POLICY IF EXISTS "Users can insert own blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Users can update own blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Users can delete own blog posts" ON public.blog_posts;

DROP POLICY IF EXISTS "Blog categories are viewable by everyone" ON public.blog_categories;
DROP POLICY IF EXISTS "Users can manage own blog categories" ON public.blog_categories;

DROP POLICY IF EXISTS "Blog tags are viewable by everyone" ON public.blog_tags;
DROP POLICY IF EXISTS "Authenticated users can create blog tags" ON public.blog_tags;

DROP POLICY IF EXISTS "Blog post categories are viewable by everyone" ON public.blog_post_categories;
DROP POLICY IF EXISTS "Users can manage blog post categories for own posts" ON public.blog_post_categories;

DROP POLICY IF EXISTS "Blog post tags are viewable by everyone" ON public.blog_post_tags;
DROP POLICY IF EXISTS "Users can manage blog post tags for own posts" ON public.blog_post_tags;

DROP POLICY IF EXISTS "Users can view own AI usage" ON public.ai_usage_logs;
DROP POLICY IF EXISTS "Users can insert own AI usage" ON public.ai_usage_logs;

-- RLSを無効化
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE blog_tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE blog_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_categories DISABLE ROW LEVEL SECURITY;
