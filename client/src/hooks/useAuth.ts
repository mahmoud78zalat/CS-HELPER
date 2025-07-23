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
      console.log('[Auth] Checking user in database:', supabaseUser.id);
      
      // Try API route first
      const response = await fetch(`/api/user/${supabaseUser.id}`);
      const responseText = await response.text();
      
      if (response.ok && !responseText.includes('<!DOCTYPE html>')) {
        const userData = JSON.parse(responseText);
        console.log('[Auth] User found via API:', userData.email, userData.role);
        setUser(userData);
      } else {
        console.log('[Auth] API route intercepted, querying Supabase directly...');
        
        // Query Supabase directly if API routes are being intercepted
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', supabaseUser.id)
          .single();

        if (error || !userData) {
          console.error('[Auth] User not found in our database:', error);
          await supabase.auth.signOut();
          setUser(null);
        } else {
          console.log('[Auth] User found via Supabase:', userData.email, userData.role);
          // Convert snake_case to camelCase to match frontend expectations
          const user = {
            id: userData.id,
            email: userData.email,
            firstName: userData.first_name,
            lastName: userData.last_name,
            profileImageUrl: userData.profile_image_url,
            role: userData.role,
            status: userData.status,
            isOnline: userData.is_online,
            lastSeen: userData.last_seen,
            createdAt: userData.created_at,
            updatedAt: userData.updated_at
          };
          setUser(user);
        }
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
