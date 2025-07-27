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