-- BFL Customer Service Helper - Complete Supabase Database Setup Script
-- Execute this script manually in your Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    arabic_first_name TEXT,
    arabic_last_name TEXT,
    profile_image_url TEXT,
    role TEXT NOT NULL DEFAULT 'agent' CHECK (role IN ('admin', 'agent')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'banned')),
    is_online BOOLEAN DEFAULT false,
    is_first_time_user BOOLEAN DEFAULT true,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    supabase_id UUID,
    last_synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create template categories table
CREATE TABLE IF NOT EXISTS public.template_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3b82f6',
    is_active BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    supabase_id UUID,
    last_synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create template genres table
CREATE TABLE IF NOT EXISTS public.template_genres (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3b82f6',
    category_id UUID,
    is_active BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    supabase_id UUID,
    last_synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create call scripts table
CREATE TABLE IF NOT EXISTS public.call_scripts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Create store emails table
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

-- Create live reply templates table
CREATE TABLE IF NOT EXISTS public.live_reply_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    category_id UUID,
    genre_id UUID,
    group_id UUID,
    created_by UUID,
    is_active BOOLEAN DEFAULT true,
    is_favorite BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    personal_order_index INTEGER,
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    supabase_id UUID,
    last_synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create email templates table
CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    category_id UUID,
    genre_id UUID,
    created_by UUID,
    is_active BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    personal_order_index INTEGER,
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    warning_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    supabase_id UUID,
    last_synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create template groups table
CREATE TABLE IF NOT EXISTS public.live_reply_template_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3b82f6',
    is_active BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    supabase_id UUID,
    last_synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create personal notes table
CREATE TABLE IF NOT EXISTS public.personal_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    subject TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    supabase_id UUID,
    last_synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create template variables table
CREATE TABLE IF NOT EXISTS public.template_variables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    category TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    supabase_id UUID,
    last_synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create FAQ table
CREATE TABLE IF NOT EXISTS public.faq (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT,
    is_active BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    supabase_id UUID,
    last_synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create site content table
CREATE TABLE IF NOT EXISTS public.site_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    supabase_id UUID,
    last_synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create template colors table
CREATE TABLE IF NOT EXISTS public.template_colors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type TEXT NOT NULL CHECK (entity_type IN ('category', 'genre')),
    entity_name TEXT NOT NULL,
    color TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    supabase_id UUID,
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(entity_type, entity_name)
);

-- Create usage tracking table
CREATE TABLE IF NOT EXISTS public.usage_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    template_id UUID,
    template_type TEXT NOT NULL CHECK (template_type IN ('live_reply', 'email', 'call_script')),
    action_type TEXT NOT NULL CHECK (action_type IN ('used', 'created', 'edited', 'deleted')),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB,
    supabase_id UUID,
    last_synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sessions table (for session management)
CREATE TABLE IF NOT EXISTS public.sessions (
    sid TEXT PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMPTZ NOT NULL
);

-- Create announcement views table
CREATE TABLE IF NOT EXISTS public.announcement_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    announcement_id TEXT NOT NULL,
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    supabase_id UUID,
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, announcement_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
CREATE INDEX IF NOT EXISTS idx_users_is_online ON public.users(is_online);
CREATE INDEX IF NOT EXISTS idx_call_scripts_category_id ON public.call_scripts(category_id);
CREATE INDEX IF NOT EXISTS idx_call_scripts_genre_id ON public.call_scripts(genre_id);
CREATE INDEX IF NOT EXISTS idx_call_scripts_is_active ON public.call_scripts(is_active);
CREATE INDEX IF NOT EXISTS idx_store_emails_is_active ON public.store_emails(is_active);
CREATE INDEX IF NOT EXISTS idx_live_reply_templates_category_id ON public.live_reply_templates(category_id);
CREATE INDEX IF NOT EXISTS idx_live_reply_templates_genre_id ON public.live_reply_templates(genre_id);
CREATE INDEX IF NOT EXISTS idx_live_reply_templates_group_id ON public.live_reply_templates(group_id);
CREATE INDEX IF NOT EXISTS idx_live_reply_templates_is_active ON public.live_reply_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_email_templates_category_id ON public.email_templates(category_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_genre_id ON public.email_templates(genre_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_is_active ON public.email_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_personal_notes_user_id ON public.personal_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_template_genres_category_id ON public.template_genres(category_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_id ON public.usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_timestamp ON public.usage_tracking(timestamp);
CREATE INDEX IF NOT EXISTS idx_sessions_expire ON public.sessions(expire);
CREATE INDEX IF NOT EXISTS idx_announcement_views_user_id ON public.announcement_views(user_id);

-- Add updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_template_categories_updated_at BEFORE UPDATE ON public.template_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_template_genres_updated_at BEFORE UPDATE ON public.template_genres FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_call_scripts_updated_at BEFORE UPDATE ON public.call_scripts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_store_emails_updated_at BEFORE UPDATE ON public.store_emails FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_live_reply_templates_updated_at BEFORE UPDATE ON public.live_reply_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON public.email_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_live_reply_template_groups_updated_at BEFORE UPDATE ON public.live_reply_template_groups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_personal_notes_updated_at BEFORE UPDATE ON public.personal_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_template_variables_updated_at BEFORE UPDATE ON public.template_variables FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_faq_updated_at BEFORE UPDATE ON public.faq FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_site_content_updated_at BEFORE UPDATE ON public.site_content FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_template_colors_updated_at BEFORE UPDATE ON public.template_colors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_reply_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_reply_template_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_views ENABLE ROW LEVEL SECURITY;

-- Add foreign key constraints after table creation
ALTER TABLE public.template_genres 
ADD CONSTRAINT template_genres_category_id_fkey 
FOREIGN KEY (category_id) REFERENCES public.template_categories(id) ON DELETE SET NULL;

ALTER TABLE public.call_scripts 
ADD CONSTRAINT call_scripts_category_id_fkey 
FOREIGN KEY (category_id) REFERENCES public.template_categories(id) ON DELETE SET NULL;

ALTER TABLE public.call_scripts 
ADD CONSTRAINT call_scripts_genre_id_fkey 
FOREIGN KEY (genre_id) REFERENCES public.template_genres(id) ON DELETE SET NULL;

ALTER TABLE public.call_scripts 
ADD CONSTRAINT call_scripts_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.store_emails 
ADD CONSTRAINT store_emails_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.live_reply_templates 
ADD CONSTRAINT live_reply_templates_category_id_fkey 
FOREIGN KEY (category_id) REFERENCES public.template_categories(id) ON DELETE SET NULL;

ALTER TABLE public.live_reply_templates 
ADD CONSTRAINT live_reply_templates_genre_id_fkey 
FOREIGN KEY (genre_id) REFERENCES public.template_genres(id) ON DELETE SET NULL;

ALTER TABLE public.live_reply_templates 
ADD CONSTRAINT live_reply_templates_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.email_templates 
ADD CONSTRAINT email_templates_category_id_fkey 
FOREIGN KEY (category_id) REFERENCES public.template_categories(id) ON DELETE SET NULL;

ALTER TABLE public.email_templates 
ADD CONSTRAINT email_templates_genre_id_fkey 
FOREIGN KEY (genre_id) REFERENCES public.template_genres(id) ON DELETE SET NULL;

ALTER TABLE public.email_templates 
ADD CONSTRAINT email_templates_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.personal_notes 
ADD CONSTRAINT personal_notes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.usage_tracking 
ADD CONSTRAINT usage_tracking_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.announcement_views 
ADD CONSTRAINT announcement_views_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Create RLS policies (allow all for authenticated users)
CREATE POLICY "Allow authenticated users full access" ON public.users FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users full access" ON public.template_categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users full access" ON public.template_genres FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users full access" ON public.call_scripts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users full access" ON public.store_emails FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users full access" ON public.live_reply_templates FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users full access" ON public.email_templates FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users full access" ON public.live_reply_template_groups FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users full access" ON public.personal_notes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users full access" ON public.template_variables FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users full access" ON public.faq FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users full access" ON public.site_content FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users full access" ON public.template_colors FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users full access" ON public.usage_tracking FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users full access" ON public.announcement_views FOR ALL USING (auth.role() = 'authenticated');

-- Insert default template variables
INSERT INTO public.template_variables (name, description, category) VALUES
('customer_name', 'Customer full name', 'Customer Info'),
('customer_first_name', 'Customer first name', 'Customer Info'),
('customer_phone', 'Customer phone number', 'Customer Info'),
('customer_email', 'Customer email address', 'Customer Info'),
('order_id', 'Order ID number', 'Order Info'),
('awb_number', 'AWB tracking number', 'Order Info'),
('delivery_date', 'Expected delivery date', 'Order Info'),
('agent_name', 'Agent name', 'Agent Info'),
('agent_arabic_name', 'Agent Arabic name', 'Agent Info'),
('gender_title', 'Gender-based title (Sir/Ma''am)', 'Customer Info')
ON CONFLICT (name) DO NOTHING;

-- Insert default site content
INSERT INTO public.site_content (key, value, description) VALUES
('site_name', 'BFL Customer Service Helper', 'Main site name'),
('company_name', 'Brands For Less', 'Company name'),
('support_email', 'support@brandsforless.com', 'Support email address'),
('about_content', 'Professional customer service management platform', 'About page content')
ON CONFLICT (key) DO NOTHING;

-- Insert sample template categories
INSERT INTO public.template_categories (id, name, description, color, order_index) VALUES
(uuid_generate_v4(), 'Greeting', 'Welcome and greeting templates', '#00C851', 0),
(uuid_generate_v4(), 'Order Support', 'Order-related support templates', '#33B5E5', 1),
(uuid_generate_v4(), 'Returns', 'Return and refund templates', '#FF4444', 2),
(uuid_generate_v4(), 'Technical', 'Technical support templates', '#9C27B0', 3),
(uuid_generate_v4(), 'Closure', 'Conversation ending templates', '#FF9800', 4)
ON CONFLICT DO NOTHING;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'BFL Customer Service Helper database setup completed successfully!';
    RAISE NOTICE 'Tables created: users, template_categories, template_genres, call_scripts, store_emails, live_reply_templates, email_templates, live_reply_template_groups, personal_notes, template_variables, faq, site_content, template_colors, usage_tracking, sessions, announcement_views';
    RAISE NOTICE 'Indexes and triggers have been set up for optimal performance.';
    RAISE NOTICE 'Row Level Security (RLS) has been enabled with appropriate policies.';
    RAISE NOTICE 'Default data has been inserted for template variables, site content, and sample categories.';
END $$;