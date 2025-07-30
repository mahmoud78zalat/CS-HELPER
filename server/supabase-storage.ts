import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { railwaySupabase } from './railway-supabase-client';
import type { 
  User, 
  UpsertUser,
  LiveReplyTemplate, 
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
  InsertUserAnnouncementAck
} from '@shared/schema';
import { IStorage } from './storage';

export class SupabaseStorage implements IStorage {
  private client!: SupabaseClient;
  private serviceClient!: SupabaseClient;
  
  // Performance optimization: Add caching
  private userCache = new Map<string, { user: User; timestamp: number }>();
  private templateCache = new Map<string, { templates: any[]; timestamp: number }>();
  private readonly CACHE_TTL = 30000; // 30 seconds cache

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
    const { data, error } = await this.client
      .from('users')
      .upsert({
        ...userData,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[SupabaseStorage] Error upserting user:', error);
      throw error;
    }

    return this.mapSupabaseUser(data);
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

    return data.map(this.mapSupabaseUser);
  }

  async deleteUser(id: string): Promise<void> {
    console.log('[SupabaseStorage] Deleting user with ID:', id);
    
    const { error } = await this.serviceClient
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[SupabaseStorage] Error deleting user:', error);
      throw error;
    }

    console.log('[SupabaseStorage] Successfully deleted user:', id);
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

    return data.map(this.mapSupabaseLiveReplyTemplate);
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
    // Ensure created_by always has a value
    const templateWithDefaults: any = {
      ...template,
      createdBy: 'f765c1de-f9b5-4615-8c09-8cdde8152a07' // Always provide a valid user ID as default
    };
    
