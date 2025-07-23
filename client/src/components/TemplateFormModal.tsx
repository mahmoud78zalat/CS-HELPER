import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AVAILABLE_VARIABLES, 
  extractVariablesFromTemplate, 
  validateTemplate, 
  getTemplateWarning, 
  QUICK_TEMPLATE_STARTERS,
  type DynamicVariable 
} from "@/lib/templateUtils";
import { 
  Wand2, Eye, Code, Copy, ChevronDown, ChevronUp, AlertTriangle,
  User, Package, Settings, Clock, Check, Plus
} from "lucide-react";
import { Template } from "@shared/schema";

interface TemplateFormModalProps {
  template?: Template | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (templateData: any) => void;
  isLoading: boolean;
  isEmailTemplate?: boolean;
}

export default function TemplateFormModal({ 
  template, 
  isOpen, 
  onClose, 
  onSave, 
  isLoading,
  isEmailTemplate = false
}: TemplateFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    content: '',
    category: '',
    genre: '',
    concernedTeam: '',
    warningNote: ''
  });
  
  const [showVariableHelper, setShowVariableHelper] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'customer' | 'order' | 'system' | 'time' | 'all'>('all');
  const [templateValidation, setTemplateValidation] = useState<{ isValid: boolean; issues: string[]; variables: string[] } | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  // Initialize form data when template changes
  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || '',
        subject: template.subject || '',
        content: template.content || '',
        category: template.category || '',
        genre: template.genre || '',
        concernedTeam: template.concernedTeam || '',
        warningNote: template.warningNote || ''
      });
    } else {
      // Reset form for new template
      setFormData({
        name: '',
        subject: '',
        content: '',
        category: '',
        genre: '',
        concernedTeam: '',
        warningNote: ''
      });
    }
  }, [template]);

  // Validate template content when it changes
  useEffect(() => {
    if (formData.content) {
      const validation = validateTemplate(formData.content);
      setTemplateValidation(validation);
    } else {
      setTemplateValidation(null);
    }
  }, [formData.content]);

  // Auto-generate warning when category/genre changes
  useEffect(() => {
    if (formData.category || formData.genre) {
      const autoWarning = getTemplateWarning(formData.category, formData.genre);
      if (!formData.warningNote && autoWarning) {
        setFormData(prev => ({ ...prev, warningNote: autoWarning }));
      }
    }
  }, [formData.category, formData.genre, formData.warningNote]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };



  const useTemplateStarter = (starterKey: string) => {
    const starter = QUICK_TEMPLATE_STARTERS[starterKey as keyof typeof QUICK_TEMPLATE_STARTERS];
    if (starter) {
      setFormData(prev => ({ 
        ...prev, 
        content: starter,
        subject: `${starterKey} - {customer_name}`
      }));
    }
  };

  const insertVariable = (variableName: string) => {
    const variable = `{${variableName.toLowerCase()}}`;
    const textarea = document.getElementById('content') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentContent = formData.content;
      const newContent = currentContent.substring(0, start) + variable + currentContent.substring(end);
      
      setFormData(prev => ({ ...prev, content: newContent }));
      
      // Set cursor position after inserted variable
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateValidation?.isValid && formData.content) {
      return;
    }
    
    const templateData = {
      ...formData,
      variables: extractVariablesFromTemplate(formData.content)
    };
    
    onSave(templateData);
  };

  const filteredVariables = selectedCategory === 'all' 
    ? AVAILABLE_VARIABLES 
    : AVAILABLE_VARIABLES.filter(v => v.category === selectedCategory);

  const variableCategories = [
    { key: 'all', label: 'All Variables', icon: Code },
    { key: 'customer', label: 'Customer', icon: User },
    { key: 'order', label: 'Order', icon: Package },
    { key: 'system', label: 'System', icon: Settings },
    { key: 'time', label: 'Time', icon: Clock }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template ? 'Edit Template' : 'Create New Template'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="content">Content & Variables</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., Order Delay Apology"
                    required
                  />
                </div>
                
                {/* Concerned Team - Only for Email Templates */}
                {isEmailTemplate && (
                  <div className="space-y-2">
                    <Label htmlFor="concernedTeam">Concerned Team *</Label>
                    <Select value={formData.concernedTeam} onValueChange={(value) => handleInputChange('concernedTeam', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select team" />
                      </SelectTrigger>
                      <SelectContent>
                        {(() => {
                          const teams = localStorage.getItem('template_concerned_teams');
                          const teamsList = teams ? JSON.parse(teams) : ['Customer Service', 'Order Management', 'Delivery Team', 'Returns Team', 'Technical Support', 'Finance', 'IT Support', 'Fulfillment', 'Quality Assurance', 'Management'];
                          return teamsList.map((team: string) => (
                            <SelectItem key={team} value={team}>{team}</SelectItem>
                          ));
                        })()}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {(() => {
                        const categories = localStorage.getItem('template_categories');
                        const categoriesList = categories ? JSON.parse(categories) : ['Order Issues', 'Delivery Problems', 'Payment Issues', 'Returns & Refunds', 'Product Inquiry', 'General Support', 'Technical Support', 'Escalation'];
                        return categoriesList.map((category: string) => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ));
                      })()}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="genre">Genre *</Label>
                  <Select value={formData.genre} onValueChange={(value) => handleInputChange('genre', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select genre" />
                    </SelectTrigger>
                    <SelectContent>
                      {(() => {
                        const genres = localStorage.getItem('template_genres');
                        const genresList = genres ? JSON.parse(genres) : ['Urgent', 'Standard', 'Follow-up', 'Escalation', 'Resolution', 'Greeting', 'CSAT', 'Warning Abusive Language', 'Apology', 'Thank You', 'Farewell', 'Confirmation', 'Technical Support', 'Holiday/Special Occasion'];
                        return genresList.map((genre: string) => (
                          <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                        ));
                      })()}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Email Subject - Only for Email Templates */}
              {isEmailTemplate && (
                <div className="space-y-2">
                  <Label htmlFor="subject">Email Subject *</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    placeholder="e.g., Update on Your Order [ORDERNUMBER]"
                    required
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="warningNote">Warning Note</Label>
                <Textarea
                  id="warningNote"
                  value={formData.warningNote}
                  onChange={(e) => handleInputChange('warningNote', e.target.value)}
                  placeholder="Important instructions for agents using this template..."
                  rows={2}
                />
                <p className="text-sm text-muted-foreground">
                  This warning will be shown in red to agents before they use this template.
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="content" className="space-y-4">
              <div className="space-y-4">
                {/* Template Starters */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Wand2 size={16} />
                      Quick Template Starters
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(QUICK_TEMPLATE_STARTERS).map((key) => (
                        <Button
                          key={key}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => useTemplateStarter(key)}
                        >
                          {key}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="content">Template Content *</Label>
                    <Textarea
                      id="content"
                      name="content"
                      value={formData.content}
                      onChange={(e) => handleInputChange('content', e.target.value)}
                      placeholder="Write your email template here. Use [VARIABLENAME] for dynamic content..."
                      rows={12}
                      required
                      className="font-mono text-sm"
                    />
                    
                    {templateValidation && (
                      <Alert variant={templateValidation.isValid ? "default" : "destructive"}>
                        <AlertTriangle size={16} />
                        <AlertDescription>
                          {templateValidation.isValid 
                            ? `✓ Template is valid. Found ${templateValidation.variables.length} variables.`
                            : templateValidation.issues.join(', ')
                          }
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowVariableHelper(!showVariableHelper)}
                        className="w-full"
                      >
                        <Code size={16} className="mr-2" />
                        Variable Helper
                        {showVariableHelper ? <ChevronUp size={16} className="ml-2" /> : <ChevronDown size={16} className="ml-2" />}
                      </Button>
                    </div>
                    
                    {showVariableHelper && (
                      <Card>
                        <CardHeader className="pb-2">
                          <div className="flex flex-wrap gap-1">
                            {variableCategories.map(({ key, label, icon: Icon }) => (
                              <Button
                                key={key}
                                type="button"
                                variant={selectedCategory === key ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedCategory(key as any)}
                                className="text-xs"
                              >
                                <Icon size={12} className="mr-1" />
                                {label}
                              </Button>
                            ))}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                          {filteredVariables.map((variable) => (
                            <div
                              key={variable.name}
                              className="p-2 border rounded cursor-pointer hover:bg-muted"
                              onClick={() => insertVariable(variable.name)}
                            >
                              <div className="flex items-center justify-between">
                                <Badge variant="secondary" className="text-xs">
                                  {variable.name}
                                </Badge>
                                <Plus size={12} />
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {variable.description}
                              </p>
                              <p className="text-xs text-blue-600 mt-1">
                                e.g., {variable.example}
                              </p>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="preview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Eye size={16} />
                    Template Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h3 className="font-medium">Subject:</h3>
                      <p className="text-sm">{formData.subject || 'No subject set'}</p>
                    </div>
                    
                    {formData.warningNote && (
                      <Alert variant="destructive">
                        <AlertTriangle size={16} />
                        <AlertDescription>{formData.warningNote}</AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="border rounded p-4 bg-muted/20">
                      <pre className="whitespace-pre-wrap text-sm">
                        {formData.content || 'No content yet...'}
                      </pre>
                    </div>
                    
                    {templateValidation?.variables && templateValidation.variables.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Variables Found:</h4>
                        <div className="flex flex-wrap gap-2">
                          {templateValidation.variables.map((variable) => (
                            <Badge key={variable} variant="outline">
                              [{variable}]
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || (templateValidation?.isValid === false)}>
              {isLoading ? 'Saving...' : template ? 'Update Template' : 'Create Template'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}