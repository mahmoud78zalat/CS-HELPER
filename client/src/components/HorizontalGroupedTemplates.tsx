import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash, GripHorizontal, Eye, Plus, FolderOpen, Palette, ArrowUpDown } from "lucide-react";
import { DndContext, closestCenter, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay, useDroppable } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, horizontalListSortingStrategy, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocalTemplateOrdering } from "@/hooks/useLocalTemplateOrdering";
import { getGenreColor, getCategoryColor, getGenreBadgeClasses, getCategoryBadgeClasses } from "@/lib/templateColors";

interface LiveTemplate {
  id: string;
  name: string;
  category: string;
  genre: string;
  content: string;
  contentEn?: string;
  contentAr?: string;
  groupId?: string;
  stageOrder?: number;
  groupOrder?: number;
  usageCount?: number;
  variables?: string[] | null;
  isActive?: boolean;
}

interface TemplateGroup {
  id: string;
  name: string;
  description?: string;
  color: string;
  orderIndex: number;
  isActive: boolean;
  templates: LiveTemplate[];
}

interface HorizontalGroupedTemplatesProps {
  templates: LiveTemplate[];
  groups?: TemplateGroup[];
  onEdit: (template: LiveTemplate) => void;
  onDelete: (templateId: string) => void;
  onPreview?: (template: LiveTemplate) => void;
  onCreateGroup?: () => void;
  onEditGroup?: (group: TemplateGroup) => void;
}

// Sortable Template Item Component (Horizontal Card)
const SortableTemplateItem = ({ template, onEdit, onDelete, onPreview }: {
  template: LiveTemplate;
  onEdit: (template: LiveTemplate) => void;
  onDelete: (templateId: string) => void;
  onPreview?: (template: LiveTemplate) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: template.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card 
      ref={setNodeRef} 
      style={style} 
      className={`w-[280px] min-w-[280px] max-w-[280px] ${isDragging ? 'shadow-lg z-50' : ''} hover:shadow-md transition-shadow bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700`}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <div 
            {...attributes} 
            {...listeners} 
            className="cursor-grab active:cursor-grabbing mt-0.5 p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
          >
            <GripHorizontal className="h-4 w-4 text-gray-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-1.5">
              <h4 className="font-medium text-slate-800 dark:text-slate-200 text-sm flex-1 min-w-0 pr-2">
                {template.name}
              </h4>
              
              <div className="flex gap-1 flex-shrink-0 ml-auto">
                {onPreview && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPreview(template)}
                    className="h-8 w-8 p-0 border-slate-300 bg-white hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700"
                    title="Preview Template"
                  >
                    <Eye className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(template)}
                  className="h-8 w-8 p-0 border-slate-300 bg-white hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700"
                  title="Edit Template"
                >
                  <Edit className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(template.id)}
                  className="h-8 w-8 p-0 border-red-300 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 dark:border-red-600 dark:bg-slate-800 dark:hover:bg-red-900/20 dark:text-red-400 dark:hover:text-red-300"
                  title="Delete Template"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex gap-1 mb-2 flex-wrap">
              <Badge className={`text-xs px-1.5 py-0.5 h-auto border ${getGenreBadgeClasses(template.genre)}`}>
                {template.genre}
              </Badge>
              <Badge className={`text-xs px-1.5 py-0.5 h-auto border ${getCategoryBadgeClasses(template.category)}`}>
                {template.category}
              </Badge>
              {template.usageCount !== undefined && template.usageCount > 0 && (
                <Badge variant="outline" className="text-xs px-1.5 py-0.5 h-auto bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300">
                  {template.usageCount}x
                </Badge>
              )}
            </div>
            
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
              {(template.contentEn || template.content || '').substring(0, 140)}
              {(template.contentEn || template.content || '').length > 140 ? '...' : ''}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Droppable Group Component
