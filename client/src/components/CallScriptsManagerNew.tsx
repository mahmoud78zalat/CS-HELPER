import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Search, X, Phone, FileText, ChevronDown, ChevronRight, GripVertical, Copy, RotateCcw, Shuffle } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CallScript } from "@shared/schema";

interface SortableScriptCardProps {
  script: CallScript;
  isExpanded: boolean;
  isDragMode: boolean;
  onToggleExpansion: (scriptId: string) => void;
  onCopyScript: (content: string, name: string) => void;
  getCategoryColor: (category: string) => string;
  getGenreColor: (genre: string) => string;
}

function SortableScriptCard({ 
  script, 
  isExpanded, 
  isDragMode, 
  onToggleExpansion, 
  onCopyScript,
  getCategoryColor,
  getGenreColor
}: SortableScriptCardProps) {
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
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card className={`transition-shadow ${isDragging ? 'shadow-lg' : 'hover:shadow-md'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {isDragMode && (
                  <div {...listeners} className="cursor-grab active:cursor-grabbing">
                    <GripVertical className="h-4 w-4 text-gray-400" />
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleExpansion(script.id)}
                  className="p-0 h-auto"
                >
                  {isExpanded ? 
                    <ChevronDown className="h-4 w-4" /> : 
                    <ChevronRight className="h-4 w-4" />
                  }
                </Button>
                <CardTitle className="text-base font-medium">
                  {script.name}
                </CardTitle>
              </div>
              <div className="flex gap-2 mb-2">
                <Badge 
                  variant="secondary" 
                  style={{
                    backgroundColor: getCategoryColor(script.category || '') + '20', 
                    color: getCategoryColor(script.category || '')
                  }}
                >
                  {script.category}
                </Badge>
                <Badge 
                  variant="outline"
                  style={{
                    backgroundColor: getGenreColor(script.genre || '') + '20', 
                    color: getGenreColor(script.genre || '')
                  }}
                >
                  {script.genre}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onCopyScript(script.content, script.name)}
                className="text-blue-600 hover:text-blue-700"
              >
                <Copy className="h-4 w-4" />
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
    </div>
  );
}

interface CallScriptsManagerProps {
  onClose: () => void;
}

export function CallScriptsManager({ onClose }: CallScriptsManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedGenre, setSelectedGenre] = useState<string>("");
  const [expandedScripts, setExpandedScripts] = useState<Set<string>>(new Set());
  const [localScripts, setLocalScripts] = useState<CallScript[]>([]);
  const [isDragMode, setIsDragMode] = useState(false);
  
  const { toast } = useToast();

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch call scripts with authentication
  const { data: callScripts = [], isLoading: scriptsLoading } = useQuery<CallScript[]>({
    queryKey: ['/api/call-scripts'],
    enabled: true,
    queryFn: async (): Promise<CallScript[]> => {
      const response = await fetch('/api/call-scripts', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': localStorage.getItem('current_user_id') || '',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch call scripts');
      return response.json();
    }
  });

  // Fetch connected categories and genres
  const { data: categoriesData = [] } = useQuery({
    queryKey: ['/api/connected-template-categories'],
    enabled: true
  });

  // Extract all genres from all categories for filtering
  const allGenres = Array.isArray(categoriesData) ? categoriesData.flatMap((cat: any) => 
    cat.genres?.map((genre: any) => ({ ...genre, categoryName: cat.name, categoryId: cat.id })) || []
  ) : [];

  // Extract unique categories and genres for filter dropdowns
  const categories = Array.from(new Set(callScripts.map((script: CallScript) => script.category).filter(Boolean)));
  const genres = Array.from(new Set(callScripts.map((script: CallScript) => script.genre).filter(Boolean)));

  // Initialize local scripts when data changes
  useEffect(() => {
    if (callScripts.length > 0) {
      // Load saved local order from localStorage or use server order
      const savedOrder = localStorage.getItem('callScripts_local_order');
      if (savedOrder) {
        try {
          const orderMap = JSON.parse(savedOrder);
          const reorderedScripts = [...callScripts].sort((a, b) => {
            const aOrder = orderMap[a.id] !== undefined ? orderMap[a.id] : a.orderIndex;
            const bOrder = orderMap[b.id] !== undefined ? orderMap[b.id] : b.orderIndex;
            return aOrder - bOrder;
          });
          setLocalScripts(reorderedScripts);
        } catch {
          setLocalScripts([...callScripts].sort((a, b) => a.orderIndex - b.orderIndex));
        }
      } else {
        setLocalScripts([...callScripts].sort((a, b) => a.orderIndex - b.orderIndex));
      }
    }
  }, [callScripts]);

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

  // Handle drag end for local reordering
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setLocalScripts((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Save local order to localStorage (user preferences only)
        const orderMap: Record<string, number> = {};
        newItems.forEach((item, index) => {
          orderMap[item.id] = index;
        });
        localStorage.setItem('callScripts_local_order', JSON.stringify(orderMap));
        
        toast({
          title: "Scripts reordered",
          description: "Your personal call scripts order has been updated",
        });
        
        return newItems;
      });
    }
  };

  // Reset local ordering
  const resetLocalOrder = () => {
    localStorage.removeItem('callScripts_local_order');
    setLocalScripts([...callScripts].sort((a, b) => a.orderIndex - b.orderIndex));
    setIsDragMode(false);
    toast({
      title: "Order reset",
      description: "Call scripts order has been reset to default",
    });
  };

  // Copy script content to clipboard
  const handleCopyScript = (content: string, name: string) => {
    try {
      navigator.clipboard.writeText(content);
      toast({
        title: "Script copied",
        description: `"${name}" has been copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  // Get color for category badge
  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      'General': '#3B82F6',
      'Support': '#10B981',
      'Sales': '#F59E0B',
      'Technical': '#8B5CF6',
      'Billing': '#EF4444',
      'Complaint': '#F97316'
    };
    return colors[category] || '#6B7280';
  };

  // Get color for genre badge
  const getGenreColor = (genre: string): string => {
    const colors: Record<string, string> = {
      'Greeting': '#10B981',
      'Closure': '#EF4444',
      'Information': '#3B82F6',
      'Resolution': '#8B5CF6',
      'Escalation': '#F97316',
      'Follow-up': '#14B8A6'
    };
    return colors[genre] || '#6B7280';
  };

  const clearFilters = () => {
    setSelectedCategory("");
    setSelectedGenre("");
    setSearchTerm("");
  };

  // Check if there's any custom ordering
  const hasCustomOrder = localStorage.getItem('callScripts_local_order') !== null;

  // Filter scripts using localScripts for custom ordering
  const filteredScripts = localScripts.filter((script: CallScript) => {
    const matchesSearch = script.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         script.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || script.category === selectedCategory;
    const matchesGenre = !selectedGenre || script.genre === selectedGenre;
    
    return matchesSearch && matchesCategory && matchesGenre && script.isActive;
  });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-full max-h-full w-screen h-screen m-0 p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Call Scripts
          </DialogTitle>
        </DialogHeader>

        {/* Control Panel */}
        <div className="space-y-4">
          {/* Reordering Controls */}
          <div className="flex gap-2 items-center">
            <Button
              onClick={() => setIsDragMode(!isDragMode)}
              variant={isDragMode ? "default" : "outline"}
              size="sm"
              className="flex items-center gap-2"
            >
              <Shuffle className="h-4 w-4" />
              {isDragMode ? "Exit Reorder Mode" : "Reorder Scripts"}
            </Button>
            
            {(hasCustomOrder || isDragMode) && (
              <Button
                onClick={resetLocalOrder}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset Order
              </Button>
            )}
          </div>

          {/* Search and Filter Controls */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search scripts by name or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-scripts"
              />
            </div>

            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48" data-testid="select-filter-category">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category || 'unknown'} value={category || ''}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                <SelectTrigger className="w-48" data-testid="select-filter-genre">
                  <SelectValue placeholder="Filter by genre" />
                </SelectTrigger>
                <SelectContent>
                  {genres.map((genre) => (
                    <SelectItem key={genre || 'unknown'} value={genre || ''}>
                      {genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(selectedCategory || selectedGenre || searchTerm) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="flex items-center gap-2"
                  data-testid="button-clear-filters"
                >
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FileText className="h-4 w-4" />
            <span>Showing {filteredScripts.length} of {localScripts.length} scripts</span>
            {hasCustomOrder && !isDragMode && (
              <Badge variant="secondary" className="ml-2">Custom Order</Badge>
            )}
          </div>
        </div>

        {/* Scripts List */}
        <div className="overflow-y-auto max-h-[60vh] space-y-4">
          {scriptsLoading ? (
            <div className="text-center py-8">Loading scripts...</div>
          ) : filteredScripts.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No scripts found</h3>
              <p className="text-gray-500">
                {searchTerm || selectedCategory || selectedGenre
                  ? "Try adjusting your search or filter criteria"
                  : "No call scripts are available"}
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={filteredScripts.map(script => script.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {filteredScripts.map((script) => (
                    <SortableScriptCard
                      key={script.id}
                      script={script}
                      isExpanded={expandedScripts.has(script.id)}
                      isDragMode={isDragMode}
                      onToggleExpansion={toggleScriptExpansion}
                      onCopyScript={handleCopyScript}
                      getCategoryColor={getCategoryColor}
                      getGenreColor={getGenreColor}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}