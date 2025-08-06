/**
 * Railway Database Connection Test
 * Tests database connectivity on startup to catch IPv6 issues early
 */

import { railwayPostgresFix } from './railway-postgres-fix';

export async function testRailwayDatabaseConnection(): Promise<void> {
  const isRailway = !!(process.env.RAILWAY_ENVIRONMENT_NAME || process.env.RAILWAY_PROJECT_ID);
  
  if (!isRailway) {
    console.log('[Railway-DB-Test] ℹ️ Not on Railway, skipping database connection test');
    return;
  }

  console.log('[Railway-DB-Test] 🧪 Testing database connection on Railway deployment...');

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.warn('[Railway-DB-Test] ⚠️ DATABASE_URL not found, skipping test');
    return;
  }

  try {
    // Test the connection with Railway-specific fixes
    const result = await railwayPostgresFix.testConnection(databaseUrl);
    
    if (result.success) {
      console.log('[Railway-DB-Test] ✅ Database connection test passed');
    } else {
      console.error('[Railway-DB-Test] ❌ Database connection test failed:', result.error);
      
      // Check if this is an IPv6 issue
      if (result.error?.includes('IPv6') || result.error?.includes('ENETUNREACH')) {
        console.error('[Railway-DB-Test] 🚨 CRITICAL: IPv6 connectivity issue detected!');
        console.error('[Railway-DB-Test] 🔧 SOLUTION: Please update your DATABASE_URL to use Supabase pooler:');
        console.error('[Railway-DB-Test] 📋 Example: postgresql://postgres.projectref:password@aws-0-region.pooler.supabase.com:5432/postgres');
        console.error('[Railway-DB-Test] 📖 More info: https://supabase.com/docs/guides/database/connecting-to-postgres');
      }
    }
  } catch (error: any) {
    console.error('[Railway-DB-Test] ❌ Database test error:', error.message);
  }
}

/**
 * Test Supabase client connectivity
 */
export async function testRailwaySupabaseConnection(): Promise<void> {
  const isRailway = !!(process.env.RAILWAY_ENVIRONMENT_NAME || process.env.RAILWAY_PROJECT_ID);
  
  if (!isRailway) {
    console.log('[Railway-Supabase-Test] ℹ️ Not on Railway, skipping Supabase connection test');
    return;
  }

  console.log('[Railway-Supabase-Test] 🧪 Testing Supabase client connection...');

  try {
    const { railwaySupabase } = await import('./railway-supabase-client');
    
    // Test client initialization
    const client = await railwaySupabase.getClient();
    
    // Test basic query
    const { data, error } = await client
      .from('users')
      .select('id')
      .limit(1);

    if (error) {
      console.error('[Railway-Supabase-Test] ❌ Supabase query failed:', error.message);
      
      // Check for network-related errors
      if (error.message.includes('fetch failed') || error.message.includes('network')) {
        console.error('[Railway-Supabase-Test] 🚨 Network connectivity issue detected');
        console.error('[Railway-Supabase-Test] 🔧 This may be related to IPv6/IPv4 compatibility');
      }
    } else {
      console.log('[Railway-Supabase-Test] ✅ Supabase client connection test passed');
    }

  } catch (error: any) {
    console.error('[Railway-Supabase-Test] ❌ Supabase test error:', error.message);
  }
}

/**
 * Comprehensive Railway connectivity test
 */
export async function runRailwayConnectivityTests(): Promise<void> {
  console.log('[Railway-Connectivity] 🚀 Starting Railway connectivity tests...');
  
  await Promise.all([
    testRailwayDatabaseConnection(),
    testRailwaySupabaseConnection()
  ]);
  
  console.log('[Railway-Connectivity] ✅ Railway connectivity tests completed');
}