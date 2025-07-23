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
    { key: "agentname", label: "Agent Name", placeholder: "Support Agent" },
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
    { key: "REASON", label: "Reason", placeholder: "Enter reason here..." },
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
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['/api/email-templates'],
    retry: false,
  });

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

    setVariableValues(prev => ({
      ...prev,
      // Customer data - updates automatically when customerData changes
      customer_name: customerData.customer_name || '',
      CUSTOMER_NAME: customerData.customer_name || '', // Uppercase version
      customer_email: customerData.customer_email || '',
      CUSTOMER_EMAIL: customerData.customer_email || '', // Uppercase version
      customer_phone: customerData.customer_phone || '',
      CUSTOMER_PHONE: customerData.customer_phone || '', // Uppercase version
      
      // Order data - updates automatically when customerData changes
      order_id: customerData.order_id || '',
      ORDER_ID: customerData.order_id || '', // Uppercase version
      awb_number: customerData.awb_number || '',
      AWB_NUMBER: customerData.awb_number || '', // Uppercase version
      order_status: customerData.order_status || '',
      ORDER_STATUS: customerData.order_status || '', // Uppercase version
      waiting_time: '2-3 business days',
      WAITING_TIME: '2-3 business days', // Uppercase version
      
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
    }));
  }, [customerData, user]);

  // Filter templates based on search
  const filteredTemplates = Array.isArray(templates) ? templates.filter((template: EmailTemplate) =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.genre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.concernedTeam.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  // Replace variables in template content with case-insensitive matching
  const replaceVariables = (text: string) => {
    return text.replace(/\{(\w+)\}/g, (match, key) => {
      // Try exact match first, then lowercase, then uppercase
      return variableValues[key] || 
             variableValues[key.toLowerCase()] || 
             variableValues[key.toUpperCase()] || 
             match;
    });
  };

  // Handle template selection - directly replace variables in content
  const handleTemplateSelect = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    
    // Apply variable replacement immediately to the template content
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

  // Handle variable value change - update template content immediately
  const handleVariableChange = (key: string, value: string) => {
    setVariableValues(prev => {
      const newValues = {
        ...prev,
        [key]: value
      };
      
      // Immediately update the email content with new variables
      if (selectedTemplate) {
        const newSubject = selectedTemplate.subject?.replace(/\{(\w+)\}/g, (match, varKey) => {
          return newValues[varKey] || 
                 newValues[varKey.toLowerCase()] || 
                 newValues[varKey.toUpperCase()] || 
                 match;
        }) || '';
        
        const newBody = selectedTemplate.content?.replace(/\{(\w+)\}/g, (match, varKey) => {
          return newValues[varKey] || 
                 newValues[varKey.toLowerCase()] || 
                 newValues[varKey.toUpperCase()] || 
                 match;
        }) || '';
        
        setEmailSubject(newSubject);
        setEmailBody(newBody);
      }
      
      return newValues;
    });
  };

  // Get final email content with variables replaced
  const getFinalSubject = () => replaceVariables(emailSubject);
  const getFinalBody = () => replaceVariables(emailBody);

  // Extract variables from template content
  const getTemplateVariables = (content: string) => {
    const matches = content.match(/\{(\w+)\}/g);
    return matches ? matches.map(match => match.slice(1, -1)) : [];
  };

  const allVariables = [...getTemplateVariables(emailSubject), ...getTemplateVariables(emailBody)];
  const uniqueVariables = Array.from(new Set(allVariables));

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
                  <Label htmlFor="subject" className="text-sm font-medium">Subject Line</Label>
                  <Input
                    id="subject"
                    value={getFinalSubject()}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Enter email subject..."
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="body" className="text-sm font-medium">Email Content</Label>
                  <Textarea
                    id="body"
                    value={getFinalBody()}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Enter email content..."
                    rows={16}
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
                Always visible - Updates templates instantly
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
                            {categoryVariables.map((variable) => (
                              <div key={variable.key}>
                                <Label htmlFor={variable.key} className="text-xs font-medium">
                                  {variable.label}
                                </Label>
                                <Input
                                  id={variable.key}
                                  value={variableValues[variable.key] || ''}
                                  onChange={(e) => handleVariableChange(variable.key, e.target.value)}
                                  placeholder={variable.placeholder}
                                  className="text-xs mt-1"
                                />
                              </div>
                            ))}
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
                            {unrecognizedVariables.map((variable) => (
                              <div key={variable}>
                                <Label htmlFor={variable} className="text-xs font-medium">
                                  {variable.toUpperCase()}
                                </Label>
                                <Input
                                  id={variable}
                                  value={variableValues[variable] || ''}
                                  onChange={(e) => handleVariableChange(variable, e.target.value)}
                                  placeholder={`Enter ${variable.toLowerCase()} here...`}
                                  className="text-xs mt-1"
                                />
                              </div>
                            ))}
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
