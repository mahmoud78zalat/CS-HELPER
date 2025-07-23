-- FINAL DATABASE SETUP - ERROR FREE
-- Based on your existing project structure

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    first_name TEXT,
    last_name TEXT,
    profile_image_url TEXT,
    role TEXT NOT NULL DEFAULT 'agent' CHECK (role IN ('admin', 'agent')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'banned')),
    is_online BOOLEAN DEFAULT false,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create live reply templates table (for chat responses)
CREATE TABLE IF NOT EXISTS public.live_reply_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    content_en TEXT NOT NULL,
    content_ar TEXT NOT NULL,
    category TEXT NOT NULL,
    genre TEXT NOT NULL,
    variables TEXT[] DEFAULT '{}',
    stage_order INTEGER DEFAULT 1 NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    usage_count INTEGER DEFAULT 0 NOT NULL,
    created_by TEXT REFERENCES public.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create email templates table (for internal team communication)
CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    genre TEXT NOT NULL,
    concerned_team TEXT NOT NULL,
    warning_note TEXT,
    variables TEXT[] DEFAULT '{}' NOT NULL,
    stage_order INTEGER DEFAULT 1 NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    usage_count INTEGER DEFAULT 0 NOT NULL,
    created_by TEXT REFERENCES public.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create usage tracking tables
CREATE TABLE IF NOT EXISTS public.live_reply_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID REFERENCES public.live_reply_templates(id) ON DELETE CASCADE NOT NULL,
    user_id TEXT REFERENCES public.users(id) NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.email_template_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID REFERENCES public.email_templates(id) ON DELETE CASCADE NOT NULL,
    user_id TEXT REFERENCES public.users(id) NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create site content table
CREATE TABLE IF NOT EXISTS public.site_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT NOT NULL UNIQUE,
    content TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by TEXT REFERENCES public.users(id)
);

