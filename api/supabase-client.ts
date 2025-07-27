// Serverless-optimized Supabase client for Vercel API functions
import { createClient } from '@supabase/supabase-js';

// Environment variable access for Vercel serverless
const getSupabaseCredentials = () => {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('[Serverless Supabase] Environment check:');
  console.log('[Serverless Supabase] URL present:', !!url);
  console.log('[Serverless Supabase] Anon key present:', !!anonKey);
  console.log('[Serverless Supabase] Service key present:', !!serviceRoleKey);

  if (!url || !anonKey) {
    throw new Error(`Missing Supabase credentials: URL=${!!url}, Key=${!!anonKey}`);
  }

  return { url, anonKey, serviceRoleKey };
};

// Create Supabase client instances
export const createServerlessSupabaseClient = () => {
  const { url, anonKey } = getSupabaseCredentials();
  return createClient(url, anonKey);
};

export const createServerlessAdminClient = () => {
  const { url, serviceRoleKey } = getSupabaseCredentials();
  if (!serviceRoleKey) {
    throw new Error('Service role key not available for admin operations');
  }
  return createClient(url, serviceRoleKey);
};

// Test connection function
export const testServerlessConnection = async () => {
  try {
    const client = createServerlessAdminClient();
    const { data: users, error } = await client
      .from('users')
      .select('*')
      .limit(1);

    if (error) {
      console.error('[Serverless Supabase] Connection test failed:', error);
      return { success: false, error: error.message, userCount: 0 };
    }

    console.log('[Serverless Supabase] Connection test successful, users found:', users?.length || 0);
    return { success: true, userCount: users?.length || 0 };
  } catch (error) {
    console.error('[Serverless Supabase] Connection test error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      userCount: 0 
    };
  }
};