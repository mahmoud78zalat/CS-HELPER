-- Complete SQL script for Supabase table creation and setup
-- Run this in your Supabase SQL Editor

-- Create the live_reply_template_groups table
CREATE TABLE IF NOT EXISTS live_reply_template_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for ordering
CREATE INDEX IF NOT EXISTS idx_live_reply_template_groups_order ON live_reply_template_groups(order_index);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS update_live_reply_template_groups_updated_at ON live_reply_template_groups;
CREATE TRIGGER update_live_reply_template_groups_updated_at 
  BEFORE UPDATE ON live_reply_template_groups 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial sample groups
INSERT INTO live_reply_template_groups (name, description, color, order_index) VALUES
  ('General', 'General purpose templates for common inquiries', '#3b82f6', 1),
  ('Support', 'Customer support and technical help templates', '#10b981', 2),
  ('Sales', 'Sales inquiries and product information templates', '#f59e0b', 3),
  ('Orders', 'Order status, shipping, and delivery templates', '#ef4444', 4),
  ('Returns', 'Return policy and refund process templates', '#8b5cf6', 5)
ON CONFLICT (name) DO NOTHING;

-- Update existing live_reply_templates table to include group_id if it doesn't exist
ALTER TABLE live_reply_templates 
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES live_reply_template_groups(id) ON DELETE SET NULL;

-- Create index for group relationships
CREATE INDEX IF NOT EXISTS idx_live_reply_templates_group_id ON live_reply_templates(group_id);

-- Update any existing templates without group_id to use the General group
UPDATE live_reply_templates 
SET group_id = (SELECT id FROM live_reply_template_groups WHERE name = 'General' LIMIT 1)
WHERE group_id IS NULL;

-- Verify the setup
SELECT 'Groups created successfully' as status, count(*) as group_count 
FROM live_reply_template_groups;

SELECT 'Templates updated successfully' as status, count(*) as template_count 
FROM live_reply_templates WHERE group_id IS NOT NULL;