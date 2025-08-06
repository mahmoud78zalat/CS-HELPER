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
  
  // Process customer data and handle special mappings
  const processedCustomerData = { ...customerData };
  
  // Handle gender field transformation
  if (customerData.gender) {
    if (customerData.gender.toLowerCase() === 'male') {
      processedCustomerData.gender = 'Sir';
    } else if (customerData.gender.toLowerCase() === 'female') {
      processedCustomerData.gender = 'Ma\'am';
    }
  }
  
  // Add phone number mapping for template variables
  if (customerData.customer_phone) {
    processedCustomerData.phone_number = customerData.customer_phone;
  }
  
  const allData = { 
    ...processedCustomerData, 
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

// Removed hardcoded warning presets - admins manually write warning notes

// Quick Template Starters removed as requested - admins can now create dynamic templates with variables in names