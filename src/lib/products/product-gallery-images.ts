/**
 * Product gallery helpers — keep `images` as source of truth; sync `image_url` to images[0].
 */

export type ProductGalleryState = {
  images?: string[] | null;
  image_url?: string | null;
};

/**
 * Append newly uploaded URLs without resurrecting a cleared gallery.
 * - If `images` is an array (even empty after delete), use it as base — do NOT re-inject `image_url`.
 * - Only fall back to `image_url` when `images` is still undefined/null (legacy load).
 */
export function appendProductGalleryImages(
  current: ProductGalleryState,
  newUrls: string[]
): { images: string[]; image_url: string } {
  const base = Array.isArray(current.images)
    ? current.images
    : current.image_url
      ? [current.image_url]
      : [];

  const images = [...base, ...newUrls].filter(
    (url, index, self) => Boolean(url) && self.indexOf(url) === index
  );

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
