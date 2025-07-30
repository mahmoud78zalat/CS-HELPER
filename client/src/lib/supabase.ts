import { createClient } from '@supabase/supabase-js';

// Get environment variables with proper Vite access pattern
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug logging (only in development)
if (import.meta.env.MODE === 'development') {
  console.log('[Frontend Supabase] URL:', supabaseUrl ? 'Present' : 'Missing');
  console.log('[Frontend Supabase] Key present:', !!supabaseAnonKey);
  console.log('[Frontend Supabase] Environment:', import.meta.env.MODE);
}

if (!supabaseUrl || !supabaseAnonKey) {
  const errorMessage = 'Missing required Supabase environment variables. Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your deployment environment.';
  
  // Only log detailed errors in development
  if (import.meta.env.MODE === 'development') {
    console.error('[Frontend Supabase] MISSING REQUIRED CREDENTIALS!');
    console.error('[Frontend Supabase] URL:', supabaseUrl ? 'Present' : 'MISSING');
    console.error('[Frontend Supabase] Key:', supabaseAnonKey ? 'Present' : 'MISSING');
    console.error('[Frontend Supabase] Available env vars:', Object.keys(import.meta.env).filter(key => key.includes('SUPABASE')));
    console.error('[Frontend Supabase] Required variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
  }
  
  throw new Error(errorMessage);
}

// Railway deployment fix: Enhanced client options with IPv4 compatibility
const isProduction = import.meta.env.PROD;
const railwayEnvironment = import.meta.env.VITE_RAILWAY_ENVIRONMENT || 
                           window.location.hostname.includes('railway.app') ||
                           window.location.hostname.includes('.railway.app');

const clientOptions = {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
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
        'X-IPv4-Preferred': 'true', // Hint for IPv4 preference on Railway
        'Connection': 'keep-alive'
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
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};

export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  return supabase.auth.onAuthStateChange(callback);
};