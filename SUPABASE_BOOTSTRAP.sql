-- ==============================================
-- CUSTOMER SERVICE PLATFORM - DATABASE BOOTSTRAP
-- ==============================================
-- Version: 2.1.0
-- Compatible with: Supabase PostgreSQL
-- Purpose: Complete database setup for new deployments
-- Run this script once in Supabase SQL Editor
-- ==============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================
-- ENUMS
-- ==============================================

-- User role enumeration
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'agent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- User status enumeration  
DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('active', 'blocked', 'banned');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Announcement priority enumeration
DO $$ BEGIN
    CREATE TYPE announcement_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================
-- CORE TABLES
-- ==============================================

-- Sessions table (required for authentication)
CREATE TABLE IF NOT EXISTS sessions (
    sid VARCHAR NOT NULL COLLATE "default",
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (sid)
);

-- Create index on expire column for sessions
CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions (expire);

-- Users table (core authentication and user management)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY NOT NULL,
    email VARCHAR UNIQUE,
    first_name VARCHAR,
    last_name VARCHAR,
    profile_image_url VARCHAR,
    role user_role DEFAULT 'agent' NOT NULL,
    status user_status DEFAULT 'active' NOT NULL,
    is_online BOOLEAN DEFAULT FALSE NOT NULL,
    last_seen TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    -- Supabase sync fields
    supabase_id UUID UNIQUE DEFAULT uuid_generate_v4(),
    last_synced_at TIMESTAMP
);

-- ==============================================
-- TEMPLATE SYSTEM TABLES
-- ==============================================

-- Live chat reply templates (customer-facing)
CREATE TABLE IF NOT EXISTS live_reply_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    content_en TEXT NOT NULL,
    content_ar TEXT NOT NULL,
    category VARCHAR NOT NULL,
    genre VARCHAR NOT NULL,
    variables TEXT[],
    stage_order INTEGER DEFAULT 1 NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    usage_count INTEGER DEFAULT 0 NOT NULL,
    created_by VARCHAR REFERENCES users(id) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    -- Supabase sync fields
    supabase_id UUID UNIQUE DEFAULT uuid_generate_v4(),
    last_synced_at TIMESTAMP
);

-- Email templates (internal team communication)
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR NOT NULL,
    genre VARCHAR NOT NULL,
    concerned_team VARCHAR NOT NULL,
    warning_note TEXT,
    variables TEXT[],
    stage_order INTEGER DEFAULT 1 NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    usage_count INTEGER DEFAULT 0 NOT NULL,
    created_by VARCHAR REFERENCES users(id) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    -- Supabase sync fields
    supabase_id UUID UNIQUE DEFAULT uuid_generate_v4(),
    last_synced_at TIMESTAMP
);

-- ==============================================
-- TEMPLATE CONFIGURATION TABLES
-- ==============================================

-- Template categories (Orders, Delivery, Technical, etc.)
CREATE TABLE IF NOT EXISTS template_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    -- Supabase sync fields
    supabase_id UUID UNIQUE DEFAULT uuid_generate_v4(),
    last_synced_at TIMESTAMP
);

-- Email categories (separate from template categories)
CREATE TABLE IF NOT EXISTS email_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    -- Supabase sync fields
    supabase_id UUID UNIQUE DEFAULT uuid_generate_v4(),
    last_synced_at TIMESTAMP
);

-- Template genres (Standard, Urgent, Greeting, CSAT, etc.)
CREATE TABLE IF NOT EXISTS template_genres (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    -- Supabase sync fields
    supabase_id UUID UNIQUE DEFAULT uuid_generate_v4(),
    last_synced_at TIMESTAMP
);

-- Concerned teams (Finance, IT Support, Fulfillment, etc.)
CREATE TABLE IF NOT EXISTS concerned_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    -- Supabase sync fields
    supabase_id UUID UNIQUE DEFAULT uuid_generate_v4(),
    last_synced_at TIMESTAMP
);

-- ==============================================
-- ANALYTICS AND USAGE TRACKING
-- ==============================================

-- Live reply template usage tracking
CREATE TABLE IF NOT EXISTS live_reply_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID REFERENCES live_reply_templates(id) NOT NULL,
    user_id VARCHAR REFERENCES users(id) NOT NULL,
    used_at TIMESTAMP DEFAULT NOW(),
    -- Supabase sync fields
    supabase_id UUID UNIQUE DEFAULT uuid_generate_v4(),
    last_synced_at TIMESTAMP
);

-- Email template usage tracking
CREATE TABLE IF NOT EXISTS email_template_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID REFERENCES email_templates(id) NOT NULL,
    user_id VARCHAR REFERENCES users(id) NOT NULL,
    used_at TIMESTAMP DEFAULT NOW(),
    -- Supabase sync fields
    supabase_id UUID UNIQUE DEFAULT uuid_generate_v4(),
    last_synced_at TIMESTAMP
);

