import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export const PLATFORM_HERO_IMAGES_QUERY_KEY = ['platform-page-hero-images'] as const;

export type PlatformPageHeroImageRow = {
  slug: string;
  image_url: string;
  updated_at: string;
};

async function fetchHeroImageMap(): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from('platform_page_hero_images')
    .select('slug, image_url');

  if (error) {
    logger.warn('platform_page_hero_images fetch failed, using defaults', { error });
    return {};
  }

  const map: Record<string, string> = {};
  for (const row of (data ?? []) as Pick<PlatformPageHeroImageRow, 'slug' | 'image_url'>[]) {
    if (row.slug && row.image_url) map[row.slug] = row.image_url;
  }
  return map;
}

export function usePlatformHeroImageMap() {
  return useQuery({
    queryKey: PLATFORM_HERO_IMAGES_QUERY_KEY,
    queryFn: fetchHeroImageMap,
    staleTime: 60_000,
    retry: false,
  });
}

/** Returns the admin override when present, otherwise the bundled default. */
export function usePlatformHeroImage(slug: string, fallback: string): string {
  const { data } = usePlatformHeroImageMap();
  const override = data?.[slug]?.trim();
  return override || fallback;
}
