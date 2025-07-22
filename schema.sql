-- Create enums first (if they don't exist)
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'agent');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('active', 'blocked', 'banned');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Sessions table (mandatory for Replit Auth)
CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);

-- Users table (mandatory for Replit Auth)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY,
  email VARCHAR UNIQUE,
  first_name VARCHAR,
  last_name VARCHAR,
  profile_image_url VARCHAR,
  role user_role DEFAULT 'agent' NOT NULL,
  status user_status DEFAULT 'active' NOT NULL,
  is_online BOOLEAN DEFAULT false NOT NULL,
  last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Templates table
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR NOT NULL,
  genre VARCHAR NOT NULL,
  concerned_team VARCHAR NOT NULL,
  variables TEXT[],
  stage_order INTEGER DEFAULT 1 NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  usage_count INTEGER DEFAULT 0 NOT NULL,
  created_by VARCHAR NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Template usage tracking
CREATE TABLE IF NOT EXISTS template_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES templates(id),
  user_id VARCHAR NOT NULL REFERENCES users(id),
  used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Site content management
CREATE TABLE IF NOT EXISTS site_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR UNIQUE NOT NULL,
  content TEXT NOT NULL,
  updated_by VARCHAR NOT NULL REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert some initial templates for testing
INSERT INTO templates (name, subject, content, category, genre, concerned_team, variables, created_by) 
VALUES 
  ('Order Delay Notification', 'Update on Your Recent Order', 'Dear {customer_name}, We wanted to update you regarding your order {order_id}. Due to unforeseen circumstances, there will be a slight delay in processing your order. We sincerely apologize for any inconvenience this may cause.', 'Order Issues', 'Standard', 'Customer Service', ARRAY['customer_name', 'order_id'], 'system'),
  ('Delivery Problem Resolution', 'Regarding Your Delivery - {order_id}', 'Hello {customer_name}, We understand you''re experiencing an issue with the delivery of order {order_id}. Our team is working diligently to resolve this matter. We will update you within 24 hours with a resolution.', 'Delivery Problems', 'Urgent', 'Logistics', ARRAY['customer_name', 'order_id'], 'system'),
  ('Refund Request Confirmation', 'Your Refund Request - Order {order_id}', 'Dear {customer_name}, We have received your refund request for order {order_id}. Your request is being processed and you can expect the refund to be completed within 3-5 business days.', 'Refunds', 'Standard', 'Finance', ARRAY['customer_name', 'order_id'], 'system')
ON CONFLICT DO NOTHING;

-- Create a system user if it doesn't exist
INSERT INTO users (id, email, first_name, last_name, role, status) 
VALUES ('system', 'system@brandsforsless.com', 'System', 'User', 'admin', 'active')
ON CONFLICT DO NOTHING;