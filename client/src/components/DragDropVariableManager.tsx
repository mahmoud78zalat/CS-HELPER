import { useState, useEffect } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { arrayMove } from "@dnd-kit/sortable";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Edit2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface TemplateVariable {
  id: string;
  name: string;
  description: string;
  category: string;
  example: string;
  defaultValue?: string;
  isSystem: boolean;
  order?: number;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface SortableVariableItemProps {
  variable: TemplateVariable;
  onEdit: (variable: TemplateVariable) => void;
  onDelete: (variable: TemplateVariable) => void;
}

function SortableVariableItem({ variable, onEdit, onDelete }: SortableVariableItemProps) {
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

  return (
    <div ref={setNodeRef} style={style} className="touch-none">
      <Card className={`transition-all duration-200 ${isDragging ? 'shadow-lg z-50' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {/* Drag Handle */}
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors"
            >
              <GripVertical className="h-5 w-5" />
            </div>

            {/* Variable Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-sm truncate">{variable.name}</h3>
                {variable.isSystem && (
                  <Badge variant="secondary" className="text-xs">System</Badge>
                )}
              </div>
              <p className="text-xs text-gray-600 mb-2 line-clamp-2">{variable.description}</p>
              <div className="flex items-center gap-2 text-xs">
                <Badge variant="outline" className="text-xs">{variable.category}</Badge>
                <span className="text-gray-500">Example: {variable.example}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(variable)}
                className="h-8 w-8 p-0"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              {!variable.isSystem && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(variable)}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface DragDropVariableManagerProps {
  variables: TemplateVariable[];
  onEdit: (variable: TemplateVariable) => void;
  onDelete: (variable: TemplateVariable) => void;
}

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
    mutationFn: async (orderedItems: TemplateVariable[]) => {
      const updates = orderedItems.map((item, index) => ({
        id: item.id,
        order: index
      }));
      
      return apiRequest('POST', '/api/template-variables/reorder', { updates });
    },
    onSuccess: () => {
      // Invalidate all template variables cache keys to ensure real-time sync
      queryClient.invalidateQueries({ queryKey: ['template-variables'] });
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

  // Update items when variables prop changes
  useEffect(() => {
    if (variables.length > 0) {
      // Sort variables by order property and ensure they have order
      const sortedVariables = [...variables]
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((v, index) => ({ 
          ...v, 
          order: v.order !== undefined ? v.order : index 
        }));
      setItems(sortedVariables);
    }
  }, [variables]);

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