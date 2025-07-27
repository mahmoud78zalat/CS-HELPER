import { Request, Response } from 'express';
import { storage } from './storage';

export async function healthCheck(req: Request, res: Response) {
  try {
    console.log('[Railway Health Check] Starting health check...');
    
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      platform: 'railway',
      database: 'unknown',
      storage: 'unknown',
      port: process.env.PORT || '8080'
    };

    // Quick environment check
    const hasSupabase = !!(process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
    console.log('[Railway Health Check] Supabase configured:', hasSupabase);

    if (!hasSupabase) {
      console.log('[Railway Health Check] Missing Supabase credentials - returning basic health');
      healthData.database = 'missing_credentials';
      healthData.storage = 'unconfigured';
      return res.status(200).json(healthData);
    }

    // Test database connection with timeout
    try {
      console.log('[Railway Health Check] Testing database connection...');
      const users = await Promise.race([
        storage.getAllUsers(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Database timeout')), 5000))
      ]);
      
      console.log('[Railway Health Check] Database test successful');
      healthData.database = 'connected';
      healthData.storage = 'supabase';
    } catch (error) {
      console.warn('[Railway Health Check] Database test failed, but app is running:', error);
      healthData.database = 'error';
      healthData.storage = 'unavailable';
    }

    // Always return 200 for Railway health check if server is running
    console.log('[Railway Health Check] Health check completed successfully');
    res.status(200).json(healthData);
  } catch (error) {
    console.error('[Railway Health Check] Critical error:', error);
    // Even on critical error, return 200 if we can respond
    res.status(200).json({
      status: 'degraded',
      timestamp: new Date().toISOString(),
      platform: 'railway',
      error: 'Partial functionality'
    });
  }
}