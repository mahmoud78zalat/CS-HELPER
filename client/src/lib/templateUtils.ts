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
  { name: 'AGENTSTNAME', description: 'Customer service agent name', category: 'system', example: 'Sarah Johnson' },
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
  // Match variables in format [VARIABLENAME] or {VARIABLENAME}
  const variableRegex = /[\[\{]([A-Z][A-Z0-9_]*)[\]\}]/g;
  const matches = content.match(variableRegex);
  if (!matches) return [];
  
  return Array.from(new Set(matches.map(match => 
    match.replace(/[\[\{\}\]]/g, '').toUpperCase()
  )));
}

export function replaceVariables(
  template: string, 
  customerData: Record<string, string> = {}
): string {
  return replaceVariablesInTemplate(template, customerData);
}

export function replaceVariablesInTemplate(
  template: string, 
  customerData: Record<string, string> = {},
  additionalData: Record<string, string> = {}
): string {
  if (!template) return '';
  
  let result = template;
  const allData = { ...customerData, ...additionalData };
  
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
  
  // Check for unrecognized variables
  const recognizedVariables = AVAILABLE_VARIABLES.map(v => v.name);
  const unrecognized = variables.filter(v => !recognizedVariables.includes(v));
  
  if (unrecognized.length > 0) {
    issues.push(`Unrecognized variables: ${unrecognized.join(', ')}`);
  }
  
  // Check for empty template
  if (!content.trim()) {
    issues.push('Template content cannot be empty');
  }
  
  // Check for malformed variables
  const malformedRegex = /[\[\{][a-z][^\[\{\]\}]*[\]\}]/g;
  const malformed = content.match(malformedRegex);
  if (malformed) {
    issues.push(`Variables should be in UPPERCASE: ${malformed.join(', ')}`);
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

export const QUICK_TEMPLATE_STARTERS = {
  'Order Delay': 'Dear [CUSTOMERNAME],\n\nWe sincerely apologize for the delay with your order [ORDERNUMBER]. Due to [REASON], your order has been delayed by [WAITINGTIME].\n\nWe are working to resolve this and expect your order to be processed within [PROCESSINGTIME].\n\nThank you for your patience.\n\nBest regards,\n[AGENTNAME]\nBrands For Less Customer Service',
  
  'Delivery Update': 'Hello [CUSTOMERNAME],\n\nYour order [ORDERNUMBER] has been shipped! You can track your package using tracking number [TRACKINGNUMBER].\n\nExpected delivery: [DELIVERYDATE]\n\nIf you have any questions, please contact us at [SUPPORTEMAIL].\n\nThank you for shopping with [COMPANYNAME]!',
  
  'Refund Confirmation': 'Dear [CUSTOMERNAME],\n\nYour refund request for order [ORDERNUMBER] has been processed.\n\nRefund amount: [ORDERVALUE]\nProcessing time: [PROCESSINGTIME]\nPayment method: [PAYMENTMETHOD]\n\nYou should see the refund in your account within [WAITINGTIME].\n\nBest regards,\n[AGENTNAME]',

  'Greeting Welcome': 'Hello [CUSTOMERNAME],\n\nWelcome to [COMPANYNAME]! We\'re delighted to have you as our valued customer.\n\nOur customer service team is here to assist you during [BUSINESSHOURS]. For immediate assistance, please contact us at [SUPPORTEMAIL] or [SUPPORTPHONE].\n\nThank you for choosing [COMPANYNAME]!\n\nBest regards,\n[AGENTNAME]',

  'CSAT Survey': 'Dear [CUSTOMERNAME],\n\nThank you for contacting [COMPANYNAME] customer service. We hope we were able to resolve your inquiry regarding [ORDERNUMBER].\n\nWe would appreciate your feedback on our service today. Please take a moment to rate your experience:\n\nYour feedback helps us improve our service quality.\n\nThank you for your time and for choosing [COMPANYNAME]!\n\nBest regards,\n[AGENTNAME]',

  'Warning Inappropriate Behavior': 'Dear [CUSTOMERNAME],\n\nWe understand your frustration regarding [ORDERNUMBER], and we are committed to resolving your concern.\n\nHowever, we must maintain a respectful communication environment. We kindly ask that all interactions remain professional and courteous.\n\nOur team is here to help you, and we believe we can resolve this matter together.\n\nFor immediate assistance, please contact us at [SUPPORTEMAIL].\n\nThank you for your understanding.\n\n[AGENTNAME]\n[COMPANYNAME] Customer Service',

  'Thank You Loyalty': 'Dear [CUSTOMERNAME],\n\nThank you for being a loyal [COMPANYNAME] customer! Your continued trust and support mean the world to us.\n\nWe appreciate your patience with [ORDERNUMBER] and are committed to providing you with the best possible service.\n\nIf you need any assistance, we\'re always here to help at [SUPPORTEMAIL] or [SUPPORTPHONE].\n\nThank you for choosing [COMPANYNAME]!\n\nWarm regards,\n[AGENTNAME]',

  'Final Resolution': 'Dear [CUSTOMERNAME],\n\nI\'m pleased to inform you that your concern regarding [ORDERNUMBER] has been fully resolved.\n\nSummary of resolution:\n- [RESOLUTION_DETAILS]\n\nIf you have any further questions or concerns, please don\'t hesitate to contact us at [SUPPORTEMAIL].\n\nThank you for your patience and for giving us the opportunity to serve you.\n\nBest regards,\n[AGENTNAME]\n[COMPANYNAME] Customer Service'
};