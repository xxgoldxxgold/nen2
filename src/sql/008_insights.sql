-- 既存のnen2_page_viewsにカラム追加
ALTER TABLE nen2_page_views ADD COLUMN IF NOT EXISTS event_type text DEFAULT 'pageview';
ALTER TABLE nen2_page_views ADD COLUMN IF NOT EXISTS duration_seconds integer;
ALTER TABLE nen2_page_views ADD COLUMN IF NOT EXISTS scroll_depth integer;
ALTER TABLE nen2_page_views ADD COLUMN IF NOT EXISTS utm_source text;
ALTER TABLE nen2_page_views ADD COLUMN IF NOT EXISTS utm_medium text;

-- 日次集計テーブル
CREATE TABLE nen2_analytics_daily (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  post_id uuid,
  date date NOT NULL,
  pageviews integer DEFAULT 0,
  unique_visitors integer DEFAULT 0,
  avg_duration_seconds integer DEFAULT 0,
  read_complete_count integer DEFAULT 0,
  scroll_depth_avg real DEFAULT 0,
  top_referrers jsonb DEFAULT '[]',
  device_breakdown jsonb DEFAULT '{}',
  country_breakdown jsonb DEFAULT '{}',
  UNIQUE(user_id, post_id, date)
);
CREATE INDEX idx_nen2_ad_user_date ON nen2_analytics_daily(user_id, date DESC);
CREATE INDEX idx_nen2_ad_post_date ON nen2_analytics_daily(post_id, date DESC);
