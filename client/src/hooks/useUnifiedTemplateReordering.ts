import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export interface ReorderUpdate {
  id: string;
  stageOrder: number;
  groupOrder?: number;
}

// Unified reordering system for ALL template types
export const useUnifiedTemplateReordering = (templateType: 'live-reply-templates' | 'email-templates' | 'faq-templates' | 'variable-templates') => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const reorderMutation = useMutation({
    mutationFn: async (updates: ReorderUpdate[]) => {
      console.log(`[UnifiedReordering] Reordering ${templateType}:`, updates);
      return apiRequest('POST', `/api/${templateType}/reorder`, { updates });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/${templateType}`] });
      toast({
        title: "Success",
        description: "Templates reordered successfully"
      });
    },
    onError: (error) => {
      console.error(`Failed to reorder ${templateType}:`, error);
      toast({
        title: "Error",
        description: `Failed to reorder templates`,
        variant: "destructive"
      });
    }
  });

  return {
    reorderTemplates: reorderMutation.mutate,
    isReordering: reorderMutation.isPending
  };
};