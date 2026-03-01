-- postsテーブルにカラム追加
ALTER TABLE articles ADD COLUMN IF NOT EXISTS seo_title text;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS og_title text;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS og_description text;

-- AI指示テンプレート
CREATE TABLE nen2_ai_field_instructions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  field_name text NOT NULL,
  instruction text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, field_name)
);
