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
      
      <div className="flex h-screen pt-20">
        <Sidebar 
          onCheckOrder={onCheckOrder}
          onEmailComposer={onEmailComposer}
          onAdminPanel={onAdminPanel}
          onAbout={onAbout}
        />
        
        <div className="flex-1 flex flex-col">
          {children}
        </div>
      </div>
    </div>
  );
}
