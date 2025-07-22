import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Headphones, Mail, Settings, Info, LogOut } from "lucide-react";

interface HeaderProps {
  onEmailComposer: () => void;
  onAdminPanel: () => void;
  onAbout: () => void;
}

export default function Header({ onEmailComposer, onAdminPanel, onAbout }: HeaderProps) {
  const { user } = useAuth();

  const handleSignOut = () => {
    window.location.href = '/api/logout';
  };

  return (
    <header className="bg-white shadow-sm border-b border-slate-200 fixed top-0 left-0 right-0 z-40">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Logo and Title */}
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Headphones className="text-white text-lg" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">BFL Customer Service Helper</h1>
              <p className="text-sm text-slate-600">
                Welcome back, {user?.firstName || 'User'}
              </p>
            </div>
          </div>

          {/* Right: Action Buttons and User */}
          <div className="flex items-center space-x-4">
            <Button 
              onClick={onEmailComposer}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-200"
            >
              <Mail className="w-4 h-4 mr-2" />
              Email Composer
            </Button>
            
            {user?.role === 'admin' && (
              <Button 
                onClick={onAdminPanel}
                variant="secondary"
                className="bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors duration-200"
              >
                <Settings className="w-4 h-4 mr-2" />
                Admin Panel
              </Button>
            )}

            <Button 
              onClick={onAbout}
              variant="outline"
              className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors duration-200"
            >
              <Info className="w-4 h-4 mr-2" />
              About Tool
            </Button>

            {/* User Badge */}
            <div className="flex items-center space-x-3 pl-4 border-l border-slate-200">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-800">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    user?.role === 'admin' 
                      ? 'text-blue-600 bg-blue-50' 
                      : 'text-green-600 bg-green-50'
                  }`}>
                    {user?.role === 'admin' ? 'Admin' : 'Agent'}
                  </span>
                </div>
              </div>
              <Button
                onClick={handleSignOut}
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
