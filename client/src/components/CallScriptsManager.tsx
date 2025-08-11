import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Copy, Search, Filter, X, Phone, FileText } from "lucide-react";
import type { CallScript, TemplateCategory, TemplateGenre } from "@shared/schema";

interface CallScriptsManagerProps {
  onClose: () => void;
}

// Mock data for Call Scripts until API is working
const mockCallScripts: CallScript[] = [
  {
    id: "1",
    name: "Welcome Greeting",
    content: "Hello! Thank you for calling our customer service. My name is [AGENT_NAME]. How can I assist you today?",
    category: "greeting",
    genre: "standard",
    isActive: true,
    orderIndex: 1,
    createdBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    supabaseId: null,
    lastSyncedAt: null,
  },
  {
    id: "2", 
    name: "Order Status Inquiry",
    content: "I'd be happy to help you check your order status. Could you please provide me with your order number or email address?",
    category: "order",
    genre: "inquiry",
    isActive: true,
    orderIndex: 2,
    createdBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    supabaseId: null,
    lastSyncedAt: null,
  },
  {
    id: "3",
    name: "Refund Process",
    content: "I understand you'd like to process a refund. Let me check your order details and guide you through the process. This typically takes 3-5 business days.",
    category: "refund",
    genre: "process",
    isActive: true,
    orderIndex: 3,
    createdBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    supabaseId: null,
    lastSyncedAt: null,
  },
  {
    id: "4",
    name: "Technical Support",
    content: "I'm here to help with any technical issues you're experiencing. Can you describe the problem you're facing?",
    category: "support",
    genre: "technical",
    isActive: true,
    orderIndex: 4,
    createdBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    supabaseId: null,
    lastSyncedAt: null,
  }
];

// Mock categories
const mockCategories: TemplateCategory[] = [
  { id: "greeting", name: "Greeting", type: "live_reply", isActive: true, orderIndex: 1, createdAt: new Date(), updatedAt: new Date() },
  { id: "order", name: "Order Management", type: "live_reply", isActive: true, orderIndex: 2, createdAt: new Date(), updatedAt: new Date() },
  { id: "refund", name: "Refunds", type: "live_reply", isActive: true, orderIndex: 3, createdAt: new Date(), updatedAt: new Date() },
  { id: "support", name: "Technical Support", type: "live_reply", isActive: true, orderIndex: 4, createdAt: new Date(), updatedAt: new Date() }
];

// Mock genres  
const mockGenres: TemplateGenre[] = [
  { id: "standard", name: "Standard", isActive: true, orderIndex: 1, createdAt: new Date(), updatedAt: new Date() },
  { id: "inquiry", name: "Inquiry", isActive: true, orderIndex: 2, createdAt: new Date(), updatedAt: new Date() },
  { id: "process", name: "Process", isActive: true, orderIndex: 3, createdAt: new Date(), updatedAt: new Date() },
  { id: "technical", name: "Technical", isActive: true, orderIndex: 4, createdAt: new Date(), updatedAt: new Date() }
];

export function CallScriptsManager({ onClose }: CallScriptsManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedGenre, setSelectedGenre] = useState<string>("");
  const { toast } = useToast();

  // Use mock data for now - API endpoints need to be fixed
  const callScripts = mockCallScripts;
  const categories = mockCategories;
  const genres = mockGenres;

  const handleCopyScript = (content: string, name: string) => {
    try {
      navigator.clipboard.writeText(content);
      toast({
        title: "Copied!",
        description: `"${name}" script copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const clearFilters = () => {
    setSelectedCategory("");
    setSelectedGenre("");
    setSearchTerm("");
  };

  // Filter scripts based on search term, category, and genre
  const filteredScripts = callScripts.filter(script => {
    const matchesSearch = script.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         script.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || script.category === selectedCategory;
    const matchesGenre = !selectedGenre || script.genre === selectedGenre;
    
    return matchesSearch && matchesCategory && matchesGenre && script.isActive;
  });

  const getCategoryName = (categoryId: string | null | undefined) => {
    if (!categoryId) return "No Category";
    const category = categories.find(c => c.id === categoryId);
    return category?.name || categoryId;
  };

  const getGenreName = (genreId: string | null | undefined) => {
    if (!genreId) return "No Genre";
    const genre = genres.find(g => g.id === genreId);
    return genre?.name || genreId;
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Call Scripts Manager
          </DialogTitle>
        </DialogHeader>

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
                data-testid="input-search-scripts"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48" data-testid="select-category">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedGenre} onValueChange={setSelectedGenre}>
              <SelectTrigger className="w-48" data-testid="select-genre">
                <SelectValue placeholder="Filter by genre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genres</SelectItem>
                {genres.map((genre) => (
                  <SelectItem key={genre.id} value={genre.id}>
                    {genre.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(searchTerm || selectedCategory || selectedGenre) && (
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

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Filter className="h-4 w-4" />
            <span>Showing {filteredScripts.length} of {callScripts.length} scripts</span>
          </div>
        </div>

        {/* Scripts Grid */}
        <div className="overflow-y-auto max-h-[60vh] space-y-4">
          {filteredScripts.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No scripts found</h3>
              <p className="text-gray-500">
                {searchTerm || selectedCategory || selectedGenre
                  ? "Try adjusting your search criteria"
                  : "No call scripts are available"}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredScripts.map((script) => (
                <Card key={script.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg font-medium mb-2">
                          {script.name}
                        </CardTitle>
                        <div className="flex gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {getCategoryName(script.category)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {getGenreName(script.genre)}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyScript(script.content, script.name)}
                        className="flex items-center gap-2 shrink-0"
                        data-testid={`button-copy-${script.id}`}
                      >
                        <Copy className="h-4 w-4" />
                        Copy
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {script.content}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-500">
            Use these scripts as templates for customer calls
          </div>
          <Button onClick={onClose} variant="outline" data-testid="button-close">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}