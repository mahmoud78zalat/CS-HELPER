import { ReactNode } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";

interface LayoutProps {
  children: ReactNode;
  onCheckOrder: () => void;
  onEmailComposer: () => void;
  onAdminPanel: () => void;
  onAbout: () => void;
}

export default function Layout({ 
  children, 
  onCheckOrder, 
  onEmailComposer, 
  onAdminPanel, 
  onAbout 
}: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header 
        onEmailComposer={onEmailComposer}
        onAdminPanel={onAdminPanel}
        onAbout={onAbout}
      />
      
      {/* Mobile-responsive layout */}
      <div className="flex flex-col lg:flex-row h-screen pt-16 lg:pt-20">
        {/* Sidebar - Hidden on mobile, shown on larger screens */}
        <div className="hidden lg:block">
          <Sidebar 
            onCheckOrder={onCheckOrder}
            onEmailComposer={onEmailComposer}
            onAdminPanel={onAdminPanel}
            onAbout={onAbout}
          />
        </div>
        
        {/* Main content area - Full width on mobile */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 lg:p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
