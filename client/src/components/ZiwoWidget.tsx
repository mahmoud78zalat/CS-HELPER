import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Phone, X, Maximize2, Move } from "lucide-react";

interface ZiwoWidgetProps {
  isOpen: boolean;
  isVisible: boolean;
  onClose: () => void;
  ziwoUrl?: string;
}

export default function ZiwoWidget({ isOpen, isVisible, onClose, ziwoUrl = 'https://app.ziwo.io/auth/account' }: ZiwoWidgetProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const widgetRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMaximized) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || isMaximized) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    // Boundary constraints
    const maxX = window.innerWidth - 420;
    const maxY = window.innerHeight - 600;
    
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  if (!isOpen) return null;

  return (
    <div 
      ref={widgetRef}
      className={`fixed bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-slate-200 dark:border-gray-700 transition-all duration-300 ${
        isMaximized 
          ? 'w-[95vw] h-[85vh] left-[2.5vw] top-[7.5vh]' 
          : 'w-[420px] h-[600px]'
      } ${!isVisible ? 'invisible opacity-0 pointer-events-none' : 'visible opacity-100'}`}
      style={{
        zIndex: 999999, // Much higher than any modal
        left: isMaximized ? '2.5vw' : `${position.x || window.innerWidth - 440}px`,
        top: isMaximized ? '7.5vh' : `${position.y || 80}px`,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/30 border-b border-slate-200 dark:border-gray-700 rounded-t-lg cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
          <Phone className="w-5 h-5" />
          <span className="font-medium">Ziwo Support</span>
          {!isMaximized && <Move className="w-4 h-4 opacity-50" />}
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsMaximized(!isMaximized)}
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 hover:bg-emerald-100 dark:hover:bg-emerald-800/40"
            title={isMaximized ? "Restore" : "Maximize"}
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
          <Button
            onClick={onClose}
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
            title="Close"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Content */}
      <div className="w-full h-[calc(100%-64px)] bg-white dark:bg-gray-800 rounded-b-lg overflow-hidden">
        <iframe
          src={ziwoUrl}
          className="w-full h-full border-0"
          title="Ziwo Support Platform"
          allow="microphone; camera; geolocation; clipboard-read; clipboard-write"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
        />
      </div>
    </div>
  );
}