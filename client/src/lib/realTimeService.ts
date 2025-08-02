import { supabase } from './supabase';

export const realTimeService = {
  // Broadcast template updates to all connected users
  broadcastTemplateUpdate: async () => {
    try {
      await supabase.channel('template_changes').send({
        type: 'broadcast',
        event: 'template_update',
        payload: { timestamp: Date.now() }
      });
    } catch (error) {
      console.warn('Failed to broadcast template update:', error);
    }
  },

  // Broadcast email template updates to all connected users
  broadcastEmailTemplateUpdate: async () => {
    try {
      await supabase.channel('email_template_changes').send({
        type: 'broadcast',
        event: 'email_template_update',
        payload: { timestamp: Date.now() }
      });
    } catch (error) {
      console.warn('Failed to broadcast email template update:', error);
    }
  },

  // Broadcast user updates to all connected users
  broadcastUserUpdate: async () => {
    try {
      await supabase.channel('user_changes').send({
        type: 'broadcast',
        event: 'user_update', 
        payload: { timestamp: Date.now() }
      });
    } catch (error) {
      console.warn('Failed to broadcast user update:', error);
    }
  },

  // Broadcast announcement updates to all connected users
  broadcastAnnouncementUpdate: async () => {
    try {
      await supabase.channel('announcement_changes').send({
        type: 'broadcast',
        event: 'announcement_update',
        payload: { timestamp: Date.now() }
      });
    } catch (error) {
      console.warn('Failed to broadcast announcement update:', error);
    }
  },

  // Broadcast site content updates to all connected users
  broadcastSiteContentUpdate: async () => {
    try {
      await supabase.channel('site_content_changes').send({
        type: 'broadcast',
        event: 'site_content_update',
        payload: { timestamp: Date.now() }
      });
    } catch (error) {
      console.warn('Failed to broadcast site content update:', error);
    }
  },

  // Broadcast group updates to all connected users
  broadcastGroupUpdate: async () => {
    try {
      await supabase.channel('group_changes').send({
        type: 'broadcast',
        event: 'group_update',
        payload: { timestamp: Date.now() }
      });
    } catch (error) {
      console.warn('Failed to broadcast group update:', error);
    }
  },

  // Broadcast variable updates to all connected users
  broadcastVariableUpdate: async () => {
    try {
      await supabase.channel('variable_changes').send({
        type: 'broadcast',
        event: 'variable_update',
        payload: { timestamp: Date.now() }
      });
    } catch (error) {
      console.warn('Failed to broadcast variable update:', error);
    }
  },

  // Broadcast FAQ updates to all connected users
  broadcastFAQUpdate: async () => {
    try {
      await supabase.channel('faq_changes').send({
        type: 'broadcast',
        event: 'faq_update',
        payload: { timestamp: Date.now() }
      });
    } catch (error) {
      console.warn('Failed to broadcast FAQ update:', error);
    }
  }
};