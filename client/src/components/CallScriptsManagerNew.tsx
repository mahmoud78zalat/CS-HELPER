import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Search, X, Phone, FileText, ChevronDown, ChevronRight, GripVertical, RotateCcw, Shuffle } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { apiRequest } from "@/lib/queryClient";
import type { CallScript } from "@shared/schema";
import { getCategoryColor, getGenreColor } from "@/lib/templateColors";

interface SortableScriptCardProps {
  script: CallScript;
  isExpanded: boolean;
  isDragMode: boolean;
  onToggleExpansion: (scriptId: string) => void;
  getCategoryColor: (category: string) => string;
  getGenreColor: (genre: string) => string;
}

function SortableScriptCard({ 
  script, 
  isExpanded, 
  isDragMode, 
  onToggleExpansion, 
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
    opacity: isDragging ? 0.8 : 1,
    scale: isDragging ? 1.02 : 1,
  };

  // Generate dynamic gradient colors based on script index
  const scriptIndex = Math.abs(script.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0));
  const gradients = [
    'from-blue-500 to-purple-600',
    'from-green-500 to-teal-600', 
    'from-orange-500 to-red-600',
    'from-purple-500 to-pink-600',
    'from-indigo-500 to-blue-600',
    'from-teal-500 to-cyan-600',
    'from-red-500 to-pink-600',
    'from-yellow-500 to-orange-600',
  ];
  const gradientClass = gradients[scriptIndex % gradients.length];

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card 
        className={`overflow-hidden group cursor-pointer transition-all duration-300 border-2 ${
          isDragging 
            ? 'shadow-2xl border-blue-300 bg-blue-50/50' 
            : 'hover:shadow-xl hover:border-blue-200 hover:scale-[1.01]'
        }`}
        onClick={() => onToggleExpansion(script.id)}
      >
        {/* Gradient Header Bar */}
        <div className={`h-3 bg-gradient-to-r ${gradientClass} ${isDragging ? 'opacity-100' : ''}`}></div>
        
        <CardHeader className="pb-4 relative">
          {/* Background pattern on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          <div className="relative flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                {isDragMode && (
                  <div 
                    {...listeners} 
                    className="cursor-grab active:cursor-grabbing p-1 rounded-md hover:bg-gray-100 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                    title="Drag to reorder"
                  >
                    <GripVertical className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  </div>
                )}
                
                <div className={`p-2 rounded-xl bg-gradient-to-r ${gradientClass} text-white shadow-lg`}>
                  <FileText className="h-4 w-4" />
                </div>
                
                <div className="flex items-center gap-2 flex-1">
                  <CardTitle className="text-lg font-bold text-gray-800 dark:text-white group-hover:text-blue-600 transition-colors">
                    {script.name}
                  </CardTitle>
                  
                  <div className="ml-auto">
                    {isExpanded ? 
                      <ChevronDown className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" /> : 
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    }
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 items-center ml-12">
                {script.category && (
                  <Badge 
                    className="text-xs font-semibold px-3 py-1 rounded-full shadow-sm"
                    style={{
                      backgroundColor: getCategoryColor(script.category) + '20', 
                      color: getCategoryColor(script.category),
                      borderColor: getCategoryColor(script.category) + '40',
                      border: '1px solid'
                    }}
                  >
                    {script.category}
                  </Badge>
                )}
                {script.genre && (
                  <Badge 
                    className="text-xs font-semibold px-3 py-1 rounded-full shadow-sm"
                    style={{
                      backgroundColor: getGenreColor(script.genre) + '15', 
                      color: getGenreColor(script.genre),
                      borderColor: getGenreColor(script.genre),
                      border: '1px solid'
                    }}
                  >
                    {script.genre}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        
        {isExpanded && (
          <CardContent className="pt-0 pb-6">
            <div className="ml-12">
              <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-800 dark:to-slate-700 rounded-xl p-6 border border-slate-200 dark:border-slate-600 shadow-inner">
                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-1 h-6 bg-gradient-to-b ${gradientClass} rounded-full`}></div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Script Content</span>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-lg p-4 shadow-sm border border-slate-100 dark:border-slate-700">
                  <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-medium leading-relaxed">
                    {script.content}
                  </pre>
                </div>
              </div>
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
  const queryClient = useQueryClient();
  const { user } = useAuth();

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

  // This is the user modal - no backend mutations, local storage only

  // Initialize local scripts when data changes - USER MODAL ONLY (no admin logic)
  useEffect(() => {
    if (callScripts.length > 0) {
      // Always load saved local order from localStorage or use server order
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

  // Handle drag end for USER MODAL ONLY - always save locally
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    console.log('[CallScriptsManagerNew] USER MODAL - Drag end event:', { 
      active: active.id, 
      over: over?.id 
    });
    
    if (over && active.id !== over.id) {
      setLocalScripts((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        console.log('[CallScriptsManagerNew] USER MODAL - Moving from index', oldIndex, 'to', newIndex);
        
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // USER MODAL: Always save local order to localStorage (never to database)
        const orderMap: Record<string, number> = {};
        newItems.forEach((item, index) => {
          orderMap[item.id] = index;
        });
        localStorage.setItem('callScripts_local_order', JSON.stringify(orderMap));
        console.log('[CallScriptsManagerNew] USER MODAL - Saved personal order to localStorage:', orderMap);
        
        toast({
          title: "Scripts reordered",
          description: "Your personal call scripts order has been updated",
        });
        
        return newItems;
      });
    } else {
      console.log('[CallScriptsManagerNew] USER MODAL - No reorder needed - same position');
    }
  };

  // Reset local ordering - USER MODAL ONLY
  const resetLocalOrder = () => {
    localStorage.removeItem('callScripts_local_order');
    setLocalScripts([...callScripts].sort((a, b) => a.orderIndex - b.orderIndex));
    setIsDragMode(false);
    toast({
      title: "Order reset",
      description: "Your personal call scripts order has been reset to default",
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
    setSelectedGenre("");
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
      <DialogContent className="max-w-full max-h-full w-screen h-screen m-0 p-4">
        <DialogHeader className="pb-3 mb-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">Call Scripts</DialogTitle>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-500">
                {filteredScripts.length} of {localScripts.length} scripts
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Control Panel */}
        <div className="space-y-3">
          {/* Reordering Controls */}
          <div className="flex gap-2 items-center">
            <Button
              onClick={() => setIsDragMode(!isDragMode)}
              variant={isDragMode ? "default" : "outline"}
              size="sm"
              className="flex items-center gap-2"
            >
              <Shuffle className="h-4 w-4" />
              {isDragMode ? "Exit Reorder Mode" : (user?.role === 'admin' ? "Reorder Scripts (Global)" : "Reorder Scripts (Personal)")}
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
        <div className="flex-1 overflow-y-auto space-y-3"
             style={{ maxHeight: 'calc(100vh - 320px)' }}>
          {scriptsLoading ? (
            <div className="text-center py-8">
              <div className="animate-pulse flex justify-center">
                <div className="h-8 w-8 bg-blue-200 rounded-full animate-bounce"></div>
              </div>
              <p className="text-gray-500 mt-2">Loading scripts...</p>
            </div>
          ) : filteredScripts.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <FileText className="h-12 w-12 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No scripts found</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {searchTerm || selectedCategory || selectedGenre
                  ? "Try adjusting your search or filter criteria to find matching scripts"
                  : "No call scripts are available at the moment"}
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