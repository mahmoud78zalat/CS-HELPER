import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Phone, Search, Plus, Edit, Trash2, ChevronDown, ChevronRight, GripVertical } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { getCategoryBadgeClasses, getGenreBadgeClasses } from "@/lib/templateColors";

// Sortable Script Item Component
function SortableScriptItem({ 
  script, 
  isExpanded, 
  onToggleExpansion, 
  onEdit, 
  onDelete 
}: {
  script: CallScript;
  isExpanded: boolean;
  onToggleExpansion: (id: string) => void;
  onEdit: (script: CallScript) => void;
  onDelete: (id: string, name: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: script.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style} className={isDragging ? 'z-50' : ''}>
      <CardHeader className="cursor-pointer" onClick={() => onToggleExpansion(script.id)}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab hover:cursor-grabbing"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-4 w-4 text-gray-400" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
                {script.name}
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
              </CardTitle>
              <CardDescription className="flex gap-2 mt-2">
                <Badge className={`text-xs font-semibold px-3 py-1 rounded-full shadow-sm border ${getCategoryBadgeClasses(script.category)}`}>
                  {script.category}
                </Badge>
                <Badge className={`text-xs font-semibold px-3 py-1 rounded-full shadow-sm border ${getGenreBadgeClasses(script.genre)}`}>
                  {script.genre}
                </Badge>
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" onClick={() => onEdit(script)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(script.id, script.name)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
            <pre className="text-sm whitespace-pre-wrap font-mono">
              {script.content}
            </pre>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

interface CallScript {
  id: string;
  name: string;
  content: string;
  category: string;
  genre: string;
  isActive: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

interface CallScriptsAdminManagerProps {
  onClose: () => void;
}

export function CallScriptsAdminManager({ onClose }: CallScriptsAdminManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingScript, setEditingScript] = useState<CallScript | null>(null);
  const [expandedScripts, setExpandedScripts] = useState<Set<string>>(new Set());
  const [localScripts, setLocalScripts] = useState<CallScript[]>([]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch call scripts
  const { data: callScripts = [], isLoading: scriptsLoading } = useQuery({
    queryKey: ['/api/call-scripts'],
    enabled: true
  });

  // Update local scripts when data changes
  useEffect(() => {
    if (Array.isArray(callScripts) && callScripts.length > 0) {
      const sortedScripts = [...(callScripts as CallScript[])].sort((a, b) => 
        (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
      );
      setLocalScripts(sortedScripts);
    }
  }, [callScripts]);

  // Fetch connected categories and genres
  const { data: categoriesData = [] } = useQuery({
    queryKey: ['/api/connected-template-categories'],
    enabled: true
  });

  // Extract all genres from all categories for filtering
  const allGenres = (Array.isArray(categoriesData) ? categoriesData.flatMap((cat: any) => 
    cat.genres?.map((genre: any) => ({ ...genre, categoryName: cat.name, categoryId: cat.id })) || []
  ) : []);

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: async (reorderedScripts: CallScript[]) => {
      const updates = reorderedScripts.map((script, index) => ({
        id: script.id,
        orderIndex: index
      }));
      
      console.log('[CallScriptsAdminManager] Sending reorder request with updates:', updates);
      console.log('[CallScriptsAdminManager] Reordered scripts:', reorderedScripts.map(s => ({ id: s.id, name: s.name, orderIndex: s.orderIndex })));
      
      const response = await apiRequest('PATCH', '/api/call-scripts/reorder', { updates });
      console.log('[CallScriptsAdminManager] Reorder response:', response);
      return response;
    },
    onSuccess: () => {
      console.log('[CallScriptsAdminManager] Reorder successful, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['/api/call-scripts'] });
      toast({
        title: "Order updated",
        description: "Call scripts have been reordered successfully",
      });
    },
    onError: (error: any) => {
      console.error('[CallScriptsAdminManager] Reorder error:', error);
      toast({
        title: "Reorder failed",  
        description: error?.message || "Unable to reorder call scripts",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/call-scripts/${id}`);
    },
    onSuccess: async () => {
      // Invalidate and refetch the exact query key
      await queryClient.invalidateQueries({ 
        queryKey: ['/api/call-scripts'],
        exact: true 
      });
      
      toast({
        title: "Script deleted",
        description: "Call script has been successfully deleted",
      });
    },
    onError: (error: any) => {
      console.error('Delete call script error:', error);
      toast({
        title: "Delete failed",
        description: "Unable to delete call script",
        variant: "destructive",
      });
    },
  });

  // Drag end handler
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    console.log('[CallScriptsAdminManager] Drag end event:', { active: active.id, over: over?.id });

    if (active.id !== over?.id) {
      const oldIndex = localScripts.findIndex((script) => script.id === active.id);
      const newIndex = localScripts.findIndex((script) => script.id === over?.id);

      console.log('[CallScriptsAdminManager] Moving script from index', oldIndex, 'to', newIndex);
      console.log('[CallScriptsAdminManager] Current localScripts count:', localScripts.length);

      const reorderedScripts = arrayMove(localScripts, oldIndex, newIndex);
      console.log('[CallScriptsAdminManager] Reordered scripts preview:', reorderedScripts.map(s => ({ id: s.id, name: s.name })));
      
      setLocalScripts(reorderedScripts);
      reorderMutation.mutate(reorderedScripts);
    } else {
      console.log('[CallScriptsAdminManager] No reorder needed - same position');
    }
  };

  const toggleScriptExpansion = (scriptId: string) => {
    setExpandedScripts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(scriptId)) {
        newSet.delete(scriptId);
      } else {
        newSet.add(scriptId);
      }
      return newSet;
    });
  };

  const handleEdit = (script: CallScript) => {
    setEditingScript(script);
    setShowEditModal(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const clearFilters = () => {
    setSelectedCategory("all");
    setSelectedGenre("all");
    setSearchTerm("");
  };

  // Filter scripts using local scripts for ordering
  const filteredScripts = localScripts.filter((script: CallScript) => {
    const matchesSearch = script.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         script.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || script.category === selectedCategory;
    const matchesGenre = selectedGenre === "all" || script.genre === selectedGenre;
    
    return matchesSearch && matchesCategory && matchesGenre && script.isActive;
  });

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Call Scripts Manager
            </DialogTitle>
            <div className="text-sm text-gray-500">
              Manage call scripts with full admin controls
            </div>
          </DialogHeader>

          {/* Admin Controls */}
          <div className="flex justify-start items-center">
            <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Script
            </Button>
          </div>

          {/* Search and Filter Controls */}
          <div className="space-y-4">
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search scripts by name or content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {(categoriesData as any[]).map((category: any) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genres</SelectItem>
                  {(allGenres as any[]).map((genre: any) => (
                    <SelectItem key={genre.id} value={genre.name}>
                      {genre.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(searchTerm || selectedCategory !== "all" || selectedGenre !== "all") && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          </div>

          {/* Scripts List with Drag and Drop */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-[500px] w-full">
                {scriptsLoading ? (
                  <div className="text-center py-8">Loading scripts...</div>
                ) : filteredScripts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {localScripts.length === 0 ? "No call scripts found" : "No scripts match your filters"}
                  </div>
                ) : (
                  <SortableContext
                    items={filteredScripts.map(s => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="grid gap-4 p-4">
                      {filteredScripts.map((script: CallScript) => (
                        <SortableScriptItem
                          key={script.id}
                          script={script}
                          isExpanded={expandedScripts.has(script.id)}
                          onToggleExpansion={toggleScriptExpansion}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                        />
                      ))}
                    </div>
                  </SortableContext>
                )}
              </ScrollArea>
            </div>
          </DndContext>
        </DialogContent>
      </Dialog>

      {/* Create Modal */}
      {showCreateModal && (
        <CallScriptCreateModal 
          onClose={() => setShowCreateModal(false)}
          categories={(categoriesData as any[]) || []}
          genres={allGenres || []}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && editingScript && (
        <CallScriptEditModal 
          script={editingScript}
          onClose={() => {
            setShowEditModal(false);
            setEditingScript(null);
          }}
          categories={(categoriesData as any[]) || []}
          genres={allGenres || []}
        />
      )}
    </>
  );
}

// Create Modal Component
function CallScriptCreateModal({ 
  onClose, 
  categories, 
  genres 
}: { 
  onClose: () => void;
  categories: any[];
  genres: any[];
}) {
  const [formData, setFormData] = useState({
    name: "",
    content: "",
    category: "",
    genre: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest('POST', '/api/call-scripts', { ...data, isActive: true });
    },
    onSuccess: async () => {
      // Invalidate and refetch the exact query key
      await queryClient.invalidateQueries({ 
        queryKey: ['/api/call-scripts'],
        exact: true 
      });
      
      toast({
        title: "Script created",
        description: "New call script has been successfully created",
      });
      onClose();
    },
    onError: (error: any) => {
      console.error('Create call script error:', error);
      toast({
        title: "Create failed",
        description: error?.message || "Unable to create call script",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.content || !formData.category || !formData.genre) {
      toast({
        title: "Validation error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-full max-h-full w-screen h-screen m-0 p-6">
        <DialogHeader>
          <DialogTitle>Create New Call Script</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Script Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter script name"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value, genre: "" }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category: any) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="genre">Genre *</Label>
              <Select 
                value={formData.genre} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, genre: value }))}
                disabled={!formData.category}
              >
                <SelectTrigger>
                  <SelectValue placeholder={!formData.category ? "Select category first" : "Select genre"} />
                </SelectTrigger>
                <SelectContent>
                  {genres
                    .filter((genre: any) => genre.categoryName === formData.category)
                    .map((genre: any) => (
                    <SelectItem key={genre.id} value={genre.name}>
                      {genre.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="content">Script Content *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Enter the call script content"
              rows={8}
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Script"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Edit Modal Component
function CallScriptEditModal({ 
  script, 
  onClose, 
  categories, 
  genres 
}: { 
  script: CallScript;
  onClose: () => void;
  categories: any[];
  genres: any[];
}) {
  const [formData, setFormData] = useState({
    name: script.name,
    content: script.content,
    category: script.category,
    genre: script.genre,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest('PUT', `/api/call-scripts/${script.id}`, data);
    },
    onSuccess: async () => {
      // Invalidate and refetch the exact query key
      await queryClient.invalidateQueries({ 
        queryKey: ['/api/call-scripts'],
        exact: true 
      });
      
      toast({
        title: "Script updated",
        description: "Call script has been successfully updated",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Unable to update call script",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.content || !formData.category || !formData.genre) {
      toast({
        title: "Validation error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    updateMutation.mutate(formData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-full max-h-full w-screen h-screen m-0 p-6">
        <DialogHeader>
          <DialogTitle>Edit Call Script</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Script Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter script name"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value, genre: "" }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category: any) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="genre">Genre *</Label>
              <Select 
                value={formData.genre} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, genre: value }))}
                disabled={!formData.category}
              >
                <SelectTrigger>
                  <SelectValue placeholder={!formData.category ? "Select category first" : "Select genre"} />
                </SelectTrigger>
                <SelectContent>
                  {genres
                    .filter((genre: any) => genre.categoryName === formData.category)
                    .map((genre: any) => (
                    <SelectItem key={genre.id} value={genre.name}>
                      {genre.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="content">Script Content *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Enter the call script content"
              rows={8}
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Updating..." : "Update Script"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}