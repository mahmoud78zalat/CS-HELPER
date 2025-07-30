import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Railway-optimized Supabase client factory
 * Specifically designed to handle Railway's IPv6 connectivity limitations
 */
export class RailwaySupabaseClient {
  private static instance: RailwaySupabaseClient;
  private client: SupabaseClient | null = null;
  private serviceClient: SupabaseClient | null = null;
  private isRailwayProduction: boolean;
  private connectionRetries = 0;
  private maxRetries = 5;

  constructor() {
    this.isRailwayProduction = !!(
      process.env.RAILWAY_ENVIRONMENT_NAME ||
      process.env.RAILWAY_PROJECT_ID ||
      process.env.NODE_ENV === 'production'
    );
    
    console.log('[Railway-Supabase] Environment detected:', {
      railway: this.isRailwayProduction,
      nodeEnv: process.env.NODE_ENV,
      railwayEnv: process.env.RAILWAY_ENVIRONMENT_NAME || 'not-set'
    });
  }

  static getInstance(): RailwaySupabaseClient {
    if (!RailwaySupabaseClient.instance) {
      RailwaySupabaseClient.instance = new RailwaySupabaseClient();
    }
    return RailwaySupabaseClient.instance;
  }

  /**
   * Create Railway-optimized Supabase client with IPv4 compatibility
   */
  private createRailwayClient(url: string, key: string, isServiceRole = false): SupabaseClient {
    // Railway-specific client configuration
    const railwayOptions = {
      auth: {
        persistSession: !isServiceRole, // Service role doesn't need session persistence
        detectSessionInUrl: !isServiceRole,
        ...(this.isRailwayProduction && { flowType: 'pkce' as const })
      },
      global: {
        headers: {
          'User-Agent': `BFL-CustomerService/${isServiceRole ? 'Service' : 'Client'}/1.0`,
          'Connection': 'keep-alive',
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...(this.isRailwayProduction && {
            'X-Railway-Client': 'true',
            'X-IPv4-Preferred': 'true', // Hint for IPv4 preference
            'Cache-Control': 'no-cache'
          })
        }
      },
      // Railway-specific database configuration
      db: {
        schema: 'public'
      },
      // Force specific endpoint configuration for Railway compatibility
      ...(this.isRailwayProduction && {
        supabaseUrl: url,
        supabaseKey: key
      })
    };

    console.log(`[Railway-Supabase] Creating ${isServiceRole ? 'service role' : 'regular'} client with Railway optimization`);
    
    return createClient(url, key, railwayOptions) as any;
  }

  /**
   * Initialize clients with Railway-specific error handling
   */
  async initializeClients(): Promise<{ success: boolean; error?: string }> {
    try {
      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
      const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        return {
          success: false,
          error: 'Missing required Supabase credentials'
        };
      }

      // Create regular client
      this.client = this.createRailwayClient(supabaseUrl, supabaseKey, false);
      
      // Create service role client if available
      if (serviceRoleKey) {
        this.serviceClient = this.createRailwayClient(supabaseUrl, serviceRoleKey, true);
      } else {
        this.serviceClient = this.client;
      }

      // Test connection with Railway-specific retry logic
      const connectionTest = await this.testRailwayConnection();
      
      if (connectionTest.success) {
        console.log('[Railway-Supabase] ✅ Successfully initialized clients');
        return { success: true };
      } else {
        return {
          success: false,
          error: connectionTest.error
        };
      }

    } catch (error: any) {
      console.error('[Railway-Supabase] ❌ Client initialization failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Test connection with Railway-specific error handling
   */
  private async testRailwayConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.client) {
      return { success: false, error: 'Client not initialized' };
    }

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`[Railway-Supabase] Testing connection attempt ${attempt}/${this.maxRetries}`);
        
        // Simple connectivity test
        const { data, error, count } = await this.client
          .from('users')
          .select('id', { count: 'exact' })
          .limit(1);

        if (!error) {
          console.log(`[Railway-Supabase] ✅ Connection successful on attempt ${attempt}`);
          console.log(`[Railway-Supabase] Users found: ${count}`);
          this.connectionRetries = 0;
          return { success: true };
        } else {
          console.warn(`[Railway-Supabase] ⚠️ Attempt ${attempt} failed:`, error.message);
          
          // Check for Railway-specific IPv6 errors
          if (this.isIPv6Error(error)) {
            console.error('[Railway-Supabase] 🚨 IPv6 connectivity issue detected!');
            return {
              success: false,
              error: `Railway IPv6 compatibility issue: ${error.message}`
            };
          }
        }

      } catch (fetchError: any) {
        console.warn(`[Railway-Supabase] ⚠️ Attempt ${attempt} threw error:`, fetchError.message);
        
        // Detect network-level Railway issues
        if (this.isRailwayNetworkError(fetchError)) {
          console.error('[Railway-Supabase] 🚨 Railway network connectivity issue!');
          
          if (attempt === this.maxRetries) {
            return {
              success: false,
              error: `Railway network issue after ${this.maxRetries} attempts: ${fetchError.message}`
            };
          }
        }
      }

      // Exponential backoff for retries
      if (attempt < this.maxRetries) {
        const delay = Math.min(Math.pow(2, attempt) * 1000, 10000); // Max 10s delay
        console.log(`[Railway-Supabase] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    this.connectionRetries = this.maxRetries;
    return {
      success: false,
      error: `Failed to connect after ${this.maxRetries} attempts`
    };
  }

  /**
   * Check if error is IPv6-related
   */
  private isIPv6Error(error: any): boolean {
    const errorMessage = error.message?.toLowerCase() || '';
    return (
      errorMessage.includes('enetunreach') ||
      errorMessage.includes('network unreachable') ||
      errorMessage.includes('ipv6') ||
      (errorMessage.includes('fetch failed') && this.isRailwayProduction)
    );
  }

  /**
   * Check if error is Railway network-related
   */
  private isRailwayNetworkError(error: any): boolean {
    const errorMessage = error.message?.toLowerCase() || '';
    return (
      errorMessage.includes('fetch failed') ||
      errorMessage.includes('network error') ||
      errorMessage.includes('connection refused') ||
      errorMessage.includes('timeout')
    );
  }

  /**
   * Get regular client with automatic retry
   */
  async getClient(): Promise<SupabaseClient> {
    if (!this.client) {
      const init = await this.initializeClients();
      if (!init.success) {
        throw new Error(`Failed to initialize Supabase client: ${init.error}`);
      }
    }
    return this.client!;
  }

  /**
   * Get service role client with automatic retry
   */
  async getServiceClient(): Promise<SupabaseClient> {
    if (!this.serviceClient) {
      const init = await this.initializeClients();
      if (!init.success) {
        throw new Error(`Failed to initialize Supabase service client: ${init.error}`);
      }
    }
    return this.serviceClient!;
  }

  /**
   * Check if currently connected
   */
  isConnected(): boolean {
    return this.client !== null && this.connectionRetries < this.maxRetries;
  }

  /**
   * Get connection status for health checks
   */
  getConnectionStatus() {
    return {
      connected: this.isConnected(),
      retries: this.connectionRetries,
      maxRetries: this.maxRetries,
      isRailway: this.isRailwayProduction
    };
  }
}

// Export singleton instance
export const railwaySupabase = RailwaySupabaseClient.getInstance();