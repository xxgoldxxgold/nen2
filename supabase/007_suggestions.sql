-- Feature 5: AIブログ改善提案
CREATE TABLE blog_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN (
    'seo', 'content_freshness', 'internal_links', 'content_gap', 'readability', 'performance'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  action_label TEXT,
  action_data JSONB,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'accepted', 'dismissed', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_suggestions_user ON blog_suggestions(user_id, status);
CREATE INDEX idx_suggestions_post ON blog_suggestions(post_id);

CREATE TABLE blog_analysis_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  categories TEXT[] NOT NULL,
  posts_analyzed INTEGER DEFAULT 0,
  suggestions_created INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  error_message TEXT
);

CREATE INDEX idx_analysis_runs_user ON blog_analysis_runs(user_id, started_at DESC);
