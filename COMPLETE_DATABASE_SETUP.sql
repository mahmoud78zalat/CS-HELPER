-- ==========================================
-- CUSTOMER SERVICE PLATFORM - COMPLETE DATABASE SETUP
-- ==========================================
-- Version: 1.0 (Production Ready)
-- Execute this entire script in your Supabase SQL Editor
-- This creates all necessary tables, relationships, functions, and sample data

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- 1. USERS TABLE - Core user management
-- ==========================================
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    profile_image_url TEXT DEFAULT '',
    role TEXT CHECK (role IN ('admin', 'agent')) DEFAULT 'agent' NOT NULL,
    status TEXT CHECK (status IN ('active', 'blocked', 'banned')) DEFAULT 'active' NOT NULL,
    is_online BOOLEAN DEFAULT false NOT NULL,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);

-- ==========================================
-- 2. LIVE REPLY TEMPLATES - Customer chat responses
-- ==========================================
CREATE TABLE IF NOT EXISTS public.live_reply_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    content_en TEXT NOT NULL,
    content_ar TEXT NOT NULL,
    category TEXT NOT NULL,
    genre TEXT NOT NULL,
    variables TEXT[] DEFAULT '{}' NOT NULL,
    stage_order INTEGER DEFAULT 1 NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    usage_count INTEGER DEFAULT 0 NOT NULL,
    created_by TEXT REFERENCES public.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_live_templates_category ON public.live_reply_templates(category);
CREATE INDEX IF NOT EXISTS idx_live_templates_genre ON public.live_reply_templates(genre);
CREATE INDEX IF NOT EXISTS idx_live_templates_active ON public.live_reply_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_live_templates_created_by ON public.live_reply_templates(created_by);

-- ==========================================
-- 3. EMAIL TEMPLATES - Internal team communication
-- ==========================================
CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    genre TEXT NOT NULL,
    concerned_team TEXT NOT NULL,
    warning_note TEXT DEFAULT '',
    variables TEXT[] DEFAULT '{}' NOT NULL,
    stage_order INTEGER DEFAULT 1 NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    usage_count INTEGER DEFAULT 0 NOT NULL,
    created_by TEXT REFERENCES public.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON public.email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_genre ON public.email_templates(genre);
CREATE INDEX IF NOT EXISTS idx_email_templates_team ON public.email_templates(concerned_team);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON public.email_templates(is_active);

-- ==========================================
-- 4. LIVE REPLY USAGE - Track chat template usage
-- ==========================================
CREATE TABLE IF NOT EXISTS public.live_reply_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID REFERENCES public.live_reply_templates(id) ON DELETE CASCADE NOT NULL,
    user_id TEXT REFERENCES public.users(id) NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_live_usage_template ON public.live_reply_usage(template_id);
CREATE INDEX IF NOT EXISTS idx_live_usage_user ON public.live_reply_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_live_usage_date ON public.live_reply_usage(used_at);

-- ==========================================
-- 5. EMAIL TEMPLATE USAGE - Track email template usage
-- ==========================================
CREATE TABLE IF NOT EXISTS public.email_template_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID REFERENCES public.email_templates(id) ON DELETE CASCADE NOT NULL,
    user_id TEXT REFERENCES public.users(id) NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_usage_template ON public.email_template_usage(template_id);
CREATE INDEX IF NOT EXISTS idx_email_usage_user ON public.email_template_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_email_usage_date ON public.email_template_usage(used_at);

-- ==========================================
-- 6. SITE CONTENT - Dynamic site configuration
-- ==========================================
CREATE TABLE IF NOT EXISTS public.site_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    description TEXT DEFAULT '',
    updated_by TEXT REFERENCES public.users(id) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_site_content_key ON public.site_content(key);

-- ==========================================
-- 7. USAGE COUNTER FUNCTIONS
-- ==========================================

-- Function to increment live reply template usage
CREATE OR REPLACE FUNCTION public.increment_live_reply_usage(template_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.live_reply_templates 
    SET usage_count = usage_count + 1,
        updated_at = NOW()
    WHERE id = template_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment email template usage
CREATE OR REPLACE FUNCTION public.increment_email_template_usage(template_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.email_templates 
    SET usage_count = usage_count + 1,
        updated_at = NOW()
    WHERE id = template_id;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 8. AUTOMATIC TIMESTAMP UPDATES
-- ==========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER trigger_update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_update_live_templates_updated_at
    BEFORE UPDATE ON public.live_reply_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_update_email_templates_updated_at
    BEFORE UPDATE ON public.email_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_update_site_content_updated_at
    BEFORE UPDATE ON public.site_content
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_reply_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_reply_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_template_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view all users" ON public.users
    FOR SELECT USING (true);

CREATE POLICY "Admin users can update users" ON public.users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid()::text AND role = 'admin'
        )
    );

-- Templates policies (allow all authenticated users to read, only admins to modify)
CREATE POLICY "Allow read access to live templates" ON public.live_reply_templates
    FOR SELECT USING (true);

CREATE POLICY "Allow admin to manage live templates" ON public.live_reply_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid()::text AND role = 'admin'
        )
    );

CREATE POLICY "Allow read access to email templates" ON public.email_templates
    FOR SELECT USING (true);

CREATE POLICY "Allow admin to manage email templates" ON public.email_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid()::text AND role = 'admin'
        )
    );

-- Usage tracking policies
CREATE POLICY "Users can track their own usage" ON public.live_reply_usage
    FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can view usage stats" ON public.live_reply_usage
    FOR SELECT USING (true);

CREATE POLICY "Users can track their email usage" ON public.email_template_usage
    FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can view email usage stats" ON public.email_template_usage
    FOR SELECT USING (true);

