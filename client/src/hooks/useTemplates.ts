import { useQuery } from '@tanstack/react-query';
import { Template } from '@shared/schema';
import { supabaseQueries } from '@/lib/supabaseQueries';

interface TemplateFilters {
  category?: string;
  genre?: string;
  search?: string;
  isActive?: boolean;
}

export function useTemplates(filters?: TemplateFilters) {
  return useQuery<Template[]>({
    queryKey: ['templates', filters],
    queryFn: () => supabaseQueries.getTemplates(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
