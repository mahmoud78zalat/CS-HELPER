-- 🚨 URGENT: Run this SQL in your Supabase SQL Editor to create all required tables
-- Go to: Supabase Dashboard > SQL Editor > New Query > Paste this code > Run

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    profile_image_url TEXT,
    role TEXT CHECK (role IN ('admin', 'agent')) DEFAULT 'agent' NOT NULL,
    status TEXT CHECK (status IN ('active', 'blocked', 'banned')) DEFAULT 'active' NOT NULL,
    is_online BOOLEAN DEFAULT false NOT NULL,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create live reply templates table (for customer chat responses)
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
    key TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    updated_by TEXT REFERENCES public.users(id) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create sessions table (required for authentication)
CREATE TABLE IF NOT EXISTS public.sessions (
    sid TEXT PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create index on sessions expire for cleanup
CREATE INDEX IF NOT EXISTS idx_sessions_expire ON sessions(expire);

-- 7. Insert admin user (REQUIRED)
INSERT INTO public.users (id, email, first_name, last_name, role, status, is_online)
VALUES ('admin-user', 'admin@example.com', 'System', 'Admin', 'admin', 'active', true)
ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    updated_at = NOW();

-- 8. Insert sample live reply template with dynamic name
INSERT INTO public.live_reply_templates (name, content_en, content_ar, category, genre, variables, created_by)
VALUES (
    'Welcome Message - {customer_name}',
    'Hello {customer_name}! Welcome to our customer support. How can I assist you today?',
    'مرحباً {customer_name}! أهلاً بك في خدمة العملاء. كيف يمكنني مساعدتك اليوم؟',
    'Greetings',
    'friendly',
    ARRAY['customer_name'],
    'admin-user'
) ON CONFLICT DO NOTHING;

-- 9. Insert sample email template with dynamic name
INSERT INTO public.email_templates (name, subject, content, category, genre, concerned_team, variables, created_by)
VALUES (
    'Order Escalation - {order_id}',
    'Urgent: Customer Issue with Order {order_id}',
    'Dear Team,

Customer {customer_name} is experiencing issues with order {order_id}.

Please prioritize this case and provide immediate assistance.

Details:
- Customer: {customer_name}
- Order ID: {order_id}
- Agent: {agent_name}

Thank you,
{agent_name}
Customer Service Team',
    'Orders',
    'urgent',
    'Customer Service',
    ARRAY['order_id', 'customer_name', 'agent_name'],
    'admin-user'
) ON CONFLICT DO NOTHING;

-- 10. Insert default site content
INSERT INTO public.site_content (key, content, updated_by) VALUES
('site_name', 'Customer Service Platform', 'admin-user'),
('about_tool', 'Advanced customer service communication platform for streamlined template management.', 'admin-user'),
('company_info', 'Customer Service Management System', 'admin-user')
ON CONFLICT (key) DO UPDATE SET
    content = EXCLUDED.content,
    updated_by = EXCLUDED.updated_by,
    updated_at = NOW();

-- Success message
SELECT 'SUCCESS: All tables created! You can now use the platform with full Supabase integration.' as status;