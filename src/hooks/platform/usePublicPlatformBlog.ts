import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { resolvePlatformBlogLocale } from '@/lib/platform/platformBlogLocale';

export interface PublicBlogCategoryRef {
  slug: string;
  name: string;
}

export interface PublicBlogPostSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  featured_image_url: string | null;
  featured_image_alt: string | null;
  author_name: string;
  tags: string[];
  is_featured: boolean;
  reading_time_minutes: number;
  published_at: string | null;
  category: PublicBlogCategoryRef | null;
}

export interface PublicBlogPostDetail extends PublicBlogPostSummary {
  content: string;
  author_bio: string | null;
  allow_comments: boolean;
  updated_at: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string | null;
  canonical_url: string | null;
  og_image_url: string | null;
  noindex: boolean;
}

export function usePublicPlatformBlogPosts(options?: {
  categorySlug?: string;
  tag?: string;
  featuredOnly?: boolean;
  limit?: number;
}) {
  const { i18n } = useTranslation();
  const locale = resolvePlatformBlogLocale(i18n.language);
  const categorySlug = options?.categorySlug;
  const tag = options?.tag;
  const featuredOnly = options?.featuredOnly ?? false;
  const limit = options?.limit ?? 24;

  return useQuery({
    queryKey: [
      'public-platform-blog-posts',
      locale,
      categorySlug,
      tag,
      featuredOnly,
      limit,
    ] as const,
    queryFn: async (): Promise<PublicBlogPostSummary[]> => {
      const { data, error } = await supabase.rpc('get_public_platform_blog_posts', {
        p_locale: locale,
        p_category_slug: categorySlug ?? null,
        p_tag: tag ?? null,
        p_featured_only: featuredOnly,
        p_limit: limit,
        p_offset: 0,
      });
      if (error) throw error;
      return (data ?? []) as PublicBlogPostSummary[];
    },
    staleTime: 3 * 60 * 1000,
  });
}

export function usePublicPlatformBlogPost(slug: string | undefined) {
  const { i18n } = useTranslation();
  const locale = resolvePlatformBlogLocale(i18n.language);

  return useQuery({
    queryKey: ['public-platform-blog-post', slug, locale] as const,
    enabled: Boolean(slug),
    queryFn: async (): Promise<PublicBlogPostDetail | null> => {
      if (!slug) return null;
      const { data, error } = await supabase.rpc('get_public_platform_blog_post', {
        p_slug: slug,
        p_locale: locale,
      });
      if (error) throw error;
      return (data as PublicBlogPostDetail | null) ?? null;
    },
    staleTime: 3 * 60 * 1000,
  });
}
