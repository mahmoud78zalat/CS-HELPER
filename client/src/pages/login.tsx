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
          
          // Allow all authenticated users with valid roles
          if (userData.role === 'admin' || userData.role === 'agent') {
            toast({
              title: "Login Successful",
              description: `Welcome back, ${userData.firstName || userData.email}!`,
            });
            setLocation('/');
          } else {
            setError('Access denied. Please contact your administrator.');
            await signOut();
          }
        } else if (response.status === 404) {
          // User exists in Supabase Auth but not in our users table
          console.log('[Login] User not in database, creating user record...');
          
          // Try to create the user in our database
          try {
            const createResponse = await fetch('/api/users', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: data.user.id,
                email: data.user.email,
                firstName: data.user.user_metadata?.first_name || data.user.email?.split('@')[0],
                lastName: data.user.user_metadata?.last_name || '',
                profileImageUrl: data.user.user_metadata?.avatar_url || '',
                role: 'agent', // Default role
                status: 'active'
              })
            });

            if (createResponse.ok) {
              const newUser = await createResponse.json();
              toast({
                title: "Account Created",
                description: `Welcome ${newUser.firstName || newUser.email}!`,
              });
              setLocation('/');
            } else {
              setError('Unable to create user account. Please contact administrator.');
              await signOut();
            }
          } catch (createError) {
            console.error('[Login] Error creating user:', createError);
            setError('Unable to create user account. Please contact administrator.');
            await signOut();
          }
        } else {
          console.error('[Login] Error fetching user data');
          setError('Unable to verify user account. Please try again.');
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
          <CardTitle className="text-2xl font-bold text-center">Sign In</CardTitle>
          <CardDescription className="text-center">
            Access your customer service workspace
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


        </CardContent>
      </Card>
    </div>
  );
}