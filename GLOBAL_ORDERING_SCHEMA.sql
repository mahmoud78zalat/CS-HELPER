-- =====================================================
-- GLOBAL ORDERING TABLE SCHEMA
-- =====================================================
-- This creates the global ordering table for universal drag-and-drop ordering

-- Create global ordering preferences table
CREATE TABLE IF NOT EXISTS global_ordering_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type VARCHAR(255) NOT NULL,  -- 'live_reply_templates', 'email_templates', 'faqs', 'variables'
    item_id UUID NOT NULL,               -- ID of the item being ordered
    display_order INTEGER NOT NULL,      -- Order position (0, 1, 2, etc.)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Ensure unique ordering per content type
    UNIQUE(content_type, item_id),
    UNIQUE(content_type, display_order)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_global_ordering_content_type ON global_ordering_preferences(content_type);
CREATE INDEX IF NOT EXISTS idx_global_ordering_display_order ON global_ordering_preferences(content_type, display_order);

-- Enable Row Level Security
ALTER TABLE global_ordering_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can manage global ordering
DROP POLICY IF EXISTS "Authenticated users can manage global ordering" ON global_ordering_preferences;
CREATE POLICY "Authenticated users can manage global ordering" ON global_ordering_preferences
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Sample data for testing (optional)
-- INSERT INTO global_ordering_preferences (content_type, item_id, display_order) VALUES
-- ('live_reply_templates', 'sample-id-1', 0),
-- ('live_reply_templates', 'sample-id-2', 1),
-- ('email_templates', 'sample-id-3', 0),
-- ('faqs', 'sample-id-4', 0);

-- Function to automatically reorder when items are deleted
CREATE OR REPLACE FUNCTION reorder_global_preferences()
RETURNS TRIGGER AS $$
BEGIN
    -- Reorder remaining items to fill gaps
    UPDATE global_ordering_preferences 
    SET display_order = subq.new_order - 1,
        updated_at = NOW()
    FROM (
        SELECT item_id, 
               ROW_NUMBER() OVER (ORDER BY display_order) as new_order
        FROM global_ordering_preferences 
        WHERE content_type = OLD.content_type
    ) AS subq
    WHERE global_ordering_preferences.item_id = subq.item_id
      AND global_ordering_preferences.content_type = OLD.content_type;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic reordering
DROP TRIGGER IF EXISTS trigger_reorder_global_preferences ON global_ordering_preferences;
CREATE TRIGGER trigger_reorder_global_preferences
    AFTER DELETE ON global_ordering_preferences
    FOR EACH ROW
    EXECUTE FUNCTION reorder_global_preferences();

-- Grant appropriate permissions
GRANT ALL ON global_ordering_preferences TO authenticated;
GRANT ALL ON global_ordering_preferences TO service_role;