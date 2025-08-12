import { useState, useEffect } from 'react';
import { Template } from '@shared/schema';

interface LocalTemplateOrder {
  templateId: string;
  localOrder: number;
  lastReordered: Date;
}

interface LocalGroupOrder {
  groupId: string;
  localOrder: number;
  lastReordered: Date;
}

export function useLocalTemplateOrdering(userId: string) {
  const [localOrdering, setLocalOrdering] = useState<LocalTemplateOrder[]>([]);
  const [localGroupOrdering, setLocalGroupOrdering] = useState<LocalGroupOrder[]>([]);
  const storageKey = `template-ordering-${userId}`;
  const groupStorageKey = `group-ordering-${userId}`;

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
      // Clear corrupted data from localStorage
      try {
        localStorage.removeItem(storageKey);
      } catch (clearError) {
        console.error('Failed to clear corrupted localStorage data:', clearError);
      }
    }
  }, [storageKey]);

  // Load local group ordering on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(groupStorageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        setLocalGroupOrdering(parsed.map((item: any) => ({
          ...item,
          lastReordered: new Date(item.lastReordered)
        })));
      }
    } catch (error) {
      console.error('Error loading local group ordering:', error);
      // Clear corrupted data from localStorage
      try {
        localStorage.removeItem(groupStorageKey);
      } catch (clearError) {
        console.error('Failed to clear corrupted localStorage data:', clearError);
      }
    }
  }, [groupStorageKey]);

  // Save local ordering to localStorage
  const saveOrdering = (ordering: LocalTemplateOrder[]) => {
    try {
      console.log('[useLocalTemplateOrdering] Saving template ordering:', {
        storageKey,
        ordering,
        userId
      });
      localStorage.setItem(storageKey, JSON.stringify(ordering));
      setLocalOrdering(ordering);
      console.log('[useLocalTemplateOrdering] Successfully saved template ordering');
    } catch (error) {
      console.error('[useLocalTemplateOrdering] Failed to save template ordering:', error);
    }
  };

  // Save local group ordering to localStorage
  const saveGroupOrdering = (ordering: LocalGroupOrder[]) => {
    try {
      console.log('[useLocalTemplateOrdering] Saving group ordering:', {
        groupStorageKey,
        ordering,
        userId
      });
      localStorage.setItem(groupStorageKey, JSON.stringify(ordering));
      setLocalGroupOrdering(ordering);
      console.log('[useLocalTemplateOrdering] Successfully saved group ordering');
    } catch (error) {
      console.error('[useLocalTemplateOrdering] Failed to save group ordering:', error);
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

  // Update local ordering for a specific template (for drag & drop only) - NEVER calls backend API
  const updateLocalOrder = (templateId: string, newOrder: number) => {
    console.log('[useLocalTemplateOrdering] updateLocalOrder called (LOCAL ONLY):', {
      templateId,
      newOrder,
      existingLocalOrdering: localOrdering,
      userId
    });
    
    const existing = localOrdering.find(lo => lo.templateId === templateId);
    const updated = existing
      ? { ...existing, localOrder: newOrder, lastReordered: new Date() }
      : { templateId, localOrder: newOrder, lastReordered: new Date() };

    console.log('[useLocalTemplateOrdering] Updated template order (LOCAL ONLY):', updated);

    const newOrdering = localOrdering.filter(lo => lo.templateId !== templateId);
    newOrdering.push(updated);
    
    console.log('[useLocalTemplateOrdering] Final new ordering (STORED LOCALLY):', newOrdering);
    saveOrdering(newOrdering);
  };

  // Bulk update ordering (for drag & drop reorder within a group)
  const updateBulkOrdering = (orderedTemplateIds: string[]) => {
    console.log('[useLocalTemplateOrdering] updateBulkOrdering called (LOCAL STORAGE ONLY - NO API CALLS):', {
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

    console.log('[useLocalTemplateOrdering] New order mappings (STORED LOCALLY ONLY):', newOrderMappings);

    // Update existing ordering by removing old entries for these templates and adding new ones
    const filteredOrdering = localOrdering.filter(
      lo => !orderedTemplateIds.includes(lo.templateId)
    );
    
    console.log('[useLocalTemplateOrdering] Filtered ordering (removed existing):', filteredOrdering);
    
    const updatedOrdering = [...filteredOrdering, ...newOrderMappings];
    console.log('[useLocalTemplateOrdering] Final updated ordering (LOCAL STORAGE ONLY):', updatedOrdering);
    
    saveOrdering(updatedOrdering);
  };

  // Apply local ordering to template groups (for non-admin users only)
  const applyLocalGroupOrdering = (groups: any[]): any[] => {
    if (!groups?.length) return groups;

    console.log('[useLocalTemplateOrdering] Applying group ordering:', {
      groupsCount: groups.length,
      localGroupOrderingCount: localGroupOrdering.length,
      sampleGroups: groups.slice(0, 3).map(g => ({ id: g.id, name: g.name, orderIndex: g.orderIndex }))
    });

    const result = groups.map(group => {
      const localOrder = localGroupOrdering.find(lo => lo.groupId === group.id);
      const effectiveOrder = localOrder?.localOrder ?? group.orderIndex ?? 0;
      
      return {
        ...group,
        _effectiveOrder: effectiveOrder,
        _hasLocalOrder: !!localOrder,
      };
    }).sort((a, b) => {
      // Sort by effective order (user preference or admin orderIndex)
      const orderDiff = (a._effectiveOrder || 0) - (b._effectiveOrder || 0);
      if (orderDiff !== 0) return orderDiff;
      
      // If order is the same, maintain stable sort by creation date
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

    console.log('[useLocalTemplateOrdering] Applied group ordering result:', {
      sampleOrders: result.slice(0, 5).map(g => ({ 
        id: g.id, 
        name: g.name, 
        orderIndex: g.orderIndex, 
        effectiveOrder: g._effectiveOrder,
        hasLocalOrder: g._hasLocalOrder 
      }))
    });

    return result;
  };

  // Update local group ordering (for drag & drop only)
  const updateLocalGroupOrder = (groupId: string, newOrder: number) => {
    console.log('[useLocalTemplateOrdering] updateLocalGroupOrder called:', {
      groupId,
      newOrder,
      existingLocalGroupOrdering: localGroupOrdering
    });
    
    const existing = localGroupOrdering.find(lo => lo.groupId === groupId);
    const updated = existing
      ? { ...existing, localOrder: newOrder, lastReordered: new Date() }
      : { groupId, localOrder: newOrder, lastReordered: new Date() };

    console.log('[useLocalTemplateOrdering] Updated group order:', updated);

    const newOrdering = localGroupOrdering.filter(lo => lo.groupId !== groupId);
    newOrdering.push(updated);
    
    console.log('[useLocalTemplateOrdering] Final new group ordering:', newOrdering);
    saveGroupOrdering(newOrdering);
  };

  // Bulk update group ordering (for drag & drop reorder)
  const updateBulkGroupOrdering = (orderedGroupIds: string[]) => {
    console.log('[useLocalTemplateOrdering] updateBulkGroupOrdering called:', {
      orderedGroupIds,
      existingLocalGroupOrdering: localGroupOrdering,
      userId
    });
    
    // Create a mapping of the new orders
    const newOrderMappings = orderedGroupIds.map((groupId, index) => ({
      groupId,
      localOrder: index,
      lastReordered: new Date()
    }));

    console.log('[useLocalTemplateOrdering] New group order mappings:', newOrderMappings);

    // Update existing ordering by removing old entries for these groups and adding new ones
    const filteredOrdering = localGroupOrdering.filter(
      lo => !orderedGroupIds.includes(lo.groupId)
    );
    
    console.log('[useLocalTemplateOrdering] Filtered group ordering (removed existing):', filteredOrdering);
    
    const updatedOrdering = [...filteredOrdering, ...newOrderMappings];
    console.log('[useLocalTemplateOrdering] Final updated group ordering:', updatedOrdering);
    
    saveGroupOrdering(updatedOrdering);
  };

  // Reset local ordering (use admin ordering only) - now resets both templates and groups
  const resetToAdminOrdering = () => {
    console.log('[useLocalTemplateOrdering] Resetting to admin ordering - both templates and groups');
    localStorage.removeItem(storageKey);
    localStorage.removeItem(groupStorageKey);
    setLocalOrdering([]);
    setLocalGroupOrdering([]);
  };

  // Clear local ordering when admin updates stageOrder
  const clearLocalOrderingForAdmin = () => {
    console.log('[useLocalTemplateOrdering] Admin made changes - clearing local ordering');
    localStorage.removeItem(storageKey);
    localStorage.removeItem(groupStorageKey);
    setLocalOrdering([]);
    setLocalGroupOrdering([]);
  };

  return {
    applyLocalOrdering,
    applyLocalGroupOrdering,
    updateLocalOrder,
    updateLocalGroupOrder,
    updateBulkOrdering,
    updateBulkGroupOrdering,
    resetToAdminOrdering,
    clearLocalOrderingForAdmin,
    localOrdering,
    localGroupOrdering,
    hasLocalOrdering: localOrdering.length > 0 || localGroupOrdering.length > 0
  };
}