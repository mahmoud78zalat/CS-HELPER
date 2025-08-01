-- SQL Script to Fix Database Schema for Template Reordering
-- Execute this in your Supabase SQL Editor

-- Add missing group_order column to live_reply_templates table
ALTER TABLE live_reply_templates 
ADD COLUMN IF NOT EXISTS group_order INTEGER DEFAULT 0;

-- Update existing records to have proper group_order values
UPDATE live_reply_templates 
SET group_order = 0 
WHERE group_order IS NULL;

-- Add index for better performance on ordering queries
CREATE INDEX IF NOT EXISTS idx_live_reply_templates_group_order 
ON live_reply_templates(group_order);

CREATE INDEX IF NOT EXISTS idx_live_reply_templates_stage_order 
ON live_reply_templates(stage_order);

-- Ensure all template tables have proper ordering columns for unified system
-- (Check and add to other template types if needed)

-- For email_templates table (if it exists and needs group_order)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_templates') THEN
        ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS group_order INTEGER DEFAULT 0;
        ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS stage_order INTEGER DEFAULT 0;
        UPDATE email_templates SET group_order = 0 WHERE group_order IS NULL;
        UPDATE email_templates SET stage_order = 0 WHERE stage_order IS NULL;
        CREATE INDEX IF NOT EXISTS idx_email_templates_group_order ON email_templates(group_order);
        CREATE INDEX IF NOT EXISTS idx_email_templates_stage_order ON email_templates(stage_order);
    END IF;
END
$$;

-- For faq_templates table (if it exists and needs ordering columns)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'faq_templates') THEN
        ALTER TABLE faq_templates ADD COLUMN IF NOT EXISTS group_order INTEGER DEFAULT 0;
        ALTER TABLE faq_templates ADD COLUMN IF NOT EXISTS stage_order INTEGER DEFAULT 0;
        UPDATE faq_templates SET group_order = 0 WHERE group_order IS NULL;
        UPDATE faq_templates SET stage_order = 0 WHERE stage_order IS NULL;
        CREATE INDEX IF NOT EXISTS idx_faq_templates_group_order ON faq_templates(group_order);
        CREATE INDEX IF NOT EXISTS idx_faq_templates_stage_order ON faq_templates(stage_order);
    END IF;
END
$$;