// Template utility functions for dynamic variable management

export interface DynamicVariable {
  name: string;
  description: string;
  category: 'customer' | 'order' | 'system' | 'time';
  example: string;
}

export const AVAILABLE_VARIABLES: DynamicVariable[] = [
  // Customer Variables
  { name: 'CUSTOMERNAME', description: 'Customer full name', category: 'customer', example: 'John Smith' },
  { name: 'CUSTOMERFIRSTNAME', description: 'Customer first name', category: 'customer', example: 'John' },
  { name: 'CUSTOMEREMAIL', description: 'Customer email address', category: 'customer', example: 'john@example.com' },
  { name: 'CUSTOMERPHONE', description: 'Customer phone number', category: 'customer', example: '+1-555-0123' },
  { name: 'CUSTOMERADDRESS', description: 'Customer shipping address', category: 'customer', example: '123 Main St, City, State' },
  
  // Order Variables
  { name: 'ORDERNUMBER', description: 'Order reference number', category: 'order', example: 'ORD-2025-001234' },
  { name: 'TRACKINGNUMBER', description: 'Package tracking number', category: 'order', example: 'TRK123456789' },
  { name: 'ORDERDATE', description: 'Date order was placed', category: 'order', example: 'January 15, 2025' },
  { name: 'DELIVERYDATE', description: 'Expected delivery date', category: 'order', example: 'January 20, 2025' },
  { name: 'ORDERVALUE', description: 'Total order amount', category: 'order', example: '$125.99' },
  { name: 'PAYMENTMETHOD', description: 'Payment method used', category: 'order', example: 'Credit Card ending in 1234' },
  
  // System Variables  
  { name: 'TICKETNUMBER', description: 'Support ticket reference', category: 'system', example: 'TKT-2025-5678' },
  { name: 'AGENTNAME', description: 'Customer service agent name', category: 'system', example: 'Sarah Johnson' },
  { name: 'COMPANYNAME', description: 'Company name (BFL)', category: 'system', example: 'Brands For Less' },
  { name: 'SUPPORTEMAIL', description: 'Customer support email', category: 'system', example: 'support@brandsforless.com' },
  { name: 'SUPPORTPHONE', description: 'Customer support phone', category: 'system', example: '+971-4-123-4567' },
  
  // Time Variables
  { name: 'CURRENTDATE', description: 'Current date', category: 'time', example: 'January 22, 2025' },
  { name: 'WAITINGTIME', description: 'How long customer has been waiting', category: 'time', example: '3 business days' },
  { name: 'PROCESSINGTIME', description: 'Expected processing time', category: 'time', example: '2-3 business days' },
  { name: 'BUSINESSHOURS', description: 'Customer service hours', category: 'time', example: '9 AM - 6 PM, Sunday - Thursday' },
];

export function extractVariablesFromTemplate(content: string): string[] {
  // Match variables in format [VARIABLENAME] or {variablename} - accept both cases
  const variableRegex = /[\[\{]([A-Za-z][A-Za-z0-9_]*)[\]\}]/g;
  const matches = content.match(variableRegex);
  if (!matches) return [];
  
  return Array.from(new Set(matches.map(match => 
    match.replace(/[\[\{\}\]]/g, '').toUpperCase()
  )));
}

export function replaceVariables(
  template: string, 
  customerData: Record<string, string> = {},
  systemData: Record<string, string> = {}
): string {
  return replaceVariablesInTemplate(template, customerData, {}, systemData);
}

export function replaceVariablesInTemplate(
  template: string, 
  customerData: Record<string, string> = {},
  additionalData: Record<string, string> = {},
  systemData: Record<string, string> = {}
): string {
  if (!template) return '';
  
  let result = template;
  
  // Get current date/time for time variables
  const currentDate = new Date();
  const defaultSystemData = {
    currentdate: currentDate.toLocaleDateString('en-US', { 
      year: 'numeric', month: 'long', day: 'numeric' 
    }),
    companyname: 'Brands For Less',
    supportemail: 'support@brandsforless.com',
    supportphone: '+971-4-123-4567',
    businesshours: '9 AM - 6 PM, Sunday - Thursday',
    ...systemData
  };
  
  const allData = { 
    ...customerData, 
    ...additionalData, 
    ...defaultSystemData 
  };
  
  // Replace variables in both [VARIABLE] and {VARIABLE} formats
  Object.entries(allData).forEach(([key, value]) => {
    if (key && value) {
      const patterns = [
        new RegExp(`\\[${key.toUpperCase()}\\]`, 'g'),
        new RegExp(`\\{${key.toUpperCase()}\\}`, 'g'),
        new RegExp(`\\{${key.toLowerCase()}\\}`, 'gi'),
        new RegExp(`\\{${key}\\}`, 'g')
      ];
      patterns.forEach(pattern => {
        result = result.replace(pattern, value);
      });
    }
  });
  
  return result;
}

