CREATE TABLE nen2_post_translations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL,
  language_code text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  meta_description text,
  status text DEFAULT 'draft' CHECK (status IN ('draft','published','needs_update')),
  translation_quality real,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(post_id, language_code)
);
CREATE INDEX idx_nen2_pt_post ON nen2_post_translations(post_id);
