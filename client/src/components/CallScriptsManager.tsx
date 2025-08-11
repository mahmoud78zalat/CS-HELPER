import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Copy, Search, X, Phone, FileText, Plus, Edit, Trash2 } from "lucide-react";
import type { CallScript } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { CallScriptModal } from "./CallScriptModal";

interface CallScriptsManagerProps {
  onClose: () => void;
}

export function CallScriptsManager({ onClose }: CallScriptsManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedGenre, setSelectedGenre] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [editingScript, setEditingScript] = useState<CallScript | null>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'admin';

  // Fetch call scripts
  const { data: callScripts = [], isLoading: scriptsLoading } = useQuery({
    queryKey: ['/api/call-scripts'],
    enabled: true
  });

  // Fetch categories and genres from existing endpoints
  const { data: categoriesData = [] } = useQuery({
    queryKey: ['/api/template-categories'],
    enabled: true
  });

  const { data: genresData = [] } = useQuery({
    queryKey: ['/api/template-genres'],
    enabled: true
  });

  // Extract unique categories and genres for filter dropdowns
  const categories = Array.from(new Set(callScripts.map((script: CallScript) => script.category).filter(Boolean)));
  const genres = Array.from(new Set(callScripts.map((script: CallScript) => script.genre).filter(Boolean)));



  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/call-scripts/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete script');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/call-scripts'] });
      toast({ title: "Success", description: "Call script deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete call script", variant: "destructive" });
    }
  });

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

  const handleEdit = (script: CallScript) => {
    setEditingScript(script);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingScript(null);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingScript(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this call script?')) {
      deleteMutation.mutate(id);
    }
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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Call Scripts Manager
            </DialogTitle>
            {isAdmin && (
              <Button
                onClick={handleAdd}
                className="flex items-center gap-2"
                data-testid="button-add-script"
              >
                <Plus className="h-4 w-4" />
                Add Script
              </Button>
            )}
          </div>
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

            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48" data-testid="select-filter-category">
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
                <SelectTrigger className="w-48" data-testid="select-filter-genre">
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

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FileText className="h-4 w-4" />
            <span>Showing {filteredScripts.length} of {callScripts.length} scripts</span>
          </div>
        </div>

        {/* Scripts Grid */}
        <div className="overflow-y-auto max-h-[50vh] space-y-4">
          {scriptsLoading ? (
            <div className="text-center py-8">Loading scripts...</div>
          ) : filteredScripts.length === 0 ? (
            <div className="text-center py-8">
              <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No scripts found</h3>
              <p className="text-gray-500">
                {searchTerm || selectedCategory || selectedGenre
                  ? "Try adjusting your search criteria"
                  : "No call scripts are available"}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredScripts.map((script: CallScript) => (
                <Card key={script.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg font-medium mb-2 flex items-center gap-2">
                          <FileText className="h-5 w-5 text-blue-600" />
                          {script.name}
                        </CardTitle>
                        <div className="flex gap-2">
                          {script.category && (
                            <Badge variant="secondary" className="text-xs">
                              {script.category}
                            </Badge>
                          )}
                          {script.genre && (
                            <Badge variant="outline" className="text-xs">
                              {script.genre}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyScript(script.content, script.name)}
                          className="flex items-center gap-1"
                          data-testid={`button-copy-${script.id}`}
                        >
                          <Copy className="h-4 w-4" />
                          Copy
                        </Button>
                        {isAdmin && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(script)}
                              className="flex items-center gap-1"
                              data-testid={`button-edit-${script.id}`}
                            >
                              <Edit className="h-4 w-4" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(script.id)}
                              className="flex items-center gap-1 text-red-600 hover:text-red-700"
                              data-testid={`button-delete-${script.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
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
            {isAdmin ? 'Manage call scripts for your team' : 'Quick access to predefined call scripts for customer support'}
          </div>
          <Button onClick={onClose} variant="outline" data-testid="button-close">
            Close
          </Button>
        </div>
      </DialogContent>

      {/* Call Script Modal */}
      <CallScriptModal
        isOpen={showModal}
        onClose={handleModalClose}
        editingScript={editingScript}
      />
    </Dialog>
  );
}