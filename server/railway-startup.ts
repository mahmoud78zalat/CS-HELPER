/**
 * Railway-specific startup script to ensure proper server initialization
 * This addresses Railway health check failures by ensuring server starts correctly
 */

import express from 'express';
import { createServer } from 'http';

export function createRailwayServer() {
  const app = express();
  
  // Essential middleware for Railway
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: false, limit: '10mb' }));
  
  // CRITICAL: Basic health endpoint that MUST respond immediately
  app.get('/api/health', (req, res) => {
    console.log('[Railway Health] Health check requested');
    
    // Check if Supabase environment variables are configured
    const hasSupabaseUrl = !!(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL);
    const hasSupabaseKey = !!(process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY);
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    const missingVars: string[] = [];
    if (!hasSupabaseUrl) missingVars.push('SUPABASE_URL');
    if (!hasSupabaseKey) missingVars.push('SUPABASE_ANON_KEY');
    if (!hasServiceKey) missingVars.push('SUPABASE_SERVICE_ROLE_KEY');
    
    const healthData = {
      status: hasSupabaseUrl && hasSupabaseKey && hasServiceKey ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      platform: 'railway',
      port: process.env.PORT || '8080',
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        supabase_configured: hasSupabaseUrl && hasSupabaseKey && hasServiceKey,
        missing_vars: missingVars
      }
    };
    
    // Always return 200 for Railway health check - even if degraded
    console.log(`[Railway Health] Status: ${healthData.status}, Missing vars: ${healthData.environment.missing_vars.join(', ')}`);
    res.status(200).json(healthData);
  });

  // Fallback root endpoint
  app.get('/', (req, res) => {
    res.status(200).json({
      message: 'Customer Service Helper - Railway Deployment',
      health: '/api/health',
      status: 'running'
    });
  });

  return app;
}

export function startRailwayServer(app: express.Express) {
  const PORT = parseInt(process.env.PORT || '8080', 10);
  
  console.log('[Railway] Starting server configuration...');
  console.log('[Railway] PORT:', PORT);
  console.log('[Railway] NODE_ENV:', process.env.NODE_ENV);
  
  // CRITICAL: Must bind to 0.0.0.0 for Railway
  const server = createServer(app);
  
  return new Promise<void>((resolve, reject) => {
    server.listen(PORT, '0.0.0.0', () => {
      console.log('[Railway] ✅ Server successfully started');
      console.log('[Railway] 🌐 Listening on 0.0.0.0:' + PORT);
      console.log('[Railway] 🏥 Health endpoint: /api/health');
      resolve();
    });
    
    server.on('error', (error) => {
      console.error('[Railway] ❌ Server startup error:', error);
      reject(error);
    });
    
    // Railway signal handling
    process.on('SIGTERM', () => {
      console.log('[Railway] 🛑 SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('[Railway] 📋 Server closed');
        process.exit(0);
      });
    });
  });
}