-- ==============================================
-- CUSTOMIZATION TABLES
-- ==============================================

-- Site content management (dynamic branding)
CREATE TABLE IF NOT EXISTS site_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR UNIQUE NOT NULL,
    content TEXT NOT NULL,
    updated_by VARCHAR REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT NOW(),
    -- Supabase sync fields
    supabase_id UUID UNIQUE DEFAULT uuid_generate_v4(),
    last_synced_at TIMESTAMP
);

-- Color settings for template badges
CREATE TABLE IF NOT EXISTS color_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR NOT NULL, -- 'genre' or 'category'
    name VARCHAR NOT NULL,
    color VARCHAR NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW(),
    -- Supabase sync fields
    supabase_id UUID UNIQUE DEFAULT uuid_generate_v4(),
    last_synced_at TIMESTAMP,
    UNIQUE(type, name)
);

-- Template variables (system-wide variable management)
CREATE TABLE IF NOT EXISTS template_variables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR NOT NULL,
    example_value TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    -- Supabase sync fields
    supabase_id UUID UNIQUE DEFAULT uuid_generate_v4(),
    last_synced_at TIMESTAMP
);

-- Template variable categories
CREATE TABLE IF NOT EXISTS template_variable_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    -- Supabase sync fields
    supabase_id UUID UNIQUE DEFAULT uuid_generate_v4(),
    last_synced_at TIMESTAMP
);

-- ==============================================
-- COMMUNICATION SYSTEM
-- ==============================================

-- Personal notes (user-specific notes)
CREATE TABLE IF NOT EXISTS personal_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR REFERENCES users(id) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    -- Supabase sync fields
    supabase_id UUID UNIQUE DEFAULT uuid_generate_v4(),
    last_synced_at TIMESTAMP
);

-- Global announcements
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR NOT NULL,
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT FALSE NOT NULL,
    background_color VARCHAR DEFAULT '#3b82f6' NOT NULL,
    text_color VARCHAR DEFAULT '#ffffff' NOT NULL,
    border_color VARCHAR DEFAULT '#1d4ed8' NOT NULL,
    priority announcement_priority DEFAULT 'medium' NOT NULL,
    version INTEGER DEFAULT 1 NOT NULL,
    created_by VARCHAR REFERENCES users(id) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    -- Supabase sync fields
    supabase_id UUID UNIQUE DEFAULT uuid_generate_v4(),
    last_synced_at TIMESTAMP
);

-- Announcement acknowledgments (user tracking)
CREATE TABLE IF NOT EXISTS announcement_acknowledgments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    announcement_id UUID REFERENCES announcements(id) NOT NULL,
    user_id VARCHAR REFERENCES users(id) NOT NULL,
    acknowledged_at TIMESTAMP DEFAULT NOW(),
    announcement_version INTEGER NOT NULL,
    -- Supabase sync fields
    supabase_id UUID UNIQUE DEFAULT uuid_generate_v4(),
    last_synced_at TIMESTAMP,
    UNIQUE(announcement_id, user_id, announcement_version)
);

-- ==============================================
-- INDEXES FOR PERFORMANCE
-- ==============================================

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_is_online ON users(is_online);

-- Template indexes
CREATE INDEX IF NOT EXISTS idx_live_reply_templates_category ON live_reply_templates(category);
CREATE INDEX IF NOT EXISTS idx_live_reply_templates_genre ON live_reply_templates(genre);
CREATE INDEX IF NOT EXISTS idx_live_reply_templates_is_active ON live_reply_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_live_reply_templates_created_by ON live_reply_templates(created_by);

CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_genre ON email_templates(genre);
CREATE INDEX IF NOT EXISTS idx_email_templates_is_active ON email_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_email_templates_created_by ON email_templates(created_by);

-- Usage tracking indexes
CREATE INDEX IF NOT EXISTS idx_live_reply_usage_template_id ON live_reply_usage(template_id);
CREATE INDEX IF NOT EXISTS idx_live_reply_usage_user_id ON live_reply_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_live_reply_usage_used_at ON live_reply_usage(used_at);

CREATE INDEX IF NOT EXISTS idx_email_template_usage_template_id ON email_template_usage(template_id);
CREATE INDEX IF NOT EXISTS idx_email_template_usage_user_id ON email_template_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_email_template_usage_used_at ON email_template_usage(used_at);

-- Site content indexes
CREATE INDEX IF NOT EXISTS idx_site_content_key ON site_content(key);
CREATE INDEX IF NOT EXISTS idx_color_settings_type_name ON color_settings(type, name);

