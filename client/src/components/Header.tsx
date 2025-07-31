import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/context/ThemeContext";
import { Headphones, Mail, Settings, Info, LogOut, Edit3, Sun, Moon, HelpCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

interface HeaderProps {
  onEmailComposer: () => void;
  onAdminPanel: () => void;
  onAbout: () => void;
  onFAQ: () => void;
}

export default function Header({ onEmailComposer, onAdminPanel, onAbout }: HeaderProps) {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [agentName, setAgentName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [siteName, setSiteName] = useState('Customer Service Platform');

  // Fetch site content from Supabase
  const { data: siteContent } = useQuery({
    queryKey: ['/api/site-content'],
    queryFn: async () => {
      const response = await fetch('/api/site-content', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch site content');
      return await response.json();
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update site name when site content is fetched
  useEffect(() => {
    if (siteContent && Array.isArray(siteContent)) {
      const siteNameItem = siteContent.find((item: any) => item.key === 'site_name');
      if (siteNameItem?.content) {
        setSiteName(siteNameItem.content);
        localStorage.setItem('site_name', siteNameItem.content);
      } else {
        // Fallback to localStorage if not found in database
        const localSiteName = localStorage.getItem('site_name');
        if (localSiteName) {
          setSiteName(localSiteName);
        }
      }
    }
  }, [siteContent]);

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

  const handleSignOut = async () => {
    await signOut();
  };

  const handleNameSave = () => {
    setIsEditingName(false);
    localStorage.setItem('selectedAgentName', agentName);
  };

  // Check if user is admin
  const isAdmin = user?.role === 'admin' || 
                  user?.email === 'mahmoud78zalat@gmail.com';

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-slate-200 dark:border-gray-700 fixed top-0 left-0 right-0 z-40">
      <div className="px-3 lg:px-6 py-3 lg:py-4">
        <div className="flex items-center justify-between">
          {/* Left: Logo and Title */}
          <div className="flex items-center space-x-2 lg:space-x-4">
            <div className="w-8 lg:w-10 h-8 lg:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Headphones className="text-white text-sm lg:text-lg" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg lg:text-xl font-bold text-slate-800 dark:text-white">
                {siteName}
              </h1>
              <div className="flex items-center gap-2">
                <p className="text-xs lg:text-sm text-slate-600 dark:text-gray-300">Agent:</p>
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
              <h1 className="text-base font-bold text-slate-800 dark:text-white">
                {siteName ? siteName.split(' ').map(w => w.charAt(0)).join('').toUpperCase() : 'CS'}
              </h1>
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
                onClick={toggleTheme}
                size="sm"
                variant="outline"
                className="bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-200 p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-gray-600 transition-colors duration-200"
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </Button>

              <Button 
                onClick={onFAQ}
                size="sm"
                variant="outline"
                className="relative bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 text-yellow-700 dark:text-yellow-400 p-2 rounded-lg hover:shadow-lg transition-all duration-200 animate-pulse"
              >
                <HelpCircle className="w-4 h-4" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full animate-ping"></div>
              </Button>

              <Button 
                onClick={onAbout}
                size="sm"
                variant="outline"
                className="bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-200 p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-gray-600 transition-colors duration-200"
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
                  className="bg-slate-600 dark:bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Admin Panel
                </Button>
              )}
              
              <Button 
                onClick={toggleTheme}
                variant="outline"
                className="px-4 py-2 rounded-lg transition-colors duration-200"
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? <Moon className="w-4 h-4 mr-2" /> : <Sun className="w-4 h-4 mr-2" />}
                {theme === 'light' ? 'Dark' : 'Light'}
              </Button>

              <Button 
                onClick={onFAQ}
                variant="outline"
                className="relative bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 text-yellow-700 dark:text-yellow-400 px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-200 animate-pulse"
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                FAQ
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full animate-ping"></div>
              </Button>

              <Button 
                onClick={onAbout}
                variant="outline"
                className="px-4 py-2 rounded-lg transition-colors duration-200"
              >
                <Info className="w-4 h-4 mr-2" />
                About
              </Button>

            </div>

            {/* User Badge - Responsive */}
            <div className="flex items-center space-x-2 lg:space-x-3 pl-2 lg:pl-4 border-l border-slate-200 dark:border-gray-600">
              <div className="flex items-center space-x-1 lg:space-x-2">
                <div className="w-6 lg:w-8 h-6 lg:h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs lg:text-sm font-semibold">
                    {user?.firstName?.[0] || user?.email?.[0] || 'U'}
                  </span>
                </div>
                <div className="hidden lg:flex flex-col">
                  <span className="text-xs lg:text-sm font-medium text-slate-800 dark:text-white">
                    {user?.firstName || user?.email} {user?.lastName || ''}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    (user?.role === 'admin' || user?.email === 'mahmoud78zalat@gmail.com')
                      ? 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30' 
                      : 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/30'
                  }`}>
                    {(user?.role === 'admin' || user?.email === 'mahmoud78zalat@gmail.com') ? 'Admin' : 'Agent'}
                  </span>
                </div>
              </div>
              <Button
                onClick={handleSignOut}
                variant="ghost"
                size="sm"
                className="text-slate-400 dark:text-gray-400 hover:text-slate-600 dark:hover:text-gray-200 transition-colors"
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
