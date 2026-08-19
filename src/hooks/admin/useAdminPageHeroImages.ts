import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PLATFORM_HERO_IMAGES_QUERY_KEY } from '@/hooks/usePlatformHeroImage';
import { logger } from '@/lib/logger';

const HERO_BUCKET = 'platform-assets';
const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function heroTable() {
  return supabase.from('platform_page_hero_images');
}

export async function uploadMarketingHeroImage(slug: string, file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Formats acceptés : PNG, JPG, WebP.');
  }
  if (file.size > MAX_BYTES) {
    throw new Error("L'image ne doit pas dépasser 4 Mo.");
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'webp';
  const path = `page-heroes/${slug.replace('.', '-')}-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from(HERO_BUCKET).upload(path, file, {
    upsert: false,
    contentType: file.type,
    cacheControl: '3600',
  });
  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from(HERO_BUCKET).getPublicUrl(path);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error: upsertError } = await heroTable().upsert(
    {
      slug,
      image_url: publicUrl,
      updated_by: user?.id ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'slug' }
  );
  if (upsertError) throw upsertError;

  return publicUrl;
}

export async function resetMarketingHeroImage(slug: string, currentUrl?: string): Promise<void> {
  const { error } = await heroTable().delete().eq('slug', slug);
  if (error) throw error;

  if (currentUrl?.includes('/storage/v1/object/public/platform-assets/page-heroes/')) {
    const marker = '/platform-assets/';
    const idx = currentUrl.indexOf(marker);
    if (idx >= 0) {
      const objectPath = decodeURIComponent(currentUrl.slice(idx + marker.length).split('?')[0]);
      const { error: removeError } = await supabase.storage.from(HERO_BUCKET).remove([objectPath]);
      if (removeError) {
        logger.warn('Could not delete previous hero asset', { removeError, objectPath });
      }
    }
  }
}

export function useAdminPageHeroImages() {
  const queryClient = useQueryClient();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: PLATFORM_HERO_IMAGES_QUERY_KEY });

  const upload = useMutation({
    mutationFn: ({ slug, file }: { slug: string; file: File }) =>
      uploadMarketingHeroImage(slug, file),
    onSuccess: invalidate,
  });

  const reset = useMutation({
    mutationFn: ({ slug, currentUrl }: { slug: string; currentUrl?: string }) =>
      resetMarketingHeroImage(slug, currentUrl),
    onSuccess: invalidate,
  });

  return { upload, reset };
}
