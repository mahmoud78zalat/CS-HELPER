// Test endpoint to verify Vercel deployment works
import type { Request, Response } from 'express';

export default async function handler(req: Request, res: Response) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Test environment variables
    const envTest = {
      NODE_ENV: process.env.NODE_ENV,
      VITE_SUPABASE_URL: !!process.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: !!process.env.VITE_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      urlLength: process.env.VITE_SUPABASE_URL?.length || 0,
      keyLength: process.env.VITE_SUPABASE_ANON_KEY?.length || 0,
      serviceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0
    };

    // Test basic functionality
    const response = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      vercel: !!process.env.VERCEL,
      path: req.url,
      method: req.method,
      headers: {
        host: req.headers.host,
        origin: req.headers.origin,
        userAgent: req.headers['user-agent']
      },
      environmentVariables: envTest,
      message: 'Vercel serverless function is working correctly'
    };

    return res.json(response);
  } catch (error) {
    console.error('[Test API Error]:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}