-- 6. Create personal notes table
CREATE TABLE IF NOT EXISTS public.personal_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create sessions table
CREATE TABLE IF NOT EXISTS public.sessions (
    sid TEXT PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_live_reply_templates_category ON public.live_reply_templates(category);
CREATE INDEX IF NOT EXISTS idx_live_reply_templates_active ON public.live_reply_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON public.email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_team ON public.email_templates(concerned_team);
CREATE INDEX IF NOT EXISTS idx_personal_notes_user ON public.personal_notes(user_id);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_reply_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_reply_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_template_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_notes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Allow user creation" ON public.users;
DROP POLICY IF EXISTS "Everyone can view live reply templates" ON public.live_reply_templates;
DROP POLICY IF EXISTS "Everyone can view email templates" ON public.email_templates;
DROP POLICY IF EXISTS "Allow template creation" ON public.live_reply_templates;
DROP POLICY IF EXISTS "Allow email template creation" ON public.email_templates;
DROP POLICY IF EXISTS "Allow template updates" ON public.live_reply_templates;
DROP POLICY IF EXISTS "Allow email template updates" ON public.email_templates;
DROP POLICY IF EXISTS "Allow template deletion" ON public.live_reply_templates;
DROP POLICY IF EXISTS "Allow email template deletion" ON public.email_templates;
DROP POLICY IF EXISTS "Everyone can track usage" ON public.live_reply_usage;
DROP POLICY IF EXISTS "Everyone can track email usage" ON public.email_template_usage;
DROP POLICY IF EXISTS "Everyone can view usage" ON public.live_reply_usage;
DROP POLICY IF EXISTS "Everyone can view email usage" ON public.email_template_usage;
DROP POLICY IF EXISTS "Everyone can view site content" ON public.site_content;
DROP POLICY IF EXISTS "Allow site content management" ON public.site_content;
DROP POLICY IF EXISTS "Users can manage their own notes" ON public.personal_notes;

-- Create RLS Policies
CREATE POLICY "Users can view all users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (true);
CREATE POLICY "Allow user creation" ON public.users FOR INSERT WITH CHECK (true);

CREATE POLICY "Everyone can view live reply templates" ON public.live_reply_templates FOR SELECT USING (true);
CREATE POLICY "Everyone can view email templates" ON public.email_templates FOR SELECT USING (true);
CREATE POLICY "Allow template creation" ON public.live_reply_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow email template creation" ON public.email_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow template updates" ON public.live_reply_templates FOR UPDATE USING (true);
CREATE POLICY "Allow email template updates" ON public.email_templates FOR UPDATE USING (true);
CREATE POLICY "Allow template deletion" ON public.live_reply_templates FOR DELETE USING (true);
CREATE POLICY "Allow email template deletion" ON public.email_templates FOR DELETE USING (true);

CREATE POLICY "Everyone can track usage" ON public.live_reply_usage FOR INSERT WITH CHECK (true);
CREATE POLICY "Everyone can track email usage" ON public.email_template_usage FOR INSERT WITH CHECK (true);
CREATE POLICY "Everyone can view usage" ON public.live_reply_usage FOR SELECT USING (true);
CREATE POLICY "Everyone can view email usage" ON public.email_template_usage FOR SELECT USING (true);

CREATE POLICY "Everyone can view site content" ON public.site_content FOR SELECT USING (true);
CREATE POLICY "Allow site content management" ON public.site_content FOR ALL USING (true);

CREATE POLICY "Users can manage their own notes" ON public.personal_notes FOR ALL USING (auth.uid()::text = user_id::text);

-- Insert your admin user
INSERT INTO public.users (id, email, first_name, last_name, role, status) VALUES 
('f765c1de-f9b5-4615-8c09-8cdde8152a07', 'mahmoud78zalat@gmail.com', 'Mahmoud', 'Zalat', 'admin', 'active')
ON CONFLICT (id) DO UPDATE SET 
    role = 'admin',
    status = 'active',
    updated_at = NOW();

-- Insert default site content
INSERT INTO public.site_content (key, content, updated_by) VALUES
('site_name', 'BFL Customer Service Helper', 'f765c1de-f9b5-4615-8c09-8cdde8152a07'),
('about_content', 'A comprehensive customer service management tool', 'f765c1de-f9b5-4615-8c09-8cdde8152a07'),
('version_label', 'v2.1.0', 'f765c1de-f9b5-4615-8c09-8cdde8152a07'),
('footer_text', 'Made by Mahmoud Zalat', 'f765c1de-f9b5-4615-8c09-8cdde8152a07')
ON CONFLICT (key) DO NOTHING;

-- Insert sample templates
INSERT INTO public.live_reply_templates (name, category, genre, content_en, content_ar, variables, created_by) VALUES
('Order Status Inquiry', 'Orders', 'standard', 'Hello {customer_name}, let me check your order {order_id} status right away.', 'مرحباً {customer_name}، دعني أتحقق من حالة طلبك {order_id} الآن.', ARRAY['customer_name', 'order_id'], 'f765c1de-f9b5-4615-8c09-8cdde8152a07'),
('General Greeting', 'General', 'greeting', 'Hello! Welcome to our customer service. How can I help you today?', 'مرحباً! أهلاً بك في خدمة العملاء. كيف يمكنني مساعدتك اليوم؟', ARRAY[]::text[], 'f765c1de-f9b5-4615-8c09-8cdde8152a07'),
('Apology Response', 'General', 'apology', 'I sincerely apologize for the inconvenience caused. Let me resolve this for you immediately.', 'أعتذر بصدق عن الإزعاج المُسبب. دعني أحل هذا الأمر لك على الفور.', ARRAY[]::text[], 'f765c1de-f9b5-4615-8c09-8cdde8152a07')
ON CONFLICT DO NOTHING;

INSERT INTO public.email_templates (name, subject, category, genre, concerned_team, content, variables, created_by) VALUES
('Order Issue Escalation', 'Order Issue - Customer {customer_name}', 'Orders', 'urgent', 'Fulfillment', 'Customer {customer_name} has reported an issue with order {order_id}. Please investigate and respond within {time_frame}.', ARRAY['customer_name', 'order_id', 'time_frame'], 'f765c1de-f9b5-4615-8c09-8cdde8152a07'),
('Technical Support Request', 'Technical Support - {issue_type}', 'Technical', 'standard', 'IT Support', 'A customer needs technical assistance with {issue_type}. Details: {issue_description}', ARRAY['issue_type', 'issue_description'], 'f765c1de-f9b5-4615-8c09-8cdde8152a07')
ON CONFLICT DO NOTHING;

-- Create RPC functions for usage counting
CREATE OR REPLACE FUNCTION increment_live_reply_usage(template_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE public.live_reply_templates 
    SET usage_count = usage_count + 1 
    WHERE id = template_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_email_template_usage(template_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE public.email_templates 
    SET usage_count = usage_count + 1 
    WHERE id = template_id;
END;
$$ LANGUAGE plpgsql;

COMMIT;