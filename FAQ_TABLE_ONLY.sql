-- =====================================================
-- FAQ TABLE SETUP (SIMPLE VERSION FOR TESTING)
-- =====================================================
-- Execute this first to test the FAQ functionality

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create FAQ table
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

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);
CREATE INDEX IF NOT EXISTS idx_faqs_active ON faqs(is_active);
CREATE INDEX IF NOT EXISTS idx_faqs_order ON faqs("order");

-- Enable Row Level Security
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

-- Allow public to read active FAQs
DROP POLICY IF EXISTS "Public can read active FAQs" ON faqs;
CREATE POLICY "Public can read active FAQs" ON faqs
    FOR SELECT USING (is_active = true);

-- Allow authenticated users to manage FAQs
DROP POLICY IF EXISTS "Authenticated users can manage FAQs" ON faqs;
CREATE POLICY "Authenticated users can manage FAQs" ON faqs
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Grant permissions
GRANT ALL ON faqs TO authenticated;
GRANT SELECT ON faqs TO anon;

-- Insert sample FAQ data
INSERT INTO faqs (question, answer, category, "order", is_active) VALUES
('How do I reset my password?', 'To reset your password, click on the "Forgot Password" link on the login page and follow the instructions sent to your email.', 'account', 1, true),
('How can I contact customer support?', 'You can contact our customer support team through the live chat feature, email us at support@company.com, or call us at 1-800-SUPPORT.', 'support', 2, true),
('What are your business hours?', 'Our customer service team is available Monday through Friday from 9 AM to 6 PM EST. Our live chat support is available 24/7.', 'general', 3, true),
('How do I update my profile information?', 'To update your profile information, log into your account, click on "Profile Settings" in the user menu, and make your desired changes.', 'account', 4, true),
('What payment methods do you accept?', 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers for enterprise customers.', 'billing', 5, true)
ON CONFLICT DO NOTHING;

-- Verify the table was created successfully
SELECT 'FAQ table created successfully! Sample data:' as status;
SELECT question, category, is_active FROM faqs ORDER BY "order" LIMIT 3;