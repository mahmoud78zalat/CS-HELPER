-- SQL script to set up agent-related database optimizations
-- This script ensures optimal performance for agent profile management
-- Note: Execute manually - no automatic seeding data included

-- Add missing columns to users table if they don't exist
DO $$ 
BEGIN
    -- Add arabic_first_name column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='arabic_first_name') THEN
        ALTER TABLE users ADD COLUMN arabic_first_name VARCHAR;
    END IF;
    
    -- Add arabic_last_name column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='arabic_last_name') THEN
        ALTER TABLE users ADD COLUMN arabic_last_name VARCHAR;
    END IF;
    
    -- Add is_first_time_user column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_first_time_user') THEN
        ALTER TABLE users ADD COLUMN is_first_time_user BOOLEAN DEFAULT true NOT NULL;
    END IF;
END $$;

-- Create indexes for better performance on user lookups (uses snake_case from database)
CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, status);
CREATE INDEX IF NOT EXISTS idx_users_names ON users(first_name, last_name, arabic_first_name, arabic_last_name);