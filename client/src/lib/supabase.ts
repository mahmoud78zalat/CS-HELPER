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

// Check if Supabase credentials are available
const hasSupabaseCredentials = !!(supabaseUrl && supabaseAnonKey && 
  supabaseUrl.trim() !== '' && supabaseAnonKey.trim() !== '');

if (!hasSupabaseCredentials) {
  // Only log detailed errors in development
  if (import.meta.env.MODE === 'development') {
    console.warn('[Frontend Supabase] Missing credentials - using fallback mode');
    console.warn('[Frontend Supabase] URL:', supabaseUrl ? 'Present' : 'MISSING');
    console.warn('[Frontend Supabase] Key:', supabaseAnonKey ? 'Present' : 'MISSING');
    console.warn('[Frontend Supabase] Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY for full functionality');
  }
  
  // Import fallback client instead of throwing error
  console.log('[Frontend Supabase] Using fallback mode - authentication will be limited');
}

// Create either real or fallback Supabase client
let supabaseClient: any;

if (hasSupabaseCredentials) {
  supabaseClient = createClient(supabaseUrl!, supabaseAnonKey!);
  console.log('[Frontend Supabase] ✅ Connected to Supabase');
} else {
  // Use a simple mock client for deployment environments without credentials
  supabaseClient = {
    auth: {
      signInWithPassword: async () => ({
        data: { user: null, session: null },
        error: { message: 'Supabase not configured - add credentials for full functionality' }
      }),
      signOut: async () => ({ error: null }),
      getUser: async () => ({
        data: { user: null },
        error: { message: 'Supabase not configured' }
      }),
      onAuthStateChange: (callback: any) => ({
        data: { subscription: { unsubscribe: () => {} } }
      })
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({
            data: null,
            error: { message: 'Database not configured' }
          })
        })
      })
    })
  };
  console.log('[Frontend Supabase] 🔄 Using fallback mode - add credentials for full functionality');
}

export const supabase = supabaseClient;

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