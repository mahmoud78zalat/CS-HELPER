-- Complete site content table fix
-- Run this in Supabase SQL Editor to completely recreate the table with proper schema

-- Step 1: Drop all related policies first
DROP POLICY IF EXISTS "Allow authenticated users to read site content" ON public.site_content;
DROP POLICY IF EXISTS "Allow admins to modify site content" ON public.site_content;

-- Step 2: Drop the table completely
DROP TABLE IF EXISTS public.site_content CASCADE;

-- Step 3: Create the table with exact schema expected by the application
CREATE TABLE public.site_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR UNIQUE NOT NULL,
    content TEXT NOT NULL,
    updated_by VARCHAR NOT NULL REFERENCES public.users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    supabase_id UUID UNIQUE,
    last_synced_at TIMESTAMP WITH TIME ZONE
);

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_site_content_key ON public.site_content(key);
CREATE INDEX IF NOT EXISTS idx_site_content_updated_by ON public.site_content(updated_by);

-- Step 5: Insert test data to verify schema works
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

-- Step 6: Set up proper RLS policies
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- Policy for reading (all authenticated users)
CREATE POLICY "site_content_select_policy" ON public.site_content
    FOR SELECT USING (true);

-- Policy for insert/update/delete (admins only)
CREATE POLICY "site_content_modify_policy" ON public.site_content
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid()::text 
            AND users.role = 'admin'
        )
    );

-- Step 7: Grant permissions
GRANT SELECT ON public.site_content TO authenticated;
GRANT ALL ON public.site_content TO authenticated;

-- Step 8: Verify the table was created correctly
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'site_content'
ORDER BY ordinal_position;

-- Step 9: Verify data was inserted
SELECT * FROM public.site_content ORDER BY key;

-- Step 10: Test manual insert to verify schema works
INSERT INTO public.site_content (key, content, updated_by) 
VALUES ('test_key', 'test content', 'admin-user') 
ON CONFLICT (key) DO UPDATE SET content = EXCLUDED.content;

SELECT 'Site content table setup completed successfully!' as status;