-- Site content policies
CREATE POLICY "Allow read access to site content" ON public.site_content
    FOR SELECT USING (true);

CREATE POLICY "Allow admin to manage site content" ON public.site_content
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid()::text AND role = 'admin'
        )
    );

-- ==========================================
-- 10. SAMPLE DATA INSERTION
-- ==========================================

-- Insert default admin user (replace with your actual admin details)
INSERT INTO public.users (id, email, first_name, last_name, role, status, is_online)
VALUES (
    'admin-user-' || extract(epoch from now())::text,
    'admin@yourcompany.com',
    'System',
    'Administrator',
    'admin',
    'active',
    true
) ON CONFLICT (email) DO UPDATE SET
    role = 'admin',
    status = 'active',
    updated_at = NOW();

-- Insert sample live reply templates
INSERT INTO public.live_reply_templates (name, content_en, content_ar, category, genre, variables, stage_order, created_by)
VALUES 
    (
        'Welcome Greeting - {customer_name}',
        'Hello {customer_name}! Welcome to our customer support. How may I assist you today?',
        'مرحباً {customer_name}! أهلاً بك في خدمة العملاء. كيف يمكنني مساعدتك اليوم؟',
        'Greetings',
        'friendly',
        ARRAY['customer_name'],
        1,
        (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1)
    ),
    (
        'Order Status Inquiry - {order_id}',
        'I can help you check the status of your order {order_id}. Let me look that up for you right away.',
        'يمكنني مساعدتك في التحقق من حالة طلبك {order_id}. دعني أبحث عن ذلك لك الآن.',
        'Order Issues',
        'helpful',
        ARRAY['order_id'],
        2,
        (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1)
    ),
    (
        'Apology for Delay - {customer_name}',
        'I sincerely apologize for the delay, {customer_name}. Let me resolve this issue for you immediately.',
        'أعتذر بصدق عن التأخير يا {customer_name}. دعني أحل هذه المشكلة لك فوراً.',
        'Delivery Problems',
        'apology',
        ARRAY['customer_name'],
        1,
        (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1)
    )
ON CONFLICT DO NOTHING;

-- Insert sample email templates
INSERT INTO public.email_templates (name, subject, content, category, genre, concerned_team, variables, stage_order, created_by)
VALUES 
    (
        'Order Escalation - {order_id}',
        'Urgent: Customer Issue with Order {order_id}',
        'Dear Team,

Customer {customer_name} requires immediate assistance with order {order_id}.

Issue Details:
- Customer Name: {customer_name}
- Order ID: {order_id}
- Agent Handling: {agent_name}
- Priority: High

Please review and resolve promptly.

Best regards,
{agent_name}',
        'Order Issues',
        'urgent',
        'Customer Service',
        ARRAY['order_id', 'customer_name', 'agent_name'],
        1,
        (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1)
    ),
    (
        'Payment Issue - {customer_name}',
        'Payment Processing Issue for {customer_name}',
        'Finance Team,

We have a payment processing issue that requires your attention:

Customer: {customer_name}
Order: {order_id}
Amount: {order_amount}
Payment Method: {payment_method}

The customer is waiting for resolution. Please prioritize this case.

Thank you,
{agent_name}',
        'Payment Issues',
        'urgent',
        'Finance',
        ARRAY['customer_name', 'order_id', 'order_amount', 'payment_method', 'agent_name'],
        1,
        (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1)
    )
ON CONFLICT DO NOTHING;

-- Insert default site content
INSERT INTO public.site_content (key, content, description, updated_by)
VALUES 
    (
        'site_name',
        'Customer Service Platform',
        'Main site/company name displayed in the application',
        (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1)
    ),
    (
        'about_tool',
        'Advanced customer service communication platform designed to streamline template management for business teams, with real-time collaboration and intelligent administrative controls.',
        'Description of the platform shown in the about section',
        (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1)
    ),
    (
        'company_info',
        'Your Company Name - Premium customer service solutions',
        'Company information displayed in the footer',
        (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1)
    ),
    (
        'support_hours',
        '9 AM - 6 PM, Monday - Friday',
        'Support hours information',
        (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1)
    ),
    (
        'version_label',
        'v1.0',
        'Version label displayed in the application',
        (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1)
    )
ON CONFLICT (key) DO UPDATE SET
    content = EXCLUDED.content,
    updated_at = NOW();

-- ==========================================
-- 11. VERIFICATION QUERIES
-- ==========================================

-- Run these queries to verify setup completion:

-- Check tables were created
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN (
        'users', 
        'live_reply_templates', 
        'email_templates', 
        'live_reply_usage', 
        'email_template_usage', 
        'site_content'
    )
ORDER BY table_name;

-- Check sample data was inserted
SELECT 'Users' as table_name, count(*) as record_count FROM public.users
UNION ALL
SELECT 'Live Templates', count(*) FROM public.live_reply_templates
UNION ALL
SELECT 'Email Templates', count(*) FROM public.email_templates
UNION ALL
SELECT 'Site Content', count(*) FROM public.site_content;

-- Check admin user exists
SELECT 
    id, 
    email, 
    first_name, 
    last_name, 
    role,
    status,
    created_at
FROM public.users 
WHERE role = 'admin';

-- ==========================================
-- SETUP COMPLETE!
-- ==========================================
-- 
-- Your database is now ready for production use.
-- 
-- Next Steps:
-- 1. Update the admin user email to your actual admin email
-- 2. Customize the site_content values for your company
-- 3. Add your team members through the admin panel
-- 4. Create your own templates using the admin interface
--
-- Important Notes:
-- - Change the admin email from 'admin@yourcompany.com'
-- - All timestamps are in UTC
-- - RLS policies are enabled for security
-- - Usage statistics are automatically tracked
-- - Auto-updating timestamps are enabled
--
-- ==========================================