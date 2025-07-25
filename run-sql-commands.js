import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

async function executeSQLCommands() {
  console.log('🚀 Executing SQL commands to create dynamic tables...\n');

  const commands = [
    // Create template_categories table
    `CREATE TABLE IF NOT EXISTS template_categories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL UNIQUE,
      description TEXT DEFAULT '',
      is_active BOOLEAN DEFAULT true,
      created_by TEXT DEFAULT 'system',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    )`,
    
    // Create indexes for template_categories
    `CREATE INDEX IF NOT EXISTS idx_template_categories_active ON template_categories(is_active)`,
    `CREATE INDEX IF NOT EXISTS idx_template_categories_name ON template_categories(name)`,
    
    // Create email_categories table  
    `CREATE TABLE IF NOT EXISTS email_categories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL UNIQUE,
      description TEXT DEFAULT '',
      is_active BOOLEAN DEFAULT true,
      created_by TEXT DEFAULT 'system',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    )`,
    
    // Create indexes for email_categories
    `CREATE INDEX IF NOT EXISTS idx_email_categories_active ON email_categories(is_active)`,
    `CREATE INDEX IF NOT EXISTS idx_email_categories_name ON email_categories(name)`,
    
    // Create template_genres table
    `CREATE TABLE IF NOT EXISTS template_genres (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL UNIQUE,
      description TEXT DEFAULT '',
      is_active BOOLEAN DEFAULT true,
      created_by TEXT DEFAULT 'system',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    )`,
    
    // Create indexes for template_genres
    `CREATE INDEX IF NOT EXISTS idx_template_genres_active ON template_genres(is_active)`,
    `CREATE INDEX IF NOT EXISTS idx_template_genres_name ON template_genres(name)`,
    
    // Create concerned_teams table
    `CREATE TABLE IF NOT EXISTS concerned_teams (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL UNIQUE,
      description TEXT DEFAULT '',
      is_active BOOLEAN DEFAULT true,
      created_by TEXT DEFAULT 'system',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    )`,
    
    // Create indexes for concerned_teams
    `CREATE INDEX IF NOT EXISTS idx_concerned_teams_active ON concerned_teams(is_active)`,
    `CREATE INDEX IF NOT EXISTS idx_concerned_teams_name ON concerned_teams(name)`
  ];

  // Execute table creation commands
  for (const command of commands) {
    try {
      console.log('Executing:', command.substring(0, 50) + '...');
      const { error } = await supabase.rpc('query', { query_text: command });
      if (error) {
        console.log('❌ Error:', error.message);
      } else {
        console.log('✅ Success');
      }
    } catch (err) {
      // Try alternative approach
      console.log('⚠️ RPC failed, trying direct query...');
      try {
        const result = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceKey}`,
            'apikey': serviceKey
          },
          body: JSON.stringify({ query_text: command })
        });
        console.log('Direct query result:', result.status);
      } catch (directErr) {
        console.log('❌ Both methods failed for:', command.substring(0, 50));
      }
    }
  }

  // Now populate the tables with existing data
  console.log('\n📊 Populating tables with existing data...\n');

  try {
    // Get existing data
    const { data: liveTemplates } = await supabase
      .from('live_reply_templates')
      .select('category, genre')
      .eq('is_active', true);

    const { data: emailTemplates } = await supabase
      .from('email_templates')
      .select('category, genre, concerned_team')
      .eq('is_active', true);

    if (liveTemplates && liveTemplates.length > 0) {
      // Populate template_categories
      const categories = [...new Set(liveTemplates.map(t => t.category).filter(Boolean))];
      console.log('Inserting categories:', categories);
      
      for (const category of categories) {
        const { error } = await supabase
          .from('template_categories')
          .upsert({ 
            name: category, 
            description: `Live chat template category: ${category}`,
            is_active: true 
          }, { onConflict: 'name' });
        
        if (error) {
          console.log(`❌ Category ${category}:`, error.message);
        } else {
          console.log(`✅ Category: ${category}`);
        }
      }

      // Populate template_genres from live templates
      const liveGenres = [...new Set(liveTemplates.map(t => t.genre).filter(Boolean))];
      console.log('Inserting live genres:', liveGenres);
      
      for (const genre of liveGenres) {
        const { error } = await supabase
          .from('template_genres')
          .upsert({ 
            name: genre, 
            description: `Template genre: ${genre}`,
            is_active: true 
          }, { onConflict: 'name' });
        
        if (error) {
          console.log(`❌ Genre ${genre}:`, error.message);
        } else {
          console.log(`✅ Genre: ${genre}`);
        }
      }
    }

    if (emailTemplates && emailTemplates.length > 0) {
      // Populate email_categories
      const emailCategories = [...new Set(emailTemplates.map(t => t.category).filter(Boolean))];
      console.log('Inserting email categories:', emailCategories);
      
      for (const category of emailCategories) {
        const { error } = await supabase
          .from('email_categories')
          .upsert({ 
            name: category, 
            description: `Email template category: ${category}`,
            is_active: true 
          }, { onConflict: 'name' });
        
        if (error) {
          console.log(`❌ Email category ${category}:`, error.message);
        } else {
          console.log(`✅ Email category: ${category}`);
        }
      }

      // Populate template_genres from email templates
      const emailGenres = [...new Set(emailTemplates.map(t => t.genre).filter(Boolean))];
      console.log('Inserting email genres:', emailGenres);
      
      for (const genre of emailGenres) {
        const { error } = await supabase
          .from('template_genres')
          .upsert({ 
            name: genre, 
            description: `Template genre: ${genre}`,
            is_active: true 
          }, { onConflict: 'name' });
        
        if (error) {
          console.log(`❌ Email genre ${genre}:`, error.message);
        } else {
          console.log(`✅ Email genre: ${genre}`);
        }
      }

      // Populate concerned_teams
      const teams = [...new Set(emailTemplates.map(t => t.concerned_team).filter(Boolean))];
      console.log('Inserting teams:', teams);
      
      for (const team of teams) {
        const { error } = await supabase
          .from('concerned_teams')
          .upsert({ 
            name: team, 
            description: `Concerned team: ${team}`,
            is_active: true 
          }, { onConflict: 'name' });
        
        if (error) {
          console.log(`❌ Team ${team}:`, error.message);
        } else {
          console.log(`✅ Team: ${team}`);
        }
      }
    }

    console.log('\n✅ Database setup completed successfully!');

  } catch (error) {
    console.error('🚨 Error during data population:', error);
  }
}

executeSQLCommands();