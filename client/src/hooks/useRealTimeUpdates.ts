import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useRealTimeUpdates() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Subscribe to live template changes
    const templateSubscription = supabase
      .channel('template_changes')
      .on('broadcast', { event: 'template_update' }, () => {
        console.log('[RealTime] Template update received, invalidating cache');
        queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
        queryClient.invalidateQueries({ queryKey: ['/api/live-reply-template-groups'] });
      })
      .subscribe();

    // Subscribe to email template changes
    const emailTemplateSubscription = supabase
      .channel('email_template_changes')
      .on('broadcast', { event: 'email_template_update' }, () => {
        console.log('[RealTime] Email template update received, invalidating cache');
        queryClient.invalidateQueries({ queryKey: ['/api/email-templates'] });
      })
      .subscribe();

    // Subscribe to user changes  
    const userSubscription = supabase
      .channel('user_changes')
      .on('broadcast', { event: 'user_update' }, () => {
        console.log('[RealTime] User update received, invalidating cache');
        queryClient.invalidateQueries({ queryKey: ['/api/users'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      })
      .subscribe();

    // Subscribe to announcement changes
    const announcementSubscription = supabase
      .channel('announcement_changes')
      .on('broadcast', { event: 'announcement_update' }, () => {
        console.log('[RealTime] Announcement update received, invalidating cache');
        queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
      })
      .subscribe();

    // Subscribe to site content changes
    const siteContentSubscription = supabase
      .channel('site_content_changes')
      .on('broadcast', { event: 'site_content_update' }, () => {
        console.log('[RealTime] Site content update received, invalidating cache');
        queryClient.invalidateQueries({ queryKey: ['/api/site-content'] });
      })
      .subscribe();

    // Subscribe to group changes
    const groupSubscription = supabase
      .channel('group_changes')
      .on('broadcast', { event: 'group_update' }, () => {
        console.log('[RealTime] Group update received, invalidating cache');
        queryClient.invalidateQueries({ queryKey: ['/api/live-reply-template-groups'] });
        queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      })
      .subscribe();

    // Subscribe to variable changes
    const variableSubscription = supabase
      .channel('variable_changes')
      .on('broadcast', { event: 'variable_update' }, () => {
        console.log('[RealTime] Variable update received, invalidating cache');
        queryClient.invalidateQueries({ queryKey: ['/api/template-variables'] });
      })
      .subscribe();

    // Subscribe to FAQ changes
    const faqSubscription = supabase
      .channel('faq_changes')
      .on('broadcast', { event: 'faq_update' }, () => {
        console.log('[RealTime] FAQ update received, invalidating cache');
        queryClient.invalidateQueries({ queryKey: ['/api/faqs'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(templateSubscription);
      supabase.removeChannel(emailTemplateSubscription);
      supabase.removeChannel(userSubscription);
      supabase.removeChannel(announcementSubscription);
      supabase.removeChannel(siteContentSubscription);
      supabase.removeChannel(groupSubscription);
      supabase.removeChannel(variableSubscription);
      supabase.removeChannel(faqSubscription);
    };
  }, [queryClient]);
}