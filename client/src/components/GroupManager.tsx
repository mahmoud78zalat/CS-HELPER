import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash, Edit, Palette, FolderOpen, GripVertical, Plus, FileText, ArrowRight, Check, AlertTriangle, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTemplates } from "@/hooks/useTemplates";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TemplateGroup {
  id: string;
  name: string;
  description?: string;
  color: string;
  orderIndex: number;
  isActive: boolean;
  templates?: any[];
}

interface GroupManagerProps {
  groups: TemplateGroup[];
  isOpen: boolean;
  onClose: () => void;
  editingGroup?: TemplateGroup | null;
  onEditGroup?: (group: TemplateGroup | null) => void;
  onCreateGroup?: (groupData: any) => void;
  onUpdateGroup?: (data: { id: string; data: any }) => void;
}

const colorOptions = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#84cc16", // lime
  "#f97316", // orange
  "#ec4899", // pink
  "#6b7280", // gray
];

// Sortable Group Item Component
function SortableGroupItem({ group, onEdit, onDelete }: {
  group: TemplateGroup;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <Card 
      ref={setNodeRef} 
      style={style}
      className={`group-item ${isDragging ? 'dragging' : ''}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div
            {...attributes}
            {...listeners}
            className="drag-handle cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>
          <div
            className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
            style={{ backgroundColor: group.color }}
          />
          <div className="flex-1">
            <h4 className="font-medium text-sm">{group.name}</h4>
            {group.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {group.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

export default function GroupManager({ 
  groups, 
  isOpen, 
  onClose, 
  editingGroup, 
  onEditGroup,
  onCreateGroup,
  onUpdateGroup
}: GroupManagerProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: ""
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [localGroups, setLocalGroups] = useState(groups);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Delete confirmation dialog state
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    title: '',
    description: '',
    groupId: '',
    groupName: ''
  });

  // Fetch all templates for template selector
  const { data: allTemplates = [], isLoading: templatesLoading } = useTemplates({
    isActive: true,
  });

  // Update local groups when props change
  useEffect(() => {
    // Ensure groups is an array before sorting
    const groupsArray = Array.isArray(groups) ? groups : [];
    setLocalGroups(groupsArray.sort((a, b) => a.orderIndex - b.orderIndex));
  }, [groups]);

  // Initialize form when editing
  useEffect(() => {
    if (editingGroup) {
      setFormData({
        name: editingGroup.name,
        description: editingGroup.description || ""
      });
      setShowCreateForm(true);
      // Load templates belonging to this group
      const groupTemplates = allTemplates.filter(t => t.groupId === editingGroup.id);
      setSelectedTemplates(groupTemplates.map(t => t.id));
    } else {
      setFormData({
        name: "",
        description: ""
      });
      setShowCreateForm(false);
      setSelectedTemplates([]);
    }
  }, [editingGroup, allTemplates]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group reordering mutation
  const reorderGroupsMutation = useMutation({
    mutationFn: async (updates: { id: string; orderIndex: number }[]) => {
      const response = await apiRequest('POST', '/api/live-reply-template-groups/reorder', { updates });
      return await response.json();
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to reorder groups", 
        description: error.message,
        variant: "destructive" 
      });
      // Revert to original order
      const groupsArray = Array.isArray(groups) ? groups : [];
      setLocalGroups(groupsArray.sort((a, b) => a.orderIndex - b.orderIndex));
    },
  });

  // Handle create group using prop mutation
  const handleCreateGroup = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a group name",
        variant: "destructive"
      });
      return;
    }

    const groupData = {
      ...formData,
      orderIndex: Math.max(...(Array.isArray(groups) ? groups : []).map(g => g.orderIndex || 0), 0) + 1
    };

    if (onCreateGroup) {
      onCreateGroup(groupData);
      setShowCreateForm(false);
      setFormData({ name: "", description: "" });
    }
  };

  // Handle update group using prop mutation
  const handleUpdateGroup = () => {
    if (!editingGroup) return;
    
    if (onUpdateGroup) {
      onUpdateGroup({
        id: editingGroup.id,
        data: formData
      });
      setShowCreateForm(false);
      setFormData({ name: "", description: "" });
      onEditGroup?.(null);
    }
  };



  // Template assignment mutation
  const assignTemplatesToGroupMutation = useMutation({
    mutationFn: async ({ templateIds, groupId }: { templateIds: string[], groupId: string }) => {
      console.log('[GroupManager] Assigning templates to group:', { templateIds, groupId });
      
      const promises = templateIds.map(async (templateId) => {
        console.log(`[GroupManager] Updating template ${templateId} with groupId: ${groupId}`);
        const response = await apiRequest('PUT', `/api/live-reply-templates/${templateId}`, { groupId });
        return response.json();
      });
      return Promise.all(promises);
    },
    onMutate: async ({ templateIds, groupId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/live-reply-templates'] });

      // Snapshot the previous value
      const previousTemplates = queryClient.getQueryData(['/api/live-reply-templates']);

      // Optimistically update the templates
      queryClient.setQueryData(['/api/live-reply-templates'], (old: any[]) => {
        if (!old) return old;
        return old.map((template: any) => 
          templateIds.includes(template.id) 
            ? { ...template, groupId } 
            : template
        );
      });

      return { previousTemplates };
    },
    onSuccess: (data, variables) => {
      // Clear selection after successful assignment
      setSelectedTemplates([]);
      
      // Invalidate for fresh data
      queryClient.invalidateQueries({ queryKey: ['/api/live-reply-templates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/live-reply-template-groups'] });
      
      const groupName = editingGroup?.name || 'group';
      toast({ 
        title: "Templates assigned successfully",
        description: `${variables.templateIds.length} template${variables.templateIds.length !== 1 ? 's' : ''} moved to ${groupName}`,
        className: "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
      });
    },
    onError: (error: any, variables, context) => {
      console.error('[GroupManager] Assignment error:', error);
      
      // Rollback optimistic update
      if (context?.previousTemplates) {
        queryClient.setQueryData(['/api/live-reply-templates'], context.previousTemplates);
      }
      
      toast({ 
        title: "Failed to assign templates", 
        description: error.message || 'An error occurred while assigning templates',
        variant: "destructive" 
      });
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      const response = await apiRequest('DELETE', `/api/live-reply-template-groups/${groupId}`);
      return await response.json();
    },
    onMutate: async (groupId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/live-reply-template-groups'] });

      // Snapshot the previous value
      const previousGroups = queryClient.getQueryData(['/api/live-reply-template-groups']);

      // Optimistically remove the group
      queryClient.setQueryData(['/api/live-reply-template-groups'], (old: any[]) => {
        if (!old) return old;
        return old.filter(group => group.id !== groupId);
      });

      return { previousGroups };
    },
    onSuccess: () => {
      // Invalidate for real-time updates across all components
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/live-reply-template-groups'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/live-reply-templates'] })
      ]);
      toast({ title: "Group deleted successfully" });
    },
    onError: (error: any, variables, context) => {
      // Rollback on error
      if (context?.previousGroups) {
        queryClient.setQueryData(['/api/live-reply-template-groups'], context.previousGroups);
      }
      console.error('Delete group error:', error);
      toast({ 
        title: "Failed to delete group", 
        description: error?.message || "An error occurred",
        variant: "destructive" 
      });
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localGroups.findIndex(group => group.id === active.id);
      const newIndex = localGroups.findIndex(group => group.id === over.id);

      const newGroups = arrayMove(localGroups, oldIndex, newIndex);
      setLocalGroups(newGroups);

      // Create updates array with new order indices
      const updates = newGroups.map((group, index) => ({
        id: group.id,
        orderIndex: index + 1
      }));

      reorderGroupsMutation.mutate(updates);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({ 
        title: "Group name is required", 
        variant: "destructive" 
      });
      return;
    }

    if (editingGroup) {
      handleUpdateGroup();
    } else {
      handleCreateGroup();
    }
  };

  // Helper function to show delete confirmation
  const showDeleteConfirmation = (group: TemplateGroup) => {
    setDeleteConfirmation({
      isOpen: true,
      title: 'Delete Group',
      description: `Are you sure you want to delete the group "${group.name}"? This action cannot be undone and will remove all templates from this group.`,
      groupId: group.id,
      groupName: group.name
    });
  };

  // Handle confirmed delete
  const handleConfirmedDelete = () => {
    if (deleteConfirmation.groupId) {
      deleteGroupMutation.mutate(deleteConfirmation.groupId);
      setDeleteConfirmation({
        isOpen: false,
        title: '',
        description: '',
        groupId: '',
        groupName: ''
      });
    }
  };

  const handleDelete = (groupId: string) => {
    const group = localGroups.find(g => g.id === groupId);
    if (group) {
      showDeleteConfirmation(group);
    }
  };

  const handleClose = () => {
    setShowCreateForm(false);
    onEditGroup?.(null);
    setFormData({ name: "", description: "" });
    onClose();
  };

  const isLoading = deleteGroupMutation.isPending ||
                   reorderGroupsMutation.isPending;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Manage Template Groups
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add Group Button */}
          {!showCreateForm && (
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="w-full"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Group
            </Button>
          )}

          {/* Create/Edit Form */}
          {showCreateForm && (
            <Card className="p-4 border-2 border-dashed">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Group Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter group name"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional description"
                    disabled={isLoading}
                  />
                </div>



                {/* Template Selector */}
                {editingGroup && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Assign Templates to Group ({selectedTemplates.length} selected)
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowTemplateSelector(!showTemplateSelector)}
                        className="text-xs"
                      >
                        {showTemplateSelector ? 'Hide Templates' : 'Select Templates'}
                        <ArrowRight className={`h-3 w-3 ml-1 transition-transform ${showTemplateSelector ? 'rotate-90' : ''}`} />
                      </Button>
                    </div>
                    
                    {showTemplateSelector && (
                      <Card className="border border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-900/10">
                        <CardContent className="p-3">
                          <ScrollArea className="h-48">
                            {templatesLoading ? (
                              <div className="text-center py-4 text-gray-500">Loading templates...</div>
                            ) : allTemplates.length === 0 ? (
                              <div className="text-center py-4 text-gray-500">No templates available</div>
                            ) : (
                              <div className="space-y-2">
                                {allTemplates.map((template) => (
                                  <div
                                    key={template.id}
                                    className={`flex items-center gap-2 p-2 rounded border transition-all ${
                                      selectedTemplates.includes(template.id)
                                        ? 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 shadow-sm'
                                        : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-700'
                                    }`}
                                  >
                                    <Checkbox
                                      checked={selectedTemplates.includes(template.id)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setSelectedTemplates(prev => [...prev, template.id]);
                                        } else {
                                          setSelectedTemplates(prev => prev.filter(id => id !== template.id));
                                        }
                                      }}
                                    />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                        {template.name}
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {template.category} • {template.genre}
                                        {template.groupId && template.groupId !== editingGroup?.id && (
                                          <span className="text-amber-600 dark:text-amber-400 ml-1">
                                            (in another group)
                                          </span>
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </ScrollArea>
                          {selectedTemplates.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => {
                                  if (editingGroup) {
                                    assignTemplatesToGroupMutation.mutate({
                                      templateIds: selectedTemplates,
                                      groupId: editingGroup.id
                                    });
                                  }
                                }}
                                disabled={assignTemplatesToGroupMutation.isPending}
                                className="w-full bg-green-600 hover:bg-green-700 text-white"
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Assign {selectedTemplates.length} Template{selectedTemplates.length !== 1 ? 's' : ''} to Group
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button type="submit" disabled={isLoading}>
                    {editingGroup ? 'Update Group' : 'Create Group'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowCreateForm(false);
                      onEditGroup?.(null);
                      setFormData({ name: "", description: "" });
                    }}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Groups List with Drag and Drop */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Existing Groups (drag to reorder)
            </h3>
            
            {localGroups.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <FolderOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No groups created yet</p>
                <p className="text-sm">Create your first group to get started</p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={localGroups.map(g => g.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {localGroups.map(group => (
                      <SortableGroupItem
                        key={group.id}
                        group={group}
                        onEdit={() => onEditGroup?.(group)}
                        onDelete={() => handleDelete(group.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <AlertDialog 
      open={deleteConfirmation.isOpen} 
      onOpenChange={(open) => !open && setDeleteConfirmation(prev => ({ ...prev, isOpen: false }))}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            {deleteConfirmation.title}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {deleteConfirmation.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            onClick={() => setDeleteConfirmation(prev => ({ ...prev, isOpen: false }))}
            disabled={deleteGroupMutation.isPending}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmedDelete}
            disabled={deleteGroupMutation.isPending}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {deleteGroupMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Group'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}