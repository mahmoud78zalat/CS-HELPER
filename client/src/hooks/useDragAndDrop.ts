import { useState } from 'react';
import { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { apiRequest } from '@/lib/queryClient';

interface UseDragAndDropProps {
  contentType: string;
  items: any[];
  onReorder: (reorderedItems: any[]) => void;
}

export function useDragAndDrop({ contentType, items, onReorder }: UseDragAndDropProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

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
      
      // Save the new order to the database
      try {
        const orderData = reorderedItems.map((item, index) => ({
          id: item.id,
          order: index + 1
        }));

        await apiRequest('POST', `/api/user-ordering/${contentType}`, {
          ordering: orderData
        });
      } catch (error) {
        console.error('Failed to save ordering:', error);
        // Optionally revert the local state on error
        // onReorder(items);
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