const DroppableGroupComponent = ({ group, onEditGroup, children }: {
  group: TemplateGroup;
  onEditGroup?: (group: TemplateGroup) => void;
  children: React.ReactNode;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `group-${group.id}` });

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `group-${group.id}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setSortableRef} style={style} className={isDragging ? 'z-50' : ''}>
      <Card 
        ref={setDroppableRef}
        className={`mb-4 border-l-4 border-t-0 border-r-0 border-b-0 transition-all duration-200 ${
          isOver 
            ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600 shadow-lg scale-[1.02]' 
            : 'bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/50'
        }`} 
        style={{ borderLeftColor: group.color }}
      >
        <CardHeader className="p-3 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                {...attributes} 
                {...listeners} 
                className="cursor-grab active:cursor-grabbing p-0.5 hover:bg-gray-200 dark:hover:bg-slate-700 rounded"
              >
                <GripHorizontal className="h-3 w-3 text-gray-400" />
              </div>
              <div className="flex items-center gap-2">
                <FolderOpen className="h-3.5 w-3.5" style={{ color: group.color }} />
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {group.name}
                </h3>
                <Badge variant="outline" className="text-xs px-1.5 py-0.5 h-auto">
                  {group.templates.length}
                </Badge>
                {isOver && (
                  <Badge className="text-xs px-1.5 py-0.5 h-auto bg-blue-600 text-white">
                    Drop Here
                  </Badge>
                )}
              </div>
            </div>
            
            {onEditGroup && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditGroup(group)}
                className="h-6 w-6 p-0 hover:bg-slate-200 dark:hover:bg-slate-700"
                title="Edit Group"
              >
                <Palette className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          {group.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 ml-6">
              {group.description}
            </p>
          )}
        </CardHeader>
        
        <CardContent className={`p-3 pt-0 transition-all duration-200 ${isOver ? 'bg-blue-25 dark:bg-blue-900/10' : ''}`}>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 dark:scrollbar-thumb-slate-600 dark:scrollbar-track-slate-800">
            {children}
            {group.templates.length === 0 && (
              <div className="flex items-center justify-center h-20 w-full border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400 text-sm">
                Drop templates here or create new ones
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default function HorizontalGroupedTemplates({ 
  templates, 
  groups = [], 
  onEdit, 
  onDelete, 
  onPreview,
  onCreateGroup,
  onEditGroup 
}: HorizontalGroupedTemplatesProps) {
  const [groupedData, setGroupedData] = useState<TemplateGroup[]>([]);
  const [ungroupedTemplates, setUngroupedTemplates] = useState<LiveTemplate[]>([]);
  const isDragDropMode = true; // Always enabled as per user requirement
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Initialize local template ordering hook
  const { 
    applyLocalOrdering, 
    updateBulkOrdering, 
    resetToAdminOrdering, 
    hasLocalOrdering 
  } = useLocalTemplateOrdering(user?.id || 'anonymous');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group templates by their groupId and apply local ordering
  useEffect(() => {
    const templatesMap = new Map<string, LiveTemplate[]>();
    const ungrouped: LiveTemplate[] = [];

    // Convert templates to LiveTemplate format and apply local ordering
    const convertedTemplates = templates.map(template => ({
      ...template,
      content: template.contentEn || template.content || '',
      variables: template.variables || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: template.isActive ?? true,
      groupOrder: template.groupOrder ?? 0,
      stageOrder: template.stageOrder ?? 0,
      usageCount: template.usageCount ?? 0
    }));

    convertedTemplates.forEach(template => {
      if (template.groupId) {
        if (!templatesMap.has(template.groupId)) {
          templatesMap.set(template.groupId, []);
        }
        templatesMap.get(template.groupId)!.push(template);
      } else {
        ungrouped.push(template);
      }
    });

    // Sort templates within each group by effective order (local or admin)
    templatesMap.forEach((templateList) => {
      templateList.sort((a, b) => {
        const aOrder = a.groupOrder ?? 0;
        const bOrder = b.groupOrder ?? 0;
        return aOrder - bOrder;
      });
    });

    // Create grouped data structure
    const groupedData = groups
      .filter(group => group.isActive)
      .map(group => ({
        ...group,
        templates: templatesMap.get(group.id) || []
      }))
      .sort((a, b) => a.orderIndex - b.orderIndex);

    setGroupedData(groupedData);
    setUngroupedTemplates(ungrouped.sort((a, b) => {
      const aOrder = a.stageOrder ?? 0;
      const bOrder = b.stageOrder ?? 0;
      return aOrder - bOrder;
    }));
  }, [templates, groups]);

  // Save group order mutation
  const saveGroupOrderMutation = useMutation({
    mutationFn: async (orderedGroups: TemplateGroup[]) => {
      const updates = orderedGroups.map((group, index) => ({
        id: group.id,
        orderIndex: index
      }));
      
      return apiRequest('POST', '/api/live-reply-template-groups/reorder', { updates });
    },
    onSuccess: (_, orderedGroups) => {
      queryClient.invalidateQueries({ queryKey: ['/api/live-reply-templates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/live-reply-template-groups'] });
      toast({ 
        title: "Group folders reordered successfully", 
        description: `${orderedGroups.length} group folders reorganized`,
        className: "bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800"
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to reorder group folders", 
        description: `Could not save new folder arrangement: ${error.message}`,
        variant: "destructive" 
      });
    },
  });

  // Save template order within group
  const saveTemplateOrderMutation = useMutation({
    mutationFn: async ({ groupId, orderedTemplates }: { groupId?: string; orderedTemplates: LiveTemplate[] }) => {
      const updates = orderedTemplates.map((template, index) => ({
        id: template.id,
        groupOrder: groupId ? index : undefined,
        stageOrder: !groupId ? index : (template.stageOrder || 0)
      }));
      
      console.log('[DragDrop] Sending template reorder request:', { updates, groupId });
      return apiRequest('POST', '/api/live-reply-templates/reorder', { updates });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/live-reply-templates'] });
      const groupName = variables.groupId ? 
        groupedData.find(g => g.id === variables.groupId)?.name || 'Unknown Group' : 
        'Ungrouped Templates';
      toast({ 
        title: "Templates reordered successfully", 
        description: `${variables.orderedTemplates.length} templates reordered in ${groupName}`,
        className: "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to reorder templates", 
        description: `Could not save new template arrangement: ${error.message}`,
        variant: "destructive" 
      });
    },
  });

  // Move template to group mutation
  const moveTemplateToGroupMutation = useMutation({
    mutationFn: async ({ templateId, groupId, templateName }: { templateId: string; groupId?: string; templateName?: string }) => {
      return apiRequest('POST', `/api/live-reply-templates/${templateId}/move-to-group`, { 
        groupId: groupId || undefined
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/live-reply-templates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/live-reply-template-groups'] });
      const groupName = groupedData.find(g => g.id === variables.groupId)?.name || 'Ungrouped';
      toast({ 
        title: "Template moved successfully", 
        description: `"${variables.templateName || 'Template'}" moved to ${groupName}`,
        className: "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
      });
    },
    onError: (error: any, variables) => {
      toast({ 
        title: "Failed to move template", 
        description: `Could not move "${variables.templateName || 'template'}": ${error.message}`,
        variant: "destructive" 
      });
    },
  });

  // Helper function to find template in all groups
  const findTemplateInAllGroups = (templateId: string) => {
    // Check ungrouped first
    const ungroupedTemplate = ungroupedTemplates.find(t => t.id === templateId);
    if (ungroupedTemplate) return ungroupedTemplate;
    
    // Check grouped templates
    for (const group of groupedData) {
      const template = group.templates.find(t => t.id === templateId);
      if (template) return template;
    }
    return null;
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    console.log('[DragDrop] handleDragEnd - active:', active?.id, 'over:', over?.id);
    
    if (!over || active.id === over.id) return;

    // Handle group reordering
    if (active.id.toString().startsWith('group-') && over.id.toString().startsWith('group-')) {
      const activeGroupId = active.id.toString().replace('group-', '');
      const overGroupId = over.id.toString().replace('group-', '');
      
      console.log('[DragDrop] Group reorder - activeGroupId:', activeGroupId, 'overGroupId:', overGroupId);
      
      const oldIndex = groupedData.findIndex(group => group.id === activeGroupId);
      const newIndex = groupedData.findIndex(group => group.id === overGroupId);
      
      console.log('[DragDrop] Group indices - oldIndex:', oldIndex, 'newIndex:', newIndex);
      
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const newGroupOrder = arrayMove(groupedData, oldIndex, newIndex);
        console.log('[DragDrop] New group order:', newGroupOrder.map(g => g.name));
        setGroupedData(newGroupOrder);
        saveGroupOrderMutation.mutate(newGroupOrder);
      }
      return;
    }

    // Handle dropping template on group header (move to group)
    if (!active.id.toString().startsWith('group-') && over.id.toString().startsWith('group-')) {
      const templateId = active.id.toString();
      const targetGroupId = over.id.toString().replace('group-', '');
      
      // Find template name for better toast notification
      const templateName = findTemplateInAllGroups(templateId)?.name || 'Unknown Template';
      
      console.log('[DragDrop] Moving template', templateName, 'to group', targetGroupId);
      moveTemplateToGroupMutation.mutate({ templateId, groupId: targetGroupId, templateName });
      return;
    }

    // Handle template reordering within groups or ungrouped
    const findTemplateContext = (templateId: string) => {
      // Check ungrouped templates
      const ungroupedIndex = ungroupedTemplates.findIndex(t => t.id === templateId);
      if (ungroupedIndex !== -1) {
        return { type: 'ungrouped', index: ungroupedIndex, groupId: null };
      }

      // Check grouped templates
      for (const group of groupedData) {
        const templateIndex = group.templates.findIndex(t => t.id === templateId);
        if (templateIndex !== -1) {
          return { type: 'grouped', index: templateIndex, groupId: group.id };
        }
      }
      return null;
    };

    const activeContext = findTemplateContext(active.id);

    // If dropping template on another template, check if it's cross-group movement
    if (activeContext && !over.id.toString().startsWith('group-')) {
      const overContext = findTemplateContext(over.id);
      
      if (overContext && activeContext.groupId !== overContext.groupId) {
        // Cross-group movement: move template to the target group
        const templateId = active.id.toString();
        const targetGroupId = overContext.groupId;
        const templateName = findTemplateInAllGroups(templateId)?.name || 'Unknown Template';
        
        console.log('[DragDrop] Cross-group move - template', templateName, 'to group', targetGroupId);
        moveTemplateToGroupMutation.mutate({ templateId, groupId: targetGroupId || undefined, templateName });
        return;
      }

      // Same group reordering
      if (activeContext && overContext && activeContext.type === overContext.type && activeContext.groupId === overContext.groupId) {
        if (activeContext.type === 'ungrouped') {
          const newUngrouped = arrayMove(ungroupedTemplates, activeContext.index, overContext.index);
          setUngroupedTemplates(newUngrouped);
          saveTemplateOrderMutation.mutate({ orderedTemplates: newUngrouped });
        } else {
          // Grouped templates reordering
          const group = groupedData.find(g => g.id === activeContext.groupId);
          if (group) {
            const newTemplates = arrayMove(group.templates, activeContext.index, overContext.index);
            const newGroupedData = groupedData.map(g => 
              g.id === activeContext.groupId ? { ...g, templates: newTemplates } : g
            );
            setGroupedData(newGroupedData);
            saveTemplateOrderMutation.mutate({ 
              groupId: activeContext.groupId || undefined, 
              orderedTemplates: newTemplates 
            });
          }
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Drag & Drop Help Text and Custom Ordering Controls */}
      <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-700">
        <span className="text-sm text-blue-700 dark:text-blue-300">
          💡 Drag templates to reorder within groups | Drag group headers to reorder folders | Drop templates on group headers to move them
        </span>
        
        {hasLocalOrdering && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 dark:text-slate-400">Custom ordering active</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetToAdminOrdering}
              className="h-auto py-1 px-2 text-xs"
            >
              Reset to default
            </Button>
          </div>
        )}
      </div>

      <DndContext 
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={(event) => {
          if (isDragDropMode) {
            handleDragEnd(event);
            // Update local ordering when drag ends
            const { active, over } = event;
            if (active && over && active.id !== over.id) {
              // Find which group this template belongs to and update local ordering
              const findTemplateInGroups = (templateId: string) => {
                for (const group of groupedData) {
                  const template = group.templates.find(t => t.id === templateId);
                  if (template) return { template, groupId: group.id, templates: group.templates };
                }
                return null;
              };
              
              const result = findTemplateInGroups(active.id.toString());
              if (result) {
                const newOrder = result.templates.map(t => t.id);
                updateBulkOrdering(newOrder);
              }
            }
          }
        }}
      >
        {/* Grouped Templates */}
        <SortableContext items={groupedData.map(group => `group-${group.id}`)} strategy={verticalListSortingStrategy}>
          {groupedData.map((group) => (
            <DroppableGroupComponent 
              key={group.id} 
              group={group} 
              onEditGroup={onEditGroup}
            >
              <SortableContext items={group.templates.map(t => t.id)} strategy={horizontalListSortingStrategy}>
                {group.templates.map((template) => (
                  isDragDropMode ? (
                    <SortableTemplateItem
                      key={template.id}
                      template={template}
                      onEdit={onEdit}
                      onDelete={(templateId) => onDelete(templateId)}
                      onPreview={onPreview}
                    />
                  ) : (
                    <div key={template.id} className="w-[280px] min-w-[280px] max-w-[280px]">
                      <Card className="hover:shadow-md transition-shadow bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-medium text-slate-800 dark:text-white mb-2 leading-tight">
                                {template.name}
                              </h4>
                              <div className="flex gap-2 mb-2">
                                <Badge variant="secondary" className={`text-xs px-2 py-1 ${getGenreBadgeClasses(template.genre)}`}>
                                  {template.genre}
                                </Badge>
                                <Badge variant="outline" className={`text-xs px-2 py-1 ${getCategoryBadgeClasses(template.category)}`}>
                                  {template.category}
                                </Badge>
                                {template.usageCount !== undefined && template.usageCount > 0 && (
                                  <Badge variant="outline" className="text-xs px-2 py-1 bg-green-50 text-green-700">
                                    {template.usageCount}x used
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-1 ml-auto">
                              {onPreview && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onPreview(template);
                                  }}
                                  className="h-8 w-8 p-0 border-slate-300 bg-white hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700"
                                  title="Preview Template"
                                >
                                  <Eye className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEdit(template);
                                }}
                                className="h-8 w-8 p-0 border-slate-300 bg-white hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700"
                                title="Edit Template"
                              >
                                <Edit className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDelete(template.id);
                                }}
                                className="h-8 w-8 p-0 border-red-300 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 dark:border-red-600 dark:bg-slate-800 dark:hover:bg-red-900/20 dark:text-red-400 dark:hover:text-red-300"
                                title="Delete Template"
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">
                            {template.content.substring(0, 150)}
                            {template.content.length > 150 ? '...' : ''}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  )
                ))}
              </SortableContext>
            </DroppableGroupComponent>
          ))}
        </SortableContext>

        {/* Ungrouped Templates */}
        {ungroupedTemplates.length > 0 && (
            <Card className="bg-gray-50 dark:bg-slate-900/30 border-dashed">
              <CardHeader className="p-4 pb-3">
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4 text-gray-400" />
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Ungrouped Templates
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    {ungroupedTemplates.length} templates
                  </Badge>
                </div>
              </CardHeader>
            
            <CardContent className="p-4 pt-0">
              <div className="flex gap-4 overflow-x-auto pb-2">
                <SortableContext items={ungroupedTemplates.map(t => t.id)} strategy={horizontalListSortingStrategy}>
                  {ungroupedTemplates.map((template) => (
                    isDragDropMode ? (
                      <SortableTemplateItem
                        key={template.id}
                        template={template}
                        onEdit={onEdit}
                        onDelete={(templateId) => onDelete(templateId)}
                        onPreview={onPreview}
                      />
                    ) : (
                      <div key={template.id} className="w-[280px] min-w-[280px] max-w-[280px]">
                        <Card className="hover:shadow-md transition-shadow bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h4 className="font-medium text-slate-800 dark:text-white mb-2 leading-tight">
                                  {template.name}
                                </h4>
                                <div className="flex gap-2 mb-2">
                                  <Badge variant="secondary" className="text-xs px-2 py-1">
                                    {template.genre}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs px-2 py-1">
                                    {template.category}
                                  </Badge>
                                  {template.usageCount !== undefined && template.usageCount > 0 && (
                                    <Badge variant="outline" className="text-xs px-2 py-1 bg-green-50 text-green-700">
                                      {template.usageCount}x used
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-1 ml-auto">
                                {onPreview && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onPreview(template);
                                    }}
                                    className="h-8 w-8 p-0 border-slate-300 bg-white hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700"
                                    title="Preview Template"
                                  >
                                    <Eye className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(template);
                                  }}
                                  className="h-8 w-8 p-0 border-slate-300 bg-white hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700"
                                  title="Edit Template"
                                >
                                  <Edit className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(template.id);
                                  }}
                                  className="h-8 w-8 p-0 border-red-300 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 dark:border-red-600 dark:bg-slate-800 dark:hover:bg-red-900/20 dark:text-red-400 dark:hover:text-red-300"
                                  title="Delete Template"
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">
                              {template.content.substring(0, 150)}
                              {template.content.length > 150 ? '...' : ''}
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                    )
                  ))}
                </SortableContext>
              </div>
            </CardContent>
          </Card>
        )}
      </DndContext>
    </div>
  );
}