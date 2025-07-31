-- =====================================================
-- COMPLETE DATABASE SETUP SCRIPT FOR CUSTOMER SERVICE PLATFORM
-- =====================================================
-- This script creates all missing tables required for the application.
-- Execute this in your Supabase SQL Editor or PostgreSQL database.

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. FAQ TABLE
-- =====================================================
-- Table for frequently asked questions
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

-- Row Level Security for FAQs (Optional - allows public read access)
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active FAQs, only authenticated users can manage
DROP POLICY IF EXISTS "Public can read active FAQs" ON faqs;
CREATE POLICY "Public can read active FAQs" ON faqs
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Authenticated users can manage FAQs" ON faqs;
CREATE POLICY "Authenticated users can manage FAQs" ON faqs
    FOR ALL USING (auth.uid() IS NOT NULL);

-- =====================================================
-- 2. USER ORDERING PREFERENCES TABLE
-- =====================================================
-- Table for storing user-specific drag-and-drop ordering preferences
CREATE TABLE IF NOT EXISTS user_ordering_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_type VARCHAR(50) NOT NULL, -- 'live_reply_templates', 'email_templates', 'faqs', etc.
    item_id UUID NOT NULL, -- ID of the item being ordered
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

-- Policy: Users can only access their own ordering preferences
DROP POLICY IF EXISTS "Users can manage their own ordering preferences" ON user_ordering_preferences;
CREATE POLICY "Users can manage their own ordering preferences" ON user_ordering_preferences
    FOR ALL USING (user_id = auth.uid());

-- =====================================================
-- 3. UTILITY FUNCTIONS FOR USER ORDERING
-- =====================================================

-- Function to get ordered items for a user
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

-- Function to update user ordering preferences in bulk
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
GRANT EXECUTE ON FUNCTION get_user_ordered_items(UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_ordering(UUID, VARCHAR, JSONB) TO authenticated;

-- Grant read permissions to anonymous users for FAQs (public access)
GRANT SELECT ON faqs TO anon;

-- =====================================================
-- 6. SAMPLE DATA (OPTIONAL - REMOVE IF NOT NEEDED)
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
-- 7. VERIFICATION QUERIES
-- =====================================================

-- Verify tables were created successfully
-- Run these queries to confirm everything is working:

-- Check if FAQs table exists and has data
-- SELECT COUNT(*) as faq_count FROM faqs;
-- SELECT * FROM faqs WHERE is_active = true ORDER BY "order";

-- Check if user ordering preferences table exists
-- SELECT COUNT(*) as ordering_count FROM user_ordering_preferences;

-- Test the utility functions (replace with actual user ID)
-- SELECT * FROM get_user_ordered_items('your-user-id-here'::UUID, 'faqs');

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

-- The database setup is now complete!
-- 
-- Tables created:
-- ✓ faqs - For managing frequently asked questions
-- ✓ user_ordering_preferences - For drag-and-drop ordering
-- 
-- Functions created:
-- ✓ get_user_ordered_items() - Retrieve user's item ordering
-- ✓ update_user_ordering() - Update user's ordering preferences
-- 
-- Security:
-- ✓ Row Level Security enabled
-- ✓ Proper policies for user access control
-- ✓ Public read access for active FAQs
-- 
-- Features:
-- ✓ Automatic timestamp updates
-- ✓ Bulk ordering updates
-- ✓ Sample FAQ data included
-- 
-- Your FAQ management system and drag-and-drop ordering are now ready to use!

SELECT 'Database setup completed successfully!' as status;