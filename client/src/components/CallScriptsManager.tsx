import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Search, Phone } from "lucide-react";
import { CallScript, InsertCallScript } from "@shared/schema";

export default function CallScriptsManager() {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingScript, setEditingScript] = useState<CallScript | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<InsertCallScript>({
    name: "",
    content: "",
    category: "general",
    isActive: true,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch call scripts
  const { data: scripts = [], isLoading, refetch } = useQuery<CallScript[]>({
    queryKey: ["/api/call-scripts"],
    staleTime: 0,
  });

  // Create script mutation
  const createScriptMutation = useMutation({
    mutationFn: async (data: InsertCallScript) => 
      await apiRequest("POST", "/api/call-scripts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/call-scripts"] });
      setShowForm(false);
      setFormData({ name: "", content: "", category: "general", isActive: true });
      toast({
        title: "Script created",
        description: "Call script has been created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create call script",
        variant: "destructive",
      });
    },
  });

  // Update script mutation
  const updateScriptMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertCallScript> }) =>
      await apiRequest("PUT", `/api/call-scripts/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/call-scripts"] });
      setEditingScript(null);
      setShowForm(false);
      setFormData({ name: "", content: "", category: "general", isActive: true });
      toast({
        title: "Script updated",
        description: "Call script has been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update call script",
        variant: "destructive",
      });
    },
  });

  // Delete script mutation
  const deleteScriptMutation = useMutation({
    mutationFn: async (id: string) => await apiRequest("DELETE", `/api/call-scripts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/call-scripts"] });
      toast({
        title: "Script deleted",
        description: "Call script has been deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete call script",
        variant: "destructive",
      });
    },
  });

  // Filter scripts based on search term
  const filteredScripts = scripts.filter((script) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      script.name?.toLowerCase().includes(searchLower) ||
      script.content?.toLowerCase().includes(searchLower) ||
      script.category?.toLowerCase().includes(searchLower)
    );
  });

  const handleEdit = (script: CallScript) => {
    setEditingScript(script);
    setFormData({
      name: script.name,
      content: script.content,
      category: script.category,
      isActive: script.isActive,
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (editingScript) {
      updateScriptMutation.mutate({ id: editingScript.id, data: formData });
    } else {
      createScriptMutation.mutate(formData);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingScript(null);
    setFormData({ name: "", content: "", category: "general", isActive: true });
  };

  if (isLoading) {
    return <div className="p-4 text-center">Loading call scripts...</div>;
  }

  return (
    <div className="space-y-4 overflow-y-auto max-h-[70vh]">
      {/* Header with search and add button */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search call scripts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Script
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-green-600" />
                {editingScript ? "Edit Call Script" : "Create New Call Script"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Script Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Welcome Call, Follow-up Script"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="welcome">Welcome</SelectItem>
                    <SelectItem value="follow-up">Follow-up</SelectItem>
                    <SelectItem value="complaint">Complaint Handling</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="support">Technical Support</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Script Content</Label>
                <Textarea
                  id="content"
                  placeholder="Enter the call script content here..."
                  rows={8}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleSubmit}
                  disabled={createScriptMutation.isPending || updateScriptMutation.isPending || !formData.name.trim() || !formData.content.trim()}
                  className="flex-1"
                >
                  {createScriptMutation.isPending || updateScriptMutation.isPending ? "Saving..." : "Save Script"}
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Scripts List */}
      <div className="space-y-3">
        {filteredScripts.length === 0 ? (
          <Card className="p-8 text-center">
            <Phone className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No call scripts found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm ? "No scripts match your search criteria" : "Get started by creating your first call script"}
            </p>
          </Card>
        ) : (
          filteredScripts.map((script) => (
            <Card key={script.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium text-gray-900 truncate">{script.name}</h3>
                    <Badge variant={script.isActive ? "default" : "secondary"}>
                      {script.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {script.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                    {script.content}
                  </p>
                  <p className="text-xs text-gray-400">
                    Created: {new Date(script.createdAt!).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(script)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-3 w-3 text-red-600" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Call Script</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{script.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteScriptMutation.mutate(script.id)}
                          disabled={deleteScriptMutation.isPending}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {deleteScriptMutation.isPending ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}