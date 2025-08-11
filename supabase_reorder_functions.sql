-- Supabase SQL Script for Call Scripts and Store Emails Reordering Functions
-- Run this script in your Supabase SQL editor to enable global reordering functionality

-- Call Scripts Reorder Function
CREATE OR REPLACE FUNCTION reorder_call_scripts(script_updates jsonb[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  script_update jsonb;
BEGIN
  -- Loop through each script update
  FOREACH script_update IN ARRAY script_updates
  LOOP
    -- Update using string comparison to avoid type issues
    UPDATE call_scripts 
    SET order_index = (script_update->>'orderIndex')::integer,
        updated_at = NOW()
    WHERE id::text = script_update->>'id';
  END LOOP;
END;
$$;

-- Store Emails Reorder Function  
CREATE OR REPLACE FUNCTION reorder_store_emails(store_updates jsonb[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  store_update jsonb;
BEGIN
  -- Loop through each store update
  FOREACH store_update IN ARRAY store_updates
  LOOP
    -- Update using string comparison to avoid type issues
    UPDATE store_emails 
    SET order_index = (store_update->>'orderIndex')::integer,
        updated_at = NOW()
    WHERE id::text = store_update->>'id';
  END LOOP;
END;
$$;

-- Grant necessary permissions (adjust according to your RLS policies)
GRANT EXECUTE ON FUNCTION reorder_call_scripts TO authenticated;
GRANT EXECUTE ON FUNCTION reorder_store_emails TO authenticated;

-- Optional: Add RLS policies if not already present
-- Enable RLS on call_scripts (if not enabled)
ALTER TABLE call_scripts ENABLE ROW LEVEL SECURITY;

-- Enable RLS on store_emails (if not enabled)  
ALTER TABLE store_emails ENABLE ROW LEVEL SECURITY;

-- Create policies for call_scripts (modify based on your requirements)
DROP POLICY IF EXISTS "Allow admin users to manage call scripts" ON call_scripts;
CREATE POLICY "Allow admin users to manage call scripts"
  ON call_scripts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Create policies for store_emails (modify based on your requirements)
DROP POLICY IF EXISTS "Allow admin users to manage store emails" ON store_emails;
CREATE POLICY "Allow admin users to manage store emails"
  ON store_emails FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Allow all authenticated users to read call scripts and store emails
DROP POLICY IF EXISTS "Allow authenticated users to read call scripts" ON call_scripts;
CREATE POLICY "Allow authenticated users to read call scripts"
  ON call_scripts FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to read store emails" ON store_emails;  
CREATE POLICY "Allow authenticated users to read store emails"
  ON store_emails FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes for better performance (if not exist)
CREATE INDEX IF NOT EXISTS idx_call_scripts_order_index ON call_scripts(order_index);
CREATE INDEX IF NOT EXISTS idx_store_emails_order_index ON store_emails(order_index);
CREATE INDEX IF NOT EXISTS idx_call_scripts_active ON call_scripts(is_active);
CREATE INDEX IF NOT EXISTS idx_store_emails_active ON store_emails(is_active);