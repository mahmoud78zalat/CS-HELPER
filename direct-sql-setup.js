import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lafldimdrginjqloihbh.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('📊 Direct SQL table creation...');

const supabase = createClient(supabaseUrl, serviceKey);

const createTablesSQL = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
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

-- Create live reply templates table
CREATE TABLE IF NOT EXISTS public.live_reply_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    content_en TEXT NOT NULL,
    content_ar TEXT NOT NULL,
    category TEXT NOT NULL,
    genre TEXT NOT NULL,
    variables TEXT[] DEFAULT '{}',
    stage_order INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    created_by TEXT REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email templates table
CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    genre TEXT NOT NULL,
    concerned_team TEXT NOT NULL,
    warning_note TEXT,
    variables TEXT[] DEFAULT '{}',
    stage_order INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    created_by TEXT REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create usage tracking tables
CREATE TABLE IF NOT EXISTS public.live_reply_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID REFERENCES public.live_reply_templates(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES public.users(id),
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.email_template_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID REFERENCES public.email_templates(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES public.users(id),
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS public.sessions (
    sid TEXT PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Insert admin user
INSERT INTO public.users (id, email, first_name, last_name, role, status, is_online)
VALUES ('admin-user', 'admin@example.com', 'System', 'Admin', 'admin', 'active', true)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    updated_at = NOW();

-- Insert sample templates
INSERT INTO public.live_reply_templates (name, content_en, content_ar, category, genre, variables, created_by)
VALUES (
    'Welcome - {customer_name}',
    'Hello {customer_name}! Welcome to our support. How can I help you today?',
    'مرحباً {customer_name}! أهلاً بك في الدعم. كيف يمكنني مساعدتك؟',
    'Greetings',
    'friendly',
    ARRAY['customer_name'],
    'admin-user'
) ON CONFLICT DO NOTHING;

INSERT INTO public.email_templates (name, subject, content, category, genre, concerned_team, variables, created_by)
VALUES (
    'Order Issue - {order_id}',
    'Customer Issue: Order {order_id}',
    'Team, Customer {customer_name} needs help with order {order_id}. Agent: {agent_name}',
    'Orders',
    'urgent',
    'Customer Service',
    ARRAY['order_id', 'customer_name', 'agent_name'],
    'admin-user'
) ON CONFLICT DO NOTHING;
`;

async function runSQL() {
  try {
    // Try to execute the SQL directly
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey
      },
      body: JSON.stringify({ sql: createTablesSQL })
    });

    if (response.ok) {
      console.log('✅ SQL executed successfully');
    } else {
      console.log('SQL execution response:', await response.text());
    }
  } catch (error) {
    console.log('Error executing SQL:', error.message);
  }
}

runSQL();