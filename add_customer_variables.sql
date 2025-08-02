-- SQL Script to add Customer Info and Additional Info variables to Template Variable Manager
-- Includes error handling for existing variables - Uses template_variables table

-- Insert Customer Info Panel Variables
INSERT INTO template_variables (name, description, category, created_at, updated_at)
SELECT 'customer_name', 'Customer Name', 'Customer Information', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM template_variables WHERE name = 'customer_name');

INSERT INTO template_variables (name, description, category, created_at, updated_at)
SELECT 'customer_phone', 'Customer Phone Number', 'Customer Information', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM template_variables WHERE name = 'customer_phone');

INSERT INTO template_variables (name, description, category, created_at, updated_at)
SELECT 'customer_country', 'Customer Country', 'Customer Information', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM template_variables WHERE name = 'customer_country');

INSERT INTO template_variables (name, description, category, created_at, updated_at)
SELECT 'gender', 'Customer Gender', 'Customer Information', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM template_variables WHERE name = 'gender');

INSERT INTO template_variables (name, description, category, created_at, updated_at)
SELECT 'language', 'Customer Language Preference (en/ar)', 'Customer Information', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM template_variables WHERE name = 'language');

-- Insert Agent Information Variables
INSERT INTO template_variables (name, description, category, created_at, updated_at)
SELECT 'agentarabicfirstname', 'Agent Arabic First Name', 'Agent Information', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM template_variables WHERE name = 'agentarabicfirstname');

INSERT INTO template_variables (name, description, category, created_at, updated_at)
SELECT 'agentarabiclastname', 'Agent Arabic Last Name', 'Agent Information', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM template_variables WHERE name = 'agentarabiclastname');

INSERT INTO template_variables (name, description, category, created_at, updated_at)
SELECT 'agentarabicname', 'Agent Arabic Full Name (First + Last)', 'Agent Information', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM template_variables WHERE name = 'agentarabicname');

-- Insert Additional Info Panel Variables
INSERT INTO template_variables (name, description, category, created_at, updated_at)
SELECT 'itemname', 'Product/Item Name', 'Order Information', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM template_variables WHERE name = 'itemname');

INSERT INTO template_variables (name, description, category, created_at, updated_at)
SELECT 'deliverydate', 'Delivery Date', 'Order Information', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM template_variables WHERE name = 'deliverydate');

INSERT INTO template_variables (name, description, category, created_at, updated_at)
SELECT 'waitingtime', 'Waiting Time/Processing Time', 'Order Information', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM template_variables WHERE name = 'waitingtime');

-- Insert Live Reply Template Language Variables
INSERT INTO template_variables (name, description, category, created_at, updated_at)
SELECT 'customerfirstname', 'Customer First Name (extracted from full name)', 'Customer Information', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM template_variables WHERE name = 'customerfirstname');

INSERT INTO template_variables (name, description, category, created_at, updated_at)
SELECT 'agentfirstname', 'Agent First Name (English)', 'Agent Information', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM template_variables WHERE name = 'agentfirstname');

-- Insert User ID variable for order conversion
INSERT INTO template_variables (name, description, category, created_at, updated_at)
SELECT 'userid', 'User ID for order conversion', 'System Information', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM template_variables WHERE name = 'userid');

-- Update template_variables table with is_active flag if it exists
UPDATE template_variables SET is_active = true 
WHERE name IN (
    'customer_name', 'customer_phone', 'customer_country', 'gender', 'language',
    'agentarabicfirstname', 'agentarabiclastname', 'agentarabicname',
    'itemname', 'deliverydate', 'waitingtime', 'customerfirstname', 'agentfirstname', 'userid'
) AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'template_variables' AND column_name = 'is_active');

-- Display results
SELECT 
    'Variables added successfully' as status,
    COUNT(*) as total_variables
FROM template_variables 
WHERE name IN (
    'customer_name', 'customer_phone', 'customer_country', 'gender', 'language',
    'agentarabicfirstname', 'agentarabiclastname', 'agentarabicname',
    'itemname', 'deliverydate', 'waitingtime', 'customerfirstname', 'agentfirstname', 'userid'
);