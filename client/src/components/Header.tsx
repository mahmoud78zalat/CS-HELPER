import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { Headphones, Mail, Settings, Info, LogOut, Edit3 } from "lucide-react";
import { useState, useEffect } from "react";

interface HeaderProps {
  onEmailComposer: () => void;
  onAdminPanel: () => void;
  onAbout: () => void;
}

export default function Header({ onEmailComposer, onAdminPanel, onAbout }: HeaderProps) {
  const { user, signOut } = useAuth();
  const [agentName, setAgentName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);

  // Initialize agent name from user data
  useEffect(() => {
    const name = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 
                 user?.email || 
                 'User';
    setAgentName(name);
  }, [user]);

  // Save agent name to localStorage for use in templates
  useEffect(() => {
    if (agentName) {
      localStorage.setItem('selectedAgentName', agentName);
    }
  }, [agentName]);

  const handleSignOut = () => {
    window.location.href = '/api/logout';
  };

  const handleNameSave = () => {
    setIsEditingName(false);
    localStorage.setItem('selectedAgentName', agentName);
  };

  // Check if user is admin
  const isAdmin = user?.role === 'admin' || 
                  user?.email === 'mahmoud78zalat@gmail.com';

  return (
    <header className="bg-white shadow-sm border-b border-slate-200 fixed top-0 left-0 right-0 z-40">
      <div className="px-3 lg:px-6 py-3 lg:py-4">
        <div className="flex items-center justify-between">
          {/* Left: Logo and Title */}
          <div className="flex items-center space-x-2 lg:space-x-4">
            <div className="w-8 lg:w-10 h-8 lg:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Headphones className="text-white text-sm lg:text-lg" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg lg:text-xl font-bold text-slate-800">BFL Customer Service</h1>
              <div className="flex items-center gap-2">
                <p className="text-xs lg:text-sm text-slate-600">Agent:</p>
                {isEditingName ? (
                  <div className="flex items-center gap-1">
                    <Input
                      value={agentName}
                      onChange={(e) => setAgentName(e.target.value)}
                      className="h-6 text-xs w-32"
                      onBlur={handleNameSave}
                      onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                      autoFocus
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="text-xs lg:text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    {agentName}
                    <Edit3 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
            <div className="sm:hidden">
              <h1 className="text-base font-bold text-slate-800">BFL CS</h1>
            </div>
          </div>

          {/* Right: Action Buttons and User - Mobile responsive */}
          <div className="flex items-center space-x-1 lg:space-x-4">
            {/* Mobile - Show icons only */}
            <div className="flex lg:hidden space-x-1">
              <Button 
                onClick={onEmailComposer}
                size="sm"
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-2 rounded-lg hover:shadow-lg transition-all duration-200"
              >
                <Mail className="w-4 h-4" />
              </Button>
              
              {isAdmin && (
                <Button 
                  onClick={onAdminPanel}
                  size="sm"
                  variant="secondary"
                  className="bg-slate-600 text-white p-2 rounded-lg hover:bg-slate-700 transition-colors duration-200"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              )}

              <Button 
                onClick={onAbout}
                size="sm"
                variant="outline"
                className="bg-slate-100 text-slate-700 p-2 rounded-lg hover:bg-slate-200 transition-colors duration-200"
              >
                <Info className="w-4 h-4" />
              </Button>
            </div>

            {/* Desktop - Show with text */}
            <div className="hidden lg:flex space-x-4">
              <Button 
                onClick={onEmailComposer}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-200"
              >
                <Mail className="w-4 h-4 mr-2" />
                Email Composer
              </Button>
              
              {isAdmin && (
                <Button 
                  onClick={onAdminPanel}
                  variant="secondary"
                  className="bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors duration-200"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Admin Panel
                </Button>
              )}


            </div>

            {/* User Badge - Responsive */}
            <div className="flex items-center space-x-2 lg:space-x-3 pl-2 lg:pl-4 border-l border-slate-200">
              <div className="flex items-center space-x-1 lg:space-x-2">
                <div className="w-6 lg:w-8 h-6 lg:h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs lg:text-sm font-semibold">
                    {user?.firstName?.[0] || user?.email?.[0] || 'U'}
                  </span>
                </div>
                <div className="hidden lg:flex flex-col">
                  <span className="text-xs lg:text-sm font-medium text-slate-800">
                    {user?.firstName || user?.email} {user?.lastName || ''}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    (user?.role === 'admin' || user?.email === 'mahmoud78zalat@gmail.com')
                      ? 'text-blue-600 bg-blue-50' 
                      : 'text-green-600 bg-green-50'
                  }`}>
                    {(user?.role === 'admin' || user?.email === 'mahmoud78zalat@gmail.com') ? 'Admin' : 'Agent'}
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
