import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { railwaySupabase } from './railway-supabase-client';
import { randomUUID } from 'crypto';
import type { 
  User, 
  UpsertUser,
  LiveReplyTemplate,
  LiveReplyTemplateGroup,
  InsertLiveReplyTemplateGroup,
  EmailTemplate, 
  InsertLiveReplyTemplate,
  InsertEmailTemplate,
  InsertLiveReplyUsage,
  InsertEmailTemplateUsage,
  LiveReplyUsage,
  EmailTemplateUsage,
  InsertSiteContent,
  SiteContent,
  Announcement,
  InsertAnnouncement,
  UserAnnouncementAck,
  InsertUserAnnouncementAck,
  Faq,
  InsertFaq,
  CallScript,
  InsertCallScript,
  StoreEmail,
  InsertStoreEmail
} from '@shared/schema';
import { IStorage } from './storage';

export class SupabaseStorage implements IStorage {
  private client!: SupabaseClient;
  private serviceClient!: SupabaseClient;
  
  // Performance optimization: Add caching - CACHE DISABLED TO FIX UUID RESOLUTION
  private userCache = new Map<string, { user: User; timestamp: number }>();
  private templateCache = new Map<string, { templates: any[]; timestamp: number }>();
  private readonly CACHE_TTL = 0; // CACHE DISABLED - Forces fresh UUID resolution

  constructor() {
    // Railway deployment optimization: Use Railway-specific client if available
    const isRailwayProduction = !!(process.env.RAILWAY_ENVIRONMENT_NAME || process.env.RAILWAY_PROJECT_ID);
    
    console.log('[SupabaseStorage] Initializing storage with Railway support:', isRailwayProduction);
    console.log('[SupabaseStorage] Environment variables check:', {
      'VITE_SUPABASE_URL': !!process.env.VITE_SUPABASE_URL,
      'SUPABASE_URL': !!process.env.SUPABASE_URL,
      'VITE_SUPABASE_ANON_KEY': !!process.env.VITE_SUPABASE_ANON_KEY,
      'SUPABASE_ANON_KEY': !!process.env.SUPABASE_ANON_KEY,
      'SUPABASE_SERVICE_ROLE_KEY': !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      'NODE_ENV': process.env.NODE_ENV,
      'RAILWAY_ENVIRONMENT_NAME': process.env.RAILWAY_ENVIRONMENT_NAME || 'not-set'
    });
    
    // Initialize clients immediately instead of async
    if (isRailwayProduction) {
      // Use Railway-optimized client for production
      this.initializeRailwayClientsSync();
    } else {
      // Use regular client for development
      this.initializeRegularClients();
    }
  }

