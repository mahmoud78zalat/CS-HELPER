-- Connected Template Configuration Ordering System Migration
-- Execute this manually in your Supabase SQL editor if ordering system is needed

-- This migration adds ordering columns to support drag & drop functionality
-- for connected template categories and genres

-- Add order_index columns if they don't exist
DO $$
BEGIN
    -- Add order_index to template_categories if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'template_categories' AND column_name = 'order_index') THEN
        ALTER TABLE template_categories ADD COLUMN order_index INTEGER DEFAULT 0 NOT NULL;
        
        -- Update existing records with incremental order values
        WITH ordered_categories AS (
            SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) - 1 as new_order
            FROM template_categories
        )
        UPDATE template_categories 
        SET order_index = ordered_categories.new_order
        FROM ordered_categories 
        WHERE template_categories.id = ordered_categories.id;
        
        RAISE NOTICE 'Added order_index column to template_categories';
    END IF;
    
    -- Add order_index to template_genres if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'template_genres' AND column_name = 'order_index') THEN
        ALTER TABLE template_genres ADD COLUMN order_index INTEGER DEFAULT 0 NOT NULL;
        
        -- Update existing records with incremental order values within each category
        WITH ordered_genres AS (
            SELECT id, ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY created_at) - 1 as new_order
            FROM template_genres
        )
        UPDATE template_genres 
        SET order_index = ordered_genres.new_order
        FROM ordered_genres 
        WHERE template_genres.id = ordered_genres.id;
        
        RAISE NOTICE 'Added order_index column to template_genres';
    END IF;
END $$;

-- Create indexes for better performance on ordering queries
CREATE INDEX IF NOT EXISTS idx_template_categories_order ON template_categories(order_index);
CREATE INDEX IF NOT EXISTS idx_template_genres_category_order ON template_genres(category_id, order_index);

-- Verify the migration
SELECT 
    'template_categories' as table_name,
    COUNT(*) as total_records,
    MIN(order_index) as min_order,
    MAX(order_index) as max_order
FROM template_categories
WHERE is_active = true

UNION ALL

SELECT 
    'template_genres' as table_name,
    COUNT(*) as total_records,
    MIN(order_index) as min_order,
    MAX(order_index) as max_order
FROM template_genres
WHERE is_active = true;