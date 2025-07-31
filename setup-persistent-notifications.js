
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

console.log('🔗 Connecting to Supabase...');
const supabase = createClient(supabaseUrl, supabaseKey);

// The SQL to execute
const sqlScript = `-- =====================================================
-- PERSISTENT NOTIFICATION SYSTEM FOR SUPABASE
-- =====================================================
-- This script creates tables to track user interactions with FAQs and announcements
-- ensuring notification states persist across browser cache clears and sessions.

-- 1. FAQ Acknowledgments Table
-- Tracks when users view/acknowledge FAQs
CREATE TABLE IF NOT EXISTS faq_acknowledgments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  faq_id UUID NOT NULL REFERENCES faqs(id) ON DELETE CASCADE,
  acknowledged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one acknowledgment per user per FAQ
  UNIQUE(user_id, faq_id)
);

-- 2. Announcement Acknowledgments Table  
-- Tracks when users click "Got it" on announcements
CREATE TABLE IF NOT EXISTS announcement_acknowledgments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  acknowledged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  announcement_version INTEGER DEFAULT 1, -- Track announcement re-announcements
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one acknowledgment per user per announcement version
  UNIQUE(user_id, announcement_id, announcement_version)
);

-- 3. User Notification Preferences Table (optional, for future use)
-- Allows users to customize notification behavior
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  disable_faq_notifications BOOLEAN DEFAULT FALSE,
  disable_announcement_notifications BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- FAQ Acknowledgments indexes
CREATE INDEX IF NOT EXISTS idx_faq_acks_user_id ON faq_acknowledgments(user_id);
CREATE INDEX IF NOT EXISTS idx_faq_acks_faq_id ON faq_acknowledgments(faq_id);
CREATE INDEX IF NOT EXISTS idx_faq_acks_acknowledged_at ON faq_acknowledgments(acknowledged_at);

-- Announcement Acknowledgments indexes  
CREATE INDEX IF NOT EXISTS idx_announcement_acks_user_id ON announcement_acknowledgments(user_id);
CREATE INDEX IF NOT EXISTS idx_announcement_acks_announcement_id ON announcement_acknowledgments(announcement_id);
CREATE INDEX IF NOT EXISTS idx_announcement_acks_acknowledged_at ON announcement_acknowledgments(acknowledged_at);
CREATE INDEX IF NOT EXISTS idx_announcement_acks_version ON announcement_acknowledgments(announcement_version);

-- User Notification Preferences indexes
CREATE INDEX IF NOT EXISTS idx_user_notif_prefs_user_id ON user_notification_preferences(user_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE faq_acknowledgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_acknowledgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- FAQ Acknowledgments policies
-- Users can only see and modify their own acknowledgments
CREATE POLICY "Users can view own FAQ acknowledgments" ON faq_acknowledgments
  FOR SELECT USING (auth.uid()::TEXT = user_id);

CREATE POLICY "Users can insert own FAQ acknowledgments" ON faq_acknowledgments
  FOR INSERT WITH CHECK (auth.uid()::TEXT = user_id);

CREATE POLICY "Users can update own FAQ acknowledgments" ON faq_acknowledgments
  FOR UPDATE USING (auth.uid()::TEXT = user_id);

-- Admins can view all FAQ acknowledgments
CREATE POLICY "Admins can view all FAQ acknowledgments" ON faq_acknowledgments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::TEXT 
      AND role = 'admin'
    )
  );

-- Announcement Acknowledgments policies
-- Users can only see and modify their own acknowledgments
CREATE POLICY "Users can view own announcement acknowledgments" ON announcement_acknowledgments
  FOR SELECT USING (auth.uid()::TEXT = user_id);

CREATE POLICY "Users can insert own announcement acknowledgments" ON announcement_acknowledgments
  FOR INSERT WITH CHECK (auth.uid()::TEXT = user_id);

CREATE POLICY "Users can update own announcement acknowledgments" ON announcement_acknowledgments
  FOR UPDATE USING (auth.uid()::TEXT = user_id);

-- Admins can view all announcement acknowledgments
CREATE POLICY "Admins can view all announcement acknowledgments" ON announcement_acknowledgments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::TEXT 
      AND role = 'admin'
    )
  );

-- User Notification Preferences policies
CREATE POLICY "Users can manage own notification preferences" ON user_notification_preferences
  FOR ALL USING (auth.uid()::TEXT = user_id);

-- =====================================================
-- HELPFUL VIEWS FOR QUERYING
-- =====================================================

-- Note: Views with auth.uid() will be handled in the backend API endpoints instead
-- since this approach requires RLS context which may not be available in all scenarios

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to acknowledge an FAQ for a user
CREATE OR REPLACE FUNCTION acknowledge_faq(p_user_id TEXT, p_faq_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO faq_acknowledgments (user_id, faq_id)
  VALUES (p_user_id, p_faq_id)
  ON CONFLICT (user_id, faq_id) 
  DO UPDATE SET 
    acknowledged_at = NOW(),
    updated_at = NOW();
  
  RETURN TRUE;
END;
$$;

-- Function to acknowledge an announcement for a user
CREATE OR REPLACE FUNCTION acknowledge_announcement(p_user_id TEXT, p_announcement_id UUID, p_version INTEGER DEFAULT 1)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO announcement_acknowledgments (user_id, announcement_id, announcement_version)
  VALUES (p_user_id, p_announcement_id, p_version)
  ON CONFLICT (user_id, announcement_id, announcement_version)
  DO UPDATE SET 
    acknowledged_at = NOW(),
    updated_at = NOW();
  
  RETURN TRUE;
END;
$$;

-- Function to check if user has new FAQs
CREATE OR REPLACE FUNCTION user_has_new_faqs(p_user_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  unack_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO unack_count
  FROM faqs f
  WHERE f.is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM faq_acknowledgments fa 
      WHERE fa.faq_id = f.id 
      AND fa.user_id = p_user_id
    );
  
  RETURN unack_count > 0;
END;
$$;

-- Function to check if user has new announcements
CREATE OR REPLACE FUNCTION user_has_new_announcements(p_user_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  unack_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO unack_count
  FROM announcements a
  WHERE a.is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM announcement_acknowledgments aa 
      WHERE aa.announcement_id = a.id 
      AND aa.user_id = p_user_id
      AND aa.announcement_version >= COALESCE(a.version, 1)
    );
  
  RETURN unack_count > 0;
END;
$$;

-- =====================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- =====================================================

-- Create or replace the updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Add triggers to update updated_at automatically
CREATE TRIGGER update_faq_acknowledgments_updated_at
  BEFORE UPDATE ON faq_acknowledgments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcement_acknowledgments_updated_at
  BEFORE UPDATE ON announcement_acknowledgments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_notification_preferences_updated_at
  BEFORE UPDATE ON user_notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Uncomment these if you want to test with sample acknowledgments
-- INSERT INTO faq_acknowledgments (user_id, faq_id) 
-- SELECT u.id, f.id 
-- FROM users u, faqs f 
-- WHERE u.email = 'test@example.com' AND f.question LIKE '%sample%'
-- ON CONFLICT DO NOTHING;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Run these to verify the setup worked correctly:

-- Check if tables were created
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('faq_acknowledgments', 'announcement_acknowledgments', 'user_notification_preferences');

-- Check if indexes were created
-- SELECT indexname FROM pg_indexes 
-- WHERE tablename IN ('faq_acknowledgments', 'announcement_acknowledgments', 'user_notification_preferences');

-- Check if RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables 
-- WHERE tablename IN ('faq_acknowledgments', 'announcement_acknowledgments', 'user_notification_preferences');

-- Check if views were created
-- SELECT viewname FROM pg_views 
-- WHERE viewname IN ('user_unacknowledged_faqs', 'user_unacknowledged_announcements');

-- Check if functions were created
-- SELECT proname FROM pg_proc 
-- WHERE proname IN ('acknowledge_faq', 'acknowledge_announcement', 'user_has_new_faqs', 'user_has_new_announcements');

COMMENT ON TABLE faq_acknowledgments IS 'Tracks when users acknowledge/view FAQs to prevent re-showing disco animations';
COMMENT ON TABLE announcement_acknowledgments IS 'Tracks when users click "Got it" on announcements with version support for re-announcements';
COMMENT ON TABLE user_notification_preferences IS 'User preferences for notification behavior (future use)';`;

async function setupPersistentNotifications() {
  try {
    console.log('🚀 Creating persistent notification tables...');
    
    // Split SQL into individual statements and execute them
    const statements = sqlScript
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('▶️ Executing:', statement.substring(0, 50) + '...');
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
        if (error) {
          console.error('❌ Error executing statement:', error);
          throw error;
        }
      }
    }
    
    console.log('✅ Persistent notification system setup complete!');
    console.log('📊 Tables created:');
    console.log('  - faq_acknowledgments');
    console.log('  - announcement_acknowledgments'); 
    console.log('  - user_notification_preferences');
    console.log('🔒 Row Level Security enabled');
    console.log('📈 Performance indexes created');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

setupPersistentNotifications();
