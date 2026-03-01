-- Analytics events (raw data)
CREATE TABLE blog_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  post_id UUID REFERENCES blog_posts(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'pageview', 'scroll_25', 'scroll_50', 'scroll_75', 'scroll_100',
    'read_complete', 'exit'
  )),
  session_id TEXT NOT NULL,
  referrer TEXT,
  device_type TEXT CHECK (device_type IN ('mobile', 'tablet', 'desktop')),
  duration_seconds INTEGER,
  page_path TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_analytics_events_user ON blog_analytics_events(user_id, created_at DESC);
CREATE INDEX idx_analytics_events_post ON blog_analytics_events(post_id, created_at DESC);
CREATE INDEX idx_analytics_events_session ON blog_analytics_events(session_id);

-- Daily aggregated analytics
CREATE TABLE blog_analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  post_id UUID REFERENCES blog_posts(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  pageviews INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  avg_duration_seconds INTEGER DEFAULT 0,
  read_complete_count INTEGER DEFAULT 0,
  top_referrers JSONB DEFAULT '[]',
  device_breakdown JSONB DEFAULT '{}',
  UNIQUE(user_id, post_id, date)
);

CREATE INDEX idx_analytics_daily_user ON blog_analytics_daily(user_id, date DESC);
CREATE INDEX idx_analytics_daily_post ON blog_analytics_daily(post_id, date DESC);
