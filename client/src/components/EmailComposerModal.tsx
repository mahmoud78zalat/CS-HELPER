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
import { Copy, X, Search, Send, Edit3, Sparkles } from "lucide-react";
import { EmailTemplate } from "@shared/schema";

interface EmailComposerModalProps {
  onClose: () => void;
}

// Available template variables organized by category
const TEMPLATE_VARIABLES = {
  customer: [
    { key: "customer_name", label: "Customer Name", placeholder: "John Doe" },
    { key: "customername", label: "Customer Name", placeholder: "John Doe" },
    { key: "CUSTOMER_NAME", label: "Customer Name (Uppercase)", placeholder: "JOHN DOE" },
    { key: "customer_email", label: "Customer Email", placeholder: "john@example.com" },
    { key: "CUSTOMER_EMAIL", label: "Customer Email (Uppercase)", placeholder: "JOHN@EXAMPLE.COM" },
    { key: "customer_phone", label: "Customer Phone", placeholder: "+971501234567" },
    { key: "CUSTOMER_PHONE", label: "Customer Phone (Uppercase)", placeholder: "+971501234567" },
    { key: "customer_address", label: "Customer Address", placeholder: "Dubai, UAE" },
    { key: "gender", label: "Gender", placeholder: "Male/Female" },
    { key: "GENDER", label: "Gender (Uppercase)", placeholder: "MALE/FEMALE" },
  ],
  order: [
    { key: "order_id", label: "Order ID", placeholder: "ORD123456" },
    { key: "ORDER_ID", label: "Order ID (Uppercase)", placeholder: "ORD123456" },
    { key: "awb_number", label: "AWB Number", placeholder: "AWB789012" },
    { key: "AWB_NUMBER", label: "AWB Number (Uppercase)", placeholder: "AWB789012" },
    { key: "order_status", label: "Order Status", placeholder: "Processing" },
    { key: "ORDER_STATUS", label: "Order Status (Uppercase)", placeholder: "PROCESSING" },
    { key: "tracking_number", label: "Tracking Number", placeholder: "TRK345678" },
    { key: "delivery_date", label: "Delivery Date", placeholder: "2025-01-25" },
    { key: "waiting_time", label: "Waiting Time", placeholder: "2-3 business days" },
    { key: "WAITING_TIME", label: "Waiting Time (Uppercase)", placeholder: "2-3 BUSINESS DAYS" },
    { key: "item_name", label: "Item Name", placeholder: "Product Name" },
  ],
  system: [
    { key: "agent_name", label: "Agent Name", placeholder: "Support Agent" },
    { key: "agentname", label: "Agent Name", placeholder: "Support Agent" },
    { key: "AGENTNAME", label: "Agent Name (Uppercase)", placeholder: "SUPPORT AGENT" },
    { key: "concerned_team", label: "Concerned Team", placeholder: "Finance Team" },
    { key: "company_name", label: "Company Name", placeholder: "Brands For Less" },
    { key: "support_email", label: "Support Email", placeholder: "support@brandsforless.com" },
    { key: "business_hours", label: "Business Hours", placeholder: "9 AM - 6 PM, Sun-Thu" },
  ],
  time: [
    { key: "current_date", label: "Current Date", placeholder: "January 23, 2025" },
    { key: "current_time", label: "Current Time", placeholder: "2:30 PM" },
    { key: "time_frame", label: "Time Frame", placeholder: "24-48 hours" },
  ],
  custom: [
    { key: "reason", label: "Reason", placeholder: "Enter reason here..." },
    { key: "REASON", label: "Reason (Uppercase)", placeholder: "ENTER REASON HERE..." },
  ]
};

