/**
 * Railway Environment Variable Fix
 * Handles missing environment variables and converts Supabase URLs to Railway-compatible format
 */

export class RailwayEnvironmentFix {
  /**
   * Generate DATABASE_URL from Supabase credentials when missing
   */
  static generateDatabaseUrl(): string | null {
    // Check if DATABASE_URL already exists
    if (process.env.DATABASE_URL) {
      return process.env.DATABASE_URL;
    }

    console.log('[Railway-Env] DATABASE_URL missing, attempting to generate from Supabase credentials...');

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    
    if (!supabaseUrl) {
      console.error('[Railway-Env] ❌ Cannot generate DATABASE_URL: SUPABASE_URL missing');
      return null;
    }

    try {
      // Extract project reference from Supabase URL
      const urlObj = new URL(supabaseUrl);
      const projectRef = urlObj.hostname.split('.')[0];
      
      if (!projectRef) {
        console.error('[Railway-Env] ❌ Cannot extract project reference from Supabase URL');
        return null;
      }

      // Check for database password in environment
      const dbPassword = process.env.SUPABASE_DB_PASSWORD || process.env.DB_PASSWORD;
      
      if (!dbPassword) {
        console.warn('[Railway-Env] ⚠️ Database password not found, using placeholder');
        console.warn('[Railway-Env] Please set SUPABASE_DB_PASSWORD environment variable');
        return null;
      }

      // Generate Railway-compatible pooler URL
      const isRailway = !!(process.env.RAILWAY_ENVIRONMENT_NAME || process.env.RAILWAY_PROJECT_ID);
      
      if (isRailway) {
        // Use pooler for IPv4 compatibility on Railway
        const poolerUrl = `postgresql://postgres.${projectRef}:${dbPassword}@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres?sslmode=require&pgbouncer=true`;
        console.log('[Railway-Env] ✅ Generated Railway-compatible pooler DATABASE_URL');
        return poolerUrl;
      } else {
        // Use direct connection for development
        const directUrl = `postgresql://postgres:${dbPassword}@db.${projectRef}.supabase.co:5432/postgres?sslmode=require`;
        console.log('[Railway-Env] ✅ Generated direct DATABASE_URL for development');
        return directUrl;
      }

    } catch (error: any) {
      console.error('[Railway-Env] ❌ Failed to generate DATABASE_URL:', error.message);
      return null;
    }
  }

  /**
   * Apply all Railway environment fixes
   */
  static applyFixes(): void {
    const isRailway = !!(process.env.RAILWAY_ENVIRONMENT_NAME || process.env.RAILWAY_PROJECT_ID);
    
    console.log(`[Railway-Env] 🔧 Applying environment fixes (Railway: ${isRailway})...`);

    // Fix DATABASE_URL if missing
    if (!process.env.DATABASE_URL) {
      const generatedUrl = this.generateDatabaseUrl();
      if (generatedUrl) {
        process.env.DATABASE_URL = generatedUrl;
        console.log('[Railway-Env] ✅ DATABASE_URL generated and set');
      }
    } else if (isRailway) {
      // Fix existing DATABASE_URL for IPv4 compatibility
      try {
        const { railwayPostgresFix } = require('./railway-postgres-fix');
        const fixedUrl = railwayPostgresFix.fixConnectionString(process.env.DATABASE_URL);
        if (fixedUrl !== process.env.DATABASE_URL) {
          process.env.DATABASE_URL = fixedUrl;
          console.log('[Railway-Env] ✅ DATABASE_URL converted to IPv4-compatible format');
        }
      } catch (error) {
        console.warn('[Railway-Env] ⚠️ Could not apply IPv4 fix to DATABASE_URL');
      }
    }

    // Normalize Supabase environment variables
    if (!process.env.SUPABASE_URL && process.env.VITE_SUPABASE_URL) {
      process.env.SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    }
    
    if (!process.env.SUPABASE_ANON_KEY && process.env.VITE_SUPABASE_ANON_KEY) {
      process.env.SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
    }

    // Set Railway-specific defaults
    if (isRailway) {
      process.env.NODE_ENV = process.env.NODE_ENV || 'production';
      process.env.PORT = process.env.PORT || '8080';
      process.env.HOST = '0.0.0.0'; // Force IPv4 binding
      
      // Railway-specific network optimizations
      process.env.HTTP_KEEP_ALIVE_TIMEOUT = process.env.HTTP_KEEP_ALIVE_TIMEOUT || '65000';
      process.env.HTTP_HEADERS_TIMEOUT = process.env.HTTP_HEADERS_TIMEOUT || '66000';
    }

    console.log('[Railway-Env] ✅ Environment fixes applied successfully');
  }

  /**
   * Validate critical environment variables
   */
  static validateEnvironment(): { valid: boolean; missing: string[]; warnings: string[] } {
    const required = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'SESSION_SECRET'
    ];

    const optional = [
      'DATABASE_URL',
      'SUPABASE_DB_PASSWORD'
    ];

    const missing = required.filter(key => !process.env[key]);
    const warnings = optional.filter(key => !process.env[key]);

    return {
      valid: missing.length === 0,
      missing,
      warnings
    };
  }

  /**
   * Log environment status
   */
  static logEnvironmentStatus(): void {
    const validation = this.validateEnvironment();
    const isRailway = !!(process.env.RAILWAY_ENVIRONMENT_NAME || process.env.RAILWAY_PROJECT_ID);
    
    console.log('[Railway-Env] 📊 Environment Status Report:');
    console.log(`[Railway-Env] Platform: ${isRailway ? 'Railway' : 'Development'}`);
    console.log(`[Railway-Env] Valid: ${validation.valid ? '✅' : '❌'}`);
    
    if (validation.missing.length > 0) {
      console.error(`[Railway-Env] Missing required variables: ${validation.missing.join(', ')}`);
    }
    
    if (validation.warnings.length > 0) {
      console.warn(`[Railway-Env] Missing optional variables: ${validation.warnings.join(', ')}`);
    }

    if (process.env.DATABASE_URL) {
      const url = new URL(process.env.DATABASE_URL);
      console.log(`[Railway-Env] Database: ${url.hostname}`);
      
      if (isRailway && url.hostname.includes('pooler.supabase.com')) {
        console.log('[Railway-Env] ✅ Using IPv4-compatible pooler connection');
      } else if (isRailway && url.hostname.includes('db.') && url.hostname.includes('.supabase.co')) {
        console.warn('[Railway-Env] ⚠️ Using direct connection on Railway (may cause IPv6 issues)');
      }
    } else {
      console.warn('[Railway-Env] ⚠️ DATABASE_URL not configured');
    }
  }
}

// Apply fixes immediately when module is imported
RailwayEnvironmentFix.applyFixes();