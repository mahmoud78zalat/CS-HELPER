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
        console.log('[Login] Checking user in database:', data.user.id);
        const response = await fetch(`/api/user/${data.user.id}`, {
          headers: {
            'Content-Type': 'application/json',
          }
        });
        console.log('[Login] Response status:', response.status);
        const responseText = await response.text();
        console.log('[Login] Response body:', responseText);
        
        if (response.ok && !responseText.includes('<!DOCTYPE html>')) {
          const userData = JSON.parse(responseText);
          console.log('[Login] User data found via API:', userData.email, userData.role);
          
          // Allow all authenticated users regardless of role
          toast({
            title: "Login Successful",
            description: `Welcome back, ${userData.firstName || userData.email}!`,
          });
          setLocation('/');
        } else {
          // API routes being intercepted or user not found, check Supabase directly
          console.log('[Login] API route failed, checking Supabase directly...');
          
          const { supabase } = await import('@/lib/supabase');
          const { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (existingUser && !fetchError) {
            // User exists, allow login regardless of role
            console.log('[Login] User found in Supabase:', existingUser.email, existingUser.role);
            
            toast({
              title: "Login Successful",
              description: `Welcome back, ${existingUser.first_name || existingUser.email}!`,
            });
            setLocation('/');
            return;
          }
          
          // User doesn't exist, create them
          console.log('[Login] User not found, creating new user record...');
          
          try {
            
            const { error: upsertError } = await supabase
              .from('users')
              .upsert({
                id: data.user.id,
                email: data.user.email,
                first_name: data.user.user_metadata?.first_name || data.user.email?.split('@')[0],
                last_name: data.user.user_metadata?.last_name || '',
                profile_image_url: data.user.user_metadata?.avatar_url || '',
                role: 'agent', // Default role
                status: 'active',
                is_online: false,
                last_seen: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });

            if (upsertError) {
              console.error('[Login] Error creating user in Supabase:', upsertError);
              setError('Unable to create user account. Please contact administrator.');
              await signOut();
              return;
            }

            console.log('[Login] User created successfully in Supabase');
            toast({
              title: "Account Created",
              description: `Welcome ${data.user.email?.split('@')[0]}!`,
            });
            setLocation('/');
            
          } catch (createError) {
            console.error('[Login] Error with direct Supabase creation:', createError);
            setError('Unable to create user account. Please contact administrator.');
            await signOut();
          }
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