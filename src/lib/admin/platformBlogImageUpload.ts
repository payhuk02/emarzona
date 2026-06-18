import { supabase } from '@/integrations/supabase/client';

const BUCKET = 'platform-assets';
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

export function validatePlatformBlogImage(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return 'Format non supporté (JPEG, PNG, WebP, GIF).';
  }
  if (file.size > MAX_SIZE_BYTES) {
    return 'Image trop volumineuse (max 5 Mo).';
  }
  return null;
}

export async function uploadPlatformBlogImage(
  file: File,
  options: { slug?: string; purpose: 'featured' | 'og' }
): Promise<string> {
  const validationError = validatePlatformBlogImage(file);
  if (validationError) throw new Error(validationError);

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const safeSlug =
    (options.slug || 'draft')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-|-$/g, '') || 'draft';
  const filePath = `blog/${safeSlug}/${options.purpose}-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, { cacheControl: '3600', upsert: false });

  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

  return publicUrl;
}
