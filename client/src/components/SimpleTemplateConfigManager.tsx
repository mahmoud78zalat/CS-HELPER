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

interface Category {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
}

interface Genre {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
}

export function SimpleTemplateConfigManager() {
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [genreDialogOpen, setGenreDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    isActive: true,
  });
  const [newGenre, setNewGenre] = useState({
    name: '',
    description: '',
    isActive: true,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch categories and genres separately (existing APIs)
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/template-categories'],
    queryFn: () => apiRequest('/api/template-categories'),
  });

  const { data: genres = [] } = useQuery<Genre[]>({
    queryKey: ['/api/template-genres'],
    queryFn: () => apiRequest('/api/template-genres'),
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: (data: typeof newCategory) => 
      apiRequest('/api/template-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/template-categories'] });
      setCategoryDialogOpen(false);
      setNewCategory({ name: '', description: '', isActive: true });
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
      apiRequest('/api/template-genres', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/template-genres'] });
      setGenreDialogOpen(false);
      setNewGenre({ name: '', description: '', isActive: true });
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
    createGenreMutation.mutate(newGenre);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Template Configuration</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage template categories and genres
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

      {/* Categories Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Folder className="h-5 w-5" />
          Categories ({categories.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <div key={category.id} className="border rounded-lg p-4 bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{category.name}</h4>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost">
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Trash2 className="h-3 w-3 text-red-500" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {category.description || 'No description'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Genres Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Genres ({genres.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {genres.map((genre) => (
            <div key={genre.id} className="border rounded-lg p-4 bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{genre.name}</h4>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost">
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Trash2 className="h-3 w-3 text-red-500" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {genre.description || 'No description'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}