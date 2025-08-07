import { useQuery } from '@tanstack/react-query';

interface SiteContent {
  id: string;
  key: string;
  content: string;
  updatedAt: string | null;
  supabaseId: string | null;
  lastSyncedAt: string | null;
}

export function useSiteName() {
  return useQuery<SiteContent[], Error, string>({
    queryKey: ['/api/site-content', 'site_name'],
    queryFn: async () => {
      const response = await fetch('/api/site-content?key=site_name');
      if (!response.ok) {
        throw new Error('Failed to fetch site name');
      }
      return response.json();
    },
    select: (data) => {
      // Return the site name content or a default if not found
      const siteNameEntry = data.find(item => item.key === 'site_name');
      return siteNameEntry?.content || 'BFL Customer Service Helper';
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}