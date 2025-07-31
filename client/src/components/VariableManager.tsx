import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, Edit2, Save, Trash2, Variable, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import DragDropVariableManager from "./DragDropVariableManager";

interface TemplateVariable {
  id: string;
  name: string;
  description: string;
  category: string;
  example: string;
  defaultValue?: string;
  isSystem: boolean;
  order?: number;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface TemplateVariableCategory {
  id: string;
  name: string;
  displayName: string;
  color: string;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CustomVariable {
  name: string;
  description: string;
  category: string;
  example: string;
  defaultValue: string;
}

const DEFAULT_SYSTEM_VARIABLES: CustomVariable[] = [
  // General Support Variables
  { name: 'customer_name', description: 'Customer full name', category: 'General Support', example: 'John Smith', defaultValue: '' },
  { name: 'customer_phone', description: 'Customer phone number', category: 'General Support', example: '+971501234567', defaultValue: '' },
  { name: 'customer_country', description: 'Customer country', category: 'General Support', example: '🇦🇪 United Arab Emirates', defaultValue: '' },
  { name: 'gender', description: 'Customer gender', category: 'General Support', example: 'Male/Female', defaultValue: '' },
  
  // Order Issues Variables
  { name: 'order_id', description: 'Order identifier', category: 'Order Issues', example: 'ORD-12345', defaultValue: '' },
  { name: 'awb_number', description: 'AWB tracking number', category: 'Order Issues', example: 'AWB-67890', defaultValue: '' },
  { name: 'item_name', description: 'Product or item name', category: 'Product Inquiry', example: 'Wireless Headphones', defaultValue: '' },
  { name: 'delivery_date', description: 'Expected delivery date', category: 'Delivery Problems', example: '2025-01-25', defaultValue: '' },
  
  // Technical Support Variables  
  { name: 'agent_name', description: 'Agent full name', category: 'Technical Support', example: 'Sarah Johnson', defaultValue: '' },
  { name: 'agentarabicname', description: 'Agent name in Arabic', category: 'Technical Support', example: 'سارة جونسون', defaultValue: '' },
  { name: 'agentarabiclastname', description: 'Agent last name in Arabic', category: 'Technical Support', example: 'جونسون', defaultValue: '' },
  
  // General Support Variables
  { name: 'current_date', description: 'Current date', category: 'General Support', example: new Date().toLocaleDateString(), defaultValue: new Date().toLocaleDateString() },
  { name: 'current_time', description: 'Current time', category: 'General Support', example: new Date().toLocaleTimeString(), defaultValue: new Date().toLocaleTimeString() },
  { name: 'waiting_time', description: 'Customer waiting time', category: 'General Support', example: '10 minutes', defaultValue: '' },
  
  // Returns & Refunds Variables
  { name: 'reason', description: 'Specific reason for contact or issue', category: 'Returns & Refunds', example: 'Package damaged during delivery', defaultValue: '' },
  { name: 'resolution', description: 'Proposed solution or resolution', category: 'Escalation', example: 'Full refund processed', defaultValue: '' },
  { name: 'timeframe', description: 'Expected timeframe for resolution', category: 'General Support', example: '2-3 business days', defaultValue: '2-3 business days' }
];

interface VariableManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VariableManager({ isOpen, onClose }: VariableManagerProps) {
  const [availableCategories, setAvailableCategories] = useState<TemplateVariableCategory[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    example: '',
    defaultValue: '',
    isSystem: false
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch template variables
  const { data: variables = [], isLoading: variablesLoading, error: variablesError } = useQuery({
    queryKey: ['/api/template-variables'],
    enabled: isOpen,
  });

  // Debug logging for variables
  useEffect(() => {
    if (isOpen) {
      console.log('[VariableManager] Modal opened - fetching variables');
      console.log('[VariableManager] Variables loading:', variablesLoading);
      console.log('[VariableManager] Variables data:', variables);
      console.log('[VariableManager] Variables error:', variablesError);
    }
  }, [isOpen, variablesLoading, variables, variablesError]);

  // Fetch existing template categories from the project instead of template variable categories
  const { data: templateCategories = [], isLoading: templateCategoriesLoading } = useQuery({
    queryKey: ['/api/template-categories'],
    enabled: isOpen,
  });

  // Fetch email categories as well
  const { data: emailCategories = [], isLoading: emailCategoriesLoading } = useQuery({
    queryKey: ['/api/email-categories'],
    enabled: isOpen,
  });

  // Create variable mutation using bypass route
  const createVariableMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/create-variable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create variable');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/template-variables'] });
      toast({ title: "Success", description: "Variable created successfully" });
      resetForm();
      setIsAdding(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  // Update variable mutation
  const updateVariableMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/template-variables/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update variable');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/template-variables'] });
      toast({ title: "Success", description: "Variable updated successfully" });
      resetForm();
      setEditingId(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  // Delete variable mutation
  const deleteVariableMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/template-variables/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete variable');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/template-variables'] });
      toast({ title: "Success", description: "Variable deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  // Combine all available categories from template and email categories
  useEffect(() => {
    if (!isOpen) return; // Don't process if modal is closed
    
    const combinedCategories: TemplateVariableCategory[] = [];
    
    // Add template categories
    if (templateCategories && Array.isArray(templateCategories)) {
      templateCategories.forEach((cat: any) => {
        combinedCategories.push({
          id: cat.id,
          name: cat.name,
          displayName: cat.name,
          color: cat.color || '#3b82f6',
          isActive: cat.isActive || true,
          createdBy: cat.createdBy || '',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });
    }
    
    // Add email categories
    if (emailCategories && Array.isArray(emailCategories)) {
      emailCategories.forEach((cat: any) => {
        if (!combinedCategories.find(c => c.name === cat.name)) {
          combinedCategories.push({
            id: cat.id,
            name: cat.name,
            displayName: cat.name,
            color: cat.color || '#3b82f6',
            isActive: cat.isActive || true,
            createdBy: cat.createdBy || '',
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      });
    }
    
    // Add some default categories if none exist
    if (combinedCategories.length === 0) {
      combinedCategories.push(
        { id: '1', name: 'General Support', displayName: 'General Support', color: '#3b82f6', isActive: true, createdBy: '', createdAt: new Date(), updatedAt: new Date() },
        { id: '2', name: 'Order Issues', displayName: 'Order Issues', color: '#ef4444', isActive: true, createdBy: '', createdAt: new Date(), updatedAt: new Date() },
        { id: '3', name: 'Technical Support', displayName: 'Technical Support', color: '#10b981', isActive: true, createdBy: '', createdAt: new Date(), updatedAt: new Date() }
      );
    }
    
    // Only update if categories actually changed
    setAvailableCategories(prev => {
      if (JSON.stringify(prev) !== JSON.stringify(combinedCategories)) {
        return combinedCategories;
      }
      return prev;
    });
  }, [templateCategories, emailCategories, isOpen]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: availableCategories.length > 0 ? availableCategories[0]?.name || '' : '',
      example: '',
      defaultValue: '',
      isSystem: false
    });
  };

  const addVariable = () => {
    if (!formData.name.trim() || !formData.description.trim()) {
      toast({
        title: "Error",
        description: "Name and description are required",
        variant: "destructive",
      });
      return;
    }

    const variableName = formData.name.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    
    if (variables && Array.isArray(variables) && variables.some((v: any) => v.name === variableName)) {
      toast({
        title: "Error",
        description: "A variable with this name already exists",
        variant: "destructive",
      });
      return;
    }

    createVariableMutation.mutate({
      ...formData,
      name: variableName
    });
  };

  const updateVariable = () => {
    if (!formData.name.trim() || !formData.description.trim() || !editingId) {
      toast({
        title: "Error",
        description: "Name and description are required",
        variant: "destructive",
      });
      return;
    }

    const variableName = formData.name.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    
    if (variables && Array.isArray(variables) && variables.some((v: any) => v.name === variableName && v.id !== editingId)) {
      toast({
        title: "Error",
        description: "A variable with this name already exists",
        variant: "destructive",
      });
      return;
    }

    updateVariableMutation.mutate({
      id: editingId,
      data: {
        ...formData,
        name: variableName
      }
    });
  };

  const deleteVariable = (id: string) => {
    if (confirm('Are you sure you want to delete this variable?')) {
      deleteVariableMutation.mutate(id);
    }
  };

  const startEditing = (variable: TemplateVariable) => {
    setFormData({
      name: variable.name,
      description: variable.description,
      category: variable.category,
      example: variable.example,
      defaultValue: variable.defaultValue || '',
      isSystem: variable.isSystem
    });
    setEditingId(variable.id);
    setIsAdding(false);
  };

  const cancelEdit = () => {
    resetForm();
    setEditingId(null);
    setIsAdding(false);
  };



  const getCategoryColor = (categoryName: string) => {
    const category = availableCategories.find(c => c.name === categoryName);
    return category?.color || 'bg-gray-100 text-gray-800';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Variable className="h-5 w-5" />
            Universal Variable Manager
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Loading States */}
          {(variablesLoading || templateCategoriesLoading || emailCategoriesLoading) && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading variables...
            </div>
          )}

          {/* Add/Edit Form */}
          {(isAdding || editingId !== null) && !variablesLoading && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  {editingId !== null ? 'Edit Variable' : 'Add New Variable'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Variable Name</label>
                    <Input
                      placeholder="MY_VARIABLE_NAME"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Will be converted to uppercase with underscores
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCategories.map((category) => (
                          <SelectItem key={category.id} value={category.name}>
                            {category.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    placeholder="Describe what this variable represents"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Example Value</label>
                    <Input
                      placeholder="Example of what this variable might contain"
                      value={formData.example}
                      onChange={(e) => setFormData(prev => ({ ...prev, example: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Default Value (Optional)</label>
                    <Input
                      placeholder="Default value when not set"
                      value={formData.defaultValue || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, defaultValue: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={editingId !== null ? updateVariable : addVariable}
                    size="sm"
                    disabled={createVariableMutation.isPending || updateVariableMutation.isPending}
                  >
                    {(createVariableMutation.isPending || updateVariableMutation.isPending) ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-1" />
                    )}
                    {editingId !== null ? 'Update' : 'Add'} Variable
                  </Button>
                  <Button onClick={cancelEdit} variant="outline" size="sm">
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          {!isAdding && editingId === null && !variablesLoading && (
            <div className="flex gap-2">
              <Button onClick={() => setIsAdding(true)} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Custom Variable
              </Button>
            </div>
          )}

          {/* Variables List with Drag-and-Drop */}
          {!variablesLoading && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Template Variables (Drag to Reorder)</h3>
              {(variables as TemplateVariable[] || []).length > 0 ? (
                <DragDropVariableManager
                  variables={variables as TemplateVariable[]}
                  onEdit={startEditing}
                  onDelete={(variable) => deleteVariable(variable.id)}
                />
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-sm text-slate-500">
                      No template variables found. Add some above.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {!variablesLoading && (
            <div className="text-xs text-slate-500">
              <p><strong>Total:</strong> {(variables as TemplateVariable[] || []).length} template variables</p>
              <p><strong>Usage:</strong> Use variables in templates like {`{VARIABLE_NAME}`} or {`[VARIABLE_NAME]`}</p>
              <p><strong>Note:</strong> Changes are saved directly to the database and apply immediately</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}