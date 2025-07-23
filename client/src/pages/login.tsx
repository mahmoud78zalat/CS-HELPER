import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { signInWithEmail, signOut } from '@/lib/supabase';
import { Lock, Mail, AlertTriangle } from 'lucide-react';

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('[Login] Attempting to sign in:', email);
      const { data, error } = await signInWithEmail(email, password);
      
      if (error) {
        console.error('[Login] Sign in error:', error);
        setError(error.message);
        return;
      }

      if (data.user) {
        console.log('[Login] User signed in:', data.user.email);
        
        // Check if user exists in our system
        const response = await fetch(`/api/users/${data.user.id}`);
        if (response.ok) {
          const userData = await response.json();
          console.log('[Login] User data found:', userData.email, userData.role);
          
          if (userData.role === 'admin' || userData.role === 'agent') {
            toast({
              title: "Login Successful",
              description: `Welcome back, ${userData.firstName}!`,
            });
            setLocation('/');
          } else {
            setError('Access denied. Insufficient permissions.');
            await signOut();
          }
        } else {
          console.error('[Login] User not found in database');
          setError('User not found in system. Please contact your administrator.');
          await signOut();
        }
      }
    } catch (err) {
      console.error('[Login] Unexpected error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Admin Login</CardTitle>
          <CardDescription className="text-center">
            Sign in to access the customer service platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Admin Access Only</h4>
            <p className="text-sm text-blue-700">
              This platform is restricted to administrators only. Users must be manually created 
              in the Supabase dashboard with admin role permissions.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}