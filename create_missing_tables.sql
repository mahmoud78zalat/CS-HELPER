-- SQL Script to create missing database tables for Supabase

-- Create template_variables table
CREATE TABLE IF NOT EXISTS public.template_variables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL UNIQUE,
    description TEXT NOT NULL,
    category VARCHAR NOT NULL,
    example TEXT NOT NULL,
    default_value TEXT,
    is_system BOOLEAN DEFAULT false NOT NULL,
    created_by VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    supabase_id UUID UNIQUE,
    last_synced_at TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Create template_variable_categories table
CREATE TABLE IF NOT EXISTS public.template_variable_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL UNIQUE,
    display_name VARCHAR NOT NULL,
    color VARCHAR DEFAULT '#3b82f6' NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_by VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    supabase_id UUID UNIQUE,
    last_synced_at TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Create color_settings table
CREATE TABLE IF NOT EXISTS public.color_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR NOT NULL, -- 'genre' or 'category'
    entity_name VARCHAR NOT NULL,
    background_color VARCHAR NOT NULL,
    text_color VARCHAR NOT NULL,
    border_color VARCHAR NOT NULL,
    created_by VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    supabase_id UUID UNIQUE,
    last_synced_at TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Insert default template variable categories based on existing template categories
INSERT INTO public.template_variable_categories (name, display_name, color, created_by) 
SELECT 
    LOWER(REPLACE(name, ' ', '_')), 
    name, 
    '#3b82f6', -- Default blue color
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
FROM public.template_categories
ON CONFLICT (name) DO NOTHING;

-- Insert some default template variables
INSERT INTO public.template_variables (name, description, category, example, default_value, is_system, created_by)
VALUES 
    ('customer_name', 'Customer full name', 'customer', 'John Smith', '', true, (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
    ('order_id', 'Order identification number', 'orders', 'ORD-12345', '', true, (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
    ('agent_name', 'Agent full name', 'agent', 'Sarah Johnson', '', true, (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
    ('time_frame', 'Expected timeframe for resolution', 'general', '2-3 business days', '', true, (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
    ('delivery_date', 'Expected delivery date', 'orders', 'January 30th', '', true, (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
    ('item_name', 'Product or item name', 'orders', 'Red Sweater', '', true, (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
    ('waiting_time', 'Expected waiting time', 'general', '5-10 minutes', '', true, (SELECT id FROM users WHERE role = 'admin' LIMIT 1))
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_template_variables_category ON public.template_variables(category);
CREATE INDEX IF NOT EXISTS idx_template_variables_created_by ON public.template_variables(created_by);
CREATE INDEX IF NOT EXISTS idx_color_settings_entity ON public.color_settings(entity_type, entity_name);
CREATE INDEX IF NOT EXISTS idx_template_variable_categories_active ON public.template_variable_categories(is_active);

-- Add unique constraint to prevent duplicate entity color settings (ignore if already exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_entity_color' 
        AND table_name = 'color_settings'
    ) THEN
        ALTER TABLE public.color_settings ADD CONSTRAINT unique_entity_color UNIQUE (entity_type, entity_name);
    END IF;
END $$;