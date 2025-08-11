-- Supabase SQL Script for Call Scripts and Store Emails Features
-- This script creates the necessary tables and relationships for the call scripts and store emails functionality

-- ========================================
-- TEMPLATE CATEGORIES AND GENRES (Updated Structure)
-- ========================================

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS call_scripts CASCADE;
DROP TABLE IF EXISTS store_emails CASCADE;

-- Ensure template_categories table exists
CREATE TABLE IF NOT EXISTS template_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR UNIQUE NOT NULL,
    description TEXT,
    color VARCHAR DEFAULT '#3b82f6' NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    order_index INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Ensure template_genres table exists
CREATE TABLE IF NOT EXISTS template_genres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    description TEXT,
    category_id UUID REFERENCES template_categories(id) NOT NULL,
    color VARCHAR DEFAULT '#10b981' NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    order_index INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ========================================
-- CALL SCRIPTS TABLE
-- ========================================

-- Create call_scripts table connected to categories and genres
CREATE TABLE call_scripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    content TEXT NOT NULL,
    category_id UUID REFERENCES template_categories(id),
    genre_id UUID REFERENCES template_genres(id),
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    -- Supabase sync tracking
    supabase_id UUID UNIQUE,
    last_synced_at TIMESTAMP
);

-- ========================================
-- STORE EMAILS TABLE
-- ========================================

-- Create store_emails table for store contact information
CREATE TABLE store_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_name VARCHAR NOT NULL,
    store_email VARCHAR NOT NULL,
    store_phone VARCHAR NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    -- Supabase sync tracking
    supabase_id UUID UNIQUE,
    last_synced_at TIMESTAMP
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Call Scripts indexes
CREATE INDEX IF NOT EXISTS idx_call_scripts_category_id ON call_scripts(category_id);
CREATE INDEX IF NOT EXISTS idx_call_scripts_genre_id ON call_scripts(genre_id);
CREATE INDEX IF NOT EXISTS idx_call_scripts_created_by ON call_scripts(created_by);
CREATE INDEX IF NOT EXISTS idx_call_scripts_is_active ON call_scripts(is_active);
CREATE INDEX IF NOT EXISTS idx_call_scripts_supabase_id ON call_scripts(supabase_id);

-- Store Emails indexes
CREATE INDEX IF NOT EXISTS idx_store_emails_created_by ON store_emails(created_by);
CREATE INDEX IF NOT EXISTS idx_store_emails_is_active ON store_emails(is_active);
CREATE INDEX IF NOT EXISTS idx_store_emails_supabase_id ON store_emails(supabase_id);

-- Template Categories and Genres indexes
CREATE INDEX IF NOT EXISTS idx_template_categories_is_active ON template_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_template_categories_order_index ON template_categories(order_index);
CREATE INDEX IF NOT EXISTS idx_template_genres_category_id ON template_genres(category_id);
CREATE INDEX IF NOT EXISTS idx_template_genres_is_active ON template_genres(is_active);
CREATE INDEX IF NOT EXISTS idx_template_genres_order_index ON template_genres(order_index);

-- ========================================
-- INSERT SAMPLE DATA (Based on existing categories/genres)
-- ========================================

-- Insert sample categories if they don't exist
INSERT INTO template_categories (name, description, color, order_index) VALUES 
    ('Customer Service', 'General customer service responses', '#3b82f6', 0),
    ('Sales Support', 'Sales and product inquiries', '#10b981', 1),
    ('Technical Support', 'Technical assistance and troubleshooting', '#f59e0b', 2),
    ('Complaints', 'Handling customer complaints', '#ef4444', 3),
    ('Order Management', 'Order processing and tracking', '#8b5cf6', 4)
ON CONFLICT (name) DO NOTHING;

