import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useAdminModal } from '@/contexts/AdminModalContext';
import { apiRequest } from '@/lib/queryClient';

interface TemplateOrderUpdate {
  id: string;
  stageOrder: number;
}

interface UserOrderingData {
  templateId: string;
  localOrder: number;
  lastReordered: Date;
}

export function useTemplateOrdering() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { isAdminModalOpen } = useAdminModal();
  const queryClient = useQueryClient();

  // Admin template reordering (global changes)
  const adminReorderMutation = useMutation({
    mutationFn: async (updates: TemplateOrderUpdate[]) => {
      console.log('[useTemplateOrdering] Admin reordering templates:', updates);
      const response = await apiRequest('POST', '/api/live-reply-templates/reorder', { updates });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/live-reply-templates'] });
      toast({
        title: "Admin template order updated",
        description: "Global template order has been updated for all users",
        className: "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
      });
    },
    onError: (error: any) => {
      console.error('[useTemplateOrdering] Admin reordering failed:', error);
      toast({
        title: "Failed to update template order",
        description: error.message || 'An error occurred while updating template order',
        variant: "destructive"
      });
    }
  });

  // Personal template reordering (user preferences)
  const personalReorderMutation = useMutation({
    mutationFn: async (ordering: UserOrderingData[]) => {
      if (!user?.id) throw new Error('User ID required');
      
      console.log('[useTemplateOrdering] Personal reordering templates for user:', user.id, ordering);
      const response = await apiRequest('POST', '/api/user-ordering/live-reply-templates', {
        user_id: user.id,
        ordering
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/live-reply-templates'] });
      toast({
        title: "Personal template order updated",
        description: "Templates reordered for your personal view only",
        className: "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
      });
    },
    onError: (error: any) => {
      console.error('[useTemplateOrdering] Personal reordering failed:', error);
      toast({
        title: "Failed to update personal order",
        description: error.message || 'An error occurred while updating your personal template order',
        variant: "destructive"
      });
    }
  });

  // Smart reordering function that detects context
  const reorderTemplates = (templateIds: string[]) => {
    console.log('[useTemplateOrdering] Reordering templates - Admin modal open:', isAdminModalOpen);
    
    if (isAdminModalOpen) {
      // Admin context: Update global database order
      const updates = templateIds.map((id, index) => ({
        id,
        stageOrder: index
      }));
      console.log('[useTemplateOrdering] Using admin reordering:', updates);
      adminReorderMutation.mutate(updates);
    } else {
      // Personal context: Update user preferences
      const ordering = templateIds.map((templateId, index) => ({
        templateId,
        localOrder: index,
        lastReordered: new Date()
      }));
      console.log('[useTemplateOrdering] Using personal reordering:', ordering);
      personalReorderMutation.mutate(ordering);
    }
  };

  return {
    reorderTemplates,
    isReordering: adminReorderMutation.isPending || personalReorderMutation.isPending,
    adminReorder: adminReorderMutation.mutate,
    personalReorder: personalReorderMutation.mutate
  };
}