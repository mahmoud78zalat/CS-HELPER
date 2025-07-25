-- Create dynamic categories and genres tables
-- Execute this in your Supabase SQL Editor

-- Create template_categories table for live chat templates
CREATE TABLE IF NOT EXISTS template_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_by TEXT DEFAULT 'system',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_template_categories_active ON template_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_template_categories_name ON template_categories(name);

-- Create email_categories table for email templates
CREATE TABLE IF NOT EXISTS email_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_by TEXT DEFAULT 'system',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_categories_active ON email_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_email_categories_name ON email_categories(name);

-- Create template_genres table for both template types
CREATE TABLE IF NOT EXISTS template_genres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_by TEXT DEFAULT 'system',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_template_genres_active ON template_genres(is_active);
CREATE INDEX IF NOT EXISTS idx_template_genres_name ON template_genres(name);

-- Create concerned_teams table for email templates
CREATE TABLE IF NOT EXISTS concerned_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_by TEXT DEFAULT 'system',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_concerned_teams_active ON concerned_teams(is_active);
CREATE INDEX IF NOT EXISTS idx_concerned_teams_name ON concerned_teams(name);

-- Populate template_categories from existing live_reply_templates
INSERT INTO template_categories (name, description, is_active)
SELECT DISTINCT category, 'Live chat template category: ' || category, true
FROM live_reply_templates 
WHERE category IS NOT NULL AND category != '' AND is_active = true
ON CONFLICT (name) DO NOTHING;

-- Populate email_categories from existing email_templates
INSERT INTO email_categories (name, description, is_active)
SELECT DISTINCT category, 'Email template category: ' || category, true
FROM email_templates 
WHERE category IS NOT NULL AND category != '' AND is_active = true
ON CONFLICT (name) DO NOTHING;

-- Populate template_genres from both template types
WITH all_genres AS (
  SELECT DISTINCT genre FROM live_reply_templates WHERE genre IS NOT NULL AND genre != '' AND is_active = true
  UNION
  SELECT DISTINCT genre FROM email_templates WHERE genre IS NOT NULL AND genre != '' AND is_active = true
)
INSERT INTO template_genres (name, description, is_active)
SELECT genre, 'Template genre: ' || genre, true
FROM all_genres
ON CONFLICT (name) DO NOTHING;

-- Populate concerned_teams from email_templates
INSERT INTO concerned_teams (name, description, is_active)
SELECT DISTINCT concerned_team, 'Concerned team: ' || concerned_team, true
FROM email_templates 
WHERE concerned_team IS NOT NULL AND concerned_team != '' AND is_active = true
ON CONFLICT (name) DO NOTHING;