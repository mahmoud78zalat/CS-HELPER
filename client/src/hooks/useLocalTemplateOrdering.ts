import { useState, useEffect } from 'react';
import { Template } from '@shared/schema';

interface LocalTemplateOrder {
  templateId: string;
  localOrder: number;
  lastReordered: Date;
}

export function useLocalTemplateOrdering(userId: string) {
  const [localOrdering, setLocalOrdering] = useState<LocalTemplateOrder[]>([]);
  const storageKey = `template-ordering-${userId}`;

  // Load local ordering on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        setLocalOrdering(parsed.map((item: any) => ({
          ...item,
          lastReordered: new Date(item.lastReordered)
        })));
      }
    } catch (error) {
      console.error('Error loading local template ordering:', error);
    }
  }, [storageKey]);

  // Save local ordering to localStorage
  const saveOrdering = (ordering: LocalTemplateOrder[]) => {
    try {
      console.log('[useLocalTemplateOrdering] Saving ordering:', {
        storageKey,
        ordering,
        userId
      });
      localStorage.setItem(storageKey, JSON.stringify(ordering));
      setLocalOrdering(ordering);
      console.log('[useLocalTemplateOrdering] Successfully saved ordering');
    } catch (error) {
      console.error('[useLocalTemplateOrdering] Failed to save ordering:', error);
    }
  };

  // Apply local ordering to templates (combines admin stageOrder with user preferences)
  const applyLocalOrdering = (templates: Template[]): Template[] => {
    if (!templates?.length) return templates;

    console.log('[useLocalTemplateOrdering] Applying ordering to templates:', {
      templatesCount: templates.length,
      localOrderingCount: localOrdering.length,
      sampleTemplateOrders: templates.slice(0, 3).map(t => ({ id: t.id, name: t.name, stageOrder: t.stageOrder }))
    });

    const result = templates.map(template => {
      const localOrder = localOrdering.find(lo => lo.templateId === template.id);
      const effectiveOrder = localOrder?.localOrder ?? template.stageOrder ?? 0;
      
      return {
        ...template,
        // If user has custom ordering, use it; otherwise use admin stageOrder
        _effectiveOrder: effectiveOrder,
        _hasLocalOrder: !!localOrder,
      };
    }).sort((a, b) => {
      // Sort by effective order (user preference or admin stageOrder)
      const orderDiff = (a._effectiveOrder || 0) - (b._effectiveOrder || 0);
      if (orderDiff !== 0) return orderDiff;
      
      // If order is the same, maintain stable sort by creation date
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

    console.log('[useLocalTemplateOrdering] Applied ordering result:', {
      sampleOrders: result.slice(0, 5).map(t => ({ 
        id: t.id, 
        name: t.name, 
        stageOrder: t.stageOrder, 
        effectiveOrder: t._effectiveOrder,
        hasLocalOrder: t._hasLocalOrder 
      }))
    });

    return result;
  };

  // Update local ordering for a specific template (for drag & drop only)
  const updateLocalOrder = (templateId: string, newOrder: number) => {
    console.log('[useLocalTemplateOrdering] updateLocalOrder called:', {
      templateId,
      newOrder,
      existingLocalOrdering: localOrdering
    });
    
    const existing = localOrdering.find(lo => lo.templateId === templateId);
    const updated = existing
      ? { ...existing, localOrder: newOrder, lastReordered: new Date() }
      : { templateId, localOrder: newOrder, lastReordered: new Date() };

    console.log('[useLocalTemplateOrdering] Updated template order:', updated);

    const newOrdering = localOrdering.filter(lo => lo.templateId !== templateId);
    newOrdering.push(updated);
    
    console.log('[useLocalTemplateOrdering] Final new ordering:', newOrdering);
    saveOrdering(newOrdering);
  };

  // Bulk update ordering (for drag & drop reorder within a group)
  const updateBulkOrdering = (orderedTemplateIds: string[]) => {
    console.log('[useLocalTemplateOrdering] updateBulkOrdering called:', {
      orderedTemplateIds,
      existingLocalOrdering: localOrdering,
      userId
    });
    
    // Create a mapping of the new orders
    const newOrderMappings = orderedTemplateIds.map((templateId, index) => ({
      templateId,
      localOrder: index,
      lastReordered: new Date()
    }));

    console.log('[useLocalTemplateOrdering] New order mappings:', newOrderMappings);

    // Update existing ordering by removing old entries for these templates and adding new ones
    const filteredOrdering = localOrdering.filter(
      lo => !orderedTemplateIds.includes(lo.templateId)
    );
    
    console.log('[useLocalTemplateOrdering] Filtered ordering (removed existing):', filteredOrdering);
    
    const updatedOrdering = [...filteredOrdering, ...newOrderMappings];
    console.log('[useLocalTemplateOrdering] Final updated ordering:', updatedOrdering);
    
    saveOrdering(updatedOrdering);
  };

  // Reset local ordering (use admin ordering only)
  const resetToAdminOrdering = () => {
    console.log('[useLocalTemplateOrdering] Resetting to admin ordering');
    
    // Clear template ordering
    localStorage.removeItem(storageKey);
    setLocalOrdering([]);
    
    // Also clear any group ordering localStorage for this user
    const groupOrderingKey = `group-ordering-${userId}`;
    localStorage.removeItem(groupOrderingKey);
    
    // Clear any other potential ordering-related localStorage
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes(`ordering-${userId}`) || key.includes(`reorder-${userId}`)) {
        console.log('[useLocalTemplateOrdering] Clearing additional ordering key:', key);
        localStorage.removeItem(key);
      }
    });
    
    console.log('[useLocalTemplateOrdering] Reset complete - cleared template and group positions');
  };

  // Clear local ordering when admin updates stageOrder
  const clearLocalOrderingForAdmin = () => {
    console.log('[useLocalTemplateOrdering] Admin made changes - clearing local ordering');
    
    // Clear template ordering
    localStorage.removeItem(storageKey);
    setLocalOrdering([]);
    
    // Also clear any group ordering localStorage for this user
    const groupOrderingKey = `group-ordering-${userId}`;
    localStorage.removeItem(groupOrderingKey);
    
    // Clear any other potential ordering-related localStorage
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes(`ordering-${userId}`) || key.includes(`reorder-${userId}`)) {
        console.log('[useLocalTemplateOrdering] Clearing additional ordering key:', key);
        localStorage.removeItem(key);
      }
    });
  };

  return {
    applyLocalOrdering,
    updateLocalOrder,
    updateBulkOrdering,
    resetToAdminOrdering,
    clearLocalOrderingForAdmin,
    localOrdering,
    hasLocalOrdering: localOrdering.length > 0
  };
}