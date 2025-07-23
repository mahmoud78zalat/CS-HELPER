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
import { useEffect, useState } from "react";

interface TemplateCardProps {
  template: Template;
}

export default function TemplateCard({ template }: TemplateCardProps) {
  const { customerData } = useCustomerData();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [refreshKey, setRefreshKey] = useState(0);

  // Force re-render when customer data changes to ensure live updates
  useEffect(() => {
    setRefreshKey(prev => prev + 1);
  }, [customerData]);

  const usageMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', `/api/templates/${template.id}/use`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
    },
  });

  const handleCopyTemplate = () => {
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
      
      // System data
      concerned_team: template.concernedTeam || '',
      time_frame: customerData.waiting_time || '2-3 business days',
      current_date: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      company_name: 'Brands For Less',
      COMPANY_NAME: 'Brands For Less',
      support_email: 'support@brandsforless.com',
      business_hours: '9 AM - 6 PM, Sunday - Thursday',
      
      // Custom fields
      reason: '',
      REASON: '',
    };

    // For live reply templates (chat), only copy content without subject
    const processedContent = replaceVariables(template.content || '', variables);
    
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
      key={`template-${template.id}-${refreshKey}`}
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
        
        <div className="text-sm text-slate-600">
          <div className="text-xs bg-slate-50 p-3 rounded border-l-2 border-blue-500">
            {(() => {
              const selectedAgentName = localStorage.getItem('selectedAgentName') || 
                                        `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
                                        user?.email ||
                                        'Support Agent';
              
              const variables = {
                // Customer name with ALL possible variants
                customer_name: customerData.customer_name || '',
                CUSTOMER_NAME: customerData.customer_name || '',
                customername: customerData.customer_name || '',
                CUSTOMERNAME: customerData.customer_name || '',
                CustomerName: customerData.customer_name || '',
                
                // Email variants
                customer_email: customerData.customer_email || '',
                CUSTOMER_EMAIL: customerData.customer_email || '',
                customeremail: customerData.customer_email || '',
                CUSTOMEREMAIL: customerData.customer_email || '',
                
                // Phone variants
                customer_phone: customerData.customer_phone || '',
                CUSTOMER_PHONE: customerData.customer_phone || '',
                customerphone: customerData.customer_phone || '',
                CUSTOMERPHONE: customerData.customer_phone || '',
                
                // Country variants
                customer_country: customerData.customer_country || '',
                CUSTOMER_COUNTRY: customerData.customer_country || '',
                customercountry: customerData.customer_country || '',
                CUSTOMERCOUNTRY: customerData.customer_country || '',
                
                // Gender variants
                gender: customerData.gender || '',
                GENDER: customerData.gender || '',
                
                // Order data with all variants
                order_id: customerData.order_id || '',
                ORDER_ID: customerData.order_id || '',
                orderid: customerData.order_id || '',
                ORDERID: customerData.order_id || '',
                order_number: customerData.order_number || '',
                ORDER_NUMBER: customerData.order_number || '',
                ordernumber: customerData.order_number || '',
                ORDERNUMBER: customerData.order_number || '',
                
                // AWB variants
                awb_number: customerData.awb_number || '',
                AWB_NUMBER: customerData.awb_number || '',
                awbnumber: customerData.awb_number || '',
                AWBNUMBER: customerData.awb_number || '',
                awb: customerData.awb_number || '',
                AWB: customerData.awb_number || '',
                
                // Item variants
                item_name: customerData.item_name || '',
                ITEM_NAME: customerData.item_name || '',
                itemname: customerData.item_name || '',
                ITEMNAME: customerData.item_name || '',
                
                // Delivery variants
                delivery_date: customerData.delivery_date || '',
                DELIVERY_DATE: customerData.delivery_date || '',
                deliverydate: customerData.delivery_date || '',
                DELIVERYDATE: customerData.delivery_date || '',
                
                // Waiting time variants
                waiting_time: customerData.waiting_time || '',
                WAITING_TIME: customerData.waiting_time || '',
                waitingtime: customerData.waiting_time || '',
                WAITINGTIME: customerData.waiting_time || '',
                
                // Agent data with all variants
                agent_name: selectedAgentName,
                AGENT_NAME: selectedAgentName,
                agentname: selectedAgentName,
                AGENTNAME: selectedAgentName,
                AgentName: selectedAgentName,
                
                // System data
                company_name: 'Brands For Less',
                COMPANY_NAME: 'Brands For Less',
                companyname: 'Brands For Less',
                COMPANYNAME: 'Brands For Less',
                
                // Time data
                current_date: new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }),
                current_time: new Date().toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                }),
                
                // Custom fields
                reason: '',
                REASON: '',
              };

              const processedContent = replaceVariables(template.content || '', variables);
              const display = processedContent.slice(0, 200);
              return display + (processedContent.length > 200 ? '...' : '');
            })()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
