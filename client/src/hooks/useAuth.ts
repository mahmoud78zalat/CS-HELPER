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
      console.log('[Auth] Checking user in database:', supabaseUser.id);
      
      // Performance optimization: Use Promise race for faster timeout
      const fetchWithTimeout = (url: string, timeout: number = 3000) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        return fetch(url, { signal: controller.signal })
          .finally(() => clearTimeout(timeoutId));
      };
      
      try {
        const response = await fetchWithTimeout(`/api/user/${supabaseUser.id}`, 3000);
        const responseText = await response.text();
        
        console.log('[Auth] Response status:', response.status);
        console.log('[Auth] Response type:', response.headers.get('content-type'));
        console.log('[Auth] Response text preview:', responseText.substring(0, 100) + '...');
        
        if (response.ok && !responseText.includes('<!DOCTYPE html>')) {
          try {
            const userData = JSON.parse(responseText);
            console.log('[Auth] User found via API:', userData.email, userData.role);
            
            // Store user ID in localStorage for apiRequest function
            localStorage.setItem('current_user_id', userData.id);
            
            setUser(userData);
            setIsLoading(false);
            if (authTimeout) clearTimeout(authTimeout);
            return;
          } catch (parseError) {
            console.error('[Auth] JSON parse error:', parseError);
            console.log('[Auth] Full response text:', responseText);
          }
        } else if (response.status === 404) {
          // User not found, try to create them
          console.log('[Auth] User not found (404), attempting to create new user...');
        }
      } catch (fetchError) {
        console.log('[Auth] API fetch failed or timed out:', fetchError instanceof Error ? fetchError.message : 'Unknown error');
      }
      
      // User not found in database, try to create new user
      console.log('[Auth] User not found in database, attempting to create new user...');
      
      try {
        const createResponse = await fetch('/api/create-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: supabaseUser.id,
            email: supabaseUser.email,
            firstName: supabaseUser.user_metadata?.full_name?.split(' ')[0] || '',
            lastName: supabaseUser.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
            role: 'agent', // Default role for new users
          }),
        });

        if (createResponse.ok) {
          const newUserData = await createResponse.json();
          console.log('[Auth] Successfully created new user:', newUserData.email, newUserData.role);
          
          // Store user ID in localStorage for apiRequest function
          localStorage.setItem('current_user_id', newUserData.id);
          
          setUser(newUserData);
          setIsLoading(false);
          if (authTimeout) clearTimeout(authTimeout);
          return;
        } else {
          console.error('[Auth] Failed to create user:', createResponse.status);
        }
      } catch (createError) {
        console.error('[Auth] Error creating user:', createError);
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
    console.log('[Auth] Signing out user...');
    stopHeartbeat();
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('[Auth] Sign out error:', error);
    }
    
    // Clear user ID from localStorage
    localStorage.removeItem('current_user_id');
    
    setUser(null);
    setIsLoading(false);
    
    // Redirect to login page after sign out
    window.location.href = '/login';
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    signOut,
  };
}
