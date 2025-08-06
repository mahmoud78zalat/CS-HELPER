/**
 * Railway.app specific configuration and utilities
 * Handles environment setup and deployment optimizations for Railway
 */

export function validateRailwayEnvironment() {
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY', 
    'SUPABASE_SERVICE_ROLE_KEY',
    'SESSION_SECRET'
  ];

  const missingVars = requiredVars.filter(envVar => !process.env[envVar]);
  
  // Set Railway defaults
  process.env.NODE_ENV = process.env.NODE_ENV || 'production';
  process.env.PORT = process.env.PORT || '8080';
  
  // Fix IPv6 connection issues for Railway deployment
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL_FIXED) {
    try {
      const { railwayPostgresFix } = require('./railway-postgres-fix');
      const fixedUrl = railwayPostgresFix.fixConnectionString(process.env.DATABASE_URL);
      process.env.DATABASE_URL = fixedUrl;
      process.env.DATABASE_URL_FIXED = 'true';
      console.log('[Railway] ✅ Applied IPv4 database connection fix');
    } catch (error: any) {
      console.error('[Railway] ⚠️ Could not apply database connection fix:', error.message);
    }
  }

  if (missingVars.length > 0) {
    console.warn(`⚠️ WARNING: Missing environment variables: ${missingVars.join(', ')}`);
    console.warn('🏥 Server will start in degraded mode for health checks');
    console.warn('📋 Application features will be limited without Supabase credentials');
    console.log('🚂 Railway Environment Configuration (DEGRADED):');
    console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`   PORT: ${process.env.PORT}`);
    console.log(`   Database: NOT CONFIGURED`);
    console.log(`   Status: Health endpoint only`);
  } else {
    console.log('🚂 Railway Environment Configuration:');
    console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`   PORT: ${process.env.PORT}`);
    console.log(`   Database: Supabase`);
    console.log(`   Supabase URL: ${process.env.VITE_SUPABASE_URL ? 'configured' : 'missing'}`);
    console.log(`   Service Role Key: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'configured' : 'missing'}`);
  }

  return {
    isProduction: process.env.NODE_ENV === 'production',
    port: parseInt(process.env.PORT || '8080', 10),
    hasSupabase: !!(process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    hasSessionSecret: !!process.env.SESSION_SECRET,
    isHealthyDeploy: missingVars.length === 0
  };
}

export function optimizeForRailway() {
  // Railway-specific optimizations
  if (process.env.NODE_ENV === 'production') {
    process.env.HTTP_KEEP_ALIVE_TIMEOUT = '65000';
    process.env.HTTP_HEADERS_TIMEOUT = '66000';
  }

  // Handle graceful shutdown for Railway
  const gracefulShutdown = (signal: string) => {
    console.log(`🚂 Railway deployment received ${signal}, shutting down gracefully...`);
    setTimeout(() => {
      console.log('🚂 Graceful shutdown completed');
      process.exit(0);
    }, 1000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  
  // Railway health check logging
  console.log('🏥 Railway health check endpoint available at /api/health');
}

export function logRailwayStatus() {
  console.log('🚂 Railway deployment ready!');
  console.log(`🌐 Server listening on port ${process.env.PORT || '8080'}`);
  console.log(`🔒 Authentication: Supabase`);
  console.log(`💾 Database: Supabase PostgreSQL`);
}