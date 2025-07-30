import { useEffect, useState, useRef } from "react";
import { User } from "@shared/schema";
import { supabase } from "@/lib/supabase";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authTimeout, setAuthTimeout] = useState<NodeJS.Timeout | null>(null);
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  const lastActivityTime = useRef<number>(Date.now());

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
        stopHeartbeat();
        localStorage.removeItem('current_user_id');
        return;
      }
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          console.log('[Auth] User signed in/token refreshed - handling user');
          await handleUser(session.user);
          startHeartbeat();
        }
        return;
      }
      
      // For initial session check
      if (event === 'INITIAL_SESSION') {
        if (session?.user) {
          console.log('[Auth] Initial session found - handling user');
          await handleUser(session.user);
          startHeartbeat();
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
        startHeartbeat();
      } else {
        setUser(null);
        setIsLoading(false);
        stopHeartbeat();
      }
    });

    getSession();

    return () => {
      subscription.unsubscribe();
      if (authTimeout) clearTimeout(authTimeout);
      stopHeartbeat();
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
            
            // Store user ID in localStorage for apiRequest function
            localStorage.setItem('current_user_id', userData.id);
            
            setUser(userData);
            setIsLoading(false);
            if (authTimeout) clearTimeout(authTimeout);
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
            
            setUser(newUserData);
            setIsLoading(false);
            if (authTimeout) clearTimeout(authTimeout);
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
        profileImageUrl: supabaseUser.user_metadata?.avatar_url || '',
        role: 'agent' as const,
        status: 'active' as const,
        isOnline: false,
        lastSeen: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      console.log('[Auth] Setting fallback user:', fallbackUserData.email, fallbackUserData.role);
      
      // Store user ID in localStorage for apiRequest function
      localStorage.setItem('current_user_id', fallbackUserData.id);
      
      setUser(fallbackUserData);
      setIsLoading(false);
      if (authTimeout) clearTimeout(authTimeout);
      return;
      
    } catch (error) {
      console.error('[Auth] Error in handleUser:', error);
      setUser(null);
      setIsLoading(false);
      if (authTimeout) clearTimeout(authTimeout);
    }
  };

  // Advanced online status management with heartbeat
  const startHeartbeat = () => {
    if (heartbeatInterval.current) return;
    
    console.log('[Auth] Starting heartbeat for user presence');
    
    heartbeatInterval.current = setInterval(async () => {
      if (!user) return;
      
      try {
        const now = Date.now();
        const timeSinceActivity = now - lastActivityTime.current;
        
        // Consider user offline if no activity for 2 minutes (more accurate)
        const isUserActive = timeSinceActivity < 2 * 60 * 1000;
        
        console.log(`[Auth] Heartbeat - User active: ${isUserActive}, Time since activity: ${Math.round(timeSinceActivity / 1000)}s`);
        
        // Only send heartbeat if status changed (performance optimization)
        const currentStatus = user.isOnline;
        if (currentStatus !== isUserActive) {
          await fetch('/api/user/heartbeat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              userId: user.id,
              isOnline: isUserActive,
              lastActivity: new Date(lastActivityTime.current).toISOString()
            }),
          });
          
          // Update local user state to prevent unnecessary calls
          setUser(prev => prev ? { ...prev, isOnline: isUserActive } : null);
        }
      } catch (error) {
        console.error('[Auth] Heartbeat error:', error);
      }
    }, 30000); // Update every 30 seconds to reduce performance impact
    
    // Track user activity
    const updateActivity = () => {
      lastActivityTime.current = Date.now();
    };
    
    // Listen for user activity with better detection
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click', 'focus', 'blur'];
    activityEvents.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });
    
    // Handle visibility change to mark user offline when tab is hidden
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User switched tabs or minimized window - consider them potentially inactive
        console.log('[Auth] Page hidden - user may be inactive');
      } else {
        // User came back to tab
        updateActivity();
        console.log('[Auth] Page visible - user is active');
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
  };
  
  const stopHeartbeat = () => {
    if (heartbeatInterval.current) {
      console.log('[Auth] Stopping heartbeat');
      clearInterval(heartbeatInterval.current);
      heartbeatInterval.current = null;
    }
    
    // Update status to offline when stopping heartbeat
    if (user) {
      fetch('/api/user/heartbeat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: user.id,
          isOnline: false,
          lastActivity: new Date().toISOString()
        }),
      }).catch(console.error);
    }
  };

  const signOut = async () => {
    console.log('[Auth] Starting comprehensive sign out...');
    
    // Stop heartbeat first
    stopHeartbeat();
    
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

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    signOut,
  };
}
