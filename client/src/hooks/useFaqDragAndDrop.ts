import { useState } from 'react';
import { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface UseFaqDragAndDropProps {
  items: any[];
  onReorder: (reorderedItems: any[]) => void;
  onSuccess?: () => void;
}

export function useFaqDragAndDrop({ items, onReorder, onSuccess }: UseFaqDragAndDropProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      setActiveId(null);
      return;
    }

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reorderedItems = arrayMove(items, oldIndex, newIndex);
      
      // Update local state immediately for smooth UX
      onReorder(reorderedItems);
      
      // Save the new order to the database using the dedicated FAQ reorder endpoint
      try {
        const updates = reorderedItems.map((item, index) => ({
          id: item.id,
          order: index + 1
        }));

        console.log('[useFaqDragAndDrop] Saving FAQ ordering:', updates);

        await apiRequest('POST', '/api/faqs/reorder', {
          updates
        });
        
        console.log('[useFaqDragAndDrop] Successfully saved FAQ ordering');
        
        // Show success toast
        toast({
          title: "FAQ order updated successfully",
          description: "Your changes have been saved.",
          variant: "default"
        });
        
        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess();
        }
        
      } catch (error) {
        console.error('[useFaqDragAndDrop] Failed to save FAQ ordering:', error);
        
        // Show error toast
        toast({
          title: "Failed to update FAQ order",
          description: "Please try again or refresh the page.",
          variant: "destructive"
        });
        
        // Revert the local state on error
        onReorder(items);
      }
    }

    setActiveId(null);
  };

  return {
    activeId,
    handleDragStart,
    handleDragEnd,
  };
}