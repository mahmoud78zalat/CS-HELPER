/**
 * Railway PostgreSQL Connection Fix
 * Handles IPv6/IPv4 compatibility issues when connecting to Supabase from Railway
 */

interface DatabaseCredentials {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

export class RailwayPostgresFix {
  /**
   * Parse DATABASE_URL and convert to IPv4-compatible format for Railway
   */
  static fixConnectionString(originalUrl: string): string {
    if (!process.env.RAILWAY_ENVIRONMENT_NAME && !process.env.RAILWAY_PROJECT_ID) {
      // Not on Railway, return original
      return originalUrl;
    }

    console.log('[Railway-Postgres] 🔧 Fixing DATABASE_URL for IPv4 compatibility...');

    try {
      const url = new URL(originalUrl);
      
      // Check if this is a direct Supabase connection
      if (url.hostname.includes('db.') && url.hostname.includes('.supabase.co')) {
        console.log('[Railway-Postgres] ⚠️ Direct connection detected, converting to pooler...');
        
        // Extract project ref from hostname like: db.projectref.supabase.co
        const projectRef = url.hostname.split('.')[1];
        
        if (projectRef) {
          // Create pooler connection string (session mode for persistent connections)
          const poolerHost = `aws-0-ap-northeast-1.pooler.supabase.com`;
          const poolerUrl = new URL(originalUrl);
          poolerUrl.hostname = poolerHost;
          poolerUrl.port = '5432';
          
          // Update username to include project ref for pooler
          const poolerUsername = `postgres.${projectRef}`;
          poolerUrl.username = poolerUsername;
          
          // Add pooler-specific query parameters
          const searchParams = new URLSearchParams(poolerUrl.search);
          searchParams.set('sslmode', 'require');
          searchParams.set('pgbouncer', 'true');
          poolerUrl.search = searchParams.toString();
          
          const fixedUrl = poolerUrl.toString();
          console.log('[Railway-Postgres] ✅ Converted to pooler URL for IPv4 compatibility');
          console.log(`[Railway-Postgres] Original: ${url.hostname}`);
          console.log(`[Railway-Postgres] Fixed: ${poolerHost}`);
          
          return fixedUrl;
        }
      }

      // Check for IPv6 addresses in hostname
      if (url.hostname.includes(':') && !url.hostname.startsWith('[')) {
        console.log('[Railway-Postgres] ⚠️ IPv6 address detected in hostname, this will fail on Railway');
        throw new Error(`Railway doesn't support IPv6 connections. Hostname: ${url.hostname}`);
      }

    } catch (error: any) {
      console.error('[Railway-Postgres] ❌ Failed to parse DATABASE_URL:', error.message);
      console.error('[Railway-Postgres] Please ensure you are using a Supabase pooler URL instead of direct connection');
      throw new Error(`Railway IPv4 compatibility issue: ${error.message}`);
    }

    return originalUrl;
  }

  /**
   * Get optimized connection configuration for Railway
   */
  static getRailwayConnectionConfig(connectionString: string) {
    const isRailway = !!(process.env.RAILWAY_ENVIRONMENT_NAME || process.env.RAILWAY_PROJECT_ID);
    
    if (!isRailway) {
      return {
        connectionString,
        ssl: { rejectUnauthorized: false }
      };
    }

    return {
      connectionString: this.fixConnectionString(connectionString),
      ssl: {
        rejectUnauthorized: false,
        // Additional SSL options for Railway compatibility
        servername: undefined, // Let PostgreSQL auto-detect
        checkServerIdentity: () => undefined // Disable hostname verification
      },
      // Railway-specific connection optimizations
      connectionTimeoutMillis: 15000, // 15 second timeout
      idleTimeoutMillis: 30000, // 30 second idle timeout
      max: 5, // Limit pool size for Railway resource constraints
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
      // Retry configuration for unstable Railway networking
      retryAttempts: 3,
      retryDelay: 1000
    };
  }

  /**
   * Test database connection with Railway-specific error handling
   */
  static async testConnection(connectionString: string): Promise<{ success: boolean; error?: string }> {
    const { Pool } = await import('pg');
    
    try {
      const config = this.getRailwayConnectionConfig(connectionString);
      const pool = new Pool(config);
      
      console.log('[Railway-Postgres] 🧪 Testing database connection...');
      
      // Test basic connectivity
      const client = await pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      
      console.log('[Railway-Postgres] ✅ Database connection successful');
      await pool.end();
      
      return { success: true };
      
    } catch (error: any) {
      console.error('[Railway-Postgres] ❌ Database connection failed:', error.message);
      
      // Check for IPv6-specific errors
      if (error.message.includes('ENETUNREACH') || error.message.includes('network unreachable')) {
        return {
          success: false,
          error: 'Railway IPv6 connection issue. Please use Supabase pooler URL instead of direct connection.'
        };
      }
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get environment-specific DATABASE_URL
   */
  static getDatabaseUrl(): string {
    const isRailway = !!(process.env.RAILWAY_ENVIRONMENT_NAME || process.env.RAILWAY_PROJECT_ID);
    
    // Try Railway-specific environment variables first
    if (isRailway) {
      const railwayDbUrl = process.env.DATABASE_URL_POOLER || process.env.DATABASE_URL;
      if (railwayDbUrl) {
        return this.fixConnectionString(railwayDbUrl);
      }
    }
    
    // Fallback to standard DATABASE_URL
    const standardUrl = process.env.DATABASE_URL;
    if (!standardUrl) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    
    return isRailway ? this.fixConnectionString(standardUrl) : standardUrl;
  }
}

// Export singleton pattern for easy use
export const railwayPostgresFix = RailwayPostgresFix;