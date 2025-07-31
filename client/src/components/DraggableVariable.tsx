import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { Plus, GripHorizontal } from "lucide-react";

interface DraggableVariableProps {
  variable: {
    id?: string;
    name: string;
    description: string;
    category: string;
    example: string;
  };
  onInsert: (variableName: string) => void;
}

export default function DraggableVariable({ variable, onInsert }: DraggableVariableProps) {
  const [isDraggedOver, setIsDraggedOver] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `variable-${variable.name}`,
    data: {
      type: 'variable',
      variableName: variable.name,
    },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        p-3 border rounded-lg cursor-pointer transition-all duration-200
        ${isDragging ? 'opacity-50 z-50 shadow-lg bg-white border-blue-400' : 'hover:bg-muted/50'}
        ${isDraggedOver ? 'ring-2 ring-blue-400' : ''}
      `}
      onClick={() => onInsert(variable.name)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            {...listeners}
            {...attributes}
            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors touch-none"
          >
            <GripHorizontal className="h-4 w-4" />
          </div>
          <Badge variant="secondary" className="text-xs font-mono">
            {variable.name}
          </Badge>
        </div>
        <Plus size={12} className="text-gray-400" />
      </div>
      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
        {variable.description}
      </p>
      <p className="text-xs text-blue-600">
        e.g., {variable.example}
      </p>
    </div>
  );
}