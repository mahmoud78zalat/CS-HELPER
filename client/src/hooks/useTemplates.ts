import { useQuery } from '@tanstack/react-query';
import { Template } from '@shared/schema';

interface TemplateFilters {
  category?: string;
  genre?: string;
  search?: string;
  isActive?: boolean;
}

export function useTemplates(filters?: TemplateFilters) {
  return useQuery<Template[]>({
    queryKey: ['/api/templates', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters?.category) params.append('category', filters.category);
      if (filters?.genre) params.append('genre', filters.genre);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());
      
      const url = `/api/templates${params.toString() ? `?${params.toString()}` : ''}`;
      
      const response = await fetch(url, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