-- Personal notes indexes
CREATE INDEX IF NOT EXISTS idx_personal_notes_user_id ON personal_notes(user_id);

-- Announcement indexes
CREATE INDEX IF NOT EXISTS idx_announcements_is_active ON announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON announcements(priority);
CREATE INDEX IF NOT EXISTS idx_announcement_acks_user_id ON announcement_acknowledgments(user_id);

-- ==============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_reply_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE concerned_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_reply_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_template_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE color_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_variable_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_acknowledgments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public read access and authenticated user access
CREATE POLICY IF NOT EXISTS "Enable read access for all users" ON users FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Enable insert for authenticated users only" ON users FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Enable update for users based on user_id" ON users FOR UPDATE USING (auth.uid()::text = id);

CREATE POLICY IF NOT EXISTS "Enable read access for all users" ON live_reply_templates FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Enable insert for authenticated users only" ON live_reply_templates FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Enable update for template creators" ON live_reply_templates FOR UPDATE USING (auth.uid()::text = created_by);
CREATE POLICY IF NOT EXISTS "Enable delete for template creators" ON live_reply_templates FOR DELETE USING (auth.uid()::text = created_by);

CREATE POLICY IF NOT EXISTS "Enable read access for all users" ON email_templates FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Enable insert for authenticated users only" ON email_templates FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Enable update for template creators" ON email_templates FOR UPDATE USING (auth.uid()::text = created_by);
CREATE POLICY IF NOT EXISTS "Enable delete for template creators" ON email_templates FOR DELETE USING (auth.uid()::text = created_by);

-- Configuration tables - read access for all, insert/update for authenticated
CREATE POLICY IF NOT EXISTS "Enable read access for all users" ON template_categories FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Enable insert for authenticated users only" ON template_categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Enable update for authenticated users only" ON template_categories FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Enable delete for authenticated users only" ON template_categories FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Enable read access for all users" ON email_categories FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Enable insert for authenticated users only" ON email_categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Enable update for authenticated users only" ON email_categories FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Enable delete for authenticated users only" ON email_categories FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Enable read access for all users" ON template_genres FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Enable insert for authenticated users only" ON template_genres FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Enable update for authenticated users only" ON template_genres FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Enable delete for authenticated users only" ON template_genres FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Enable read access for all users" ON concerned_teams FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Enable insert for authenticated users only" ON concerned_teams FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Enable update for authenticated users only" ON concerned_teams FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Enable delete for authenticated users only" ON concerned_teams FOR DELETE USING (auth.role() = 'authenticated');

-- Usage tracking policies
CREATE POLICY IF NOT EXISTS "Enable insert for authenticated users only" ON live_reply_usage FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Enable read access for all users" ON live_reply_usage FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Enable insert for authenticated users only" ON email_template_usage FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Enable read access for all users" ON email_template_usage FOR SELECT USING (true);

-- Site content policies
CREATE POLICY IF NOT EXISTS "Enable read access for all users" ON site_content FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Enable insert for authenticated users only" ON site_content FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Enable update for authenticated users only" ON site_content FOR UPDATE USING (auth.role() = 'authenticated');

-- Color settings policies
CREATE POLICY IF NOT EXISTS "Enable read access for all users" ON color_settings FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Enable insert for authenticated users only" ON color_settings FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Enable update for authenticated users only" ON color_settings FOR UPDATE USING (auth.role() = 'authenticated');

-- Template variables policies
CREATE POLICY IF NOT EXISTS "Enable read access for all users" ON template_variables FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Enable insert for authenticated users only" ON template_variables FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Enable update for authenticated users only" ON template_variables FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Enable read access for all users" ON template_variable_categories FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Enable insert for authenticated users only" ON template_variable_categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Enable update for authenticated users only" ON template_variable_categories FOR UPDATE USING (auth.role() = 'authenticated');

-- Personal notes policies (user-specific)
CREATE POLICY IF NOT EXISTS "Enable access for note owners only" ON personal_notes FOR ALL USING (auth.uid()::text = user_id);

-- Announcement policies
CREATE POLICY IF NOT EXISTS "Enable read access for all users" ON announcements FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Enable insert for authenticated users only" ON announcements FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Enable update for announcement creators" ON announcements FOR UPDATE USING (auth.uid()::text = created_by);

CREATE POLICY IF NOT EXISTS "Enable access for acknowledgment owners only" ON announcement_acknowledgments FOR ALL USING (auth.uid()::text = user_id);

-- ==============================================
-- FUNCTIONS FOR USAGE TRACKING
-- ==============================================

