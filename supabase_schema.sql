-- Supabase SQL script to create connected categories and genres tables
-- Execute this manually in your Supabase SQL editor

-- Step 1: Create template_categories table (parent) if it doesn't exist
CREATE TABLE IF NOT EXISTS template_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 1.5: Add missing columns to template_categories if they don't exist
DO $$
BEGIN
    -- Add color column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'template_categories' AND column_name = 'color') THEN
        ALTER TABLE template_categories ADD COLUMN color VARCHAR DEFAULT '#3b82f6' NOT NULL;
    END IF;
    
    -- Add order_index column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'template_categories' AND column_name = 'order_index') THEN
        ALTER TABLE template_categories ADD COLUMN order_index INTEGER DEFAULT 0 NOT NULL;
    END IF;
END $$;

-- Step 2: Add category_id column to existing template_genres table
-- Check if the column exists first, then add it if it doesn't
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'template_genres' AND column_name = 'category_id') THEN
        ALTER TABLE template_genres ADD COLUMN category_id UUID;
    END IF;
END $$;

-- Step 3: Make sure template_genres table has the right structure
-- Add missing columns if they don't exist
DO $$
BEGIN
    -- Add color column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'template_genres' AND column_name = 'color') THEN
        ALTER TABLE template_genres ADD COLUMN color VARCHAR DEFAULT '#10b981' NOT NULL;
    END IF;
    
    -- Add order_index column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'template_genres' AND column_name = 'order_index') THEN
        ALTER TABLE template_genres ADD COLUMN order_index INTEGER DEFAULT 0 NOT NULL;
    END IF;
END $$;

-- Step 4: Add foreign key constraint (after ensuring category_id exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'template_genres_category_id_fkey' 
                   AND table_name = 'template_genres') THEN
        ALTER TABLE template_genres 
        ADD CONSTRAINT template_genres_category_id_fkey 
        FOREIGN KEY (category_id) REFERENCES template_categories(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_template_genres_category_id ON template_genres(category_id);
CREATE INDEX IF NOT EXISTS idx_template_categories_active ON template_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_template_genres_active ON template_genres(is_active);

-- Insert some sample categories (only after ensuring columns exist)
DO $$
BEGIN
    -- Insert sample data only if columns exist
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'template_categories' AND column_name = 'color') 
    AND EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'template_categories' AND column_name = 'order_index') THEN
        
        INSERT INTO template_categories (name, description, color, order_index) VALUES
        ('Delivery Problems', 'Issues related to delivery and shipping', '#ef4444', 0),
        ('General', 'General customer service inquiries', '#3b82f6', 1),
        ('Order Issues', 'Problems with orders and purchases', '#f59e0b', 2),
        ('Product Inquiry', 'Questions about products and services', '#10b981', 3),
        ('Return follow ups', 'Follow-up communications for returns', '#8b5cf6', 4)
        ON CONFLICT (name) DO NOTHING;
        
    ELSE
        -- Fallback: insert without color and order_index if columns don't exist
        INSERT INTO template_categories (name, description) VALUES
        ('Delivery Problems', 'Issues related to delivery and shipping'),
        ('General', 'General customer service inquiries'),
        ('Order Issues', 'Problems with orders and purchases'),
        ('Product Inquiry', 'Questions about products and services'),
        ('Return follow ups', 'Follow-up communications for returns')
        ON CONFLICT (name) DO NOTHING;
    END IF;
END $$;

-- Insert some sample genres connected to categories
DO $$
BEGIN
    -- Only insert if category_id column exists and has foreign key constraint
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'template_genres' AND column_name = 'category_id') THEN
        
        -- Insert with ON CONFLICT handling
        INSERT INTO template_genres (name, description, category_id, color, order_index) 
        SELECT 
            'Delayed Delivery', 
            'Templates for delayed delivery issues', 
            tc.id, 
            '#ef4444', 
            0
        FROM template_categories tc WHERE tc.name = 'Delivery Problems'
        ON CONFLICT (name) DO UPDATE SET
            description = EXCLUDED.description,
            category_id = EXCLUDED.category_id,
            color = EXCLUDED.color,
            order_index = EXCLUDED.order_index;
    END IF;
END $$;