    const { data, error } = await this.client
      .from('live_reply_templates')
      .insert(this.mapToSupabaseLiveReplyTemplate(templateWithDefaults))
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
    const { data, error } = await this.client
      .from('live_reply_templates')
      .update({
        ...this.mapToSupabaseLiveReplyTemplate(template),
        updated_at: new Date().toISOString()
      })
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
    // Create cache key based on filters
    const cacheKey = JSON.stringify(filters || {});
    const cached = this.templateCache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached.timestamp)) {
      console.log('[SupabaseStorage] Returning cached email templates');
      return cached.templates;
    }
    
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

    const templates = data.map(this.mapSupabaseEmailTemplate);
    
    // Cache the result
    this.templateCache.set(cacheKey, { templates, timestamp: Date.now() });
    console.log('[SupabaseStorage] Cached email templates');
    
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

    return data ? this.mapSupabaseEmailTemplate(data) : undefined;
  }

  async createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    // Ensure created_by always has a value
    const templateWithDefaults: any = {
      ...template,
      createdBy: 'f765c1de-f9b5-4615-8c09-8cdde8152a07' // Always provide a valid user ID as default
    };
    
    const mappedTemplate = this.mapToSupabaseEmailTemplate(templateWithDefaults);
    
    const { data, error } = await this.client
      .from('email_templates')
      .insert(mappedTemplate)
      .select()
      .single();

    if (error) {
      console.error('[SupabaseStorage] Error creating email template:', error);
      throw error;
    }

    // Clear email template cache to ensure fresh data
    this.templateCache.clear();
    console.log('[SupabaseStorage] Cleared email template cache after creation');

    return this.mapSupabaseEmailTemplate(data);
  }

  async upsertEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    // For Supabase, upsert is same as create since we generate new IDs
    return this.createEmailTemplate(template);
  }

  async updateEmailTemplate(id: string, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate> {
    const { data, error } = await this.client
      .from('email_templates')
      .update({
        ...this.mapToSupabaseEmailTemplate(template),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[SupabaseStorage] Error updating email template:', error);
      throw error;
    }

    // Clear email template cache to ensure fresh data
    this.templateCache.clear();
    console.log('[SupabaseStorage] Cleared email template cache after update');

    return this.mapSupabaseEmailTemplate(data);
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
        updated_by: content.updatedBy,
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
        created_by: announcement.createdBy,
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

  async acknowledgeAnnouncement(userId: string, announcementId: string): Promise<void> {
    const { error } = await this.serviceClient
      .from('user_announcement_acks')
      .upsert({
        user_id: userId,
        announcement_id: announcementId,
        acknowledged_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,announcement_id'
      });

    if (error) {
      console.error('[SupabaseStorage] Error acknowledging announcement:', error);
      throw new Error(`Failed to acknowledge announcement: ${error.message}`);
    }
  }

  async getUserAnnouncementAck(userId: string, announcementId: string): Promise<UserAnnouncementAck | undefined> {
    const { data, error } = await this.client
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

  async getUnacknowledgedAnnouncements(userId: string): Promise<Announcement[]> {
    const { data, error } = await this.client
      .from('announcements')
      .select(`
        *,
        user_announcement_acks!left(user_id)
      `)
      .eq('is_active', true)
      .is('user_announcement_acks.user_id', null)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[SupabaseStorage] Error fetching unacknowledged announcements:', error);
      throw new Error(`Failed to fetch unacknowledged announcements: ${error.message}`);
    }

    return data.map(this.mapSupabaseAnnouncement);
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
      profileImageUrl: data.profile_image_url,
      role: data.role,
      status: data.status,
      isOnline: data.is_online,
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
      stageOrder: data.stage_order,
      isActive: data.is_active,
      usageCount: data.usage_count,
      createdBy: data.created_by,
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
      created_by: template.createdBy || template.created_by || 'f765c1de-f9b5-4615-8c09-8cdde8152a07', // Handle both camelCase and snake_case
    };
  }

  private mapSupabaseEmailTemplate(data: any): EmailTemplate {
    return {
      id: data.id,
      name: data.name,
      subject: data.subject,
      content: data.content,
      category: data.category,
      genre: data.genre,
      concernedTeam: data.concerned_team,
      warningNote: data.warning_note,
      variables: data.variables,
      stageOrder: data.stage_order,
      isActive: data.is_active,
      usageCount: data.usage_count,
      createdBy: data.created_by,
      createdAt: data.created_at ? new Date(data.created_at) : null,
      updatedAt: data.updated_at ? new Date(data.updated_at) : null,
      supabaseId: data.id, // Supabase ID is the same as the record ID
      lastSyncedAt: new Date(), // Always synced since this is from Supabase
    };
  }

  private mapToSupabaseEmailTemplate(template: any): any {
    return {
      name: template.name,
      subject: template.subject,
      content: template.content,
      category: template.category,
      genre: template.genre,
      concerned_team: template.concernedTeam,
      warning_note: template.warningNote,
      variables: template.variables,
      stage_order: template.stageOrder,
      is_active: template.isActive,
      usage_count: template.usageCount || 0,
      created_by: template.createdBy || template.created_by || 'system', // Handle both camelCase and snake_case
    };
  }

  private mapSupabaseSiteContent(data: any): SiteContent {
    return {
      id: data.id,
      key: data.key,
      content: data.content,
      updatedBy: data.updated_by,
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
      createdBy: data.created_by,
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
        .select('*')
        .order('name', { ascending: true });

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }
      if (filters?.isSystem !== undefined) {
        query = query.eq('is_system', filters.isSystem);
      }

      const { data, error } = await query;

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
        createdBy: item.created_by,
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
        createdBy: data.created_by,
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
      
      const { data, error } = await this.client
        .from('template_variables')
        .insert({
          name: variable.name,
          description: variable.description,
          category: variable.category,
          example: variable.example,
          default_value: variable.defaultValue,
          is_system: variable.isSystem || false,
          created_by: variable.createdBy,
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
        createdBy: data.created_by,
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
      const { data, error } = await this.client
        .from('template_variables')
        .update({
          name: variable.name,
          description: variable.description,
          category: variable.category,
          example: variable.example,
          default_value: variable.defaultValue,
          updated_at: new Date().toISOString()
        })
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
        createdBy: data.created_by,
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
      const { error } = await this.client
        .from('template_variables')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[SupabaseStorage] Error deleting template variable:', error);
        throw error;
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
        createdBy: item.created_by,
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
        createdBy: data.created_by,
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
          created_by: category.createdBy,
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
        createdBy: data.created_by,
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
        createdBy: data.created_by,
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
        createdBy: item.created_by,
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
        createdBy: data.created_by,
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
            created_by: colorSetting.createdBy,
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
        createdBy: data.created_by,
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

  // Note: CRUD operations for categories, genres, concerned teams, and email categories 
  // are already defined above in lines 1045-1350. The duplicate methods below have been removed
  // to prevent build errors.
}