import { ReactNode } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { AnnouncementBanner } from "./AnnouncementBanner";

interface LayoutProps {
  children: ReactNode;
  onCheckOrder: () => void;
  onEmailComposer: () => void;
  onAdminPanel: () => void;
  onAbout: () => void;
  onFAQ: () => void;
  onOpenPersonalNotes?: () => void;
  onCallScripts: () => void;
  onStoreEmails: () => void;
}

export default function Layout({ 
  children, 
  onCheckOrder, 
  onEmailComposer, 
  onAdminPanel, 
  onAbout,
  onFAQ,
  onOpenPersonalNotes,
  onCallScripts,
  onStoreEmails
}: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <AnnouncementBanner />
      <Header 
        onEmailComposer={onEmailComposer}
        onAdminPanel={onAdminPanel}
        onAbout={onAbout}
        onFAQ={onFAQ}
      />
      
      {/* Responsive layout with sidebar always visible */}
      <div className="flex h-screen pt-16 lg:pt-20">
        {/* Sidebar - Always visible, responsive width */}
        <div className="w-16 lg:w-80">
          <Sidebar 
            onCheckOrder={onCheckOrder}
            onEmailComposer={onEmailComposer}
            onAdminPanel={onAdminPanel}
            onAbout={onAbout}
            onOpenPersonalNotes={onOpenPersonalNotes}
            onCallScripts={onCallScripts}
            onStoreEmails={onStoreEmails}
          />
        </div>
        
        {/* Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
