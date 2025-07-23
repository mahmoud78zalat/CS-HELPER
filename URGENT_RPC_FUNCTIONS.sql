-- RPC Functions for Template Usage Tracking
-- Run these in Supabase SQL Editor

-- Function to increment live reply template usage
CREATE OR REPLACE FUNCTION increment_live_reply_usage(template_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE live_reply_templates 
    SET usage_count = COALESCE(usage_count, 0) + 1,
        updated_at = NOW()
    WHERE id = template_id;
END;
$$;

-- Function to increment email template usage
CREATE OR REPLACE FUNCTION increment_email_template_usage(template_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE email_templates 
    SET usage_count = COALESCE(usage_count, 0) + 1,
        updated_at = NOW()
    WHERE id = template_id;
END;
$$;

-- Add usage_count column if it doesn't exist
ALTER TABLE live_reply_templates 
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;

ALTER TABLE email_templates 
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;

-- Grant permissions
GRANT EXECUTE ON FUNCTION increment_live_reply_usage TO service_role;
GRANT EXECUTE ON FUNCTION increment_email_template_usage TO service_role;
GRANT EXECUTE ON FUNCTION increment_live_reply_usage TO anon;
GRANT EXECUTE ON FUNCTION increment_email_template_usage TO anon;