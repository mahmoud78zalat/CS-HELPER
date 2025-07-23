import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lafldimdrginjqloihbh.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

async function setup() {
  // Create admin user first
  const { error: userError } = await supabase.from('users').upsert({
    id: 'admin-user',
    email: 'admin@example.com',
    first_name: 'System',
    last_name: 'Admin',
    role: 'admin',
    status: 'active',
    is_online: true
  });

  if (userError) {
    console.log('Admin user creation result:', userError.message);
  } else {
    console.log('✅ Admin user created successfully');
  }

  // Create sample templates with dynamic names
  const { error: emailError } = await supabase.from('email_templates').upsert({
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
    created_by: 'admin-user'
  });

  if (emailError) {
    console.log('Email template:', emailError.message);
  } else {
    console.log('✅ Sample email template created');
  }

  console.log('🎉 Setup complete!');
}

setup().catch(console.error);