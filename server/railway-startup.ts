/**
 * Railway-specific startup script to ensure proper server initialization
 * This addresses Railway health check failures by ensuring server starts correctly
 */

import express from 'express';
import { createServer } from 'http';
import { logger, createLoggingMiddleware, createErrorLoggingMiddleware } from './railway-logging';
import { presenceMonitor } from './presence-monitor';

export function createRailwayServer() {
  const app = express();
  
  // Initialize comprehensive logging
  logger.info('🚀 Initializing Railway Express Server');
  logger.logSystemInfo();
  logger.logEnvironment();
  
  // Add enhanced logging middleware
  app.use(createLoggingMiddleware());
  
  // Essential middleware for Railway
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: false, limit: '10mb' }));
  
  // Add error logging middleware
  app.use(createErrorLoggingMiddleware());
  
  // CRITICAL: Basic health endpoint that MUST respond immediately
  app.get('/api/health', (req, res) => {
    const context = { component: 'health-check' };
    logger.info(`Health check requested from ${req.ip || 'unknown'}`, context);
    
    // Check if Supabase environment variables are configured
    const hasSupabaseUrl = !!(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL);
    const hasSupabaseKey = !!(process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY);
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    const missingVars: string[] = [];
    if (!hasSupabaseUrl) missingVars.push('VITE_SUPABASE_URL');
    if (!hasSupabaseKey) missingVars.push('VITE_SUPABASE_ANON_KEY');
    if (!hasServiceKey) missingVars.push('SUPABASE_SERVICE_ROLE_KEY');
    
    const isHealthy = hasSupabaseUrl && hasSupabaseKey && hasServiceKey;
    
    const healthData = {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      platform: 'railway',
      port: process.env.PORT || '8080',
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        supabase_configured: isHealthy,
        missing_vars: missingVars,
        all_env_vars: Object.keys(process.env).filter(key => 
          key.startsWith('VITE_') || 
          key.startsWith('SUPABASE_') || 
          key.includes('SECRET') ||
          key === 'NODE_ENV' ||
          key === 'PORT'
        )
      },
      server_info: {
        uptime_seconds: process.uptime(),
        memory_usage: process.memoryUsage(),
        node_version: process.version,
        platform: process.platform
      },
      logs: {
        recent_logs: logger.getLogBuffer().slice(-10) // Last 10 log entries
      }
    };
    
    logger.info(`Health check status: ${healthData.status}`, context);
    if (missingVars.length > 0) {
      logger.warn(`Missing environment variables: ${missingVars.join(', ')}`, context);
    }
    
    // Always return 200 for Railway health check - even if degraded
    res.status(200).json(healthData);
  });

  // Root health endpoint for Caddy
  app.get('/health', (req, res) => {
    logger.info('Root health check requested');
    res.status(200).json({
      status: 'healthy',
      service: 'railway-frontend',
      timestamp: new Date().toISOString()
    });
  });

  // Debug endpoint for accessing logs
  app.get('/api/debug/logs', (req, res) => {
    const context = { component: 'debug' };
    logger.info('Debug logs requested', context);
    
    res.status(200).json({
      logs: logger.getLogBuffer(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        available_vars: Object.keys(process.env).filter(key => 
          key.startsWith('VITE_') || 
          key.startsWith('SUPABASE_') || 
          key.startsWith('RAILWAY_') ||
          key.includes('SECRET') ||
          key === 'NODE_ENV' ||
          key === 'PORT'
        )
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version,
        platform: process.platform,
        pid: process.pid
      }
    });
  });

  return app;
}

export function startRailwayServer(app: express.Express) {
  const PORT = parseInt(process.env.PORT || '8080', 10);
  const context = { component: 'server-startup' };
  
  logger.info('=============================================', context);
  logger.info('Starting Railway server configuration...', context);
  logger.logSystemInfo();
  logger.logEnvironment();
  
  // Validate PORT
  if (isNaN(PORT) || PORT < 1 || PORT > 65535) {
    const error = new Error(`Invalid PORT: ${process.env.PORT}. Must be a number between 1-65535`);
    logger.error('PORT validation failed', error, context);
    throw error;
  }
  
  // CRITICAL: Must bind to 0.0.0.0 for Railway
  const server = createServer(app);
  
  // Initialize presence monitor for real-time user status tracking
  logger.info('🔄 Starting real-time presence monitoring system...', context);
  presenceMonitor.start();
  logger.info('✅ Presence monitor initialized', context);

  // Enhanced server error handling
  server.on('error', (error: any) => {
    logger.error('Server error event triggered', error, context);
    logger.debug('Error details', {
      code: error.code,
      port: PORT,
      timestamp: new Date().toISOString()
    }, context);
    
    if (error.code === 'EADDRINUSE') {
      logger.error('Port already in use - checking for existing processes', undefined, context);
    } else if (error.code === 'EACCES') {
      logger.error('Permission denied - check port access rights', undefined, context);
    }
  });
  
  server.on('listening', () => {
    const address = server.address();
    logger.info('Server listening event triggered', context);
    logger.debug('Address info', address, context);
  });
  
  server.on('connection', (socket) => {
    logger.debug(`New connection established from: ${socket.remoteAddress}`, undefined, context);
  });
  
  return new Promise<void>((resolve, reject) => {
    logger.info(`Attempting to bind to 0.0.0.0:${PORT}...`, context);
    
    server.listen(PORT, '0.0.0.0', () => {
      logger.info('✅ Server successfully started', context);
      logger.info(`🌐 Listening on 0.0.0.0:${PORT}`, context);
      logger.info('🏥 Health endpoints available:', context);
      logger.info('  - /api/health (detailed)', context);
      logger.info('  - /health (simple)', context);
      logger.info('  - /api/debug/logs (debug)', context);
      logger.info('📝 Enhanced logging enabled', context);
      logger.info(`🔄 Process PID: ${process.pid}`, context);
      logger.info('=============================================', context);
      resolve();
    });
    
    server.on('error', (error) => {
      logger.error('Server startup error in Promise', error, context);
      reject(error);
    });
    
    // Enhanced Railway signal handling
    const gracefulShutdown = (signal: string) => {
      const shutdownContext = { component: 'shutdown' };
      logger.info(`🛑 ${signal} received, initiating graceful shutdown...`, shutdownContext);
      logger.info(`Uptime: ${process.uptime()} seconds`, shutdownContext);
      
      // Stop presence monitor
      logger.info('⏹️ Stopping presence monitor...', shutdownContext);
      presenceMonitor.stop();
      
      server.close((error) => {
        if (error) {
          logger.error('Error during server close', error, shutdownContext);
          process.exit(1);
        } else {
          logger.info('✅ Server closed successfully', shutdownContext);
          logger.info('📋 Process exiting cleanly', shutdownContext);
          process.exit(0);
        }
      });
      
      // Force exit after 10 seconds
      setTimeout(() => {
        logger.error('⏰ Force exit after 10 seconds timeout', undefined, shutdownContext);
        process.exit(1);
      }, 10000);
    };
    
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Catch uncaught exceptions
    process.on('uncaughtException', (error) => {
      const criticalContext = { component: 'critical-error' };
      logger.error('💥 Uncaught Exception', error, criticalContext);
      process.exit(1);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      const criticalContext = { component: 'critical-error' };
      logger.error('💥 Unhandled Promise Rejection', new Error(String(reason)), criticalContext);
      logger.debug('Promise details', { promise }, criticalContext);
      process.exit(1);
    });
  });
}