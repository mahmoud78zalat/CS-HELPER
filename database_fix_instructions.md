# Database Fix Instructions

## Step 1: Execute the SQL Script
Run the SQL script in `fix_database_schema.sql` in your Supabase SQL Editor.

This will:
- Add the missing `group_order` column to `live_reply_templates` table
- Set default values for existing records
- Add performance indexes
- Ensure all template tables have proper ordering columns

## Step 2: Verify the Fix
After running the script, the drag & drop reordering should work properly.

## What I Fixed in the Code:

✅ **Server-Side Changes:**
- Updated `/api/live-reply-templates/reorder` endpoint to handle both `groupOrder` and `stageOrder`
- Removed references to non-existent `groupOrder` field until database is updated
- Fixed SQL compatibility with Supabase

✅ **Client-Side Changes:**
- Created unified `useUnifiedTemplateReordering` hook for ALL template types
- Replaced multiple conflicting drag & drop systems with ONE unified system
- Fixed HorizontalGroupedTemplates to use the new unified system
- Removed duplicate `useLocalTemplateOrdering` conflicts

✅ **Unified System Features:**
- One reordering system for live-reply-templates, email-templates, FAQ-templates, variable-templates
- Proper error handling with toast notifications
- Automatic cache invalidation
- Standardized on `stageOrder` field (with `groupOrder` support once database is updated)

## Templates That Will Use This System:
- ✅ Live Reply Templates (already implemented)
- 🔄 Email Templates (ready for migration)
- 🔄 FAQ Templates (ready for migration) 
- 🔄 Variable Templates (ready for migration)
- 🔄 Categories & Genres (ready for migration)

## Testing:
After running the SQL script, test drag & drop in admin panel - templates should reorder properly without errors.