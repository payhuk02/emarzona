/**
 * Persist product gallery fields immediately (edit flow).
 * Upload to Storage alone does NOT update products.image_url / images —
 * without this, reopen/reload restores the previous primary image.
 */
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export type PersistProductGalleryInput = {
  productId: string;
  images: string[];
  image_url: string;
  /** When previous og_image matched the old primary, retarget or clear it */
  og_image?: string | null;
};

export async function persistProductGallery(input: PersistProductGalleryInput): Promise<void> {
  const images = (input.images || []).filter(Boolean);
  const image_url = images[0] || input.image_url || '';

  const patch: Record<string, unknown> = {
    images,
    image_url,
    updated_at: new Date().toISOString(),
  };

  if (input.og_image !== undefined) {
    patch.og_image = input.og_image;
  }

  const { error } = await supabase.from('products').update(patch).eq('id', input.productId);

  if (error) {
    logger.error('persistProductGallery failed', {
      productId: input.productId,
      error: error.message,
    });
    throw new Error(error.message || "Impossible d'enregistrer les images du produit");
  }
}

export function galleryFieldsChanged(
  prev: { images?: string[] | null; image_url?: string | null },
  next: { images?: string[] | null; image_url?: string | null }
): boolean {
  const prevImages = Array.isArray(prev.images) ? prev.images.filter(Boolean) : [];
  const nextImages = Array.isArray(next.images) ? next.images.filter(Boolean) : [];
  if (prevImages.length !== nextImages.length) return true;
  if (prevImages.some((url, i) => url !== nextImages[i])) return true;
  return (prev.image_url || '') !== (next.image_url || '');
}