export default function EmailComposerModal({ onClose }: EmailComposerModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [showVariables, setShowVariables] = useState(false);
  
  // Fetch email templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery<EmailTemplate[]>({
    queryKey: ['/api/email-templates'],
    retry: false,
  });

  // Debug email templates
  console.log('EmailComposer - Templates loaded:', templates);
  console.log('EmailComposer - Templates count:', Array.isArray(templates) ? templates.length : 0);
  console.log('EmailComposer - Templates loading:', templatesLoading);

  const { customerData } = useCustomerData();
  const { user } = useAuth();
  const { toast } = useToast();

  // Initialize variable values with customer data and system defaults - updates in real-time
  useEffect(() => {
    // Get agent name from localStorage (set in Header) or fallback to user data
    const selectedAgentName = localStorage.getItem('selectedAgentName') || 
                              `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
                              user?.email ||
                              'Support Agent';
    
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const currentTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    setVariableValues(prev => {
      const newValues = {
        ...prev,
        // Customer data - updates automatically when customerData changes
        customer_name: customerData.customer_name || '',
        customername: customerData.customer_name || '', // Support [customername] format
        CUSTOMER_NAME: customerData.customer_name || '', // Uppercase version
        customer_email: customerData.customer_email || '',
        CUSTOMER_EMAIL: customerData.customer_email || '', // Uppercase version
        customer_phone: customerData.customer_phone || '',
        CUSTOMER_PHONE: customerData.customer_phone || '', // Uppercase version
        gender: customerData.gender || '',
        GENDER: customerData.gender || '', // Uppercase version
        
        // Order data - updates automatically when customerData changes
        order_id: customerData.order_id || '',
        ORDER_ID: customerData.order_id || '', // Uppercase version
        awb_number: customerData.awb_number || '',
        AWB_NUMBER: customerData.awb_number || '', // Uppercase version
        order_status: customerData.order_status || '',
        ORDER_STATUS: customerData.order_status || '', // Uppercase version
        item_name: customerData.item_name || '',
        delivery_date: customerData.delivery_date || '',
        waiting_time: customerData.waiting_time || '2-3 business days',
        WAITING_TIME: customerData.waiting_time || '2-3 business days', // Uppercase version
        
        // System data
        agent_name: selectedAgentName,
        agentname: selectedAgentName, // Support both formats
        AGENTNAME: selectedAgentName, // Support uppercase
        company_name: 'Brands For Less',
        support_email: 'support@brandsforless.com',
        business_hours: '9 AM - 6 PM, Sunday - Thursday',
        
        // Time data - updates with current time
        current_date: currentDate,
        current_time: currentTime,
        time_frame: '24-48 hours',
        
        // Custom fields - preserve existing values
        reason: prev.reason || '',
        REASON: prev.REASON || '',
      };

      // If a template is selected, immediately update the displayed content with new variable values
      if (selectedTemplate) {
        const newSubject = replaceVariablesWithValues(selectedTemplate.subject || '', newValues);
        const newBody = replaceVariablesWithValues(selectedTemplate.content || '', newValues);
        
        setEmailSubject(newSubject);
        setEmailBody(newBody);
      }

      return newValues;
    });
  }, [customerData, user, selectedTemplate]);

  // Filter templates based on search
  const filteredTemplates = Array.isArray(templates) ? templates.filter((template: EmailTemplate) =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.genre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.concernedTeam.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  // Replace variables in content - supports both {variable} and [variable] patterns
  const replaceVariablesWithValues = (text: string, values: Record<string, string> = variableValues) => {
    if (!text) return '';
    
    let result = text;
    Object.entries(values).forEach(([key, value]) => {
      if (key && value) {
        const patterns = [
          new RegExp(`\\{${key}\\}`, 'g'),
          new RegExp(`\\{${key.toUpperCase()}\\}`, 'g'),
          new RegExp(`\\{${key.toLowerCase()}\\}`, 'g'),
          new RegExp(`\\[${key}\\]`, 'g'),
          new RegExp(`\\[${key.toUpperCase()}\\]`, 'g'),
          new RegExp(`\\[${key.toLowerCase()}\\]`, 'g')
        ];
        patterns.forEach(pattern => {
          result = result.replace(pattern, value);
        });
      }
    });
    return result;
  };

  // Replace variables in content - supports both {variable} and [variable] patterns  
  const replaceVariables = (text: string) => {
    return replaceVariablesWithValues(text, variableValues);
  };



  // Handle template selection - apply live variable replacement immediately
  const handleTemplateSelect = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    
    // Apply variable replacement immediately to show live content
    const replacedSubject = replaceVariables(template.subject || '');
    const replacedBody = replaceVariables(template.content || '');
    
    setEmailSubject(replacedSubject);
    setEmailBody(replacedBody);
    setShowVariables(true);
    
    // Update concerned team in variables
    setVariableValues(prev => ({
      ...prev,
      concerned_team: template.concernedTeam
    }));
  };

  // Handle variable value change - immediately update template content with live values
  const handleVariableChange = (key: string, value: string) => {
    setVariableValues(prev => {
      const newValues = {
        ...prev,
        [key]: value
      };
      
      // Immediately update the template content with new variable values
      if (selectedTemplate) {
        const newSubject = replaceVariablesWithValues(selectedTemplate.subject || '', newValues);
        const newBody = replaceVariablesWithValues(selectedTemplate.content || '', newValues);
        
        setEmailSubject(newSubject);
        setEmailBody(newBody);
      }
      
      return newValues;
    });
  };

  // Get final email content with variables replaced - for preview/copy only
  const getFinalSubject = () => replaceVariables(emailSubject);
  const getFinalBody = () => replaceVariables(emailBody);

  // Extract variables from ORIGINAL template content - this keeps variables always visible
  const getTemplateVariables = (content: string) => {
    const curlyMatches = content.match(/\{(\w+)\}/g) || [];
    const squareMatches = content.match(/\[(\w+)\]/g) || [];
    
    const curlyVars = curlyMatches.map(match => match.slice(1, -1));
    const squareVars = squareMatches.map(match => match.slice(1, -1));
    
    return [...curlyVars, ...squareVars];
  };

  // Extract variables from the ORIGINAL template, not the editing fields
  const getOriginalTemplateVariables = () => {
    if (!selectedTemplate) return [];
    
    const subjectVars = getTemplateVariables(selectedTemplate.subject || '');
    const bodyVars = getTemplateVariables(selectedTemplate.content || '');
    
    return Array.from(new Set([...subjectVars, ...bodyVars]));
  };

  const uniqueVariables = getOriginalTemplateVariables();

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

  const getGenreColor = (genre: string) => {
    const colors = {
      'Urgent': 'red',
      'Standard': 'blue',
      'Follow-up': 'green',
      'Escalation': 'orange',
      'Resolution': 'emerald',
      'Information Request': 'purple',
      'Complaint Handling': 'yellow',
      'Greeting': 'cyan',
      'CSAT': 'indigo',
      'Warning Abusive Language': 'red',
      'Apology': 'amber',
      'Thank You': 'pink',
      'Farewell': 'teal',
      'Confirmation': 'lime',
      'Technical Support': 'violet',
      'Holiday/Special Occasion': 'rose'
    };
    return colors[genre as keyof typeof colors] || 'gray';
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-[98vw] max-h-[98vh] w-[98vw] h-[98vh] overflow-hidden p-0">
        <DialogHeader className="p-6 pb-4 border-b bg-white">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Send className="h-6 w-6" />
              Email Template Composer - Full Screen
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex h-[calc(100vh-120px)] gap-4">
          {/* Left Panel: Template Selection */}
          <div className="w-80 border-r border-slate-200 flex flex-col">
            <div className="p-4 border-b border-slate-200">
              <h3 className="font-semibold mb-3">Email Templates</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  type="text"
                  className="pl-10"
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {templatesLoading ? (
                <div className="text-center py-8 text-slate-500">
                  <p className="text-sm">Loading templates...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTemplates.map((template: EmailTemplate) => (
                    <Card
                      key={template.id}
                      className={`cursor-pointer transition-all hover:border-blue-500 hover:shadow-md ${
                        selectedTemplate?.id === template.id 
                          ? 'border-blue-500 bg-blue-50 shadow-md' 
                          : 'border-slate-200'
                      }`}
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <CardContent className="p-3">
                        <h4 className="font-medium text-slate-800 mb-1">{template.name}</h4>
                        <div className="text-xs text-slate-500 mb-2">
                          To: {template.concernedTeam}
                        </div>
                        <div className="flex gap-1 mb-2">
                          <Badge variant="secondary" className="text-xs">
                            {template.genre}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {template.category}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2">
                          {template.content.substring(0, 80)}...
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {filteredTemplates.length === 0 && !templatesLoading && (
                    <div className="text-center py-8 text-slate-500">
                      <p className="text-sm">No email templates found</p>
                      <p className="text-xs mt-1">
                        {searchTerm ? 'Try adjusting your search terms' : 'Create templates from Admin Panel'}
                      </p>
                      <p className="text-xs mt-2 text-blue-600">
                        Debug: {Array.isArray(templates) ? templates.length : 0} templates loaded
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Middle Panel: Email Composition */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="p-4 border-b border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <Badge className="bg-purple-100 text-purple-700">
                    To: {selectedTemplate?.concernedTeam || 'Select template first'}
                  </Badge>
                  {selectedTemplate && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowVariables(!showVariables)}
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      {showVariables ? 'Hide' : 'Show'} Variables
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopySubject}
                    disabled={!emailSubject}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy Subject
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyBody}
                    disabled={!emailBody}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy Body
                  </Button>
                  <Button
                    onClick={handleCopyEmail}
                    disabled={!emailSubject || !emailBody}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy Complete Email
                  </Button>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="subject" className="text-sm font-medium">Email Subject (Live Updates)</Label>
                  <Input
                    id="subject"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Select a template to see the subject..."
                    className="mt-1 font-mono text-sm"
                  />
                </div>
                
                <div>
                  <Label htmlFor="body" className="text-sm font-medium">Email Content (Live Updates)</Label>
                  <Textarea
                    id="body"
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Select a template to see the content..."
                    rows={18}
                    className="mt-1 font-mono text-sm resize-none"
                  />
                </div>
                
                {selectedTemplate?.warningNote && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                    <p className="text-sm text-yellow-800">
                      ⚠️ {selectedTemplate.warningNote}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel: Variable Management - ALWAYS VISIBLE */}
          <div className="w-80 border-l border-slate-200 flex flex-col bg-blue-50">
            <div className="p-4 border-b border-slate-200 bg-blue-100">
              <h3 className="font-medium flex items-center gap-2 text-blue-800">
                <Edit3 className="h-4 w-4" />
                Live Template Variables
              </h3>
              <p className="text-xs text-blue-600 mt-1">
                Variables found: <span className="font-semibold">{uniqueVariables.length}</span> | Updates live preview
              </p>
            </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                {uniqueVariables.length > 0 ? (
                  <div className="space-y-4">
                    {/* Known Variables */}
                    {Object.entries(TEMPLATE_VARIABLES).map(([category, variables]) => {
                      const categoryVariables = variables.filter(v => 
                        uniqueVariables.includes(v.key)
                      );
                      
                      if (categoryVariables.length === 0) return null;
                      
                      return (
                        <div key={category}>
                          <h4 className="font-medium text-sm text-slate-700 mb-2 capitalize bg-slate-100 px-2 py-1 rounded">
                            {category} Variables
                          </h4>
                          <div className="space-y-3">
                            {categoryVariables.map((variable) => {
                              const hasValue = !!variableValues[variable.key];
                              const isFromCustomerData = ['customer_name', 'customername', 'CUSTOMER_NAME', 'customer_email', 'CUSTOMER_EMAIL', 'customer_phone', 'CUSTOMER_PHONE', 'customer_country', 'gender', 'GENDER', 'order_id', 'ORDER_ID', 'awb_number', 'AWB_NUMBER', 'order_status', 'ORDER_STATUS', 'tracking_number', 'item_name', 'delivery_date', 'waiting_time', 'WAITING_TIME'].includes(variable.key);
                              
                              return (
                                <div key={variable.key} className={`${hasValue ? 'bg-green-50 border border-green-200 rounded p-2' : ''}`}>
                                  <Label htmlFor={variable.key} className={`text-xs font-medium flex items-center gap-2 ${hasValue ? 'text-green-700' : ''}`}>
                                    {variable.label}
                                    {hasValue && <span className="text-xs bg-green-100 px-1 rounded">✓ Active</span>}
                                    {isFromCustomerData && <span className="text-xs bg-blue-100 px-1 rounded">Auto</span>}
                                  </Label>
                                  <Input
                                    id={variable.key}
                                    value={variableValues[variable.key] || ''}
                                    onChange={(e) => handleVariableChange(variable.key, e.target.value)}
                                    placeholder={variable.placeholder}
                                    className={`text-xs mt-1 ${hasValue ? 'border-green-300 bg-white' : ''}`}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Unrecognized Variables */}
                    {(() => {
                      const allKnownVariables = Object.values(TEMPLATE_VARIABLES).flat().map(v => v.key);
                      const unrecognizedVariables = uniqueVariables.filter(v => !allKnownVariables.includes(v));
                      
                      if (unrecognizedVariables.length === 0) return null;
                      
                      return (
                        <div>
                          <h4 className="font-medium text-sm text-slate-700 mb-2 bg-orange-100 px-2 py-1 rounded">
                            Custom Variables
                          </h4>
                          <div className="space-y-3">
                            {unrecognizedVariables.map((variable) => {
                              const hasValue = !!variableValues[variable];
                              
                              return (
                                <div key={variable} className={`${hasValue ? 'bg-orange-50 border border-orange-200 rounded p-2' : ''}`}>
                                  <Label htmlFor={variable} className={`text-xs font-medium flex items-center gap-2 ${hasValue ? 'text-orange-700' : ''}`}>
                                    {variable.toUpperCase()}
                                    {hasValue && <span className="text-xs bg-orange-100 px-1 rounded">✓ Active</span>}
                                    <span className="text-xs bg-orange-100 px-1 rounded">Custom</span>
                                  </Label>
                                  <Input
                                    id={variable}
                                    value={variableValues[variable] || ''}
                                    onChange={(e) => handleVariableChange(variable, e.target.value)}
                                    placeholder={`Enter ${variable.toLowerCase()} here...`}
                                    className={`text-xs mt-1 ${hasValue ? 'border-orange-300 bg-white' : ''}`}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <p className="text-sm">No variables found</p>
                    <p className="text-xs mt-1">Type in the email content to see variables</p>
                  </div>
                )}
              </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
