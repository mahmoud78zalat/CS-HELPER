import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

async function createMissingTables() {
  console.log('🔧 Creating missing dynamic tables...\n');

  try {
    // Create template_categories table
    console.log('📊 Creating template_categories table...');
    const { error: categoryError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS template_categories (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL UNIQUE,
          description TEXT DEFAULT '',
          is_active BOOLEAN DEFAULT true,
          created_by TEXT DEFAULT 'system',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        
        CREATE INDEX IF NOT EXISTS idx_template_categories_active ON template_categories(is_active);
        CREATE INDEX IF NOT EXISTS idx_template_categories_name ON template_categories(name);
      `
    });

    if (categoryError) {
      console.log('❌ Error creating template_categories:', categoryError.message);
    } else {
      console.log('✅ template_categories table created');
    }

    // Create email_categories table
    console.log('📧 Creating email_categories table...');
    const { error: emailCategoryError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS email_categories (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL UNIQUE,
          description TEXT DEFAULT '',
          is_active BOOLEAN DEFAULT true,
          created_by TEXT DEFAULT 'system',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        
        CREATE INDEX IF NOT EXISTS idx_email_categories_active ON email_categories(is_active);
        CREATE INDEX IF NOT EXISTS idx_email_categories_name ON email_categories(name);
      `
    });

    if (emailCategoryError) {
      console.log('❌ Error creating email_categories:', emailCategoryError.message);
    } else {
      console.log('✅ email_categories table created');
    }

    // Create template_genres table
    console.log('🎭 Creating template_genres table...');
    const { error: genreError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS template_genres (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL UNIQUE,
          description TEXT DEFAULT '',
          is_active BOOLEAN DEFAULT true,
          created_by TEXT DEFAULT 'system',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        
        CREATE INDEX IF NOT EXISTS idx_template_genres_active ON template_genres(is_active);
        CREATE INDEX IF NOT EXISTS idx_template_genres_name ON template_genres(name);
      `
    });

    if (genreError) {
      console.log('❌ Error creating template_genres:', genreError.message);
    } else {
      console.log('✅ template_genres table created');
    }

    // Create concerned_teams table
    console.log('👥 Creating concerned_teams table...');
    const { error: teamsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS concerned_teams (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL UNIQUE,
          description TEXT DEFAULT '',
          is_active BOOLEAN DEFAULT true,
          created_by TEXT DEFAULT 'system',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        
        CREATE INDEX IF NOT EXISTS idx_concerned_teams_active ON concerned_teams(is_active);
        CREATE INDEX IF NOT EXISTS idx_concerned_teams_name ON concerned_teams(name);
      `
    });

    if (teamsError) {
      console.log('❌ Error creating concerned_teams:', teamsError.message);
    } else {
      console.log('✅ concerned_teams table created');
    }

    console.log('\n🔄 Populating tables with existing template data...\n');

    // Populate template_categories from existing live_reply_templates
    console.log('📊 Populating template_categories...');
    const { data: liveTemplates } = await supabase
      .from('live_reply_templates')
      .select('category')
      .eq('is_active', true);

    if (liveTemplates && liveTemplates.length > 0) {
      const uniqueCategories = [...new Set(liveTemplates.map(t => t.category).filter(Boolean))];
      console.log('Found categories:', uniqueCategories);
      
      for (const category of uniqueCategories) {
        const { error } = await supabase
          .from('template_categories')
          .upsert({ 
            name: category, 
            description: `Live chat template category: ${category}`,
            is_active: true 
          }, { onConflict: 'name' });
        
        if (error) {
          console.log(`❌ Error inserting category ${category}:`, error.message);
        } else {
          console.log(`✅ Inserted category: ${category}`);
        }
      }
    }

    // Populate email_categories from existing email_templates
    console.log('\n📧 Populating email_categories...');
    const { data: emailTemplates } = await supabase
      .from('email_templates')
      .select('category')
      .eq('is_active', true);

    if (emailTemplates && emailTemplates.length > 0) {
      const uniqueEmailCategories = [...new Set(emailTemplates.map(t => t.category).filter(Boolean))];
      console.log('Found email categories:', uniqueEmailCategories);
      
      for (const category of uniqueEmailCategories) {
        const { error } = await supabase
          .from('email_categories')
          .upsert({ 
            name: category, 
            description: `Email template category: ${category}`,
            is_active: true 
          }, { onConflict: 'name' });
        
        if (error) {
          console.log(`❌ Error inserting email category ${category}:`, error.message);
        } else {
          console.log(`✅ Inserted email category: ${category}`);
        }
      }
    }

    // Populate template_genres from both template types
    console.log('\n🎭 Populating template_genres...');
    const allGenres = [
      ...(liveTemplates || []).map(t => t.genre),
      ...(emailTemplates || []).map(t => t.genre)
    ].filter(Boolean);

    const uniqueGenres = [...new Set(allGenres)];
    console.log('Found genres:', uniqueGenres);
    
    for (const genre of uniqueGenres) {
      const { error } = await supabase
        .from('template_genres')
        .upsert({ 
          name: genre, 
          description: `Template genre: ${genre}`,
          is_active: true 
        }, { onConflict: 'name' });
      
      if (error) {
        console.log(`❌ Error inserting genre ${genre}:`, error.message);
      } else {
        console.log(`✅ Inserted genre: ${genre}`);
      }
    }

    // Populate concerned_teams from email_templates
    console.log('\n👥 Populating concerned_teams...');
    const { data: teamsData } = await supabase
      .from('email_templates')
      .select('concerned_team')
      .eq('is_active', true);

    if (teamsData && teamsData.length > 0) {
      const uniqueTeams = [...new Set(teamsData.map(t => t.concerned_team).filter(Boolean))];
      console.log('Found teams:', uniqueTeams);
      
      for (const team of uniqueTeams) {
        const { error } = await supabase
          .from('concerned_teams')
          .upsert({ 
            name: team, 
            description: `Concerned team: ${team}`,
            is_active: true 
          }, { onConflict: 'name' });
        
        if (error) {
          console.log(`❌ Error inserting team ${team}:`, error.message);
        } else {
          console.log(`✅ Inserted team: ${team}`);
        }
      }
    }

    console.log('\n✅ Dynamic tables setup completed successfully!');

  } catch (error) {
    console.error('🚨 Error setting up dynamic tables:', error);
  }
}

createMissingTables();