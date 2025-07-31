-- Add FAQ and announcement tracking tables for proper Supabase sync

-- First, let's check the exact column types in the existing tables
-- Fix the data types to match existing schema exactly

-- User FAQ acknowledgments to track who has seen FAQs
CREATE TABLE IF NOT EXISTS user_faq_acks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    faq_id UUID NOT NULL,
    acknowledged_at TIMESTAMPTZ DEFAULT NOW(),
    -- Unique constraint to prevent duplicate acknowledgments
    UNIQUE(user_id, faq_id)
);

-- User announcement acknowledgments to track who has seen announcements
-- Drop and recreate to ensure proper types
DROP TABLE IF EXISTS user_announcement_acks;
CREATE TABLE user_announcement_acks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    announcement_id UUID NOT NULL,
    acknowledged_at TIMESTAMPTZ DEFAULT NOW(),
    -- Unique constraint to prevent duplicate acknowledgments
    UNIQUE(user_id, announcement_id)
);

-- Add foreign key constraints only after ensuring type compatibility
-- Check if the referenced tables exist and have the correct column types
DO $$
BEGIN
    -- Add FK for user_faq_acks.user_id -> users.id if users table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        -- Check if the users.id column is TEXT type
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'users' AND column_name = 'id' AND data_type = 'text') THEN
            ALTER TABLE user_faq_acks 
            ADD CONSTRAINT user_faq_acks_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        END IF;
    END IF;

    -- Add FK for user_faq_acks.faq_id -> faqs.id if faqs table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'faqs') THEN
        -- Check if the faqs.id column is UUID type
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'faqs' AND column_name = 'id' AND data_type = 'uuid') THEN
            ALTER TABLE user_faq_acks 
            ADD CONSTRAINT user_faq_acks_faq_id_fkey 
            FOREIGN KEY (faq_id) REFERENCES faqs(id) ON DELETE CASCADE;
        END IF;
    END IF;

    -- Add FK for user_announcement_acks.user_id -> users.id if users table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'users' AND column_name = 'id' AND data_type = 'text') THEN
            ALTER TABLE user_announcement_acks 
            ADD CONSTRAINT user_announcement_acks_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        END IF;
    END IF;

    -- Add FK for user_announcement_acks.announcement_id -> announcements.id if announcements table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'announcements') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'announcements' AND column_name = 'id' AND data_type = 'uuid') THEN
            ALTER TABLE user_announcement_acks 
            ADD CONSTRAINT user_announcement_acks_announcement_id_fkey 
            FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_faq_acks_user_id ON user_faq_acks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_faq_acks_faq_id ON user_faq_acks(faq_id);
CREATE INDEX IF NOT EXISTS idx_user_announcement_acks_user_id ON user_announcement_acks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_announcement_acks_announcement_id ON user_announcement_acks(announcement_id);

-- Enable RLS on the new tables
ALTER TABLE user_faq_acks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_announcement_acks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own FAQ acknowledgments" ON user_faq_acks;
DROP POLICY IF EXISTS "Users can insert their own FAQ acknowledgments" ON user_faq_acks;
DROP POLICY IF EXISTS "Users can view their own announcement acknowledgments" ON user_announcement_acks;
DROP POLICY IF EXISTS "Users can insert their own announcement acknowledgments" ON user_announcement_acks;

-- Create policies for user_faq_acks
CREATE POLICY "Users can view their own FAQ acknowledgments"
ON user_faq_acks FOR SELECT
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own FAQ acknowledgments"
ON user_faq_acks FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

-- Create policies for user_announcement_acks
CREATE POLICY "Users can view their own announcement acknowledgments"
ON user_announcement_acks FOR SELECT
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own announcement acknowledgments"
ON user_announcement_acks FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

-- Grant permissions to authenticated users
GRANT SELECT, INSERT ON user_faq_acks TO authenticated;
GRANT SELECT, INSERT ON user_announcement_acks TO authenticated;