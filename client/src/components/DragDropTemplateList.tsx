import { useState, useEffect } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GripVertical } from "lucide-react";
import { useCustomerData } from "@/hooks/useCustomerData";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { replaceVariables } from "@/lib/templateUtils";
import { getGenreBadgeClasses, getCategoryBadgeClasses } from '@/lib/templateColors';
import { Template } from "@shared/schema";

interface DragDropTemplateListProps {
  templates: Template[];
  groupName: string;
  onReorder: (newOrder: string[]) => void;
}

// Sortable Template Item Component
const SortableTemplateItem = ({ template }: { template: Template }) => {
  const { customerData } = useCustomerData();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: template.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Process template content with variables
  const processedContent = (() => {
    const selectedAgentName = localStorage.getItem('selectedAgentName') || 
                              `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
                              user?.email ||
                              'Support Agent';
    
    const variables = {
      ...customerData,
      customer_name: customerData.customer_name || customerData.customername || '',
      customername: customerData.customer_name || customerData.customername || '',
      order_id: customerData.order_id || '',
      awb_number: customerData.awb_number || '',
      agent_name: customerData.agent_name || selectedAgentName,
      agentname: customerData.agentname || selectedAgentName,
    };

    const currentLanguage = customerData.language || 'en';
    const rawContent = currentLanguage === 'ar' && template.contentAr 
      ? template.contentAr 
      : template.contentEn;

    return replaceVariables(rawContent || '', variables);
  })();

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(processedContent);
    toast({
      title: "Success",
      description: "Template copied with live customer data!",
    });
  };

  return (
    <Card 
      ref={setNodeRef} 
      style={style}
      className={`template-card bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-blue-500 dark:hover:border-blue-400 cursor-pointer transition-all duration-200 ${isDragging ? 'shadow-lg z-50' : ''}`}
      onClick={handleCopyTemplate}
    >
      <CardContent className="p-3 lg:p-4">
        <div className="flex items-start gap-3">
          <div 
            {...attributes} 
            {...listeners} 
            className="cursor-grab active:cursor-grabbing mt-1 p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
            onClick={(e) => e.stopPropagation()} // Prevent template click when dragging
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-semibold text-slate-800 dark:text-white text-sm lg:text-base leading-tight">
                  {replaceVariables(template.name, { 
                    customer_name: customerData.customer_name || '',
                    order_id: customerData.order_id || '',
                    awb_number: customerData.awb_number || '',
                    agent_name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Support Agent',
                  })}
                </h4>
                <div className="flex items-center flex-wrap gap-1 lg:gap-2 mt-2">
                  <Badge variant="secondary" className={`${getGenreBadgeClasses(template.genre)} text-xs px-2 py-1 border`}>
                    {template.genre}
                  </Badge>
                  <Badge variant="secondary" className={`${getCategoryBadgeClasses(template.category)} text-xs px-2 py-1 border`}>
                    {template.category}
                  </Badge>
                  {template.usageCount !== undefined && template.usageCount > 0 && (
                    <Badge variant="outline" className="text-xs px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300">
                      {template.usageCount}x used
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
              {processedContent.substring(0, 200)}
              {processedContent.length > 200 ? '...' : ''}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function DragDropTemplateList({ templates, groupName, onReorder }: DragDropTemplateListProps) {
  const [items, setItems] = useState(templates);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setItems((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over?.id);
        
        const newOrder = arrayMove(items, oldIndex, newIndex);
        
        // Call the reorder callback with new template IDs order
        onReorder(newOrder.map(template => template.id));
        
        return newOrder;
      });
    }
  };

  // Update items when templates prop changes
  useEffect(() => {
    setItems(templates);
  }, [templates]);

  if (!templates.length) return null;

  return (
    <div className="space-y-3">
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={items.map(template => template.id)}
          strategy={verticalListSortingStrategy}
        >
          {items.map((template) => (
            <SortableTemplateItem key={template.id} template={template} />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}