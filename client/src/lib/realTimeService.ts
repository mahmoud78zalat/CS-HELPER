import { supabase } from './supabase';

// Create persistent channels for better real-time performance
const templateChannel = supabase.channel('template_changes');
const emailTemplateChannel = supabase.channel('email_template_changes');
const userChannel = supabase.channel('user_changes');
const announcementChannel = supabase.channel('announcement_changes');
const siteContentChannel = supabase.channel('site_content_changes');
const groupChannel = supabase.channel('group_changes');
const variableChannel = supabase.channel('variable_changes');
const faqChannel = supabase.channel('faq_changes');

export const realTimeService = {
  // Broadcast template updates to all connected users
  broadcastTemplateUpdate: async () => {
    try {
      console.log('[RealTime] Broadcasting template update...');
      await templateChannel.send({
        type: 'broadcast',
        event: 'template_update',
        payload: { timestamp: Date.now() }
      });
      console.log('[RealTime] Template update broadcast sent');
    } catch (error) {
      console.warn('Failed to broadcast template update:', error);
    }
  },

  // Broadcast email template updates to all connected users
  broadcastEmailTemplateUpdate: async () => {
    try {
      console.log('[RealTime] Broadcasting email template update...');
      await emailTemplateChannel.send({
        type: 'broadcast',
        event: 'email_template_update',
        payload: { timestamp: Date.now() }
      });
      console.log('[RealTime] Email template update broadcast sent');
    } catch (error) {
      console.warn('Failed to broadcast email template update:', error);
    }
  },

  // Broadcast user updates to all connected users
  broadcastUserUpdate: async () => {
    try {
      console.log('[RealTime] Broadcasting user update...');
      await userChannel.send({
        type: 'broadcast',
        event: 'user_update', 
        payload: { timestamp: Date.now() }
      });
      console.log('[RealTime] User update broadcast sent');
    } catch (error) {
      console.warn('Failed to broadcast user update:', error);
    }
  },

  // Broadcast announcement updates to all connected users
  broadcastAnnouncementUpdate: async () => {
    try {
      console.log('[RealTime] Broadcasting announcement update...');
      await announcementChannel.send({
        type: 'broadcast',
        event: 'announcement_update',
        payload: { timestamp: Date.now() }
      });
      console.log('[RealTime] Announcement update broadcast sent');
    } catch (error) {
      console.warn('Failed to broadcast announcement update:', error);
    }
  },

  // Broadcast site content updates to all connected users
  broadcastSiteContentUpdate: async () => {
    try {
      console.log('[RealTime] Broadcasting site content update...');
      await siteContentChannel.send({
        type: 'broadcast',
        event: 'site_content_update',
        payload: { timestamp: Date.now() }
      });
      console.log('[RealTime] Site content update broadcast sent');
    } catch (error) {
      console.warn('Failed to broadcast site content update:', error);
    }
  },

  // Broadcast group updates to all connected users
  broadcastGroupUpdate: async () => {
    try {
      console.log('[RealTime] Broadcasting group update...');
      await groupChannel.send({
        type: 'broadcast',
        event: 'group_update',
        payload: { timestamp: Date.now() }
      });
      console.log('[RealTime] Group update broadcast sent');
    } catch (error) {
      console.warn('Failed to broadcast group update:', error);
    }
  },

  // Broadcast variable updates to all connected users
  broadcastVariableUpdate: async () => {
    try {
      console.log('[RealTime] Broadcasting variable update...');
      await variableChannel.send({
        type: 'broadcast',
        event: 'variable_update',
        payload: { timestamp: Date.now() }
      });
      console.log('[RealTime] Variable update broadcast sent');
    } catch (error) {
      console.warn('Failed to broadcast variable update:', error);
    }
  },

  // Broadcast FAQ updates to all connected users
  broadcastFAQUpdate: async () => {
    try {
      console.log('[RealTime] Broadcasting FAQ update...');
      await faqChannel.send({
        type: 'broadcast',
        event: 'faq_update',
        payload: { timestamp: Date.now() }
      });
      console.log('[RealTime] FAQ update broadcast sent');
    } catch (error) {
      console.warn('Failed to broadcast FAQ update:', error);
    }
  }
};