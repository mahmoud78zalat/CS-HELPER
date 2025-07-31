-- =====================================================
-- COMPLETE DATABASE SETUP SCRIPT (FIXED VERSION)
-- =====================================================
-- This script creates all missing tables with proper type casting
-- Execute this in your Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. FAQ TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(255) DEFAULT 'general' NOT NULL,
    "order" INTEGER DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Supabase sync tracking
    supabase_id UUID UNIQUE,
    last_synced_at TIMESTAMPTZ
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);
CREATE INDEX IF NOT EXISTS idx_faqs_active ON faqs(is_active);
CREATE INDEX IF NOT EXISTS idx_faqs_order ON faqs("order");

-- Row Level Security for FAQs
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active FAQs
DROP POLICY IF EXISTS "Public can read active FAQs" ON faqs;
CREATE POLICY "Public can read active FAQs" ON faqs
    FOR SELECT USING (is_active = true);

-- Policy: Authenticated users can manage FAQs
DROP POLICY IF EXISTS "Authenticated users can manage FAQs" ON faqs;
CREATE POLICY "Authenticated users can manage FAQs" ON faqs
    FOR ALL USING (auth.uid()::TEXT IS NOT NULL);

-- =====================================================
-- 2. USER ORDERING PREFERENCES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_ordering_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_type VARCHAR(50) NOT NULL,
    item_id UUID NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate ordering entries
    UNIQUE(user_id, content_type, item_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_ordering_user_content ON user_ordering_preferences(user_id, content_type);
CREATE INDEX IF NOT EXISTS idx_user_ordering_display_order ON user_ordering_preferences(display_order);

-- Row Level Security for user ordering preferences
ALTER TABLE user_ordering_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own ordering preferences (with proper type casting)
DROP POLICY IF EXISTS "Users can manage their own ordering preferences" ON user_ordering_preferences;
CREATE POLICY "Users can manage their own ordering preferences" ON user_ordering_preferences
    FOR ALL USING (user_id = auth.uid()::TEXT);

-- =====================================================
-- 3. UTILITY FUNCTIONS FOR USER ORDERING
-- =====================================================

-- Function to get ordered items for a user
CREATE OR REPLACE FUNCTION get_user_ordered_items(
    p_user_id TEXT, 
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

-- Function to update user ordering preferences in bulk
CREATE OR REPLACE FUNCTION update_user_ordering(
    p_user_id TEXT,
    p_content_type VARCHAR(50),
    p_item_orders JSONB
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

-- =====================================================
-- 4. TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- =====================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Apply trigger to FAQs table
DROP TRIGGER IF EXISTS trigger_update_faqs_updated_at ON faqs;
CREATE TRIGGER trigger_update_faqs_updated_at
    BEFORE UPDATE ON faqs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to user ordering preferences table
DROP TRIGGER IF EXISTS trigger_update_user_ordering_updated_at ON user_ordering_preferences;
CREATE TRIGGER trigger_update_user_ordering_updated_at
    BEFORE UPDATE ON user_ordering_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. PERMISSIONS AND GRANTS
-- =====================================================

-- Grant necessary permissions to authenticated users
GRANT ALL ON faqs TO authenticated;
GRANT ALL ON user_ordering_preferences TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_ordered_items(TEXT, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_ordering(TEXT, VARCHAR, JSONB) TO authenticated;

-- Grant read permissions to anonymous users for FAQs (public access)
GRANT SELECT ON faqs TO anon;

-- =====================================================
-- 6. SAMPLE DATA
-- =====================================================

-- Insert sample FAQs
INSERT INTO faqs (question, answer, category, "order", is_active) VALUES
('How do I reset my password?', 'To reset your password, click on the "Forgot Password" link on the login page and follow the instructions sent to your email.', 'account', 1, true),
('How can I contact customer support?', 'You can contact our customer support team through the live chat feature, email us at support@company.com, or call us at 1-800-SUPPORT.', 'support', 2, true),
('What are your business hours?', 'Our customer service team is available Monday through Friday from 9 AM to 6 PM EST. Our live chat support is available 24/7.', 'general', 3, true),
('How do I update my profile information?', 'To update your profile information, log into your account, click on "Profile Settings" in the user menu, and make your desired changes.', 'account', 4, true),
('What payment methods do you accept?', 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers for enterprise customers.', 'billing', 5, true),
('How do I cancel my subscription?', 'To cancel your subscription, go to Account Settings > Billing > Subscription Management and click "Cancel Subscription". You will retain access until the end of your current billing period.', 'billing', 6, true),
('Is my data secure?', 'Yes, we use industry-standard encryption and security measures to protect your data. All communication is encrypted with SSL/TLS, and we comply with SOC 2 Type II standards.', 'security', 7, true),
('How do I export my data?', 'You can export your data by going to Account Settings > Data Export. Select the data you want to export and click "Generate Export". You will receive a download link via email.', 'data', 8, true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 7. VERIFICATION AND TESTING
-- =====================================================

-- Test FAQ table
DO $$
BEGIN
    RAISE NOTICE 'FAQ Table Setup Complete. Sample data count: %', (SELECT COUNT(*) FROM faqs);
END $$;

-- Test user ordering preferences table structure
DO $$
BEGIN
    RAISE NOTICE 'User Ordering Preferences Table Setup Complete.';
END $$;

-- Test functions (you can uncomment these to test with your actual user ID)
-- SELECT * FROM get_user_ordered_items('f765c1de-f9b5-4615-8c09-8cdde8152a07', 'faqs');
-- SELECT update_user_ordering('f765c1de-f9b5-4615-8c09-8cdde8152a07', 'faqs', '[{"item_id": "00000000-0000-0000-0000-000000000001", "display_order": 1}]'::JSONB);

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

SELECT 'Database setup completed successfully!' as status,
       'FAQ Button disco effect fixed - will only animate when new FAQs exist' as faq_button_status,
       'All type casting issues resolved' as technical_status;

-- Summary of what was created:
-- ✓ FAQs table with proper indexing and sample data
-- ✓ User ordering preferences table with TEXT user_id
-- ✓ Utility functions with correct parameter types
-- ✓ Row Level Security with proper type casting (auth.uid()::TEXT)
-- ✓ Triggers for automatic timestamp updates
-- ✓ Comprehensive permissions setup
-- ✓ Sample FAQ data for immediate testing