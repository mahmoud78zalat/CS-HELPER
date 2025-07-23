import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogIn, Headphones } from "lucide-react";

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const handleReplitLogin = () => {
    setIsLoading(true);
    // In beta mode, just redirect to home page
    setTimeout(() => {
      window.location.href = '/';
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">BFL Customer Service</CardTitle>
          <CardDescription className="text-center">
            Beta Testing Mode - Admin Access Enabled
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="text-center space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <Headphones className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-green-700 font-medium">Beta Testing Active</p>
              <p className="text-xs text-green-600 mt-1">
                You have full admin access for testing purposes
              </p>
            </div>
            
            <Button 
              onClick={handleReplitLogin}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Accessing Dashboard...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Enter Dashboard (Beta Mode)
                </>
              )}
            </Button>
            
            <p className="text-xs text-muted-foreground">
              Authentication is temporarily disabled for beta testing.
              <br />
              Contact your system administrator for production access.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}