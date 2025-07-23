import { useEffect, useState } from "react";
import { User } from "@shared/schema";
import { supabase } from "@/lib/supabase";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const getSession = async () => {
      console.log('[Auth] Checking for existing session...');
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('[Auth] Session error:', error);
        setUser(null);
        setIsLoading(false);
        return;
      }

      if (session?.user) {
        console.log('[Auth] Found existing session for:', session.user.email);
        await handleUser(session.user);
      } else {
        console.log('[Auth] No existing session found');
        setUser(null);
        setIsLoading(false);
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

    return () => subscription.unsubscribe();
  }, []);

  const handleUser = async (supabaseUser: any) => {
    try {
      // Check if user exists in our database
      const response = await fetch(`/api/users/${supabaseUser.id}`);
      
      if (response.ok) {
        const userData = await response.json();
        console.log('[Auth] User found in database:', userData.email, userData.role);
        setUser(userData);
      } else {
        console.error('[Auth] User not found in our database');
        // Sign out user if they're not in our system
        await supabase.auth.signOut();
        setUser(null);
      }
    } catch (error) {
      console.error('[Auth] Error fetching user data:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
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
