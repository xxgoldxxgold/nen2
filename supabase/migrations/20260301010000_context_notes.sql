CREATE TABLE blog_context_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('context', 'style', 'audience', 'fact', 'reference')),
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_context_notes_user ON blog_context_notes(user_id);
CREATE INDEX idx_context_notes_active ON blog_context_notes(user_id, is_active);
