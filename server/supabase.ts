import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { LiveReplyTemplate, EmailTemplate, SiteContent } from '@shared/schema';

interface SupabaseConfig {
  url: string;
  anonKey: string;
}

class SupabaseSync {
  private client: SupabaseClient | null = null;
  private isEnabled = false;

  constructor() {
    // Check if Supabase credentials are available
    const url = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;
    
    if (url && anonKey) {
      this.client = createClient(url, anonKey);
      this.isEnabled = true;
      console.log('[Supabase] Integration enabled');
    } else {
      console.log('[Supabase] Not configured - working in local mode');
    }
  }

  // Check if Supabase is available
  isReady(): boolean {
    return this.isEnabled && this.client !== null;
  }

  // Sync live reply template to Supabase
  async syncLiveReplyTemplate(template: LiveReplyTemplate): Promise<string | null> {
    if (!this.isReady()) return null;

    try {
      const { data, error } = await this.client!
        .from('live_reply_templates')
        .upsert({
          id: template.supabaseId || undefined,
          name: template.name,
          content: template.content,
          category: template.category,
          genre: template.genre,
          variables: template.variables,
          stage_order: template.stageOrder,
          is_active: template.isActive,
          usage_count: template.usageCount,
          created_by: template.createdBy,
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (error) throw error;
      return data?.id || null;
    } catch (error) {
      console.error('[Supabase] Failed to sync live reply template:', error);
      return null;
    }
  }

  // Sync email template to Supabase
  async syncEmailTemplate(template: EmailTemplate): Promise<string | null> {
    if (!this.isReady()) return null;

    try {
      const { data, error } = await this.client!
        .from('email_templates')
        .upsert({
          id: template.supabaseId || undefined,
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
          usage_count: template.usageCount,
          created_by: template.createdBy,
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (error) throw error;
      return data?.id || null;
    } catch (error) {
      console.error('[Supabase] Failed to sync email template:', error);
      return null;
    }
  }

  // Sync site content to Supabase
  async syncSiteContent(content: SiteContent): Promise<string | null> {
    if (!this.isReady()) return null;

    try {
      const { data, error } = await this.client!
        .from('site_content')
        .upsert({
          id: content.supabaseId || undefined,
          key: content.key,
          content: content.content,
          updated_by: content.updatedBy,
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (error) throw error;
      return data?.id || null;
    } catch (error) {
      console.error('[Supabase] Failed to sync site content:', error);
      return null;
    }
  }

  // Fetch live reply templates from Supabase
  async fetchLiveReplyTemplates(): Promise<any[]> {
    if (!this.isReady()) return [];

    try {
      const { data, error } = await this.client!
        .from('live_reply_templates')
        .select('*')
        .eq('is_active', true)
        .order('stage_order');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[Supabase] Failed to fetch live reply templates:', error);
      return [];
    }
  }

  // Fetch email templates from Supabase
  async fetchEmailTemplates(): Promise<any[]> {
    if (!this.isReady()) return [];

    try {
      const { data, error } = await this.client!
        .from('email_templates')
        .select('*')
        .eq('is_active', true)
        .order('stage_order');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[Supabase] Failed to fetch email templates:', error);
      return [];
    }
  }

  // Delete template from Supabase
  async deleteTemplate(tableName: string, supabaseId: string): Promise<boolean> {
    if (!this.isReady()) return false;

    try {
      const { error } = await this.client!
        .from(tableName)
        .delete()
        .eq('id', supabaseId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error(`[Supabase] Failed to delete from ${tableName}:`, error);
      return false;
    }
  }
}

// Export singleton instance
export const supabaseSync = new SupabaseSync();