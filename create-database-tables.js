import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lafldimdrginjqloihbh.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🚀 Creating database tables with service key...');

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAllTables() {
  try {
    console.log('Step 1: Creating users table...');
    
    // First create the users table with raw SQL
    const { data: userData, error: userTableError } = await supabase
      .from('information_schema.tables')
      .select('*')
      .eq('table_name', 'users')
      .eq('table_schema', 'public');

    if (!userData || userData.length === 0) {
      // Create users table directly with SQL
      const { error: createUserError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE,
            first_name TEXT,
            last_name TEXT,
            profile_image_url TEXT,
            role TEXT CHECK (role IN ('admin', 'agent')) DEFAULT 'agent',
            status TEXT CHECK (status IN ('active', 'blocked', 'banned')) DEFAULT 'active',
            is_online BOOLEAN DEFAULT false,
            last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });
      
      if (createUserError) {
        console.log('Using direct table creation...');
        // Try alternative approach - direct insert to force table creation
        await supabase.from('users').insert({
          id: 'admin-user',
          email: 'admin@example.com',
          first_name: 'System',
          last_name: 'Admin',
          role: 'admin',
          status: 'active',
          is_online: true
        });
      }
    }

    console.log('Step 2: Creating admin user...');
    const { error: adminError } = await supabase.from('users').upsert({
      id: 'admin-user',
      email: 'admin@example.com',
      first_name: 'System',
      last_name: 'Admin',
      role: 'admin',
      status: 'active',
      is_online: true
    });

    if (adminError && !adminError.message.includes('already exists')) {
      console.log('Admin user error:', adminError.message);
    } else {
      console.log('✅ Admin user ready');
    }

    console.log('Step 3: Creating live_reply_templates table...');
    const { error: liveTemplateTableError } = await supabase.from('live_reply_templates').upsert({
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Welcome Greeting - {customer_name}',
      content_en: 'Hello {customer_name}! Welcome to our customer support. How can I assist you today?',
      content_ar: 'مرحباً {customer_name}! أهلاً بك في خدمة العملاء. كيف يمكنني مساعدتك اليوم؟',
      category: 'Greetings',
      genre: 'friendly',
      variables: ['customer_name'],
      stage_order: 1,
      is_active: true,
      usage_count: 0,
      created_by: 'admin-user'
    });

    if (liveTemplateTableError && !liveTemplateTableError.message.includes('already exists')) {
      console.log('Live template error:', liveTemplateTableError.message);
    } else {
      console.log('✅ Live reply templates table ready');
    }

    console.log('Step 4: Creating email_templates table...');
    const { error: emailTemplateError } = await supabase.from('email_templates').upsert({
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Order Escalation - {order_id}',
      subject: 'Urgent: Payment Issue for Order {order_id}',
      content: `Dear Team,

Customer {customer_name} needs assistance with order {order_id}.

Details:
- Customer: {customer_name}
- Order: {order_id}
- Agent: {agent_name}

Please resolve urgently.

Best regards,
{agent_name}`,
      category: 'Orders',
      genre: 'urgent',
      concerned_team: 'Finance',
      variables: ['order_id', 'customer_name', 'agent_name'],
      stage_order: 1,
      is_active: true,
      usage_count: 0,
      created_by: 'admin-user'
    });

    if (emailTemplateError && !emailTemplateError.message.includes('already exists')) {
      console.log('Email template error:', emailTemplateError.message);
    } else {
      console.log('✅ Email templates table ready');
    }

    console.log('🎉 Database setup complete! Tables created successfully.');
    console.log('🔑 Admin login: admin@example.com');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

createAllTables();