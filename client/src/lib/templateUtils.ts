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
  systemData: Record<string, string> = {},
  isArabic: boolean = false
): string {
  return replaceVariablesInTemplate(template, customerData, {}, systemData, isArabic);
}

export function replaceVariablesInTemplate(
  template: string, 
  customerData: Record<string, string> = {},
  additionalData: Record<string, string> = {},
  systemData: Record<string, string> = {},
  isArabic: boolean = false
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
  
  // Handle delivery date formatting - convert to "25th of August 2025" format
  if (customerData.delivery_date) {
    try {
      const date = new Date(customerData.delivery_date);
      const day = date.getDate();
      const year = date.getFullYear();
      
      // Use the isArabic parameter or detect from template content
      const isArabicTemplate = isArabic || template.includes('عربي') || template.includes('السلام') || template.includes('شكرا') || template.includes('أهلا') || template.includes('مرحبا') || /[\u0600-\u06FF]/.test(template);
      
      if (isArabicTemplate) {
        // Arabic date formatting
        const arabicMonths = [
          'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
          'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
        ];
        
        // Convert numbers to Arabic-Indic numerals
        const toArabicNumerals = (num: number): string => {
          const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
          return num.toString().split('').map(digit => arabicNumerals[parseInt(digit)]).join('');
        };
        
        const arabicDay = toArabicNumerals(day);
        const arabicMonth = arabicMonths[date.getMonth()];
        const arabicYear = toArabicNumerals(year);
        
        processedCustomerData.delivery_date = `${arabicDay} ${arabicMonth} ${arabicYear}`;
      } else {
        // English date formatting
        const month = date.toLocaleDateString('en-US', { month: 'long' });
        
        // Add ordinal suffix (1st, 2nd, 3rd, 4th, etc.)
        const getOrdinalSuffix = (day: number) => {
          if (day >= 11 && day <= 13) return 'th';
          switch (day % 10) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
          }
        };
        
        processedCustomerData.delivery_date = `${day}${getOrdinalSuffix(day)} of ${month} ${year}`;
      }
    } catch (error) {
      // If date parsing fails, keep original value
      processedCustomerData.delivery_date = customerData.delivery_date;
    }
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