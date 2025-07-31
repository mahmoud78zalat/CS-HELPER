import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash, GripHorizontal } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EmailTemplate {
  id: string;
  name: string;
  category: string;
  genre: string;
  concernedTeam: string;
  subject: string;
  content: string;
  order?: number;
}

interface DragDropEmailTemplatesProps {
  templates: EmailTemplate[];
  onEdit: (template: EmailTemplate) => void;
  onDelete: (templateId: string) => void;
}

// Sortable Email Template Item Component
const SortableEmailTemplateItem = ({ template, onEdit, onDelete }: {
  template: EmailTemplate;
  onEdit: (template: EmailTemplate) => void;
  onDelete: (templateId: string) => void;
}) => {
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

  return (
    <Card 
      ref={setNodeRef} 
      style={style} 
      className={`${isDragging ? 'shadow-lg z-50' : ''} hover:shadow-md transition-shadow`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div 
            {...attributes} 
            {...listeners} 
            className="cursor-grab active:cursor-grabbing mt-2 p-1 hover:bg-gray-100 rounded"
          >
            <GripHorizontal className="h-4 w-4 text-gray-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-slate-800 mb-1">{template.name}</h4>
                <p className="text-sm text-slate-600 mb-2">{template.subject}</p>
                
                <div className="flex gap-2 mb-2">
                  <Badge variant="secondary" className="text-xs">
                    {template.genre}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {template.category}
                  </Badge>
                  <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">
                    To: {template.concernedTeam}
                  </Badge>
                </div>
                
                <p className="text-xs text-slate-500 line-clamp-2">
                  {template.content && template.content.length > 0 ? 
                    template.content.substring(0, 120) + (template.content.length > 120 ? '...' : '') : 
                    'No content available'
                  }
                </p>
              </div>
              
              <div className="flex gap-1 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(template)}
                  title="Edit Template"
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(template.id)}
                  className="text-red-600 hover:text-red-700"
                  title="Delete Template"
                >
                  <Trash className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function DragDropEmailTemplates({ templates, onEdit, onDelete }: DragDropEmailTemplatesProps) {
  const [items, setItems] = useState(templates);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Save order mutation
  const saveOrderMutation = useMutation({
    mutationFn: async (orderedItems: EmailTemplate[]) => {
      const updates = orderedItems.map((item, index) => ({
        id: item.id,
        order: index
      }));
      
      return apiRequest('POST', '/api/email-templates/reorder', { updates });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-templates'] });
      toast({ title: "Email template order saved successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to save order", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = items.findIndex(item => item.id === active.id);
      const newIndex = items.findIndex(item => item.id === over.id);
      
      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);
      
      // Save the new order
      saveOrderMutation.mutate(newItems);
    }
  };

  // Update items when templates prop changes
  useState(() => {
    if (templates.length > 0) {
      setItems(templates);
    }
  });

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {items.map((template) => (
            <SortableEmailTemplateItem
              key={template.id}
              template={template}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}