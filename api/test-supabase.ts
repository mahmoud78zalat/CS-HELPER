import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Test Supabase connection with multiple environment variable patterns
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('[Vercel] Environment check:');
    console.log('[Vercel] NODE_ENV:', process.env.NODE_ENV);
    console.log('[Vercel] Available Supabase env vars:', Object.keys(process.env).filter(key => key.includes('SUPABASE')));
    console.log('[Vercel] URL present:', !!supabaseUrl);
    console.log('[Vercel] Key present:', !!supabaseKey);
    console.log('[Vercel] Service key present:', !!serviceRoleKey);
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        error: 'Missing Supabase credentials',
        details: {
          url: !!supabaseUrl,
          key: !!supabaseKey,
          serviceKey: !!serviceRoleKey,
          availableEnvVars: Object.keys(process.env).filter(key => key.includes('SUPABASE'))
        }
      });
    }
    
    // Test connection
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, role')
      .limit(5);
    
    if (error) {
      return res.status(500).json({
        error: 'Supabase connection failed',
        details: error.message,
        credentials: {
          url: supabaseUrl.substring(0, 20) + '...',
          keyLength: supabaseKey.length
        }
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Supabase connected successfully',
      userCount: users?.length || 0,
      sampleUser: users?.[0] || null,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Vercel] Supabase test error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}