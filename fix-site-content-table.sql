-- Fix site_content table schema to match application requirements
-- Run this in Supabase SQL Editor

-- Drop existing table if it exists (backup data first if needed)
DROP TABLE IF EXISTS public.site_content CASCADE;

-- Create site_content table with correct schema (snake_case column names to match existing DB)
CREATE TABLE public.site_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR UNIQUE NOT NULL,
    content TEXT NOT NULL,
    updated_by VARCHAR NOT NULL REFERENCES public.users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    supabase_id UUID UNIQUE,
    last_synced_at TIMESTAMP WITH TIME ZONE
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_site_content_key ON public.site_content(key);
CREATE INDEX IF NOT EXISTS idx_site_content_updated_by ON public.site_content(updated_by);

-- Insert default site content values
INSERT INTO public.site_content (key, content, updated_by) VALUES
('site_name', 'Customer Service Platform', 'admin-user'),
('about_title', 'Customer Service Helper', 'admin-user'),
('about_description', 'A comprehensive customer service management tool designed to streamline support operations, template management, and team communications.', 'admin-user'),
('version_label', 'v2.1.0', 'admin-user'),
('footer_text', 'Made by Mahmoud Zalat', 'admin-user'),
('about_tool', 'Advanced customer service communication platform for streamlined template management.', 'admin-user'),
('company_info', 'Customer Service Management System', 'admin-user')
ON CONFLICT (key) DO UPDATE SET
    content = EXCLUDED.content,
    updated_at = NOW();

-- Enable Row Level Security (optional, for better security)
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read
CREATE POLICY "Allow authenticated users to read site content" ON public.site_content
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create policy to allow admins to modify
CREATE POLICY "Allow admins to modify site content" ON public.site_content
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid()::text 
            AND users.role = 'admin'
        )
    );

-- Grant necessary permissions
GRANT SELECT ON public.site_content TO authenticated;
GRANT ALL ON public.site_content TO authenticated;

SELECT 'Site content table created successfully with proper schema and default values' as result;