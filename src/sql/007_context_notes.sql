CREATE TABLE nen2_context_notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  category text NOT NULL CHECK (category IN ('context','style','audience','fact','reference')),
  title text NOT NULL,
  content text NOT NULL,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_nen2_cn_user ON nen2_context_notes(user_id);
CREATE INDEX idx_nen2_cn_active ON nen2_context_notes(user_id, is_active);
