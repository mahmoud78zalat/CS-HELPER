import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export interface DragDropItem {
  id: string;
  displayOrder?: number;
  [key: string]: any;
}

export interface UseDragAndDropProps {
  contentType: string; // 'live_reply_templates', 'email_templates', 'faqs', etc.
  items: DragDropItem[];
  onReorder?: (reorderedItems: DragDropItem[]) => void;
}

export function useDragAndDrop({
  contentType,
  items,
  onReorder
}: UseDragAndDropProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Get user's ordering preferences
  const getUserOrdering = useCallback(async () => {
    if (!user) return [];

    try {
      const response = await fetch(`/api/user-ordering/${contentType}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        // If no ordering exists, return empty array (items will be in default order)
        return [];
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch user ordering:', error);
      return [];
    }
  }, [user, contentType]);

  // Save user's ordering preferences
  const saveUserOrdering = useCallback(async (orderedItems: DragDropItem[]) => {
    if (!user) return false;

    setIsUpdating(true);
    try {
      const orderingData = orderedItems.map((item, index) => ({
        item_id: item.id,
        display_order: index + 1
      }));

      const response = await apiRequest('POST', `/api/user-ordering/${contentType}`, {
        user_id: user.id,
        ordering: orderingData
      });

      if (response) {
        toast({
          title: "Order saved successfully",
          description: "Your layout preferences have been saved.",
        });
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Failed to save user ordering:', error);
      toast({
        title: "Failed to save order",
        description: error.message || "Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [user, contentType, toast]);

  // Apply user's ordering to items
  const applyUserOrdering = useCallback((items: DragDropItem[], userOrdering: any[]) => {
    if (!userOrdering || userOrdering.length === 0) {
      // No user ordering, return items in their default order (creation order)
      return items.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        return 0;
      });
    }

    // Create a map for quick lookup of user ordering
    const orderingMap = new Map(
      userOrdering.map(order => [order.item_id, order.display_order])
    );

    // Sort items based on user's display order
    return items.sort((a, b) => {
      const orderA = orderingMap.get(a.id) || 999999;
      const orderB = orderingMap.get(b.id) || 999999;
      
      if (orderA === orderB) {
        // Fallback to creation order for items not in user ordering
        if (a.createdAt && b.createdAt) {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
      }
      
      return orderA - orderB;
    });
  }, []);

  // Handle drag start
  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  // Handle drag end with reordering
  const handleDragEnd = useCallback(async (event: any) => {
    setIsDragging(false);
    
    const { active, over } = event;
    
    if (!active || !over || active.id === over.id) {
      return;
    }

    // Find the items being moved
    const oldIndex = items.findIndex(item => item.id === active.id);
    const newIndex = items.findIndex(item => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Create new ordered array
    const reorderedItems = [...items];
    const [movedItem] = reorderedItems.splice(oldIndex, 1);
    reorderedItems.splice(newIndex, 0, movedItem);

    // Call onReorder callback immediately for UI update
    onReorder?.(reorderedItems);

    // Save the new ordering to the database
    await saveUserOrdering(reorderedItems);
  }, [items, onReorder, saveUserOrdering]);

  return {
    isDragging,
    isUpdating,
    getUserOrdering,
    saveUserOrdering,
    applyUserOrdering,
    handleDragStart,
    handleDragEnd,
  };
}