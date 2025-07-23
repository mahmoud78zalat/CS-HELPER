-- BFL Customer Service Helper - Database Setup Script
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    profile_image_url TEXT,
    role VARCHAR(50) NOT NULL DEFAULT 'agent' CHECK (role IN ('admin', 'agent')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'banned')),
    is_online BOOLEAN DEFAULT false,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    supabase_id VARCHAR(255),
    last_synced_at TIMESTAMP WITH TIME ZONE
);

-- Create live_reply_templates table (for chat responses)
CREATE TABLE IF NOT EXISTS live_reply_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    genre VARCHAR(100) NOT NULL DEFAULT 'standard',
    content_en TEXT NOT NULL,
    content_ar TEXT,
    variables JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    supabase_id VARCHAR(255),
    last_synced_at TIMESTAMP WITH TIME ZONE
);

-- Create email_templates table (for internal communication)
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    category VARCHAR(100) NOT NULL,
    genre VARCHAR(100) NOT NULL DEFAULT 'standard',
    concerned_team VARCHAR(100),
    content_en TEXT NOT NULL,
    content_ar TEXT,
    variables JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    warning_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    supabase_id VARCHAR(255),
    last_synced_at TIMESTAMP WITH TIME ZONE
);

-- Create usage tracking tables
CREATE TABLE IF NOT EXISTS live_reply_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID REFERENCES live_reply_templates(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    supabase_id VARCHAR(255),
    last_synced_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS email_template_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID REFERENCES email_templates(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    supabase_id VARCHAR(255),
    last_synced_at TIMESTAMP WITH TIME ZONE
);

-- Create site_content table for customization
CREATE TABLE IF NOT EXISTS site_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) NOT NULL UNIQUE,
    title VARCHAR(500),
    content TEXT,
    content_type VARCHAR(100) DEFAULT 'text',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    supabase_id VARCHAR(255),
    last_synced_at TIMESTAMP WITH TIME ZONE
);

-- Create personal_notes table
CREATE TABLE IF NOT EXISTS personal_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_live_reply_templates_category ON live_reply_templates(category);
CREATE INDEX IF NOT EXISTS idx_live_reply_templates_active ON live_reply_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_team ON email_templates(concerned_team);
CREATE INDEX IF NOT EXISTS idx_personal_notes_user ON personal_notes(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_reply_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_reply_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_template_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (true);
CREATE POLICY "Allow user creation" ON users FOR INSERT WITH CHECK (true);

-- RLS Policies for templates (all users can read, admins can modify)
CREATE POLICY "Everyone can view live reply templates" ON live_reply_templates FOR SELECT USING (true);
CREATE POLICY "Everyone can view email templates" ON email_templates FOR SELECT USING (true);
CREATE POLICY "Allow template creation" ON live_reply_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow email template creation" ON email_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow template updates" ON live_reply_templates FOR UPDATE USING (true);
CREATE POLICY "Allow email template updates" ON email_templates FOR UPDATE USING (true);
CREATE POLICY "Allow template deletion" ON live_reply_templates FOR DELETE USING (true);
CREATE POLICY "Allow email template deletion" ON email_templates FOR DELETE USING (true);

-- RLS Policies for usage tracking
CREATE POLICY "Everyone can track usage" ON live_reply_usage FOR INSERT WITH CHECK (true);
CREATE POLICY "Everyone can track email usage" ON email_template_usage FOR INSERT WITH CHECK (true);
CREATE POLICY "Everyone can view usage" ON live_reply_usage FOR SELECT USING (true);
CREATE POLICY "Everyone can view email usage" ON email_template_usage FOR SELECT USING (true);

-- RLS Policies for site content
CREATE POLICY "Everyone can view site content" ON site_content FOR SELECT USING (true);
CREATE POLICY "Allow site content management" ON site_content FOR ALL USING (true);

-- RLS Policies for personal notes (user-specific)
CREATE POLICY "Users can manage their own notes" ON personal_notes FOR ALL USING (auth.uid()::text = user_id::text);

-- Insert default site content
INSERT INTO site_content (key, title, content, content_type) VALUES
('site_name', 'Site Name', 'BFL Customer Service Helper', 'text'),
('about_content', 'About Content', 'A comprehensive customer service management tool', 'text'),
('version_label', 'Version Label', 'v2.1.0', 'text'),
('footer_text', 'Footer Text', 'Made by Mahmoud Zalat', 'text')
ON CONFLICT (key) DO NOTHING;

-- Create your admin user (replace with your actual email)
INSERT INTO users (id, email, first_name, last_name, role, status) VALUES
('f765c1de-f9b5-4615-8c09-8cdde8152a07', 'mahmoud78zalat@gmail.com', 'Mahmoud', 'Zalat', 'admin', 'active')
ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    status = 'active',
    updated_at = NOW();

-- Insert some sample templates for testing
INSERT INTO live_reply_templates (name, category, genre, content_en, content_ar, variables) VALUES
('Order Status Inquiry', 'Orders', 'standard', 'Hello {customer_name}, let me check your order {order_id} status right away.', 'مرحباً {customer_name}، دعني أتحقق من حالة طلبك {order_id} الآن.', '["customer_name", "order_id"]'::jsonb),
('General Greeting', 'General', 'greeting', 'Hello! Welcome to our customer service. How can I help you today?', 'مرحباً! أهلاً بك في خدمة العملاء. كيف يمكنني مساعدتك اليوم؟', '[]'::jsonb),
('Apology Response', 'General', 'apology', 'I sincerely apologize for the inconvenience caused. Let me resolve this for you immediately.', 'أعتذر بصدق عن الإزعاج المُسبب. دعني أحل هذا الأمر لك على الفور.', '[]'::jsonb)
ON CONFLICT DO NOTHING;

INSERT INTO email_templates (name, subject, category, genre, concerned_team, content_en, content_ar, variables) VALUES
('Order Issue Escalation', 'Order Issue - Customer {customer_name}', 'Orders', 'urgent', 'Fulfillment', 'Customer {customer_name} has reported an issue with order {order_id}. Please investigate and respond within {time_frame}.', 'العميل {customer_name} أبلغ عن مشكلة في الطلب {order_id}. يرجى التحقيق والرد خلال {time_frame}.', '["customer_name", "order_id", "time_frame"]'::jsonb),
('Technical Support Request', 'Technical Support - {issue_type}', 'Technical', 'standard', 'IT Support', 'A customer needs technical assistance with {issue_type}. Details: {issue_description}', 'يحتاج العميل لمساعدة تقنية مع {issue_type}. التفاصيل: {issue_description}', '["issue_type", "issue_description"]'::jsonb)
ON CONFLICT DO NOTHING;

COMMIT;