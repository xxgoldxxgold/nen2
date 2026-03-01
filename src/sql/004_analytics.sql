-- 004_analytics.sql
-- Page view tracking for analytics dashboard
-- Prefix nen2_ to avoid collision with gc2 tables

CREATE TABLE IF NOT EXISTS nen2_page_views (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id     uuid NOT NULL,
  user_id     uuid NOT NULL,
  session_id  varchar(64),
  path        text,
  referrer    text,
  user_agent  text,
  country     varchar(2),
  device_type varchar(20),
  browser     varchar(50),
  created_at  timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_nen2_pv_user_created ON nen2_page_views(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nen2_pv_post_created ON nen2_page_views(post_id, created_at DESC);
