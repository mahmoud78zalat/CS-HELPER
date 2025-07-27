// Serverless-compatible Supabase configuration for Vercel
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient<any, 'public', any> | null = null;
let serviceClient: SupabaseClient<any, 'public', any> | null = null;

export function getSupabaseConfig() {
  // For Vercel serverless functions, environment variables are available via process.env
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('[Vercel Supabase Config] Environment check:');
  console.log('[Vercel Supabase Config] NODE_ENV:', process.env.NODE_ENV);
  console.log('[Vercel Supabase Config] Platform: Vercel Serverless');
  console.log('[Vercel Supabase Config] URL present:', !!supabaseUrl);
  console.log('[Vercel Supabase Config] Anon Key present:', !!supabaseAnonKey);
  console.log('[Vercel Supabase Config] Service Key present:', !!serviceRoleKey);

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      `Missing Supabase credentials in serverless environment. ` +
      `URL: ${!!supabaseUrl}, Key: ${!!supabaseAnonKey}. ` +
      `Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in Vercel environment variables.`
    );
  }

  return {
    url: supabaseUrl.trim(),
    anonKey: supabaseAnonKey.trim(),
    serviceRoleKey: serviceRoleKey?.trim() || null
  };
}

export function getSupabaseClient(): SupabaseClient<any, 'public', any> {
  if (!supabaseClient) {
    const config = getSupabaseConfig();
    
    // Optimized for serverless (stateless) environments
    const clientOptions = {
      auth: {
        persistSession: false, // No session persistence in serverless
        detectSessionInUrl: false,
        autoRefreshToken: false, // No token refresh in serverless
      },
      global: {
        headers: {
          'User-Agent': 'Vercel-Serverless/1.0',
        },
      },
      db: {
        schema: 'public' as const,
      },
    };

    supabaseClient = createClient(config.url, config.anonKey, clientOptions);
    console.log('[Vercel Supabase Config] ✅ Client initialized for serverless');
  }

  return supabaseClient!;
}

export function getServiceClient(): SupabaseClient<any, 'public', any> {
  if (!serviceClient) {
    const config = getSupabaseConfig();
    
    if (!config.serviceRoleKey) {
      console.warn('[Vercel Supabase Config] ⚠️ No service role key - using anon client');
      return getSupabaseClient();
    }

    const clientOptions = {
      auth: {
        persistSession: false,
        detectSessionInUrl: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          'User-Agent': 'Vercel-Serverless-Admin/1.0',
        },
      },
      db: {
        schema: 'public' as const,
      },
    };

    serviceClient = createClient(config.url, config.serviceRoleKey, clientOptions);
    console.log('[Vercel Supabase Config] ✅ Service client initialized for serverless');
  }

  return serviceClient!;
}

// Test connection function for serverless
export async function testServerlessConnection(): Promise<{ success: boolean; userCount?: number; error?: string }> {
  try {
    const client = getSupabaseClient();
    
    const { data, error, count } = await client
      .from('users')
      .select('id', { count: 'exact' })
      .limit(1);

    if (error) {
      console.error('[Vercel Supabase Config] Connection test failed:', error);
      return { success: false, error: error.message };
    }

    console.log('[Vercel Supabase Config] ✅ Connection test successful, user count:', count);
    return { success: true, userCount: count || 0 };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Vercel Supabase Config] Connection test exception:', errorMessage);
    return { success: false, error: errorMessage };
  }
}