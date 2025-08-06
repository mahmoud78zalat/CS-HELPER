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
  const { isAuthenticated, isLoading, user } = useAuth();
  const [showAgentSetup, setShowAgentSetup] = React.useState(false);

  // Expose current user to window object for Chatbase integration
  React.useEffect(() => {
    if (user) {
      (window as any).getCurrentUser = () => user;
      // Check if user is first time and needs setup
      if (user.isFirstTimeUser && user.role !== 'admin') {
        setShowAgentSetup(true);
      }
    } else {
      (window as any).getCurrentUser = () => null;
    }
  }, [user]);

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
        onComplete={() => {
          setShowAgentSetup(false);
          // Refresh user data to update isFirstTimeUser status
          window.location.reload();
        }}
      />
      <Switch>
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
