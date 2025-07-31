import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('URL:', !!supabaseUrl);
console.log('Key:', !!supabaseServiceKey);

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTable() {
  console.log('🔄 Creating table via INSERT operation...');
  
  try {
    // Try to insert a test record to create the table structure implicitly
    const { data, error } = await supabase
      .from('live_reply_template_groups')
      .insert([
        { name: 'General', description: 'General purpose templates', color: '#3b82f6', order_index: 1 },
        { name: 'Support', description: 'Customer support templates', color: '#10b981', order_index: 2 },
        { name: 'Sales', description: 'Sales related templates', color: '#f59e0b', order_index: 3 }
      ])
      .select();

    if (error) {
      console.log('❌ Insert failed:', error.message);
      console.log('📝 Please create the table manually in Supabase SQL Editor with this SQL:');
      console.log(`
-- Create the live_reply_template_groups table
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

-- Create index for ordering  
CREATE INDEX idx_live_reply_template_groups_order ON live_reply_template_groups(order_index);

-- Insert initial data
INSERT INTO live_reply_template_groups (name, description, color, order_index) VALUES
  ('General', 'General purpose templates', '#3b82f6', 1),
  ('Support', 'Customer support templates', '#10b981', 2),
  ('Sales', 'Sales related templates', '#f59e0b', 3);
      `);
    } else {
      console.log('✅ Table created and populated successfully!');
      console.log('Groups inserted:', data);
    }
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

createTable();