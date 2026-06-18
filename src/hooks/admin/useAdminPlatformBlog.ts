import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PlatformBlogTranslations } from '@/lib/platform/platformBlogLocale';

export type BlogPostStatus = 'draft' | 'scheduled' | 'published' | 'archived';

export interface AdminBlogCategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  translations: PlatformBlogTranslations;
  created_at: string;
  updated_at: string;
}

export interface AdminBlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  status: BlogPostStatus;
  category_id: string | null;
  author_name: string;
  author_bio: string | null;
  featured_image_url: string | null;
  featured_image_alt: string | null;
  tags: string[];
  is_featured: boolean;
  allow_comments: boolean;
  reading_time_minutes: number;
  published_at: string | null;
  scheduled_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  canonical_url: string | null;
  og_image_url: string | null;
  noindex: boolean;
  translations: PlatformBlogTranslations;
  view_count: number;
  created_at: string;
  updated_at: string;
}

const CATEGORIES_KEY = ['admin-platform-blog-categories'] as const;
const POSTS_KEY = ['admin-platform-blog-posts'] as const;

function invalidateBlog(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY });
  void queryClient.invalidateQueries({ queryKey: POSTS_KEY });
  void queryClient.invalidateQueries({ queryKey: ['public-platform-blog-posts'] });
  void queryClient.invalidateQueries({ queryKey: ['public-platform-blog-post'] });
}

export function useAdminBlogCategories() {
  return useQuery({
    queryKey: CATEGORIES_KEY,
    queryFn: async (): Promise<AdminBlogCategory[]> => {
      const { data, error } = await supabase
        .from('platform_blog_categories')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data ?? []) as AdminBlogCategory[];
    },
  });
}

export function useAdminBlogPosts() {
  return useQuery({
    queryKey: POSTS_KEY,
    queryFn: async (): Promise<AdminBlogPost[]> => {
      const { data, error } = await supabase
        .from('platform_blog_posts')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as AdminBlogPost[];
    },
  });
}

export type BlogCategoryInput = {
  slug: string;
  name: string;
  description?: string | null;
  sort_order: number;
  is_active: boolean;
  translations?: PlatformBlogTranslations;
};

export type BlogPostInput = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  status: BlogPostStatus;
  category_id?: string | null;
  author_name: string;
  author_bio?: string | null;
  featured_image_url?: string | null;
  featured_image_alt?: string | null;
  tags: string[];
  is_featured: boolean;
  allow_comments: boolean;
  reading_time_minutes: number;
  published_at?: string | null;
  scheduled_at?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
  canonical_url?: string | null;
  og_image_url?: string | null;
  noindex: boolean;
  translations?: PlatformBlogTranslations;
};

export function useUpsertBlogCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: BlogCategoryInput & { id?: string }) => {
      const { id, ...row } = payload;
      if (id) {
        const { data, error } = await supabase
          .from('platform_blog_categories')
          .update(row)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase
        .from('platform_blog_categories')
        .insert(row)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => invalidateBlog(queryClient),
  });
}

export function useUpsertBlogPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: BlogPostInput & { id?: string }) => {
      const { id, ...row } = payload;
      if (id) {
        const { data, error } = await supabase
          .from('platform_blog_posts')
          .update(row)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase
        .from('platform_blog_posts')
        .insert(row)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => invalidateBlog(queryClient),
  });
}

export function useDeleteBlogCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('platform_blog_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => invalidateBlog(queryClient),
  });
}

export function useDeleteBlogPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('platform_blog_posts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => invalidateBlog(queryClient),
  });
}
