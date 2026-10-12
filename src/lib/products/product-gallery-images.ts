/**
 * Product gallery helpers — keep `images` as source of truth; sync `image_url` to images[0].
 */

export type ProductGalleryState = {
  images?: string[] | null;
  image_url?: string | null;
};

/**
 * URLs to show in the edit gallery.
 * If `images` is an array (including []), it wins — never fall back to `image_url`
 * after a delete left images empty (that resurrected the old primary in the UI).
 */
export function getDisplayGalleryImages(current: ProductGalleryState): string[] {
  if (Array.isArray(current.images)) {
    return current.images.filter(Boolean);
  }
  return current.image_url ? [current.image_url] : [];
}

/**
 * Append newly uploaded URLs without resurrecting a cleared gallery.
 * - If `images` is an array (even empty after delete), use it as base — do NOT re-inject `image_url`.
 * - Only fall back to `image_url` when `images` is still undefined/null (legacy load).
 */
export function appendProductGalleryImages(
  current: ProductGalleryState,
  newUrls: string[]
): { images: string[]; image_url: string } {
  const base = getDisplayGalleryImages(current);

  const images = [...base, ...newUrls].filter(
    (url, index, self) => Boolean(url) && self.indexOf(url) === index
  );

  return { images, image_url: images[0] ?? '' };
}

/** Remove one gallery slot and sync image_url to the new first image (or ''). */
export function removeProductGalleryImage(
  current: ProductGalleryState,
  index: number
): { images: string[]; image_url: string } {
  const images = getDisplayGalleryImages(current).filter((_, i) => i !== index);
  return { images, image_url: images[0] ?? '' };
}

/** Normalize DB product fields so the edit form has a single gallery list. */
export function normalizeProductGallery(
  images: unknown,
  imageUrl?: string | null
): { images: string[]; image_url: string } {
  const fromArray = Array.isArray(images)
    ? (images as unknown[]).map(String).filter(Boolean)
    : images
      ? [String(images)]
      : [];

  const list = fromArray.length > 0 ? fromArray : imageUrl ? [imageUrl] : [];

  return { images: list, image_url: list[0] ?? '' };
}
