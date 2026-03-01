CREATE TABLE nen2_post_versions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL,
  version_number integer NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  meta_description text,
  change_type text NOT NULL CHECK (change_type IN (
    'manual_save','auto_save','publish','unpublish','ai_generate','ai_rewrite','rollback'
  )),
  change_summary text,
  content_hash text,
  word_count integer,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_nen2_pv_post ON nen2_post_versions(post_id, version_number DESC);
CREATE INDEX idx_nen2_pv_hash ON nen2_post_versions(post_id, content_hash);
