-- Create missing tables for Template Variables and Color Settings
-- Execute this SQL script in your Supabase SQL editor

-- 1. Create template_variables table
CREATE TABLE IF NOT EXISTS public.template_variables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'custom',
    example TEXT NOT NULL DEFAULT '',
    default_value TEXT,
    is_system BOOLEAN NOT NULL DEFAULT false,
    created_by TEXT NOT NULL DEFAULT 'system',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create template_variable_categories table
CREATE TABLE IF NOT EXISTS public.template_variable_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT 'bg-gray-100 text-gray-800',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by TEXT NOT NULL DEFAULT 'system',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create color_settings table
CREATE TABLE IF NOT EXISTS public.color_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL CHECK (entity_type IN ('genre', 'category')),
    entity_name TEXT NOT NULL,
    background_color TEXT NOT NULL DEFAULT 'bg-gray-100',
    text_color TEXT NOT NULL DEFAULT 'text-gray-800',
    border_color TEXT NOT NULL DEFAULT 'border-gray-200',
    created_by TEXT NOT NULL DEFAULT 'system',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(entity_type, entity_name)
);

-- 4. Insert default template variable categories
INSERT INTO public.template_variable_categories (name, display_name, color) VALUES
('customer', 'Customer Data', 'bg-blue-100 text-blue-800'),
('order', 'Order Information', 'bg-green-100 text-green-800'),
('system', 'System Variables', 'bg-purple-100 text-purple-800'),
('time', 'Time & Date', 'bg-orange-100 text-orange-800'),
('custom', 'Custom Variables', 'bg-gray-100 text-gray-800')
ON CONFLICT (name) DO NOTHING;

-- 5. Insert some default template variables
INSERT INTO public.template_variables (name, description, category, example, is_system) VALUES
-- Customer Variables
('customer_name', 'Customer full name', 'customer', 'John Smith', true),
('customer_email', 'Customer email address', 'customer', 'john@example.com', true),
('customer_phone', 'Customer phone number', 'customer', '+1234567890', true),
('customer_country', 'Customer country', 'customer', 'United States', true),

-- Order Variables
('order_id', 'Order identification number', 'order', 'A1234567890123', true),
('awb_number', 'Air waybill tracking number', 'order', 'AWB1234567890', true),
('order_status', 'Current order status', 'order', 'In Transit', true),
('tracking_number', 'Package tracking number', 'order', 'TRK1234567890', true),

-- System Variables
('agent_name', 'Customer service agent name', 'system', 'Support Team', true),
('company_name', 'Company name', 'system', 'Brands For Less', true),
('support_email', 'Support contact email', 'system', 'support@brandsforless.com', true),

-- Time Variables
('current_date', 'Current date', 'time', '2025-01-25', true),
('current_time', 'Current time', 'time', '10:30 AM', true),
('delivery_date', 'Expected delivery date', 'time', '2025-01-30', true)

ON CONFLICT (name) DO NOTHING;

-- 6. Add RLS (Row Level Security) policies
ALTER TABLE public.template_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_variable_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.color_settings ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (you can customize these policies)
CREATE POLICY "Allow all for authenticated users" ON public.template_variables
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON public.template_variable_categories
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON public.color_settings
    FOR ALL USING (auth.role() = 'authenticated');

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_template_variables_category ON public.template_variables(category);
CREATE INDEX IF NOT EXISTS idx_template_variables_is_system ON public.template_variables(is_system);
CREATE INDEX IF NOT EXISTS idx_color_settings_entity ON public.color_settings(entity_type, entity_name);

-- 8. Grant necessary permissions
GRANT ALL ON public.template_variables TO authenticated;
GRANT ALL ON public.template_variable_categories TO authenticated;
GRANT ALL ON public.color_settings TO authenticated;

-- 9. Add functions to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for auto-updating timestamps
CREATE TRIGGER update_template_variables_updated_at 
    BEFORE UPDATE ON public.template_variables 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_template_variable_categories_updated_at 
    BEFORE UPDATE ON public.template_variable_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_color_settings_updated_at 
    BEFORE UPDATE ON public.color_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Complete! Your template variables and color settings functionality should now work properly.