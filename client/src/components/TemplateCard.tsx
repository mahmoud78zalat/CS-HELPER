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
    // Show warning if exists
    const warningNote = template.warningNote || 
      TEMPLATE_WARNING_PRESETS[template.category] || 
      TEMPLATE_WARNING_PRESETS[template.genre];
      
    if (warningNote && !confirm(`⚠️ TEMPLATE WARNING:\n\n${warningNote}\n\nDo you want to proceed with copying this template?`)) {
      return;
    }

    const agentName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
    const variables = {
      ...customerData,
      agent_name: agentName,
      concerned_team: template.concernedTeam,
    };

    const processedSubject = replaceVariables(template.subject, variables);
    const processedContent = replaceVariables(template.content, variables);
    
    const fullTemplate = `Subject: ${processedSubject}\n\n${processedContent}`;

    navigator.clipboard.writeText(fullTemplate);
    
    toast({
      title: "Success",
      description: "Template copied to clipboard!",
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
      className="template-card bg-white rounded-lg shadow-sm border border-slate-200 p-4 hover:shadow-md hover:border-blue-500 cursor-pointer transition-all duration-200"
      onClick={handleCopyTemplate}
    >
      <CardContent className="p-0">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-semibold text-slate-800">{template.name}</h4>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant="secondary" className={`bg-${getGenreColor(template.genre)}-100 text-${getGenreColor(template.genre)}-700`}>
                {template.genre}
              </Badge>
              <Badge variant="secondary" className={`bg-${getCategoryColor(template.category)}-100 text-${getCategoryColor(template.category)}-700`}>
                {template.category}
              </Badge>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                {template.concernedTeam}
              </Badge>
            </div>
          </div>
          <div className="text-xs text-slate-500">
            Used {template.usageCount} times
          </div>
        </div>

        {/* Warning Note */}
        {(template.warningNote || TEMPLATE_WARNING_PRESETS[template.category] || TEMPLATE_WARNING_PRESETS[template.genre]) && (
          <Alert variant="destructive" className="mb-3">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {template.warningNote || TEMPLATE_WARNING_PRESETS[template.category] || TEMPLATE_WARNING_PRESETS[template.genre]}
            </AlertDescription>
          </Alert>
        )}

        {/* Dynamic Variables */}
        {template.variables && template.variables.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-medium text-slate-600 mb-1">Variables:</p>
            <div className="flex flex-wrap gap-1">
              {template.variables.slice(0, 3).map((variable) => (
                <Badge key={variable} variant="outline" className="text-xs px-2 py-0">
                  [{variable}]
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
          <div className="font-medium mb-2">
            Subject: {template.subject}
          </div>
          <div className="text-xs bg-slate-50 p-3 rounded border-l-2 border-blue-500">
            {template.content.slice(0, 200)}
            {template.content.length > 200 && '...'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
