-- Add subject column to personal_notes table
-- Run this in your Supabase SQL Editor

ALTER TABLE personal_notes ADD COLUMN IF NOT EXISTS subject TEXT;

-- Update existing notes to extract subject from content where possible
UPDATE personal_notes 
SET subject = CASE 
    WHEN position(E'\n\n' in content) > 0 
    THEN substring(content from 1 for position(E'\n\n' in content) - 1)
    ELSE substring(content from 1 for 50)
END
WHERE subject IS NULL;

-- Make subject required for new notes
ALTER TABLE personal_notes ALTER COLUMN subject SET NOT NULL;

-- Update the content to remove the subject part for existing notes
UPDATE personal_notes 
SET content = CASE 
    WHEN position(E'\n\n' in content) > 0 
    THEN substring(content from position(E'\n\n' in content) + 2)
    ELSE content
END
WHERE position(E'\n\n' in content) > 0;