import { createClient } from '@supabase/supabase-js';

// Get environment variables with proper Vite access pattern
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('[Frontend Supabase] URL:', supabaseUrl);
console.log('[Frontend Supabase] Key present:', !!supabaseAnonKey);
console.log('[Frontend Supabase] Environment:', import.meta.env.MODE);
console.log('[Frontend Supabase] Available env vars:', Object.keys(import.meta.env).filter(key => key.includes('SUPABASE')));
console.log('[Frontend Supabase] Raw env access test:', {
  url: import.meta.env.VITE_SUPABASE_URL,
  keyLength: import.meta.env.VITE_SUPABASE_ANON_KEY?.length || 0
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Frontend Supabase] MISSING REQUIRED CREDENTIALS!');
  console.error('[Frontend Supabase] URL:', supabaseUrl ? 'Present' : 'MISSING');
  console.error('[Frontend Supabase] Key:', supabaseAnonKey ? 'Present' : 'MISSING');
  console.error('[Frontend Supabase] This is likely a Vite environment variable configuration issue');
  
  // For development, provide helpful debug info
  if (import.meta.env.MODE === 'development') {
    console.error('[Frontend Supabase] In development mode, ensure environment variables are properly set in Replit Secrets');
    console.error('[Frontend Supabase] Required variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
  }
  
  throw new Error('Missing required Supabase environment variables. Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your deployment environment.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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