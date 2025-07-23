import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createMahmoudAdmin() {
  try {
    console.log('Creating Mahmoud as admin user...');
    
    // Insert or update user in users table
    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: 'f765c1de-f9b5-4615-8c09-8cdde8152a07', // Your Supabase Auth user ID
        email: 'mahmoud78zalat@gmail.com',
        first_name: 'Mahmoud',
        last_name: 'Zalat',
        profile_image_url: '',
        role: 'admin',
        status: 'active',
        is_online: false,
        last_seen: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();

    if (error) {
      console.error('Error creating user:', error);
      return;
    }

    console.log('✅ Mahmoud created as admin successfully:', data);

    // Also create personal_notes table if it doesn't exist
    console.log('Creating personal notes table...');
    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS personal_notes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_personal_notes_user_id ON personal_notes(user_id);
        CREATE INDEX IF NOT EXISTS idx_personal_notes_created_at ON personal_notes(created_at DESC);
      `
    });

    if (tableError) {
      console.log('Note: Could not create personal_notes table via RPC, please run the SQL manually');
    } else {
      console.log('✅ Personal notes table created successfully');
    }

    console.log('\n🎉 Setup complete! You can now log in as admin.');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createMahmoudAdmin();