import { useEffect, useState } from "react";
import { User } from "@shared/schema";
import { supabase } from "@/lib/supabase";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authTimeout, setAuthTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Set authentication timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('[Auth] Authentication timeout - stopping loading state');
      setIsLoading(false);
      if (!user) {
        console.log('[Auth] No user found after timeout');
      }
    }, 10000); // 10 second timeout
    
    setAuthTimeout(timeoutId);

    // Check for existing session on mount
    const getSession = async () => {
      console.log('[Auth] Checking for existing session...');
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('[Auth] Session error:', error);
        setUser(null);
        setIsLoading(false);
        if (authTimeout) clearTimeout(authTimeout);
        return;
      }

      if (session?.user) {
        console.log('[Auth] Found existing session for:', session.user.email);
        await handleUser(session.user);
      } else {
        console.log('[Auth] No existing session found');
        setUser(null);
        setIsLoading(false);
        if (authTimeout) clearTimeout(authTimeout);
      }
    };

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] Auth state changed:', event, session?.user?.email);
      
      if (session?.user) {
        await handleUser(session.user);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    getSession();

    return () => {
      subscription.unsubscribe();
      if (authTimeout) clearTimeout(authTimeout);
    };
  }, []);

  const handleUser = async (supabaseUser: any) => {
    try {
      console.log('[Auth] Checking user in database:', supabaseUser.id);
      
      // Use backend API exclusively since Supabase direct queries hang
      const response = await fetch(`/api/user/${supabaseUser.id}`);
      
      if (response.ok) {
        const userData = await response.json();
        console.log('[Auth] User found via API:', userData.email, userData.role);
        setUser(userData);
      } else if (response.status === 404) {
        console.log('[Auth] User not found, creating via API...');
        
        // Create user via backend API
        const createResponse = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: supabaseUser.id,
            email: supabaseUser.email,
            firstName: supabaseUser.user_metadata?.first_name || supabaseUser.email?.split('@')[0] || 'User',
            lastName: supabaseUser.user_metadata?.last_name || '',
            profileImageUrl: supabaseUser.user_metadata?.avatar_url || '',
            role: 'agent',
            status: 'active'
          })
        });
        
        if (createResponse.ok) {
          const newUser = await createResponse.json();
          console.log('[Auth] User created successfully via API:', newUser.email);
          setUser(newUser);
        } else {
          console.error('[Auth] Failed to create user via API:', createResponse.status);
        }
      } else {
        console.error('[Auth] API error:', response.status);
      }
    } catch (error) {
      console.error('[Auth] Error fetching user data:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
      if (authTimeout) clearTimeout(authTimeout);
    }
  };

  const signOut = async () => {
    console.log('[Auth] Signing out user...');
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('[Auth] Sign out error:', error);
    }
    
    setUser(null);
    setIsLoading(false);
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    signOut,
  };
}
