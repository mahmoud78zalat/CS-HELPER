import { useDroppable } from "@dnd-kit/core";
import { Textarea } from "@/components/ui/textarea";
import { useState, useRef, useEffect } from "react";

interface DroppableTextareaProps {
  id: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder: string;
  rows?: number;
  required?: boolean;
  className?: string;
  dir?: "ltr" | "rtl";
  onVariableInsert?: (variable: string, position: number) => void;
  onFieldFocus?: (fieldId: string) => void;
}

export default function DroppableTextarea({
  id,
  name,
  value,
  onChange,
  placeholder,
  rows = 8,
  required = false,
  className = "",
  dir = "ltr",
  onVariableInsert,
  onFieldFocus,
}: DroppableTextareaProps) {
  const [isActive, setIsActive] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { isOver, setNodeRef } = useDroppable({
    id: `droppable-${id}`,
    data: {
      accepts: ['variable'],
      fieldType: 'textarea',
      fieldId: id,
    },
  });

  // Track cursor position
  const handleSelectionChange = () => {
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart);
    }
  };

  const handleClick = () => {
    setIsActive(true);
    handleSelectionChange();
  };

  const handleFocus = () => {
    setIsActive(true);
    onFieldFocus?.(id);
  };

  const handleKeyUp = () => {
    handleSelectionChange();
  };

  const handleBlur = () => {
    // Don't immediately deactivate to allow for drag operations
    setTimeout(() => setIsActive(false), 100);
  };

  // Function to insert variable at cursor position
  const insertVariableAtCursor = (variableName: string) => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      // Use the variable name as-is, preserving case sensitivity
      const variable = `{${variableName}}`;
      
      const newValue = value.substring(0, start) + variable + value.substring(end);
      
      // Create synthetic event for onChange
      const syntheticEvent = {
        target: { ...textarea, value: newValue, name },
      } as React.ChangeEvent<HTMLTextAreaElement>;
      
      onChange(syntheticEvent);
      
      // Set cursor position after inserted variable
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
      
      if (onVariableInsert) {
        onVariableInsert(variableName, start);
      }
    }
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener('click', handleClick);
      textarea.addEventListener('focus', handleFocus);
      textarea.addEventListener('keyup', handleKeyUp);
      textarea.addEventListener('blur', handleBlur);
      
      return () => {
        textarea.removeEventListener('click', handleClick);
        textarea.removeEventListener('focus', handleFocus);
        textarea.removeEventListener('keyup', handleKeyUp);
        textarea.removeEventListener('blur', handleBlur);
      };
    }
  }, []);

  return (
    <div 
      ref={setNodeRef} 
      className={`
        relative transition-all duration-200
        ${isOver ? 'ring-2 ring-blue-400 ring-opacity-50 bg-blue-50 dark:bg-blue-950/20' : ''}
        ${isActive ? 'ring-1 ring-blue-300' : ''}
      `}
    >
      {isOver && (
        <div className="absolute inset-0 border-2 border-dashed border-blue-400 bg-gradient-to-r from-blue-50/50 via-blue-100/50 to-indigo-50/50 dark:from-blue-950/30 dark:via-blue-900/30 dark:to-indigo-950/30 rounded-md z-10 flex items-center justify-center animate-pulse">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg border border-blue-300 animate-bounce">
            <span className="mr-2">✨</span>
            Drop variable here
            <span className="ml-2">✨</span>
          </div>
        </div>
      )}
      <Textarea
        ref={textareaRef}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        required={required}
        className={`font-mono text-sm ${className} ${isActive ? 'border-blue-300' : ''}`}
        dir={dir}
        data-droppable-id={`droppable-${id}`}
        data-cursor-position={cursorPosition}
      />
      {isActive && (
        <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-xs">
          Active field
        </div>
      )}
    </div>
  );
}