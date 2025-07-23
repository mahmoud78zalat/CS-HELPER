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
import { Copy, X, Search, Send, Edit3, Sparkles, Plus } from "lucide-react";
import { EmailTemplate } from "@shared/schema";

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

// Allowed variables for email subject field (strictly limited)
const SUBJECT_VARIABLES = [
  { key: "ordernumber", label: "Order Number", placeholder: "ORD123456" },
  { key: "AWB", label: "AWB Number", placeholder: "AWB789012" },
  { key: "customernumber", label: "Customer Number", placeholder: "CUST001" },
];

export default function EmailComposerModal({ onClose }: EmailComposerModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [showVariables, setShowVariables] = useState(false);
  const [showSubjectVariables, setShowSubjectVariables] = useState(false);
  
  // Fetch email templates
  const { data: templates } = useQuery({
    queryKey: ['/api/email-templates'],
    queryFn: () => apiRequest('GET', '/api/email-templates?isActive=true'),
  });

  const { customerData } = useCustomerData();
  const { user } = useAuth();
  const { toast } = useToast();

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
  const filteredTemplates = (templates as EmailTemplate[])?.filter((template: EmailTemplate) =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.genre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.concernedTeam.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

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

  // Insert variable into subject at cursor position
  const insertSubjectVariable = (variable: string) => {
    const subjectInput = document.getElementById('emailSubject') as HTMLInputElement;
    const cursorPosition = subjectInput?.selectionStart || emailSubject.length;
    const beforeCursor = emailSubject.substring(0, cursorPosition);
    const afterCursor = emailSubject.substring(cursorPosition);
    const newSubject = beforeCursor + `{${variable}}` + afterCursor;
    setEmailSubject(newSubject);
    setShowSubjectVariables(false);
  };

  // Handle template selection
  const handleTemplateSelect = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setEmailSubject(template.subject || '');
    setEmailBody(template.content || '');
    setShowVariables(true);
    
    // Update concerned team in variables
    setVariableValues(prev => ({
      ...prev,
      concerned_team: template.concernedTeam
    }));
  };

  // Handle variable value change
  const handleVariableChange = (key: string, value: string) => {
    setVariableValues(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Get final email content with variables replaced
  const getFinalSubject = () => replaceSubjectVariables(emailSubject);
  const getFinalBody = () => replaceVariables(emailBody);

  // Extract variables from template content
  const getTemplateVariables = (content: string) => {
    const matches = content.match(/\{(\w+)\}/g);
    return matches ? matches.map(match => match.slice(1, -1)) : [];
  };

  // Get custom dynamic variables from subject (not in predefined SUBJECT_VARIABLES)
  const getCustomSubjectVariables = (subject: string) => {
    const subjectVars = getTemplateVariables(subject);
    const predefinedKeys = SUBJECT_VARIABLES.map(v => v.key);
    return subjectVars.filter(varName => !predefinedKeys.includes(varName));
  };

  const allVariables = [...getTemplateVariables(emailSubject), ...getTemplateVariables(emailBody)];
  const uniqueVariables = Array.from(new Set(allVariables));
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

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Email Template Composer
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

        <div className="flex h-[calc(100vh-200px)] gap-4">
          {/* Left Panel: Template Selection */}
          <div className="w-80 border-r border-slate-200 flex flex-col">
            <div className="p-4 border-b border-slate-200">
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
              <div className="space-y-3">
                {filteredTemplates.map((template: EmailTemplate) => (
                  <Card
                    key={template.id}
                    className={`cursor-pointer transition-colors hover:border-blue-500 ${
                      selectedTemplate?.id === template.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-slate-200'
                    }`}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <CardContent className="p-3">
                      <h4 className="font-medium text-slate-800 mb-1">{template.name}</h4>
                      <div className="text-xs text-slate-500 mb-2">
                        To: {template.concernedTeam}
                      </div>
                      <div className="flex gap-1">
                        <Badge variant="secondary" className="text-xs">
                          {template.genre}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {template.category}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {filteredTemplates.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <p className="text-sm">No templates found</p>
                  <p className="text-xs mt-1">Try adjusting your search terms</p>
                </div>
              )}
            </div>
          </div>

          {/* Middle Panel: Email Composition */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-slate-200">
              <div className="flex items-center gap-4 mb-4">
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
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="emailSubject">Subject</Label>
                    <div className="relative">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSubjectVariables(!showSubjectVariables)}
                        className="text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Variable
                      </Button>
                      
                      {showSubjectVariables && (
                        <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg p-2 z-50 min-w-48">
                          <p className="text-xs text-slate-600 mb-2 font-medium">Subject Variables (limited)</p>
                          <div className="space-y-1">
                            {SUBJECT_VARIABLES.map((variable) => (
                              <button
                                key={variable.key}
                                onClick={() => insertSubjectVariable(variable.key)}
                                className="w-full text-left px-2 py-1 text-xs hover:bg-slate-100 rounded flex justify-between items-center"
                              >
                                <span className="font-mono text-blue-600">{`{${variable.key}}`}</span>
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
                    className="mt-1"
                  />
                  <div className="mt-1 text-xs text-slate-500">
                    Preview: {getFinalSubject() || 'No subject entered'}
                  </div>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={handleCopySubject}
                    disabled={!emailSubject}
                    className="text-xs p-0 mt-1"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy Subject
                  </Button>
                </div>
                
                <div>
                  <Label htmlFor="body">Email Body</Label>
                  <Textarea
                    id="body"
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Select a template to populate content..."
                    rows={12}
                    className="mt-1 font-mono text-sm"
                  />
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="link"
                      size="sm"
                      onClick={handleCopyBody}
                      disabled={!emailBody}
                      className="text-xs p-0"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy Body
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleCopyEmail}
                      disabled={!emailSubject || !emailBody}
                      className="text-xs"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy Complete Email
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Panel */}
            <div className="flex-1 p-4 bg-slate-50 overflow-y-auto">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Email Preview (with variables replaced)
              </h3>
              
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-medium text-slate-700">Subject:</h4>
                      <p className="text-sm">{getFinalSubject() || 'No subject set'}</p>
                    </div>
                    
                    {selectedTemplate?.warningNote && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                        <p className="text-sm text-yellow-800">
                          ⚠️ {selectedTemplate.warningNote}
                        </p>
                      </div>
                    )}
                    
                    <div className="border rounded p-4 bg-white">
                      <pre className="whitespace-pre-wrap text-sm">
                        {getFinalBody() || 'No content yet...'}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Panel: Variable Management */}
          {showVariables && (
            <div className="w-80 border-l border-slate-200 flex flex-col">
              <div className="p-4 border-b border-slate-200">
                <h3 className="font-medium flex items-center gap-2">
                  <Edit3 className="h-4 w-4" />
                  Template Variables
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Fill in values for variables used in this template
                </p>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                {(uniqueVariables.length > 0 || customSubjectVars.length > 0) ? (
                  <div className="space-y-4">
                    {/* Custom Subject Variables Section */}
                    {customSubjectVars.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm text-slate-700 mb-2 flex items-center gap-2">
                          <Sparkles className="h-3 w-3" />
                          Custom Subject Variables
                        </h4>
                        <p className="text-xs text-slate-500 mb-3">
                          These variables are used in the email subject line
                        </p>
                        <div className="space-y-2">
                          {customSubjectVars.map((varName) => (
                            <div key={varName}>
                              <Label htmlFor={varName} className="text-xs font-mono text-purple-600">
                                {`{${varName}}`}
                              </Label>
                              <Input
                                id={varName}
                                value={variableValues[varName] || ''}
                                onChange={(e) => handleVariableChange(varName, e.target.value)}
                                placeholder={`Enter value for ${varName}...`}
                                className="text-xs border-purple-200 focus:border-purple-400"
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
                              <div key={variable.key}>
                                <Label htmlFor={variable.key} className="text-xs">
                                  {variable.label}
                                </Label>
                                <Input
                                  id={variable.key}
                                  value={variableValues[variable.key] || ''}
                                  onChange={(e) => handleVariableChange(variable.key, e.target.value)}
                                  placeholder={variable.placeholder}
                                  className="text-xs"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <p className="text-sm">No variables found</p>
                    <p className="text-xs mt-1">Select a template with variables to see inputs</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}