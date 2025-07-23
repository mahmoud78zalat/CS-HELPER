import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('[Frontend Supabase] URL:', supabaseUrl ? 'SET' : 'MISSING');
console.log('[Frontend Supabase] Key:', supabaseAnonKey ? 'SET' : 'MISSING');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Frontend Supabase] Missing environment variables!');
  console.log('[Frontend Supabase] Available env vars:', Object.keys(import.meta.env));
  throw new Error('Missing Supabase environment variables');
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