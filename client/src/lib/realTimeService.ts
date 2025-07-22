import { supabase } from './supabase';

export const realTimeService = {
  // Broadcast template updates to all connected users
  broadcastTemplateUpdate: async () => {
    await supabase.channel('template_changes').send({
      type: 'broadcast',
      event: 'template_update',
      payload: { timestamp: Date.now() }
    });
  },

  // Broadcast user updates to all connected users
  broadcastUserUpdate: async () => {
    await supabase.channel('user_changes').send({
      type: 'broadcast',
      event: 'user_update', 
      payload: { timestamp: Date.now() }
    });
  },

  // Broadcast site content updates to all connected users
  broadcastSiteContentUpdate: async () => {
    await supabase.channel('site_content_changes').send({
      type: 'broadcast',
      event: 'site_content_update',
      payload: { timestamp: Date.now() }
    });
  }
};