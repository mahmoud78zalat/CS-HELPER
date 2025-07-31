import { useQuery } from '@tanstack/react-query';

export interface DynamicVariable {
  id: string;
  name: string;
  description: string;
  category: 'customer' | 'order' | 'system' | 'time';
  example: string;
  defaultValue?: string;
  isSystem: boolean;
}

export interface TemplateVariableCategory {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
}

export function useDynamicVariables() {
  // Fetch all template variables from Supabase
  const { data: variables = [], isLoading: variablesLoading, error: variablesError } = useQuery<DynamicVariable[]>({
    queryKey: ['/api/template-variables'],
    queryFn: async () => {
      const response = await fetch('/api/template-variables');
      if (!response.ok) {
        throw new Error('Failed to fetch template variables');
      }
      const data = await response.json();
      // Sort by order property to ensure consistent ordering across all components
      return data.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    },
  });

  // Fetch variable categories from Supabase
  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useQuery<TemplateVariableCategory[]>({
    queryKey: ['/api/template-variable-categories'],
  });

  // Group variables by category
  const variablesByCategory = variables.reduce((acc, variable) => {
    if (!acc[variable.category]) {
      acc[variable.category] = [];
    }
    acc[variable.category].push(variable);
    return acc;
  }, {} as Record<string, DynamicVariable[]>);

  // Get variables for template forms
  const getVariablesForCategory = (category: string) => {
    return variablesByCategory[category] || [];
  };

  // Get all variable names for template validation
  const getAllVariableNames = () => {
    return variables.map(v => v.name.toLowerCase());
  };

  // Convert to the format expected by existing components
  const getTemplateVariablesFormat = () => {
    const formatted: Record<string, Array<{key: string, label: string, placeholder: string}>> = {};
    
    Object.entries(variablesByCategory).forEach(([category, vars]) => {
      formatted[category] = vars.map(v => ({
        key: v.name.toLowerCase(),
        label: v.description,
        placeholder: v.example || v.defaultValue || `Enter ${v.name.toLowerCase()}`
      }));
    });

    return formatted;
  };

  return {
    variables,
    categories,
    variablesByCategory,
    isLoading: variablesLoading || categoriesLoading,
    error: variablesError || categoriesError,
    getVariablesForCategory,
    getAllVariableNames,
    getTemplateVariablesFormat,
  };
}