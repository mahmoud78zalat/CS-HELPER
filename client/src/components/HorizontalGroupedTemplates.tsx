import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash, GripHorizontal, Eye, Plus, FolderOpen, Palette } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
      className={`min-w-[280px] max-w-[320px] ${isDragging ? 'shadow-lg z-50' : ''} hover:shadow-md transition-shadow bg-white dark:bg-slate-800`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-2">
          <div 
            {...attributes} 
            {...listeners} 
            className="cursor-grab active:cursor-grabbing mt-1 p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
          >
            <GripHorizontal className="h-4 w-4 text-gray-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-slate-800 dark:text-slate-200 text-sm truncate pr-2">
                {template.name}
              </h4>
              
              <div className="flex gap-1 flex-shrink-0">
                {onPreview && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onPreview(template)}
                    className="h-6 w-6 p-0"
                    title="Preview Template"
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(template)}
                  className="h-6 w-6 p-0"
                  title="Edit Template"
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(template.id)}
                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  title="Delete Template"
                >
                  <Trash className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            <div className="flex gap-1 mb-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {template.genre}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {template.category}
              </Badge>
              {template.usageCount !== undefined && template.usageCount > 0 && (
                <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300">
                  {template.usageCount}x
                </Badge>
              )}
            </div>
            
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
              {(template.contentEn || template.content || '').substring(0, 120)}
              {(template.contentEn || template.content || '').length > 120 ? '...' : ''}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Sortable Group Component
const SortableGroupComponent = ({ group, onEditGroup, children }: {
  group: TemplateGroup;
  onEditGroup?: (group: TemplateGroup) => void;
  children: React.ReactNode;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `group-${group.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'z-50' : ''}>
      <Card className="mb-6 bg-slate-50 dark:bg-slate-900/50 border-2" style={{ borderColor: group.color }}>
        <CardHeader className="p-4 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                {...attributes} 
                {...listeners} 
                className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded"
              >
                <GripHorizontal className="h-4 w-4 text-gray-400" />
              </div>
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" style={{ color: group.color }} />
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {group.name}
                </h3>
                <Badge variant="outline" className="text-xs">
                  {group.templates.length} templates
                </Badge>
              </div>
            </div>
            
            {onEditGroup && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditGroup(group)}
                className="h-7 w-7 p-0"
                title="Edit Group"
              >
                <Palette className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          {group.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 ml-9">
              {group.description}
            </p>
          )}
        </CardHeader>
        
        <CardContent className="p-4 pt-0">
          <div className="flex gap-4 overflow-x-auto pb-2">
            {children}
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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group templates by their groupId
  useEffect(() => {
    const templatesMap = new Map<string, LiveTemplate[]>();
    const ungrouped: LiveTemplate[] = [];

    templates.forEach(template => {
      if (template.groupId) {
        if (!templatesMap.has(template.groupId)) {
          templatesMap.set(template.groupId, []);
        }
        templatesMap.get(template.groupId)!.push(template);
      } else {
        ungrouped.push(template);
      }
    });

    // Sort templates within each group by groupOrder
    templatesMap.forEach((templateList) => {
      templateList.sort((a, b) => (a.groupOrder || 0) - (b.groupOrder || 0));
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
    setUngroupedTemplates(ungrouped.sort((a, b) => (a.stageOrder || 0) - (b.stageOrder || 0)));
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/live-reply-templates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/live-reply-template-groups'] });
      toast({ title: "Group order saved successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to save group order", 
        description: error.message,
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
        stageOrder: !groupId ? index : template.stageOrder
      }));
      
      return apiRequest('POST', '/api/live-reply-templates/reorder', { updates });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/live-reply-templates'] });
      toast({ title: "Template order saved successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to save template order", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Handle group reordering
    if (active.id.toString().startsWith('group-') && over.id.toString().startsWith('group-')) {
      const activeGroupId = active.id.toString().replace('group-', '');
      const overGroupId = over.id.toString().replace('group-', '');
      
      const oldIndex = groupedData.findIndex(group => group.id === activeGroupId);
      const newIndex = groupedData.findIndex(group => group.id === overGroupId);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newGroupOrder = arrayMove(groupedData, oldIndex, newIndex);
        setGroupedData(newGroupOrder);
        saveGroupOrderMutation.mutate(newGroupOrder);
      }
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
    const overContext = findTemplateContext(over.id);

    if (!activeContext || !overContext) return;

    // Same context reordering
    if (activeContext.type === overContext.type && activeContext.groupId === overContext.groupId) {
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
            groupId: activeContext.groupId, 
            orderedTemplates: newTemplates 
          });
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Group Button */}
      {onCreateGroup && (
        <div className="flex justify-end">
          <Button
            onClick={onCreateGroup}
            variant="outline"
            size="sm"
            className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Group
          </Button>
        </div>
      )}

      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        {/* Grouped Templates */}
        <SortableContext items={groupedData.map(group => `group-${group.id}`)} strategy={horizontalListSortingStrategy}>
          {groupedData.map((group) => (
            <SortableGroupComponent 
              key={group.id} 
              group={group} 
              onEditGroup={onEditGroup}
            >
              <SortableContext items={group.templates.map(t => t.id)} strategy={horizontalListSortingStrategy}>
                {group.templates.map((template) => (
                  <SortableTemplateItem
                    key={template.id}
                    template={template}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onPreview={onPreview}
                  />
                ))}
              </SortableContext>
            </SortableGroupComponent>
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
                    <SortableTemplateItem
                      key={template.id}
                      template={template}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onPreview={onPreview}
                    />
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