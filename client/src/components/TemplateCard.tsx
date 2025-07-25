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
import { getGenreBadgeClasses, getCategoryBadgeClasses } from '@/lib/templateColors';

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
      // Customer data with all variants
      customer_name: customerData.customer_name || customerData.customername || '',
      customername: customerData.customer_name || customerData.customername || '',
      CUSTOMER_NAME: (customerData.customer_name || customerData.customername || '').toUpperCase(),
      CUSTOMERNAME: (customerData.customer_name || customerData.customername || '').toUpperCase(),
      customerfirstname: customerData.customerfirstname || (customerData.customer_name || '').split(' ')[0] || '',
      customerlastname: customerData.customerlastname || (customerData.customer_name || '').split(' ').slice(1).join(' ') || '',
      CUSTOMERFIRSTNAME: (customerData.customerfirstname || (customerData.customer_name || '').split(' ')[0] || '').toUpperCase(),
      CUSTOMERLASTNAME: (customerData.customerlastname || (customerData.customer_name || '').split(' ').slice(1).join(' ') || '').toUpperCase(),
      
      customer_email: customerData.customer_email || '',
      CUSTOMER_EMAIL: (customerData.customer_email || '').toUpperCase(),
      customer_phone: customerData.customer_phone || '',
      CUSTOMER_PHONE: customerData.customer_phone || '',
      
      // Order data with uppercase variants
      order_id: customerData.order_id || '',
      ORDER_ID: customerData.order_id || '',
      awb_number: customerData.awb_number || '',
      AWB_NUMBER: customerData.awb_number || '',
      
      // Agent data with all variants
      agent_name: customerData.agent_name || selectedAgentName,
      agentname: customerData.agentname || selectedAgentName,
      AGENT_NAME: (customerData.agent_name || selectedAgentName).toUpperCase(),
      AGENTNAME: (customerData.agentname || selectedAgentName).toUpperCase(),
      agentfirstname: customerData.agentfirstname || (user?.firstName || selectedAgentName.split(' ')[0] || ''),
      agentlastname: customerData.agentlastname || (user?.lastName || selectedAgentName.split(' ').slice(1).join(' ') || ''),
      AGENTFIRSTNAME: (customerData.agentfirstname || user?.firstName || selectedAgentName.split(' ')[0] || '').toUpperCase(),
      AGENTLASTNAME: (customerData.agentlastname || user?.lastName || selectedAgentName.split(' ').slice(1).join(' ') || '').toUpperCase(),
      agent_email: customerData.agent_email || user?.email || '',
      // Arabic agent data
      agentarabicname: `${customerData.agentarabicfirstname || ''} ${customerData.agentarabiclastname || ''}`.trim(),
      agentarabicfirstname: customerData.agentarabicfirstname || '',
      agentarabiclastname: customerData.agentarabiclastname || '',
      AGENTARABICNAME: `${customerData.agentarabicfirstname || ''} ${customerData.agentarabiclastname || ''}`.trim().toUpperCase(),
      AGENTARABICFIRSTNAME: (customerData.agentarabicfirstname || '').toUpperCase(),
      AGENTARABICLASTNAME: (customerData.agentarabiclastname || '').toUpperCase(),
      
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
      : template.contentEn;

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
      if (!user?.id) {
        throw new Error('User ID is required to record template usage');
      }
      await apiRequest('POST', `/api/templates/${template.id}/use`, { userId: user.id });
    },
    onMutate: async () => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['/api/templates'] });

      // Snapshot the previous value
      const previousTemplates = queryClient.getQueryData(['/api/templates']);

      // Optimistically update the usage count immediately
      queryClient.setQueryData(['/api/templates'], (old: Template[] | undefined) => {
        if (!old) return old;
        return old.map(t => 
          t.id === template.id 
            ? { ...t, usageCount: (t.usageCount || 0) + 1 }
            : t
        );
      });

      // Return context with previous value
      return { previousTemplates };
    },
    onError: (err, variables, context) => {
      // If mutation fails, rollback to the previous value
      if (context?.previousTemplates) {
        queryClient.setQueryData(['/api/templates'], context.previousTemplates);
      }
    },
    onSuccess: () => {
      // Refetch to ensure consistency with server
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



  return (
    <Card 
      className="template-card bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-3 lg:p-4 hover:shadow-lg hover:border-blue-500 dark:hover:border-blue-400 cursor-pointer transition-all duration-200 active:scale-95 active:shadow-sm"
      onClick={handleCopyTemplate}
    >
      <CardContent className="p-0">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-semibold text-slate-800 dark:text-white text-sm lg:text-base leading-tight">{replaceVariablesInTemplateName(template.name)}</h4>
            <div className="flex items-center flex-wrap gap-1 lg:gap-2 mt-2">
              <Badge variant="secondary" className={`${getGenreBadgeClasses(template.genre)} text-xs px-2 py-1 border`}>
                {template.genre}
              </Badge>
              <Badge variant="secondary" className={`${getCategoryBadgeClasses(template.category)} text-xs px-2 py-1 border`}>
                {template.category}
              </Badge>
              <Badge variant="outline" className="text-xs px-2 py-1">
                🌐 Bilingual
              </Badge>
            </div>
          </div>
        </div>



        {/* Dynamic Variables */}
        {template.variables && template.variables.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Variables:</p>
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
        <div className="text-sm text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
          <div className="text-xs bg-slate-50 dark:bg-slate-700 p-3 rounded border-l-2 border-blue-500 dark:border-blue-400">
            <div className="font-medium text-slate-700 dark:text-slate-200 mb-2">Live Preview:</div>
            <div className="whitespace-pre-wrap text-slate-600 dark:text-slate-300">{processedContent}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
