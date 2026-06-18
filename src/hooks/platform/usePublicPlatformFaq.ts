import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { resolvePlatformFaqLocale } from '@/lib/platform/platformFaqLocale';

export type PlatformFaqAudience = 'all' | 'seller' | 'buyer';

export interface PublicPlatformFaqItem {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  sort_order: number;
}

export interface PublicPlatformFaqCategory {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  audience: PlatformFaqAudience;
  sort_order: number;
  items: PublicPlatformFaqItem[];
}

export function usePublicPlatformFaq() {
  const { i18n } = useTranslation();
  const locale = resolvePlatformFaqLocale(i18n.language);

  return useQuery({
    queryKey: ['public-platform-faq', locale] as const,
    queryFn: async (): Promise<PublicPlatformFaqCategory[]> => {
      const { data, error } = await supabase.rpc('get_public_platform_faqs', {
        p_locale: locale,
      });
      if (error) throw error;
      return (data ?? []) as PublicPlatformFaqCategory[];
    },
    staleTime: 5 * 60 * 1000,
  });
}