-- Function to increment live reply template usage
CREATE OR REPLACE FUNCTION increment_live_reply_usage(template_uuid UUID, user_uuid TEXT)
RETURNS VOID AS $$
BEGIN
    -- Insert usage record
    INSERT INTO live_reply_usage (template_id, user_id, used_at)
    VALUES (template_uuid, user_uuid, NOW());
    
    -- Increment usage counter
    UPDATE live_reply_templates 
    SET usage_count = usage_count + 1, updated_at = NOW()
    WHERE id = template_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment email template usage
CREATE OR REPLACE FUNCTION increment_email_template_usage(template_uuid UUID, user_uuid TEXT)
RETURNS VOID AS $$
BEGIN
    -- Insert usage record
    INSERT INTO email_template_usage (template_id, user_id, used_at)
    VALUES (template_uuid, user_uuid, NOW());
    
    -- Increment usage counter
    UPDATE email_templates 
    SET usage_count = usage_count + 1, updated_at = NOW()
    WHERE id = template_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- INITIAL SEED DATA
-- ==============================================

-- Insert default template categories
INSERT INTO template_categories (name, description) VALUES
    ('Order Issues', 'Live chat template category: Order Issues'),
    ('Delivery Problems', 'Live chat template category: Delivery Problems'),  
    ('Product Inquiry', 'Live chat template category: Product Inquiry')
ON CONFLICT (name) DO NOTHING;

-- Insert default email categories
INSERT INTO email_categories (name, description) VALUES
    ('Order Issues', 'Email template category: Order Issues')
ON CONFLICT (name) DO NOTHING;

-- Insert default template genres
INSERT INTO template_genres (name, description) VALUES
    ('Standard', 'Template genre: Standard'),
    ('Urgent', 'Template genre: Urgent'),
    ('Apology', 'Template genre: Apology'),
    ('CSAT', 'Template genre: Customer Satisfaction Survey')
ON CONFLICT (name) DO NOTHING;

-- Insert default concerned teams
INSERT INTO concerned_teams (name, description) VALUES
    ('Customer Service', 'Concerned team: Customer Service'),
    ('Technical Support', 'Concerned team: Technical Support')
ON CONFLICT (name) DO NOTHING;

-- Insert default site content
INSERT INTO site_content (key, content) VALUES
    ('site_name', 'Customer Service Platform'),
    ('about_title', 'Customer Service Helper'),
    ('about_description', 'A comprehensive customer service management tool designed to streamline support operations, template management, and team communications.'),
    ('version_label', 'v2.1.0'),
    ('footer_text', 'Professional Customer Service Management'),
    ('company_info', 'Customer Service Management System')
ON CONFLICT (key) DO NOTHING;

-- Insert default color settings
INSERT INTO color_settings (type, name, color) VALUES
    ('genre', 'Standard', '#10b981'),
    ('genre', 'Urgent', '#ef4444'),
    ('genre', 'Apology', '#f59e0b'),
    ('genre', 'CSAT', '#8b5cf6'),
    ('category', 'Order Issues', '#3b82f6'),
    ('category', 'Delivery Problems', '#ef4444'),
    ('category', 'Product Inquiry', '#10b981')
ON CONFLICT (type, name) DO NOTHING;

-- Insert default template variable categories
INSERT INTO template_variable_categories (name, description) VALUES
    ('Customer', 'Customer-related variables'),
    ('Order', 'Order-related variables'),
    ('System', 'System-related variables'),
    ('Time', 'Time-related variables')
ON CONFLICT (name) DO NOTHING;

-- Insert default template variables
INSERT INTO template_variables (name, description, category, example_value) VALUES
    ('customer_name', 'Customer full name', 'Customer', 'John Smith'),
    ('customer_email', 'Customer email address', 'Customer', 'john@example.com'),
    ('customer_phone', 'Customer phone number', 'Customer', '+1234567890'),
    ('order_id', 'Order identification number', 'Order', 'A123456789'),
    ('awb_number', 'Air waybill number', 'Order', 'AWB123456'),
    ('agent_name', 'Support agent name', 'System', 'Sarah Johnson'),
    ('current_date', 'Current date', 'Time', '2025-01-25'),
    ('current_time', 'Current time', 'Time', '10:30 AM'),
    ('time_frame', 'Expected time frame', 'Time', '2-3 business days')
ON CONFLICT (name) DO NOTHING;

-- ==============================================
-- COMPLETION MESSAGE
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'DATABASE BOOTSTRAP COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Configure your environment variables';
    RAISE NOTICE '2. Create your first admin user through the application';
    RAISE NOTICE '3. Customize site content in the admin panel';
    RAISE NOTICE '4. Add your templates and start using the platform';
    RAISE NOTICE '==============================================';
END $$;