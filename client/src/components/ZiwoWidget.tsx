import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Phone, X, Minimize2, Maximize2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ZiwoWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  ziwoUrl?: string;
}

export default function ZiwoWidget({ isOpen, onClose, ziwoUrl = 'https://demo.ziwo.io/en-us/' }: ZiwoWidgetProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={`p-0 ${
          isMaximized 
            ? 'max-w-[95vw] max-h-[95vh] w-[95vw] h-[95vh]' 
            : isMinimized 
              ? 'max-w-[400px] max-h-[200px] w-[400px] h-[200px]'
              : 'max-w-[900px] max-h-[700px] w-[900px] h-[700px]'
        } transition-all duration-300`}
      >
        <DialogHeader className="flex flex-row items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/30 border-b">
          <DialogTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <Phone className="w-5 h-5" />
            Ziwo Support Platform
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsMinimized(!isMinimized)}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 hover:bg-emerald-100 dark:hover:bg-emerald-800/40"
            >
              <Minimize2 className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => setIsMaximized(!isMaximized)}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 hover:bg-emerald-100 dark:hover:bg-emerald-800/40"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
            <Button
              onClick={onClose}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        
        {!isMinimized && (
          <div className="flex-1 p-4">
            <div className="w-full h-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden border">
              <iframe
                src={ziwoUrl}
                className="w-full h-full border-0"
                title="Ziwo Support Platform"
                allow="microphone; camera; geolocation"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
              />
            </div>
          </div>
        )}
        
        {isMinimized && (
          <div className="flex-1 p-4 flex items-center justify-center">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <Phone className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Ziwo Support is minimized</p>
              <p className="text-xs">Click maximize to restore</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}