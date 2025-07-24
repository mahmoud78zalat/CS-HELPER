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
  SiteContent,
  Announcement,
  InsertAnnouncement,
  UserAnnouncementAck,
  InsertUserAnnouncementAck
} from '@shared/schema';
import { IStorage } from './storage';

export class SupabaseStorage implements IStorage {
  private client: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log('[SupabaseStorage] Initializing with URL:', supabaseUrl ? 'URL_PRESENT' : 'URL_MISSING');
    console.log('[SupabaseStorage] Key status:', supabaseKey ? 'KEY_PRESENT' : 'KEY_MISSING');
    console.log('[SupabaseStorage] URL length:', supabaseUrl?.length || 0);
    console.log('[SupabaseStorage] Key length:', supabaseKey?.length || 0);
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.trim() === '' || supabaseKey.trim() === '') {
      throw new Error(`Missing or empty Supabase credentials - URL: ${!!supabaseUrl && supabaseUrl.trim() !== ''}, Key: ${!!supabaseKey && supabaseKey.trim() !== ''}`);
    }
    
    this.client = createClient(supabaseUrl.trim(), supabaseKey.trim());
    console.log('[SupabaseStorage] ✅ Successfully connected to Supabase');
    
    // Test connection asynchronously
    this.testConnection();
  }

  private async testConnection() {
    try {
      console.log('[SupabaseStorage] Testing connection...');
      const { data, error, count } = await this.client
        .from('users')
        .select('*', { count: 'exact' });
      
      console.log('[SupabaseStorage] Connection test - Users count:', count, 'Error:', error);
      if (data) {
        console.log('[SupabaseStorage] Sample users:', data.slice(0, 2));
      }
    } catch (err) {
      console.error('[SupabaseStorage] Connection test failed:', err);
    }
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    console.log('[SupabaseStorage] Querying user with ID:', id);
    
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
    console.log('[SupabaseStorage] Mapped user:', mappedUser);
    return mappedUser;
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
    
    const { error } = await this.client
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
    console.log('[SupabaseStorage] Updating user role for ID:', id, 'to role:', role);
    
    const { data, error } = await this.client
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
    const { data, error } = await this.client
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

    const { data, error } = await this.client
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
    const { error } = await this.client
      .from('announcements')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[SupabaseStorage] Error deleting announcement:', error);
      throw new Error(`Failed to delete announcement: ${error.message}`);
    }
  }

  async acknowledgeAnnouncement(userId: string, announcementId: string): Promise<void> {
    const { error } = await this.client
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
    const { data: currentData, error: fetchError } = await this.client
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
    const { error } = await this.client
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
}