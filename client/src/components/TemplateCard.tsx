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
import { useEffect, useState, useMemo } from "react";

interface TemplateCardProps {
  template: Template;
}

export default function TemplateCard({ template }: TemplateCardProps) {
  const { customerData } = useCustomerData();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Use useMemo to compute processed content without causing re-renders
  const processedContent = useMemo(() => {
    const selectedAgentName = localStorage.getItem('selectedAgentName') || 
                              `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
                              user?.email ||
                              'Support Agent';
    
    const variables = {
      ...customerData,
      // Customer data with uppercase variants
      customer_name: customerData.customer_name || '',
      CUSTOMER_NAME: customerData.customer_name || '',
      customer_email: customerData.customer_email || '',
      CUSTOMER_EMAIL: customerData.customer_email || '',
      customer_phone: customerData.customer_phone || '',
      CUSTOMER_PHONE: customerData.customer_phone || '',
      
      // Order data with uppercase variants
      order_id: customerData.order_id || '',
      ORDER_ID: customerData.order_id || '',
      awb_number: customerData.awb_number || '',
      AWB_NUMBER: customerData.awb_number || '',
      
      // Agent data with all variants
      agent_name: selectedAgentName,
      AGENT_NAME: selectedAgentName,
      agentname: selectedAgentName,
      AGENTNAME: selectedAgentName,
      
      // System data (only for email templates)
      concerned_team: '',
      time_frame: customerData.waiting_time || '2-3 business days',
      current_date: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      current_time: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      }),
    };

    // Determine which content to use based on language
    const currentLanguage = customerData.language || 'en';
    const rawContent = currentLanguage === 'ar' && template.contentAr 
      ? template.contentAr 
      : template.contentEn || template.content;

    // Replace variables with error handling
    return replaceVariables(rawContent || '', variables);
  }, [customerData, user, template]);

  // Function to replace variables in template name
  const replaceVariablesInTemplateName = (name: string) => {
    const variables = {
      ...customerData,
      customer_name: customerData.customer_name || '',
      order_id: customerData.order_id || '',
      awb_number: customerData.awb_number || '',
      agent_name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Support Agent',
    };
    return replaceVariables(name, variables);
  };

  const usageMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', `/api/templates/${template.id}/use`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
    },
  });

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(processedContent);
    
    toast({
      title: "Success",
      description: "Template copied with live customer data!",
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
              <Badge variant="outline" className="text-xs px-2 py-1">
                🌐 Bilingual
              </Badge>
            </div>
          </div>
          {user?.role === 'admin' && (
            <div className="text-xs text-slate-500 mt-2 lg:mt-0 lg:ml-2 flex-shrink-0">
              Used {template.usageCount} times
            </div>
          )}
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
        
        {/* LIVE Template Preview with Real Customer Data */}
        <div className="text-sm text-slate-600 mb-3 leading-relaxed">
          <div className="text-xs bg-slate-50 p-3 rounded border-l-2 border-blue-500">
            <div className="font-medium text-slate-700 mb-2">Live Preview:</div>
            <div className="whitespace-pre-wrap">{processedContent}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
