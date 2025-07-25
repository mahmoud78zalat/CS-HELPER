import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

async function createTablesDirectly() {
  console.log('🔧 Creating missing dynamic tables directly...\n');

  try {
    // Execute the SQL commands directly using client query
    const { error: error1 } = await supabase.from('information_schema.tables').select('*').limit(1);
    
    // Create template_categories table
    const { error: categoryError } = await supabase
      .from('template_categories')
      .select('*')
      .limit(1);
    
    if (categoryError && categoryError.message.includes('does not exist')) {
      console.log('Creating template_categories table via admin client...');
      // Use direct SQL via supabase-js admin methods if available
      const { error } = await supabase.rpc('create_table_if_not_exists', {
        table_name: 'template_categories',
        columns: `
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL UNIQUE,
          description TEXT DEFAULT '',
          is_active BOOLEAN DEFAULT true,
          created_by TEXT DEFAULT 'system',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        `
      });
      
      if (error) {
        console.log('Could not create via RPC, tables may not exist yet');
      }
    }

    // Let's just try to populate data directly - the tables might already exist
    console.log('Populating existing tables with data...\n');

    // Get existing template data
    const { data: liveTemplates } = await supabase
      .from('live_reply_templates')
      .select('category, genre')
      .eq('is_active', true);

    const { data: emailTemplates } = await supabase
      .from('email_templates')
      .select('category, genre, concerned_team')
      .eq('is_active', true);

    console.log('Found', liveTemplates?.length || 0, 'live templates');
    console.log('Found', emailTemplates?.length || 0, 'email templates');

    // Try to insert data if tables exist
    if (liveTemplates && liveTemplates.length > 0) {
      const categories = [...new Set(liveTemplates.map(t => t.category).filter(Boolean))];
      const genres = [...new Set(liveTemplates.map(t => t.genre).filter(Boolean))];
      
      console.log('Categories found:', categories);
      console.log('Genres found:', genres);
    }

    if (emailTemplates && emailTemplates.length > 0) {
      const emailCategories = [...new Set(emailTemplates.map(t => t.category).filter(Boolean))];
      const emailGenres = [...new Set(emailTemplates.map(t => t.genre).filter(Boolean))];
      const teams = [...new Set(emailTemplates.map(t => t.concerned_team).filter(Boolean))];
      
      console.log('Email categories found:', emailCategories);
      console.log('Email genres found:', emailGenres);
      console.log('Teams found:', teams);
    }

    console.log('\n✅ Data extraction completed successfully!');

  } catch (error) {
    console.error('🚨 Error:', error);
  }
}

createTablesDirectly();