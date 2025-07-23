import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useCustomerData } from "@/hooks/useCustomerData";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { replaceVariables } from "@/lib/templateUtils";
import { Copy, X } from "lucide-react";
import { EmailTemplate } from "@shared/schema";

interface EmailComposerModalProps {
  onClose: () => void;
}

export default function EmailComposerModal({ onClose }: EmailComposerModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  
  // Fetch email templates (not live reply templates)
  const { data: templates } = useQuery({
    queryKey: ['/api/email-templates'],
    queryFn: () => apiRequest('GET', '/api/email-templates?isActive=true'),
  });
  const { customerData } = useCustomerData();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleTemplateSelect = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    
    const agentName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
    const variables = {
      ...customerData,
      agent_name: agentName,
      concerned_team: template.concernedTeam,
    };

    // Add more comprehensive variable mapping
    const enhancedVariables = {
      ...variables,
      time_frame: customerData.waiting_time || '2-3 business days',
      current_date: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      company_name: 'Brands For Less',
      support_email: 'support@brandsforless.com',
      business_hours: '9 AM - 6 PM, Sunday - Thursday'
    };

    setEmailSubject(replaceVariables(template.subject || '', enhancedVariables));
    setEmailBody(replaceVariables(template.content || '', enhancedVariables));
  };

  const handleCopySubject = () => {
    navigator.clipboard.writeText(emailSubject);
    toast({
      title: "Success",
      description: "Subject copied to clipboard!",
    });
  };

  const handleCopyBody = () => {
    navigator.clipboard.writeText(emailBody);
    toast({
      title: "Success", 
      description: "Email body copied to clipboard!",
    });
  };

  const handleCopyFullEmail = () => {
    const fullEmail = `Subject: ${emailSubject}\n\n${emailBody}`;
    navigator.clipboard.writeText(fullEmail);
    toast({
      title: "Success",
      description: "Full email copied to clipboard!",
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
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[95vh] overflow-hidden">
        <div className="flex h-full">
          {/* Left Panel: Templates */}
          <div className="w-1/3 border-r border-slate-200 flex flex-col">
            {/* Fixed Search Header */}
            <div className="p-6 border-b border-slate-200 bg-white sticky top-0 z-10">
              <div className="flex items-center justify-between mb-4">
                <DialogHeader>
                  <DialogTitle>Email Templates</DialogTitle>
                </DialogHeader>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  type="text"
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Search email templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            {/* Scrollable Templates List */}
            <div className="flex-1 overflow-y-auto">
              {!filteredTemplates?.length ? (
                <div className="text-center py-8 text-slate-500">
                  <p className="text-sm">No templates found</p>
                  <p className="text-xs mt-1">Try adjusting your search terms</p>
                </div>
              ) : (
                <div className="space-y-3 p-4">
                  {filteredTemplates.map((template) => (
                    <div
                      key={template.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedTemplate?.id === template.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-slate-200 hover:border-blue-500'
                      }`}
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <h4 className="font-medium text-slate-800">{template.name}</h4>
                      <div className="text-xs text-slate-500 mt-1">To: {template.concernedTeam}</div>
                      <Badge 
                        variant="secondary" 
                        className={`mt-2 bg-${getGenreColor(template.genre)}-100 text-${getGenreColor(template.genre)}-700`}
                      >
                        {template.genre}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Email Composition */}
          <div className="flex-1 p-6 flex flex-col">
            <div className="mb-4">
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-sm font-medium text-slate-700">Concerned Team:</span>
                <Badge className="bg-purple-100 text-purple-700">
                  {selectedTemplate?.concernedTeam || 'No template selected'}
                </Badge>
              </div>
            </div>

            <div className="space-y-4 flex-1">
              <div>
                <Label htmlFor="email-subject" className="text-sm font-medium text-slate-700 mb-2">
                  Subject
                </Label>
                <Input
                  id="email-subject"
                  type="text"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Select a template to auto-populate"
                />
                <Button
                  variant="link"
                  size="sm"
                  onClick={handleCopySubject}
                  className="text-xs text-blue-500 hover:underline mt-1 p-0"
                  disabled={!emailSubject}
                >
                  Copy Subject
                </Button>
              </div>

              <div className="flex-1 flex flex-col">
                <Label htmlFor="email-body" className="text-sm font-medium text-slate-700 mb-2">
                  Email Body
                </Label>
                <div className="flex-1 flex flex-col">
                  <Textarea
                    id="email-body"
                    className="flex-1 min-h-[300px] w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Select a template to auto-populate"
                  />
                  <Button
                    variant="link"
                    size="sm"
                    onClick={handleCopyBody}
                    className="text-xs text-blue-500 hover:underline mt-1 p-0 self-start"
                    disabled={!emailBody}
                  >
                    Copy Body
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 pt-4 border-t border-slate-200">
              <Button 
                onClick={handleCopyFullEmail}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg hover:shadow-lg transition-all duration-200"
                disabled={!emailSubject || !emailBody}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Full Email
              </Button>
              <Button 
                variant="outline"
                onClick={onClose}
                className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
