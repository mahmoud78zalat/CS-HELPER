import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  const [position, setPosition] = useState({ x: window.innerWidth - 440, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const widgetRef = useRef<HTMLDivElement>(null);

  // Optimized mouse move with requestAnimationFrame for smooth dragging
  const throttledMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || isMaximized) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    // Boundary constraints
    const maxX = window.innerWidth - 420;
    const maxY = window.innerHeight - 600;
    
    requestAnimationFrame(() => {
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    });
  }, [isDragging, dragStart, isMaximized]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMaximized) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', throttledMouseMove, { passive: true });
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', throttledMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, throttledMouseMove, handleMouseUp]);

  if (!isOpen) return null;

  // Create the widget content
  const widgetContent = (
    <div 
      ref={widgetRef}
      className={`fixed bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-slate-200 dark:border-gray-700 transition-all duration-300 ${
        isMaximized 
          ? 'w-[95vw] h-[85vh]' 
          : 'w-[420px] h-[600px]'
      } ${!isVisible ? 'invisible opacity-0 pointer-events-none' : 'visible opacity-100'}`}
      style={{
        zIndex: 2147483647, // Maximum z-index value to ensure it's on top
        left: isMaximized ? '2.5vw' : `${position.x}px`,
        top: isMaximized ? '7.5vh' : `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'default',
        transform: isDragging ? 'scale(1.02)' : 'scale(1)', // Slight scale during drag
        transition: isDragging ? 'none' : 'all 0.3s ease',
        pointerEvents: 'auto' // Ensure the widget always receives pointer events
      }}
      // Ensure the widget and its content remain fully interactive
      onPointerDown={(e) => {
        e.stopPropagation();
        // Mark this element as having high z-index for overlay detection
        (e.currentTarget as HTMLElement).setAttribute('data-high-zindex', 'true');
      }}
      onPointerMove={(e) => {
        e.stopPropagation();
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
      }}
      onClick={(e) => {
        e.stopPropagation();
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        // For dragging functionality, we need to allow mouse events through the header
        if (e.target !== e.currentTarget) {
          return; // Let child elements (like the header) handle their own events
        }
      }}
      onMouseMove={(e) => {
        e.stopPropagation();
      }}
      onMouseUp={(e) => {
        e.stopPropagation();
      }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/30 border-b border-slate-200 dark:border-gray-700 rounded-t-lg cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        style={{ userSelect: 'none' }}
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
      <div className="flex-1 rounded-b-lg overflow-hidden" style={{ height: 'calc(100% - 72px)' }}>
        <iframe
          src={ziwoUrl}
          className="w-full h-full border-0"
          title="Ziwo Support"
          allow="microphone; camera; speaker"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
        />
      </div>
    </div>
  );

  // Use createPortal to render outside normal DOM hierarchy
  return createPortal(widgetContent, document.body);
}