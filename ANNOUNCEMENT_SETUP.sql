-- ==========================================
-- ANNOUNCEMENT SYSTEM - DATABASE SETUP
-- ==========================================
-- Execute this script in your Supabase SQL Editor to add announcement functionality
-- This adds announcement tables to the existing customer service platform

-- ==========================================
-- 1. ANNOUNCEMENTS TABLE - Global system announcements
-- ==========================================
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT false NOT NULL,
    background_color TEXT DEFAULT '#3b82f6' NOT NULL,
    text_color TEXT DEFAULT '#ffffff' NOT NULL,
    border_color TEXT DEFAULT '#1d4ed8' NOT NULL,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')) NOT NULL,
    created_by TEXT NOT NULL REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 2. USER ANNOUNCEMENT ACKNOWLEDGMENTS - Track which users have seen announcements
-- ==========================================
CREATE TABLE IF NOT EXISTS public.user_announcement_acks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES public.users(id),
    announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
    acknowledged_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, announcement_id)
);

-- ==========================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_announcements_active ON public.announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON public.announcements(priority);
CREATE INDEX IF NOT EXISTS idx_announcements_created_by ON public.announcements(created_by);
CREATE INDEX IF NOT EXISTS idx_user_acks_user_id ON public.user_announcement_acks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_acks_announcement_id ON public.user_announcement_acks(announcement_id);

-- ==========================================
-- 4. ADD UPDATE TRIGGERS FOR TIMESTAMPS
-- ==========================================

-- First, ensure the trigger function exists (or create it)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Then, create the trigger
DROP TRIGGER IF EXISTS trigger_update_announcements_updated_at ON public.announcements;

CREATE TRIGGER trigger_update_announcements_updated_at
    BEFORE UPDATE ON public.announcements
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_announcement_acks ENABLE ROW LEVEL SECURITY;

-- Policies for Announcements
CREATE POLICY "Users can view active announcements" ON public.announcements
    FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admin users can manage announcements" ON public.announcements
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid()::text AND role = 'admin'
        )
    );

-- Policies for Acknowledgments
CREATE POLICY "Users can manage their own acknowledgments" ON public.user_announcement_acks
    FOR ALL
    USING (user_id = auth.uid()::text);

CREATE POLICY "Admin can view all acknowledgments" ON public.user_announcement_acks
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid()::text AND role = 'admin'
        )
    );

-- ==========================================
-- 6. SAMPLE ANNOUNCEMENT DATA (Optional)
-- ==========================================
-- This inserts one active announcement using the first admin found in users table.
-- You can delete this after testing.
INSERT INTO public.announcements (
    title,
    content,
    is_active,
    background_color,
    text_color,
    priority,
    created_by
)
SELECT
    'Welcome to the Enhanced Platform!',
    'We''ve added a new announcement system to keep you informed about important updates and news. Click "Got it" to dismiss this message.',
    true,
    '#10b981',
    '#ffffff',
    'medium',
    id
FROM public.users
WHERE role = 'admin'
LIMIT 1
ON CONFLICT DO NOTHING;

-- ==========================================
-- 7. VERIFICATION - Count rows
-- ==========================================
SELECT 'Announcements table created' AS status, COUNT(*) AS record_count FROM public.announcements
UNION ALL
SELECT 'User acknowledgments table created' AS status, COUNT(*) AS record_count FROM public.user_announcement_acks;

-- Final success message
SELECT '✅ Announcement system setup completed successfully!' AS message;