export function validateTemplate(content: string): {
  isValid: boolean;
  issues: string[];
  variables: string[];
} {
  const variables = extractVariablesFromTemplate(content);
  const issues: string[] = [];
  
  // Check for unrecognized variables - but make it a warning, not an error
  const recognizedVariables = AVAILABLE_VARIABLES.map(v => v.name);
  const unrecognized = variables.filter(v => !recognizedVariables.includes(v));
  
  if (unrecognized.length > 0) {
    // Convert to warning instead of blocking error
    console.warn(`Note: Unrecognized variables found: ${unrecognized.join(', ')} - they will be left as-is in the template`);
  }
  
  // Check for empty template
  if (!content.trim()) {
    issues.push('Template content cannot be empty');
  }
  
  // Check for malformed variables - accept both uppercase and lowercase
  // Only flag truly malformed patterns like incomplete brackets
  const malformedRegex = /[\[\{][^\[\{\]\}]*[\[\{]|[\]\}][^\[\{\]\}]*[\]\}]/g;
  const malformed = content.match(malformedRegex);
  if (malformed) {
    issues.push(`Malformed variable brackets found: ${malformed.join(', ')} - Variables should use single brackets like [VARIABLE_NAME] or {variable_name}`);
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    variables
  };
}

export const TEMPLATE_WARNING_PRESETS: Record<string, string> = {
  'Order Issues': '⚠️ WARNING: Use this template only for order-related problems. Always verify order details before sending.',
  'Delivery Problems': '⚠️ WARNING: Confirm delivery address and tracking information before using this template.',
  'Payment Issues': '⚠️ WARNING: Handle payment issues with extra care. Verify customer identity before discussing payment details.',
  'Returns & Refunds': '⚠️ WARNING: Check return policy and eligibility before promising refunds. Escalate if uncertain.',
  'Product Inquiry': 'ℹ️ INFO: Use for general product questions. Always provide accurate product information.',
  'General Support': 'ℹ️ INFO: General purpose template. Customize based on specific customer needs.',
  'Escalation': '🚨 URGENT: Use only when escalating to management. Include all relevant details and context.',
  'Follow-up': '📋 FOLLOW-UP: Use for checking on previous issues. Reference original ticket number.',
  'Courtesy': '😊 COURTESY: Use for positive customer interactions and appreciation messages.',
  'Greeting': '👋 GREETING: Use for initial customer contact and welcome messages.',
  'CSAT': '📊 CSAT: Use for customer satisfaction surveys and feedback collection.',
  'Warning Abusive Language': '🛑 WARNING: Use when addressing inappropriate customer behavior. Handle with extreme care and escalate if necessary.',
  'Apology': '🙏 APOLOGY: Use for sincere apologies. Ensure genuine empathy and resolution commitment.',
  'Thank You': '💝 THANK YOU: Use to express gratitude for customer loyalty and patience.',
  'Farewell': '👋 FAREWELL: Use for closing conversations and ensuring customer satisfaction.',
  'Confirmation': '✅ CONFIRMATION: Use to confirm actions, changes, or resolutions.',
  'Information Request': '📋 INFO REQUEST: Use when requesting additional information from customers.',
  'Technical Support': '🔧 TECHNICAL: Use for technical issues and troubleshooting guidance.',
  'Holiday/Special Occasion': '🎉 SPECIAL: Use for holiday greetings and special occasion messages.'
};

export function getTemplateWarning(category: string, genre: string): string {
  return TEMPLATE_WARNING_PRESETS[category] || 
         TEMPLATE_WARNING_PRESETS[genre] || 
         'ℹ️ Please review this template before sending to ensure accuracy and appropriateness.';
}

// Quick Template Starters removed as requested - admins can now create dynamic templates with variables in names