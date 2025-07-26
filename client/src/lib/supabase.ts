import { createClient } from '@supabase/supabase-js';

// Get environment variables with multiple fallback patterns for different deployment environments
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 
                   import.meta.env.SUPABASE_URL || 
                   'https://lafldimdrginjqloihbh.supabase.co';

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 
                       import.meta.env.SUPABASE_ANON_KEY || 
                       'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhZmxkaW1kcmdpbmpxbG9paGJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4NDQwNTksImV4cCI6MjA1MjQyMDA1OX0.T4bUhpO_8AiQeGVcX4ZHlzNrKNP8xjNXkLxsS37qHd0';

console.log('[Frontend Supabase] URL:', supabaseUrl);
console.log('[Frontend Supabase] Key present:', !!supabaseAnonKey);
console.log('[Frontend Supabase] Environment:', import.meta.env.MODE);
console.log('[Frontend Supabase] Available env vars:', Object.keys(import.meta.env).filter(key => key.includes('SUPABASE')));

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Frontend Supabase] Missing credentials, using fallback values');
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