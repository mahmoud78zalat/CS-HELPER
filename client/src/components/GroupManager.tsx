import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Trash, Edit, Palette, FolderOpen, GripVertical, Plus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
  onEditGroup 
}: GroupManagerProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3b82f6"
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [localGroups, setLocalGroups] = useState(groups);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
        description: editingGroup.description || "",
        color: editingGroup.color
      });
      setShowCreateForm(true);
    } else {
      setFormData({
        name: "",
        description: "",
        color: "#3b82f6"
      });
      setShowCreateForm(false);
    }
  }, [editingGroup]);

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
      return apiRequest('POST', '/api/live-reply-template-groups/reorder', { updates });
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

  const createGroupMutation = useMutation({
    mutationFn: async (groupData: typeof formData) => {
      const dataToSend = {
        ...groupData,
        orderIndex: Math.max(...(Array.isArray(groups) ? groups : []).map(g => g.orderIndex || 0), 0) + 1
      };
      return apiRequest('POST', '/api/live-reply-template-groups', dataToSend);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/live-reply-template-groups'] });
      toast({ title: "Group created successfully" });
      setShowCreateForm(false);
      setFormData({ name: "", description: "", color: "#3b82f6" });
    },
    onError: (error: any) => {
      console.error('Create group error:', error);
      toast({ 
        title: "Failed to create group", 
        description: error?.message || "An error occurred",
        variant: "destructive" 
      });
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: async (groupData: typeof formData) => {
      if (!editingGroup) throw new Error("No group selected for editing");
      return apiRequest('PUT', `/api/live-reply-template-groups/${editingGroup.id}`, groupData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/live-reply-template-groups'] });
      toast({ title: "Group updated successfully" });
      setShowCreateForm(false);
      onEditGroup?.(null);
      setFormData({ name: "", description: "", color: "#3b82f6" });
    },
    onError: (error: any) => {
      console.error('Update group error:', error);
      toast({ 
        title: "Failed to update group", 
        description: error?.message || "An error occurred",
        variant: "destructive" 
      });
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      return apiRequest('DELETE', `/api/live-reply-template-groups/${groupId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/live-reply-template-groups'] });
      toast({ title: "Group deleted successfully" });
    },
    onError: (error: any) => {
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
      updateGroupMutation.mutate(formData);
    } else {
      createGroupMutation.mutate(formData);
    }
  };

  const handleDelete = (groupId: string) => {
    if (confirm("Are you sure you want to delete this group? This action cannot be undone.")) {
      deleteGroupMutation.mutate(groupId);
    }
  };

  const handleClose = () => {
    setShowCreateForm(false);
    onEditGroup?.(null);
    setFormData({ name: "", description: "", color: "#3b82f6" });
    onClose();
  };

  const isLoading = createGroupMutation.isPending || 
                   updateGroupMutation.isPending || 
                   deleteGroupMutation.isPending ||
                   reorderGroupsMutation.isPending;

  return (
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

                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Palette className="h-4 w-4" />
                    Color
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          formData.color === color
                            ? 'border-gray-900 dark:border-gray-100 scale-110'
                            : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setFormData(prev => ({ ...prev, color }))}
                        disabled={isLoading}
                      />
                    ))}
                  </div>
                </div>

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
                      setFormData({ name: "", description: "", color: "#3b82f6" });
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
  );
}