DO $$
BEGIN
    -- Insert additional sample genres if category_id column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'template_genres' AND column_name = 'category_id') THEN
        
        -- Insert genres for Delivery Problems
        INSERT INTO template_genres (name, description, category_id, color, order_index) 
        SELECT 'Lost Package', 'Templates for lost package situations', tc.id, '#dc2626', 1
        FROM template_categories tc WHERE tc.name = 'Delivery Problems'
        ON CONFLICT (name) DO UPDATE SET
            description = EXCLUDED.description,
            category_id = EXCLUDED.category_id,
            color = EXCLUDED.color,
            order_index = EXCLUDED.order_index;

        -- Insert genres for General (use different names to avoid conflicts)
        INSERT INTO template_genres (name, description, category_id, color, order_index) 
        SELECT 'Standard Response', 'General standard responses', tc.id, '#3b82f6', 0
        FROM template_categories tc WHERE tc.name = 'General'
        ON CONFLICT (name) DO UPDATE SET
            description = EXCLUDED.description,
            category_id = EXCLUDED.category_id,
            color = EXCLUDED.color,
            order_index = EXCLUDED.order_index;

        INSERT INTO template_genres (name, description, category_id, color, order_index) 
        SELECT 'General Greeting', 'Welcome and greeting templates', tc.id, '#06b6d4', 1
        FROM template_categories tc WHERE tc.name = 'General'
        ON CONFLICT (name) DO UPDATE SET
            description = EXCLUDED.description,
            category_id = EXCLUDED.category_id,
            color = EXCLUDED.color,
            order_index = EXCLUDED.order_index;

        -- Insert genres for Order Issues
        INSERT INTO template_genres (name, description, category_id, color, order_index) 
        SELECT 'Wrong Order', 'Templates for incorrect orders', tc.id, '#f59e0b', 0
        FROM template_categories tc WHERE tc.name = 'Order Issues'
        ON CONFLICT (name) DO UPDATE SET
            description = EXCLUDED.description,
            category_id = EXCLUDED.category_id,
            color = EXCLUDED.color,
            order_index = EXCLUDED.order_index;

        INSERT INTO template_genres (name, description, category_id, color, order_index) 
        SELECT 'Order Cancellation', 'Order cancellation templates', tc.id, '#fb923c', 1
        FROM template_categories tc WHERE tc.name = 'Order Issues'
        ON CONFLICT (name) DO UPDATE SET
            description = EXCLUDED.description,
            category_id = EXCLUDED.category_id,
            color = EXCLUDED.color,
            order_index = EXCLUDED.order_index;

        -- Insert genres for Product Inquiry
        INSERT INTO template_genres (name, description, category_id, color, order_index) 
        SELECT 'Product Details', 'Product information inquiries', tc.id, '#10b981', 0
        FROM template_categories tc WHERE tc.name = 'Product Inquiry'
        ON CONFLICT (name) DO UPDATE SET
            description = EXCLUDED.description,
            category_id = EXCLUDED.category_id,
            color = EXCLUDED.color,
            order_index = EXCLUDED.order_index;

        INSERT INTO template_genres (name, description, category_id, color, order_index) 
        SELECT 'Product Availability', 'Product availability questions', tc.id, '#059669', 1
        FROM template_categories tc WHERE tc.name = 'Product Inquiry'
        ON CONFLICT (name) DO UPDATE SET
            description = EXCLUDED.description,
            category_id = EXCLUDED.category_id,
            color = EXCLUDED.color,
            order_index = EXCLUDED.order_index;

        -- Insert genres for Return follow ups
        INSERT INTO template_genres (name, description, category_id, color, order_index) 
        SELECT 'Return Status', 'Return status update templates', tc.id, '#8b5cf6', 0
        FROM template_categories tc WHERE tc.name = 'Return follow ups'
        ON CONFLICT (name) DO UPDATE SET
            description = EXCLUDED.description,
            category_id = EXCLUDED.category_id,
            color = EXCLUDED.color,
            order_index = EXCLUDED.order_index;

        INSERT INTO template_genres (name, description, category_id, color, order_index) 
        SELECT 'Refund Process', 'Refund processing templates', tc.id, '#7c3aed', 1
        FROM template_categories tc WHERE tc.name = 'Return follow ups'
        ON CONFLICT (name) DO UPDATE SET
            description = EXCLUDED.description,
            category_id = EXCLUDED.category_id,
            color = EXCLUDED.color,
            order_index = EXCLUDED.order_index;
        
    END IF;
END $$;

-- Update function for timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic updated_at
CREATE TRIGGER update_template_categories_updated_at 
    BEFORE UPDATE ON template_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_template_genres_updated_at 
    BEFORE UPDATE ON template_genres 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();