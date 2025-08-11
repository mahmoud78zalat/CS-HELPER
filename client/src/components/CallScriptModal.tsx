import { useState, useEffect, useMemo } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Phone } from "lucide-react";
import type { CallScript } from "@shared/schema";

interface CallScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingScript?: CallScript | null;
}

interface CallScriptFormData {
  name: string;
  content: string;
  category: string;
  genre: string;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  isActive: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

interface Genre {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  color: string;
  isActive: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export function CallScriptModal({ isOpen, onClose, editingScript }: CallScriptModalProps) {
  const [formData, setFormData] = useState<CallScriptFormData>({
    name: "",
    content: "",
    category: "",
    genre: ""
  });
  
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch categories and genres from existing endpoints
  const { data: categoriesData = [] } = useQuery<Category[]>({
    queryKey: ['/api/template-categories'],
    enabled: isOpen
  });

  const { data: genresData = [] } = useQuery<Genre[]>({
    queryKey: ['/api/template-genres'],
    enabled: isOpen
  });

  // Filter genres based on selected category
  const filteredGenres = useMemo(() => {
    if (!selectedCategoryId || !genresData) return [];
    return genresData.filter((genre: Genre) => genre.categoryId === selectedCategoryId && genre.isActive);
  }, [selectedCategoryId, genresData]);

  // Reset form when modal opens/closes or editing script changes
  useEffect(() => {
    if (editingScript) {
      setFormData({
        name: editingScript.name,
        content: editingScript.content,
        category: editingScript.category || "",
        genre: editingScript.genre || ""
      });
      
      // Find and set the category ID for genre filtering
      if (editingScript.category && categoriesData) {
        const category = categoriesData.find((cat: Category) => cat.name === editingScript.category);
        if (category) {
          setSelectedCategoryId(category.id);
        }
      }
    } else {
      resetForm();
    }
  }, [editingScript, isOpen, categoriesData]);

  const resetForm = () => {
    setFormData({
      name: "",
      content: "",
      category: "",
      genre: ""
    });
    setSelectedCategoryId("");
  };

  const handleCategoryChange = (categoryName: string) => {
    if (categoryName === "none") {
      setSelectedCategoryId("");
      setFormData(prev => ({ 
        ...prev, 
        category: "",
        genre: "" // Reset genre when category changes
      }));
    } else {
      const category = categoriesData.find((cat: Category) => cat.name === categoryName);
      if (category) {
        setSelectedCategoryId(category.id);
        setFormData(prev => ({ 
          ...prev, 
          category: categoryName,
          genre: "" // Reset genre when category changes
        }));
      }
    }
  };

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: Omit<CallScript, 'id' | 'createdAt' | 'updatedAt' | 'supabaseId' | 'lastSyncedAt'>) => {
      const response = await fetch('/api/call-scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create script');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/call-scripts'] });
      handleClose();
      toast({ title: "Success", description: "Call script created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create call script", variant: "destructive" });
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CallScript> }) => {
      const response = await fetch(`/api/call-scripts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update script');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/call-scripts'] });
      handleClose();
      toast({ title: "Success", description: "Call script updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update call script", variant: "destructive" });
    }
  });

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.content.trim()) {
      toast({ 
        title: "Validation Error", 
        description: "Name and content are required", 
        variant: "destructive" 
      });
      return;
    }

    const scriptData = {
      name: formData.name.trim(),
      content: formData.content.trim(),
      category: formData.category && formData.category !== "none" ? formData.category.trim() : null,
      genre: formData.genre && formData.genre !== "none" ? formData.genre.trim() : null,
      isActive: true,
      createdBy: null,
      orderIndex: 0
    };

    if (editingScript) {
      updateMutation.mutate({ id: editingScript.id, data: scriptData });
    } else {
      createMutation.mutate(scriptData);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            {editingScript ? 'Edit Call Script' : 'Add New Call Script'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Script name"
                data-testid="input-script-name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <Select
                value={formData.category}
                onValueChange={handleCategoryChange}
                data-testid="select-script-category"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Category</SelectItem>
                  {categoriesData.filter((category: Category) => category.isActive).map((category: Category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Genre</label>
            <Select
              value={formData.genre}
              onValueChange={(value) => setFormData(prev => ({ ...prev, genre: value }))}
              data-testid="select-script-genre"
              disabled={!selectedCategoryId}
            >
              <SelectTrigger>
                <SelectValue placeholder={selectedCategoryId ? "Select genre" : "Select category first"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Genre</SelectItem>
                {filteredGenres.map((genre: Genre) => (
                  <SelectItem key={genre.id} value={genre.name}>
                    {genre.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Content *</label>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Script content..."
              rows={6}
              data-testid="textarea-script-content"
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              data-testid="button-cancel-form"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-script"
            >
              {editingScript ? 'Update Script' : 'Create Script'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}