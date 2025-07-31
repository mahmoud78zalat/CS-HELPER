-- Remove created_by column from announcements table as it's no longer needed
-- This fixes the "Failed to create announcement: null value in column 'created_by'" error

BEGIN;

-- Check if the column exists before trying to drop it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'announcements' 
        AND column_name = 'created_by'
    ) THEN
        -- Drop the created_by column
        ALTER TABLE announcements DROP COLUMN created_by;
        RAISE NOTICE 'Dropped created_by column from announcements table';
    ELSE
        RAISE NOTICE 'created_by column does not exist in announcements table';
    END IF;
END $$;

COMMIT;