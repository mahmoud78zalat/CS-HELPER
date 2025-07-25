import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

async function createDynamicTables() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    console.log('Creating dynamic categories and genres tables...');

    // Create template_categories table
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS template_categories (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL UNIQUE,
          description TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        
        CREATE INDEX IF NOT EXISTS idx_template_categories_active ON template_categories(is_active);
      `
    });

    // Create email_categories table
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS email_categories (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL UNIQUE,
          description TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        
        CREATE INDEX IF NOT EXISTS idx_email_categories_active ON email_categories(is_active);
      `
    });

    // Create template_genres table
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS template_genres (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL UNIQUE,
          description TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        
        CREATE INDEX IF NOT EXISTS idx_template_genres_active ON template_genres(is_active);
      `
    });

    // Create concerned_teams table
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS concerned_teams (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL UNIQUE,
          description TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        
        CREATE INDEX IF NOT EXISTS idx_concerned_teams_active ON concerned_teams(is_active);
      `
    });

    console.log('✅ Dynamic tables created successfully!');

    // Now populate with existing data from templates
    console.log('Populating tables with existing template data...');

    // Get existing template categories and genres
    const { data: liveTemplates } = await supabase
      .from('live_reply_templates')
      .select('category, genre')
      .eq('is_active', true);

    const { data: emailTemplates } = await supabase
      .from('email_templates')
      .select('category, genre, concerned_team')
      .eq('is_active', true);

    // Extract unique categories and genres
    const templateCategories = new Set();
    const emailCategories = new Set();
    const genres = new Set();
    const teams = new Set();

    if (liveTemplates) {
      liveTemplates.forEach(template => {
        if (template.category) templateCategories.add(template.category);
        if (template.genre) genres.add(template.genre);
      });
    }

    if (emailTemplates) {
      emailTemplates.forEach(template => {
        if (template.category) emailCategories.add(template.category);
        if (template.genre) genres.add(template.genre);
        if (template.concerned_team) teams.add(template.concerned_team);
      });
    }

    // Insert unique categories
    for (const category of templateCategories) {
      await supabase
        .from('template_categories')
        .upsert({ 
          name: category, 
          description: `Template category: ${category}`,
          is_active: true 
        }, { onConflict: 'name' });
    }

    for (const category of emailCategories) {
      await supabase
        .from('email_categories')
        .upsert({ 
          name: category, 
          description: `Email category: ${category}`,
          is_active: true 
        }, { onConflict: 'name' });
    }

    // Insert unique genres
    for (const genre of genres) {
      await supabase
        .from('template_genres')
        .upsert({ 
          name: genre, 
          description: `Template genre: ${genre}`,
          is_active: true 
        }, { onConflict: 'name' });
    }

    // Insert unique teams
    for (const team of teams) {
      await supabase
        .from('concerned_teams')
        .upsert({ 
          name: team, 
          description: `Concerned team: ${team}`,
          is_active: true 
        }, { onConflict: 'name' });
    }

    console.log(`✅ Populated with data:`);
    console.log(`   - Template categories: ${templateCategories.size}`);
    console.log(`   - Email categories: ${emailCategories.size}`);
    console.log(`   - Genres: ${genres.size}`);
    console.log(`   - Teams: ${teams.size}`);

  } catch (error) {
    console.error('❌ Error creating dynamic tables:', error);
    process.exit(1);
  }
}

createDynamicTables();