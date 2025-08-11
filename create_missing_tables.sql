-- Create Missing Database Tables for Call Scripts and Store Emails
-- Execute this manually in your Supabase SQL editor

-- Create call_scripts table
CREATE TABLE IF NOT EXISTS public.call_scripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    category_id UUID,
    genre_id UUID,
    created_by UUID,
    is_active BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    supabase_id UUID,
    last_synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create store_emails table
CREATE TABLE IF NOT EXISTS public.store_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_name TEXT NOT NULL,
    store_email TEXT NOT NULL,
    store_phone TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    supabase_id UUID,
    last_synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_call_scripts_active ON call_scripts(is_active);
CREATE INDEX IF NOT EXISTS idx_call_scripts_category ON call_scripts(category_id);
CREATE INDEX IF NOT EXISTS idx_call_scripts_genre ON call_scripts(genre_id);
CREATE INDEX IF NOT EXISTS idx_call_scripts_created_by ON call_scripts(created_by);

CREATE INDEX IF NOT EXISTS idx_store_emails_active ON store_emails(is_active);
CREATE INDEX IF NOT EXISTS idx_store_emails_created_by ON store_emails(created_by);

-- Enable Row Level Security (RLS)
ALTER TABLE call_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_emails ENABLE ROW LEVEL SECURITY;

-- Create RLS policies to allow authenticated users to access data
CREATE POLICY "Allow authenticated users to view call scripts" ON call_scripts
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert call scripts" ON call_scripts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update call scripts" ON call_scripts
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete call scripts" ON call_scripts
    FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to view store emails" ON store_emails
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert store emails" ON store_emails
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update store emails" ON store_emails
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete store emails" ON store_emails
    FOR DELETE USING (auth.role() = 'authenticated');

-- Insert test data to verify tables work
INSERT INTO call_scripts (name, content, category_id, genre_id, is_active) VALUES 
('Test Script 1', 'This is a test call script content', NULL, NULL, true);

INSERT INTO store_emails (store_name, store_email, store_phone, is_active) VALUES 
('Test Store', 'test@example.com', '+1234567890', true);

-- Verify the tables were created successfully
SELECT 'call_scripts table created' as status, count(*) as records FROM call_scripts;
SELECT 'store_emails table created' as status, count(*) as records FROM store_emails;