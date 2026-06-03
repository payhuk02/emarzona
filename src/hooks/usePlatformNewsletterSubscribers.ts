import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type NewsletterSubscriberStatus = 'all' | 'active' | 'unsubscribed';

export interface PlatformNewsletterSubscriber {
  id: string;
  email: string;
  source: string;
  locale: string;
  subscribed_at: string;
  unsubscribed_at: string | null;
  metadata: Record<string, unknown>;
}

export interface NewsletterSubscribersFilters {
  search?: string;
  status?: NewsletterSubscriberStatus;
  page?: number;
  pageSize?: number;
}

export function usePlatformNewsletterSubscribers(filters: NewsletterSubscribersFilters = {}) {
  const { search = '', status = 'all', page = 1, pageSize = 25 } = filters;

  return useQuery({
    queryKey: ['platform-newsletter-subscribers', search, status, page, pageSize],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('platform_newsletter_subscribers')
        .select('*', { count: 'exact' })
        .order('subscribed_at', { ascending: false });

      if (search.trim()) {
        query = query.ilike('email', `%${search.trim()}%`);
      }

      if (status === 'active') {
        query = query.is('unsubscribed_at', null);
      } else if (status === 'unsubscribed') {
        query = query.not('unsubscribed_at', 'is', null);
      }

      const { data, error, count } = await query.range(from, to);

      if (error) throw error;

      return {
        subscribers: (data ?? []) as PlatformNewsletterSubscriber[],
        totalCount: count ?? 0,
      };
    },
    staleTime: 30_000,
  });
}

export function usePlatformNewsletterStats() {
  return useQuery({
    queryKey: ['platform-newsletter-stats'],
    queryFn: async () => {
      const [activeRes, totalRes] = await Promise.all([
        supabase
          .from('platform_newsletter_subscribers')
          .select('*', { count: 'exact', head: true })
          .is('unsubscribed_at', null),
        supabase
          .from('platform_newsletter_subscribers')
          .select('*', { count: 'exact', head: true }),
      ]);

      if (activeRes.error) throw activeRes.error;
      if (totalRes.error) throw totalRes.error;

      return {
        active: activeRes.count ?? 0,
        total: totalRes.count ?? 0,
        unsubscribed: (totalRes.count ?? 0) - (activeRes.count ?? 0),
      };
    },
    staleTime: 60_000,
  });
}
