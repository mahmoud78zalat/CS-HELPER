-- Remove createdBy fields from all tables that have them
-- This will fix the authentication issues by removing unnecessary foreign key constraints

-- Remove createdBy from template_variables table
ALTER TABLE template_variables DROP COLUMN IF EXISTS created_by;

-- Remove createdBy from color_settings table  
ALTER TABLE color_settings DROP COLUMN IF EXISTS created_by;

-- Remove createdBy from any other tables that might have it
ALTER TABLE template_variable_categories DROP COLUMN IF EXISTS created_by;

-- Optional: Remove from other tables if they exist and cause issues
-- ALTER TABLE live_reply_templates DROP COLUMN IF EXISTS created_by;
-- ALTER TABLE email_templates DROP COLUMN IF EXISTS created_by;
-- ALTER TABLE announcements DROP COLUMN IF EXISTS created_by;

-- Verify the changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'template_variables' 
AND table_schema = 'public';

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'color_settings' 
AND table_schema = 'public';