CREATE TABLE nen2_blog_suggestions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  post_id uuid,
  category text NOT NULL CHECK (category IN (
    'seo','content_freshness','internal_links','content_gap','readability','performance'
  )),
  severity text NOT NULL CHECK (severity IN ('info','warning','critical')),
  title text NOT NULL,
  description text NOT NULL,
  action_label text,
  action_data jsonb,
  status text DEFAULT 'open' CHECK (status IN ('open','accepted','dismissed','completed')),
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);
CREATE INDEX idx_nen2_bs_user ON nen2_blog_suggestions(user_id, status);
CREATE INDEX idx_nen2_bs_post ON nen2_blog_suggestions(post_id);

CREATE TABLE nen2_analysis_runs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  posts_analyzed integer,
  suggestions_created integer,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  status text DEFAULT 'running' CHECK (status IN ('running','completed','failed')),
  error_message text
);
