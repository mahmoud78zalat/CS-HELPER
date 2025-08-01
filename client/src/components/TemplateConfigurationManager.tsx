import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Folder, Tag, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

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

export function TemplateConfigurationManager() {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [genreDialogOpen, setGenreDialogOpen] = useState(false);
  const [selectedCategoryForGenre, setSelectedCategoryForGenre] = useState<string>('');
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

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch connected categories with genres
  const { data: categories = [], isLoading } = useQuery<ConnectedCategory[]>({
    queryKey: ['/api/connected-template-categories'],
    queryFn: () => apiRequest('/api/connected-template-categories'),
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: (data: typeof newCategory) => 
      apiRequest('/api/connected-template-categories', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/connected-template-categories'] });
      setCategoryDialogOpen(false);
      setNewCategory({ name: '', description: '', color: '#3b82f6', isActive: true });
      toast({ title: 'Success', description: 'Category created successfully' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to create category',
        variant: 'destructive' 
      });
    }
  });

  // Create genre mutation
  const createGenreMutation = useMutation({
    mutationFn: (data: typeof newGenre) => 
      apiRequest('/api/connected-template-genres', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/connected-template-categories'] });
      setGenreDialogOpen(false);
      setNewGenre({ name: '', description: '', categoryId: '', color: '#10b981', isActive: true });
      toast({ title: 'Success', description: 'Genre created successfully' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to create genre',
        variant: 'destructive' 
      });
    }
  });

  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleCreateCategory = () => {
    if (!newCategory.name.trim()) {
      toast({ title: 'Error', description: 'Category name is required', variant: 'destructive' });
      return;
    }
    createCategoryMutation.mutate(newCategory);
  };

  const handleCreateGenre = () => {
    if (!newGenre.name.trim()) {
      toast({ title: 'Error', description: 'Genre name is required', variant: 'destructive' });
      return;
    }
    if (!newGenre.categoryId) {
      toast({ title: 'Error', description: 'Please select a category', variant: 'destructive' });
      return;
    }
    createGenreMutation.mutate(newGenre);
  };

  const openGenreDialog = (categoryId?: string) => {
    if (categoryId) {
      setSelectedCategoryForGenre(categoryId);
      setNewGenre(prev => ({ ...prev, categoryId }));
    }
    setGenreDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Template Configuration</h3>
        </div>
        <div className="animate-pulse space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Template Configuration</h3>
        <div className="flex gap-2">
          <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Category</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="category-name">Name</Label>
                  <Input
                    id="category-name"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter category name"
                  />
                </div>
                <div>
                  <Label htmlFor="category-description">Description</Label>
                  <Textarea
                    id="category-description"
                    value={newCategory.description}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter category description"
                  />
                </div>
                <div>
                  <Label htmlFor="category-color">Color</Label>
                  <Select 
                    value={newCategory.color} 
                    onValueChange={(value) => setNewCategory(prev => ({ ...prev, color: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {colorOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded ${option.class}`} />
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateCategory} disabled={createCategoryMutation.isPending}>
                    {createCategoryMutation.isPending ? 'Creating...' : 'Create Category'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={genreDialogOpen} onOpenChange={setGenreDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Genre
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Genre</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="genre-category">Category</Label>
                  <Select 
                    value={newGenre.categoryId} 
                    onValueChange={(value) => setNewGenre(prev => ({ ...prev, categoryId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded" 
                              style={{ backgroundColor: category.color }}
                            />
                            {category.name}
                          </div>
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
                    onChange={(e) => setNewGenre(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter genre name"
                  />
                </div>
                <div>
                  <Label htmlFor="genre-description">Description</Label>
                  <Textarea
                    id="genre-description"
                    value={newGenre.description}
                    onChange={(e) => setNewGenre(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter genre description"
                  />
                </div>
                <div>
                  <Label htmlFor="genre-color">Color</Label>
                  <Select 
                    value={newGenre.color} 
                    onValueChange={(value) => setNewGenre(prev => ({ ...prev, color: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {colorOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded ${option.class}`} />
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setGenreDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateGenre} disabled={createGenreMutation.isPending}>
                    {createGenreMutation.isPending ? 'Creating...' : 'Create Genre'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Categories List */}
      <div className="space-y-2">
        {categories.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Folder className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No categories configured yet</p>
            <p className="text-sm">Create your first category to get started</p>
          </div>
        ) : (
          categories.map(category => (
            <div key={category.id} className="border rounded-lg bg-white dark:bg-gray-800">
              {/* Category Header */}
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                onClick={() => toggleCategoryExpansion(category.id)}
              >
                <div className="flex items-center gap-3">
                  {expandedCategories.has(category.id) ? (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-500" />
                  )}
                  <div 
                    className="w-4 h-4 rounded" 
                    style={{ backgroundColor: category.color }}
                  />
                  <div>
                    <h4 className="font-medium">{category.name}</h4>
                    {category.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {category.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {category.genres.length} genres
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      openGenreDialog(category.id);
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Genres List */}
              {expandedCategories.has(category.id) && (
                <div className="border-t bg-gray-50 dark:bg-gray-700/50">
                  {category.genres.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                      <Tag className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No genres in this category</p>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="mt-2"
                        onClick={() => openGenreDialog(category.id)}
                      >
                        Add First Genre
                      </Button>
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {category.genres.map(genre => (
                        <div 
                          key={genre.id}
                          className="flex items-center justify-between p-2 rounded hover:bg-white dark:hover:bg-gray-600"
                        >
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded" 
                              style={{ backgroundColor: genre.color }}
                            />
                            <div>
                              <span className="text-sm font-medium">{genre.name}</span>
                              {genre.description && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {genre.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-500 hover:text-red-700">
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
          ))
        )}
      </div>
    </div>
  );
}