-- =====================================================
-- DRAG & DROP ORDERING SYSTEM FOR ADMIN PANEL
-- =====================================================

-- 1. User Ordering Preferences Table
-- Stores user-specific ordering preferences for different content types
CREATE TABLE IF NOT EXISTS user_ordering_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_type VARCHAR(50) NOT NULL, -- 'live_reply_templates', 'email_templates', 'faqs', 'template_variables', etc.
    item_id UUID NOT NULL, -- ID of the item being ordered
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate ordering entries
    UNIQUE(user_id, content_type, item_id)
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_ordering_user_content ON user_ordering_preferences(user_id, content_type);
CREATE INDEX IF NOT EXISTS idx_user_ordering_display_order ON user_ordering_preferences(display_order);

-- 3. Row Level Security (RLS) Policies
ALTER TABLE user_ordering_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own ordering preferences
DROP POLICY IF EXISTS "Users can manage their own ordering preferences" ON user_ordering_preferences;
CREATE POLICY "Users can manage their own ordering preferences" ON user_ordering_preferences
    FOR ALL USING (user_id = auth.uid());

-- 4. Function to get ordered items for a user
CREATE OR REPLACE FUNCTION get_user_ordered_items(
    p_user_id UUID, 
    p_content_type VARCHAR(50)
) 
RETURNS TABLE(
    item_id UUID,
    display_order INTEGER
) 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        uop.item_id,
        uop.display_order
    FROM user_ordering_preferences uop
    WHERE uop.user_id = p_user_id 
      AND uop.content_type = p_content_type
    ORDER BY uop.display_order ASC, uop.created_at ASC;
END;
$$;

-- 5. Function to update user ordering preferences
CREATE OR REPLACE FUNCTION update_user_ordering(
    p_user_id UUID,
    p_content_type VARCHAR(50),
    p_item_orders JSONB -- Format: [{"item_id": "uuid", "display_order": 1}, ...]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    item_record RECORD;
BEGIN
    -- Delete existing ordering preferences for this content type
    DELETE FROM user_ordering_preferences 
    WHERE user_id = p_user_id AND content_type = p_content_type;
    
    -- Insert new ordering preferences
    FOR item_record IN 
        SELECT 
            (value->>'item_id')::UUID as item_id,
            (value->>'display_order')::INTEGER as display_order
        FROM jsonb_array_elements(p_item_orders)
    LOOP
        INSERT INTO user_ordering_preferences (user_id, content_type, item_id, display_order)
        VALUES (p_user_id, p_content_type, item_record.item_id, item_record.display_order)
        ON CONFLICT (user_id, content_type, item_id) 
        DO UPDATE SET 
            display_order = EXCLUDED.display_order,
            updated_at = NOW();
    END LOOP;
    
    RETURN TRUE;
END;
$$;

-- 6. Trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_ordering_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_user_ordering_updated_at ON user_ordering_preferences;
CREATE TRIGGER trigger_update_user_ordering_updated_at
    BEFORE UPDATE ON user_ordering_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_user_ordering_updated_at();

-- 7. Grant necessary permissions
GRANT ALL ON user_ordering_preferences TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_ordered_items(UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_ordering(UUID, VARCHAR, JSONB) TO authenticated;

-- =====================================================
-- SAMPLE QUERIES FOR TESTING
-- =====================================================

-- Insert sample ordering preferences (replace with actual user ID)
-- INSERT INTO user_ordering_preferences (user_id, content_type, item_id, display_order) VALUES
-- ('f765c1de-f9b5-4615-8c09-8cdde8152a07', 'live_reply_templates', 'template-1-uuid', 1),
-- ('f765c1de-f9b5-4615-8c09-8cdde8152a07', 'live_reply_templates', 'template-2-uuid', 2),
-- ('f765c1de-f9b5-4615-8c09-8cdde8152a07', 'email_templates', 'email-template-1-uuid', 1);

-- Get ordered items for a user
-- SELECT * FROM get_user_ordered_items('f765c1de-f9b5-4615-8c09-8cdde8152a07', 'live_reply_templates');

-- Update ordering preferences using JSON
-- SELECT update_user_ordering(
--     'f765c1de-f9b5-4615-8c09-8cdde8152a07'::UUID,
--     'live_reply_templates',
--     '[{"item_id": "template-2-uuid", "display_order": 1}, {"item_id": "template-1-uuid", "display_order": 2}]'::JSONB
-- );

-- =====================================================
-- NOTES FOR IMPLEMENTATION
-- =====================================================

-- 1. Content Types Supported:
--    - 'live_reply_templates' - Live reply templates in admin panel
--    - 'email_templates' - Email templates in admin panel  
--    - 'faqs' - FAQ items in admin panel
--    - 'template_variables' - Template variables in variable manager
--    - 'concerned_teams' - Concerned teams in admin panel
--    - 'template_categories' - Template categories
--    - 'email_categories' - Email categories

-- 2. Frontend Implementation:
--    - Use React DnD or @dnd-kit/sortable for drag and drop
--    - Call API to save new ordering after each drag operation
--    - Load items in user's preferred order on component mount

-- 3. API Endpoints Required:
--    - GET /api/user-ordering/:contentType - Get user's ordering preferences
--    - POST /api/user-ordering/:contentType - Save new ordering preferences

-- 4. Default Behavior:
--    - If no user ordering exists, items display in creation order (created_at)
--    - When user first drags items, create initial ordering entries
--    - Each user maintains their own independent ordering preferences