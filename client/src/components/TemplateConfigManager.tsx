import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, X, Edit2, Save, Trash2, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TemplateConfigManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

// Default values for each type
const DEFAULT_VALUES = {
  categories: ['Order Issues', 'Delivery Problems', 'Payment Issues', 'Returns & Refunds', 'Product Inquiry', 'General Support', 'Technical Support', 'Escalation'],
  genres: ['Urgent', 'Standard', 'Follow-up', 'Escalation', 'Resolution', 'Greeting', 'CSAT', 'Warning Abusive Language', 'Apology', 'Thank You', 'Farewell', 'Confirmation', 'Technical Support', 'Holiday/Special Occasion'],
  concerned_teams: ['Finance', 'IT Support', 'Fulfillment', 'Customer Service', 'Order Management', 'Quality Assurance', 'Management']
};

// Component for managing a specific type
function ConfigTypeManager({ type }: { type: 'categories' | 'genres' | 'concerned_teams' }) {
  const [items, setItems] = useState<string[]>([]);
  const [newItem, setNewItem] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    // Load from localStorage or use defaults
    const storageKey = `template_${type}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch {
        setItems(DEFAULT_VALUES[type]);
      }
    } else {
      setItems(DEFAULT_VALUES[type]);
    }
  }, [type]);

  const saveToStorage = (newItems: string[]) => {
    const storageKey = `template_${type}`;
    localStorage.setItem(storageKey, JSON.stringify(newItems));
    setItems(newItems);
  };

  const addItem = () => {
    if (!newItem.trim()) return;
    
    if (items.includes(newItem.trim())) {
      toast({
        title: "Error",
        description: "This item already exists",
        variant: "destructive",
      });
      return;
    }

    const newItems = [...items, newItem.trim()];
    saveToStorage(newItems);
    setNewItem('');
    
    toast({
      title: "Success",
      description: `Added ${newItem} successfully`,
    });
  };

  const deleteItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    saveToStorage(newItems);
    
    toast({
      title: "Success",
      description: "Item deleted successfully",
    });
  };

  const startEditing = (index: number, value: string) => {
    setEditingIndex(index);
    setEditingValue(value);
  };

  const saveEdit = () => {
    if (!editingValue.trim() || editingIndex === null) return;
    
    if (items.includes(editingValue.trim()) && items[editingIndex] !== editingValue.trim()) {
      toast({
        title: "Error",
        description: "This item already exists",
        variant: "destructive",
      });
      return;
    }

    const newItems = [...items];
    newItems[editingIndex] = editingValue.trim();
    saveToStorage(newItems);
    setEditingIndex(null);
    setEditingValue('');
    
    toast({
      title: "Success",
      description: "Item updated successfully",
    });
  };

  const cancelEdit = () => {
    setEditingIndex(null);
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
            {items.map((item, index) => (
              <div key={index} className="flex items-center gap-1">
                {editingIndex === index ? (
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
                    <span>{item}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEditing(index, item)}
                      className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 hover:bg-slate-300"
                    >
                      <Edit2 className="h-2 w-2" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteItem(index)}
                      className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 hover:bg-red-200 text-red-600"
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </Badge>
                )}
              </div>
            ))}
          </div>
          
          {items.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-4">
              No {type.replace('_', ' ')} configured. Add some above.
            </p>
          )}

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