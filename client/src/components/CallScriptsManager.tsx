import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Search, Edit2, Trash2, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  type CallScript,
  type InsertCallScript,
  type TemplateCategory,
  type TemplateGenre,
} from "@shared/schema";

interface CallScriptsManagerProps {
  onClose: () => void;
}

export function CallScriptsManager({ onClose }: CallScriptsManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingScript, setEditingScript] = useState<CallScript | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    content: "",
    categoryId: "",
    genreId: "",
  });

  const { toast } = useToast();

  // Fetch call scripts
  const { data: callScripts = [], isLoading: scriptsLoading } = useQuery<CallScript[]>({
    queryKey: ["/api/call-scripts"],
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<TemplateCategory[]>({
    queryKey: ["/api/template-categories"],
  });

  // Fetch genres
  const { data: genres = [] } = useQuery<TemplateGenre[]>({
    queryKey: ["/api/template-genres"],
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: InsertCallScript) =>
      fetch("/api/call-scripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/call-scripts"] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Call script created successfully",
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

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: { id: string; script: Partial<InsertCallScript> }) =>
      fetch(`/api/call-scripts/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.script),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/call-scripts"] });
      setEditingScript(null);
      resetForm();
      toast({
        title: "Success",
        description: "Call script updated successfully",
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

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/call-scripts/${id}`, {
        method: "DELETE",
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/call-scripts"] });
      toast({
        title: "Success",
        description: "Call script deleted successfully",
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

  const resetForm = () => {
    setFormData({
      name: "",
      content: "",
      categoryId: "",
      genreId: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.content) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const submitData: InsertCallScript = {
      name: formData.name,
      content: formData.content,
      categoryId: formData.categoryId || null,
      genreId: formData.genreId || null,
      isActive: true,
    };

    if (editingScript) {
      updateMutation.mutate({
        id: editingScript.id,
        script: submitData,
      });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleEdit = (script: CallScript) => {
    setEditingScript(script);
    setFormData({
      name: script.name,
      content: script.content,
      categoryId: script.categoryId || "",
      genreId: script.genreId || "",
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this call script?")) {
      deleteMutation.mutate(id);
    }
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return "No Category";
    const category = categories.find(c => c.id === categoryId);
    return category?.name || "Unknown Category";
  };

  const getGenreName = (genreId: string | null) => {
    if (!genreId) return "No Genre";
    const genre = genres.find(g => g.id === genreId);
    return genre?.name || "Unknown Genre";
  };

  const filteredScripts = callScripts.filter((script) =>
    script.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    script.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const availableGenres = genres.filter(genre => 
    !formData.categoryId || genre.categoryId === formData.categoryId
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
            <Phone className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Call Scripts Management
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage call scripts organized by categories and genres
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>

      {/* Search and Create */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search call scripts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                setEditingScript(null);
                resetForm();
              }}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Script
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingScript ? "Edit Call Script" : "Create New Call Script"}
              </DialogTitle>
              <DialogDescription>
                {editingScript 
                  ? "Update the call script details below."
                  : "Create a new call script with categories and genres."
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Script Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter script name..."
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      categoryId: value,
                      genreId: "" // Reset genre when category changes
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No Category</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Genre</label>
                  <Select
                    value={formData.genreId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, genreId: value }))}
                    disabled={!formData.categoryId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select genre" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No Genre</SelectItem>
                      {availableGenres.map((genre) => (
                        <SelectItem key={genre.id} value={genre.id}>
                          {genre.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Script Content *</label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter the call script content..."
                  className="min-h-[120px]"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setEditingScript(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {editingScript ? "Update Script" : "Create Script"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Scripts List */}
      <div className="space-y-4">
        {scriptsLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">Loading call scripts...</p>
          </div>
        ) : filteredScripts.length === 0 ? (
          <div className="text-center py-8">
            <Phone className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm ? "No call scripts match your search." : "No call scripts found. Create your first script!"}
            </p>
          </div>
        ) : (
          filteredScripts.map((script: CallScript) => (
            <div
              key={script.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      {script.name}
                    </h4>
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {getCategoryName(script.categoryId)}
                      </Badge>
                      {script.genreId && (
                        <Badge variant="outline" className="text-xs">
                          {getGenreName(script.genreId)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                    {script.content}
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                    <span>Created: {script.createdAt ? new Date(script.createdAt).toLocaleDateString() : 'N/A'}</span>
                    {script.updatedAt && script.updatedAt !== script.createdAt && (
                      <span>Updated: {new Date(script.updatedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(script)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(script.id)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default CallScriptsManager;