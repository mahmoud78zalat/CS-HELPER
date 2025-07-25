-- ==========================================
-- DYNAMIC CATEGORIES AND GENRES SYSTEM
-- ==========================================
-- Execute this script in your Supabase SQL Editor to create dynamic category/genre management

-- ==========================================
-- 1. TEMPLATE CATEGORIES - Live Chat Categories
-- ==========================================
CREATE TABLE IF NOT EXISTS public.template_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_by TEXT REFERENCES public.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_template_categories_name ON public.template_categories(name);
CREATE INDEX IF NOT EXISTS idx_template_categories_active ON public.template_categories(is_active);

-- ==========================================
-- 2. EMAIL CATEGORIES - Email Template Categories
-- ==========================================
CREATE TABLE IF NOT EXISTS public.email_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_by TEXT REFERENCES public.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_categories_name ON public.email_categories(name);
CREATE INDEX IF NOT EXISTS idx_email_categories_active ON public.email_categories(is_active);

-- ==========================================
-- 3. GENRES - Shared between Live Chat and Email Templates
-- ==========================================
CREATE TABLE IF NOT EXISTS public.template_genres (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_by TEXT REFERENCES public.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_template_genres_name ON public.template_genres(name);
CREATE INDEX IF NOT EXISTS idx_template_genres_active ON public.template_genres(is_active);

-- ==========================================
-- 4. CONCERNED TEAMS - For Email Templates
-- ==========================================
CREATE TABLE IF NOT EXISTS public.concerned_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_by TEXT REFERENCES public.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_concerned_teams_name ON public.concerned_teams(name);
CREATE INDEX IF NOT EXISTS idx_concerned_teams_active ON public.concerned_teams(is_active);

-- ==========================================
-- 5. INSERT DEFAULT DATA (from existing templates)
-- ==========================================

-- Insert default live chat categories
INSERT INTO public.template_categories (name, description, created_by) VALUES
('Orders', 'Order-related customer queries', 'admin-user'),
('Delivery', 'Delivery and shipping inquiries', 'admin-user'),
('Technical', 'Technical support issues', 'admin-user'),
('General', 'General customer service', 'admin-user'),
('Billing', 'Billing and payment questions', 'admin-user'),
('Returns', 'Return and refund requests', 'admin-user')
ON CONFLICT (name) DO NOTHING;

-- Insert default email categories  
INSERT INTO public.email_categories (name, description, created_by) VALUES
('Orders', 'Order-related internal communications', 'admin-user'),
('Delivery', 'Delivery coordination emails', 'admin-user'),
('Technical', 'Technical escalation emails', 'admin-user'),
('General', 'General internal communications', 'admin-user'),
('Billing', 'Billing department escalations', 'admin-user'),
('Returns', 'Return processing emails', 'admin-user')
ON CONFLICT (name) DO NOTHING;

-- Insert default genres
INSERT INTO public.template_genres (name, description, created_by) VALUES
('urgent', 'High priority urgent responses', 'admin-user'),
('standard', 'Standard priority responses', 'admin-user'),
('greeting', 'Welcome and greeting messages', 'admin-user'),
('closing', 'Conversation closing messages', 'admin-user'),
('escalation', 'Escalation to supervisors', 'admin-user'),
('informational', 'Informational responses', 'admin-user')
ON CONFLICT (name) DO NOTHING;

-- Insert default concerned teams
INSERT INTO public.concerned_teams (name, description, created_by) VALUES
('Finance', 'Finance department', 'admin-user'),
('Technical Support', 'Technical support team', 'admin-user'),
('Logistics', 'Logistics and delivery team', 'admin-user'),
('Customer Service', 'Customer service management', 'admin-user'),
('Management', 'Upper management', 'admin-user'),
('Quality Assurance', 'QA team', 'admin-user')
ON CONFLICT (name) DO NOTHING;

-- ==========================================
-- 6. FUNCTIONS TO SYNC EXISTING TEMPLATE DATA
-- ==========================================

-- Function to sync categories from existing live reply templates
CREATE OR REPLACE FUNCTION sync_template_categories_from_templates()
RETURNS void AS $$
BEGIN
    INSERT INTO public.template_categories (name, description, created_by)
    SELECT DISTINCT 
        category as name,
        'Auto-imported from existing templates' as description,
        'admin-user' as created_by
    FROM public.live_reply_templates 
    WHERE category IS NOT NULL 
    AND category != ''
    ON CONFLICT (name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Function to sync categories from existing email templates
CREATE OR REPLACE FUNCTION sync_email_categories_from_templates()
RETURNS void AS $$
BEGIN
    INSERT INTO public.email_categories (name, description, created_by)
    SELECT DISTINCT 
        category as name,
        'Auto-imported from existing templates' as description,
        'admin-user' as created_by
    FROM public.email_templates 
    WHERE category IS NOT NULL 
    AND category != ''
    ON CONFLICT (name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Function to sync genres from existing templates
CREATE OR REPLACE FUNCTION sync_genres_from_templates()
RETURNS void AS $$
BEGIN
    INSERT INTO public.template_genres (name, description, created_by)
    SELECT DISTINCT 
        genre as name,
        'Auto-imported from existing templates' as description,
        'admin-user' as created_by
    FROM (
        SELECT genre FROM public.live_reply_templates WHERE genre IS NOT NULL AND genre != ''
        UNION
        SELECT genre FROM public.email_templates WHERE genre IS NOT NULL AND genre != ''
    ) combined_genres
    ON CONFLICT (name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Function to sync concerned teams from existing email templates
CREATE OR REPLACE FUNCTION sync_concerned_teams_from_templates()
RETURNS void AS $$
BEGIN
    INSERT INTO public.concerned_teams (name, description, created_by)
    SELECT DISTINCT 
        concerned_team as name,
        'Auto-imported from existing templates' as description,
        'admin-user' as created_by
    FROM public.email_templates 
    WHERE concerned_team IS NOT NULL 
    AND concerned_team != ''
    ON CONFLICT (name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 7. EXECUTE SYNC FUNCTIONS
-- ==========================================
SELECT sync_template_categories_from_templates();
SELECT sync_email_categories_from_templates();
SELECT sync_genres_from_templates();
SELECT sync_concerned_teams_from_templates();

-- ==========================================
-- 8. VERIFICATION QUERIES
-- ==========================================
-- Run these to verify the data was imported correctly:

-- SELECT 'Template Categories' as table_name, COUNT(*) as count FROM public.template_categories
-- UNION ALL
-- SELECT 'Email Categories' as table_name, COUNT(*) as count FROM public.email_categories  
-- UNION ALL
-- SELECT 'Genres' as table_name, COUNT(*) as count FROM public.template_genres
-- UNION ALL
-- SELECT 'Concerned Teams' as table_name, COUNT(*) as count FROM public.concerned_teams;

-- ==========================================
-- SETUP COMPLETE
-- ==========================================
-- After running this script:
-- 1. All dynamic categories/genres tables are created
-- 2. Default data is inserted
-- 3. Existing template data is automatically imported
-- 4. The frontend can now fetch these dynamically