  private initializeRailwayClientsSync() {
    console.log('[SupabaseStorage] Using Railway-optimized Supabase clients (sync init)');
    
    try {
      // Create Railway-optimized clients directly without async initialization
      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
      const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseKey || supabaseUrl.trim() === '' || supabaseKey.trim() === '') {
        console.error('[SupabaseStorage] ❌ Missing Railway Supabase credentials');
        console.error('[SupabaseStorage] URL present:', !!supabaseUrl && supabaseUrl.trim() !== '');
        console.error('[SupabaseStorage] Key present:', !!supabaseKey && supabaseKey.trim() !== '');
        throw new Error(`Missing or empty Supabase credentials for Railway deployment`);
      }

      // Create Railway-specific client configuration
      const railwayOptions = {
        auth: {
          persistSession: false,
          detectSessionInUrl: false,
          flowType: 'pkce' as const
        },
        global: {
          headers: {
            'User-Agent': 'BFL-CustomerService-Railway/1.0',
            'Connection': 'keep-alive',
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Railway-Client': 'true',
            'X-IPv4-Preferred': 'true',
            'Cache-Control': 'no-cache'
          }
        },
        db: {
          schema: 'public'
        }
      };

      this.client = createClient(supabaseUrl.trim(), supabaseKey.trim(), railwayOptions) as any;
      
      if (serviceRoleKey && serviceRoleKey.trim() !== '') {
        this.serviceClient = createClient(supabaseUrl.trim(), serviceRoleKey.trim(), railwayOptions) as any;
        console.log('[SupabaseStorage] ✅ Railway service role client initialized');
      } else {
        console.warn('[SupabaseStorage] ⚠️ No service role key for Railway - using anon client');
        this.serviceClient = this.client;
      }
      
      console.log('[SupabaseStorage] ✅ Railway clients initialized successfully');
      
      // Test connection asynchronously
      this.testConnectionAsync();
      
    } catch (error: any) {
      console.error('[SupabaseStorage] ❌ Railway client setup error:', error.message);
      // Fallback to regular client initialization
      this.initializeRegularClients();
    }
  }

  private async initializeRailwayClients() {
    // Legacy async method - kept for compatibility
    this.initializeRailwayClientsSync();
  }

  private initializeRegularClients() {
    console.log('[SupabaseStorage] Using regular Supabase clients');
    
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.trim() === '' || supabaseKey.trim() === '') {
      throw new Error(`Missing or empty Supabase credentials - URL: ${!!supabaseUrl && supabaseUrl.trim() !== ''}, Key: ${!!supabaseKey && supabaseKey.trim() !== ''}`);
    }

    const clientOptions = {
      auth: {
        persistSession: false,
        detectSessionInUrl: false
      },
      global: {
        headers: {
          'Connection': 'keep-alive',
          'User-Agent': 'BFL-CustomerService/1.0'
        }
      }
    };
    
    this.client = createClient(supabaseUrl.trim(), supabaseKey.trim(), clientOptions) as any;
    
    if (serviceRoleKey && serviceRoleKey.trim() !== '') {
      this.serviceClient = createClient(supabaseUrl.trim(), serviceRoleKey.trim(), clientOptions) as any;
      console.log('[SupabaseStorage] ✅ Service role client initialized');
    } else {
      console.warn('[SupabaseStorage] ⚠️ No service role key - using anon client');
      this.serviceClient = this.client;
    }
    
    console.log('[SupabaseStorage] ✅ Regular clients initialized successfully');
    
    // Test connection asynchronously
    this.testConnectionAsync();
  }

  private async testConnectionAsync() {
    try {
      console.log('[SupabaseStorage] Testing connection...');
      
      // Railway fix: Test with retry mechanism for IPv4/IPv6 issues
      const maxRetries = 3;
      let lastError = null;
      
      for (let i = 0; i < maxRetries; i++) {
        try {
          const { data, error, count } = await this.client
            .from('users')
            .select('*', { count: 'exact' })
            .limit(1);
          
          if (!error) {
            console.log('[SupabaseStorage] ✅ Connection successful on attempt', i + 1);
            console.log('[SupabaseStorage] Users count:', count);
            if (data && data.length > 0) {
              console.log('[SupabaseStorage] Sample user found:', { id: data[0].id, email: data[0].email });
            }
            return; // Success, exit retry loop
          } else {
            lastError = error;
            console.warn(`[SupabaseStorage] ⚠️ Connection attempt ${i + 1} failed:`, error.message);
          }
        } catch (err: any) {
          lastError = err;
          console.warn(`[SupabaseStorage] ⚠️ Connection attempt ${i + 1} error:`, err.message);
          
          // Railway IPv6 specific error detection
          if (err.message?.includes('ENETUNREACH') || err.message?.includes('fetch failed')) {
            console.error('[SupabaseStorage] 🚨 Railway IPv6 connectivity issue detected!');
            console.error('[SupabaseStorage] This is a known Railway + Supabase compatibility issue');
            console.error('[SupabaseStorage] Environment variables are present but IPv6 connection failed');
          }
        }
        
        // Wait before retry (exponential backoff)
        if (i < maxRetries - 1) {
          const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
          console.log(`[SupabaseStorage] Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      console.error('[SupabaseStorage] ❌ All connection attempts failed');
      console.error('[SupabaseStorage] Final error:', lastError);
      
      // Railway-specific troubleshooting info
      if (process.env.RAILWAY_ENVIRONMENT_NAME) {
        console.error('[SupabaseStorage] 🔧 Railway Troubleshooting:');
        console.error('[SupabaseStorage] 1. Check if Supabase project is using IPv6 (this causes issues on Railway)');
        console.error('[SupabaseStorage] 2. Try using Supavisor connection string for IPv4 compatibility');
        console.error('[SupabaseStorage] 3. Verify environment variables in Railway dashboard');
      }
      
    } catch (err) {
      console.error('[SupabaseStorage] ❌ Connection test completely failed:', err);
    }
  }

  // Performance optimization: Check cache validity
  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_TTL;
  }

  // User operations with caching
  async getUser(id: string): Promise<User | undefined> {
    return this.getUserById(id);
  }

  async getUserById(id: string): Promise<User | undefined> {
    console.log('[SupabaseStorage] Querying user with ID:', id);
    
    // Check cache first
    const cached = this.userCache.get(id);
    if (cached && this.isCacheValid(cached.timestamp)) {
      console.log('[SupabaseStorage] Returning cached user:', cached.user.email);
      return cached.user;
    }
    
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    console.log('[SupabaseStorage] Query result - data:', data, 'error:', error);

    if (error) {
      console.error('[SupabaseStorage] Error fetching user:', error.message, error.details, error.hint);
      return undefined;
    }

    const mappedUser = data ? this.mapSupabaseUser(data) : undefined;
    
    // Cache the result
    if (mappedUser) {
      this.userCache.set(id, { user: mappedUser, timestamp: Date.now() });
      console.log('[SupabaseStorage] Cached user:', mappedUser.email);
    }
    
    console.log('[SupabaseStorage] Mapped user:', mappedUser);
    return mappedUser;
  }

  async createUser(userData: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role?: 'admin' | 'agent';
  }): Promise<User | null> {
    try {
      console.log('[SupabaseStorage] Creating new user:', userData.email);
      
      const { data, error } = await this.serviceClient
        .from('users')
        .insert({
          id: userData.id,
          email: userData.email,
          first_name: userData.firstName || '',
          last_name: userData.lastName || '',
          role: userData.role || 'agent',
          status: 'active',
          is_online: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('[SupabaseStorage] Error creating user:', error);
        return null;
      }

      const newUser = this.mapSupabaseUser(data);
      
      // Cache the new user
      this.userCache.set(userData.id, { user: newUser, timestamp: Date.now() });
      
      console.log('[SupabaseStorage] Successfully created user:', newUser.email, newUser.role);
      return newUser;
    } catch (error) {
      console.error('[SupabaseStorage] Error creating user:', error);
      return null;
    }
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const { data, error } = await this.serviceClient
      .from('users')
      .upsert({
        id: userData.id,
        email: userData.email,
        first_name: userData.firstName || '',
        last_name: userData.lastName || '',
        profile_image_url: userData.profileImageUrl,
        role: userData.role || 'agent',
        status: userData.status || 'active',
        is_online: userData.isOnline || false,
        last_seen: userData.lastSeen ? userData.lastSeen.toISOString() : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[SupabaseStorage] Error upserting user:', error);
      throw error;
    }

    const newUser = this.mapSupabaseUser(data);
    
    // Cache the upserted user
    this.userCache.set(userData.id, { user: newUser, timestamp: Date.now() });
    
    console.log('[SupabaseStorage] Successfully upserted user:', newUser.email, newUser.role);
    return newUser;
  }

  async getAllUsers(): Promise<User[]> {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .order('is_online', { ascending: false }) // Online users first
      .order('first_name', { ascending: true }); // Then by name

    if (error) {
      console.error('[SupabaseStorage] Error fetching users:', error);
      return [];
    }

    // Enhanced real-time online status calculation
    const now = new Date();
    const OFFLINE_THRESHOLD = 2 * 60 * 1000; // More aggressive: 2 minutes for accuracy

    return data.map(user => {
      const mappedUser = this.mapSupabaseUser(user);
      
      // Determine if user is truly online based on last_seen
      if (mappedUser.lastSeen) {
        const lastSeenTime = new Date(mappedUser.lastSeen).getTime();
        const timeSinceLastSeen = now.getTime() - lastSeenTime;
        
        // More strict online detection for accuracy
        mappedUser.isOnline = timeSinceLastSeen < OFFLINE_THRESHOLD;
        
        // Enhanced logging for real-time debugging
        if (user.is_online !== mappedUser.isOnline) {
          console.log(`[SupabaseStorage] Real-time status change: ${mappedUser.email} ${user.is_online} -> ${mappedUser.isOnline} (${Math.round(timeSinceLastSeen / 1000)}s ago)`);
        }
      } else {
        // No last seen time means user is offline
        mappedUser.isOnline = false;
      }
      
      return mappedUser;
    });
  }

  async deleteUser(id: string): Promise<void> {
    console.log('[SupabaseStorage] Deleting user with ID:', id);
    
    try {
      // Only try to delete from Supabase Auth if the ID is a valid UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      if (uuidRegex.test(id)) {
        // First, delete from Supabase Auth
        console.log('[SupabaseStorage] Deleting user from Supabase Auth...');
        const { error: authError } = await this.serviceClient.auth.admin.deleteUser(id);
        
        if (authError) {
          console.error('[SupabaseStorage] Error deleting user from Auth:', authError);
          // Continue with database deletion even if auth deletion fails
          // This handles cases where user might not exist in auth but exists in database
        } else {
          console.log('[SupabaseStorage] Successfully deleted user from Supabase Auth:', id);
        }
      } else {
        console.log('[SupabaseStorage] ID is not a valid UUID, skipping Supabase Auth deletion:', id);
      }

      // Delete from the users table (this works regardless of UUID format)
      console.log('[SupabaseStorage] Deleting user from database table...');
      const { error: dbError } = await this.serviceClient
        .from('users')
        .delete()
        .eq('id', id);

      if (dbError) {
        console.error('[SupabaseStorage] Error deleting user from database:', dbError);
        throw dbError;
      }

      console.log('[SupabaseStorage] Successfully deleted user from database:', id);
      
      // Clear user from cache
      this.userCache.delete(id);
      
    } catch (error) {
      console.error('[SupabaseStorage] Failed to delete user:', error);
      throw error;
    }
  }

  async updateUserStatus(id: string, status: "active" | "blocked" | "banned"): Promise<void> {
    const { error } = await this.serviceClient
      .from('users')
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id);

    if (error) {
      console.error('[SupabaseStorage] Error updating user status:', error);
      throw error;
    }
  }

  async updateUserOnlineStatus(id: string, isOnline: boolean): Promise<void> {
    const { error } = await this.client
      .from('users')
      .update({ 
        is_online: isOnline,
        last_seen: new Date().toISOString(),
        updated_at: new Date().toISOString() 
      })
      .eq('id', id);

    if (error) {
      console.error('[SupabaseStorage] Error updating user online status:', error);
      throw error;
    }
  }

  async updateUserPresence(userId: string, isOnline: boolean, lastActivity?: Date, metadata?: any): Promise<void> {
    console.log(`[SupabaseStorage] Real-time presence update for ${userId}: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);

    const now = new Date();
    const updateData: any = {
      is_online: isOnline,
      last_seen: now.toISOString(),
      updated_at: now.toISOString()
    };

    if (lastActivity) {
      updateData.last_activity = lastActivity.toISOString();
    }

    // Add metadata for enhanced tracking
    if (metadata?.pageHidden) {
      console.log(`[SupabaseStorage] User ${userId} page hidden - marking offline`);
    }
    if (metadata?.pageVisible) {
      console.log(`[SupabaseStorage] User ${userId} page visible - marking online`);
    }
    if (metadata?.pageUnload) {
      console.log(`[SupabaseStorage] User ${userId} page unload - marking offline`);
    }

    const { error } = await this.serviceClient
      .from('users')
      .update(updateData)
      .eq('id', userId);

    if (error) {
      console.error('[SupabaseStorage] Error updating user presence:', error);
      throw error;
    }

    // Clear user cache to force fresh data on next read
    this.userCache.delete(userId);
    
    console.log(`[SupabaseStorage] ✅ Real-time presence updated: ${userId} = ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
  }

  // Enhanced method to check and update stale online users
  async markStaleUsersOffline(): Promise<number> {
    const STALE_THRESHOLD = 90 * 1000; // 90 seconds for real-time accuracy
    const cutoffTime = new Date(Date.now() - STALE_THRESHOLD).toISOString();
    
    const { data, error } = await this.serviceClient
      .from('users')
      .update({ 
        is_online: false,
        updated_at: new Date().toISOString()
      })
      .eq('is_online', true)
      .lt('last_seen', cutoffTime)
      .select('id, email');

    if (error) {
      console.error('[SupabaseStorage] Error marking stale users offline:', error);
      return 0;
    }

    const count = data?.length || 0;
    if (count > 0) {
      console.log(`[SupabaseStorage] ⚡ Marked ${count} stale users offline:`, data.map(u => u.email));
      // Clear cache for updated users
      data.forEach(user => this.userCache.delete(user.id));
    }

    return count;
  }

  async updateUserRole(id: string, role: "admin" | "agent"): Promise<void> {
    console.log('[SupabaseStorage] Updating user role for ID:', id, 'to role:', role);
    
    const { data, error } = await this.serviceClient
      .from('users')
      .update({ 
        role, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select();

    console.log('[SupabaseStorage] Role update result - data:', data, 'error:', error);

    if (error) {
      console.error('[SupabaseStorage] Error updating user role:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.warn('[SupabaseStorage] No user found with ID:', id);
      throw new Error(`User with ID ${id} not found`);
    }

    console.log('[SupabaseStorage] Successfully updated user role:', data[0]);
    
    // Clear cache to force refresh
    this.userCache.delete(id);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    console.log(`[SupabaseStorage] Updating user profile: ${id}`, updates);
    
    // Map camelCase to snake_case for Supabase
    const dbUpdates: any = {
      updated_at: new Date().toISOString()
    };
    
    if (updates.firstName !== undefined) dbUpdates.first_name = updates.firstName;
    if (updates.lastName !== undefined) dbUpdates.last_name = updates.lastName;
    if (updates.arabicFirstName !== undefined) dbUpdates.arabic_first_name = updates.arabicFirstName;
    if (updates.arabicLastName !== undefined) dbUpdates.arabic_last_name = updates.arabicLastName;
    if (updates.isFirstTimeUser !== undefined) dbUpdates.is_first_time_user = updates.isFirstTimeUser;
    if (updates.role !== undefined) dbUpdates.role = updates.role;
    if (updates.status !== undefined) dbUpdates.status = updates.status;

    const { data, error } = await this.serviceClient
      .from('users')
      .update(dbUpdates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('[SupabaseStorage] Error updating user:', error);
      throw error;
    }

    if (!data) {
      throw new Error(`User with ID ${id} not found`);
    }

    // Clear cache to force refresh
    this.userCache.delete(id);
    
    // Map back to camelCase and return
    const updatedUser = this.mapSupabaseUser(data);
    console.log(`[SupabaseStorage] Successfully updated user profile: ${updatedUser.email}`);
    
    return updatedUser;
  }

  // Live reply template operations
  async getLiveReplyTemplates(filters?: {
    category?: string;
    genre?: string;
    search?: string;
    isActive?: boolean;
  }): Promise<LiveReplyTemplate[]> {
    let query = this.client
      .from('live_reply_templates')
      .select('*');

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (filters?.genre) {
      query = query.eq('genre', filters.genre);
    }

    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,content_en.ilike.%${filters.search}%,content_ar.ilike.%${filters.search}%,category.ilike.%${filters.search}%,genre.ilike.%${filters.search}%`);
    }

    const { data, error } = await query.order('stage_order', { ascending: true });

    if (error) {
      console.error('[SupabaseStorage] Error fetching live reply templates:', error);
      return [];
    }

    const templates = await Promise.all(data.map(async (template) => await this.mapSupabaseLiveReplyTemplateWithNames(template)));
    return templates;
  }

  async getLiveReplyTemplate(id: string): Promise<LiveReplyTemplate | undefined> {
    const { data, error } = await this.client
      .from('live_reply_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[SupabaseStorage] Error fetching live reply template:', error);
      return undefined;
    }

    return data ? this.mapSupabaseLiveReplyTemplate(data) : undefined;
  }

  async createLiveReplyTemplate(template: InsertLiveReplyTemplate): Promise<LiveReplyTemplate> {
    console.log('[SupabaseStorage] Creating live reply template:', template.name);
    
    const { data, error } = await this.client
      .from('live_reply_templates')
      .insert(this.mapToSupabaseLiveReplyTemplate(template))
      .select()
      .single();

    if (error) {
      console.error('[SupabaseStorage] Error creating live reply template:', error);
      throw error;
    }

    return this.mapSupabaseLiveReplyTemplate(data);
  }

  async upsertLiveReplyTemplate(template: InsertLiveReplyTemplate): Promise<LiveReplyTemplate> {
    // For Supabase, upsert is same as create since we generate new IDs
    return this.createLiveReplyTemplate(template);
  }

  async updateLiveReplyTemplate(id: string, template: Partial<InsertLiveReplyTemplate>): Promise<LiveReplyTemplate> {
    // Create update data manually to avoid any created_by field issues
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    // Only include fields that are actually provided in the update
    if (template.name !== undefined) updateData.name = template.name;
    if (template.contentEn !== undefined) updateData.content_en = template.contentEn;
    if (template.contentAr !== undefined) updateData.content_ar = template.contentAr;
    if (template.category !== undefined) updateData.category = template.category;
    if (template.genre !== undefined) updateData.genre = template.genre;
    if (template.variables !== undefined) updateData.variables = template.variables;
    if (template.groupId !== undefined) updateData.group_id = template.groupId;
    if (template.groupOrder !== undefined) updateData.group_order = template.groupOrder;
    if (template.stageOrder !== undefined) updateData.stage_order = template.stageOrder;
    if (template.isActive !== undefined) updateData.is_active = template.isActive;
    

    
    const { data, error } = await this.client
      .from('live_reply_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[SupabaseStorage] Error updating live reply template:', error);
      throw error;
    }

    return this.mapSupabaseLiveReplyTemplate(data);
  }

  async deleteLiveReplyTemplate(id: string): Promise<void> {
    console.log('[SupabaseStorage] 🗑️ Attempting to delete live reply template:', id);
    
    const { data, error } = await this.client
      .from('live_reply_templates')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.error('[SupabaseStorage] ❌ Error deleting live reply template:', error);
      throw new Error(`Failed to delete template: ${error.message}`);
    }

    console.log('[SupabaseStorage] ✅ Successfully deleted template:', data);
  }

  async incrementLiveReplyUsage(templateId: string, userId: string): Promise<void> {
    // Insert usage record
    const { error: usageError } = await this.client
      .from('live_reply_usage')
      .insert({
        template_id: templateId,
        user_id: userId,
        used_at: new Date().toISOString()
      });

    if (usageError) {
      console.error('[SupabaseStorage] Error inserting live reply usage:', usageError);
    }

    // Increment usage count using RPC function
    const { error: countError } = await this.client
      .rpc('increment_live_reply_usage', { template_id: templateId });

    if (countError) {
      console.error('[SupabaseStorage] Error incrementing live reply usage count:', countError);
    }
  }

  async getLiveReplyUsageStats(templateId: string): Promise<number> {
    const { data, error } = await this.client
      .from('live_reply_usage')
      .select('id', { count: 'exact' })
      .eq('template_id', templateId);

    if (error) {
      console.error('[SupabaseStorage] Error fetching live reply usage stats:', error);
      return 0;
    }

    return data?.length || 0;
  }

  // Email template operations with caching
  async getEmailTemplates(filters?: {
    category?: string;
    genre?: string;
    concernedTeam?: string;
    search?: string;
    isActive?: boolean;
  }): Promise<EmailTemplate[]> {
    // Clear cache to force fresh UUID resolution
    this.templateCache.clear();
    console.log('[SupabaseStorage] Cache cleared - fetching fresh email templates with UUID resolution');
    
    let query = this.client
      .from('email_templates')
      .select('*');

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (filters?.genre) {
      query = query.eq('genre', filters.genre);
    }

    if (filters?.concernedTeam) {
      query = query.eq('concerned_team', filters.concernedTeam);
    }

    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,subject.ilike.%${filters.search}%,content.ilike.%${filters.search}%,category.ilike.%${filters.search}%,genre.ilike.%${filters.search}%,concerned_team.ilike.%${filters.search}%`);
    }

    const { data, error } = await query.order('stage_order', { ascending: true });

    if (error) {
      console.error('[SupabaseStorage] Error fetching email templates:', error);
      return [];
    }

    const templates = await Promise.all(data.map(async (template) => await this.mapSupabaseEmailTemplateWithNames(template)));
    
    console.log('[SupabaseStorage] Email templates fetched with UUID resolution:', templates.length);
    if (templates.length > 0) {
      console.log('[SupabaseStorage] Sample resolved template:', {
        id: templates[0].id,
        name: templates[0].name,
        category: templates[0].category,
        genre: templates[0].genre,
        categoryIsResolved: templates[0].category && !templates[0].category.includes('-'),
        genreIsResolved: templates[0].genre && !templates[0].genre.includes('-')
      });
    }
    
    return templates;
  }

  async getEmailTemplate(id: string): Promise<EmailTemplate | undefined> {
    const { data, error } = await this.client
      .from('email_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[SupabaseStorage] Error fetching email template:', error);
      return undefined;
    }

    return data ? await this.mapSupabaseEmailTemplateWithNames(data) : undefined;
  }

  async createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    console.log('[SupabaseStorage] Creating email template:', template.name);
    
    const { data, error } = await this.client
      .from('email_templates')
      .insert(this.mapToSupabaseEmailTemplate(template))
      .select()
      .single();

    if (error) {
      console.error('[SupabaseStorage] Error creating email template:', error);
      throw error;
    }

    // Clear email template cache to ensure fresh data
    this.templateCache.clear();
    console.log('[SupabaseStorage] Cleared email template cache after creation');

    return await this.mapSupabaseEmailTemplateWithNames(data);
  }

  async upsertEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    // For Supabase, upsert is same as create since we generate new IDs
    return this.createEmailTemplate(template);
  }

  async updateEmailTemplate(id: string, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate> {
    console.error('🚨🚨🚨 SUPABASE UPDATE CALLED 🚨🚨🚨', id);
    console.error('🚨🚨🚨 INPUT DATA:', JSON.stringify(template, null, 2));
    
    // Create update data manually to avoid any created_by field issues
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    // Only include fields that are actually provided in the update
    if (template.name !== undefined) updateData.name = template.name;
    if (template.subject !== undefined) updateData.subject = template.subject;
    if (template.content !== undefined) updateData.content = template.content;
    if (template.category !== undefined) updateData.category = template.category;
    if (template.genre !== undefined) updateData.genre = template.genre;
    if (template.concernedTeam !== undefined) updateData.concerned_team = template.concernedTeam;
    if (template.warningNote !== undefined) updateData.warning_note = template.warningNote;
    if (template.variables !== undefined) updateData.variables = template.variables;
    if (template.stageOrder !== undefined) updateData.stage_order = template.stageOrder;
    if (template.isActive !== undefined) updateData.is_active = template.isActive;

    console.log('[SupabaseStorage] 📤 Final updateData being sent to Supabase:', updateData);

    
    const { data, error } = await this.client
      .from('email_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[SupabaseStorage] ❌ Error updating email template:', error);
      throw error;
    }

    console.log('[SupabaseStorage] ✅ Update successful! Raw response data:', data);
    
    // Clear email template cache to ensure fresh data
    this.templateCache.clear();
    console.log('[SupabaseStorage] Cleared email template cache after update');
    
    const mappedResult = await this.mapSupabaseEmailTemplateWithNames(data);
    console.log('[SupabaseStorage] 📦 Final mapped result:', mappedResult);

    return mappedResult;
  }

  async deleteEmailTemplate(id: string): Promise<void> {
    console.log('[SupabaseStorage] 🗑️ Attempting to delete email template:', id);
    
    const { data, error } = await this.client
      .from('email_templates')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.error('[SupabaseStorage] ❌ Error deleting email template:', error);
      throw new Error(`Failed to delete email template: ${error.message}`);
    }

    // Clear email template cache to ensure fresh data
    this.templateCache.clear();
    console.log('[SupabaseStorage] Cleared email template cache after deletion');

    console.log('[SupabaseStorage] ✅ Successfully deleted email template:', data);
  }

  async incrementEmailTemplateUsage(templateId: string, userId: string): Promise<void> {
    // Insert usage record
    const { error: usageError } = await this.client
      .from('email_template_usage')
      .insert({
        template_id: templateId,
        user_id: userId,
        used_at: new Date().toISOString()
      });

    if (usageError) {
      console.error('[SupabaseStorage] Error inserting email template usage:', usageError);
    }

    // Increment usage count using RPC function
    const { error: countError } = await this.client
      .rpc('increment_email_template_usage', { template_id: templateId });

    if (countError) {
      console.error('[SupabaseStorage] Error incrementing email template usage count:', countError);
    }
  }

  async getEmailTemplateUsageStats(templateId: string): Promise<number> {
    const { data, error } = await this.client
      .from('email_template_usage')
      .select('id', { count: 'exact' })
      .eq('template_id', templateId);

    if (error) {
      console.error('[SupabaseStorage] Error fetching email template usage stats:', error);
      return 0;
    }

    return data?.length || 0;
  }

  // Live Reply Template Group operations
  async getLiveReplyTemplateGroups(): Promise<LiveReplyTemplateGroup[]> {
    const { data, error } = await this.client
      .from('live_reply_template_groups')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) {
      console.error('[SupabaseStorage] Error fetching live reply template groups:', error);
      throw new Error(`Failed to fetch live reply template groups: ${error.message}`);
    }

    return data?.map((group: any) => ({
      id: group.id,
      name: group.name,
      description: group.description,
      color: group.color,
      isActive: group.is_active,
      orderIndex: group.order_index,
      createdAt: new Date(group.created_at),
      updatedAt: new Date(group.updated_at),
      supabaseId: group.id, // Use the same ID for Supabase sync
      lastSyncedAt: new Date(), // Current timestamp for sync tracking
    })) || [];
  }

  async getLiveReplyTemplateGroup(id: string): Promise<LiveReplyTemplateGroup | undefined> {
    const { data, error } = await this.client
      .from('live_reply_template_groups')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return undefined; // Not found
      console.error('[SupabaseStorage] Error fetching live reply template group:', error);
      throw new Error(`Failed to fetch live reply template group: ${error.message}`);
    }

    return data ? {
      id: data.id,
      name: data.name,
      description: data.description,
      color: data.color,
      isActive: data.is_active,
      orderIndex: data.order_index,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      supabaseId: data.id,
      lastSyncedAt: new Date(),
    } : undefined;
  }

  async createLiveReplyTemplateGroup(group: InsertLiveReplyTemplateGroup): Promise<LiveReplyTemplateGroup> {
    console.log('[SupabaseStorage] Creating live reply template group:', group.name);
    
    // Find next order index if not provided
    if (group.orderIndex === undefined) {
      const { data: maxOrderData } = await this.client
        .from('live_reply_template_groups')
        .select('order_index')
        .order('order_index', { ascending: false })
        .limit(1);

      group.orderIndex = (maxOrderData?.[0]?.order_index || 0) + 1;
    }

    const { data, error } = await this.client
      .from('live_reply_template_groups')
      .insert({
        name: group.name,
        description: group.description || null,
        color: group.color || '#3b82f6',
        is_active: group.isActive !== undefined ? group.isActive : true,
        order_index: group.orderIndex,
      })
      .select()
      .single();

    if (error) {
      console.error('[SupabaseStorage] Error creating live reply template group:', error);
      
      // Handle unique constraint violation specifically
      if (error.code === '23505' && error.message.includes('live_reply_template_groups_name_key')) {
        throw new Error(`A group with the name "${group.name}" already exists. Please choose a different name.`);
      }
      
      throw new Error(`Failed to create live reply template group: ${error.message}`);
    }

    console.log('[SupabaseStorage] Successfully created live reply template group:', data.id);

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      color: data.color,
      isActive: data.is_active,
      orderIndex: data.order_index,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      supabaseId: data.id,
      lastSyncedAt: new Date(),
    };
  }

  async updateLiveReplyTemplateGroup(id: string, group: Partial<InsertLiveReplyTemplateGroup>): Promise<LiveReplyTemplateGroup> {
    const updateData: any = {};
    if (group.name !== undefined) updateData.name = group.name;
    if (group.description !== undefined) updateData.description = group.description;
    if (group.color !== undefined) updateData.color = group.color;
    if (group.isActive !== undefined) updateData.is_active = group.isActive;
    if (group.orderIndex !== undefined) updateData.order_index = group.orderIndex;

    const { data, error } = await this.client
      .from('live_reply_template_groups')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[SupabaseStorage] Error updating live reply template group:', error);
      throw new Error(`Failed to update live reply template group: ${error.message}`);
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      color: data.color,
      isActive: data.is_active,
      orderIndex: data.order_index,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      supabaseId: data.id,
      lastSyncedAt: new Date(),
    };
  }

  async deleteLiveReplyTemplateGroup(id: string): Promise<void> {
    const { error } = await this.client
      .from('live_reply_template_groups')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[SupabaseStorage] Error deleting live reply template group:', error);
      throw new Error(`Failed to delete live reply template group: ${error.message}`);
    }
  }

  async reorderLiveReplyTemplateGroups(updates: Array<{ id: string; orderIndex: number }>): Promise<void> {
    for (const update of updates) {
      const { error } = await this.client
        .from('live_reply_template_groups')
        .update({ order_index: update.orderIndex })
        .eq('id', update.id);

      if (error) {
        console.error('[SupabaseStorage] Error reordering live reply template group:', error);
        throw new Error(`Failed to reorder live reply template group: ${error.message}`);
      }
    }
  }

  // Legacy template operations (backward compatibility)
  async getTemplates(filters?: {
    category?: string;
    genre?: string;
    search?: string;
    isActive?: boolean;
  }): Promise<LiveReplyTemplate[]> {
    return this.getLiveReplyTemplates(filters);
  }

  async getTemplate(id: string): Promise<LiveReplyTemplate | undefined> {
    return this.getLiveReplyTemplate(id);
  }

  async createTemplate(template: InsertLiveReplyTemplate): Promise<LiveReplyTemplate> {
    return this.createLiveReplyTemplate(template);
  }

  async updateTemplate(id: string, template: Partial<InsertLiveReplyTemplate>): Promise<LiveReplyTemplate> {
    return this.updateLiveReplyTemplate(id, template);
  }

  async deleteTemplate(id: string): Promise<void> {
    return this.deleteLiveReplyTemplate(id);
  }

  async incrementTemplateUsage(templateId: string, userId: string): Promise<void> {
    return this.incrementLiveReplyUsage(templateId, userId);
  }

  async getTemplateUsageStats(templateId: string): Promise<number> {
    return this.getLiveReplyUsageStats(templateId);
  }

  // Site content operations
  async getSiteContent(key?: string): Promise<SiteContent[]> {
    let query = this.client
      .from('site_content')
      .select('*');

    if (key) {
      query = query.eq('key', key);
    }

    const { data, error } = await query.order('updated_at', { ascending: false });

    if (error) {
      console.error('[SupabaseStorage] Error fetching site content:', error);
      return [];
    }

    return data.map(this.mapSupabaseSiteContent);
  }

  async upsertSiteContent(content: InsertSiteContent): Promise<SiteContent> {
    console.log('[SupabaseStorage] Upserting site content:', content.key);
    
    // Use UPDATE with WHERE clause since we know the record exists
    const { data, error } = await this.client
      .from('site_content')
      .update({
        content: content.content,
        updated_at: new Date().toISOString()
      })
      .eq('key', content.key)
      .select()
      .single();

    if (error) {
      console.error('[SupabaseStorage] Error updating site content:', error);
      throw error;
    }

    console.log('[SupabaseStorage] Successfully updated site content:', data);
    return this.mapSupabaseSiteContent(data);
  }

  // Announcement operations
  async getAnnouncements(): Promise<Announcement[]> {
    const { data, error } = await this.client
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[SupabaseStorage] Error fetching announcements:', error);
      throw new Error(`Failed to fetch announcements: ${error.message}`);
    }

    return data.map(this.mapSupabaseAnnouncement);
  }

  async getActiveAnnouncement(): Promise<Announcement | undefined> {
    const { data, error } = await this.client
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return undefined; // No rows found
      console.error('[SupabaseStorage] Error fetching active announcement:', error);
      throw new Error(`Failed to fetch active announcement: ${error.message}`);
    }

    return this.mapSupabaseAnnouncement(data);
  }

  async createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement> {
    const { data, error } = await this.serviceClient
      .from('announcements')
      .insert({
        title: announcement.title,
        content: announcement.content,
        is_active: announcement.isActive,
        background_color: announcement.backgroundColor,
        text_color: announcement.textColor,
        border_color: announcement.borderColor,
        priority: announcement.priority,
      })
      .select()
      .single();

    if (error) {
      console.error('[SupabaseStorage] Error creating announcement:', error);
      throw new Error(`Failed to create announcement: ${error.message}`);
    }

    return this.mapSupabaseAnnouncement(data);
  }

  async updateAnnouncement(id: string, announcement: Partial<InsertAnnouncement>): Promise<Announcement> {
    const updateData: any = {};
    
    if (announcement.title !== undefined) updateData.title = announcement.title;
    if (announcement.content !== undefined) updateData.content = announcement.content;
    if (announcement.isActive !== undefined) updateData.is_active = announcement.isActive;
    if (announcement.backgroundColor !== undefined) updateData.background_color = announcement.backgroundColor;
    if (announcement.textColor !== undefined) updateData.text_color = announcement.textColor;
    if (announcement.borderColor !== undefined) updateData.border_color = announcement.borderColor;
    if (announcement.priority !== undefined) updateData.priority = announcement.priority;
    
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await this.serviceClient
      .from('announcements')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[SupabaseStorage] Error updating announcement:', error);
      throw new Error(`Failed to update announcement: ${error.message}`);
    }

    return this.mapSupabaseAnnouncement(data);
  }

  async deleteAnnouncement(id: string): Promise<void> {
    const { error } = await this.serviceClient
      .from('announcements')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[SupabaseStorage] Error deleting announcement:', error);
      throw new Error(`Failed to delete announcement: ${error.message}`);
    }
  }

  // FAQ acknowledgment operations
  async markFaqAsSeen(userId: string, faqId: string): Promise<void> {
    const { error } = await this.client
      .from('user_faq_acks')
      .upsert({
        user_id: userId,
        faq_id: faqId,
        acknowledged_at: new Date().toISOString()
      });

    if (error) {
      console.error('[SupabaseStorage] Error marking FAQ as seen:', error);
      throw new Error(`Failed to mark FAQ as seen: ${error.message}`);
    }
  }

  async getUserSeenFaqs(userId: string): Promise<string[]> {
    const { data, error } = await this.client
      .from('user_faq_acks')
      .select('faq_id')
      .eq('user_id', userId);

    if (error) {
      console.error('[SupabaseStorage] Error getting user seen FAQs:', error);
      throw new Error(`Failed to get user seen FAQs: ${error.message}`);
    }

    return data ? data.map(ack => ack.faq_id) : [];
  }

  // Enhanced announcement acknowledgment operations
  async markAnnouncementAsSeen(userId: string, announcementId: string): Promise<void> {
    const { error } = await this.serviceClient
      .from('user_announcement_acks')
      .upsert({
        user_id: userId,
        announcement_id: announcementId,
        acknowledged_at: new Date().toISOString()
      });

    if (error) {
      console.error('[SupabaseStorage] Error marking announcement as seen:', error);
      throw new Error(`Failed to mark announcement as seen: ${error.message}`);
    }
  }

  async getUserSeenAnnouncements(userId: string): Promise<string[]> {
    const { data, error } = await this.serviceClient
      .from('user_announcement_acks')
      .select('announcement_id')
      .eq('user_id', userId);

    if (error) {
      console.error('[SupabaseStorage] Error getting user seen announcements:', error);
      throw new Error(`Failed to get user seen announcements: ${error.message}`);
    }

    return data ? data.map(ack => ack.announcement_id) : [];
  }



  async getUserAnnouncementAck(userId: string, announcementId: string): Promise<UserAnnouncementAck | undefined> {
    const { data, error } = await this.serviceClient
      .from('user_announcement_acks')
      .select('*')
      .eq('user_id', userId)
      .eq('announcement_id', announcementId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return undefined; // No rows found
      console.error('[SupabaseStorage] Error fetching user announcement ack:', error);
      throw new Error(`Failed to fetch user announcement ack: ${error.message}`);
    }

    return this.mapSupabaseUserAnnouncementAck(data);
  }



  async reAnnounce(announcementId: string): Promise<void> {
    // First get the current version
    const { data: currentData, error: fetchError } = await this.serviceClient
      .from('announcements')
      .select('version')
      .eq('id', announcementId)
      .single();

    if (fetchError) {
      console.error('[SupabaseStorage] Error fetching current version:', fetchError);
      throw new Error(`Failed to fetch current version: ${fetchError.message}`);
    }

    const currentVersion = currentData?.version || 1;

    // Update with incremented version
    const { error } = await this.serviceClient
      .from('announcements')
      .update({
        version: currentVersion + 1,
        last_announced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', announcementId);

    if (error) {
      console.error('[SupabaseStorage] Error re-announcing:', error);
      throw new Error(`Failed to re-announce: ${error.message}`);
    }
  }

  // Helper function to extract variables from text
  private extractVariablesFromText(text: string): string[] {
    if (!text) return [];
    const regex = /\{([a-zA-Z][a-zA-Z0-9_]*)\}/g;
    const matches = text.match(regex) || [];
    return matches.map(match => match.slice(1, -1).toLowerCase()); // Convert to lowercase to match frontend expectations
  }

  // Dynamic Category and Genre operations
  async getTemplateCategories(): Promise<{id: string, name: string, description: string, isActive: boolean}[]> {
    try {
      // First try to create the tables if they don't exist
      await this.ensureDynamicTablesExist();
      
      const { data, error } = await this.client
        .from('template_categories')
        .select('id, name, description, is_active')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('[SupabaseStorage] Error fetching template categories:', error);
        // If table doesn't exist, populate it from existing templates
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          await this.populateTemplateCategories();
          return this.getTemplateCategories(); // Retry
        }
        return [];
      }

      return data.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
        isActive: item.is_active
      }));
    } catch (error) {
      console.error('[SupabaseStorage] Error in getTemplateCategories:', error);
      return [];
    }
  }

  async getEmailCategories(): Promise<{id: string, name: string, description: string, isActive: boolean}[]> {
    try {
      await this.ensureDynamicTablesExist();
      
      const { data, error } = await this.client
        .from('email_categories')
        .select('id, name, description, is_active')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('[SupabaseStorage] Error fetching email categories:', error);
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          await this.populateEmailCategories();
          return this.getEmailCategories(); // Retry
        }
        return [];
      }

      return data.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
        isActive: item.is_active
      }));
    } catch (error) {
      console.error('[SupabaseStorage] Error in getEmailCategories:', error);
      return [];
    }
  }

  async getTemplateGenres(): Promise<{id: string, name: string, description: string, isActive: boolean}[]> {
    try {
      await this.ensureDynamicTablesExist();
      
      const { data, error } = await this.client
        .from('template_genres')
        .select('id, name, description, is_active')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('[SupabaseStorage] Error fetching template genres:', error);
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          await this.populateTemplateGenres();
          return this.getTemplateGenres(); // Retry
        }
        return [];
      }

      return data.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
        isActive: item.is_active
      }));
    } catch (error) {
      console.error('[SupabaseStorage] Error in getTemplateGenres:', error);
      return [];
    }
  }

  async getConcernedTeams(): Promise<{id: string, name: string, description: string, isActive: boolean}[]> {
    try {
      await this.ensureDynamicTablesExist();
      
      const { data, error } = await this.client
        .from('concerned_teams')
        .select('id, name, description, is_active')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('[SupabaseStorage] Error fetching concerned teams:', error);
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          await this.populateConcernedTeams();
          return this.getConcernedTeams(); // Retry
        }
        return [];
      }

      return data.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
        isActive: item.is_active
      }));
    } catch (error) {
      console.error('[SupabaseStorage] Error in getConcernedTeams:', error);
      return [];
    }
  }

  // Helper methods for dynamic table management
  private async ensureDynamicTablesExist(): Promise<void> {
    // This is a placeholder - tables should be created via Supabase dashboard or SQL
    // since we can't create tables via the client in a production environment
    return;
  }

  private async populateTemplateCategories(): Promise<void> {
    try {
      // Get unique categories from existing live reply templates
      const { data: templates } = await this.client
        .from('live_reply_templates')
        .select('category')
        .eq('is_active', true);

      if (templates) {
        const uniqueCategories = Array.from(new Set(templates.map(t => t.category).filter(Boolean)));
        for (const category of uniqueCategories) {
          await this.client
            .from('template_categories')
            .upsert({ 
              name: category, 
              description: `Live chat template category: ${category}`,
              is_active: true 
            }, { onConflict: 'name' });
        }
      }
    } catch (error) {
      console.error('[SupabaseStorage] Error populating template categories:', error);
    }
  }

  private async populateEmailCategories(): Promise<void> {
    try {
      // Get unique categories from existing email templates
      const { data: templates } = await this.client
        .from('email_templates')
        .select('category')
        .eq('is_active', true);

      if (templates) {
        const uniqueCategories = Array.from(new Set(templates.map(t => t.category).filter(Boolean)));
        for (const category of uniqueCategories) {
          await this.client
            .from('email_categories')
            .upsert({ 
              name: category, 
              description: `Email template category: ${category}`,
              is_active: true 
            }, { onConflict: 'name' });
        }
      }
    } catch (error) {
      console.error('[SupabaseStorage] Error populating email categories:', error);
    }
  }

  private async populateTemplateGenres(): Promise<void> {
    try {
      // Get unique genres from both template types
      const { data: liveTemplates } = await this.client
        .from('live_reply_templates')
        .select('genre')
        .eq('is_active', true);

      const { data: emailTemplates } = await this.client
        .from('email_templates')
        .select('genre')
        .eq('is_active', true);

      const allGenres = [
        ...(liveTemplates || []).map(t => t.genre),
        ...(emailTemplates || []).map(t => t.genre)
      ].filter(Boolean);

      const uniqueGenres = Array.from(new Set(allGenres));
      for (const genre of uniqueGenres) {
        await this.client
          .from('template_genres')
          .upsert({ 
            name: genre, 
            description: `Template genre: ${genre}`,
            is_active: true 
          }, { onConflict: 'name' });
      }
    } catch (error) {
      console.error('[SupabaseStorage] Error populating template genres:', error);
    }
  }

  private async populateConcernedTeams(): Promise<void> {
    try {
      // Get unique teams from email templates
      const { data: templates } = await this.client
        .from('email_templates')
        .select('concerned_team')
        .eq('is_active', true);

      if (templates) {
        const uniqueTeams = Array.from(new Set(templates.map(t => t.concerned_team).filter(Boolean)));
        for (const team of uniqueTeams) {
          await this.client
            .from('concerned_teams')
            .upsert({ 
              name: team, 
              description: `Concerned team: ${team}`,
              is_active: true 
            }, { onConflict: 'name' });
        }
      }
    } catch (error) {
      console.error('[SupabaseStorage] Error populating concerned teams:', error);
    }
  }

  // CRUD operations for template categories
  async createTemplateCategory(data: {name: string, description: string, isActive: boolean}): Promise<{id: string, name: string, description: string, isActive: boolean}> {
    try {
      const { data: result, error } = await this.client
        .from('template_categories')
        .insert({
          name: data.name,
          description: data.description,
          is_active: data.isActive
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: result.id,
        name: result.name,
        description: result.description || '',
        isActive: result.is_active
      };
    } catch (error) {
      console.error('[SupabaseStorage] Error creating template category:', error);
      throw error;
    }
  }

  async updateTemplateCategory(id: string, updates: Partial<{name: string, description: string, isActive: boolean}>): Promise<{id: string, name: string, description: string, isActive: boolean}> {
    try {
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      updateData.updated_at = new Date().toISOString();

      const { data: result, error } = await this.client
        .from('template_categories')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: result.id,
        name: result.name,
        description: result.description || '',
        isActive: result.is_active
      };
    } catch (error) {
      console.error('[SupabaseStorage] Error updating template category:', error);
      throw error;
    }
  }

  async deleteTemplateCategory(id: string): Promise<void> {
    try {
      const { error } = await this.client
        .from('template_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('[SupabaseStorage] Error deleting template category:', error);
      throw error;
    }
  }

  // CRUD operations for email categories
  async createEmailCategory(data: {name: string, description: string, isActive: boolean}): Promise<{id: string, name: string, description: string, isActive: boolean}> {
    try {
      const { data: result, error } = await this.client
        .from('email_categories')
        .insert({
          name: data.name,
          description: data.description,
          is_active: data.isActive
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: result.id,
        name: result.name,
        description: result.description || '',
        isActive: result.is_active
      };
    } catch (error) {
      console.error('[SupabaseStorage] Error creating email category:', error);
      throw error;
    }
  }

  async updateEmailCategory(id: string, updates: Partial<{name: string, description: string, isActive: boolean}>): Promise<{id: string, name: string, description: string, isActive: boolean}> {
    try {
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      updateData.updated_at = new Date().toISOString();

      const { data: result, error } = await this.client
        .from('email_categories')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: result.id,
        name: result.name,
        description: result.description || '',
        isActive: result.is_active
      };
    } catch (error) {
      console.error('[SupabaseStorage] Error updating email category:', error);
      throw error;
    }
  }

  async deleteEmailCategory(id: string): Promise<void> {
    try {
      const { error } = await this.client
        .from('email_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('[SupabaseStorage] Error deleting email category:', error);
      throw error;
    }
  }

  // CRUD operations for template genres
  async createTemplateGenre(data: {name: string, description: string, isActive: boolean}): Promise<{id: string, name: string, description: string, isActive: boolean}> {
    try {
      const { data: result, error } = await this.client
        .from('template_genres')
        .insert({
          name: data.name,
          description: data.description,
          is_active: data.isActive
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: result.id,
        name: result.name,
        description: result.description || '',
        isActive: result.is_active
      };
    } catch (error) {
      console.error('[SupabaseStorage] Error creating template genre:', error);
      throw error;
    }
  }

  async updateTemplateGenre(id: string, updates: Partial<{name: string, description: string, isActive: boolean}>): Promise<{id: string, name: string, description: string, isActive: boolean}> {
    try {
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      updateData.updated_at = new Date().toISOString();

      const { data: result, error } = await this.client
        .from('template_genres')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: result.id,
        name: result.name,
        description: result.description || '',
        isActive: result.is_active
      };
    } catch (error) {
      console.error('[SupabaseStorage] Error updating template genre:', error);
      throw error;
    }
  }

  async deleteTemplateGenre(id: string): Promise<void> {
    try {
      const { error } = await this.client
        .from('template_genres')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('[SupabaseStorage] Error deleting template genre:', error);
      throw error;
    }
  }

  // New connected categories and genres methods
  async getConnectedTemplateCategories(): Promise<Array<{
    id: string;
    name: string;
    description: string;
    color: string;
    isActive: boolean;
    orderIndex: number;
    genres: Array<{
      id: string;
      name: string;
      description: string;
      color: string;
      isActive: boolean;
      orderIndex: number;
    }>;
  }>> {
    try {
      await this.ensureDynamicTablesExist();
      
      // First get all categories
      const { data: categories, error: categoriesError } = await this.client
        .from('template_categories')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (categoriesError) {
        console.error('[SupabaseStorage] Error fetching template categories:', categoriesError);
        return [];
      }

      // Then get all genres for each category
      const categoriesWithGenres = [];
      
      for (const category of categories || []) {
        const { data: genres, error: genresError } = await this.client
          .from('template_genres')
          .select('*')
          .eq('category_id', category.id)
          .eq('is_active', true)
          .order('order_index', { ascending: true });

        if (genresError) {
          console.error(`[SupabaseStorage] Error fetching genres for category ${category.id}:`, genresError);
        }

        categoriesWithGenres.push({
          id: category.id,
          name: category.name,
          description: category.description || '',
          color: category.color,
          isActive: category.is_active,
          orderIndex: category.order_index,
          genres: (genres || []).map(genre => ({
            id: genre.id,
            name: genre.name,
            description: genre.description || '',
            color: genre.color,
            isActive: genre.is_active,
            orderIndex: genre.order_index,
          }))
        });
      }

      return categoriesWithGenres;
    } catch (error) {
      console.error('[SupabaseStorage] Error in getConnectedTemplateCategories:', error);
      return [];
    }
  }

  async createConnectedTemplateCategory(data: {
    name: string;
    description: string;
    color: string;
    isActive: boolean;
  }): Promise<{
    id: string;
    name: string;
    description: string;
    color: string;
    isActive: boolean;
    orderIndex: number;
  }> {
    try {
      await this.ensureDynamicTablesExist();
      
      // Find next order index
      const { data: maxOrderData } = await this.client
        .from('template_categories')
        .select('order_index')
        .order('order_index', { ascending: false })
        .limit(1);

      const nextOrderIndex = (maxOrderData?.[0]?.order_index || 0) + 1;

      const { data: result, error } = await this.client
        .from('template_categories')
        .insert({
          name: data.name,
          description: data.description,
          color: data.color,
          is_active: data.isActive,
          order_index: nextOrderIndex,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: result.id,
        name: result.name,
        description: result.description || '',
        color: result.color,
        isActive: result.is_active,
        orderIndex: result.order_index,
      };
    } catch (error) {
      console.error('[SupabaseStorage] Error creating connected template category:', error);
      throw error;
    }
  }

  async createConnectedTemplateGenre(data: {
    name: string;
    description: string;
    categoryId: string;
    color: string;
    isActive: boolean;
  }): Promise<{
    id: string;
    name: string;
    description: string;
    categoryId: string;
    color: string;
    isActive: boolean;
    orderIndex: number;
  }> {
    try {
      await this.ensureDynamicTablesExist();
      
      // Find next order index within the category
      const { data: maxOrderData } = await this.client
        .from('template_genres')
        .select('order_index')
        .eq('category_id', data.categoryId)
        .order('order_index', { ascending: false })
        .limit(1);

      const nextOrderIndex = (maxOrderData?.[0]?.order_index || 0) + 1;

      const { data: result, error } = await this.client
        .from('template_genres')
        .insert({
          name: data.name,
          description: data.description,
          category_id: data.categoryId,
          color: data.color,
          is_active: data.isActive,
          order_index: nextOrderIndex,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: result.id,
        name: result.name,
        description: result.description || '',
        categoryId: result.category_id,
        color: result.color,
        isActive: result.is_active,
        orderIndex: result.order_index,
      };
    } catch (error) {
      console.error('[SupabaseStorage] Error creating connected template genre:', error);
      throw error;
    }
  }

  async updateConnectedTemplateCategory(id: string, data: Partial<{
    name: string;
    description: string;
    color: string;
    isActive: boolean;
    orderIndex: number;
  }>): Promise<{
    id: string;
    name: string;
    description: string;
    color: string;
    isActive: boolean;
    orderIndex: number;
  }> {
    try {
      await this.ensureDynamicTablesExist();
      
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.color !== undefined) updateData.color = data.color;
      if (data.isActive !== undefined) updateData.is_active = data.isActive;
      if (data.orderIndex !== undefined) updateData.order_index = data.orderIndex;
      updateData.updated_at = new Date().toISOString();

      const { data: result, error } = await this.client
        .from('template_categories')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: result.id,
        name: result.name,
        description: result.description || '',
        color: result.color,
        isActive: result.is_active,
        orderIndex: result.order_index,
      };
    } catch (error) {
      console.error('[SupabaseStorage] Error updating connected template category:', error);
      throw error;
    }
  }

  async deleteConnectedTemplateCategory(id: string): Promise<void> {
    try {
      // First delete all associated genres
      const { error: genresError } = await this.client
        .from('template_genres')
        .delete()
        .eq('category_id', id);

      if (genresError) {
        console.error('[SupabaseStorage] Error deleting connected template genres:', genresError);
        throw genresError;
      }

      // Then delete the category
      const { error } = await this.client
        .from('template_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('[SupabaseStorage] Error deleting connected template category:', error);
      throw error;
    }
  }

  async updateConnectedTemplateGenre(id: string, data: Partial<{
    name: string;
    description: string;
    color: string;
    isActive: boolean;
    orderIndex: number;
  }>): Promise<{
    id: string;
    name: string;
    description: string;
    categoryId: string;
    color: string;
    isActive: boolean;
    orderIndex: number;
  }> {
    try {
      await this.ensureDynamicTablesExist();
      
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.color !== undefined) updateData.color = data.color;
      if (data.isActive !== undefined) updateData.is_active = data.isActive;
      if (data.orderIndex !== undefined) updateData.order_index = data.orderIndex;
      updateData.updated_at = new Date().toISOString();

      const { data: result, error } = await this.client
        .from('template_genres')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: result.id,
        name: result.name,
        description: result.description || '',
        categoryId: result.category_id,
        color: result.color,
        isActive: result.is_active,
        orderIndex: result.order_index,
      };
    } catch (error) {
      console.error('[SupabaseStorage] Error updating connected template genre:', error);
      throw error;
    }
  }

  async deleteConnectedTemplateGenre(id: string): Promise<void> {
    try {
      const { error } = await this.client
        .from('template_genres')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('[SupabaseStorage] Error deleting connected template genre:', error);
      throw error;
    }
  }

  // CRUD operations for concerned teams
  async createConcernedTeam(data: {name: string, description: string, isActive: boolean}): Promise<{id: string, name: string, description: string, isActive: boolean}> {
    try {
      const { data: result, error } = await this.client
        .from('concerned_teams')
        .insert({
          name: data.name,
          description: data.description,
          is_active: data.isActive
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: result.id,
        name: result.name,
        description: result.description || '',
        isActive: result.is_active
      };
    } catch (error) {
      console.error('[SupabaseStorage] Error creating concerned team:', error);
      throw error;
    }
  }

  async updateConcernedTeam(id: string, updates: Partial<{name: string, description: string, isActive: boolean}>): Promise<{id: string, name: string, description: string, isActive: boolean}> {
    try {
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      updateData.updated_at = new Date().toISOString();

      const { data: result, error } = await this.client
        .from('concerned_teams')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: result.id,
        name: result.name,
        description: result.description || '',
        isActive: result.is_active
      };
    } catch (error) {
      console.error('[SupabaseStorage] Error updating concerned team:', error);
      throw error;
    }
  }

  async deleteConcernedTeam(id: string): Promise<void> {
    try {
      const { error } = await this.client
        .from('concerned_teams')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('[SupabaseStorage] Error deleting concerned team:', error);
      throw error;
    }
  }

  // Mapping functions
  private mapSupabaseUser(data: any): User {
    return {
      id: data.id,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      arabicFirstName: data.arabic_first_name,
      arabicLastName: data.arabic_last_name,
      profileImageUrl: data.profile_image_url,
      role: data.role,
      status: data.status,
      isOnline: data.is_online,
      isFirstTimeUser: data.is_first_time_user ?? true,
      lastSeen: data.last_seen ? new Date(data.last_seen) : null,
      createdAt: data.created_at ? new Date(data.created_at) : null,
      updatedAt: data.updated_at ? new Date(data.updated_at) : null,
    };
  }

  private mapSupabaseLiveReplyTemplate(data: any): LiveReplyTemplate {
    return {
      id: data.id,
      name: data.name,
      contentEn: data.content_en,
      contentAr: data.content_ar,
      category: data.category,
      genre: data.genre,
      variables: data.variables,
      groupId: data.group_id,
      groupOrder: data.group_order || 0,
      stageOrder: data.stage_order,
      isActive: data.is_active,
      usageCount: data.usage_count,
      createdAt: data.created_at ? new Date(data.created_at) : null,
      updatedAt: data.updated_at ? new Date(data.updated_at) : null,
      supabaseId: data.id, // Supabase ID is the same as the record ID
      lastSyncedAt: new Date(), // Always synced since this is from Supabase
    };
  }

  private async mapSupabaseLiveReplyTemplateWithNames(data: any): Promise<LiveReplyTemplate> {
    // Try to resolve category and genre IDs to names
    let categoryName = data.category;
    let genreName = data.genre;

    // If category looks like a UUID, try to resolve it
    if (data.category && data.category.length === 36 && data.category.includes('-')) {
      try {
        const { data: categoryData } = await this.client
          .from('template_categories')
          .select('name')
          .eq('id', data.category)
          .single();
        
        if (categoryData) {
          categoryName = categoryData.name;
        }
      } catch (error) {
        console.warn('[SupabaseStorage] Could not resolve category ID:', data.category);
      }
    }

    // If genre looks like a UUID, try to resolve it
    if (data.genre && data.genre.length === 36 && data.genre.includes('-')) {
      try {
        const { data: genreData } = await this.client
          .from('template_genres')
          .select('name')
          .eq('id', data.genre)
          .single();
        
        if (genreData) {
          genreName = genreData.name;
        }
      } catch (error) {
        console.warn('[SupabaseStorage] Could not resolve genre ID:', data.genre);
      }
    }

    return {
      id: data.id,
      name: data.name,
      contentEn: data.content_en,
      contentAr: data.content_ar,
      category: categoryName,
      genre: genreName,
      variables: data.variables,
      groupId: data.group_id,
      groupOrder: data.group_order || 0,
      stageOrder: data.stage_order,
      isActive: data.is_active,
      usageCount: data.usage_count,
      createdAt: data.created_at ? new Date(data.created_at) : null,
      updatedAt: data.updated_at ? new Date(data.updated_at) : null,
      supabaseId: data.id, // Supabase ID is the same as the record ID
      lastSyncedAt: new Date(), // Always synced since this is from Supabase
    };
  }

  private mapToSupabaseLiveReplyTemplate(template: any): any {
    return {
      name: template.name,
      content_en: template.contentEn,
      content_ar: template.contentAr,
      category: template.category,
      genre: template.genre,
      variables: template.variables,
      stage_order: template.stageOrder,
      is_active: template.isActive,
      usage_count: template.usageCount || 0,
    };
  }

  private mapSupabaseEmailTemplate(data: any): EmailTemplate {
    return {
      id: data.id,
      name: data.name,
      subject: data.subject,
      content: data.content,
      contentEn: data.content_en || data.content,
      contentAr: data.content_ar || '',
      category: data.category,
      genre: data.genre,
      concernedTeam: data.concerned_team,
      warningNote: data.warning_note,
      variables: data.variables,
      stageOrder: data.stage_order,
      isActive: data.is_active,
      usageCount: data.usage_count,
      createdAt: data.created_at ? new Date(data.created_at) : null,
      updatedAt: data.updated_at ? new Date(data.updated_at) : null,
      supabaseId: data.id, // Supabase ID is the same as the record ID
      lastSyncedAt: new Date(), // Always synced since this is from Supabase
    };
  }

  private async mapSupabaseEmailTemplateWithNames(data: any): Promise<EmailTemplate> {
    // Try to resolve category and genre IDs to names
    let categoryName = data.category;
    let genreName = data.genre;

    // If category looks like a UUID, try to resolve it
    if (data.category && data.category.length === 36 && data.category.includes('-')) {
      try {
        const { data: categoryData } = await this.client
          .from('template_categories')
          .select('name')
          .eq('id', data.category)
          .single();
        
        if (categoryData) {
          categoryName = categoryData.name;
        }
      } catch (error) {
        console.warn('[SupabaseStorage] Could not resolve category ID:', data.category);
      }
    }

    // If genre looks like a UUID, try to resolve it
    if (data.genre && data.genre.length === 36 && data.genre.includes('-')) {
      try {
        const { data: genreData } = await this.client
          .from('template_genres')
          .select('name')
          .eq('id', data.genre)
          .single();
        
        if (genreData) {
          genreName = genreData.name;
        }
      } catch (error) {
        console.warn('[SupabaseStorage] Could not resolve genre ID:', data.genre);
      }
    }

    // Extract variables from subject and content if the variables field is empty
    let extractedVariables = data.variables || [];
    if (!extractedVariables || extractedVariables.length === 0) {
      const subjectVars = this.extractVariablesFromText(data.subject || '');
      const contentVars = this.extractVariablesFromText(data.content || '');
      extractedVariables = Array.from(new Set([...subjectVars, ...contentVars]));
      console.log('[SupabaseStorage] Extracted variables from template:', {
        id: data.id,
        name: data.name,
        subject: data.subject,
        subjectVars,
        contentVars,
        extractedVariables
      });
    } else {
      // Normalize existing variables to lowercase for frontend compatibility
      extractedVariables = extractedVariables.map((v: string) => v.toLowerCase());
      console.log('[SupabaseStorage] Normalized existing variables to lowercase:', {
        id: data.id,
        name: data.name,
        originalVariables: data.variables,
        normalizedVariables: extractedVariables
      });
    }

    return {
      id: data.id,
      name: data.name,
      subject: data.subject,
      content: data.content,
      contentEn: data.content_en || data.content,
      contentAr: data.content_ar || '',
      category: categoryName,
      genre: genreName,
      concernedTeam: data.concerned_team,
      warningNote: data.warning_note,
      variables: extractedVariables,
      stageOrder: data.stage_order,
      isActive: data.is_active,
      usageCount: data.usage_count,
      createdAt: data.created_at ? new Date(data.created_at) : null,
      updatedAt: data.updated_at ? new Date(data.updated_at) : null,
      supabaseId: data.id, // Supabase ID is the same as the record ID
      lastSyncedAt: new Date(), // Always synced since this is from Supabase
    };
  }

  private mapToSupabaseEmailTemplate(template: any): any {
    // Handle legacy database with 'content' field while maintaining support for new structure
    let content = '';
    if (template.contentEn && template.contentAr) {
      // If both languages are provided, use English as primary content for legacy compatibility
      content = template.contentEn;
    } else if (template.contentEn) {
      content = template.contentEn;
    } else if (template.contentAr) {
      content = template.contentAr;
    } else if (template.content) {
      content = template.content;
    }

    console.log('[SupabaseStorage] Mapping email template:', {
      name: template.name,
      contentEn: template.contentEn,
      contentAr: template.contentAr,
      mappedContent: content
    });

    // Create mapped object with only fields that exist in the database
    const mapped: any = {};
    mapped.name = template.name;
    mapped.subject = template.subject;
    mapped.content = content; // Legacy field for database compatibility
    mapped.category = template.category;
    mapped.genre = template.genre;
    mapped.concerned_team = template.concernedTeam;
    if (template.warningNote !== undefined) mapped.warning_note = template.warningNote;
    if (template.variables !== undefined) mapped.variables = template.variables;
    mapped.stage_order = template.stageOrder;
    mapped.is_active = template.isActive;
    mapped.usage_count = template.usageCount || 0;
    


    console.log('[SupabaseStorage] Final mapped object:', mapped);
    return mapped;
  }

  private mapSupabaseSiteContent(data: any): SiteContent {
    return {
      id: data.id,
      key: data.key,
      content: data.content,
      updatedAt: data.updated_at ? new Date(data.updated_at) : null,
      supabaseId: data.id, // Supabase ID is the same as the record ID
      lastSyncedAt: new Date(), // Always synced since this is from Supabase
    };
  }

  private mapSupabaseAnnouncement(data: any): Announcement {
    return {
      id: data.id,
      title: data.title,
      content: data.content,
      isActive: data.is_active,
      backgroundColor: data.background_color,
      textColor: data.text_color,
      borderColor: data.border_color,
      priority: data.priority,
      version: data.version || 1,
      lastAnnouncedAt: data.last_announced_at ? new Date(data.last_announced_at) : null,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      supabaseId: data.supabase_id,
      lastSyncedAt: data.last_synced_at ? new Date(data.last_synced_at) : null,
    };
  }

  private mapSupabaseUserAnnouncementAck(data: any): UserAnnouncementAck {
    return {
      id: data.id,
      userId: data.user_id,
      announcementId: data.announcement_id,
      acknowledgedAt: new Date(data.acknowledged_at),
      supabaseId: data.supabase_id,
      lastSyncedAt: data.last_synced_at ? new Date(data.last_synced_at) : null,
    };
  }

  // Template Variables operations
  async getTemplateVariables(filters?: { category?: string; search?: string; isSystem?: boolean; }): Promise<any[]> {
    try {
      await this.ensureDynamicTablesExist();
      
      let query = this.client
        .from('template_variables')
        .select('*');

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }
      if (filters?.isSystem !== undefined) {
        query = query.eq('is_system', filters.isSystem);
      }

      // Order by manual order first, then by name for consistency
      const { data, error } = await query.order('order', { ascending: true }).order('name', { ascending: true });

      if (error) {
        console.error('[SupabaseStorage] Error fetching template variables:', error);
        return [];
      }

      return data.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        category: item.category,
        example: item.example,
        defaultValue: item.default_value,
        isSystem: item.is_system,
        order: item.order || 0,
        
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at)
      }));
    } catch (error) {
      console.error('[SupabaseStorage] Error in getTemplateVariables:', error);
      return [];
    }
  }

  async getTemplateVariable(id: string): Promise<any | undefined> {
    try {
      const { data, error } = await this.client
        .from('template_variables')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('[SupabaseStorage] Error fetching template variable:', error);
        return undefined;
      }

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        category: data.category,
        example: data.example,
        defaultValue: data.default_value,
        isSystem: data.is_system,
        
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('[SupabaseStorage] Error in getTemplateVariable:', error);
      return undefined;
    }
  }

  async createTemplateVariable(variable: any): Promise<any> {
    try {
      await this.ensureDynamicTablesExist();
      
      // Get the highest order number and add 1 for new variable
      const { data: existingVars } = await this.client
        .from('template_variables')
        .select('order')
        .order('order', { ascending: false })
        .limit(1);
      
      const nextOrder = existingVars && existingVars.length > 0 
        ? (existingVars[0].order || 0) + 1 
        : 0;
      
      const { data, error } = await this.client
        .from('template_variables')
        .insert({
          name: variable.name,
          description: variable.description,
          category: variable.category,
          example: variable.example,
          default_value: variable.defaultValue,
          is_system: variable.isSystem || false,
          order: variable.order !== undefined ? variable.order : nextOrder,

          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('[SupabaseStorage] Error creating template variable:', error);
        throw error;
      }

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        category: data.category,
        example: data.example,
        defaultValue: data.default_value,
        isSystem: data.is_system,
        order: data.order || 0,
        
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('[SupabaseStorage] Error in createTemplateVariable:', error);
      throw error;
    }
  }

  async updateTemplateVariable(id: string, variable: any): Promise<any> {
    try {
      // Build update object dynamically to include order field when provided
      const updateData: any = {
        updated_at: new Date().toISOString()
      };
      
      // Only include fields that are provided (allows partial updates)
      if (variable.name !== undefined) updateData.name = variable.name;
      if (variable.description !== undefined) updateData.description = variable.description;
      if (variable.category !== undefined) updateData.category = variable.category;
      if (variable.example !== undefined) updateData.example = variable.example;
      if (variable.defaultValue !== undefined) updateData.default_value = variable.defaultValue;
      if (variable.order !== undefined) updateData.order = variable.order;

      const { data, error } = await this.client
        .from('template_variables')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[SupabaseStorage] Error updating template variable:', error);
        throw error;
      }

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        category: data.category,
        example: data.example,
        defaultValue: data.default_value,
        isSystem: data.is_system,
        order: data.order || 0,
        
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('[SupabaseStorage] Error in updateTemplateVariable:', error);
      throw error;
    }
  }

  async deleteTemplateVariable(id: string): Promise<void> {
    try {
      console.log('[SupabaseStorage] Attempting to delete template variable with ID:', id);
      
      // First check if the variable exists
      const { data: existingVar, error: checkError } = await this.client
        .from('template_variables')
        .select('id, name')
        .eq('id', id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" error
        console.error('[SupabaseStorage] Error checking template variable existence:', checkError);
        throw new Error(`Failed to verify template variable existence: ${checkError.message}`);
      }

      if (!existingVar) {
        console.warn('[SupabaseStorage] Template variable not found for deletion:', id);
        throw new Error(`Template variable with ID ${id} not found`);
      }

      console.log('[SupabaseStorage] Deleting template variable:', existingVar.name);

      // Proceed with deletion
      const { error, count } = await this.client
        .from('template_variables')
        .delete({ count: 'exact' })
        .eq('id', id);

      if (error) {
        console.error('[SupabaseStorage] Error deleting template variable:', error);
        throw new Error(`Failed to delete template variable: ${error.message}`);
      }

      console.log('[SupabaseStorage] Successfully deleted template variable. Rows affected:', count);
      
      if (count === 0) {
        console.warn('[SupabaseStorage] No rows were deleted - variable may have been already deleted');
      }

    } catch (error) {
      console.error('[SupabaseStorage] Error in deleteTemplateVariable:', error);
      throw error;
    }
  }

  // Template Variable Categories operations
  async getTemplateVariableCategories(): Promise<any[]> {
    try {
      await this.ensureDynamicTablesExist();
      
      const { data, error } = await this.client
        .from('template_variable_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_name', { ascending: true });

      if (error) {
        console.error('[SupabaseStorage] Error fetching template variable categories:', error);
        return [];
      }

      return data.map(item => ({
        id: item.id,
        name: item.name,
        displayName: item.display_name,
        color: item.color,
        isActive: item.is_active,
        
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at)
      }));
    } catch (error) {
      console.error('[SupabaseStorage] Error in getTemplateVariableCategories:', error);
      return [];
    }
  }

  async getTemplateVariableCategory(id: string): Promise<any | undefined> {
    try {
      const { data, error } = await this.client
        .from('template_variable_categories')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('[SupabaseStorage] Error fetching template variable category:', error);
        return undefined;
      }

      return {
        id: data.id,
        name: data.name,
        displayName: data.display_name,
        color: data.color,
        isActive: data.is_active,
        
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('[SupabaseStorage] Error in getTemplateVariableCategory:', error);
      return undefined;
    }
  }

  async createTemplateVariableCategory(category: any): Promise<any> {
    try {
      await this.ensureDynamicTablesExist();
      
      const { data, error } = await this.client
        .from('template_variable_categories')
        .insert({
          name: category.name,
          display_name: category.displayName || category.name,
          color: category.color || 'bg-gray-100 text-gray-800',
          is_active: category.isActive !== false,
          
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('[SupabaseStorage] Error creating template variable category:', error);
        throw error;
      }

      return {
        id: data.id,
        name: data.name,
        displayName: data.display_name,
        color: data.color,
        isActive: data.is_active,
        
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('[SupabaseStorage] Error in createTemplateVariableCategory:', error);
      throw error;
    }
  }

  async updateTemplateVariableCategory(id: string, category: any): Promise<any> {
    try {
      const { data, error } = await this.client
        .from('template_variable_categories')
        .update({
          name: category.name,
          display_name: category.displayName,
          color: category.color,
          is_active: category.isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[SupabaseStorage] Error updating template variable category:', error);
        throw error;
      }

      return {
        id: data.id,
        name: data.name,
        displayName: data.display_name,
        color: data.color,
        isActive: data.is_active,
        
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('[SupabaseStorage] Error in updateTemplateVariableCategory:', error);
      throw error;
    }
  }

  async deleteTemplateVariableCategory(id: string): Promise<void> {
    try {
      const { error } = await this.client
        .from('template_variable_categories')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[SupabaseStorage] Error deleting template variable category:', error);
        throw error;
      }
    } catch (error) {
      console.error('[SupabaseStorage] Error in deleteTemplateVariableCategory:', error);
      throw error;
    }
  }

  // Color Settings operations
  async getColorSettings(filters?: { entityType?: 'genre' | 'category'; entityName?: string; }): Promise<any[]> {
    try {
      await this.ensureDynamicTablesExist();
      
      let query = this.client
        .from('color_settings')
        .select('*')
        .order('entity_name', { ascending: true });

      if (filters?.entityType) {
        query = query.eq('entity_type', filters.entityType);
      }
      if (filters?.entityName) {
        query = query.eq('entity_name', filters.entityName);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[SupabaseStorage] Error fetching color settings:', error);
        return [];
      }

      return data.map(item => ({
        id: item.id,
        entityType: item.entity_type,
        entityName: item.entity_name,
        backgroundColor: item.background_color,
        textColor: item.text_color,
        borderColor: item.border_color,
        
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at)
      }));
    } catch (error) {
      console.error('[SupabaseStorage] Error in getColorSettings:', error);
      return [];
    }
  }

  async getColorSetting(id: string): Promise<any | undefined> {
    try {
      const { data, error } = await this.client
        .from('color_settings')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('[SupabaseStorage] Error fetching color setting:', error);
        return undefined;
      }

      return {
        id: data.id,
        entityType: data.entity_type,
        entityName: data.entity_name,
        backgroundColor: data.background_color,
        textColor: data.text_color,
        borderColor: data.border_color,
        
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('[SupabaseStorage] Error in getColorSetting:', error);
      return undefined;
    }
  }

  async upsertColorSetting(colorSetting: any): Promise<any> {
    try {
      await this.ensureDynamicTablesExist();
      
      // Check if exists
      const { data: existing, error: fetchError } = await this.client
        .from('color_settings')
        .select('*')
        .eq('entity_type', colorSetting.entityType)
        .eq('entity_name', colorSetting.entityName)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('[SupabaseStorage] Error checking existing color setting:', fetchError);
        throw fetchError;
      }

      let data, error;

      if (existing) {
        // Update existing
        const result = await this.client
          .from('color_settings')
          .update({
            background_color: colorSetting.backgroundColor,
            text_color: colorSetting.textColor,
            border_color: colorSetting.borderColor,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single();
        
        data = result.data;
        error = result.error;
      } else {
        // Create new
        const result = await this.client
          .from('color_settings')
          .insert({
            entity_type: colorSetting.entityType,
            entity_name: colorSetting.entityName,
            background_color: colorSetting.backgroundColor,
            text_color: colorSetting.textColor,
            border_color: colorSetting.borderColor,
            
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('[SupabaseStorage] Error upserting color setting:', error);
        throw error;
      }

      return {
        id: data.id,
        entityType: data.entity_type,
        entityName: data.entity_name,
        backgroundColor: data.background_color,
        textColor: data.text_color,
        borderColor: data.border_color,
        
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('[SupabaseStorage] Error in upsertColorSetting:', error);
      throw error;
    }
  }

  async deleteColorSetting(id: string): Promise<void> {
    try {
      const { error } = await this.client
        .from('color_settings')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[SupabaseStorage] Error deleting color setting:', error);
        throw error;
      }
    } catch (error) {
      console.error('[SupabaseStorage] Error in deleteColorSetting:', error);
      throw error;
    }
  }

  // FAQ operations
  async getFaqs(filters?: { category?: string; search?: string; isActive?: boolean; }): Promise<any[]> {
    try {
      let query = this.client
        .from('faqs')
        .select('*')
        .order('order', { ascending: true })
        .order('created_at', { ascending: false });

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }
      if (filters?.search) {
        query = query.or(`question.ilike.%${filters.search}%,answer.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[SupabaseStorage] Error fetching FAQs:', error);
        return [];
      }

      return data.map(item => ({
        id: item.id,
        question: item.question,
        answer: item.answer,
        category: item.category,
        icon: item.icon,
        order: item.order,
        isActive: item.is_active,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));
    } catch (error) {
      console.error('[SupabaseStorage] Error in getFaqs:', error);
      return [];
    }
  }

  async getFaq(id: string): Promise<any | undefined> {
    try {
      const { data, error } = await this.client
        .from('faqs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('[SupabaseStorage] Error fetching FAQ:', error);
        return undefined;
      }

      return {
        id: data.id,
        question: data.question,
        answer: data.answer,
        category: data.category,
        icon: data.icon,
        order: data.order,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('[SupabaseStorage] Error in getFaq:', error);
      return undefined;
    }
  }

  async createFaq(faq: any): Promise<any> {
    try {
      console.log('[SupabaseStorage] Creating new FAQ:', faq.question);
      
      // Use service client for RLS bypass if needed, otherwise use regular client
      const client = this.serviceClient || this.client;
      
      const { data, error } = await client
        .from('faqs')
        .insert({
          question: faq.question,
          answer: faq.answer,
          category: faq.category || 'general',
          icon: faq.icon || 'HelpCircle',
          order: faq.order || 0,
          is_active: faq.isActive !== false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('[SupabaseStorage] Error creating FAQ:', error);
        console.error('[SupabaseStorage] Create failed - Error code:', error.code);
        throw error;
      }

      console.log('[SupabaseStorage] FAQ created successfully:', data.question);

      return {
        id: data.id,
        question: data.question,
        answer: data.answer,
        category: data.category,
        icon: data.icon,
        order: data.order,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('[SupabaseStorage] Error in createFaq:', error);
      throw error;
    }
  }

  async updateFaq(id: string, faq: any): Promise<any> {
    try {
      console.log('[SupabaseStorage] Updating FAQ with ID:', id);
      console.log('[SupabaseStorage] Update data:', faq);
      
      // First check if the FAQ exists
      const { data: existingFaq, error: fetchError } = await this.client
        .from('faqs')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('[SupabaseStorage] FAQ not found for update:', fetchError);
        throw new Error(`FAQ with ID ${id} not found`);
      }

      console.log('[SupabaseStorage] Found existing FAQ:', existingFaq.question);

      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (faq.question !== undefined) updateData.question = faq.question;
      if (faq.answer !== undefined) updateData.answer = faq.answer;
      if (faq.category !== undefined) updateData.category = faq.category;
      if (faq.icon !== undefined) updateData.icon = faq.icon;
      if (faq.order !== undefined) updateData.order = faq.order;
      if (faq.isActive !== undefined) updateData.is_active = faq.isActive;

      console.log('[SupabaseStorage] Applying update data:', updateData);

      // Use service client for RLS bypass if needed, otherwise use regular client
      const client = this.serviceClient || this.client;
      
      const { data, error } = await client
        .from('faqs')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[SupabaseStorage] Error updating FAQ:', error);
        console.error('[SupabaseStorage] Update failed - ID:', id, 'Error code:', error.code);
        throw error;
      }

      console.log('[SupabaseStorage] FAQ updated successfully:', data.question);

      return {
        id: data.id,
        question: data.question,
        answer: data.answer,
        category: data.category,
        icon: data.icon,
        order: data.order,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('[SupabaseStorage] Error in updateFaq:', error);
      throw error;
    }
  }

  async deleteFaq(id: string): Promise<void> {
    try {
      console.log('[SupabaseStorage] Deleting FAQ with ID:', id);
      
      // Use service client for RLS bypass if needed, otherwise use regular client
      const client = this.serviceClient || this.client;
      
      const { error } = await client
        .from('faqs')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[SupabaseStorage] Error deleting FAQ:', error);
        console.error('[SupabaseStorage] Delete failed - ID:', id, 'Error code:', error.code);
        throw error;
      }

      console.log('[SupabaseStorage] FAQ deleted successfully');
    } catch (error) {
      console.error('[SupabaseStorage] Error in deleteFaq:', error);
      throw error;
    }
  }

  // Global ordering operations for drag-and-drop (universal for all users)
  async getGlobalOrdering(contentType: string): Promise<Array<{item_id: string, display_order: number}>> {
    try {
      const { data, error } = await this.client
        .from('global_ordering_preferences')
        .select('item_id, display_order')
        .eq('content_type', contentType)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('[SupabaseStorage] Error fetching global ordering:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[SupabaseStorage] Error in getGlobalOrdering:', error);
      return [];
    }
  }

  async saveGlobalOrdering(contentType: string, ordering: Array<{item_id: string, display_order: number}>): Promise<void> {
    try {
      // Delete existing ordering preferences for this content type
      await this.client
        .from('global_ordering_preferences')
        .delete()
        .eq('content_type', contentType);

      // Insert new ordering preferences
      if (ordering.length > 0) {
        const insertData = ordering.map(item => ({
          content_type: contentType,
          item_id: item.item_id,
          display_order: item.display_order,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        const { error } = await this.client
          .from('global_ordering_preferences')
          .insert(insertData);

        if (error) {
          console.error('[SupabaseStorage] Error saving global ordering:', error);
          throw error;
        }
      }
    } catch (error) {
      console.error('[SupabaseStorage] Error in saveGlobalOrdering:', error);
      throw error;
    }
  }

  // Legacy user ordering methods (kept for backward compatibility)
  async getUserOrdering(userId: string, contentType: string): Promise<Array<{item_id: string, display_order: number}>> {
    // Redirect to global ordering for consistency
    return this.getGlobalOrdering(contentType);
  }

  async saveUserOrdering(userId: string, contentType: string, ordering: Array<{item_id: string, display_order: number}>): Promise<void> {
    // Redirect to global ordering for consistency
    return this.saveGlobalOrdering(contentType, ordering);
  }

  // Note: CRUD operations for categories, genres, concerned teams, and email categories 
  // are already defined above in lines 1045-1350. The duplicate methods below have been removed
  // to prevent build errors.

  // =============================================================================
  // PERSISTENT NOTIFICATION SYSTEM
  // =============================================================================
  
  // FAQ Acknowledgments - replaces localStorage for FAQ disco states
  async acknowledgeFaq(userId: string, faqId: string): Promise<void> {
    try {
      await this.ensureDynamicTablesExist();
      
      console.log(`[SupabaseStorage] Acknowledging FAQ ${faqId} for user ${userId}`);
      
      const { error } = await this.serviceClient
        .from('faq_acknowledgments')
        .upsert({
          user_id: userId,
          faq_id: faqId,
          acknowledged_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,faq_id'
        });

      if (error) {
        console.error('[SupabaseStorage] Error acknowledging FAQ:', error);
        throw error;
      }
      
      console.log(`[SupabaseStorage] Successfully acknowledged FAQ ${faqId} for user ${userId}`);
    } catch (error) {
      console.error('[SupabaseStorage] Error in acknowledgeFaq:', error);
      throw error;
    }
  }

  async getUserFaqAcknowledgments(userId: string): Promise<string[]> {
    try {
      const { data, error } = await this.serviceClient
        .from('faq_acknowledgments')
        .select('faq_id')
        .eq('user_id', userId);

      if (error) {
        console.error('[SupabaseStorage] Error fetching FAQ acknowledgments:', error);
        return [];
      }

      return data?.map(item => item.faq_id) || [];
    } catch (error) {
      console.error('[SupabaseStorage] Error in getUserFaqAcknowledgments:', error);
      return [];
    }
  }

  async hasUserSeenFaq(userId: string, faqId: string): Promise<boolean> {
    try {
      const { data, error } = await this.serviceClient
        .from('faq_acknowledgments')
        .select('id')
        .eq('user_id', userId)
        .eq('faq_id', faqId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('[SupabaseStorage] Error checking FAQ acknowledgment:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('[SupabaseStorage] Error in hasUserSeenFaq:', error);
      return false;
    }
  }

  // Announcement Acknowledgments - replaces localStorage for "Got it" states
  async acknowledgeAnnouncement(userId: string, announcementId: string, version: number = 1): Promise<void> {
    try {
      await this.ensureDynamicTablesExist();
      
      console.log(`[SupabaseStorage] Acknowledging announcement ${announcementId} v${version} for user ${userId}`);
      
      const { error } = await this.serviceClient
        .from('announcement_acknowledgments')
        .upsert({
          user_id: userId,
          announcement_id: announcementId,
          announcement_version: version,
          acknowledged_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,announcement_id,announcement_version'
        });

      if (error) {
        console.error('[SupabaseStorage] Error acknowledging announcement:', error);
        throw error;
      }
      
      console.log(`[SupabaseStorage] Successfully acknowledged announcement ${announcementId} v${version} for user ${userId}`);
    } catch (error) {
      console.error('[SupabaseStorage] Error in acknowledgeAnnouncement:', error);
      throw error;
    }
  }

  async getUserAnnouncementAcknowledgments(userId: string): Promise<Array<{announcementId: string, version: number}>> {
    try {
      const { data, error } = await this.serviceClient
        .from('announcement_acknowledgments')
        .select('announcement_id, announcement_version')
        .eq('user_id', userId);

      if (error) {
        console.error('[SupabaseStorage] Error fetching announcement acknowledgments:', error);
        return [];
      }

      return data?.map(item => ({
        announcementId: item.announcement_id,
        version: item.announcement_version
      })) || [];
    } catch (error) {
      console.error('[SupabaseStorage] Error in getUserAnnouncementAcknowledgments:', error);
      return [];
    }
  }

  async hasUserSeenAnnouncement(userId: string, announcementId: string, version: number = 1): Promise<boolean> {
    try {
      const { data, error } = await this.serviceClient
        .from('announcement_acknowledgments')
        .select('id')
        .eq('user_id', userId)
        .eq('announcement_id', announcementId)
        .gte('announcement_version', version)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('[SupabaseStorage] Error checking announcement acknowledgment:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('[SupabaseStorage] Error in hasUserSeenAnnouncement:', error);
      return false;
    }
  }

  // User Notification Preferences
  async getUserNotificationPreferences(userId: string): Promise<any> {
    try {
      const { data, error } = await this.client
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('[SupabaseStorage] Error fetching notification preferences:', error);
        return {
          disableFaqNotifications: false,
          disableAnnouncementNotifications: false
        };
      }

      return data ? {
        id: data.id,
        userId: data.user_id,
        disableFaqNotifications: data.disable_faq_notifications,
        disableAnnouncementNotifications: data.disable_announcement_notifications,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      } : {
        disableFaqNotifications: false,
        disableAnnouncementNotifications: false
      };
    } catch (error) {
      console.error('[SupabaseStorage] Error in getUserNotificationPreferences:', error);
      return {
        disableFaqNotifications: false,
        disableAnnouncementNotifications: false
      };
    }
  }

  async updateUserNotificationPreferences(userId: string, preferences: any): Promise<void> {
    try {
      await this.ensureDynamicTablesExist();
      
      const { error } = await this.client
        .from('user_notification_preferences')
        .upsert({
          user_id: userId,
          disable_faq_notifications: preferences.disableFaqNotifications,
          disable_announcement_notifications: preferences.disableAnnouncementNotifications,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('[SupabaseStorage] Error updating notification preferences:', error);
        throw error;
      }
    } catch (error) {
      console.error('[SupabaseStorage] Error in updateUserNotificationPreferences:', error);
      throw error;
    }
  }

  // Helper method to get unacknowledged items for a user
  async getUnacknowledgedFaqs(userId: string): Promise<any[]> {
    try {
      const { data: faqs } = await this.client
        .from('faqs')
        .select('*')
        .eq('is_active', true)
        .order('order', { ascending: true });

      if (!faqs) return [];

      const acknowledgments = await this.getUserFaqAcknowledgments(userId);
      
      return faqs.filter(faq => !acknowledgments.includes(faq.id));
    } catch (error) {
      console.error('[SupabaseStorage] Error in getUnacknowledgedFaqs:', error);
      return [];
    }
  }

  async getUnacknowledgedAnnouncements(userId: string): Promise<any[]> {
    try {
      const { data: announcements } = await this.client
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (!announcements) return [];

      const acknowledgments = await this.getUserAnnouncementAcknowledgments(userId);
      
      const unacknowledgedAnnouncements = announcements.filter(announcement => {
        const hasAcknowledged = acknowledgments.some(ack => 
          ack.announcementId === announcement.id && 
          ack.version >= (announcement.version || 1)
        );
        return !hasAcknowledged;
      });

      // Map snake_case to camelCase for frontend compatibility and ensure uniqueness
      const mappedAnnouncements = unacknowledgedAnnouncements.map(announcement => ({
        id: announcement.id,
        title: announcement.title,
        content: announcement.content,
        isActive: announcement.is_active,
        backgroundColor: announcement.background_color,
        textColor: announcement.text_color,
        borderColor: announcement.border_color,
        priority: announcement.priority,
        createdBy: announcement.created_by,
        createdAt: announcement.created_at, // Keep as string since API expects string
        updatedAt: announcement.updated_at, // Keep as string since API expects string
        version: announcement.version,
        lastAnnouncedAt: announcement.last_announced_at, // Keep as string since API expects string
      }));

      // Ensure uniqueness by ID to prevent duplicates
      const uniqueAnnouncements = mappedAnnouncements.filter((announcement, index, self) => 
        index === self.findIndex(a => a.id === announcement.id)
      );

      console.log(`[SupabaseStorage] Found ${uniqueAnnouncements.length} unique unacknowledged announcements for user ${userId}`);
      return uniqueAnnouncements;
    } catch (error) {
      console.error('[SupabaseStorage] Error in getUnacknowledgedAnnouncements:', error);
      return [];
    }
  }

  // Call Scripts operations
  async getCallScripts(filters?: { category?: string; search?: string; isActive?: boolean }) {
    console.log('[SupabaseStorage] Getting call scripts with filters:', filters);

    try {
      let query = this.serviceClient.from('call_scripts').select('*');

      // Apply filters
      if (filters?.category) {
        query = query.ilike('category', `%${filters.category}%`);
      }
      
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
      }
      
      if (filters?.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }

      const { data, error } = await query.order('order_index', { ascending: true });

      if (error) {
        console.error('[SupabaseStorage] Error fetching call scripts:', error);
        throw new Error(`Failed to fetch call scripts: ${error.message}`);
      }

      if (!data) {
        return [];
      }

      // Convert database format to expected format
      return data.map(script => ({
        id: script.id,
        name: script.name,
        content: script.content,
        category: script.category, // Direct mapping 
        genre: script.genre,       // Direct mapping
        orderIndex: script.order_index,
        isActive: script.is_active,
        createdBy: script.created_by,
        createdAt: new Date(script.created_at),
        updatedAt: new Date(script.updated_at),
        supabaseId: script.supabase_id,
        lastSyncedAt: new Date(script.last_synced_at),
      }));
    } catch (error) {
      console.error('[SupabaseStorage] Error in getCallScripts:', error);
      return [];
    }
  }

  async getAllCallScripts() {
    return this.getCallScripts();
  }

  async getCallScript(id: string) {
    const scripts = await this.getCallScripts();
    return scripts.find(script => script.id === id);
  }

  async createCallScript(scriptData: any) {
    console.log('[SupabaseStorage] 📝 Creating call script:', scriptData);
    
    const newScript = {
      id: randomUUID(),
      name: scriptData.name,
      content: scriptData.content,
      category: scriptData.category || null, // Use category as VARCHAR
      genre: scriptData.genre || null,       // Use genre as VARCHAR
      order_index: scriptData.orderIndex || 0,
      is_active: scriptData.isActive !== undefined ? scriptData.isActive : true,
      created_by: scriptData.createdBy || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      supabase_id: randomUUID(),
      last_synced_at: new Date().toISOString(),
    };

    console.log('[SupabaseStorage] 📤 Inserting call script with data:', newScript);

    const { data, error } = await this.serviceClient
      .from('call_scripts')
      .insert([newScript])
      .select('*')
      .single();

    if (error) {
      console.error('[SupabaseStorage] ❌ Error creating call script:', error);
      throw new Error(`Failed to create call script: ${error.message}`);
    }

    console.log('[SupabaseStorage] ✅ Call script created successfully:', data);
    
    // Convert back to the expected format
    return {
      id: data.id,
      name: data.name,
      content: data.content,
      category: data.category, // Direct mapping
      genre: data.genre,       // Direct mapping
      orderIndex: data.order_index,
      isActive: data.is_active,
      createdBy: data.created_by,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      supabaseId: data.supabase_id,
      lastSyncedAt: new Date(data.last_synced_at),
    };
  }

  async updateCallScript(id: string, updates: any) {
    console.log('[SupabaseStorage] Updating call script:', id, updates);
    
    const updateData = {
      name: updates.name,
      content: updates.content,
      category: updates.category || null, // Use category as VARCHAR
      genre: updates.genre || null,       // Use genre as VARCHAR
      order_index: updates.orderIndex || 0,
      is_active: updates.isActive !== undefined ? updates.isActive : true,
      updated_at: new Date().toISOString(),
      last_synced_at: new Date().toISOString(),
    };

    const { data, error } = await this.serviceClient
      .from('call_scripts')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('[SupabaseStorage] Error updating call script:', error);
      throw new Error(`Failed to update call script: ${error.message}`);
    }

    if (!data) {
      throw new Error('Call script not found');
    }

    console.log('[SupabaseStorage] Call script updated successfully:', data);
    
    // Convert back to the expected format
    return {
      id: data.id,
      name: data.name,
      content: data.content,
      category: data.category,  // Direct mapping
      genre: data.genre,        // Direct mapping
      orderIndex: data.order_index,
      isActive: data.is_active,
      createdBy: data.created_by,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      supabaseId: data.supabase_id,
      lastSyncedAt: new Date(data.last_synced_at),
    };
  }

  async deleteCallScript(id: string) {
    console.log('[SupabaseStorage] Deleting call script:', id);
    
    const { error } = await this.serviceClient
      .from('call_scripts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[SupabaseStorage] Error deleting call script:', error);
      throw new Error(`Failed to delete call script: ${error.message}`);
    }

    console.log('[SupabaseStorage] Call script deleted successfully:', id);
  }

  // Store Emails operations
  async getStoreEmails(filters?: { search?: string; isActive?: boolean }) {
    console.log('[SupabaseStorage] Getting store emails with filters:', filters);

    try {
      let query = this.serviceClient.from('store_emails').select('*');

      // Apply filters
      if (filters?.search) {
        query = query.or(`store_name.ilike.%${filters.search}%,store_email.ilike.%${filters.search}%,store_phone.ilike.%${filters.search}%`);
      }
      
      if (filters?.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }

      // Order by id as fallback since order_index may not exist
      const { data, error } = await query.order('id', { ascending: true });

      console.log('[SupabaseStorage] Store emails query result - data:', data, 'error:', error);

      if (error) {
        console.error('[SupabaseStorage] Error fetching store emails:', error);
        throw new Error(`Failed to fetch store emails: ${error.message}`);
      }

      if (!data) {
        console.log('[SupabaseStorage] No data returned from store emails query');
        return [];
      }

      console.log('[SupabaseStorage] Raw store emails data:', JSON.stringify(data, null, 2));

      // Convert database format to expected format - handle missing columns gracefully
      const mapped = data.map((email, index) => ({
        id: email.id,
        storeName: email.store_name,
        storeEmail: email.store_email,
        storePhone: email.store_phone,
        orderIndex: index + 1, // Use array index as order since order_index column doesn't exist
        isActive: email.is_active !== false, // Default to true if null/undefined
        createdBy: email.created_by,
        createdAt: email.created_at ? new Date(email.created_at) : new Date(),
        updatedAt: email.updated_at ? new Date(email.updated_at) : new Date(),
        supabaseId: email.supabase_id || email.id,
        lastSyncedAt: email.last_synced_at ? new Date(email.last_synced_at) : new Date(),
      }));

      console.log('[SupabaseStorage] Mapped store emails:', JSON.stringify(mapped, null, 2));
      return mapped;
    } catch (error) {
      console.error('[SupabaseStorage] Error in getStoreEmails:', error);
      return [];
    }
  }

  async getAllStoreEmails() {
    return this.getStoreEmails();
  }

  async getStoreEmail(id: string) {
    const emails = await this.getStoreEmails();
    return emails.find(email => email.id === id);
  }

  async createStoreEmail(emailData: any) {
    // Mock implementation - should create in database
    console.log('[SupabaseStorage] Creating store email:', emailData);
    
    const newStoreEmail = {
      id: randomUUID(),
      store_name: emailData.storeName,
      store_email: emailData.storeEmail,
      store_phone: emailData.storePhone,
      is_active: emailData.isActive !== undefined ? emailData.isActive : true,
      created_by: emailData.createdBy || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      supabase_id: randomUUID(),
      last_synced_at: new Date().toISOString(),
    };

    const { data, error } = await this.serviceClient
      .from('store_emails')
      .insert([newStoreEmail])
      .select('*')
      .single();

    if (error) {
      console.error('[SupabaseStorage] Error creating store email:', error);
      throw new Error(`Failed to create store email: ${error.message}`);
    }

    console.log('[SupabaseStorage] Store email created successfully:', data);
    
    // Convert back to the expected format
    return {
      id: data.id,
      storeName: data.store_name,
      storeEmail: data.store_email,
      storePhone: data.store_phone,
      orderIndex: data.order_index,
      isActive: data.is_active,
      createdBy: data.created_by,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      supabaseId: data.supabase_id,
      lastSyncedAt: new Date(data.last_synced_at),
    };
  }

  async updateStoreEmail(id: string, updates: any) {
    console.log('[SupabaseStorage] Updating store email:', id, updates);
    
    const updateData = {
      store_name: updates.storeName,
      store_email: updates.storeEmail,
      store_phone: updates.storePhone,
      order_index: updates.orderIndex !== undefined ? updates.orderIndex : undefined,
      is_active: updates.isActive !== undefined ? updates.isActive : true,
      updated_at: new Date().toISOString(),
      last_synced_at: new Date().toISOString(),
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if ((updateData as any)[key] === undefined) {
        delete (updateData as any)[key];
      }
    });

    const { data, error } = await this.serviceClient
      .from('store_emails')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('[SupabaseStorage] Error updating store email:', error);
      throw new Error(`Failed to update store email: ${error.message}`);
    }

    if (!data) {
      throw new Error('Store email not found');
    }

    console.log('[SupabaseStorage] Store email updated successfully:', data);
    
    // Convert back to the expected format
    return {
      id: data.id,
      storeName: data.store_name,
      storeEmail: data.store_email,
      storePhone: data.store_phone,
      orderIndex: data.order_index,
      isActive: data.is_active,
      createdBy: data.created_by,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      supabaseId: data.supabase_id,
      lastSyncedAt: new Date(data.last_synced_at),
    };
  }

  async deleteStoreEmail(id: string) {
    console.log('[SupabaseStorage] Deleting store email:', id);
    
    const { error } = await this.serviceClient
      .from('store_emails')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[SupabaseStorage] Error deleting store email:', error);
      throw new Error(`Failed to delete store email: ${error.message}`);
    }

    console.log('[SupabaseStorage] Store email deleted successfully');
  }

  // Template Categories and Genres for Call Scripts filtering
  async getAllTemplateCategories() {
    // Use existing live reply template groups as categories
    const groups = await this.getLiveReplyTemplateGroups();
    return groups.map(group => ({
      id: group.id,
      name: group.name,
      description: group.description || '',
      isActive: group.isActive,
      type: 'live_reply',
      orderIndex: group.orderIndex,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    }));
  }

  async getAllTemplateGenres() {
    // Return basic genres that could be used for call scripts
    return [
      {
        id: 'greeting',
        name: 'Greeting',
        description: 'Welcome and greeting scripts',
        isActive: true,
        orderIndex: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'complaint',
        name: 'Complaint Handling',
        description: 'Scripts for handling customer complaints',
        isActive: true,
        orderIndex: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'order-inquiry',
        name: 'Order Inquiry',
        description: 'Scripts for order status inquiries',
        isActive: true,
        orderIndex: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'return-request',
        name: 'Return Request',
        description: 'Scripts for handling return requests',
        isActive: true,
        orderIndex: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];
  }

  // Personal Notes operations (implemented)
  async getPersonalNotes(userId: string, filters?: { search?: string; category?: string; isArchived?: boolean }): Promise<any[]> {
    console.log('[SupabaseStorage] 📝 Fetching personal notes for user:', userId, 'with filters:', filters);
    
    let query = this.serviceClient
      .from('personal_notes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Apply search filter if provided
    if (filters?.search) {
      query = query.or(`subject.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[SupabaseStorage] ❌ Error fetching personal notes:', error);
      return [];
    }

    console.log('[SupabaseStorage] ✅ Successfully fetched notes:', data?.length || 0);
    return data?.map(this.mapSupabasePersonalNote) || [];
  }

  async getPersonalNote(id: string): Promise<any | undefined> {
    console.log('[SupabaseStorage] 📝 Getting personal note:', id);
    
    const { data, error } = await this.serviceClient
      .from('personal_notes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[SupabaseStorage] ❌ Error fetching personal note:', error);
      return undefined;
    }

    return data ? this.mapSupabasePersonalNote(data) : undefined;
  }

  async createPersonalNote(note: any): Promise<any> {
    console.log('[SupabaseStorage] 📝 Creating personal note:', note);
    
    const { data, error } = await this.serviceClient
      .from('personal_notes')
      .insert({
        user_id: note.userId,
        subject: note.subject,
        content: note.content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('[SupabaseStorage] ❌ Error creating personal note:', error);
      throw new Error(`Failed to create note: ${error.message}`);
    }

    console.log('[SupabaseStorage] ✅ Successfully created note:', data);
    return this.mapSupabasePersonalNote(data);
  }

  async updatePersonalNote(id: string, updates: Partial<any>): Promise<any> {
    console.log('[SupabaseStorage] 📝 Updating personal note:', id, updates);
    
    const updateData = {
      subject: updates.subject,
      content: updates.content,
      updated_at: new Date().toISOString()
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if ((updateData as any)[key] === undefined) {
        delete (updateData as any)[key];
      }
    });

    const { data, error } = await this.serviceClient
      .from('personal_notes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[SupabaseStorage] ❌ Error updating personal note:', error);
      throw new Error(`Failed to update note: ${error.message}`);
    }

    console.log('[SupabaseStorage] ✅ Successfully updated note:', data);
    return this.mapSupabasePersonalNote(data);
  }

  async deletePersonalNote(id: string): Promise<void> {
    console.log('[SupabaseStorage] 🗑️ Deleting personal note:', id);
    
    const { error } = await this.serviceClient
      .from('personal_notes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[SupabaseStorage] ❌ Error deleting personal note:', error);
      throw new Error(`Failed to delete note: ${error.message}`);
    }

    console.log('[SupabaseStorage] ✅ Successfully deleted note:', id);
  }

  // Helper method to map Supabase personal note to application format
  private mapSupabasePersonalNote(data: any): any {
    return {
      id: data.id,
      userId: data.user_id,
      subject: data.subject,
      content: data.content,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }
}