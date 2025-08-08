import { useEffect, useState, useRef, useCallback, useReducer } from "react";
import { flushSync } from "react-dom";
import { User } from "@shared/schema";
import { supabase } from "@/lib/supabase";
import { usePresenceHeartbeat } from "@/hooks/usePresenceHeartbeat";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authTimeout, setAuthTimeout] = useState<NodeJS.Timeout | null>(null);
  // Force re-render reducer to handle React state batching issues
  const [, forceUpdate] = useReducer(x => x + 1, 0);

  // Enhanced Presence System Integration
  const presenceHeartbeat = usePresenceHeartbeat({
    userId: user?.id || '',
    enabled: !!user && user.status === 'active',
    heartbeatInterval: 25000, // 25 seconds
    activityTimeout: 60000, // 1 minute
    maxRetries: 3,
    retryDelay: 2000
  });

  // Log presence system status when user changes
  useEffect(() => {
    if (user && user.status === 'active') {
      console.log(`[Auth] 🚀 Enhanced presence system activated for ${user.email} (${user.role})`);
      console.log(`[Auth] 🔧 Session: ${presenceHeartbeat.sessionId}, Active: ${presenceHeartbeat.isActive}`);
    } else if (user) {
      console.log(`[Auth] ⚠️ User ${user.email} has status '${user.status}' - presence system disabled`);
    }
  }, [user, presenceHeartbeat.sessionId, presenceHeartbeat.isActive]);

  useEffect(() => {
    // Disabled timeout as it was clearing authenticated users
    // const timeoutId = setTimeout(() => {
    //   if (!user) {
    //     console.log('[Auth] Authentication timeout - stopping loading state');
    //     setIsLoading(false);
    //     console.log('[Auth] No user found after timeout');
    //   }
    // }, 10000);
    // setAuthTimeout(timeoutId);

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
      
      // Handle different auth events
      if (event === 'SIGNED_OUT') {
        console.log('[Auth] User signed out - clearing state');
        setUser(null);
        setIsLoading(false);
        localStorage.removeItem('current_user_id');
        localStorage.removeItem('current_user_email');
        localStorage.removeItem('current_user_role');
        return;
      }
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          console.log('[Auth] User signed in/token refreshed - handling user');
          await handleUser(session.user);
        }
        return;
      }
      
      // For initial session check
      if (event === 'INITIAL_SESSION') {
        if (session?.user) {
          console.log('[Auth] Initial session found - handling user');
          await handleUser(session.user);
        } else {
          console.log('[Auth] No initial session');
          setUser(null);
          setIsLoading(false);
        }
        return;
      }
      
      // Fallback for any other events
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
      console.log('[Auth] Processing user authentication:', supabaseUser.id, supabaseUser.email);
      
      // Clear any existing user ID from localStorage to prevent conflicts
      localStorage.removeItem('current_user_id');
      
      // Performance optimization: Use Promise race for faster timeout
      const fetchWithTimeout = (url: string, timeout: number = 5000) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        return fetch(url, { signal: controller.signal })
          .finally(() => clearTimeout(timeoutId));
      };
      
      // First attempt: Check if user exists in database
      try {
        console.log('[Auth] Checking if user exists in database...');
        const response = await fetchWithTimeout(`/api/user/${supabaseUser.id}`, 5000);
        const responseText = await response.text();
        
        console.log('[Auth] User lookup response status:', response.status);
        console.log('[Auth] Response content type:', response.headers.get('content-type'));
        
        if (response.ok && !responseText.includes('<!DOCTYPE html>')) {
          try {
            const userData = JSON.parse(responseText);
            console.log('[Auth] ✅ Existing user found:', userData.email, userData.role);
            
            // Store user information in localStorage for apiRequest function
            localStorage.setItem('current_user_id', userData.id);
            localStorage.setItem('current_user_email', userData.email);
            localStorage.setItem('current_user_role', userData.role);
            
            setUser(userData);
            setIsLoading(false);
            if (authTimeout) clearTimeout(authTimeout);
            
            console.log('[Auth] 🚀 Enhanced presence system will auto-start via usePresenceHeartbeat hook');
            return;
          } catch (parseError) {
            console.error('[Auth] JSON parse error:', parseError);
            console.log('[Auth] Response text:', responseText);
          }
        } else if (response.status === 404) {
          console.log('[Auth] ⚠️ User not found in database (404) - will create new user');
        } else {
          console.log('[Auth] ⚠️ Unexpected response:', response.status, responseText.substring(0, 200));
        }
      } catch (fetchError) {
        console.log('[Auth] ⚠️ User lookup failed:', fetchError instanceof Error ? fetchError.message : 'Unknown error');
      }
      
      // Second attempt: Create new user in database
      console.log('[Auth] 🔧 Creating new user in database...');
      console.log('[Auth] User metadata available:', {
        full_name: supabaseUser.user_metadata?.full_name,
        email: supabaseUser.email,
        id: supabaseUser.id
      });
      
      try {
        const newUserPayload = {
          id: supabaseUser.id,
          email: supabaseUser.email,
          firstName: supabaseUser.user_metadata?.full_name?.split(' ')[0] || 
                    supabaseUser.email?.split('@')[0] || 'User',
          lastName: supabaseUser.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
          profileImageUrl: supabaseUser.user_metadata?.avatar_url || '',
          role: 'agent', // Default role for all new users
          status: 'active' // Default status
        };
        
        console.log('[Auth] Creating user with payload:', newUserPayload);
        
        const createResponse = await fetch('/api/create-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newUserPayload),
        });
        
        const createResponseText = await createResponse.text();
        
        console.log('[Auth] Create user response status:', createResponse.status);
        console.log('[Auth] Create response preview:', createResponseText.substring(0, 200));

        if (createResponse.ok && !createResponseText.includes('<!DOCTYPE html>')) {
          try {
            const newUserData = JSON.parse(createResponseText);
            console.log('[Auth] ✅ Successfully created new user:', newUserData.email, newUserData.role);
            
            // Store user ID in localStorage for apiRequest function
            localStorage.setItem('current_user_id', newUserData.id);
            localStorage.setItem('current_user_email', newUserData.email);
            localStorage.setItem('current_user_role', newUserData.role);
            
            setUser(newUserData);
            setIsLoading(false);
            if (authTimeout) clearTimeout(authTimeout);
            
            console.log('[Auth] 🚀 Enhanced presence system will auto-start via usePresenceHeartbeat hook');
            return;
          } catch (parseError) {
            console.error('[Auth] Error parsing create response:', parseError);
            console.log('[Auth] Full create response:', createResponseText);
          }
        } else {
          console.error('[Auth] ❌ Failed to create user:', createResponse.status, createResponseText);
        }
      } catch (createError) {
        console.error('[Auth] ❌ Error during user creation:', createError);
      }
      
      // If all else fails, set a temporary user object (should not happen in production)
      console.log('[Auth] Fallback: creating temporary user object');
      const fallbackUserData = {
        id: supabaseUser.id,
        email: supabaseUser.email,
        firstName: supabaseUser.user_metadata?.full_name?.split(' ')[0] || '',
        lastName: supabaseUser.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
        arabicFirstName: null,
        arabicLastName: null,
        profileImageUrl: supabaseUser.user_metadata?.avatar_url || '',
        role: 'agent' as const,
        status: 'active' as const,
        isOnline: false,
        isFirstTimeUser: true,
        lastSeen: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      console.log('[Auth] Setting fallback user:', fallbackUserData.email, fallbackUserData.role);
      
      // Store user ID in localStorage for apiRequest function
      localStorage.setItem('current_user_id', fallbackUserData.id);
      localStorage.setItem('current_user_email', fallbackUserData.email || '');
      localStorage.setItem('current_user_role', fallbackUserData.role);
      
      setUser(fallbackUserData);
      setIsLoading(false);
      if (authTimeout) clearTimeout(authTimeout);
      
      console.log('[Auth] 🚀 Enhanced presence system will auto-start via usePresenceHeartbeat hook');
      return;
      
    } catch (error) {
      console.error('[Auth] Error in handleUser:', error);
      setUser(null);
      setIsLoading(false);
      if (authTimeout) clearTimeout(authTimeout);
    }
  };

  // The enhanced presence system is now handled automatically by usePresenceHeartbeat hook
  // This replaces the old heartbeat system with Redis-like TTL-based tracking

  const signOut = async () => {
    console.log('[Auth] Starting comprehensive sign out...');
    
    try {
      // Sign out from Supabase (all sessions)
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        console.error('[Auth] Supabase sign out error:', error);
      } else {
        console.log('[Auth] Supabase sign out successful');
      }
    } catch (error) {
      console.error('[Auth] Error during sign out:', error);
    }
    
    // Clear all local storage data
    localStorage.removeItem('current_user_id');
    localStorage.removeItem('customer_data');
    localStorage.removeItem('agent_info');
    
    // Clear session storage if any
    sessionStorage.clear();
    
    // Reset state
    setUser(null);
    setIsLoading(false);
    
    console.log('[Auth] Local data cleared, redirecting to login...');
    
    // Force page reload to ensure clean state
    window.location.replace('/login');
  };

  // Enhanced refresh user data function with force update mechanism
  const refreshUser = useCallback(async () => {
    if (!user?.id) {
      console.log('[Auth] Cannot refresh user data - no user ID available');
      return;
    }
    
    try {
      console.log('[Auth] Refreshing user data for:', user.id);
      console.log('[Auth] Current user state before refresh:', {
        firstName: user.firstName,
        lastName: user.lastName,
        arabicFirstName: user.arabicFirstName,
        arabicLastName: user.arabicLastName,
        isFirstTimeUser: user.isFirstTimeUser
      });
      
      const response = await fetch(`/api/user/${user.id}`, {
        cache: 'no-cache', // Prevent caching issues
        headers: {
          'Cache-Control': 'no-cache',
        }
      });
      
      if (response.ok) {
        const updatedUser = await response.json();
        console.log('[Auth] ✅ Fresh user data from API:', {
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          arabicFirstName: updatedUser.arabicFirstName,
          arabicLastName: updatedUser.arabicLastName,
          isFirstTimeUser: updatedUser.isFirstTimeUser
        });
        
        // Use flushSync for immediate synchronous state updates
        flushSync(() => {
          setUser(prevUser => {
            console.log('[Auth] Setting new user state with flushSync:', updatedUser);
            console.log('[Auth] Previous user was:', prevUser);
            return updatedUser;
          });
        });
        
        // Force a re-render to bypass React batching issues
        console.log('[Auth] Forcing component re-render after flushSync');
        forceUpdate();
        
        // Update localStorage with fresh data
        localStorage.setItem('current_user_id', updatedUser.id);
        localStorage.setItem('current_user_email', updatedUser.email);
        localStorage.setItem('current_user_role', updatedUser.role);
        
        console.log('[Auth] User state update completed with force refresh');
      } else {
        const errorText = await response.text();
        console.error('[Auth] Failed to refresh user data:', response.status, errorText);
      }
    } catch (error) {
      console.error('[Auth] Error refreshing user data:', error);
    }
  }, [user?.id, forceUpdate]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    signOut,
    refreshUser,
  };
}
