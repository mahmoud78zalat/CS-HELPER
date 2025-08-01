-- SQL Migration for Connected Template Configuration Ordering System
-- Execute this script manually in your database to add ordering support

-- Add orderIndex column to connected_template_categories if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'connected_template_categories' 
        AND column_name = 'order_index'
    ) THEN
        ALTER TABLE connected_template_categories 
        ADD COLUMN order_index INTEGER DEFAULT 0;
        
        -- Update existing records with sequential order
        WITH ordered_categories AS (
            SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) - 1 as new_order
            FROM connected_template_categories
        )
        UPDATE connected_template_categories 
        SET order_index = ordered_categories.new_order
        FROM ordered_categories 
        WHERE connected_template_categories.id = ordered_categories.id;
    END IF;
END $$;

-- Add orderIndex column to connected_template_genres if it doesn't exist  
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'connected_template_genres' 
        AND column_name = 'order_index'
    ) THEN
        ALTER TABLE connected_template_genres 
        ADD COLUMN order_index INTEGER DEFAULT 0;
        
        -- Update existing records with sequential order within each category
        WITH ordered_genres AS (
            SELECT id, ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY created_at) - 1 as new_order
            FROM connected_template_genres
        )
        UPDATE connected_template_genres 
        SET order_index = ordered_genres.new_order
        FROM ordered_genres 
        WHERE connected_template_genres.id = ordered_genres.id;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_connected_categories_order ON connected_template_categories(order_index);
CREATE INDEX IF NOT EXISTS idx_connected_genres_order ON connected_template_genres(category_id, order_index);

-- Verify the changes
SELECT 'Connected Template Categories' as table_name, COUNT(*) as total_records, 
       MIN(order_index) as min_order, MAX(order_index) as max_order
FROM connected_template_categories
UNION ALL
SELECT 'Connected Template Genres' as table_name, COUNT(*) as total_records,
       MIN(order_index) as min_order, MAX(order_index) as max_order  
FROM connected_template_genres;