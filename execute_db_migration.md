# Database Migration Instructions

## Step 1: Execute the SQL Script

Copy the entire content from `supabase_schema.sql` and paste it into your Supabase SQL Editor, then click "Run".

The script will:
- ✅ Create the `template_categories` table if it doesn't exist
- ✅ Add missing columns (`color`, `order_index`) to existing tables
- ✅ Create the `template_genres` table if it doesn't exist  
- ✅ Add the `category_id` foreign key column to `template_genres`
- ✅ Set up foreign key relationships between categories and genres
- ✅ Insert sample data with conflict resolution (won't duplicate existing records)
- ✅ Create proper indexes for performance

## Step 2: Verify the Migration

After running the script, you can verify it worked by running these queries in Supabase:

```sql
-- Check template_categories structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'template_categories' 
ORDER BY ordinal_position;

-- Check template_genres structure  
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'template_genres' 
ORDER BY ordinal_position;

-- Check sample data was inserted
SELECT tc.name as category, tg.name as genre 
FROM template_categories tc 
LEFT JOIN template_genres tg ON tc.id = tg.category_id 
ORDER BY tc.order_index, tg.order_index;
```

## Step 3: Test the Connected Config

1. Open your BFL Customer Service Helper app
2. Go to Admin Panel → Connected Config tab
3. You should see the hierarchical categories and genres system
4. Test creating new categories and genres to ensure everything works

## What This Enables

- **Hierarchical Organization**: Categories contain their own genres
- **Better Template Management**: Templates can be organized by category → genre hierarchy  
- **Improved Email Composer**: Variable management area is now resizable (25-50% width)
- **Connected Relationships**: Proper foreign key constraints ensure data integrity

The system is now ready for the connected template management workflow!