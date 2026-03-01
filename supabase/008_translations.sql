-- Feature 4: 多言語AI翻訳
CREATE TABLE blog_post_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  language_code TEXT NOT NULL,
  title TEXT NOT NULL,
  content_html TEXT,
  meta_description TEXT,
  excerpt TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'needs_update')),
  translated_from_version INTEGER,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, language_code)
);

CREATE INDEX idx_translations_post ON blog_post_translations(post_id);
CREATE INDEX idx_translations_lang ON blog_post_translations(language_code);
CREATE INDEX idx_translations_user ON blog_post_translations(user_id);
