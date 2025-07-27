// Serverless-compatible storage implementation for Vercel
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
} from '../shared/schema';
import { getSupabaseClient, getServiceClient } from './supabase-config';

export class ServerlessSupabaseStorage {
  // Helper method to map Supabase user to our User type
  private mapSupabaseUser(supabaseUser: any): User {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      firstName: supabaseUser.first_name || '',
      lastName: supabaseUser.last_name || '',
      role: supabaseUser.role || 'agent',
      status: supabaseUser.status || 'active',
      isOnline: supabaseUser.is_online || false,
      lastSeen: supabaseUser.last_seen ? new Date(supabaseUser.last_seen) : new Date(),
      createdAt: new Date(supabaseUser.created_at),
      updatedAt: new Date(supabaseUser.updated_at)
    };
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return undefined;
        console.error('[ServerlessStorage] Error fetching user:', error);
        return undefined;
      }

      return data ? this.mapSupabaseUser(data) : undefined;
    } catch (error) {
      console.error('[ServerlessStorage] Exception in getUser:', error);
      return undefined;
    }
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('users')
        .upsert({
          ...userData,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('[ServerlessStorage] Error upserting user:', error);
        throw error;
      }

      return this.mapSupabaseUser(data);
    } catch (error) {
      console.error('[ServerlessStorage] Exception in upsertUser:', error);
      throw error;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('users')
        .select('*')
        .order('is_online', { ascending: false })
        .order('first_name', { ascending: true });

      if (error) {
        console.error('[ServerlessStorage] Error fetching users:', error);
        return [];
      }

      return data.map(this.mapSupabaseUser);
    } catch (error) {
      console.error('[ServerlessStorage] Exception in getAllUsers:', error);
      return [];
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      const client = getServiceClient();
      const { error } = await client
        .from('users')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[ServerlessStorage] Error deleting user:', error);
        throw error;
      }
    } catch (error) {
      console.error('[ServerlessStorage] Exception in deleteUser:', error);
      throw error;
    }
  }

  async updateUserStatus(id: string, status: "active" | "blocked" | "banned"): Promise<void> {
    try {
      const client = getServiceClient();
      const { error } = await client
        .from('users')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        console.error('[ServerlessStorage] Error updating user status:', error);
        throw error;
      }
    } catch (error) {
      console.error('[ServerlessStorage] Exception in updateUserStatus:', error);
      throw error;
    }
  }

  async updateUserOnlineStatus(id: string, isOnline: boolean): Promise<void> {
    try {
      const client = getSupabaseClient();
      const { error } = await client
        .from('users')
        .update({
          is_online: isOnline,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        console.error('[ServerlessStorage] Error updating user online status:', error);
        throw error;
      }
    } catch (error) {
      console.error('[ServerlessStorage] Exception in updateUserOnlineStatus:', error);
      throw error;
    }
  }

  async updateUserRole(id: string, role: "admin" | "agent"): Promise<void> {
    try {
      const client = getServiceClient();
      const { error } = await client
        .from('users')
        .update({
          role,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        console.error('[ServerlessStorage] Error updating user role:', error);
        throw error;
      }
    } catch (error) {
      console.error('[ServerlessStorage] Exception in updateUserRole:', error);
      throw error;
    }
  }

  // Template operations (simplified for serverless)
  async getLiveReplyTemplates(filters?: any): Promise<LiveReplyTemplate[]> {
    try {
      const client = getSupabaseClient();
      let query = client.from('live_reply_templates').select('*');

      if (filters?.category) query = query.eq('category', filters.category);
      if (filters?.genre) query = query.eq('genre', filters.genre);
      if (filters?.isActive !== undefined) query = query.eq('is_active', filters.isActive);
      if (filters?.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,content_en.ilike.%${filters.search}%,content_ar.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query.order('stage_order', { ascending: true });

      if (error) {
        console.error('[ServerlessStorage] Error fetching live reply templates:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[ServerlessStorage] Exception in getLiveReplyTemplates:', error);
      return [];
    }
  }

  async createLiveReplyTemplate(template: InsertLiveReplyTemplate): Promise<LiveReplyTemplate> {
    try {
      const client = getServiceClient();
      const { data, error } = await client
        .from('live_reply_templates')
        .insert(template)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[ServerlessStorage] Exception in createLiveReplyTemplate:', error);
      throw error;
    }
  }

  async updateLiveReplyTemplate(id: string, updates: Partial<LiveReplyTemplate>): Promise<void> {
    try {
      const client = getServiceClient();
      const { error } = await client
        .from('live_reply_templates')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('[ServerlessStorage] Exception in updateLiveReplyTemplate:', error);
      throw error;
    }
  }

  async deleteLiveReplyTemplate(id: string): Promise<void> {
    try {
      const client = getServiceClient();
      const { error } = await client
        .from('live_reply_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('[ServerlessStorage] Exception in deleteLiveReplyTemplate:', error);
      throw error;
    }
  }

  // Email template operations
  async getEmailTemplates(filters?: any): Promise<EmailTemplate[]> {
    try {
      const client = getSupabaseClient();
      let query = client.from('email_templates').select('*');

      if (filters?.category) query = query.eq('category', filters.category);
      if (filters?.isActive !== undefined) query = query.eq('is_active', filters.isActive);

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('[ServerlessStorage] Error fetching email templates:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[ServerlessStorage] Exception in getEmailTemplates:', error);
      return [];
    }
  }

  async createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    try {
      const client = getServiceClient();
      const { data, error } = await client
        .from('email_templates')
        .insert(template)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[ServerlessStorage] Exception in createEmailTemplate:', error);
      throw error;
    }
  }

  async updateEmailTemplate(id: string, updates: Partial<EmailTemplate>): Promise<void> {
    try {
      const client = getServiceClient();
      const { error } = await client
        .from('email_templates')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('[ServerlessStorage] Exception in updateEmailTemplate:', error);
      throw error;
    }
  }

  async deleteEmailTemplate(id: string): Promise<void> {
    try {
      const client = getServiceClient();
      const { error } = await client
        .from('email_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('[ServerlessStorage] Exception in deleteEmailTemplate:', error);
      throw error;
    }
  }

  // Usage tracking (simplified)
  async logLiveReplyUsage(usage: InsertLiveReplyUsage): Promise<void> {
    try {
      const client = getSupabaseClient();
      await client.from('live_reply_usage').insert(usage);
    } catch (error) {
      console.error('[ServerlessStorage] Exception in logLiveReplyUsage:', error);
    }
  }

  async logEmailTemplateUsage(usage: InsertEmailTemplateUsage): Promise<void> {
    try {
      const client = getSupabaseClient();
      await client.from('email_template_usage').insert(usage);
    } catch (error) {
      console.error('[ServerlessStorage] Exception in logEmailTemplateUsage:', error);
    }
  }

  // Site content operations
  async getSiteContent(): Promise<SiteContent | undefined> {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('site_content')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('[ServerlessStorage] Error fetching site content:', error);
        return undefined;
      }

      return data || undefined;
    } catch (error) {
      console.error('[ServerlessStorage] Exception in getSiteContent:', error);
      return undefined;
    }
  }

  async upsertSiteContent(content: InsertSiteContent): Promise<SiteContent> {
    try {
      const client = getServiceClient();
      const { data, error } = await client
        .from('site_content')
        .upsert(content)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[ServerlessStorage] Exception in upsertSiteContent:', error);
      throw error;
    }
  }

  // Announcement operations
  async getAnnouncements(isActive?: boolean): Promise<Announcement[]> {
    try {
      const client = getSupabaseClient();
      let query = client.from('announcements').select('*');

      if (isActive !== undefined) {
        query = query.eq('is_active', isActive);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('[ServerlessStorage] Error fetching announcements:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[ServerlessStorage] Exception in getAnnouncements:', error);
      return [];
    }
  }

  async createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement> {
    try {
      const client = getServiceClient();
      const { data, error } = await client
        .from('announcements')
        .insert(announcement)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[ServerlessStorage] Exception in createAnnouncement:', error);
      throw error;
    }
  }

  async updateAnnouncement(id: string, updates: Partial<Announcement>): Promise<void> {
    try {
      const client = getServiceClient();
      const { error } = await client
        .from('announcements')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('[ServerlessStorage] Exception in updateAnnouncement:', error);
      throw error;
    }
  }

  async deleteAnnouncement(id: string): Promise<void> {
    try {
      const client = getServiceClient();
      const { error } = await client
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('[ServerlessStorage] Exception in deleteAnnouncement:', error);
      throw error;
    }
  }

  async acknowledgeAnnouncement(ack: InsertUserAnnouncementAck): Promise<void> {
    try {
      const client = getSupabaseClient();
      await client
        .from('user_announcement_acks')
        .upsert(ack);
    } catch (error) {
      console.error('[ServerlessStorage] Exception in acknowledgeAnnouncement:', error);
    }
  }

  async getUnacknowledgedAnnouncements(userId: string): Promise<Announcement[]> {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('announcements')
        .select(`
          *,
          user_announcement_acks!left(user_id)
        `)
        .eq('is_active', true)
        .is('user_announcement_acks.user_id', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[ServerlessStorage] Error fetching unacknowledged announcements:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[ServerlessStorage] Exception in getUnacknowledgedAnnouncements:', error);
      return [];
    }
  }
}

// Export singleton instance for serverless use
export const serverlessStorage = new ServerlessSupabaseStorage();