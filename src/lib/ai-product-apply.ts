/**
 * Helpers — application du contenu IA généré dans les formulaires produits
 */
import type { GeneratedContent } from '@/lib/ai-content-generator';

export interface ProductSeoFields {
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
}

export function buildSeoFromGenerated(content: GeneratedContent): ProductSeoFields {
  return {
    meta_title: content.metaTitle,
    meta_description: content.metaDescription,
    meta_keywords: content.keywords.join(', '),
    og_title: content.ogTitle || content.metaTitle,
    og_description: content.ogDescription || content.metaDescription,
    og_image: content.imageUrl || undefined,
  };
}

export function mergeImages(existing: string[] | undefined, imageUrl?: string | null): string[] {
  if (!imageUrl) return existing ?? [];
  const list = existing ?? [];
  if (list.includes(imageUrl)) return list;
  return [imageUrl, ...list];
}
