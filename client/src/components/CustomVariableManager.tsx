import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, Edit2, Save, Trash2, Variable } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CustomVariable {
  name: string;
  description: string;
  category: 'customer' | 'order' | 'system' | 'time' | 'custom';
  example: string;
  defaultValue?: string;
}

const DEFAULT_CUSTOM_VARIABLES: CustomVariable[] = [
  { 
    name: 'REASON', 
    description: 'Specific reason for contact or issue', 
    category: 'custom', 
    example: 'Package damaged during delivery',
    defaultValue: ''
  },
  { 
    name: 'RESOLUTION', 
    description: 'Proposed solution or resolution', 
    category: 'custom', 
    example: 'Full refund processed',
    defaultValue: ''
  },
  { 
    name: 'TIMEFRAME', 
    description: 'Expected timeframe for resolution', 
    category: 'custom', 
    example: '2-3 business days',
    defaultValue: '2-3 business days'
  }
];

interface CustomVariableManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CustomVariableManager({ isOpen, onClose }: CustomVariableManagerProps) {
  const [variables, setVariables] = useState<CustomVariable[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<CustomVariable>({
    name: '',
    description: '',
    category: 'custom',
    example: '',
    defaultValue: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    // Load from localStorage or use defaults
    const saved = localStorage.getItem('custom_template_variables');
    if (saved) {
      try {
        setVariables(JSON.parse(saved));
      } catch {
        setVariables(DEFAULT_CUSTOM_VARIABLES);
      }
    } else {
      setVariables(DEFAULT_CUSTOM_VARIABLES);
    }
  }, []);

  const saveToStorage = (newVariables: CustomVariable[]) => {
    localStorage.setItem('custom_template_variables', JSON.stringify(newVariables));
    setVariables(newVariables);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'custom',
      example: '',
      defaultValue: ''
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
    
    if (variables.some(v => v.name === variableName)) {
      toast({
        title: "Error",
        description: "A variable with this name already exists",
        variant: "destructive",
      });
      return;
    }

    const newVariable = {
      ...formData,
      name: variableName
    };

    const newVariables = [...variables, newVariable];
    saveToStorage(newVariables);
    resetForm();
    setIsAdding(false);
    
    toast({
      title: "Success",
      description: `Added variable ${variableName}`,
    });
  };

  const updateVariable = () => {
    if (!formData.name.trim() || !formData.description.trim() || editingIndex === null) {
      toast({
        title: "Error",
        description: "Name and description are required",
        variant: "destructive",
      });
      return;
    }

    const variableName = formData.name.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    
    if (variables.some((v, i) => v.name === variableName && i !== editingIndex)) {
      toast({
        title: "Error",
        description: "A variable with this name already exists",
        variant: "destructive",
      });
      return;
    }

    const newVariables = [...variables];
    newVariables[editingIndex] = {
      ...formData,
      name: variableName
    };
    
    saveToStorage(newVariables);
    resetForm();
    setEditingIndex(null);
    
    toast({
      title: "Success",
      description: `Updated variable ${variableName}`,
    });
  };

  const deleteVariable = (index: number) => {
    if (confirm('Are you sure you want to delete this variable?')) {
      const newVariables = variables.filter((_, i) => i !== index);
      saveToStorage(newVariables);
      
      toast({
        title: "Success",
        description: "Variable deleted successfully",
      });
    }
  };

  const startEditing = (index: number) => {
    setFormData(variables[index]);
    setEditingIndex(index);
    setIsAdding(false);
  };

  const cancelEdit = () => {
    resetForm();
    setEditingIndex(null);
    setIsAdding(false);
  };

  const resetToDefaults = () => {
    if (confirm('Reset custom variables to defaults? This will remove all custom variables.')) {
      saveToStorage(DEFAULT_CUSTOM_VARIABLES);
      cancelEdit();
      toast({
        title: "Success",
        description: "Reset variables to defaults",
      });
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      customer: 'bg-blue-100 text-blue-800',
      order: 'bg-green-100 text-green-800',
      system: 'bg-purple-100 text-purple-800',
      time: 'bg-orange-100 text-orange-800',
      custom: 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || colors.custom;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Variable className="h-5 w-5" />
            Custom Variable Manager
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Add/Edit Form */}
          {(isAdding || editingIndex !== null) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  {editingIndex !== null ? 'Edit Variable' : 'Add New Variable'}
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
                    <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as any }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="order">Order</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                        <SelectItem value="time">Time</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
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
                    onClick={editingIndex !== null ? updateVariable : addVariable}
                    size="sm"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    {editingIndex !== null ? 'Update' : 'Add'} Variable
                  </Button>
                  <Button onClick={cancelEdit} variant="outline" size="sm">
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          {!isAdding && editingIndex === null && (
            <div className="flex gap-2">
              <Button onClick={() => setIsAdding(true)} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Custom Variable
              </Button>
              <Button onClick={resetToDefaults} variant="outline" size="sm">
                Reset to Defaults
              </Button>
            </div>
          )}

          {/* Variables List */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                {variables.map((variable, index) => (
                  <div key={index} className="flex items-start justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="bg-slate-100 px-2 py-1 rounded text-sm font-mono">
                          {`{${variable.name}}`}
                        </code>
                        <Badge variant="outline" className={`text-xs ${getCategoryColor(variable.category)}`}>
                          {variable.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-700 mb-1">{variable.description}</p>
                      <div className="text-xs text-slate-500">
                        <span><strong>Example:</strong> {variable.example}</span>
                        {variable.defaultValue && (
                          <span className="ml-4"><strong>Default:</strong> {variable.defaultValue}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-1 ml-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEditing(index)}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteVariable(index)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              {variables.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-8">
                  No custom variables configured. Add some above.
                </p>
              )}
            </CardContent>
          </Card>

          <div className="text-xs text-slate-500">
            <p><strong>Total:</strong> {variables.length} custom variables</p>
            <p><strong>Usage:</strong> Use variables in templates like {`{VARIABLE_NAME}`} or {`[VARIABLE_NAME]`}</p>
            <p><strong>Note:</strong> Changes apply immediately to template editors and email composer</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}