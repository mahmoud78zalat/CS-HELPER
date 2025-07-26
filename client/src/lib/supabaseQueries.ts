import { supabase } from './supabase';

// Direct Supabase queries for static deployment
export const supabaseQueries = {
  // Templates
  async getTemplates(filters?: { category?: string; genre?: string; search?: string; isActive?: boolean }) {
    let query = supabase
      .from('live_reply_templates')
      .select('*')
      .order('created_at', { ascending: false });

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
      query = query.or(
        `name.ilike.%${filters.search}%,content_en.ilike.%${filters.search}%,content_ar.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Email Templates
  async getEmailTemplates() {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Site Content
  async getSiteContent() {
    const { data, error } = await supabase
      .from('site_content')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Users
  async getUser(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  async getAllUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Template Variables
  async getTemplateVariables() {
    const { data, error } = await supabase
      .from('template_variables')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getTemplateVariableCategories() {
    const { data, error } = await supabase
      .from('template_variable_categories')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // Color Settings
  async getColorSettings() {
    const { data, error } = await supabase
      .from('color_settings')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Announcements
  async getUnacknowledgedAnnouncements(userId: string) {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .not('acknowledged_by_users', 'cs', `{${userId}}`)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
};

export default supabaseQueries;