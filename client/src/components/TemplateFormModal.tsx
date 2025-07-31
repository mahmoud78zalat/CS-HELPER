import { useState, useEffect, useRef } from "react";
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
import { useQuery } from "@tanstack/react-query";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { 
  extractVariablesFromTemplate, 
  validateTemplate, 
  getTemplateWarning 
} from "@/lib/templateUtils";
import { useDynamicVariables } from "@/hooks/useDynamicVariables";
import { 
  Wand2, Eye, Code, Copy, ChevronDown, ChevronUp, AlertTriangle,
  User, Package, Settings, Clock, Check, Plus
} from "lucide-react";
import { Template } from "@shared/schema";
import DraggableVariable from "./DraggableVariable";
import DroppableTextarea from "./DroppableTextarea";

interface TemplateFormModalProps {
  template?: Template | any | null; // Allow any to handle email templates
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
  // Use dynamic variables from Supabase
  const { variables, isLoading: variablesLoading } = useDynamicVariables();
  
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    contentEn: '',
    contentAr: '',
    category: '',
    genre: '',
    concernedTeam: '',
    warningNote: ''
  });
  
  const [showVariableHelper, setShowVariableHelper] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'customer' | 'order' | 'system' | 'time' | 'all'>('all');
  const [templateValidation, setTemplateValidation] = useState<{ isValid: boolean; issues: string[]; variables: string[] } | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [activeField, setActiveField] = useState<'contentEn' | 'contentAr' | null>(null);
  
  // Debug activeField changes
  useEffect(() => {
    console.log('[ActiveField] Changed to:', activeField);
  }, [activeField]);

  // Fetch dynamic data for dropdowns
  const { data: templateCategories = [] } = useQuery<{id: string, name: string}[]>({
    queryKey: ['/api/template-categories'],
  });

  const { data: emailCategories = [] } = useQuery<{id: string, name: string}[]>({
    queryKey: ['/api/email-categories'],
    enabled: isEmailTemplate,
  });

  // Use template categories as fallback for email templates if email categories are limited
  const availableCategories = isEmailTemplate ? 
    (emailCategories.length > 1 ? emailCategories : templateCategories) : 
    templateCategories;

  const { data: templateGenres = [] } = useQuery<{id: string, name: string}[]>({
    queryKey: ['/api/template-genres'],
  });

  const { data: concernedTeams = [] } = useQuery<{id: string, name: string}[]>({
    queryKey: ['/api/concerned-teams'],
    enabled: isEmailTemplate,
  });

  // Initialize form data when template changes
  useEffect(() => {
    if (template) {
      try {
        // Safe property access with fallbacks
        const safeTemplate = template as any;
        
        setFormData({
          name: safeTemplate.name || '',
          subject: safeTemplate.subject || '',
          contentEn: isEmailTemplate ? (safeTemplate.content || safeTemplate.contentEn || '') : (safeTemplate.contentEn || ''),
          contentAr: isEmailTemplate ? '' : (safeTemplate.contentAr || ''),
          category: safeTemplate.category || '',
          genre: safeTemplate.genre || '',
          concernedTeam: safeTemplate.concernedTeam || '',
          warningNote: safeTemplate.warningNote || ''
        });
        
        console.log('[TemplateFormModal] Initialized form data for editing:', {
          name: safeTemplate.name,
          isEmailTemplate,
          hasSubject: !!safeTemplate.subject,
          hasContent: !!(safeTemplate.content || safeTemplate.contentEn)
        });
      } catch (error) {
        console.error('[TemplateFormModal] Error initializing form data:', error);
        // Reset to empty form on error
        setFormData({
          name: '',
          subject: '',
          contentEn: '',
          contentAr: '',
          category: '',
          genre: '',
          concernedTeam: '',
          warningNote: ''
        });
      }
    } else {
      // Reset form for new template
      setFormData({
        name: '',
        subject: '',
        contentEn: '',
        contentAr: '',
        category: '',
        genre: '',
        concernedTeam: '',
        warningNote: ''
      });
    }
  }, [template, isEmailTemplate]);

  // Validate template content when it changes
  useEffect(() => {
    try {
      const contentToValidate = isEmailTemplate ? formData.contentEn : (formData.contentEn + formData.contentAr);
      if (contentToValidate && contentToValidate.trim()) {
        const validation = validateTemplate(contentToValidate);
        setTemplateValidation(validation);
      } else {
        setTemplateValidation(null);
      }
    } catch (error) {
      console.error('[TemplateFormModal] Error validating template:', error);
      setTemplateValidation({ isValid: true, issues: [], variables: [] });
    }
  }, [formData.contentEn, formData.contentAr, isEmailTemplate]);

  // Auto-generate warning when category/genre changes
  useEffect(() => {
    try {
      if (formData.category || formData.genre) {
        const autoWarning = getTemplateWarning(formData.category, formData.genre);
        if (!formData.warningNote && autoWarning) {
          setFormData(prev => ({ ...prev, warningNote: autoWarning }));
        }
      }
    } catch (error) {
      console.error('[TemplateFormModal] Error generating warning:', error);
    }
  }, [formData.category, formData.genre, formData.warningNote]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };



  // Removed Quick Template Starters as requested

  const insertVariable = (variableName: string, targetField?: 'contentEn' | 'contentAr') => {
    const variable = `{${variableName.toLowerCase()}}`;
    const fieldToUse = targetField || activeField || 'contentEn';
    console.log('[InsertVariable] Variable:', variableName);
    console.log('[InsertVariable] Target field:', targetField);
    console.log('[InsertVariable] Active field:', activeField);
    console.log('[InsertVariable] Final field to use:', fieldToUse);
    
    const textareaId = fieldToUse === 'contentAr' ? 'contentAr' : 'contentEn';
    const textarea = document.getElementById(textareaId) as HTMLTextAreaElement;
    
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentContent = fieldToUse === 'contentAr' ? formData.contentAr : formData.contentEn;
      const newContent = currentContent.substring(0, start) + variable + currentContent.substring(end);
      
      console.log('[InsertVariable] Inserting at position:', start, 'to', end);
      console.log('[InsertVariable] Current content length:', currentContent.length);
      console.log('[InsertVariable] New content length:', newContent.length);
      
      setFormData(prev => ({ 
        ...prev, 
        [fieldToUse]: newContent 
      }));
      
      // Set cursor position after inserted variable
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    } else {
      console.error('[InsertVariable] Could not find textarea with ID:', textareaId);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.data.current?.type === 'variable') {
      const variableName = active.data.current.variableName;
      const dropTargetId = over.id as string;
      
      console.log('[DragEnd] Variable:', variableName, 'Drop target:', dropTargetId);
      
      // Determine which field the variable was dropped on
      if (dropTargetId === 'droppable-contentEn') {
        console.log('[DragEnd] Inserting into English field');
        insertVariable(variableName, 'contentEn');
      } else if (dropTargetId === 'droppable-contentAr') {
        console.log('[DragEnd] Inserting into Arabic field');
        insertVariable(variableName, 'contentAr');
      } else {
        console.log('[DragEnd] Unknown drop target, using active field:', activeField);
        // Fallback to active field
        insertVariable(variableName, activeField || 'contentEn');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Basic validation
      if (!formData.name.trim()) {
        console.error('[TemplateFormModal] Template name is required');
        return;
      }
      
      const contentToCheck = isEmailTemplate ? formData.contentEn : (formData.contentEn + formData.contentAr);
      if (!contentToCheck.trim()) {
        console.error('[TemplateFormModal] Template content is required');
        return;
      }
      
      if (!templateValidation?.isValid && contentToCheck.trim()) {
        console.error('[TemplateFormModal] Template validation failed:', templateValidation?.issues);
        return;
      }
      
      const templateData = isEmailTemplate ? {
        name: formData.name.trim(),
        subject: formData.subject.trim(),
        content: formData.contentEn.trim(),
        category: formData.category,
        genre: formData.genre,
        concernedTeam: formData.concernedTeam,
        warningNote: formData.warningNote.trim(),
        variables: extractVariablesFromTemplate(formData.contentEn)
      } : {
        name: formData.name.trim(),
        contentEn: formData.contentEn.trim(),
        contentAr: formData.contentAr.trim(),
        category: formData.category,
        genre: formData.genre,
        variables: extractVariablesFromTemplate(formData.contentEn + ' ' + formData.contentAr)
      };
      
      onSave(templateData);
    } catch (error) {
      console.error('[TemplateFormModal] Error during submit:', error);
    }
  };

  // Use dynamic variables from Supabase instead of hardcoded ones
  const filteredVariables = selectedCategory === 'all' 
    ? variables 
    : variables.filter(v => v.category === selectedCategory);

  const variableCategories = [
    { key: 'all', label: 'All Variables', icon: Code }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template ? 'Edit Template' : 'Create New Template'}
          </DialogTitle>
        </DialogHeader>
        
        <DndContext onDragEnd={handleDragEnd}>
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
                    placeholder="e.g., Order {order_id} Follow-up"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    💡 Admin tip: You can use variables in template names like {"{order_id}"} or {"{customer_name}"}
                  </p>
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
                        {concernedTeams.map((team: any) => (
                          <SelectItem key={team.id} value={team.name}>{team.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCategories.map((category: any) => (
                        <SelectItem key={category.id} value={category.name}>{category.name}</SelectItem>
                      ))}
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
                      {templateGenres.map((genre: any) => (
                        <SelectItem key={genre.id} value={genre.name}>{genre.name}</SelectItem>
                      ))}
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
                {/* Quick Template Starters removed as requested */}
                
                <div className="space-y-4">
                  {/* English Content */}
                  <div className="space-y-2">
                    <Label htmlFor="contentEn">English Content *</Label>
                    <DroppableTextarea
                      id="contentEn"
                      name="contentEn"
                      value={formData.contentEn}
                      onChange={(e) => {
                        handleInputChange('contentEn', e.target.value);
                        setActiveField('contentEn');
                      }}
                      placeholder="Write your template content in English. Use {variable_name} for dynamic content..."
                      rows={8}
                      required
                      className="font-mono text-sm"
                      onFieldFocus={setActiveField}
                    />
                  </div>
                  
                  {/* Arabic Content - Only for Live Reply Templates */}
                  {!isEmailTemplate && (
                    <div className="space-y-2">
                      <Label htmlFor="contentAr">Arabic Content *</Label>
                      <DroppableTextarea
                        id="contentAr"
                        name="contentAr"
                        value={formData.contentAr}
                        onChange={(e) => {
                          handleInputChange('contentAr', e.target.value);
                          setActiveField('contentAr');
                        }}
                        placeholder="اكتب محتوى القالب باللغة العربية. استخدم {variable_name} للمحتوى المتغير..."
                        rows={8}
                        required
                        className="font-mono text-sm"
                        dir="rtl"
                        onFieldFocus={setActiveField}
                      />
                    </div>
                  )}
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                    
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
                            <DraggableVariable
                              key={variable.name}
                              variable={variable}
                              onInsert={insertVariable}
                            />
                          ))}
                        </CardContent>
                      </Card>
                    )}
                  </div>
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
                      <h3 className="font-medium">
                        {isEmailTemplate ? 'Subject:' : 'Template Name:'}
                      </h3>
                      <p className="text-sm">
                        {isEmailTemplate 
                          ? (formData.subject || 'No subject set')
                          : (formData.name || 'No template name set')
                        }
                      </p>
                    </div>
                    
                    {formData.warningNote && (
                      <Alert variant="destructive">
                        <AlertTriangle size={16} />
                        <AlertDescription>{formData.warningNote}</AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="border rounded p-4 bg-muted/20">
                      <pre className="whitespace-pre-wrap text-sm">
                        <strong>English:</strong><br />
                        {formData.contentEn || 'No English content yet...'}<br />
                        {!isEmailTemplate && (
                          <>
                            <br /><strong>Arabic:</strong><br />
                            {formData.contentAr || 'No Arabic content yet...'}
                          </>
                        )}
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
        </DndContext>
      </DialogContent>
    </Dialog>
  );
}