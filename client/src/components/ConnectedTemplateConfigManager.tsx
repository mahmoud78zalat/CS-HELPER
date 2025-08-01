import { useState } from 'react';
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

export function ConnectedTemplateConfigManager() {
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
    queryFn: async () => {
      const response = await fetch('/api/connected-template-categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    },
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (data: typeof newCategory) => {
      const response = await fetch('/api/connected-template-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create category');
      return response.json();
    },
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
    mutationFn: async (data: typeof newGenre) => {
      const response = await fetch('/api/connected-template-genres', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create genre');
      return response.json();
    },
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

  const openGenreDialog = (categoryId: string) => {
    setSelectedCategoryForGenre(categoryId);
    setNewGenre(prev => ({ ...prev, categoryId }));
    setGenreDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Connected Template Configuration</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage connected categories and their genres hierarchically
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
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
              <Button variant="outline" className="flex items-center gap-2">
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

      {/* Connected Categories List */}
      <div className="space-y-2">
        {categories.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Folder className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No connected categories configured yet</p>
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
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Expanded Category Content */}
              {expandedCategories.has(category.id) && (
                <div className="border-t p-4 bg-gray-50 dark:bg-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium text-sm">Genres in this category:</h5>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openGenreDialog(category.id)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Genre
                    </Button>
                  </div>

                  {category.genres.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {category.genres.map(genre => (
                        <div 
                          key={genre.id}
                          className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded border"
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
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost">
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-4">
                      No genres added to this category yet
                    </p>
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