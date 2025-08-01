// Template utility functions for dynamic variable management
// Variables are now fetched dynamically from Supabase via useDynamicVariables hook

// Helper function to escape special regex characters
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function extractVariablesFromTemplate(content: string): string[] {
  // Only support {variable} format - completely removed [VARIABLE] format
  // Match variables in format {variable_name} (case-sensitive)
  const curlyRegex = /\{([a-zA-Z][a-zA-Z0-9_]*)\}/g;
  
  const curlyMatches = content.match(curlyRegex) || [];
  const curlyVars = curlyMatches.map(match => match.slice(1, -1)); // Keep original case
  
  // Remove duplicates while preserving the original variable names
  return Array.from(new Set(curlyVars));
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
  
  // Replace variables only in {variable} format
  // Handle exact case matching for {variable} format
  Object.entries(allData).forEach(([key, value]) => {
    if (key && value) {
      const patterns = [
        // Exact case matching for {variable} format
        new RegExp(`\\{${escapeRegExp(key)}\\}`, 'g'),
        // Case-insensitive matching for backward compatibility with existing templates
        new RegExp(`\\{${escapeRegExp(key)}\\}`, 'gi')
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
  
  // All variables are accepted - validation is now permissive
  // Users can use any variables they want and they'll be replaced if data is available
  
  // Check for empty template
  if (!content.trim()) {
    issues.push('Template content cannot be empty');
  }
  
  // Check for malformed variables - only support {variable} format
  // Only flag truly malformed patterns like incomplete brackets
  const malformedRegex = /\{[^}]*\{|\}[^{]*\}/g;
  const malformed = content.match(malformedRegex);
  if (malformed) {
    issues.push(`Malformed variable brackets found: ${malformed.join(', ')} - Variables should use {variable_name} format only`);
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