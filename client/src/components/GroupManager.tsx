import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Trash, Edit, Palette, FolderOpen } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize form when editing
  useState(() => {
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
  });

  const createGroupMutation = useMutation({
    mutationFn: async (groupData: typeof formData) => {
      return apiRequest('POST', '/api/live-reply-template-groups', groupData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/live-reply-template-groups'] });
      toast({ title: "Group created successfully" });
      setShowCreateForm(false);
      setFormData({ name: "", description: "", color: "#3b82f6" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to create group", 
        description: error.message,
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
      toast({ 
        title: "Failed to update group", 
        description: error.message,
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
      toast({ 
        title: "Failed to delete group", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

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
    if (confirm("Are you sure you want to delete this group? This will not delete the templates, they will become ungrouped.")) {
      deleteGroupMutation.mutate(groupId);
    }
  };

  const handleClose = () => {
    setShowCreateForm(false);
    onEditGroup?.(null);
    setFormData({ name: "", description: "", color: "#3b82f6" });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Manage Template Groups
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create/Edit Form */}
          {(showCreateForm || editingGroup) && (
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                  {editingGroup ? "Edit Group" : "Create New Group"}
                </h3>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Group Name</Label>
                      <Input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Customer Support, Sales, Technical"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="color">Color</Label>
                      <div className="flex gap-2 flex-wrap mt-1">
                        {colorOptions.map((color) => (
                          <button
                            key={color}
                            type="button"
                            className={`w-6 h-6 rounded-full border-2 ${
                              formData.color === color 
                                ? 'border-slate-900 dark:border-slate-100' 
                                : 'border-slate-300 dark:border-slate-600'
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => setFormData({ ...formData, color })}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of this group's purpose..."
                      rows={2}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      type="submit" 
                      disabled={createGroupMutation.isPending || updateGroupMutation.isPending}
                    >
                      {editingGroup ? "Update Group" : "Create Group"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setShowCreateForm(false);
                        onEditGroup?.(null);
                        setFormData({ name: "", description: "", color: "#3b82f6" });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Create Button */}
          {!showCreateForm && !editingGroup && (
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white"
            >
              <FolderOpen className="h-4 w-4 mr-2" />
              Create New Group
            </Button>
          )}

          {/* Existing Groups */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              Existing Groups ({groups.length})
            </h3>
            
            {groups.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <FolderOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No groups created yet</p>
                <p className="text-xs">Create your first group to organize templates</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {groups.map((group) => (
                  <Card key={group.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div 
                            className="w-4 h-4 rounded-full mt-0.5 flex-shrink-0"
                            style={{ backgroundColor: group.color }}
                          />
                          <div className="min-w-0 flex-1">
                            <h4 className="font-medium text-slate-800 dark:text-slate-200 text-sm">
                              {group.name}
                            </h4>
                            {group.description && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {group.description}
                              </p>
                            )}
                            <div className="flex gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {group.templates?.length || 0} templates
                              </Badge>
                              <Badge 
                                variant={group.isActive ? "secondary" : "outline"} 
                                className="text-xs"
                              >
                                {group.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditGroup?.(group)}
                            className="h-7 w-7 p-0"
                            title="Edit Group"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(group.id)}
                            className="h-7 w-7 p-0 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            title="Delete Group"
                          >
                            <Trash className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}