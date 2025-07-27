/**
 * Render.com specific configuration and utilities
 * Handles environment setup and deployment optimizations
 */

export function validateRenderEnvironment() {
  const requiredVars = [
    'NODE_ENV',
    'PORT'
  ];

  const missingVars = requiredVars.filter(envVar => !process.env[envVar]);
  
  if (missingVars.length > 0) {
    console.warn(`⚠️ Missing recommended environment variables: ${missingVars.join(', ')}`);
  }

  // Set defaults for Render
  process.env.NODE_ENV = process.env.NODE_ENV || 'production';
  process.env.PORT = process.env.PORT || '5000';

  console.log('🌐 Render Environment Configuration:');
  console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`   PORT: ${process.env.PORT}`);
  
  // Check database configuration
  if (process.env.DATABASE_URL) {
    console.log('   Database: Render PostgreSQL');
  } else if (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL) {
    console.log('   Database: Supabase');
  } else {
    console.log('   Database: Memory storage (not recommended for production)');
  }

  return {
    isProduction: process.env.NODE_ENV === 'production',
    port: parseInt(process.env.PORT || '5000', 10),
    hasDatabase: !!(process.env.DATABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL),
    hasSessionSecret: !!process.env.SESSION_SECRET
  };
}

export function optimizeForRender() {
  // Enable keep-alive for better performance on Render
  if (process.env.NODE_ENV === 'production') {
    process.env.HTTP_KEEP_ALIVE_TIMEOUT = '65000';
    process.env.HTTP_HEADERS_TIMEOUT = '66000';
  }

  // Handle graceful shutdown
  const gracefulShutdown = (signal: string) => {
    console.log(`📋 Received ${signal}, shutting down gracefully...`);
    process.exit(0);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}