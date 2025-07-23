import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCustomerData } from "@/hooks/useCustomerData";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { replaceVariables, extractVariablesFromTemplate, TEMPLATE_WARNING_PRESETS } from "@/lib/templateUtils";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Template } from "@shared/schema";

interface TemplateCardProps {
  template: Template;
}

export default function TemplateCard({ template }: TemplateCardProps) {
  const { customerData } = useCustomerData();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const usageMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', `/api/templates/${template.id}/use`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
    },
  });

  const handleCopyTemplate = () => {
    const agentName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
    const variables = {
      ...customerData,
      agent_name: agentName,
      concerned_team: template.concernedTeam || '',
      // Add more dynamic variables
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

    // For live reply templates (chat), only copy content without subject
    const processedContent = replaceVariables(template.content || '', variables);
    
    navigator.clipboard.writeText(processedContent);
    
    toast({
      title: "Success",
      description: "Live chat reply copied to clipboard!",
    });

    // Record usage
    usageMutation.mutate();
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Order Issues': 'blue',
      'Delivery Problems': 'orange',
      'Payment Issues': 'yellow', 
      'Product Complaints': 'red',
      'Returns & Refunds': 'indigo',
      'Technical Support': 'green',
      'General Inquiry': 'gray',
      'Escalation': 'red'
    };
    return colors[category as keyof typeof colors] || 'gray';
  };

  const getGenreColor = (genre: string) => {
    const colors = {
      'Urgent': 'red',
      'Standard': 'blue',
      'Follow-up': 'green', 
      'Escalation': 'orange',
      'Resolution': 'emerald',
      'Information Request': 'purple',
      'Complaint Handling': 'yellow'
    };
    return colors[genre as keyof typeof colors] || 'gray';
  };

  return (
    <Card 
      className="template-card bg-white rounded-lg shadow-sm border border-slate-200 p-3 lg:p-4 hover:shadow-lg hover:border-blue-500 cursor-pointer transition-all duration-200 active:scale-95 active:shadow-sm"
      onClick={handleCopyTemplate}
    >
      <CardContent className="p-0">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-semibold text-slate-800 text-sm lg:text-base leading-tight">{template.name}</h4>
            <div className="flex items-center flex-wrap gap-1 lg:gap-2 mt-2">
              <Badge variant="secondary" className={`bg-${getGenreColor(template.genre)}-100 text-${getGenreColor(template.genre)}-700 text-xs px-2 py-1`}>
                {template.genre}
              </Badge>
              <Badge variant="secondary" className={`bg-${getCategoryColor(template.category)}-100 text-${getCategoryColor(template.category)}-700 text-xs px-2 py-1`}>
                {template.category}
              </Badge>
            </div>
          </div>
          <div className="text-xs text-slate-500 mt-2 lg:mt-0 lg:ml-2 flex-shrink-0">
            Used {template.usageCount} times
          </div>
        </div>



        {/* Dynamic Variables */}
        {template.variables && template.variables.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-medium text-slate-600 mb-1">Variables:</p>
            <div className="flex flex-wrap gap-1">
              {template.variables.slice(0, 3).map((variable) => (
                <Badge key={variable} variant="outline" className="text-xs px-2 py-0">
                  {`{${variable}}`}
                </Badge>
              ))}
              {template.variables.length > 3 && (
                <Badge variant="outline" className="text-xs px-2 py-0">
                  +{template.variables.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}
        
        <div className="text-sm text-slate-600">
          <div className="text-xs bg-slate-50 p-3 rounded border-l-2 border-blue-500">
            {template.content && template.content.slice(0, 200)}
            {template.content && template.content.length > 200 && '...'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
