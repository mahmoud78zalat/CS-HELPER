import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CustomerDataProvider } from "@/context/CustomerDataContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { useAuth } from "@/hooks/useAuth";
import Login from "@/pages/login";
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";
import AdminPanel from "@/components/AdminPanel";
import AgentSetupModal from "@/components/AgentSetupModal";
import { loadColorsFromDatabase } from "@/lib/templateColors";

function Router() {
  const { isAuthenticated, isLoading, user, refreshUser } = useAuth();
  const [showAgentSetup, setShowAgentSetup] = React.useState(false);
  const [appKey, setAppKey] = React.useState(0); // Key for forcing full app re-render

  // Expose current user to window object for Chatbase integration
  React.useEffect(() => {
    if (user) {
      (window as any).getCurrentUser = () => user;
      
      // Check if user is first time and needs setup - INCLUDE ADMINS
      console.log('[App] User check - isFirstTimeUser:', user.isFirstTimeUser, 'role:', user.role);
      if (user.isFirstTimeUser) {
        console.log('[App] 🚨 First-time user detected, forcing setup modal to open');
        setShowAgentSetup(true);
      } else {
        console.log('[App] User has completed setup, setup modal will not show');
      }
    } else {
      (window as any).getCurrentUser = () => null;
    }
  }, [user]);
  
  // Additional check for already authenticated users with is_first_time_user = true
  React.useEffect(() => {
    if (isAuthenticated && user && user.isFirstTimeUser) {
      console.log('[App] 🔄 Force checking first-time user status for already authenticated user');
      console.log('[App] Current user data:', {
        id: user.id,
        email: user.email,
        role: user.role,
        isFirstTimeUser: user.isFirstTimeUser,
        firstName: user.firstName,
        lastName: user.lastName,
        arabicFirstName: user.arabicFirstName,
        arabicLastName: user.arabicLastName
      });
      
      setTimeout(() => {
        console.log('[App] 🚨 Forcing setup modal for authenticated first-time user');
        setShowAgentSetup(true);
      }, 1000); // Small delay to ensure UI is ready
    }
  }, [isAuthenticated, user]);
  
  // Debug function for manual modal trigger (temporary)
  React.useEffect(() => {
    (window as any).forceSetupModal = () => {
      console.log('[App] 🔧 DEBUG: Manually forcing setup modal');
      setShowAgentSetup(true);
    };
    
    (window as any).checkUserStatus = () => {
      console.log('[App] 🔍 DEBUG: Current user status:', {
        isAuthenticated,
        isLoading,
        user: user ? {
          id: user.id,
          email: user.email,
          role: user.role,
          isFirstTimeUser: user.isFirstTimeUser,
          firstName: user.firstName,
          lastName: user.lastName
        } : null,
        showAgentSetup
      });
    };
  }, [isAuthenticated, isLoading, user, showAgentSetup]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Authenticating...</p>
        </div>
      </div>
    );
  }

  // Force authentication - redirect all unauthenticated users to login
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="*" component={() => { window.location.href = "/login"; return null; }} />
      </Switch>
    );
  }

  // Authenticated users only
  return (
    <>
      <AgentSetupModal 
        open={showAgentSetup}
        onOpenChange={setShowAgentSetup}
        onComplete={async () => {
          console.log('[App] Profile setup completed, implementing comprehensive UI refresh...');
          try {
            // Step 1: Refresh user data
            await refreshUser();
            console.log('[App] ✅ User data refreshed successfully');
            
            // Step 2: Force complete app re-render with key change
            setAppKey(prev => prev + 1);
            console.log('[App] 🔄 Forced complete app re-render with key change');
            
            // Step 3: Close modal after state updates
            await new Promise(resolve => setTimeout(resolve, 100));
            setShowAgentSetup(false);
            console.log('[App] Modal closed');
            
            // Step 4: Final refresh to ensure all components have latest data
            setTimeout(async () => {
              await refreshUser();
              setAppKey(prev => prev + 1); // Another key change to ensure re-render
              console.log('[App] 🎉 Complete UI refresh cycle completed');
            }, 200);
            
          } catch (error) {
            console.error('[App] Error during profile setup completion:', error);
            // Force close modal and re-render even if refresh fails
            setShowAgentSetup(false);
            setAppKey(prev => prev + 1);
          }
        }}
      />
      <Switch key={appKey}>
        <Route path="/" component={Home} />
      <Route path="/admin" component={() => {
        if (!user || user.role !== 'admin') {
          return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
              <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
                <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
                <p className="text-gray-600 mb-4">
                  You don't have permission to access the admin panel.
                </p>
                <a 
                  href="/" 
                  className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  Return to Home
                </a>
              </div>
            </div>
          );
        }
        return (
          <div className="min-h-screen bg-gray-50">
            <AdminPanel onClose={() => window.history.back()} />
          </div>
        );
      }} />
      <Route path="/login" component={() => { window.location.href = "/"; return null; }} />
      <Route component={NotFound} />
    </Switch>
    </>
  );
}

function App() {
  // Load colors from database when app starts
  React.useEffect(() => {
    loadColorsFromDatabase().then(() => {
      console.log('[App] Colors loaded from database on app start');
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <CustomerDataProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </CustomerDataProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
