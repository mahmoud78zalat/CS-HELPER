import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useRealTimeUpdates() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Subscribe to template changes
    const templateSubscription = supabase
      .channel('template_changes')
      .on('broadcast', { event: 'template_update' }, () => {
        // Invalidate templates cache when admin makes changes
        queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      })
      .subscribe();

    // Subscribe to user changes  
    const userSubscription = supabase
      .channel('user_changes')
      .on('broadcast', { event: 'user_update' }, () => {
        // Invalidate users cache when admin makes changes
        queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      })
      .subscribe();

    // Subscribe to site content changes
    const siteContentSubscription = supabase
      .channel('site_content_changes')
      .on('broadcast', { event: 'site_content_update' }, () => {
        // Invalidate site content cache when admin makes changes
        queryClient.invalidateQueries({ queryKey: ['/api/site-content'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(templateSubscription);
      supabase.removeChannel(userSubscription);
      supabase.removeChannel(siteContentSubscription);
    };
  }, [queryClient]);
}