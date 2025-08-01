import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, X, Edit2, Save, Trash2, Settings, Variable, Folder, Tag, ChevronDown, ChevronRight, Search, GripVertical, Palette, Pencil } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import VariableManager from "./VariableManager";

interface ConnectedCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  isActive: boolean;
  orderIndex: number;
  genres: ConnectedGenre[];
}

interface ConnectedGenre {
  id: string;
  name: string;
  description: string;
  color: string;
  isActive: boolean;
  orderIndex: number;
}

interface TemplateConfigManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

// State for controlling the Variable Manager modal
function TemplateConfigManager({ isOpen, onClose }: TemplateConfigManagerProps) {
  const [isVariableManagerOpen, setIsVariableManagerOpen] = useState(false);
  
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Template Configuration Manager</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="categories" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="genres">Genres</TabsTrigger>
              <TabsTrigger value="connected">Connected Config</TabsTrigger>
              <TabsTrigger value="teams">Concerned Teams</TabsTrigger>
              <TabsTrigger value="variables">Variables</TabsTrigger>
            </TabsList>
            
            <TabsContent value="categories">
              <ConfigTypeManager type="categories" />
            </TabsContent>
            
            <TabsContent value="genres">
              <ConfigTypeManager type="genres" />
            </TabsContent>
            
            <TabsContent value="connected">
              <ConnectedConfigManager />
            </TabsContent>
            
            <TabsContent value="teams">
              <ConfigTypeManager type="concerned_teams" />
            </TabsContent>
            
            <TabsContent value="variables">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Variable className="h-5 w-5" />
                    Universal Variable Manager
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-4">
                    Manage template variables and categories used throughout the system. 
                    Variables can be used in both live chat templates and email templates.
                  </p>
                  <Button 
                    onClick={() => setIsVariableManagerOpen(true)}
                    className="w-full"
                  >
                    <Variable className="h-4 w-4 mr-2" />
                    Open Universal Variable Manager
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Variable Manager Modal */}
      <VariableManager 
        isOpen={isVariableManagerOpen} 
        onClose={() => setIsVariableManagerOpen(false)} 
      />
    </>
  );
}

interface ConfigItem {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
}