-- Insert sample genres if they don't exist
INSERT INTO template_genres (name, description, category_id, color, order_index) VALUES 
    ('Greeting', 'Welcome and initial contact scripts', (SELECT id FROM template_categories WHERE name = 'Customer Service'), '#10b981', 0),
    ('Apology', 'Apology and acknowledgment scripts', (SELECT id FROM template_categories WHERE name = 'Customer Service'), '#f59e0b', 1),
    ('Product Inquiry', 'Product information and details', (SELECT id FROM template_categories WHERE name = 'Sales Support'), '#3b82f6', 0),
    ('Order Status', 'Order tracking and updates', (SELECT id FROM template_categories WHERE name = 'Order Management'), '#8b5cf6', 0),
    ('Complaint Response', 'Handling customer complaints', (SELECT id FROM template_categories WHERE name = 'Complaints'), '#ef4444', 0),
    ('Technical Issue', 'Technical problem resolution', (SELECT id FROM template_categories WHERE name = 'Technical Support'), '#f59e0b', 0)
ON CONFLICT DO NOTHING;

-- Insert sample call scripts
INSERT INTO call_scripts (name, content, category_id, genre_id) VALUES 
    (
        'Welcome Greeting Script',
        'Hello and thank you for calling [Company Name]. My name is [Agent Name] and I''ll be happy to assist you today. How may I help you?',
        (SELECT id FROM template_categories WHERE name = 'Customer Service'),
        (SELECT id FROM template_genres WHERE name = 'Greeting')
    ),
    (
        'Order Status Inquiry',
        'I understand you''d like to check on your order status. Can you please provide me with your order number? I''ll be happy to look that up for you right away.',
        (SELECT id FROM template_categories WHERE name = 'Order Management'),
        (SELECT id FROM template_genres WHERE name = 'Order Status')
    ),
    (
        'Product Information Request',
        'I''d be happy to provide you with information about [Product Name]. Let me pull up the details for you. This product features [Key Features] and is available in [Available Options].',
        (SELECT id FROM template_categories WHERE name = 'Sales Support'),
        (SELECT id FROM template_genres WHERE name = 'Product Inquiry')
    ),
    (
        'Service Apology Script',
        'I sincerely apologize for the inconvenience you''ve experienced. I understand how frustrating this must be, and I''m here to make this right for you. Let me see what I can do to resolve this issue immediately.',
        (SELECT id FROM template_categories WHERE name = 'Customer Service'),
        (SELECT id FROM template_genres WHERE name = 'Apology')
    ),
    (
        'Technical Support Opening',
        'Thank you for contacting our technical support team. I''m here to help you resolve any technical issues you may be experiencing. Can you describe the problem you''re encountering?',
        (SELECT id FROM template_categories WHERE name = 'Technical Support'),
        (SELECT id FROM template_genres WHERE name = 'Technical Issue')
    )
ON CONFLICT DO NOTHING;

-- Insert sample store emails
INSERT INTO store_emails (store_name, store_email, store_phone) VALUES 
    ('Main Customer Service', 'support@company.com', '+1-800-123-4567'),
    ('Sales Department', 'sales@company.com', '+1-800-123-4568'),
    ('Technical Support', 'tech@company.com', '+1-800-123-4569'),
    ('Billing Department', 'billing@company.com', '+1-800-123-4570'),
    ('Returns & Exchanges', 'returns@company.com', '+1-800-123-4571')
ON CONFLICT DO NOTHING;

-- ========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================

-- Enable RLS on tables
ALTER TABLE call_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_emails ENABLE ROW LEVEL SECURITY;

-- Call Scripts policies
CREATE POLICY "Users can view all call scripts" ON call_scripts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert call scripts" ON call_scripts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own call scripts" ON call_scripts FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete own call scripts" ON call_scripts FOR DELETE USING (auth.uid() = created_by);

-- Store Emails policies
CREATE POLICY "Users can view all store emails" ON store_emails FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert store emails" ON store_emails FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own store emails" ON store_emails FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete own store emails" ON store_emails FOR DELETE USING (auth.uid() = created_by);

-- ========================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- ========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables
CREATE TRIGGER update_call_scripts_updated_at BEFORE UPDATE ON call_scripts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_store_emails_updated_at BEFORE UPDATE ON store_emails FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_template_categories_updated_at BEFORE UPDATE ON template_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_template_genres_updated_at BEFORE UPDATE ON template_genres FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- COMPLETION MESSAGE
-- ========================================

SELECT 'Call Scripts and Store Emails tables have been successfully created with proper relationships to categories and genres!' as message;