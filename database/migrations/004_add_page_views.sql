-- ============================================================
-- Migration: Add Page View Tracking
-- Description: Track visitors viewing profile pages (not just link clicks)
-- ============================================================

-- Create page_views table for tracking profile page visitors
CREATE TABLE IF NOT EXISTS page_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  
  -- Visitor Information
  visitor_ip VARCHAR(45) NOT NULL,
  session_id VARCHAR(255) NOT NULL, -- Unique session identifier
  
  -- Visitor Details
  visitor_country VARCHAR(100) DEFAULT NULL,
  visitor_city VARCHAR(100) DEFAULT NULL,
  visitor_region VARCHAR(100) DEFAULT NULL,
  
  -- Device Information
  user_agent TEXT DEFAULT NULL,
  device_type VARCHAR(50) DEFAULT NULL,
  browser VARCHAR(100) DEFAULT NULL,
  os VARCHAR(100) DEFAULT NULL,
  
  -- Referrer
  referrer TEXT DEFAULT NULL,
  
  -- Timestamps
  first_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT page_views_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT unique_session UNIQUE (user_id, session_id)
);

-- Create indexes for page_views
CREATE INDEX IF NOT EXISTS idx_page_views_user_id ON page_views(user_id);
CREATE INDEX IF NOT EXISTS idx_page_views_last_seen ON page_views(last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_session ON page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_visitor_ip ON page_views(visitor_ip);

-- Enable RLS on page_views
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own page views" ON page_views
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Anyone can insert/update page views" ON page_views
  FOR ALL WITH CHECK (true);

-- Grant permissions
GRANT ALL ON page_views TO anon, authenticated;

-- ============================================================
-- Success message
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Page views migration completed successfully!';
  RAISE NOTICE '👁️ Table created: page_views';
  RAISE NOTICE '🔒 RLS policies configured';
END $$;

