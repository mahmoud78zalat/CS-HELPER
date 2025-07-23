import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lafldimdrginjqloihbh.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupTables() {
  try {
    console.log('🚀 Setting up Supabase tables...');

    // Create users table if it doesn't exist
    const { error: usersError } = await supabase.rpc('exec_sql', {
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

    if (usersError && !usersError.message.includes('already exists')) {
      console.error('Error creating users table:', usersError);
    }

    // Insert admin user
    const { error: adminError } = await supabase
      .from('users')
      .upsert({
        id: 'admin-user',
        email: 'admin@example.com',
        first_name: 'System',
        last_name: 'Admin',
        role: 'admin',
        status: 'active',
        is_online: true,
        updated_at: new Date().toISOString()
      });

    if (adminError) {
      console.error('Error creating admin user:', adminError);
    } else {
      console.log('✅ Admin user created successfully');
    }

    // Create some sample email templates
    const sampleEmailTemplates = [
      {
        name: 'Order Escalation to Finance',
        subject: 'Urgent: Payment Issue for Order {order_id}',
        content: `Dear Finance Team,

Customer {customer_name} is experiencing payment issues with order {order_id}. Please review and resolve urgently.

Order Details:
- Customer: {customer_name}
- Order ID: {order_id}
- AWB: {awb_number}
- Agent: {agent_name}

Please prioritize this case and provide resolution within 24 hours.

Best regards,
{agent_name}
Customer Service Team`,
        category: 'Orders',
        genre: 'urgent',
        concerned_team: 'Finance',
        variables: ['order_id', 'customer_name', 'awb_number', 'agent_name'],
        stage_order: 1,
        is_active: true,
        created_by: 'admin-user'
      }
    ];

    console.log('✅ Supabase setup completed successfully');
    console.log('🔑 Admin login: admin@example.com');
    console.log('📝 Make sure to set up authentication in Supabase Auth panel');

  } catch (error) {
    console.error('❌ Error setting up Supabase:', error);
  }
}

setupTables();