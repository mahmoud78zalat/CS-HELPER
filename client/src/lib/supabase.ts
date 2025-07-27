import { createClient } from '@supabase/supabase-js';

// Get environment variables - no fallback values to ensure deployment environment variables are used
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY;

console.log('[Frontend Supabase] URL:', supabaseUrl);
console.log('[Frontend Supabase] Key present:', !!supabaseAnonKey);
console.log('[Frontend Supabase] Environment:', import.meta.env.MODE);
console.log('[Frontend Supabase] Available env vars:', Object.keys(import.meta.env).filter(key => key.includes('SUPABASE')));

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Frontend Supabase] MISSING REQUIRED CREDENTIALS!');
  console.error('[Frontend Supabase] URL:', supabaseUrl ? 'Present' : 'MISSING');
  console.error('[Frontend Supabase] Key:', supabaseAnonKey ? 'Present' : 'MISSING');
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