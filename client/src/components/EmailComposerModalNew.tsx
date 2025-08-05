import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useCustomerData } from "@/hooks/useCustomerData";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocalTemplateOrdering } from "@/hooks/useLocalTemplateOrdering";
import { Copy, X, Search, Send, Edit3, Sparkles, Plus, ArrowUpDown, GripVertical } from "lucide-react";
import { EmailTemplate } from "@shared/schema";
import { extractVariablesFromTemplate } from "@/lib/templateUtils";
import { DndContext, DragEndEvent, useDraggable, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DraggableVariable from "./DraggableVariable";
import DroppableTextarea from "./DroppableTextarea";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

interface EmailComposerModalProps {
  onClose: () => void;
}

// Available template variables organized by category
const TEMPLATE_VARIABLES = {
  customer: [
    { key: "customer_name", label: "Customer Name", placeholder: "John Doe" },
    { key: "customer_email", label: "Customer Email", placeholder: "john@example.com" },
    { key: "customer_phone", label: "Customer Phone", placeholder: "+971501234567" },
    { key: "customer_address", label: "Customer Address", placeholder: "Dubai, UAE" },
  ],
  order: [
    { key: "order_id", label: "Order ID", placeholder: "ORD123456" },
    { key: "awb_number", label: "AWB Number", placeholder: "AWB789012" },
    { key: "order_status", label: "Order Status", placeholder: "Processing" },
    { key: "tracking_number", label: "Tracking Number", placeholder: "TRK345678" },
    { key: "delivery_date", label: "Delivery Date", placeholder: "2025-01-25" },
    { key: "waiting_time", label: "Waiting Time", placeholder: "2-3 business days" },
  ],
  system: [
    { key: "agent_name", label: "Agent Name", placeholder: "Support Agent" },
    { key: "concerned_team", label: "Concerned Team", placeholder: "Finance Team" },
    { key: "company_name", label: "Company Name", placeholder: "Brands For Less" },
    { key: "support_email", label: "Support Email", placeholder: "support@brandsforless.com" },
    { key: "business_hours", label: "Business Hours", placeholder: "9 AM - 6 PM, Sun-Thu" },
  ],
  time: [
    { key: "current_date", label: "Current Date", placeholder: "January 23, 2025" },
    { key: "current_time", label: "Current Time", placeholder: "2:30 PM" },
    { key: "time_frame", label: "Time Frame", placeholder: "24-48 hours" },
  ]
};

// Enhanced subject variables to include mobile_number and other common variables
const SUBJECT_VARIABLES = [
  { key: "order_id", label: "Order ID", placeholder: "ORD123456" },
  { key: "awb", label: "AWB Number", placeholder: "AWB789012" },
  { key: "awb_number", label: "AWB Number", placeholder: "AWB789012" },
  { key: "mobile_number", label: "Mobile Number", placeholder: "+971501234567" },
  { key: "customer_name", label: "Customer Name", placeholder: "John Doe" },
  { key: "tracking_number", label: "Tracking Number", placeholder: "TRK345678" },
];

// Email Template Drag & Drop Components
const SortableEmailTemplateItem = ({ 
  template, 
  onTemplateSelect, 
  selectedTemplate 
}: { 
  template: EmailTemplate; 
  onTemplateSelect: (template: EmailTemplate) => void;
  selectedTemplate: EmailTemplate | null;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: template.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card
        className={`cursor-pointer transition-all duration-200 hover:shadow-md group ${
          selectedTemplate?.id === template.id 
            ? 'border-blue-300 bg-blue-50 shadow-md' 
            : 'border-slate-200 bg-white hover:border-blue-200'
        }`}
        onClick={() => onTemplateSelect(template)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div {...listeners} className="mt-1 opacity-50 hover:opacity-100 cursor-grab active:cursor-grabbing">
              <GripVertical className="h-4 w-4 text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-slate-800 mb-2 text-sm">{template.name}</h4>
              <div className="text-xs text-slate-600 mb-3">
                <span className="font-medium text-slate-700">To:</span> 
                <span className="ml-2 px-2 py-1 bg-slate-100 rounded text-xs">{template.concernedTeam}</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs px-2 py-1 bg-blue-100 text-blue-800 border border-blue-200">
                  {template.genre}
                </Badge>
                <Badge variant="outline" className="text-xs px-2 py-1 border-slate-300 text-slate-700">
                  {template.category}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const EmailDragDropList = ({ 
  templates, 
  onTemplateSelect, 
  selectedTemplate, 
  onReorder 
}: {
  templates: EmailTemplate[];
  onTemplateSelect: (template: EmailTemplate) => void;
  selectedTemplate: EmailTemplate | null;
  onReorder: (newOrder: EmailTemplate[]) => void;
}) => {
  const [items, setItems] = useState(templates);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setItems(templates);
  }, [templates]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex(item => item.id === active.id);
      const newIndex = items.findIndex(item => item.id === over.id);
      
      const newOrder = arrayMove(items, oldIndex, newIndex);
      setItems(newOrder);
      onReorder(newOrder);
    }
  };

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">
          {items.map((template) => (
            <SortableEmailTemplateItem
              key={template.id}
              template={template}
              onTemplateSelect={onTemplateSelect}
              selectedTemplate={selectedTemplate}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default function EmailComposerModal({ onClose }: EmailComposerModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [isDragDropMode, setIsDragDropMode] = useState(false);

  // Add editing mode state to control when to show template vs processed content
  const [isEditingSubject, setIsEditingSubject] = useState(false);
  const [isEditingBody, setIsEditingBody] = useState(false);
  
  // Track subject and content changes for variable synchronization
  const [prevSubject, setPrevSubject] = useState('');
  const [prevBody, setPrevBody] = useState('');


  
  // Fetch email templates with debugging
  const { data: templates = [] } = useQuery<EmailTemplate[]>({
    queryKey: ['/api/email-templates'],
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache results
  });

  // Debug template data and UUID resolution
  useEffect(() => {
    console.log('[EmailComposerNew] Templates loaded:', templates.length);
    if (templates.length > 0) {
      const sampleTemplate = templates[0];
      console.log('[EmailComposerNew] Sample template data:', {
        id: sampleTemplate.id,
        name: sampleTemplate.name,
        category: sampleTemplate.category,
        genre: sampleTemplate.genre,
        categoryType: typeof sampleTemplate.category,
        genreType: typeof sampleTemplate.genre,
        categoryLength: sampleTemplate.category?.length,
        genreLength: sampleTemplate.genre?.length,
        categoryIsUUID: sampleTemplate.category?.includes('-'),
        genreIsUUID: sampleTemplate.genre?.includes('-'),
      });
    }
  }, [templates]);

  const { customerData } = useCustomerData();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Initialize local template ordering hook for email templates
  const { 
    applyLocalOrdering, 
    updateBulkOrdering, 
    resetToAdminOrdering, 
    hasLocalOrdering 
  } = useLocalTemplateOrdering(user?.id || 'anonymous', 'email-templates');

  // Effect to handle variable synchronization between subject and content
  useEffect(() => {
    // Check if orderid or awb variables were added/changed in subject
    const subjectOrderidMatch = emailSubject.match(/\{orderid\}/g);
    const subjectAwbMatch = emailSubject.match(/\{awb\}/g);
    const prevSubjectOrderidMatch = prevSubject.match(/\{orderid\}/g);
    const prevSubjectAwbMatch = prevSubject.match(/\{awb\}/g);
    
    // Check if orderid or awb variables were added/changed in body
    const bodyOrderidMatch = emailBody.match(/\{orderid\}/g);
    const bodyAwbMatch = emailBody.match(/\{awb\}/g);
    const prevBodyOrderidMatch = prevBody.match(/\{orderid\}/g);
    const prevBodyAwbMatch = prevBody.match(/\{awb\}/g);
    
    // Sync variables if they changed in either subject or body
    let updated = false;
    
    // If orderid was added to subject but not in body, sync it
    if (subjectOrderidMatch && !bodyOrderidMatch && 
        (!prevSubjectOrderidMatch || subjectOrderidMatch.length !== prevSubjectOrderidMatch.length)) {
      setEmailBody(prev => prev.includes('{orderid}') ? prev : prev + ' {orderid} ');
      updated = true;
    }
    
    // If awb was added to subject but not in body, sync it
    if (subjectAwbMatch && !bodyAwbMatch && 
        (!prevSubjectAwbMatch || subjectAwbMatch.length !== prevSubjectAwbMatch.length)) {
      setEmailBody(prev => prev.includes('{awb}') ? prev : prev + ' {awb} ');
      updated = true;
    }
    
    // If orderid was added to body but not in subject, sync it
    if (bodyOrderidMatch && !subjectOrderidMatch && 
        (!prevBodyOrderidMatch || bodyOrderidMatch.length !== prevBodyOrderidMatch.length)) {
      setEmailSubject(prev => prev.includes('{orderid}') ? prev : prev + ' {orderid} ');
      updated = true;
    }
    
    // If awb was added to body but not in subject, sync it
    if (bodyAwbMatch && !subjectAwbMatch && 
        (!prevBodyAwbMatch || bodyAwbMatch.length !== prevBodyAwbMatch.length)) {
      setEmailSubject(prev => prev.includes('{awb}') ? prev : prev + ' {awb} ');
      updated = true;
    }
    
    // Update tracking variables
    setPrevSubject(emailSubject);
    setPrevBody(emailBody);
  }, [emailSubject, emailBody, prevSubject, prevBody]);

  // Initialize variable values with customer data and system defaults
  useEffect(() => {
    const agentName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const currentTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    setVariableValues({
      // Customer data
      customer_name: customerData.customer_name || '',
      customer_email: customerData.customer_email || '',
      customer_phone: customerData.customer_phone || '',
      customer_address: customerData.customer_address || '',
      
      // Order data
      order_id: customerData.order_id || '',
      awb_number: customerData.awb_number || '',
      awb: customerData.awb_number || '', // Support both {awb} and {awb_number}
      order_status: customerData.order_status || '',
      tracking_number: customerData.tracking_number || '',
      delivery_date: customerData.delivery_date || '',
      waiting_time: customerData.waiting_time || '2-3 business days',
      
      // System data
      agent_name: agentName,
      company_name: 'Brands For Less',
      support_email: 'support@brandsforless.com',
      business_hours: '9 AM - 6 PM, Sunday - Thursday',
      
      // Time data
      current_date: currentDate,
      current_time: currentTime,
      time_frame: '24-48 hours',

      // Subject-specific variables (limited set)
      ordernumber: customerData.order_id || customerData.awb_number || '',
      orderid: customerData.order_id || '', // Add orderid variable
      order_number: customerData.order_id || customerData.awb_number || '',
      AWB: customerData.awb_number || '',
      customernumber: customerData.customer_name?.replace(/\s+/g, '').toUpperCase() + '001' || 'CUST001',
    });
  }, [customerData, user]);

  // Apply local ordering first, then filter templates by search term
  const orderedTemplates = applyLocalOrdering(templates);
  const filteredTemplates = orderedTemplates.filter((template: EmailTemplate) =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.genre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.concernedTeam.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Replace variables in template content
  const replaceVariables = (text: string) => {
    return text.replace(/\{(\w+)\}/g, (match, key) => {
      return variableValues[key] || match;
    });
  };

  // Replace variables specifically for subject (includes both predefined and custom)
  const replaceSubjectVariables = (subject: string) => {
    return subject.replace(/\{(\w+)\}/g, (match, variable) => {
      return variableValues[variable] || match;
    });
  };

  // Insert variable into subject at cursor position with proper spacing
  const insertSubjectVariable = (variable: string) => {
    const subjectInput = document.getElementById('emailSubject') as HTMLInputElement;
    const cursorPosition = subjectInput?.selectionStart || emailSubject.length;
    const beforeCursor = emailSubject.substring(0, cursorPosition);
    const afterCursor = emailSubject.substring(cursorPosition);
    
    // Add spaces before and after the variable for better readability
    const spaceBefore = beforeCursor && !beforeCursor.endsWith(' ') ? ' ' : '';
    const spaceAfter = afterCursor && !afterCursor.startsWith(' ') ? ' ' : '';
    
    const newSubject = beforeCursor + spaceBefore + `{${variable}}` + spaceAfter + afterCursor;
    setEmailSubject(newSubject);

  };

  // Handle template selection
  const handleTemplateSelect = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    // Use template subject if available, otherwise fallback to template name
    setEmailSubject(template.subject || template.name || '');
    setEmailBody(template.content || '');
    
    // Reset editing states when template changes
    setIsEditingSubject(false);
    setIsEditingBody(false);
    
    // Update concerned team in variables
    setVariableValues(prev => ({
      ...prev,
      concerned_team: template.concernedTeam
    }));
  };

  // Handle variable value change with synchronization between subject and content
  const handleVariableChange = (key: string, value: string) => {
    setVariableValues(prev => {
      const newValues = {
        ...prev,
        [key]: value
      };
      
      // If this is an orderid or awb variable, update both subject and content synchronously
      if (key === 'orderid' || key === 'awb') {
        // Update the subject with new variable value
        if (emailSubject.includes(`{${key}}`)) {
          const updatedSubject = emailSubject.replace(
            new RegExp(`\\{${key}\\}`, 'g'),
            ` {${key}} `
          );
          setEmailSubject(updatedSubject);
        }
        
        // Update the content with new variable value
        if (emailBody.includes(`{${key}}`)) {
          const updatedBody = emailBody.replace(
            new RegExp(`\\{${key}\\}`, 'g'),
            ` {${key}} `
          );
          setEmailBody(updatedBody);
        }
      }
      
      return newValues;
    });
  };

  // Get final email content with variables replaced
  const getFinalSubject = () => replaceSubjectVariables(emailSubject);
  const getFinalBody = () => replaceVariables(emailBody);

  // Extract unique variables from both subject and content - prevents duplication
  const getUniqueTemplateVariables = () => {
    const subjectVars = extractVariablesFromTemplate(emailSubject);
    const bodyVars = extractVariablesFromTemplate(emailBody);
    
    console.log('[EmailComposer] Variable extraction debug:', {
      emailSubject,
      emailBody,
      subjectVars,
      bodyVars
    });
    
    // Remove duplicates - if a variable appears in both subject and content, show it only once
    return Array.from(new Set([...subjectVars, ...bodyVars]));
  };

  // Get custom dynamic variables from subject (not in predefined SUBJECT_VARIABLES)
  const getCustomSubjectVariables = (subject: string) => {
    const subjectVars = extractVariablesFromTemplate(subject);
    const predefinedKeys = SUBJECT_VARIABLES.map(v => v.key);
    return subjectVars.filter(varName => !predefinedKeys.includes(varName));
  };

  const uniqueVariables = getUniqueTemplateVariables();
  const customSubjectVars = getCustomSubjectVariables(emailSubject);

  const handleCopyEmail = () => {
    const finalEmail = `Subject: ${getFinalSubject()}\n\n${getFinalBody()}`;
    navigator.clipboard.writeText(finalEmail);
    toast({
      title: "Success",
      description: "Complete email copied to clipboard!",
    });
  };

  const handleCopySubject = () => {
    navigator.clipboard.writeText(getFinalSubject());
    toast({
      title: "Success",
      description: "Subject copied to clipboard!",
    });
  };

  const handleCopyBody = () => {
    navigator.clipboard.writeText(getFinalBody());
    toast({
      title: "Success",
      description: "Email body copied to clipboard!",
    });
  };

  // Handle drag end event for variable drag and drop
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.data.current?.type === 'variable') {
      const variableName = active.data.current.variableName;
      const dropTargetId = over.id as string;
      
      if (dropTargetId === 'email-body-droppable') {
        // Insert variable into email body at cursor position
        const textarea = document.getElementById('body') as HTMLTextAreaElement;
        if (textarea) {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const variable = `{${variableName}}`;
          
          const newValue = emailBody.substring(0, start) + variable + emailBody.substring(end);
          setEmailBody(newValue);
          
          // Set cursor position after inserted variable
          setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + variable.length, start + variable.length);
          }, 0);
        }
      }
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-[100vw] max-h-[100vh] w-full h-full m-0 p-0 overflow-hidden border-0 rounded-none bg-white">
        <DialogHeader className="p-6 border-b border-slate-200 bg-white">
          <DialogTitle className="flex items-center gap-3 text-xl font-semibold text-slate-800">
            <div className="p-2 rounded-lg bg-blue-50 border border-blue-200">
              <Send className="h-5 w-5 text-blue-600" />
            </div>
            Email Template Composer
          </DialogTitle>
        </DialogHeader>

        <PanelGroup direction="horizontal" className="h-[calc(100vh-80px)]" autoSaveId="email-composer-layout-v3">
          {/* Left Panel: Template Selection */}
          <Panel defaultSize={25} minSize={20} maxSize={40} id="template-selection" order={1}>
            <div className="w-full h-full border-r border-slate-200 flex flex-col bg-slate-50">
            <div className="p-4 border-b border-slate-200 bg-white">
              <h3 className="font-semibold text-lg mb-3 text-slate-700">Select Template</h3>
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5 z-10" />
                  <Input
                    type="text"
                    className="pl-12 h-10 text-sm bg-white border-slate-300 focus:border-blue-500 focus:ring-blue-200 rounded-md"
                    placeholder="Search templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant={isDragDropMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsDragDropMode(!isDragDropMode)}
                    className="flex items-center gap-2 text-xs h-8"
                  >
                    <ArrowUpDown className="h-3 w-3" />
                    {isDragDropMode ? "Exit Reorder" : "Reorder"}
                  </Button>
                  
                  {hasLocalOrdering && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetToAdminOrdering}
                      className="text-xs h-8"
                    >
                      Reset Order
                    </Button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {isDragDropMode ? (
                <EmailDragDropList
                  templates={filteredTemplates}
                  onTemplateSelect={handleTemplateSelect}
                  selectedTemplate={selectedTemplate}
                  onReorder={(newOrder) => {
                    updateBulkOrdering(newOrder.map(t => t.id));
                  }}
                />
              ) : (
                <div className="space-y-4">
                  {filteredTemplates.map((template: EmailTemplate) => (
                    <Card
                      key={template.id}
                      className={`cursor-pointer transition-all duration-200 hover:shadow-md group ${
                        selectedTemplate?.id === template.id 
                          ? 'border-blue-300 bg-blue-50 shadow-md' 
                          : 'border-slate-200 bg-white hover:border-blue-200'
                      }`}
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-slate-800 mb-2 text-sm">{template.name}</h4>
                        <div className="text-xs text-slate-600 mb-3">
                          <span className="font-medium text-slate-700">To:</span> 
                          <span className="ml-2 px-2 py-1 bg-slate-100 rounded text-xs">{template.concernedTeam}</span>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant="secondary" className="text-xs px-2 py-1 bg-blue-100 text-blue-800 border border-blue-200">
                            {template.genre}
                          </Badge>
                          <Badge variant="outline" className="text-xs px-2 py-1 border-slate-300 text-slate-700">
                            {template.category}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              
              {filteredTemplates.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  <Search className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p className="text-base font-medium">No templates found</p>
                  <p className="text-sm mt-2">Try adjusting your search terms</p>
                </div>
              )}
            </div>
            </div>
          </Panel>

          <PanelResizeHandle className="w-2 bg-slate-200 hover:bg-slate-300 transition-colors cursor-col-resize relative">
            <div className="absolute inset-y-0 left-1/2 w-0.5 bg-slate-400 transform -translate-x-1/2"></div>
          </PanelResizeHandle>

          {/* Middle Panel: Email Composition */}
          <Panel defaultSize={50} minSize={35} id="email-composer" order={2}>
            <div className="w-full h-full flex flex-col bg-white min-w-0">
              <div className="p-4 border-b border-slate-200 bg-white">
                <div className="flex items-center gap-3 mb-4">
                  <Badge className="bg-blue-50 text-blue-700 px-3 py-1 text-sm border border-blue-200">
                    To: {selectedTemplate?.concernedTeam || 'Select template first'}
                  </Badge>
                </div>
                
                {/* Subject Line Section */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <Label htmlFor="emailSubject" className="text-base font-semibold">Subject Line</Label>
                    {isEditingSubject && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                          Editing Mode - Raw Template
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditingSubject(false)}
                          className="text-xs h-6 px-2"
                        >
                          Exit Edit
                        </Button>
                      </div>
                    )}
                    {!isEditingSubject && selectedTemplate && (
                      <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        Preview Mode - Variables Replaced
                      </span>
                    )}
                  </div>
                  <Input
                    id="emailSubject"
                    value={isEditingSubject ? emailSubject : getFinalSubject()}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    onFocus={() => setIsEditingSubject(true)}
                    placeholder="Select a template to populate subject..."
                    className={`h-12 text-base transition-colors ${
                      isEditingSubject 
                        ? 'border-blue-300 bg-blue-50/50' 
                        : 'border-slate-300 bg-white'
                    }`}
                  />

                  {/* Copy Action Buttons */}
                  <div className="flex gap-3 mt-3">
                    <Button
                      variant="link"
                      size="sm"
                      onClick={handleCopySubject}
                      disabled={!emailSubject}
                      className="text-sm p-0 h-auto"
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy Subject
                    </Button>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={handleCopyBody}
                      disabled={!emailBody}
                      className="text-sm p-0 h-auto"
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy Body
                    </Button>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={handleCopyEmail}
                      disabled={!emailSubject || !emailBody}
                      className="text-sm p-0 h-auto text-blue-600 hover:text-blue-700"
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy Complete Email
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Email Body Section */}
              <div className="flex-1 flex flex-col p-4">
                <div className="flex items-center justify-between mb-3">
                  <Label htmlFor="body" className="text-base font-semibold">Email Body</Label>
                  {isEditingBody && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                        Editing Mode - Raw Template
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditingBody(false)}
                        className="text-xs h-6 px-2"
                      >
                        Exit Edit
                      </Button>
                    </div>
                  )}
                  {!isEditingBody && selectedTemplate && (
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      Preview Mode - Variables Replaced
                    </span>
                  )}
                </div>
                <DroppableTextarea
                  id="email-body-droppable"
                  name="body"
                  value={isEditingBody ? emailBody : getFinalBody()}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEmailBody(e.target.value)}
                  onFieldFocus={() => setIsEditingBody(true)}
                  placeholder="Select a template to populate content..."
                  className={`font-mono text-sm resize-none flex-1 min-h-[400px] transition-colors ${
                    isEditingBody 
                      ? 'border-blue-300 bg-blue-50/50' 
                      : 'border-slate-300 bg-white'
                  }`}
                />
              </div>
            </div>
          </Panel>

          {/* Right Panel: Variable Management - Always visible for proper resizing */}
          <PanelResizeHandle className="w-2 bg-slate-200 hover:bg-slate-300 transition-colors cursor-col-resize relative">
            <div className="absolute inset-y-0 left-1/2 w-0.5 bg-slate-400 transform -translate-x-1/2"></div>
          </PanelResizeHandle>
          <Panel defaultSize={25} minSize={20} maxSize={40} id="variable-editor" order={3}>
                <div className="w-full h-full border-l border-slate-200 flex flex-col bg-slate-50 min-w-0">
              <div className="p-4 border-b border-slate-200 bg-white">
                <h3 className="font-medium text-base flex items-center gap-2 text-slate-700">
                  <div className="p-2 rounded-lg bg-blue-50 border border-blue-200">
                    <Edit3 className="h-4 w-4 text-blue-600" />
                  </div>
                  Live Template Variables
                </h3>
                <p className="text-xs text-slate-600 mt-2">
                  {selectedTemplate ? `Variables found: ${uniqueVariables.length + customSubjectVars.length}` : 'Select a template to see variables'}
                </p>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {selectedTemplate && (uniqueVariables.length > 0 || customSubjectVars.length > 0) ? (
                  <div className="space-y-4">
                    {/* Custom Subject Variables Section */}
                    {customSubjectVars.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm text-slate-700 mb-2 flex items-center gap-2">
                          <Sparkles className="h-3 w-3 text-blue-600" />
                          Custom Subject Variables
                        </h4>
                        <p className="text-xs text-slate-600 mb-3">
                          These variables are used in the email subject line
                        </p>
                        <div className="space-y-2">
                          {customSubjectVars.map((varName) => (
                            <div key={varName} className="p-2 bg-white rounded border border-slate-200 shadow-sm hover:border-blue-300 transition-colors">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                  {`{${varName}}`}
                                </span>
                              </div>
                              <Input
                                id={varName}
                                value={variableValues[varName] || ''}
                                onChange={(e) => handleVariableChange(varName, e.target.value)}
                                placeholder={`Enter value for ${varName}...`}
                                className="h-8 text-xs border-slate-200 focus:border-blue-400 focus:ring-blue-200"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Standard Template Variables */}
                    {Object.entries(TEMPLATE_VARIABLES).map(([category, variables]) => {
                      const categoryVariables = variables.filter(v => 
                        uniqueVariables.includes(v.key)
                      );
                      
                      if (categoryVariables.length === 0) return null;
                      
                      return (
                        <div key={category}>
                          <h4 className="font-medium text-sm text-slate-700 mb-2 capitalize">
                            {category} Variables
                          </h4>
                          <div className="space-y-2">
                            {categoryVariables.map((variable) => (
                              <div key={variable.key} className="p-2 bg-white rounded border border-slate-200 shadow-sm hover:border-blue-300 transition-colors">
                                <div className="flex items-center justify-between mb-1">
                                  <Label htmlFor={variable.key} className="text-xs font-medium text-slate-700">
                                    {variable.label}
                                  </Label>
                                  <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">
                                    {`{${variable.key}}`}
                                  </span>
                                </div>
                                <Input
                                  id={variable.key}
                                  value={variableValues[variable.key] || ''}
                                  onChange={(e) => handleVariableChange(variable.key, e.target.value)}
                                  placeholder={variable.placeholder}
                                  className="h-8 text-xs border-slate-200 focus:border-blue-400 focus:ring-blue-200"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {/* Other Template Variables - Variables not in predefined categories */}
                    {(() => {
                      // Get all predefined variable keys
                      const predefinedKeys = Object.values(TEMPLATE_VARIABLES).flat().map(v => v.key);
                      const customSubjectKeys = customSubjectVars;
                      const allKnownKeys = [...predefinedKeys, ...customSubjectKeys];
                      
                      // Find variables that are not in predefined categories or custom subject vars
                      const otherVariables = uniqueVariables.filter(varName => 
                        !allKnownKeys.includes(varName)
                      );
                      
                      if (otherVariables.length === 0) return null;
                      
                      return (
                        <div key="other">
                          <h4 className="font-medium text-sm text-slate-700 mb-2 flex items-center gap-2">
                            <Plus className="h-3 w-3 text-green-600" />
                            Template Variables
                          </h4>
                          <p className="text-xs text-slate-600 mb-3">
                            Additional variables found in this template
                          </p>
                          <div className="space-y-2">
                            {otherVariables.map((varName) => (
                              <div key={varName} className="p-2 bg-white rounded border border-slate-200 shadow-sm hover:border-blue-300 transition-colors">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-mono text-green-600 bg-green-50 px-2 py-1 rounded">
                                    {`{${varName}}`}
                                  </span>
                                </div>
                                <Input
                                  id={varName}
                                  value={variableValues[varName] || ''}
                                  onChange={(e) => handleVariableChange(varName, e.target.value)}
                                  placeholder={`Enter value for ${varName.replace(/_/g, ' ')}...`}
                                  className="h-8 text-xs border-slate-200 focus:border-blue-400 focus:ring-blue-200"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : selectedTemplate ? (
                  <div className="text-center py-12 text-slate-500">
                    <Edit3 className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                    <p className="text-base font-medium">No variables found</p>
                    <p className="text-sm mt-2">This template doesn't use any variables</p>
                  </div>
                ) : (
                  <div className="text-center py-16 text-slate-400">
                    <div className="p-4 rounded-xl bg-slate-100/50 w-fit mx-auto mb-4">
                      <Edit3 className="h-12 w-12 text-slate-300" />
                    </div>
                    <p className="text-lg font-semibold text-slate-600 mb-2">Template Variables</p>
                    <p className="text-sm">Select an email template to see available variables</p>
                    <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                      <p className="text-xs text-purple-700 font-medium">💡 Tip: Variables help personalize your emails with dynamic content</p>
                    </div>
                  </div>
                )}
              </div>
                </div>
          </Panel>
        </PanelGroup>
        </DialogContent>
      </Dialog>
    </DndContext>
  );
}