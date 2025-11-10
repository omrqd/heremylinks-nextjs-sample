-- ============================================================
-- Migration: Add Analytics Tracking
-- Description: Creates link_analytics table for visitor tracking
-- ============================================================

-- Create link_analytics table
CREATE TABLE IF NOT EXISTS link_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  link_id UUID NOT NULL,
  user_id UUID NOT NULL,
  
  -- Visitor Information
  visitor_ip VARCHAR(45) NOT NULL, -- Supports IPv4 and IPv6
  visitor_country VARCHAR(100) DEFAULT NULL,
  visitor_city VARCHAR(100) DEFAULT NULL,
  visitor_region VARCHAR(100) DEFAULT NULL,
  
  -- Device Information
  user_agent TEXT DEFAULT NULL,
  device_type VARCHAR(50) DEFAULT NULL, -- 'desktop', 'mobile', 'tablet'
  browser VARCHAR(100) DEFAULT NULL,
  os VARCHAR(100) DEFAULT NULL,
  
  -- Referrer Information
  referrer TEXT DEFAULT NULL,
  
  -- Timestamp
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT link_analytics_link_id_fkey FOREIGN KEY (link_id) REFERENCES bio_links(id) ON DELETE CASCADE,
  CONSTRAINT link_analytics_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_link_analytics_link_id ON link_analytics(link_id);
CREATE INDEX IF NOT EXISTS idx_link_analytics_user_id ON link_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_link_analytics_clicked_at ON link_analytics(clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_link_analytics_visitor_ip ON link_analytics(visitor_ip);
CREATE INDEX IF NOT EXISTS idx_link_analytics_user_link ON link_analytics(user_id, link_id);

-- Create composite index for unique visitor counting (without DATE function to avoid IMMUTABLE error)
CREATE INDEX IF NOT EXISTS idx_link_analytics_unique_visitor ON link_analytics(link_id, visitor_ip, clicked_at);

-- ============================================================
-- Row Level Security (RLS) Policies
-- ============================================================

-- Enable RLS on link_analytics table
ALTER TABLE link_analytics ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view analytics for their own links
CREATE POLICY "Users can view their own link analytics" ON link_analytics
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Policy: Anyone can insert analytics (for public link tracking)
CREATE POLICY "Anyone can insert link analytics" ON link_analytics
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- Helpful Views
-- ============================================================

-- View: Daily unique visitors per link
CREATE OR REPLACE VIEW daily_unique_visitors AS
SELECT 
  link_id,
  user_id,
  DATE(clicked_at) as date,
  COUNT(DISTINCT visitor_ip) as unique_visitors,
  COUNT(*) as total_clicks
FROM link_analytics
GROUP BY link_id, user_id, DATE(clicked_at);

-- View: Country distribution per link
CREATE OR REPLACE VIEW link_country_stats AS
SELECT 
  link_id,
  user_id,
  visitor_country,
  COUNT(DISTINCT visitor_ip) as unique_visitors,
  COUNT(*) as total_clicks
FROM link_analytics
WHERE visitor_country IS NOT NULL
GROUP BY link_id, user_id, visitor_country;

-- View: Recent activity (last 60 seconds for "live" visitors)
CREATE OR REPLACE VIEW live_visitors AS
SELECT 
  link_id,
  user_id,
  COUNT(DISTINCT visitor_ip) as live_visitor_count
FROM link_analytics
WHERE clicked_at >= NOW() - INTERVAL '60 seconds'
GROUP BY link_id, user_id;

-- ============================================================
-- Grant permissions
-- ============================================================

GRANT ALL ON link_analytics TO anon, authenticated;
GRANT SELECT ON daily_unique_visitors TO anon, authenticated;
GRANT SELECT ON link_country_stats TO anon, authenticated;
GRANT SELECT ON live_visitors TO anon, authenticated;

-- ============================================================
-- Success message
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Analytics migration completed successfully!';
  RAISE NOTICE '📊 Table created: link_analytics';
  RAISE NOTICE '📈 Views created: daily_unique_visitors, link_country_stats, live_visitors';
  RAISE NOTICE '🔒 RLS policies configured';
END $$;

