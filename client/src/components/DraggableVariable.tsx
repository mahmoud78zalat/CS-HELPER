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
        group p-3 border rounded-lg cursor-pointer transition-all duration-200 
        border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800
        hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 
        dark:hover:from-slate-700 dark:hover:to-slate-600
        hover:border-blue-300 dark:hover:border-blue-500
        hover:shadow-md hover:scale-[1.02] transform
        ${isDragging ? 'opacity-80 z-50 shadow-2xl bg-blue-50 border-blue-400 scale-105 rotate-2' : ''}
        ${isDraggedOver ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}
      `}
      onClick={() => onInsert(variable.name)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            {...listeners}
            {...attributes}
            className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-blue-500 dark:text-slate-500 dark:hover:text-blue-400 transition-colors touch-none group-hover:text-blue-500"
          >
            <GripHorizontal className="h-4 w-4" />
          </div>
          <Badge variant="secondary" className="text-xs font-mono bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 group-hover:bg-blue-100 dark:group-hover:bg-blue-900 transition-colors">
            {"{" + variable.name + "}"}
          </Badge>
        </div>
        <Plus size={12} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
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