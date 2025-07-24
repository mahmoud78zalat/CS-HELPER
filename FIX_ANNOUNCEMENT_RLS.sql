-- Fix Announcement RLS Policies for Supabase
-- This script addresses the permission issues with announcements and acknowledgments

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all announcements" ON announcements;
DROP POLICY IF EXISTS "Admins can create announcements" ON announcements;
DROP POLICY IF EXISTS "Admins can update announcements" ON announcements;
DROP POLICY IF EXISTS "Admins can delete announcements" ON announcements;
DROP POLICY IF EXISTS "Users can insert their own acknowledgments" ON user_announcement_acks;
DROP POLICY IF EXISTS "Users can view their own acknowledgments" ON user_announcement_acks;
DROP POLICY IF EXISTS "Admins can view all acknowledgments" ON user_announcement_acks;

-- Enable RLS on both tables
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_announcement_acks ENABLE ROW LEVEL SECURITY;

-- Announcements policies
CREATE POLICY "Users can view all announcements"
  ON announcements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can create announcements"
  ON announcements FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid()::text 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update announcements"
  ON announcements FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid()::text 
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid()::text 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete announcements"
  ON announcements FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid()::text 
      AND users.role = 'admin'
    )
  );

-- User announcement acknowledgments policies
CREATE POLICY "Users can insert their own acknowledgments"
  ON user_announcement_acks FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can view their own acknowledgments"
  ON user_announcement_acks FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()::text);

CREATE POLICY "Admins can view all acknowledgments"
  ON user_announcement_acks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid()::text 
      AND users.role = 'admin'
    )
  );

-- Grant necessary permissions
GRANT ALL ON announcements TO authenticated;
GRANT ALL ON user_announcement_acks TO authenticated;

-- Add version field to announcements for re-announce functionality
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS last_announced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing announcements to have version 1
UPDATE announcements SET version = 1, last_announced_at = created_at WHERE version IS NULL;

-- Function to re-announce (bump version and timestamp)
CREATE OR REPLACE FUNCTION re_announce(announcement_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE announcements 
  SET version = version + 1, 
      last_announced_at = NOW(),
      updated_at = NOW()
  WHERE id = announcement_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION re_announce TO authenticated;

COMMENT ON FUNCTION re_announce IS 'Increments announcement version and updates timestamp to force re-display to all users';