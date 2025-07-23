import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import CustomerInfoPanel from "./CustomerInfoPanel";
import OrderConverterPanel from "./OrderConverterPanel";
import AdditionalInfoPanel from "./AdditionalInfoPanel";
import PersonalNotes from "./PersonalNotes";
import { 
  User, 
  ArrowLeftRight, 
  Info, 
  Search, 
  HelpCircle,
  LogOut,
  ChevronRight,
  StickyNote
} from "lucide-react";

interface SidebarProps {
  onCheckOrder: () => void;
  onAbout: () => void;
}

export default function Sidebar({ 
  onCheckOrder, 
  onAbout 
}: SidebarProps) {
  const { user, signOut } = useAuth();
  const [expandedPanel, setExpandedPanel] = useState<string | null>(null);

  const togglePanel = (panelId: string) => {
    setExpandedPanel(expandedPanel === panelId ? null : panelId);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="bg-white shadow-lg border-r border-slate-200 transition-all duration-300 w-16 lg:w-80 overflow-hidden">
      <div className="p-2 lg:p-6">
        <nav className="space-y-2">
          {/* Customer Info Panel */}
          <div className="customer-panel">
            <Button
              variant="ghost"
              className="w-full justify-between p-2 lg:p-3 text-left hover:bg-slate-50 rounded-lg transition-colors duration-200 border border-slate-200"
              onClick={() => togglePanel('customer-info')}
            >
              <div className="flex items-center space-x-3">
                <User className="h-4 w-4 text-blue-500" />
                <span className="hidden lg:block font-medium text-slate-700">Customer Info</span>
              </div>
              <ChevronRight 
                className={`hidden lg:block h-4 w-4 transition-transform duration-200 ${
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
              className="w-full justify-between p-2 lg:p-3 text-left hover:bg-slate-50 rounded-lg transition-colors duration-200 border border-slate-200"
              onClick={() => togglePanel('order-converter')}
            >
              <div className="flex items-center space-x-3">
                <ArrowLeftRight className="h-4 w-4 text-blue-500" />
                <span className="hidden lg:block font-medium text-slate-700">Order Converter</span>
              </div>
              <ChevronRight 
                className={`hidden lg:block h-4 w-4 transition-transform duration-200 ${
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
              className="w-full justify-between p-2 lg:p-3 text-left hover:bg-slate-50 rounded-lg transition-colors duration-200 border border-slate-200"
              onClick={() => togglePanel('additional-info')}
            >
              <div className="flex items-center space-x-3">
                <Info className="h-4 w-4 text-blue-500" />
                <span className="hidden lg:block font-medium text-slate-700">Additional Info</span>
              </div>
              <ChevronRight 
                className={`hidden lg:block h-4 w-4 transition-transform duration-200 ${
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

          {/* Personal Notes Panel */}
          <div className="notes-panel">
            <Button
              variant="ghost"
              className="w-full justify-between p-2 lg:p-3 text-left hover:bg-slate-50 rounded-lg transition-colors duration-200 border border-slate-200"
              onClick={() => togglePanel('personal-notes')}
            >
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                  <StickyNote className="h-2 w-2 text-white" />
                </div>
                <span className="hidden lg:block font-medium text-slate-700">Notes ✦</span>
              </div>
              <ChevronRight 
                className={`hidden lg:block h-4 w-4 transition-transform duration-200 ${
                  expandedPanel === 'personal-notes' ? 'rotate-90' : ''
                }`} 
              />
            </Button>
            
            {expandedPanel === 'personal-notes' && (
              <div className="mt-2">
                <PersonalNotes />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 space-y-2">
            <Button 
              onClick={onCheckOrder}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-2 lg:p-3 transition-colors duration-200 shadow-sm"
            >
              <div className="flex items-center justify-center lg:justify-start space-x-3">
                <Search className="h-4 w-4" />
                <span className="hidden lg:block font-medium">Check Order</span>
              </div>
            </Button>



            <Button 
              onClick={onAbout}
              variant="outline"
              className="w-full border-slate-300 hover:bg-slate-50 rounded-lg p-2 lg:p-3 transition-colors duration-200"
            >
              <div className="flex items-center justify-center lg:justify-start space-x-3">
                <HelpCircle className="h-4 w-4 text-slate-600" />
                <span className="hidden lg:block font-medium text-slate-700">About</span>
              </div>
            </Button>

            <Button 
              onClick={handleSignOut}
              variant="outline"
              className="w-full border-red-300 hover:bg-red-50 text-red-600 rounded-lg p-2 lg:p-3 transition-colors duration-200"
            >
              <div className="flex items-center justify-center lg:justify-start space-x-3">
                <LogOut className="h-4 w-4" />
                <span className="hidden lg:block font-medium">Sign Out</span>
              </div>
            </Button>
          </div>
        </nav>
      </div>
    </div>
  );
}
