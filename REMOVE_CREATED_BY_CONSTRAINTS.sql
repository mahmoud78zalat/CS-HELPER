-- URGENT FIX: Remove all created_by constraints and columns
-- Run this in your Supabase SQL editor to fix email template creation

-- Step 1: Drop foreign key constraints
ALTER TABLE email_templates DROP CONSTRAINT IF EXISTS email_templates_created_by_fkey;
ALTER TABLE live_reply_templates DROP CONSTRAINT IF EXISTS live_reply_templates_created_by_fkey;

-- Step 2: Drop created_by columns entirely
ALTER TABLE email_templates DROP COLUMN IF EXISTS created_by;
ALTER TABLE live_reply_templates DROP COLUMN IF EXISTS created_by;

-- Step 3: Verify tables are clean
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'email_templates' AND column_name = 'created_by';

SELECT column_name FROM information_schema.columns 
WHERE table_name = 'live_reply_templates' AND column_name = 'created_by';

-- If the above queries return no rows, the fix is complete
-- If they return rows, the columns still exist and need manual removal