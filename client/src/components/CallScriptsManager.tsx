import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Search, X, Phone, FileText, ChevronDown, ChevronRight, GripVertical, Copy, RotateCcw } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CallScript } from "@shared/schema";

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
  const allGenres = categoriesData ? categoriesData.flatMap((cat: any) => 
    cat.genres?.map((genre: any) => ({ ...genre, categoryName: cat.name, categoryId: cat.id })) || []
  ) : [];

  // Extract unique categories and genres for filter dropdowns
  const categories = Array.from(new Set(callScripts.map((script: CallScript) => script.category).filter(Boolean)));
  const genres = Array.from(new Set(callScripts.map((script: CallScript) => script.genre).filter(Boolean)));

  // Get color for category badge - using actual colors from admin panel
  const getCategoryColor = (category: string): string => {
    // Find the category in the actual data from admin panel
    if (Array.isArray(categoriesData)) {
      const foundCategory = categoriesData.find((cat: any) => cat.name === category);
      if (foundCategory && foundCategory.color) {
        return foundCategory.color;
      }
    }
    
    // Fallback colors for common categories
    const fallbackColors: Record<string, string> = {
      'General': '#3B82F6',
      'Support': '#10B981',
      'Sales': '#F59E0B',
      'Technical': '#8B5CF6',
      'Billing': '#EF4444',
      'Complaint': '#F97316'
    };
    return fallbackColors[category] || '#6B7280';
  };

  // Get color for genre badge - using actual colors from admin panel
  const getGenreColor = (genre: string): string => {
    // Find the genre in the actual data from admin panel
    if (Array.isArray(categoriesData)) {
      for (const category of categoriesData) {
        if (category.genres && Array.isArray(category.genres)) {
          const foundGenre = category.genres.find((g: any) => g.name === genre);
          if (foundGenre && foundGenre.color) {
            return foundGenre.color;
          }
        }
      }
    }
    
    // Fallback colors for common genres
    const fallbackColors: Record<string, string> = {
      'Greeting': '#10B981',
      'Closure': '#EF4444',
      'Information': '#3B82F6',
      'Resolution': '#8B5CF6',
      'Escalation': '#F97316',
      'Follow-up': '#14B8A6'
    };
    return fallbackColors[genre] || '#6B7280';
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



  const clearFilters = () => {
    setSelectedCategory("");
    setSelectedGenre("");
    setSearchTerm("");
  };

  // Filter scripts
  const filteredScripts = callScripts.filter((script: CallScript) => {
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
                <p className="text-sm text-gray-500">Search and manage your call scripts</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {filteredScripts.length} of {callScripts.length} scripts
            </div>
          </div>
        </DialogHeader>

        {/* Search and Filter Controls */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
          <div className="flex gap-3 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search scripts by name or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white dark:bg-slate-700"
                data-testid="input-search-scripts"
              />
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-44 bg-white dark:bg-slate-700" data-testid="select-filter-category">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedGenre} onValueChange={setSelectedGenre}>
              <SelectTrigger className="w-40 bg-white dark:bg-slate-700" data-testid="select-filter-genre">
                <SelectValue placeholder="Filter by genre" />
              </SelectTrigger>
              <SelectContent>
                {genres.map((genre) => (
                  <SelectItem key={genre} value={genre}>
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

        {/* Scripts Grid */}
        <div className="flex-1 overflow-y-auto"
             style={{ maxHeight: 'calc(100vh - 280px)' }}>
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
                <Phone className="h-12 w-12 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No scripts found</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {searchTerm || selectedCategory || selectedGenre
                  ? "Try adjusting your search criteria to find matching scripts"
                  : "No call scripts are available at the moment"}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredScripts.map((script: CallScript, index: number) => {
                const isExpanded = expandedScripts.has(script.id);
                
                // Generate gradient colors for each script
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
                const gradientClass = gradients[index % gradients.length];
                
                return (
                  <Card key={script.id} className="overflow-hidden group hover:shadow-2xl transition-all duration-300 border-2 hover:border-blue-200 hover:scale-[1.02]">
                    {/* Gradient Header Bar */}
                    <div className={`h-2 bg-gradient-to-r ${gradientClass}`}></div>
                    
                    <CardHeader 
                      className="pb-4 cursor-pointer relative"
                      onClick={() => toggleScriptExpansion(script.id)}
                    >
                      {/* Background pattern */}
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      <div className="relative flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl font-bold mb-3 flex items-center gap-3">
                            <div className={`p-2 rounded-xl bg-gradient-to-r ${gradientClass} text-white shadow-lg`}>
                              <FileText className="h-5 w-5" />
                            </div>
                            <span className="text-gray-800 dark:text-white group-hover:text-blue-600 transition-colors">
                              {script.name}
                            </span>
                            <div className="ml-auto">
                              {isExpanded ? (
                                <ChevronDown className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                              ) : (
                                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                              )}
                            </div>
                          </CardTitle>
                          
                          <div className="flex gap-3 items-center">
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
                                📋 {script.category}
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
                                🎯 {script.genre}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    {isExpanded && (
                      <CardContent className="pt-0 pb-6">
                        <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-800 dark:to-slate-700 rounded-xl p-6 border border-slate-200 dark:border-slate-600 shadow-inner">
                          <div className="flex items-center gap-2 mb-4">
                            <div className={`w-1 h-6 bg-gradient-to-b ${gradientClass} rounded-full`}></div>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Script Content</span>
                          </div>
                          <div className="bg-white dark:bg-slate-900 rounded-lg p-4 shadow-sm border border-slate-100 dark:border-slate-700">
                            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed font-medium">
                              {script.content}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-500">
            Quick access to predefined call scripts for customer support
          </div>
          <Button onClick={onClose} variant="outline" data-testid="button-close">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}