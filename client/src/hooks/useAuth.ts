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
        localStorage.removeItem('current_user_email');
        localStorage.removeItem('current_user_role');
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
            
            // Store user information in localStorage for apiRequest function
            localStorage.setItem('current_user_id', userData.id);
            localStorage.setItem('current_user_email', userData.email);
            localStorage.setItem('current_user_role', userData.role);
            
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

  // Advanced online status management with real-time heartbeat
  const startHeartbeat = () => {
    if (heartbeatInterval.current) return;
    
    console.log('[Auth] Starting enhanced real-time heartbeat for user presence');
    
    heartbeatInterval.current = setInterval(async () => {
      if (!user) return;
      
      try {
        const now = Date.now();
        const timeSinceActivity = now - lastActivityTime.current;
        
        // Enhanced activity detection: 60 seconds for real-time accuracy
        const isUserActive = timeSinceActivity < 60 * 1000;
        
        console.log(`[Auth] Real-time Heartbeat - User active: ${isUserActive}, Time since activity: ${Math.round(timeSinceActivity / 1000)}s`);
        
        // Enhanced heartbeat with metadata for better tracking
        await fetch('/api/user/heartbeat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user.id,
            'x-user-email': user.email || ''
          },
          credentials: 'include',
          body: JSON.stringify({
            userId: user.id,
            isOnline: isUserActive,
            lastActivity: new Date(lastActivityTime.current).toISOString(),
            timestamp: new Date().toISOString(),
            pageHidden: document.hidden,
            pageVisible: !document.hidden,
            heartbeatType: 'interval'
          }),
        });
        
        // Update local user state immediately
        setUser(prev => prev ? { 
          ...prev, 
          isOnline: isUserActive,
          lastSeen: new Date()
        } : null);
      } catch (error) {
        console.error('[Auth] Heartbeat error:', error);
      }
    }, 8000); // Real-time updates: every 8 seconds for maximum responsiveness
    
    // Track user activity
    const updateActivity = () => {
      lastActivityTime.current = Date.now();
    };
    
    // Enhanced activity detection with more events
    const activityEvents = [
      'mousedown', 'mousemove', 'mouseup', 'click', 'dblclick',
      'keypress', 'keydown', 'keyup', 'input', 'change',
      'scroll', 'wheel', 'touchstart', 'touchmove', 'touchend',
      'focus', 'blur', 'resize', 'contextmenu', 'drag', 'drop'
    ];
    
    activityEvents.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });
    
    // Enhanced visibility change handling with immediate heartbeat
    const handleVisibilityChange = async () => {
      if (document.hidden) {
        console.log('[Auth] Page hidden - user may be inactive');
        // Send immediate heartbeat when page becomes hidden
        if (user) {
          try {
            await fetch('/api/user/heartbeat', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-user-id': user.id,
                'x-user-email': user.email || ''
              },
              credentials: 'include',
              body: JSON.stringify({
                userId: user.id,
                isOnline: false, // Mark as offline when hidden
                lastActivity: new Date().toISOString(),
                pageHidden: true
              }),
            });
          } catch (error) {
            console.error('[Auth] Error sending visibility heartbeat:', error);
          }
        }
      } else {
        console.log('[Auth] Page visible - user is active again');
        updateActivity();
        // Send immediate heartbeat when page becomes visible
        if (user) {
          try {
            await fetch('/api/user/heartbeat', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-user-id': user.id,
                'x-user-email': user.email || ''
              },
              credentials: 'include',
              body: JSON.stringify({
                userId: user.id,
                isOnline: true, // Mark as online when visible
                lastActivity: new Date().toISOString(),
                pageVisible: true
              }),
            });
          } catch (error) {
            console.error('[Auth] Error sending visibility heartbeat:', error);
          }
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Enhanced page unload handling for immediate offline status
    const handleBeforeUnload = () => {
      if (user) {
        // Use sendBeacon for reliable delivery during page unload
        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        headers.append('x-user-id', user.id);
        headers.append('x-user-email', user.email || '');
        
        const data = JSON.stringify({
          userId: user.id,
          isOnline: false,
          lastActivity: new Date().toISOString(),
          timestamp: new Date().toISOString(),
          pageUnload: true,
          heartbeatType: 'unload'
        });
        
        if (navigator.sendBeacon) {
          // Create blob with proper content type
          const blob = new Blob([data], { type: 'application/json' });
          navigator.sendBeacon('/api/user/heartbeat', blob);
        }
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);
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
          'x-user-id': user.id,
          'x-user-email': user.email || ''
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: user.id,
          isOnline: false,
          lastActivity: new Date().toISOString(),
          heartbeatStopped: true
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

  // Refresh user data function
  const refreshUser = async () => {
    if (!user?.id) return;
    
    try {
      console.log('[Auth] Refreshing user data for:', user.id);
      const response = await fetch(`/api/user/${user.id}`);
      
      if (response.ok) {
        const updatedUser = await response.json();
        console.log('[Auth] ✅ User data refreshed successfully');
        setUser(updatedUser);
        
        // Update localStorage with fresh data
        localStorage.setItem('current_user_id', updatedUser.id);
        localStorage.setItem('current_user_email', updatedUser.email);
        localStorage.setItem('current_user_role', updatedUser.role);
      } else {
        console.error('[Auth] Failed to refresh user data:', response.status);
      }
    } catch (error) {
      console.error('[Auth] Error refreshing user data:', error);
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    signOut,
    refreshUser,
  };
}
