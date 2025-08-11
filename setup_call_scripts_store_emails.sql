-- BFL Customer Service Helper - Call Scripts and Store Emails Setup
-- Run this script in your Supabase SQL editor to create the missing tables
-- This is a simplified version that works with the existing database structure

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create call_scripts table (simplified structure that matches existing patterns)
CREATE TABLE IF NOT EXISTS public.call_scripts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT, -- Using string instead of foreign key to match existing pattern
    genre TEXT, -- Using string instead of foreign key to match existing pattern
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    supabase_id UUID,
    last_synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create store_emails table (simplified structure)
CREATE TABLE IF NOT EXISTS public.store_emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_call_scripts_category ON public.call_scripts(category);
CREATE INDEX IF NOT EXISTS idx_call_scripts_genre ON public.call_scripts(genre);
CREATE INDEX IF NOT EXISTS idx_call_scripts_active ON public.call_scripts(is_active);
CREATE INDEX IF NOT EXISTS idx_call_scripts_order ON public.call_scripts(order_index);

CREATE INDEX IF NOT EXISTS idx_store_emails_name ON public.store_emails(store_name);
CREATE INDEX IF NOT EXISTS idx_store_emails_active ON public.store_emails(is_active);

-- Insert sample call scripts data
INSERT INTO public.call_scripts (name, content, category, genre, order_index, is_active) VALUES
('Welcome Greeting', 'Hello {customer_name}, thank you for contacting Brands For Less. How may I assist you today?', 'WELCOME GREETINGS 👋', 'greeting', 0, true),
('Complaint Handling', 'I understand your concern about {issue}. Let me check your order {order_id} and see how we can resolve this for you.', 'ITEM COMPLAINT 🚨', 'complaint', 1, true),
('Order Status Inquiry', 'Thank you for contacting us about your order {order_id}. Let me check the current status for you.', 'ORDER INQUIRY 📦', 'order-inquiry', 2, true),
('Return Request', 'I understand you would like to return {item}. Let me help you with the return process for order {order_id}.', 'RETURN OPTIONS 🔄📋', 'return-request', 3, true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample store emails data
INSERT INTO public.store_emails (store_name, store_email, store_phone, is_active) VALUES
('Dubai Mall Store', 'dubaimall@brandsforless.com', '+971-4-325-2525', true),
('Mall of the Emirates Store', 'moe@brandsforless.com', '+971-4-341-4141', true),
('Abu Dhabi Mall Store', 'abudhabi@brandsforless.com', '+971-2-645-5555', true),
('Sharjah City Centre Store', 'sharjah@brandsforless.com', '+971-6-531-9999', true),
('Al Ain Mall Store', 'alain@brandsforless.com', '+971-3-766-8888', true)
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security (RLS) if needed
ALTER TABLE public.call_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_emails ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON public.call_scripts;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.call_scripts;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.call_scripts;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.call_scripts;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.store_emails;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.store_emails;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.store_emails;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.store_emails;

-- Create RLS policies (allow all operations for authenticated users)
CREATE POLICY "Enable read access for all users" ON public.call_scripts
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON public.call_scripts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users only" ON public.call_scripts
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users only" ON public.call_scripts
    FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON public.store_emails
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON public.store_emails
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users only" ON public.store_emails
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users only" ON public.store_emails
    FOR DELETE USING (true);

-- Create update triggers to automatically update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_call_scripts_updated_at ON public.call_scripts;
DROP TRIGGER IF EXISTS update_store_emails_updated_at ON public.store_emails;

CREATE TRIGGER update_call_scripts_updated_at BEFORE UPDATE ON public.call_scripts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_store_emails_updated_at BEFORE UPDATE ON public.store_emails
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Display success message
DO $$
BEGIN
    RAISE NOTICE 'Call scripts and store emails tables created successfully!';
    RAISE NOTICE 'Sample data has been inserted.';
    RAISE NOTICE 'You can now use the Call Scripts and Store Emails functionality.';
END $$;