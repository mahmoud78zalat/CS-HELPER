import { Client } from 'pg';

const client = new Client({
  connectionString: 'postgresql://postgres:0103784716zZ@db.lafldimdrginjqloihbh.supabase.co:5432/postgres',
});

async function setupSupabaseSchema() {
  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL');

    // Enable UUID extension
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

    // Create user roles enum
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('admin', 'agent');
        CREATE TYPE user_status AS ENUM ('active', 'blocked', 'banned');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
          id VARCHAR PRIMARY KEY,
          email VARCHAR UNIQUE,
          first_name VARCHAR,
          last_name VARCHAR,
          profile_image_url VARCHAR,
          role user_role DEFAULT 'agent' NOT NULL,
          status user_status DEFAULT 'active' NOT NULL,
          is_online BOOLEAN DEFAULT false NOT NULL,
          last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create live reply templates table
    await client.query(`
      CREATE TABLE IF NOT EXISTS live_reply_templates (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name VARCHAR NOT NULL,
          content_en TEXT NOT NULL,
          content_ar TEXT NOT NULL,
          category VARCHAR NOT NULL,
          genre VARCHAR NOT NULL,
          variables TEXT[] DEFAULT '{}',
          stage_order INTEGER DEFAULT 1 NOT NULL,
          is_active BOOLEAN DEFAULT true NOT NULL,
          usage_count INTEGER DEFAULT 0 NOT NULL,
          created_by VARCHAR REFERENCES users(id) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create email templates table
    await client.query(`
      CREATE TABLE IF NOT EXISTS email_templates (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name VARCHAR NOT NULL,
          subject TEXT NOT NULL,
          content TEXT NOT NULL,
          category VARCHAR NOT NULL,
          genre VARCHAR NOT NULL,
          concerned_team VARCHAR NOT NULL,
          warning_note TEXT,
          variables TEXT[] DEFAULT '{}',
          stage_order INTEGER DEFAULT 1 NOT NULL,
          is_active BOOLEAN DEFAULT true NOT NULL,
          usage_count INTEGER DEFAULT 0 NOT NULL,
          created_by VARCHAR REFERENCES users(id) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create usage tracking tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS live_reply_usage (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          template_id UUID REFERENCES live_reply_templates(id) ON DELETE CASCADE NOT NULL,
          user_id VARCHAR REFERENCES users(id) NOT NULL,
          used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS email_template_usage (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          template_id UUID REFERENCES email_templates(id) ON DELETE CASCADE NOT NULL,
          user_id VARCHAR REFERENCES users(id) NOT NULL,
          used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create site content table
    await client.query(`
      CREATE TABLE IF NOT EXISTS site_content (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          key VARCHAR UNIQUE NOT NULL,
          content TEXT NOT NULL,
          updated_by VARCHAR REFERENCES users(id) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
          sid VARCHAR PRIMARY KEY,
          sess JSONB NOT NULL,
          expire TIMESTAMP WITH TIME ZONE NOT NULL
      );
    `);

    // Create index on sessions
    await client.query('CREATE INDEX IF NOT EXISTS idx_sessions_expire ON sessions(expire);');

    // Create RPC functions
    await client.query(`
      CREATE OR REPLACE FUNCTION increment_live_reply_usage(template_id UUID)
      RETURNS void AS $$
      BEGIN
          UPDATE live_reply_templates 
          SET usage_count = usage_count + 1, updated_at = NOW()
          WHERE id = template_id;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await client.query(`
      CREATE OR REPLACE FUNCTION increment_email_template_usage(template_id UUID)
      RETURNS void AS $$
      BEGIN
          UPDATE email_templates 
          SET usage_count = usage_count + 1, updated_at = NOW()
          WHERE id = template_id;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Insert admin user
    await client.query(`
      INSERT INTO users (id, email, first_name, last_name, role, status, is_online)
      VALUES ('admin-user', 'admin@example.com', 'System', 'Admin', 'admin', 'active', true)
      ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          role = EXCLUDED.role,
          status = EXCLUDED.status,
          updated_at = NOW();
    `);

    // Insert sample email templates
    await client.query(`
      INSERT INTO email_templates (name, subject, content, category, genre, concerned_team, variables, stage_order, is_active, created_by)
      VALUES 
          (
              'Order Escalation to Finance',
              'Urgent: Payment Issue for Order {order_id}',
              'Dear Finance Team,

Customer {customer_name} is experiencing payment issues with order {order_id}. Please review and resolve urgently.

Order Details:
- Customer: {customer_name}
- Order ID: {order_id}
- AWB: {awb_number}
- Agent: {agent_name}

Please prioritize this case and provide resolution within 24 hours.

Best regards,
{agent_name}
Customer Service Team',
              'Orders',
              'urgent',
              'Finance',
              ARRAY['order_id', 'customer_name', 'awb_number', 'agent_name'],
              1,
              true,
              'admin-user'
          ),
          (
              'Shipping Delay Notification',
              'Order {order_id} - Shipping Delay Update',
              'Dear Logistics Team,

Please be informed that order {order_id} has experienced a shipping delay.

Customer Details:
- Name: {customer_name}
- Phone: {customer_phone}
- Expected Delivery: {delivery_date}

Please expedite the shipment and provide tracking information.

Best regards,
{agent_name}',
              'Shipping',
              'standard',
              'Logistics',
              ARRAY['order_id', 'customer_name', 'customer_phone', 'delivery_date', 'agent_name'],
              2,
              true,
              'admin-user'
          ),
          (
              'Refund Request Processing',
              'Refund Request for Order {order_id} - Customer: {customer_name}',
              'Dear Finance Team,

Customer {customer_name} has requested a refund for order {order_id}.

Refund Details:
- Order ID: {order_id}
- Customer: {customer_name}
- Customer Email: {customer_email}
- Reason: Quality issue reported by customer
- Agent Processing: {agent_name}

Please process this refund request and confirm completion.

Best regards,
{agent_name}
Customer Service Team',
              'Refunds',
              'standard',
              'Finance',
              ARRAY['order_id', 'customer_name', 'customer_email', 'agent_name'],
              3,
              true,
              'admin-user'
          )
      ON CONFLICT DO NOTHING;
    `);

    // Insert sample live reply templates
    await client.query(`
      INSERT INTO live_reply_templates (name, content_en, content_ar, category, genre, variables, stage_order, is_active, created_by)
      VALUES 
          (
              'Welcome Greeting',
              'Hello {customer_name}! Welcome to Brands For Less customer support. How can I assist you today?',
              'مرحباً {customer_name}! أهلاً بك في خدمة عملاء براندز فور ليس. كيف يمكنني مساعدتك اليوم؟',
              'Greetings',
              'friendly',
              ARRAY['customer_name'],
              1,
              true,
              'admin-user'
          ),
          (
              'Order Status Inquiry',
              'I can help you check your order status. Could you please provide your order number or AWB number?',
              'يمكنني مساعدتك في التحقق من حالة طلبك. هل يمكنك تزويدي برقم الطلب أو رقم البوليصة؟',
              'Orders',
              'helpful',
              ARRAY[]::TEXT[],
              2,
              true,
              'admin-user'
          ),
          (
              'Delivery Information',
              'Your order {order_id} is currently {order_status}. Expected delivery date is {delivery_date}. You can track it using AWB: {awb_number}',
              'طلبك رقم {order_id} حالياً {order_status}. تاريخ التسليم المتوقع هو {delivery_date}. يمكنك تتبعه باستخدام رقم البوليصة: {awb_number}',
              'Orders',
              'informative',
              ARRAY['order_id', 'order_status', 'delivery_date', 'awb_number'],
              3,
              true,
              'admin-user'
          )
      ON CONFLICT DO NOTHING;
    `);

    // Insert sample site content
    await client.query(`
      INSERT INTO site_content (key, content, updated_by)
      VALUES 
          ('site_name', 'Brands For Less Customer Service', 'admin-user'),
          ('about_tool', 'Advanced customer service communication platform designed to streamline email template management for business teams, with advanced collaborative editing and real-time synchronization capabilities.', 'admin-user'),
          ('company_info', 'Brands For Less - Premium fashion and lifestyle destination', 'admin-user'),
          ('support_hours', '9 AM - 6 PM, Sunday - Thursday', 'admin-user')
      ON CONFLICT (key) DO UPDATE SET
          content = EXCLUDED.content,
          updated_by = EXCLUDED.updated_by,
          updated_at = NOW();
    `);

    console.log('✅ Supabase schema setup completed successfully!');
    console.log('✅ Sample data inserted');
    console.log('✅ Admin user created: admin@example.com');

  } catch (error) {
    console.error('❌ Error setting up Supabase schema:', error);
  } finally {
    await client.end();
  }
}

setupSupabaseSchema();