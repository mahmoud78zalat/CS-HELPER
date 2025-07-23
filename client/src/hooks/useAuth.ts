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
          console.log('[Auth] User not found in database, creating new user...');
          
          try {
            // Create user automatically if they don't exist
            const { error: createError } = await supabase
              .from('users')
              .insert({
                id: supabaseUser.id,
                email: supabaseUser.email,
                first_name: supabaseUser.user_metadata?.first_name || supabaseUser.email?.split('@')[0],
                last_name: supabaseUser.user_metadata?.last_name || '',
                profile_image_url: supabaseUser.user_metadata?.avatar_url || '',
                role: 'agent', // Default role for new users
                status: 'active',
                is_online: false,
                last_seen: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });

            if (createError) {
              console.error('[Auth] Failed to create user:', createError);
              // Don't sign out - just set loading to false and let timeout handle it
              setUser(null);
              return;
            }

            // Fetch the newly created user
            const { data: newUserData, error: fetchError } = await supabase
              .from('users')
              .select('*')
              .eq('id', supabaseUser.id)
              .single();

            if (newUserData && !fetchError) {
              const user = {
                id: newUserData.id,
                email: newUserData.email,
                firstName: newUserData.first_name,
                lastName: newUserData.last_name,
                profileImageUrl: newUserData.profile_image_url,
                role: newUserData.role,
                status: newUserData.status,
                isOnline: newUserData.is_online,
                lastSeen: newUserData.last_seen,
                createdAt: newUserData.created_at,
                updatedAt: newUserData.updated_at
              };
              console.log('[Auth] New user created:', user.email, user.role);
              setUser(user);
            } else {
              console.error('[Auth] Failed to fetch newly created user:', fetchError);
              setUser(null);
            }
          } catch (createError) {
            console.error('[Auth] Exception creating user:', createError);
            setUser(null);
          }
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
