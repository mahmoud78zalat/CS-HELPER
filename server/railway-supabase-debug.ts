import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

/**
 * Railway + Supabase debugging endpoint
 * Helps diagnose IPv6 connectivity issues specific to Railway deployment
 */
export async function railwaySupabaseDebug(req: Request, res: Response) {
  const debugInfo: any = {
    timestamp: new Date().toISOString(),
    environment: 'Railway',
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    railwayDetected: !!(process.env.RAILWAY_ENVIRONMENT_NAME || process.env.RAILWAY_PROJECT_ID),
    environmentVariables: {
      RAILWAY_ENVIRONMENT_NAME: process.env.RAILWAY_ENVIRONMENT_NAME || 'Not set',
      RAILWAY_PROJECT_ID: process.env.RAILWAY_PROJECT_ID || 'Not set',
      NODE_ENV: process.env.NODE_ENV || 'Not set',
      PORT: process.env.PORT || 'Not set'
    },
    supabaseCredentials: {
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ? 'Present' : 'Missing',
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY ? 'Present' : 'Missing',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Present' : 'Missing',
      urlLength: process.env.VITE_SUPABASE_URL?.length || 0,
      keyLength: process.env.VITE_SUPABASE_ANON_KEY?.length || 0,
      serviceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0
    }
  };

  // Test Supabase connectivity with detailed error reporting
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    console.log('[Railway-Debug] Testing Supabase connectivity...');
    
    try {
      // Create client with Railway-optimized settings
      const client = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false,
          detectSessionInUrl: false
        },
        global: {
          headers: {
            'User-Agent': 'Railway-Supabase-Debug/1.0',
            'X-Railway-Debug': 'true'
          }
        }
      });

      // Test 1: Simple connection test
      const startTime = Date.now();
      try {
        const { data, error, count } = await client
          .from('users')
          .select('id', { count: 'exact' })
          .limit(1);
        
        const responseTime = Date.now() - startTime;
        
        debugInfo.supabaseTests = {
          connectionTest: {
            success: !error,
            responseTime: `${responseTime}ms`,
            userCount: count,
            error: error ? {
              message: error.message,
              code: error.code,
              details: error.details
            } : null
          }
        };

        console.log('[Railway-Debug] Connection test completed:', !error ? 'SUCCESS' : 'FAILED');
        
      } catch (connError: any) {
        debugInfo.supabaseTests = {
          connectionTest: {
            success: false,
            error: {
              message: connError.message,
              code: connError.code,
              type: connError.constructor.name,
              stack: connError.stack?.split('\n').slice(0, 3)
            },
            railwayIssue: connError.message?.includes('ENETUNREACH') || 
                          connError.message?.includes('fetch failed') ||
                          connError.message?.includes('IPv6')
          }
        };

        console.error('[Railway-Debug] Connection test failed:', connError.message);
        
        // Railway-specific error analysis
        if (connError.message?.includes('ENETUNREACH')) {
          debugInfo.diagnosis = {
            issue: 'Railway IPv6 Connectivity Problem',
            description: 'Railway does not support IPv6 outbound connections, but Supabase uses IPv6 by default',
            solutions: [
              'Use Supavisor connection string (IPv4 compatible)',
              'Enable dedicated IPv4 address in Supabase (paid feature)',
              'Use Supabase client libraries instead of direct database connections'
            ]
          };
        } else if (connError.message?.includes('fetch failed')) {
          debugInfo.diagnosis = {
            issue: 'Network Connectivity Issue',
            description: 'General network connectivity problem between Railway and Supabase',
            possibleCauses: [
              'IPv6 compatibility issue',
              'DNS resolution problem',
              'Firewall or network restriction',
              'Supabase service temporary unavailability'
            ]
          };
        }
      }

    } catch (clientError: any) {
      debugInfo.supabaseTests = {
        clientCreation: {
          success: false,
          error: {
            message: clientError.message,
            type: clientError.constructor.name
          }
        }
      };
      console.error('[Railway-Debug] Client creation failed:', clientError.message);
    }
  } else {
    debugInfo.supabaseTests = {
      skipped: 'Missing required environment variables'
    };
  }

  // Add network diagnostics
  debugInfo.networkInfo = {
    hostname: req.hostname,
    protocol: req.protocol,
    userAgent: req.get('User-Agent'),
    forwardedFor: req.get('X-Forwarded-For'),
    railwayHeaders: Object.keys(req.headers)
      .filter(key => key.toLowerCase().includes('railway'))
      .reduce((obj: any, key) => {
        obj[key] = req.headers[key];
        return obj;
      }, {})
  };

  console.log('[Railway-Debug] Debug info generated, returning response');
  
  res.status(200).json({
    status: 'Railway Supabase Debug Report',
    ...debugInfo
  });
}

/**
 * Simple Railway health check with Supabase status
 */
export async function railwayHealthCheck(req: Request, res: Response) {
  const health: any = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'BFL Customer Service',
    railway: true,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  };

  // Quick Supabase connectivity check
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const client = createClient(supabaseUrl, supabaseKey);
      const { error } = await client.from('users').select('id').limit(1);
      
      health.supabase = {
        connected: !error,
        error: error ? error.message : null
      };
    } catch (err: any) {
      health.supabase = {
        connected: false,
        error: err.message,
        railwayIssue: err.message?.includes('ENETUNREACH') || err.message?.includes('fetch failed')
      };
    }
  } else {
    health.supabase = {
      connected: false,
      error: 'Missing environment variables'
    };
  }

  res.status(200).json(health);
}