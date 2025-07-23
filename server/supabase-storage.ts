import { createClient, SupabaseClient } from '@supabase/supabase-js';
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
  SiteContent
} from '@shared/schema';
import { IStorage } from './storage';

export class SupabaseStorage implements IStorage {
  private client: SupabaseClient;

  constructor() {
    // Environment variables seem to be swapped in Replit, let's handle both cases
    console.log('[SupabaseStorage] DEBUG: SUPABASE_URL =', process.env.SUPABASE_URL);
    console.log('[SupabaseStorage] DEBUG: SUPABASE_ANON_KEY =', process.env.SUPABASE_ANON_KEY ? '***PRESENT***' : 'MISSING');
    
    let supabaseUrl = process.env.SUPABASE_URL || 'https://lafldimdrginjqloihbh.supabase.co';
    let supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhZmxkaW1kcmdpbmpxbG9paWJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyODk0MzcsImV4cCI6MjA2ODg2NTQzN30.odt1bQ6leB_wWSVV4emTt5bpNts-d0NeZZ-cnBT3SYU';
    
    // Check if they're swapped (URL in ANON_KEY and key in URL)
    if (supabaseKey && supabaseKey.startsWith('https://')) {
      console.log('[SupabaseStorage] Environment variables appear swapped, correcting...');
      const temp = supabaseUrl;
      supabaseUrl = supabaseKey;
      supabaseKey = temp;
    }
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
    }
    
    // Validate URL format
    if (!supabaseUrl.startsWith('https://')) {
      throw new Error('SUPABASE_URL must be a valid URL starting with https://');
    }
    
    this.client = createClient(supabaseUrl, supabaseKey);
    console.log('[SupabaseStorage] Connected to Supabase at:', supabaseUrl);
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[SupabaseStorage] Error fetching user:', error);
      return undefined;
    }

    return data ? this.mapSupabaseUser(data) : undefined;
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
      .order('first_name', { ascending: true });

    if (error) {
      console.error('[SupabaseStorage] Error fetching users:', error);
      return [];
    }

    return data.map(this.mapSupabaseUser);
  }

  async updateUserStatus(id: string, status: "active" | "blocked" | "banned"): Promise<void> {
    const { error } = await this.client
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
    const { error } = await this.client
      .from('users')
      .update({ 
        role, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id);

    if (error) {
      console.error('[SupabaseStorage] Error updating user role:', error);
      throw error;
    }
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

  // Email template operations
  async getEmailTemplates(filters?: {
    category?: string;
    genre?: string;
    concernedTeam?: string;
    search?: string;
    isActive?: boolean;
  }): Promise<EmailTemplate[]> {
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

    return data.map(this.mapSupabaseEmailTemplate);
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
    const { data, error } = await this.client
      .from('email_templates')
      .insert(this.mapToSupabaseEmailTemplate(template))
      .select()
      .single();

    if (error) {
      console.error('[SupabaseStorage] Error creating email template:', error);
      throw error;
    }

    return this.mapSupabaseEmailTemplate(data);
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
    const { data, error } = await this.client
      .from('site_content')
      .upsert({
        ...content,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('[SupabaseStorage] Error upserting site content:', error);
      throw error;
    }

    return this.mapSupabaseSiteContent(data);
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
      created_by: template.createdBy,
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
      created_by: template.createdBy,
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
}