// Run this to create database tables using the service role key
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lafldimdrginjqloihbh.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTables() {
  console.log('Creating database tables...');
  
  // Create users table
  let { error } = await supabase.rpc('exec_sql', {
    sql: `
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('admin', 'agent');
        CREATE TYPE user_status AS ENUM ('active', 'blocked', 'banned');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        first_name TEXT,
        last_name TEXT,
        profile_image_url TEXT,
        role user_role DEFAULT 'agent' NOT NULL,
        status user_status DEFAULT 'active' NOT NULL,
        is_online BOOLEAN DEFAULT false NOT NULL,
        last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
  });
  
  if (error) console.log('Users table:', error.message);
  
  // Create admin user
  ({ error } = await supabase.from('users').upsert({
    id: 'admin-user',
    email: 'admin@example.com',
    first_name: 'System',
    last_name: 'Admin',
    role: 'admin',
    status: 'active',
    is_online: true
  }));
  
  if (error) console.log('Admin user:', error.message);
  else console.log('✅ Admin user created');
  
  console.log('✅ Setup complete! You can now test template creation.');
}

createTables();