// Component for managing a specific type
function ConfigTypeManager({ type }: { type: 'categories' | 'genres' | 'concerned_teams' }) {
  const [newItem, setNewItem] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get the correct API endpoint based on type
  const getApiEndpoint = () => {
    switch (type) {
      case 'categories': return '/api/template-categories';
      case 'genres': return '/api/template-genres';
      case 'concerned_teams': return '/api/concerned-teams';
      default: return '';
    }
  };

  // Fetch data from Supabase
  const { data: items = [], isLoading, refetch } = useQuery<ConfigItem[]>({
    queryKey: [getApiEndpoint()],
    staleTime: 0,
  });

  const addItem = async () => {
    if (!newItem.trim()) return;
    
    if (items.some(item => item.name.toLowerCase() === newItem.trim().toLowerCase())) {
      toast({
        title: "Error",
        description: "This item already exists",
        variant: "destructive",
      });
      return;
    }

    try {
      const endpoint = getApiEndpoint();
      await apiRequest('POST', endpoint, {
        name: newItem.trim(),
        description: `${getDisplayName()} item: ${newItem.trim()}`,
        isActive: true
      });

      setNewItem('');
      refetch();
      queryClient.invalidateQueries({ queryKey: [endpoint] });
      
      toast({
        title: "Success",
        description: `Added ${newItem} successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item",
        variant: "destructive",
      });
    }
  };

  const deleteItem = async (id: string, name: string) => {
    try {
      const endpoint = getApiEndpoint();
      await apiRequest('DELETE', `${endpoint}/${id}`, undefined);
      
      refetch();
      queryClient.invalidateQueries({ queryKey: [endpoint] });
      
      toast({
        title: "Success",
        description: `Deleted ${name} successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    }
  };

  const startEditing = (id: string, value: string) => {
    setEditingId(id);
    setEditingValue(value);
  };

  const saveEdit = async () => {
    if (!editingValue.trim() || !editingId) return;
    
    if (items.some(item => item.id !== editingId && item.name.toLowerCase() === editingValue.trim().toLowerCase())) {
      toast({
        title: "Error",
        description: "This item already exists",
        variant: "destructive",
      });
      return;
    }

    try {
      const endpoint = getApiEndpoint();
      await apiRequest('PATCH', `${endpoint}/${editingId}`, {
        name: editingValue.trim(),
        description: `${getDisplayName()} item: ${editingValue.trim()}`
      });

      setEditingId(null);
      setEditingValue('');
      refetch();
      queryClient.invalidateQueries({ queryKey: [endpoint] });
      
      toast({
        title: "Success",
        description: "Item updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update item",
        variant: "destructive",
      });
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingValue('');
  };



  const getDisplayName = () => {
    switch (type) {
      case 'categories': return 'Categories';
      case 'genres': return 'Genres';
      case 'concerned_teams': return 'Concerned Teams';
      default: return type;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings className="h-4 w-4" />
            {getDisplayName()}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add new item */}
          <div className="flex gap-2">
            <Input
              placeholder={`Add new ${type.slice(0, -1).replace('_', ' ')}`}
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addItem()}
              className="flex-1"
            />
            <Button onClick={addItem} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>

          {/* Current items */}
          <div className="flex flex-wrap gap-2">
            {isLoading ? (
              <div className="text-sm text-slate-500">Loading...</div>
            ) : items.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">
                No {type.replace('_', ' ')} configured. Add some above.
              </p>
            ) : (
              items.map((item) => (
                <div key={item.id} className="flex items-center gap-1">
                  {editingId === item.id ? (
                    <div className="flex items-center gap-1">
                      <Input
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit();
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        className="h-6 text-xs w-32"
                        autoFocus
                      />
                      <Button size="sm" variant="ghost" onClick={saveEdit} className="h-6 w-6 p-0">
                        <Save className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-6 w-6 p-0">
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Badge 
                      variant="secondary" 
                      className="text-xs pr-1 flex items-center gap-1 group hover:bg-slate-200"
                    >
                      <span>{item.name}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEditing(item.id, item.name)}
                        className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 hover:bg-slate-300"
                      >
                        <Edit2 className="h-2 w-2" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteItem(item.id, item.name)}
                        className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 hover:bg-red-200 text-red-600"
                      >
                        <X className="h-2 w-2" />
                      </Button>
                    </Badge>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="text-xs text-slate-500">
            <p><strong>Total:</strong> {items.length} {getDisplayName().toLowerCase()}</p>
            <p><strong>Note:</strong> Changes are saved automatically and will apply to new templates immediately.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Connected Config Manager Component
const colorOptions = [
  { value: '#3b82f6', label: 'Blue', class: 'bg-blue-500' },
  { value: '#10b981', label: 'Green', class: 'bg-green-500' },
  { value: '#f59e0b', label: 'Yellow', class: 'bg-yellow-500' },
  { value: '#ef4444', label: 'Red', class: 'bg-red-500' },
  { value: '#8b5cf6', label: 'Purple', class: 'bg-purple-500' },
  { value: '#06b6d4', label: 'Cyan', class: 'bg-cyan-500' },
  { value: '#84cc16', label: 'Lime', class: 'bg-lime-500' },
  { value: '#f97316', label: 'Orange', class: 'bg-orange-500' },
];

function ConnectedConfigManager() {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [genreDialogOpen, setGenreDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ConnectedCategory | null>(null);
  const [editingGenre, setEditingGenre] = useState<ConnectedGenre | null>(null);
  const [selectedCategoryForGenre, setSelectedCategoryForGenre] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
    isActive: true,
  });
  const [newGenre, setNewGenre] = useState({
    name: '',
    description: '',
    categoryId: '',
    color: '#10b981',
    isActive: true,
  });
  
  // Drag and drop state  
  const [draggedCategory, setDraggedCategory] = useState<string | null>(null);
  const [draggedGenre, setDraggedGenre] = useState<string | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch connected categories with genres
  const { data: categories = [], isLoading } = useQuery<ConnectedCategory[]>({
    queryKey: ['/api/connected-template-categories'],
  });

  // Create category mutation (FIXED - using correct endpoint)
  const createCategoryMutation = useMutation({
    mutationFn: async (data: typeof newCategory) => {
      return apiRequest('POST', '/api/connected-template-categories', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/connected-template-categories'] });
      setCategoryDialogOpen(false);
      setNewCategory({ name: '', description: '', color: '#3b82f6', isActive: true });
      toast({ title: 'Success', description: 'Category created successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to create category', variant: 'destructive' });
    },
  });



  // Create genre mutation (FIXED - using correct endpoint)
  const createGenreMutation = useMutation({
    mutationFn: async (data: typeof newGenre) => {
      return apiRequest('POST', '/api/connected-template-genres', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/connected-template-categories'] });
      setGenreDialogOpen(false);
      setNewGenre({ name: '', description: '', categoryId: '', color: '#10b981', isActive: true });
      toast({ title: 'Success', description: 'Genre created successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to create genre', variant: 'destructive' });
    },
  });

  // Update genre mutation (FIXED - using correct endpoint)
  const updateGenreMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ConnectedGenre> }) => {
      return apiRequest('PATCH', `/api/connected-template-genres/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/connected-template-categories'] });
      setEditingGenre(null);
      setGenreDialogOpen(false);
      toast({ title: 'Success', description: 'Genre updated successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to update genre', variant: 'destructive' });
    },
  });

  // Delete genre mutation (FIXED - using correct endpoint)
  const deleteGenreMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/connected-template-genres/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/connected-template-categories'] });
      toast({ title: 'Success', description: 'Genre deleted successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to delete genre', variant: 'destructive' });
    },
  });

  // Update category mutation (FIXED - using correct endpoint)
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ConnectedCategory> }) => {
      return apiRequest('PATCH', `/api/connected-template-categories/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/connected-template-categories'] });
      setEditingCategory(null);
      setCategoryDialogOpen(false);
      toast({ title: 'Success', description: 'Category updated successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to update category', variant: 'destructive' });
    },
  });

  // Delete category mutation (FIXED - using correct endpoint)
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/connected-template-categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/connected-template-categories'] });
      toast({ title: 'Success', description: 'Category deleted successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to delete category', variant: 'destructive' });
    },
  });

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Reorder categories mutation
  const reorderCategoriesMutation = useMutation({
    mutationFn: async (updates: Array<{ id: string; order: number }>) => {
      return apiRequest('POST', '/api/connected-template-categories/reorder', { updates });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/connected-template-categories'] });
      toast({ title: 'Success', description: 'Categories reordered successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to reorder categories', variant: 'destructive' });
    },
  });

  // Reorder genres mutation  
  const reorderGenresMutation = useMutation({
    mutationFn: async (updates: Array<{ id: string; order: number }>) => {
      return apiRequest('POST', '/api/connected-template-genres/reorder', { updates });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/connected-template-categories'] });
      toast({ title: 'Success', description: 'Genres reordered successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to reorder genres', variant: 'destructive' });
    },
  });

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleEditCategory = (category: ConnectedCategory) => {
    setEditingCategory(category);
    setNewCategory({
      name: category.name,
      description: category.description,
      color: category.color,
      isActive: category.isActive,
    });
    setCategoryDialogOpen(true);
  };

  const handleEditGenre = (genre: ConnectedGenre, categoryId: string) => {
    setEditingGenre(genre);
    setSelectedCategoryForGenre(categoryId);
    setNewGenre({
      name: genre.name,
      description: genre.description,
      categoryId: categoryId,
      color: genre.color,
      isActive: genre.isActive,
    });
    setGenreDialogOpen(true);
  };

  // Drag and drop handlers
  const handleCategoryDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = (categories as ConnectedCategory[]).findIndex((cat) => cat.id === active.id);
      const newIndex = (categories as ConnectedCategory[]).findIndex((cat) => cat.id === over?.id);

      const reorderedCategories = arrayMove(categories as ConnectedCategory[], oldIndex, newIndex);
      
      // Create updates array with new order indices
      const updates = reorderedCategories.map((cat, index) => ({
        id: cat.id,
        order: index
      }));
      
      reorderCategoriesMutation.mutate(updates);
    }
  };

  const handleGenreDragEnd = (event: DragEndEvent, categoryId: string) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const category = (categories as ConnectedCategory[]).find(cat => cat.id === categoryId);
      if (!category) return;

      const oldIndex = category.genres.findIndex((genre) => genre.id === active.id);
      const newIndex = category.genres.findIndex((genre) => genre.id === over?.id);

      const reorderedGenres = arrayMove(category.genres, oldIndex, newIndex);
      
      // Create updates array with new order indices
      const updates = reorderedGenres.map((genre, index) => ({
        id: genre.id,
        order: index
      }));
      
      reorderGenresMutation.mutate(updates);
    }
  };

  // Filter categories based on search term
  const filteredCategories = (categories as ConnectedCategory[]).filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.genres.some(genre => 
      genre.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      genre.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const resetCategoryDialog = () => {
    setEditingCategory(null);
    setNewCategory({ name: '', description: '', color: '#3b82f6', isActive: true });
  };

  const resetGenreDialog = () => {
    setEditingGenre(null);
    setNewGenre({ name: '', description: '', categoryId: '', color: '#10b981', isActive: true });
    setNewGenre({
      name: genre.name,
      description: genre.description,
      categoryId,
      color: genre.color,
      isActive: genre.isActive,
    });
    setGenreDialogOpen(true);
  };

  const handleCreateCategory = () => {
    if (editingCategory) {
      updateCategoryMutation.mutate({
        id: editingCategory.id,
        data: newCategory,
      });
    } else {
      createCategoryMutation.mutate(newCategory);
    }
  };

  const handleCreateGenre = () => {
    if (editingGenre) {
      updateGenreMutation.mutate({
        id: editingGenre.id,
        data: newGenre,
      });
    } else {
      createGenreMutation.mutate(newGenre);
    }
  };

  const handleDeleteCategory = (category: ConnectedCategory) => {
    if (confirm(`Are you sure you want to delete "${category.name}"? This will also delete all associated genres.`)) {
      deleteCategoryMutation.mutate(category.id);
    }
  };

  const handleDeleteGenre = (genre: ConnectedGenre) => {
    if (confirm(`Are you sure you want to delete "${genre.name}"?`)) {
      deleteGenreMutation.mutate(genre.id);
    }
  };

  const resetCategoryDialog = () => {
    setEditingCategory(null);
    setNewCategory({ name: '', description: '', color: '#3b82f6', isActive: true });
    setCategoryDialogOpen(false);
  };

  const resetGenreDialog = () => {
    setEditingGenre(null);
    setNewGenre({ name: '', description: '', categoryId: '', color: '#10b981', isActive: true });
    setGenreDialogOpen(false);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Folder className="h-4 w-4" />
            Connected Categories & Genres
          </CardTitle>
          <p className="text-xs text-slate-600">
            Manage hierarchical categories with their associated genres for better template organization.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={() => resetCategoryDialog()}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingCategory ? 'Edit Category' : 'Create New Category'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="category-name">Name</Label>
                    <Input
                      id="category-name"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      placeholder="Category name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category-description">Description</Label>
                    <Textarea
                      id="category-description"
                      value={newCategory.description}
                      onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                      placeholder="Category description"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category-color">Color</Label>
                    <Select value={newCategory.color} onValueChange={(value) => setNewCategory({ ...newCategory, color: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {colorOptions.map((color) => (
                          <SelectItem key={color.value} value={color.value}>
                            <div className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded ${color.class}`} />
                              {color.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={resetCategoryDialog}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateCategory}>
                      {editingCategory ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={genreDialogOpen} onOpenChange={setGenreDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    resetGenreDialog();
                    const firstCategory = (categories as ConnectedCategory[])[0];
                    setSelectedCategoryForGenre(firstCategory?.id || '');
                    setNewGenre({ ...newGenre, categoryId: firstCategory?.id || '' });
                  }}
                  disabled={(categories as ConnectedCategory[]).length === 0}
                >
                  <Tag className="h-4 w-4 mr-1" />
                  Add Genre
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingGenre ? 'Edit Genre' : 'Create New Genre'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="genre-category">Category</Label>
                    <Select 
                      value={newGenre.categoryId} 
                      onValueChange={(value) => setNewGenre({ ...newGenre, categoryId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {(categories as ConnectedCategory[]).map((category: ConnectedCategory) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="genre-name">Name</Label>
                    <Input
                      id="genre-name"
                      value={newGenre.name}
                      onChange={(e) => setNewGenre({ ...newGenre, name: e.target.value })}
                      placeholder="Genre name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="genre-description">Description</Label>
                    <Textarea
                      id="genre-description"
                      value={newGenre.description}
                      onChange={(e) => setNewGenre({ ...newGenre, description: e.target.value })}
                      placeholder="Genre description"
                    />
                  </div>
                  <div>
                    <Label htmlFor="genre-color">Color</Label>
                    <Select value={newGenre.color} onValueChange={(value) => setNewGenre({ ...newGenre, color: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {colorOptions.map((color) => (
                          <SelectItem key={color.value} value={color.value}>
                            <div className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded ${color.class}`} />
                              {color.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={resetGenreDialog}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateGenre}>
                      {editingGenre ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="text-sm text-slate-500">Loading...</div>
          ) : (categories as ConnectedCategory[]).length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">
              No connected categories configured. Add a category to get started.
            </p>
          ) : (
            <div className="space-y-2">
              {(categories as ConnectedCategory[]).map((category: ConnectedCategory) => (
                <div key={category.id} className="border rounded-lg">
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-t-lg">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleCategory(category.id)}
                        className="h-auto p-1"
                      >
                        {expandedCategories.has(category.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                      <div 
                        className="w-4 h-4 rounded" 
                        style={{ backgroundColor: category.color }}
                      />
                      <div>
                        <h4 className="font-medium">{category.name}</h4>
                        {category.description && (
                          <p className="text-xs text-slate-600">{category.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-xs">
                        {category.genres?.length || 0} genres
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditCategory(category)}
                        className="h-auto p-1"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCategory(category)}
                        className="h-auto p-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  {expandedCategories.has(category.id) && (
                    <div className="p-3 border-t">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="text-sm font-medium">Genres in this category</h5>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            resetGenreDialog();
                            setNewGenre({ ...newGenre, categoryId: category.id });
                            setGenreDialogOpen(true);
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Genre
                        </Button>
                      </div>
                      
                      {category.genres?.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-4">
                          No genres in this category yet.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {category.genres?.map((genre: ConnectedGenre) => (
                            <div
                              key={genre.id}
                              className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded border"
                            >
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded" 
                                  style={{ backgroundColor: genre.color }}
                                />
                                <div>
                                  <span className="text-sm font-medium">{genre.name}</span>
                                  {genre.description && (
                                    <p className="text-xs text-slate-600">{genre.description}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditGenre(genre, category.id)}
                                  className="h-auto p-1"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteGenre(genre)}
                                  className="h-auto p-1 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default TemplateConfigManager;