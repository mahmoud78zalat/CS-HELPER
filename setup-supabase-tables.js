import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupTables() {
  console.log('🔄 Setting up Supabase tables...');
  
  try {
    // Create the live_reply_template_groups table
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS live_reply_template_groups (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          description TEXT,
          color TEXT DEFAULT '#3b82f6',
          is_active BOOLEAN DEFAULT true,
          order_index INTEGER DEFAULT 1,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );

        -- Create index for ordering
        CREATE INDEX IF NOT EXISTS idx_live_reply_template_groups_order ON live_reply_template_groups(order_index);

        -- Create trigger for updated_at
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = now();
            RETURN NEW;
        END;
        $$ language 'plpgsql';

        DROP TRIGGER IF EXISTS update_live_reply_template_groups_updated_at ON live_reply_template_groups;
        CREATE TRIGGER update_live_reply_template_groups_updated_at 
          BEFORE UPDATE ON live_reply_template_groups 
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

        -- Insert sample groups if they don't exist
        INSERT INTO live_reply_template_groups (name, description, color, order_index) VALUES
          ('General', 'General purpose templates', '#3b82f6', 1),
          ('Support', 'Customer support templates', '#10b981', 2),
          ('Sales', 'Sales related templates', '#f59e0b', 3)
        ON CONFLICT (name) DO NOTHING;
      `
    });

    if (error) {
      console.error('❌ Error creating table:', error);
      // Fallback: try creating table directly
      const { error: directError } = await supabase
        .from('live_reply_template_groups')
        .select('id')
        .limit(1);
        
      if (directError && directError.code === '42P01') {
        console.log('📝 Table does not exist. Please create it manually in Supabase SQL editor:');
        console.log(`
CREATE TABLE live_reply_template_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_live_reply_template_groups_order ON live_reply_template_groups(order_index);

INSERT INTO live_reply_template_groups (name, description, color, order_index) VALUES
  ('General', 'General purpose templates', '#3b82f6', 1),
  ('Support', 'Customer support templates', '#10b981', 2),
  ('Sales', 'Sales related templates', '#f59e0b', 3);
        `);
      } else {
        console.log('✅ Table already exists or created successfully');
      }
    } else {
      console.log('✅ Table setup completed successfully');
    }

    // Test the connection by fetching groups
    const { data: groups, error: fetchError } = await supabase
      .from('live_reply_template_groups')
      .select('*')
      .order('order_index');

    if (fetchError) {
      console.error('❌ Error fetching groups:', fetchError);
    } else {
      console.log(`✅ Successfully connected to table. Found ${groups?.length || 0} groups.`);
    }

  } catch (err) {
    console.error('❌ Setup failed:', err);
  }
}

setupTables();