import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, X, Edit2, Save, Trash2, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface TemplateConfigManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ConfigItem {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
}

// Component for managing a specific type
function ConfigTypeManager({ type }: { type: 'categories' | 'genres' | 'concerned_teams' }) {
  const [newItem, setNewItem] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get the correct API endpoint based on type
  const getApiEndpoint = () => {
    switch (type) {
      case 'categories': return '/api/template-categories';
      case 'genres': return '/api/template-genres';
      case 'concerned_teams': return '/api/concerned-teams';
      default: return '';
    }
  };

  // Fetch data from Supabase
  const { data: items = [], isLoading, refetch } = useQuery<ConfigItem[]>({
    queryKey: [getApiEndpoint()],
    staleTime: 0,
  });

  const addItem = async () => {
    if (!newItem.trim()) return;
    
    if (items.some(item => item.name.toLowerCase() === newItem.trim().toLowerCase())) {
      toast({
        title: "Error",
        description: "This item already exists",
        variant: "destructive",
      });
      return;
    }

    try {
      const endpoint = getApiEndpoint();
      await apiRequest('POST', endpoint, {
        name: newItem.trim(),
        description: `${getDisplayName()} item: ${newItem.trim()}`,
        isActive: true
      });

      setNewItem('');
      refetch();
      queryClient.invalidateQueries({ queryKey: [endpoint] });
      
      toast({
        title: "Success",
        description: `Added ${newItem} successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item",
        variant: "destructive",
      });
    }
  };

  const deleteItem = async (id: string, name: string) => {
    try {
      const endpoint = getApiEndpoint();
      await apiRequest('DELETE', `${endpoint}/${id}`, undefined);
      
      refetch();
      queryClient.invalidateQueries({ queryKey: [endpoint] });
      
      toast({
        title: "Success",
        description: `Deleted ${name} successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    }
  };

  const startEditing = (id: string, value: string) => {
    setEditingId(id);
    setEditingValue(value);
  };

  const saveEdit = async () => {
    if (!editingValue.trim() || !editingId) return;
    
    if (items.some(item => item.id !== editingId && item.name.toLowerCase() === editingValue.trim().toLowerCase())) {
      toast({
        title: "Error",
        description: "This item already exists",
        variant: "destructive",
      });
      return;
    }

    try {
      const endpoint = getApiEndpoint();
      await apiRequest('PATCH', `${endpoint}/${editingId}`, {
        name: editingValue.trim(),
        description: `${getDisplayName()} item: ${editingValue.trim()}`
      });

      setEditingId(null);
      setEditingValue('');
      refetch();
      queryClient.invalidateQueries({ queryKey: [endpoint] });
      
      toast({
        title: "Success",
        description: "Item updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update item",
        variant: "destructive",
      });
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingValue('');
  };



  const getDisplayName = () => {
    switch (type) {
      case 'categories': return 'Categories';
      case 'genres': return 'Genres';
      case 'concerned_teams': return 'Concerned Teams';
      default: return type;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings className="h-4 w-4" />
            {getDisplayName()}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add new item */}
          <div className="flex gap-2">
            <Input
              placeholder={`Add new ${type.slice(0, -1).replace('_', ' ')}`}
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addItem()}
              className="flex-1"
            />
            <Button onClick={addItem} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>

          {/* Current items */}
          <div className="flex flex-wrap gap-2">
            {isLoading ? (
              <div className="text-sm text-slate-500">Loading...</div>
            ) : items.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">
                No {type.replace('_', ' ')} configured. Add some above.
              </p>
            ) : (
              items.map((item) => (
                <div key={item.id} className="flex items-center gap-1">
                  {editingId === item.id ? (
                    <div className="flex items-center gap-1">
                      <Input
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit();
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        className="h-6 text-xs w-32"
                        autoFocus
                      />
                      <Button size="sm" variant="ghost" onClick={saveEdit} className="h-6 w-6 p-0">
                        <Save className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-6 w-6 p-0">
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Badge 
                      variant="secondary" 
                      className="text-xs pr-1 flex items-center gap-1 group hover:bg-slate-200"
                    >
                      <span>{item.name}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEditing(item.id, item.name)}
                        className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 hover:bg-slate-300"
                      >
                        <Edit2 className="h-2 w-2" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteItem(item.id, item.name)}
                        className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 hover:bg-red-200 text-red-600"
                      >
                        <X className="h-2 w-2" />
                      </Button>
                    </Badge>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="text-xs text-slate-500">
            <p><strong>Total:</strong> {items.length} {getDisplayName().toLowerCase()}</p>
            <p><strong>Note:</strong> Changes are saved automatically and will apply to new templates immediately.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Main dialog component
export default function TemplateConfigManager({ isOpen, onClose }: TemplateConfigManagerProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Template Configuration Manager</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="categories" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="genres">Genres</TabsTrigger>
            <TabsTrigger value="teams">Concerned Teams</TabsTrigger>
          </TabsList>
          
          <TabsContent value="categories">
            <ConfigTypeManager type="categories" />
          </TabsContent>
          
          <TabsContent value="genres">
            <ConfigTypeManager type="genres" />
          </TabsContent>
          
          <TabsContent value="teams">
            <ConfigTypeManager type="concerned_teams" />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}