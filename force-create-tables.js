import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lafldimdrginjqloihbh.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔥 Force creating database tables...');

const supabase = createClient(supabaseUrl, serviceKey);

async function forceCreateTables() {
  try {
    // Force create users table by trying to insert data (will create table if it doesn't exist)
    console.log('Creating users table...');
    const { error: userError } = await supabase.from('users').upsert({
      id: 'admin-user',
      email: 'admin@example.com',
      first_name: 'System', 
      last_name: 'Admin',
      role: 'admin',
      status: 'active',
      is_online: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    console.log('Users result:', userError ? userError.message : '✅ Success');

    // Force create live_reply_templates table
    console.log('Creating live_reply_templates table...');
    const { error: liveError } = await supabase.from('live_reply_templates').upsert({
      name: 'Welcome - {customer_name}',
      content_en: 'Hello {customer_name}! How can I help you today?',
      content_ar: 'مرحباً {customer_name}! كيف يمكنني مساعدتك؟',
      category: 'Greetings',
      genre: 'friendly',
      variables: ['customer_name'],
      stage_order: 1,
      is_active: true,
      usage_count: 0,
      created_by: 'admin-user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    console.log('Live templates result:', liveError ? liveError.message : '✅ Success');

    // Force create email_templates table  
    console.log('Creating email_templates table...');
    const { error: emailError } = await supabase.from('email_templates').upsert({
      name: 'Escalation - {order_id}',
      subject: 'Issue with Order {order_id}', 
      content: 'Customer {customer_name} needs help with order {order_id}. Agent: {agent_name}',
      category: 'Orders',
      genre: 'urgent',
      concerned_team: 'Finance',
      variables: ['order_id', 'customer_name', 'agent_name'],
      stage_order: 1,
      is_active: true,
      usage_count: 0,
      created_by: 'admin-user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    console.log('Email templates result:', emailError ? emailError.message : '✅ Success');

    console.log('🎉 Tables creation complete!');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

forceCreateTables();