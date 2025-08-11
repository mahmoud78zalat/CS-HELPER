import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Phone, Copy, X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  type CallScript,
  type TemplateCategory,
  type TemplateGenre,
} from "@shared/schema";

interface CallScriptsManagerProps {
  onClose: () => void;
}

export function CallScriptsManager({ onClose }: CallScriptsManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedGenre, setSelectedGenre] = useState<string>("");

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

  const handleCopyScript = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied!",
      description: "Call script copied to clipboard",
    });
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

  // Filter scripts based on search term, category, and genre
  const filteredScripts = callScripts.filter(script => {
    const matchesSearch = script.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         script.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || script.categoryId === selectedCategory;
    const matchesGenre = !selectedGenre || script.genreId === selectedGenre;
    
    return matchesSearch && matchesCategory && matchesGenre;
  });

  const availableGenres = genres.filter(genre => 
    !selectedCategory || genre.categoryId === selectedCategory
  );

  const clearFilters = () => {
    setSelectedCategory("");
    setSelectedGenre("");
    setSearchTerm("");
  };

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
              Call Scripts
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              View and copy call scripts organized by categories and genres
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={onClose} className="shrink-0">
          <X className="h-4 w-4 mr-2" />
          Close
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
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
          <Button 
            variant="outline" 
            onClick={clearFilters}
            className="shrink-0"
          >
            <Filter className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Filter by Category</label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Filter by Genre</label>
            <Select 
              value={selectedGenre} 
              onValueChange={setSelectedGenre}
              disabled={!selectedCategory}
            >
              <SelectTrigger>
                <SelectValue placeholder="All genres" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All genres</SelectItem>
                {availableGenres.map((genre) => (
                  <SelectItem key={genre.id} value={genre.id}>
                    {genre.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Scripts List */}
      <div className="space-y-4">
        {scriptsLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Loading call scripts...</p>
          </div>
        ) : filteredScripts.length === 0 ? (
          <Card className="p-8 text-center">
            <Phone className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No call scripts found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || selectedCategory || selectedGenre 
                ? "No scripts match your search criteria" 
                : "No call scripts are available"
              }
            </p>
          </Card>
        ) : (
          filteredScripts.map((script) => (
            <Card key={script.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg text-gray-900 dark:text-gray-100">
                      {script.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {getCategoryName(script.categoryId)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {getGenreName(script.genreId)}
                      </Badge>
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyScript(script.content)}
                    className="shrink-0 ml-4"
                  >
                    <Copy className="h-3 w-3 mr-2" />
                    Copy
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-mono">
                    {script.content}
                  </pre>
                </div>
                {script.createdAt && (
                  <p className="text-xs text-gray-400 mt-3">
                    Created: {new Date(script.createdAt).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export default CallScriptsManager;