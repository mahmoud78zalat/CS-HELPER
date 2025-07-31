// Fix the announcements table by removing the created_by column that's causing issues
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixAnnouncementsTable() {
  try {
    console.log('🔧 Checking announcements table schema...');
    
    // Check if created_by column exists
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'announcements')
      .eq('column_name', 'created_by');

    if (columnsError) {
      console.error('❌ Error checking table schema:', columnsError);
      return;
    }

    if (columns && columns.length > 0) {
      console.log('🗑️  Dropping created_by column from announcements table...');
      
      // Drop the created_by column using raw SQL
      const { error: dropError } = await supabase.rpc('exec_sql', {
        query: 'ALTER TABLE announcements DROP COLUMN IF EXISTS created_by;'
      });

      if (dropError) {
        console.error('❌ Error dropping column:', dropError);
        // Try alternative approach
        console.log('🔄 Trying alternative approach...');
        
        const { error: altDropError } = await supabase
          .from('announcements')
          .update({}) // This should fail and show us the actual schema
          .eq('id', 'non-existent-id');

        console.log('Alternative approach result:', altDropError);
      } else {
        console.log('✅ Successfully dropped created_by column');
      }
    } else {
      console.log('ℹ️  created_by column does not exist in announcements table');
    }

    // Test announcement creation
    console.log('🧪 Testing announcement creation...');
    const { data: testAnnouncement, error: createError } = await supabase
      .from('announcements')
      .insert({
        title: 'Test Announcement',
        content: 'This is a test announcement to verify the schema fix',
        is_active: false,
        background_color: '#3b82f6',
        text_color: '#ffffff',
        border_color: '#1d4ed8',
        priority: 'low'
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Test announcement creation failed:', createError);
    } else {
      console.log('✅ Test announcement created successfully:', testAnnouncement.id);
      
      // Clean up test announcement
      await supabase
        .from('announcements')
        .delete()
        .eq('id', testAnnouncement.id);
      
      console.log('🧹 Cleaned up test announcement');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixAnnouncementsTable();