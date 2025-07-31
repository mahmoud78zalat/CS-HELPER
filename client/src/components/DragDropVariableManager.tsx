import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash, GripHorizontal, Code } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Variable {
  id: string;
  name: string;
  value: string;
  category: string;
  description?: string;
  order?: number;
  isActive: boolean;
}

interface DragDropVariableManagerProps {
  variables: Variable[];
  onEdit: (variable: Variable) => void;
  onDelete: (variableId: string) => void;
}

// Sortable Variable Item Component
const SortableVariableItem = ({ variable, onEdit, onDelete }: {
  variable: Variable;
  onEdit: (variable: Variable) => void;
  onDelete: (variableId: string) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: variable.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'customer': 'bg-blue-50 text-blue-700 border-blue-200',
      'order': 'bg-green-50 text-green-700 border-green-200',
      'system': 'bg-purple-50 text-purple-700 border-purple-200',
      'time': 'bg-orange-50 text-orange-700 border-orange-200',
      'default': 'bg-gray-50 text-gray-700 border-gray-200'
    };
    return colors[category.toLowerCase()] || colors.default;
  };

  return (
    <Card 
      ref={setNodeRef} 
      style={style} 
      className={`${isDragging ? 'shadow-lg z-50' : ''} ${!variable.isActive ? 'opacity-60' : ''} hover:shadow-md transition-shadow`}
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
                <div className="flex items-center gap-2 mb-1">
                  <Code className="h-4 w-4 text-gray-500" />
                  <h4 className="font-mono text-sm font-medium text-slate-800">
                    {`{{${variable.name}}}`}
                  </h4>
                  {!variable.isActive && (
                    <Badge variant="secondary" className="text-xs">Disabled</Badge>
                  )}
                </div>
                
                <div className="mb-2">
                  <Badge className={`text-xs ${getCategoryColor(variable.category)}`}>
                    {variable.category}
                  </Badge>
                </div>
                
                {variable.description && (
                  <p className="text-xs text-slate-600 mb-2">{variable.description}</p>
                )}
                
                <div className="bg-gray-50 rounded px-2 py-1">
                  <p className="text-xs font-mono text-gray-700 line-clamp-1">
                    {variable.value}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-1 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(variable)}
                  title="Edit Variable"
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(variable.id)}
                  className="text-red-600 hover:text-red-700"
                  title="Delete Variable"
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

export default function DragDropVariableManager({ variables, onEdit, onDelete }: DragDropVariableManagerProps) {
  const [items, setItems] = useState(variables);
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
    mutationFn: async (orderedItems: Variable[]) => {
      const updates = orderedItems.map((item, index) => ({
        id: item.id,
        order: index
      }));
      
      return apiRequest('POST', '/api/template-variables/reorder', { updates });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/template-variables'] });
      toast({ title: "Variable order saved successfully" });
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

  // Update items when variables prop changes
  useState(() => {
    if (variables.length > 0) {
      setItems(variables);
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
          {items.map((variable) => (
            <SortableVariableItem
              key={variable.id}
              variable={variable}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}