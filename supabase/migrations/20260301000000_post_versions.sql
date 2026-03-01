CREATE TABLE blog_post_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  version_number INTEGER NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT,
  content_html TEXT,
  excerpt VARCHAR(300),
  meta_description VARCHAR(160),
  tags TEXT[],
  change_type TEXT NOT NULL CHECK (change_type IN (
    'manual_save', 'auto_save', 'publish', 'unpublish',
    'ai_generate', 'ai_rewrite', 'rollback'
  )),
  change_summary TEXT,
  content_hash TEXT,
  word_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_bpv_post ON blog_post_versions(post_id, version_number DESC);
CREATE INDEX idx_bpv_hash ON blog_post_versions(post_id, content_hash);
