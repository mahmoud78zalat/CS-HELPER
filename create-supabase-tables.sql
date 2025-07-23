-- 🗄️ COMPLETE DATABASE SETUP: Run this SQL in Supabase SQL Editor
-- This creates ALL required tables, relationships, and sample data

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USERS TABLE - Core user management
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

-- 2. LIVE REPLY TEMPLATES - Customer chat responses
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

-- 3. EMAIL TEMPLATES - Internal team communication
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

-- 4. TEMPLATE CATEGORIES - Predefined categories for templates
CREATE TABLE IF NOT EXISTS public.template_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    color_code TEXT DEFAULT '#3B82F6',
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TEMPLATE GENRES - Predefined genres/moods for templates
CREATE TABLE IF NOT EXISTS public.template_genres (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    color_code TEXT DEFAULT '#10B981',
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. SITE CONTENT - Dynamic site configuration
CREATE TABLE IF NOT EXISTS public.site_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    description TEXT,
    updated_by TEXT REFERENCES public.users(id) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. USER LOGS - Activity tracking
CREATE TABLE IF NOT EXISTS public.user_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES public.users(id) NOT NULL,
    action TEXT NOT NULL,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. ANALYTICS - Usage statistics
CREATE TABLE IF NOT EXISTS public.analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name TEXT NOT NULL,
    metric_value INTEGER NOT NULL,
    dimensions JSONB,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. LIVE REPLY USAGE - Track live chat template usage
CREATE TABLE IF NOT EXISTS public.live_reply_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID REFERENCES public.live_reply_templates(id) ON DELETE CASCADE NOT NULL,
    user_id TEXT REFERENCES public.users(id) NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. EMAIL TEMPLATE USAGE - Track email template usage
CREATE TABLE IF NOT EXISTS public.email_template_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID REFERENCES public.email_templates(id) ON DELETE CASCADE NOT NULL,
    user_id TEXT REFERENCES public.users(id) NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. SYSTEM SETTINGS - Global system configuration
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    data_type TEXT CHECK (data_type IN ('string', 'number', 'boolean', 'json')) DEFAULT 'string',
    description TEXT,
    updated_by TEXT REFERENCES public.users(id) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. SESSIONS - Authentication sessions
CREATE TABLE IF NOT EXISTS public.sessions (
    sid TEXT PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMP WITH TIME ZONE NOT NULL
);

-- CREATE INDEXES for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_live_templates_category ON public.live_reply_templates(category);
CREATE INDEX IF NOT EXISTS idx_live_templates_active ON public.live_reply_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON public.email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON public.email_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_user_logs_user_id ON public.user_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_logs_created_at ON public.user_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_metric ON public.analytics(metric_name);
CREATE INDEX IF NOT EXISTS idx_sessions_expire ON public.sessions(expire);

-- INSERT ADMIN USER (REQUIRED)
INSERT INTO public.users (id, email, first_name, last_name, role, status, is_online)
VALUES ('admin-user', 'admin@example.com', 'System', 'Admin', 'admin', 'active', true)
ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    updated_at = NOW();

-- INSERT TEMPLATE CATEGORIES
INSERT INTO public.template_categories (name, description, color_code) VALUES
('Greetings', 'Welcome and greeting messages', '#22C55E'),
('Orders', 'Order-related communications', '#3B82F6'),
('Support', 'General customer support', '#F59E0B'),
('Apologies', 'Apology and resolution messages', '#EF4444'),
('Technical', 'Technical support and troubleshooting', '#8B5CF6'),
('Billing', 'Payment and billing related', '#10B981'),
('Shipping', 'Delivery and shipping updates', '#F97316'),
('Returns', 'Return and refund processes', '#84CC16')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description, color_code = EXCLUDED.color_code;

-- INSERT TEMPLATE GENRES
INSERT INTO public.template_genres (name, description, color_code) VALUES
('friendly', 'Warm and welcoming tone', '#22C55E'),
('professional', 'Business-like and formal', '#3B82F6'),
('urgent', 'Time-sensitive and priority', '#EF4444'),
('helpful', 'Supportive and solution-focused', '#F59E0B'),
('apologetic', 'Sincere and understanding', '#EC4899'),
('grateful', 'Appreciative and thankful', '#10B981'),
('informative', 'Educational and detailed', '#8B5CF6'),
('celebratory', 'Positive and congratulatory', '#F97316')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description, color_code = EXCLUDED.color_code;

-- INSERT SITE CONTENT
INSERT INTO public.site_content (key, content, description, updated_by) VALUES
('site_name', 'Customer Service Platform', 'Main site title', 'admin-user'),
('about_tool', 'Advanced customer service communication platform for streamlined template management and team collaboration.', 'About page description', 'admin-user'),
('company_info', 'Professional Customer Service Management System', 'Company information', 'admin-user'),
('footer_text', 'Made by Mahmoud Zalat', 'Footer attribution (non-removable)', 'admin-user'),
('version_label', 'v2.0 - Supabase Edition', 'Version identifier', 'admin-user')
ON CONFLICT (key) DO UPDATE SET
    content = EXCLUDED.content,
    updated_by = EXCLUDED.updated_by,
    updated_at = NOW();

-- INSERT SYSTEM SETTINGS
INSERT INTO public.system_settings (key, value, data_type, description, updated_by) VALUES
('max_templates_per_user', '50', 'number', 'Maximum templates per user', 'admin-user'),
('enable_analytics', 'true', 'boolean', 'Enable usage analytics', 'admin-user'),
('template_approval_required', 'false', 'boolean', 'Require admin approval for new templates', 'admin-user'),
('session_timeout_minutes', '480', 'number', 'Session timeout in minutes', 'admin-user')
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_by = EXCLUDED.updated_by,
    updated_at = NOW();

-- INSERT SAMPLE LIVE REPLY TEMPLATES
INSERT INTO public.live_reply_templates (name, content_en, content_ar, category, genre, variables, created_by) VALUES
('Welcome - {customer_name}', 
 'Hello {customer_name}! Welcome to our customer support. How can I assist you today?',
 'مرحباً {customer_name}! أهلاً بك في خدمة العملاء. كيف يمكنني مساعدتك اليوم؟',
 'Greetings', 'friendly', ARRAY['customer_name'], 'admin-user'),

('Order Status - {order_id}',
 'I''ll check the status of your order {order_id} right away, {customer_name}. Please give me a moment.',
 'سأتحقق من حالة طلبك {order_id} فوراً، {customer_name}. يرجى إعطائي لحظة.',
 'Orders', 'helpful', ARRAY['order_id', 'customer_name'], 'admin-user'),

('Technical Issue Resolution',
 'I understand you''re experiencing technical difficulties. Let me help you resolve this step by step.',
 'أفهم أنك تواجه صعوبات تقنية. دعني أساعدك في حل هذا خطوة بخطوة.',
 'Technical', 'professional', ARRAY[], 'admin-user')
ON CONFLICT DO NOTHING;

-- INSERT SAMPLE EMAIL TEMPLATES
INSERT INTO public.email_templates (name, subject, content, category, genre, concerned_team, variables, created_by) VALUES
('Order Escalation - {order_id}',
 'URGENT: Customer Issue with Order {order_id}',
 'Dear Team,

Customer {customer_name} is experiencing issues with order {order_id}.

Details:
- Customer: {customer_name}
- Order ID: {order_id}
- Agent: {agent_name}
- Issue: Requires immediate attention

Please prioritize this case and provide resolution within 2 hours.

Best regards,
{agent_name}
Customer Service Team',
 'Orders', 'urgent', 'Customer Service', ARRAY['order_id', 'customer_name', 'agent_name'], 'admin-user'),

('Payment Issue - {customer_name}',
 'Payment Processing Issue for {customer_name}',
 'Finance Team,

We have a payment processing issue that requires your attention:

Customer: {customer_name}
Issue: Payment not processed correctly
Agent: {agent_name}

Please investigate and resolve promptly.

Thank you,
{agent_name}',
 'Billing', 'urgent', 'Finance', ARRAY['customer_name', 'agent_name'], 'admin-user')
ON CONFLICT DO NOTHING;

-- SUCCESS MESSAGE
SELECT 
    'SUCCESS: All tables created successfully!' as status,
    'Admin user: admin@example.com' as login_info,
    'Ready for Supabase Auth integration' as auth_status;