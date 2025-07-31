-- Migration to remove createdBy constraints
-- This will be applied directly to Supabase

-- Remove createdBy column from live_reply_templates
ALTER TABLE live_reply_templates DROP COLUMN IF EXISTS created_by;

-- Remove createdBy column from email_templates  
ALTER TABLE email_templates DROP COLUMN IF EXISTS created_by;

-- Remove updatedBy column from site_content
ALTER TABLE site_content DROP COLUMN IF EXISTS updated_by;

-- Remove createdBy column from announcements
ALTER TABLE announcements DROP COLUMN IF EXISTS created_by;

-- Remove createdBy column from template_variable_categories
ALTER TABLE template_variable_categories DROP COLUMN IF EXISTS created_by;