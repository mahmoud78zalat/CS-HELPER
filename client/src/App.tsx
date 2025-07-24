import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CustomerDataProvider } from "@/context/CustomerDataContext";
import { useAuth } from "@/hooks/useAuth";
import Login from "@/pages/login";
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Expose current user to window object for Chatbase integration
  React.useEffect(() => {
    if (user) {
      (window as any).getCurrentUser = () => user;
      // Add authenticated class to body for Chatbase visibility
      document.body.classList.add('user-authenticated');
    } else {
      (window as any).getCurrentUser = () => null;
      // Remove authenticated class to hide Chatbase
      document.body.classList.remove('user-authenticated');
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
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={() => { window.location.href = "/"; return null; }} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CustomerDataProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </CustomerDataProvider>
    </QueryClientProvider>
  );
}

export default App;
