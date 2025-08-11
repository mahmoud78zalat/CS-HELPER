-- Final Working Supabase SQL Script for Call Scripts and Store Emails Reordering Functions
-- This version uses safe text comparison to avoid UUID casting issues

-- Call Scripts Reorder Function
CREATE OR REPLACE FUNCTION reorder_call_scripts(script_updates jsonb[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  script_update jsonb;
  script_id_text text;
  order_idx integer;
BEGIN
  -- Loop through each script update
  FOREACH script_update IN ARRAY script_updates
  LOOP
    -- Extract values safely as text and integer
    script_id_text := script_update->>'id';
    order_idx := (script_update->>'orderIndex')::integer;
    
    -- Update using safe text comparison
    UPDATE call_scripts 
    SET order_index = order_idx,
        updated_at = NOW()
    WHERE id::text = script_id_text;
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
  store_id_text text;
  order_idx integer;
BEGIN
  -- Loop through each store update
  FOREACH store_update IN ARRAY store_updates
  LOOP
    -- Extract values safely as text and integer
    store_id_text := store_update->>'id';
    order_idx := (store_update->>'orderIndex')::integer;
    
    -- Update using safe text comparison
    UPDATE store_emails 
    SET order_index = order_idx,
        updated_at = NOW()
    WHERE id::text = store_id_text;
  END LOOP;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION reorder_call_scripts TO authenticated;
GRANT EXECUTE ON FUNCTION reorder_store_emails TO authenticated;

-- Test the functions (optional - remove these lines after testing)
-- SELECT reorder_call_scripts('[]'::jsonb[]);
-- SELECT reorder_store_emails('[]'::jsonb[]);