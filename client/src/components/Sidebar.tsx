import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import CustomerInfoPanel from "./CustomerInfoPanel";
import OrderConverterPanel from "./OrderConverterPanel";
import AdditionalInfoPanel from "./AdditionalInfoPanel";
import { 
  User, 
  ArrowLeftRight, 
  Info, 
  Search, 
  Mail, 
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight
} from "lucide-react";

interface SidebarProps {
  onCheckOrder: () => void;
  onEmailComposer: () => void;
  onAdminPanel: () => void;
  onAbout: () => void;
}

export default function Sidebar({ 
  onCheckOrder, 
  onEmailComposer, 
  onAdminPanel, 
  onAbout 
}: SidebarProps) {
  const { user } = useAuth();
  const [expandedPanel, setExpandedPanel] = useState<string | null>(null);

  const togglePanel = (panelId: string) => {
    setExpandedPanel(expandedPanel === panelId ? null : panelId);
  };

  const handleSignOut = () => {
    window.location.href = '/api/logout';
  };

  return (
    <div className="bg-white shadow-lg border-r border-slate-200 transition-all duration-300 w-80">
      <div className="p-6">
        <nav className="space-y-2">
          {/* Customer Info Panel */}
          <div className="customer-panel">
            <Button
              variant="ghost"
              className="w-full justify-between p-3 text-left hover:bg-slate-50 rounded-lg transition-colors duration-200 border border-slate-200"
              onClick={() => togglePanel('customer-info')}
            >
              <div className="flex items-center space-x-3">
                <User className="h-4 w-4 text-blue-500" />
                <span className="font-medium text-slate-700">Customer Info</span>
              </div>
              <ChevronRight 
                className={`h-4 w-4 transition-transform duration-200 ${
                  expandedPanel === 'customer-info' ? 'rotate-90' : ''
                }`} 
              />
            </Button>
            
            {expandedPanel === 'customer-info' && (
              <div className="mt-2">
                <CustomerInfoPanel />
              </div>
            )}
          </div>

          {/* Order Converter Panel */}
          <div className="order-panel">
            <Button
              variant="ghost"
              className="w-full justify-between p-3 text-left hover:bg-slate-50 rounded-lg transition-colors duration-200 border border-slate-200"
              onClick={() => togglePanel('order-converter')}
            >
              <div className="flex items-center space-x-3">
                <ArrowLeftRight className="h-4 w-4 text-blue-500" />
                <span className="font-medium text-slate-700">Order Converter</span>
              </div>
              <ChevronRight 
                className={`h-4 w-4 transition-transform duration-200 ${
                  expandedPanel === 'order-converter' ? 'rotate-90' : ''
                }`} 
              />
            </Button>
            
            {expandedPanel === 'order-converter' && (
              <div className="mt-2">
                <OrderConverterPanel />
              </div>
            )}
          </div>

          {/* Additional Info Panel */}
          <div className="additional-panel">
            <Button
              variant="ghost"
              className="w-full justify-between p-3 text-left hover:bg-slate-50 rounded-lg transition-colors duration-200 border border-slate-200"
              onClick={() => togglePanel('additional-info')}
            >
              <div className="flex items-center space-x-3">
                <Info className="h-4 w-4 text-blue-500" />
                <span className="font-medium text-slate-700">Additional Info</span>
              </div>
              <ChevronRight 
                className={`h-4 w-4 transition-transform duration-200 ${
                  expandedPanel === 'additional-info' ? 'rotate-90' : ''
                }`} 
              />
            </Button>
            
            {expandedPanel === 'additional-info' && (
              <div className="mt-2">
                <AdditionalInfoPanel />
              </div>
            )}
          </div>

          {/* Check Order Button */}
          <Button
            variant="ghost"
            className="w-full justify-start p-3 text-left hover:bg-slate-50 rounded-lg transition-colors duration-200 border border-slate-200"
            onClick={onCheckOrder}
          >
            <Search className="h-4 w-4 text-blue-500 mr-3" />
            <span className="font-medium text-slate-700">Check Order</span>
          </Button>

          {/* Navigation Links */}
          <div className="pt-4 border-t border-slate-200 mt-4 space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start p-3 text-left hover:bg-slate-50 rounded-lg transition-colors duration-200"
              onClick={onEmailComposer}
            >
              <Mail className="h-4 w-4 text-slate-500 mr-3" />
              <span className="text-slate-700">Email Composer</span>
            </Button>
            
            {user?.role === 'admin' && (
              <Button
                variant="ghost"
                className="w-full justify-start p-3 text-left hover:bg-slate-50 rounded-lg transition-colors duration-200"
                onClick={onAdminPanel}
              >
                <Settings className="h-4 w-4 text-slate-500 mr-3" />
                <span className="text-slate-700">Admin Panel</span>
              </Button>
            )}
          </div>

          {/* Bottom Links */}
          <div className="pt-4 border-t border-slate-200 mt-4 space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start p-3 text-left hover:bg-slate-50 rounded-lg transition-colors duration-200"
              onClick={onAbout}
            >
              <HelpCircle className="h-4 w-4 text-slate-500 mr-3" />
              <span className="text-slate-700">About Tool</span>
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-start p-3 text-left hover:bg-red-50 text-red-600 rounded-lg transition-colors duration-200"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-3" />
              <span>Sign Out</span>
            </Button>
          </div>
        </nav>
      </div>
    </div>
  );
}
