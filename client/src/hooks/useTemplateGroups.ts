import { useQuery } from "@tanstack/react-query";

interface TemplateGroup {
  id: string;
  name: string;
  description?: string;
  color: string;
  orderIndex: number;
  isActive: boolean;
  templates?: any[];
}

export function useTemplateGroups() {
  return useQuery<TemplateGroup[]>({
    queryKey: ['/api/live-reply-template-groups'],
    staleTime: 5000,
    refetchInterval: 10000
  });
}