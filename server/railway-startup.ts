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
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      platform: 'railway',
      port: process.env.PORT || '8080'
    });
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