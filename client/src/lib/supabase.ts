import { createClient } from '@supabase/supabase-js';

// Get environment variables with proper Vite access pattern
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug logging (only in development)
if (import.meta.env.MODE === 'development') {
  console.log('[Frontend Supabase] URL:', supabaseUrl ? 'Present' : 'Missing');
  console.log('[Frontend Supabase] Key present:', !!supabaseAnonKey);
  console.log('[Frontend Supabase] Environment:', import.meta.env.MODE);
  console.log('[Frontend Supabase] Raw URL value:', supabaseUrl);
  console.log('[Frontend Supabase] All VITE env vars:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')));
}

// More robust environment variable validation
const hasValidUrl = supabaseUrl && supabaseUrl.trim() !== '' && supabaseUrl !== 'undefined';
const hasValidKey = supabaseAnonKey && supabaseAnonKey.trim() !== '' && supabaseAnonKey !== 'undefined';

// Railway deployment fix: Enhanced client options with IPv4 compatibility
const isProduction = import.meta.env.PROD;
const railwayEnvironment = import.meta.env.VITE_RAILWAY_ENVIRONMENT || 
                           window.location.hostname.includes('railway.app') ||
                           window.location.hostname.includes('.railway.app') ||
                           import.meta.env.VITE_RAILWAY_PROJECT_ID;

const clientOptions = {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    autoRefreshToken: true,
    storage: window.localStorage,
    storageKey: 'supabase.auth.token',
    ...(isProduction && railwayEnvironment && {
      flowType: 'pkce' as const // Enhanced auth flow for Railway production
    })
  },
  global: {
    headers: {
      'User-Agent': 'BFL-CustomerService-Frontend/1.0',
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(railwayEnvironment && {
        'X-Railway-Client': 'true',
        'X-IPv4-Preferred': 'true', // Force IPv4 preference on Railway
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache', // Prevent IPv6 DNS caching
        'X-Force-IPv4': 'true' // Additional IPv4 hint
      })
    }
  },
  // Railway-specific optimizations for IPv4 connectivity
  ...(railwayEnvironment && {
    db: {
      schema: 'public'
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  })
};

if (!hasValidUrl || !hasValidKey) {
  const errorMessage = 'Missing required Supabase environment variables. Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your deployment environment.';
  
  // Only log detailed errors in development
  if (import.meta.env.MODE === 'development') {
    console.error('[Frontend Supabase] MISSING REQUIRED CREDENTIALS!');
    console.error('[Frontend Supabase] URL:', hasValidUrl ? 'Present' : 'MISSING');
    console.error('[Frontend Supabase] Key:', hasValidKey ? 'Present' : 'MISSING');
    console.error('[Frontend Supabase] Available env vars:', Object.keys(import.meta.env).filter(key => key.includes('SUPABASE')));
    console.error('[Frontend Supabase] Required variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
  }
  
  throw new Error(errorMessage);
}

console.log('[Frontend Supabase] Railway environment detected:', railwayEnvironment);
export const supabase = createClient(supabaseUrl, supabaseAnonKey, clientOptions);

// Auth helper functions
export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  console.log('[Supabase] Starting sign out process...');
  
  // Sign out from all sessions (including other tabs/devices)
  const { error } = await supabase.auth.signOut({ scope: 'global' });
  
  if (error) {
    console.error('[Supabase] Sign out error:', error);
  } else {
    console.log('[Supabase] Sign out successful');
  }
  
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};

export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  return supabase.auth.onAuthStateChange(callback);
};