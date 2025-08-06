-- SQL script to set up agent-related template variables
-- This script ensures that the templates can use agent name variables correctly

-- First, create the agent variables category if it doesn't exist
INSERT INTO template_variable_categories (id, name, description, color, is_active, order_index, created_at, updated_at)
VALUES (
  gen_random_uuid(), 
  'Agent Info', 
  'Variables related to agent information and personalization', 
  '#8B5CF6',
  true, 
  1,
  NOW(),
  NOW()
) ON CONFLICT (name) DO NOTHING;

-- Get the category ID for agent info
WITH agent_category AS (
  SELECT id FROM template_variable_categories WHERE name = 'Agent Info' LIMIT 1
)
-- Insert agent-related template variables
INSERT INTO template_variables (id, category_id, name, description, example_value, is_active, order_index, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  agent_category.id,
  variable_name,
  variable_description,
  example_value,
  true,
  order_index,
  NOW(),
  NOW()
FROM agent_category,
VALUES 
  ('agentfirstname', 'Agent first name in English', 'John', 1),
  ('agent_name', 'Agent full name (first + last) in English', 'John Smith', 2),
  ('agentarabicfirstname', 'Agent first name in Arabic', 'جون', 3),
  ('agentarabiclastname', 'Agent last name in Arabic', 'سميث', 4),
  ('agentfullname', 'Agent full name (first + last) in English', 'John Smith', 5),
  ('agentarabicfullname', 'Agent full name in Arabic', 'جون سميث', 6)
AS v(variable_name, variable_description, example_value, order_index)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  example_value = EXCLUDED.example_value,
  updated_at = NOW();

-- Update existing users to ensure they are not first-time users if they have names
UPDATE users 
SET is_first_time_user = false, updated_at = NOW()
WHERE first_name IS NOT NULL 
  AND last_name IS NOT NULL 
  AND arabic_first_name IS NOT NULL 
  AND arabic_last_name IS NOT NULL
  AND is_first_time_user = true;

-- Create indexes for better performance on user lookups
CREATE INDEX IF NOT EXISTS idx_users_first_time ON users(is_first_time_user) WHERE is_first_time_user = true;
CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, status);
CREATE INDEX IF NOT EXISTS idx_users_names ON users(first_name, last_name, arabic_first_name, arabic_last_name);

COMMIT;