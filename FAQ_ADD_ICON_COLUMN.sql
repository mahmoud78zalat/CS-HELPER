-- SQL Migration: Add 'icon' column to FAQs table
-- Run this in your Supabase SQL Editor to add the missing 'icon' column

-- Add the icon column with a default value
ALTER TABLE faqs ADD COLUMN IF NOT EXISTS icon varchar DEFAULT 'HelpCircle';

-- Update existing FAQs with appropriate icons based on their category
UPDATE faqs SET icon = CASE 
  WHEN category = 'general' THEN 'HelpCircle'
  WHEN category = 'account' THEN 'Users'
  WHEN category = 'support' THEN 'MessageCircle'
  WHEN category = 'billing' THEN 'CreditCard'
  WHEN category = 'security' THEN 'Shield'
  WHEN category = 'data' THEN 'Database'
  ELSE 'HelpCircle'
END
WHERE icon IS NULL OR icon = '';

-- Verify the migration
SELECT id, question, category, icon, created_at FROM faqs ORDER BY "order";