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
import { Copy, X, Search, Send, Edit3, Sparkles, Plus, GripVertical } from "lucide-react";
import { EmailTemplate } from "@shared/schema";
import { extractVariablesFromTemplate } from "@/lib/templateUtils";
import { DndContext, DragEndEvent, useDraggable } from "@dnd-kit/core";
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
  { key: "mobile_number", label: "Mobile Number", placeholder: "+971501234567" },
  { key: "customer_name", label: "Customer Name", placeholder: "John Doe" },
  { key: "tracking_number", label: "Tracking Number", placeholder: "TRK345678" },
];

export default function EmailComposerModal({ onClose }: EmailComposerModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [showSubjectVariables, setShowSubjectVariables] = useState(false);
  
  // Track subject and content changes for variable synchronization
  const [prevSubject, setPrevSubject] = useState('');
  const [prevBody, setPrevBody] = useState('');
  
  // Fetch email templates
  const { data: templates = [] } = useQuery<EmailTemplate[]>({
    queryKey: ['/api/email-templates'],
  });

  const { customerData } = useCustomerData();
  const { user } = useAuth();
  const { toast } = useToast();

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
      AWB: customerData.awb_number || '',
      customernumber: customerData.customer_name?.replace(/\s+/g, '').toUpperCase() + '001' || 'CUST001',
    });
  }, [customerData, user]);

  // Filter templates based on search
  const filteredTemplates = templates.filter((template: EmailTemplate) =>
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
    setShowSubjectVariables(false);
  };

  // Handle template selection
  const handleTemplateSelect = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    // Use template subject if available, otherwise fallback to template name
    setEmailSubject(template.subject || template.name || '');
    setEmailBody(template.content || '');
    
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
        <DialogContent className="max-w-[100vw] max-h-[100vh] w-full h-full m-0 p-0 overflow-hidden border-0 rounded-none bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <DialogHeader className="p-6 border-b border-slate-200/60 bg-gradient-to-r from-indigo-50/80 via-purple-50/80 to-pink-50/80 backdrop-blur-sm">
          <DialogTitle className="flex items-center gap-3 text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            <div className="p-2 rounded-xl bg-white/50 shadow-lg border border-white/20">
              <Send className="h-6 w-6 text-indigo-600" />
            </div>
            Email Template Composer
          </DialogTitle>
        </DialogHeader>

        <PanelGroup direction="horizontal" className="h-[calc(100vh-88px)]" autoSaveId="email-composer-layout-v3">
          {/* Left Panel: Template Selection */}
          <Panel defaultSize={25} minSize={20} maxSize={40} id="template-selection" order={1}>
            <div className="w-full h-full border-r border-slate-200/50 flex flex-col bg-gradient-to-b from-slate-50/80 to-white/90 backdrop-blur-sm">
            <div className="p-6 border-b border-slate-200/50 bg-white/70 backdrop-blur-sm">
              <h3 className="font-bold text-xl mb-4 bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">Select Template</h3>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5 z-10" />
                <Input
                  type="text"
                  className="pl-12 h-12 text-base bg-white/80 border-slate-200/60 focus:border-indigo-300 focus:ring-indigo-200/50 rounded-xl shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-white/90"
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <div className="space-y-4">
                {filteredTemplates.map((template: EmailTemplate) => (
                  <Card
                    key={template.id}
                    className={`cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group ${
                      selectedTemplate?.id === template.id 
                        ? 'border-indigo-300 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-lg ring-2 ring-indigo-200/50' 
                        : 'border-slate-200/60 bg-white/80 hover:border-indigo-200 hover:bg-white/90 backdrop-blur-sm'
                    }`}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <CardContent className="p-5">
                      <h4 className="font-bold text-slate-800 mb-3 text-base group-hover:text-indigo-700 transition-colors">{template.name}</h4>
                      <div className="text-sm text-slate-600 mb-4">
                        <span className="font-semibold text-slate-700">To:</span> 
                        <span className="ml-2 px-2 py-1 bg-slate-100 rounded-full text-xs font-medium">{template.concernedTeam}</span>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs px-3 py-1 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 border-0 font-medium">
                          {template.genre}
                        </Badge>
                        <Badge variant="outline" className="text-xs px-3 py-1 border-indigo-200 text-indigo-700 bg-indigo-50/50 font-medium">
                          {template.category}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
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

          <PanelResizeHandle className="w-3 bg-gradient-to-b from-slate-200 to-slate-300 hover:from-indigo-300 hover:to-purple-300 transition-all duration-300 cursor-col-resize active:from-indigo-400 active:to-purple-400 shadow-sm hover:shadow-md relative group">
            <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white/50 transform -translate-x-1/2 group-hover:bg-white/80 transition-colors"></div>
          </PanelResizeHandle>

          {/* Middle Panel: Email Composition */}
          <Panel defaultSize={40} minSize={25} id="email-composer" order={2}>
            <div className="w-full h-full flex flex-col bg-gradient-to-br from-white to-slate-50/50 min-w-0">
            <div className="p-6 border-b border-slate-200/50 flex-1 flex flex-col bg-white/70 backdrop-blur-sm">
              <div className="flex items-center gap-4 mb-6">
                <Badge className="bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 px-4 py-2 text-sm font-semibold border border-purple-200/50 shadow-sm">
                  To: {selectedTemplate?.concernedTeam || 'Select template first'}
                </Badge>
              </div>
              
              <div className="space-y-6 flex-1 flex flex-col">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label htmlFor="emailSubject" className="text-base font-semibold">Subject Line</Label>
                    <div className="relative">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSubjectVariables(!showSubjectVariables)}
                        className="text-sm h-9"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Variable
                      </Button>
                      
                      {showSubjectVariables && (
                        <div className="absolute right-0 top-full mt-2 bg-white border border-slate-200 rounded-lg shadow-xl p-3 z-50 min-w-64">
                          <p className="text-sm text-slate-600 mb-3 font-semibold">Subject Variables</p>
                          <div className="space-y-2">
                            {SUBJECT_VARIABLES.map((variable) => (
                              <button
                                key={variable.key}
                                onClick={() => insertSubjectVariable(variable.key)}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 rounded-md flex justify-between items-center transition-colors"
                              >
                                <span className="font-mono text-blue-600 font-medium">{`{${variable.key}}`}</span>
                                <span className="text-slate-500">{variable.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <Input
                    id="emailSubject"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Select a template to populate subject..."
                    className="h-12 text-base"
                  />
                  <div className="mt-2 p-3 bg-slate-50 rounded-md border">
                    <p className="text-sm text-slate-600 font-medium mb-1">Preview:</p>
                    <p className="text-sm text-slate-800">{getFinalSubject() || selectedTemplate?.name || 'No subject entered'}</p>
                  </div>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={handleCopySubject}
                    disabled={!emailSubject}
                    className="text-sm p-0 mt-2 h-auto"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy Subject
                  </Button>
                </div>
                
                <div className="flex-1 flex flex-col">
                  <Label htmlFor="body" className="text-base font-semibold mb-3 block">Email Body</Label>
                  <DroppableTextarea
                    id="email-body-droppable"
                    name="body"
                    value={emailBody}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEmailBody(e.target.value)}
                    placeholder="Select a template to populate content..."
                    className="font-mono text-sm resize-none flex-1 min-h-[400px]"
                  />
                  <div className="flex gap-3 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyBody}
                      disabled={!emailBody}
                      className="h-9"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Body
                    </Button>
                    <Button
                      onClick={handleCopyEmail}
                      disabled={!emailSubject || !emailBody}
                      className="h-9 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Complete Email
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Panel */}
            <div className="flex-1 p-6 bg-gradient-to-br from-slate-50 to-slate-100 overflow-y-auto min-h-0">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-slate-800">
                <Sparkles className="h-5 w-5 text-purple-600" />
                Live Email Preview
              </h3>
              
              <div className="h-full flex flex-col">
                <Card className="shadow-md flex-1 flex flex-col">
                  <CardContent className="p-6 flex-1 flex flex-col">
                    <div className="space-y-4 flex-1 flex flex-col">
                      <div className="border-l-4 border-blue-500 pl-4 bg-blue-50 py-3 rounded-r-md">
                        <h4 className="font-semibold text-slate-700 text-base mb-2">Subject:</h4>
                        <p className="text-base text-slate-800">{getFinalSubject() || selectedTemplate?.subject || selectedTemplate?.name || 'No subject set'}</p>
                      </div>
                      
                      {selectedTemplate?.warningNote && (
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-r-md p-4">
                          <p className="text-sm text-yellow-800 font-medium">
                            ⚠️ Important: {selectedTemplate.warningNote}
                          </p>
                        </div>
                      )}
                      
                      <div className="border rounded-lg p-6 bg-white shadow-sm flex-1 flex flex-col min-h-0">
                        <h4 className="font-semibold text-slate-700 text-base mb-3">Email Body:</h4>
                        <div className="flex-1 overflow-y-auto">
                          <pre className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 h-full">
                            {getFinalBody() || 'No content yet... Select a template to begin.'}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            </div>
          </Panel>

          {/* Right Panel: Variable Management - Always visible for proper resizing */}
          <PanelResizeHandle className="w-3 bg-gradient-to-b from-slate-200 to-slate-300 hover:from-purple-300 hover:to-pink-300 transition-all duration-300 cursor-col-resize active:from-purple-400 active:to-pink-400 shadow-sm hover:shadow-md relative group">
            <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white/50 transform -translate-x-1/2 group-hover:bg-white/80 transition-colors"></div>
          </PanelResizeHandle>
          <Panel defaultSize={35} minSize={25} maxSize={65} id="variable-editor" order={3}>
                <div className="w-full h-full border-l border-slate-200/50 flex flex-col bg-gradient-to-br from-slate-50/80 to-purple-50/30 backdrop-blur-sm min-w-0">
              <div className="p-5 border-b border-slate-200/50 bg-white/80 backdrop-blur-sm">
                <h3 className="font-bold text-xl flex items-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  <div className="p-2 rounded-xl bg-purple-100/80 shadow-lg border border-purple-200/50">
                    <Edit3 className="h-5 w-5 text-purple-600" />
                  </div>
                  Live Template Variables
                </h3>
                <p className="text-sm text-slate-600 mt-3 font-medium">
                  {selectedTemplate ? `Variables found: ${uniqueVariables.length + customSubjectVars.length}` : 'Select a template to see variables'}
                </p>
              </div>
              
              <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                {selectedTemplate && (uniqueVariables.length > 0 || customSubjectVars.length > 0) ? (
                  <div className="space-y-4">
                    {/* Custom Subject Variables Section */}
                    {customSubjectVars.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-base text-slate-700 mb-3 flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-purple-600" />
                          Custom Subject Variables
                        </h4>
                        <p className="text-sm text-slate-600 mb-4">
                          These variables are used in the email subject line
                        </p>
                        <div className="space-y-3">
                          {customSubjectVars.map((varName) => (
                            <div key={varName} className="p-3 bg-white rounded-lg border-2 border-purple-200 shadow-sm hover:border-purple-300 transition-all duration-200 hover:shadow-md">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-mono text-purple-600 font-medium bg-purple-50 px-2 py-1 rounded-md cursor-grab active:cursor-grabbing hover:bg-purple-100 transition-colors inline-flex items-center gap-1">
                                  <GripVertical className="h-3 w-3" />
                                  {`{${varName}}`}
                                </span>
                              </div>
                              <Input
                                id={varName}
                                value={variableValues[varName] || ''}
                                onChange={(e) => handleVariableChange(varName, e.target.value)}
                                placeholder={`Enter value for ${varName}...`}
                                className="h-9 text-sm border-purple-200 focus:border-purple-400 focus:ring-purple-200"
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
                          <h4 className="font-semibold text-base text-slate-700 mb-3 capitalize">
                            {category} Variables
                          </h4>
                          <div className="space-y-3">
                            {categoryVariables.map((variable) => (
                              <div key={variable.key} className="p-3 bg-white rounded-lg border-2 border-slate-200 shadow-sm hover:border-blue-300 transition-all duration-200 hover:shadow-md">
                                <div className="flex items-center justify-between mb-2">
                                  <Label htmlFor={variable.key} className="text-xs font-medium text-slate-700">
                                    {variable.label}
                                  </Label>
                                  <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600 cursor-grab active:cursor-grabbing hover:bg-slate-200 transition-colors inline-flex items-center gap-1">
                                    <GripVertical className="h-3 w-3" />
                                    {`{${variable.key}}`}
                                  </span>
                                </div>
                                <Input
                                  id={variable.key}
                                  value={variableValues[variable.key] || ''}
                                  onChange={(e) => handleVariableChange(variable.key, e.target.value)}
                                  placeholder={variable.placeholder}
                                  className="h-9 text-sm border-slate-200 focus:border-blue-400 focus:ring-blue-200"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
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