-- SUPABASE SETUP INSTRUCTIONS
-- Run these SQL commands in your Supabase SQL Editor

-- 1. First, create the personal_notes table if it doesn't exist
CREATE TABLE IF NOT EXISTS personal_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for personal_notes
CREATE INDEX IF NOT EXISTS idx_personal_notes_user_id ON personal_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_notes_created_at ON personal_notes(created_at DESC);

-- 2. Make yourself an admin user
-- Replace 'YOUR_USER_ID' with your actual user ID from the users table
-- First, find your user ID:
SELECT id, email, role FROM users WHERE email = 'mahmoud78zalat@gmail.com';

-- Then update your role to admin (replace the ID with your actual user ID):
UPDATE users 
SET role = 'admin', status = 'active' 
WHERE email = 'mahmoud78zalat@gmail.com';

-- 3. Verify your admin status
SELECT id, email, role, status FROM users WHERE email = 'mahmoud78zalat@gmail.com';

-- 4. Create a trigger to update updated_at timestamp for personal_notes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_personal_notes_updated_at 
    BEFORE UPDATE ON personal_notes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Enable RLS for personal_notes (if needed)
ALTER TABLE personal_notes ENABLE ROW LEVEL SECURITY;

-- 6. Create policy for personal_notes (users can only access their own notes)
CREATE POLICY "Users can manage their own notes" ON personal_notes
    FOR ALL USING (user_id = auth.uid()::text);