const { createClient } = require('@supabase/supabase-js');

// Get Supabase configuration from environment
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTemplateGroupsTable() {
  console.log('🔄 Creating live_reply_template_groups table...');
  
  const { data, error } = await supabase.rpc('create_template_groups_table', {});
  
  if (error) {
    // Try creating with direct SQL
    console.log('💡 Trying direct table creation...');
    const { data: sqlData, error: sqlError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'live_reply_template_groups');
      
    if (sqlError || !sqlData || sqlData.length === 0) {
      console.log('❌ Table does not exist, need to create it via SQL migration');
      console.log('Please run this SQL in your Supabase SQL editor:');
      console.log(`
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

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_live_reply_template_groups_updated_at 
  BEFORE UPDATE ON live_reply_template_groups 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample groups
INSERT INTO live_reply_template_groups (name, description, color, order_index) VALUES
  ('General', 'General purpose templates', '#3b82f6', 1),
  ('Support', 'Customer support templates', '#10b981', 2),
  ('Sales', 'Sales related templates', '#f59e0b', 3)
ON CONFLICT DO NOTHING;
      `);
    } else {
      console.log('✅ Table already exists');
    }
  } else {
    console.log('✅ Table created successfully');
  }
}

createTemplateGroupsTable().catch(console.error);