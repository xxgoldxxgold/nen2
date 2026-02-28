-- 003_social.sql
-- Social features: follows, likes, comments
-- Prefix nen2_ to avoid collision with gc2 tables

CREATE TABLE IF NOT EXISTS nen2_follows (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

CREATE TABLE IF NOT EXISTS nen2_likes (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid NOT NULL,
  article_id  uuid NOT NULL,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (user_id, article_id)
);

CREATE TABLE IF NOT EXISTS nen2_comments (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid NOT NULL,
  article_id  uuid NOT NULL,
  body        text NOT NULL CHECK (char_length(body) <= 1000),
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_nen2_follows_following ON nen2_follows (following_id);
CREATE INDEX IF NOT EXISTS idx_nen2_follows_follower ON nen2_follows (follower_id);
CREATE INDEX IF NOT EXISTS idx_nen2_likes_article ON nen2_likes (article_id);
CREATE INDEX IF NOT EXISTS idx_nen2_comments_article ON nen2_comments (article_id, created_at);

-- Grant anon read access for public/ISR queries
GRANT SELECT ON nen2_follows TO anon;
GRANT SELECT ON nen2_likes TO anon;
GRANT SELECT ON nen2_comments TO anon;
