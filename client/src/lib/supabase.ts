import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('[Frontend Supabase] URL:', supabaseUrl || 'MISSING');
console.log('[Frontend Supabase] Key:', supabaseAnonKey ? 'SET' : 'MISSING');
console.log('[Frontend Supabase] Available env vars:', Object.keys(import.meta.env));

// Fallback values in case env vars are not properly loaded
const fallbackUrl = 'https://lafldimdrginjqloihbh.supabase.co';
const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhZmxkaW1kcmdpbmpxbG9paGJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyODk0MzcsImV4cCI6MjA2ODg2NTQzN0.odt1bQ6leB_wWSVV4emTt5bpNts-d0NeZZ-cnBT3SYU';

const finalUrl = supabaseUrl || fallbackUrl;
const finalKey = supabaseAnonKey || fallbackKey;

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('[Frontend Supabase] Using fallback values from server...');
}

export const supabase = createClient(finalUrl, finalKey);

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