export function replaceVariables(template: string, variables: Record<string, any>): string {
  let result = template;
  
  // Replace variables in the format {variable_name}
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    result = result.replace(regex, value || `{${key}}`);
  });
  
  return result;
}

export function extractVariables(template: string): string[] {
  const regex = /\{([^}]+)\}/g;
  const variables: string[] = [];
  let match;
  
  while ((match = regex.exec(template)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }
  
  return variables;
}

export function validateTemplate(template: { subject: string; content: string }): string[] {
  const errors: string[] = [];
  
  if (!template.subject.trim()) {
    errors.push('Subject is required');
  }
  
  if (!template.content.trim()) {
    errors.push('Content is required');
  }
  
  return errors;
}
