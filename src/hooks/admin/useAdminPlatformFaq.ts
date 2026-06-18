import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PlatformFaqAudience } from '@/hooks/platform/usePublicPlatformFaq';
import type { PlatformFaqTranslations } from '@/lib/platform/platformFaqLocale';

export interface AdminPlatformFaqCategory {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  audience: PlatformFaqAudience;
  sort_order: number;
  is_active: boolean;
  translations: PlatformFaqTranslations;
  created_at: string;
  updated_at: string;
}

export interface AdminPlatformFaqItem {
  id: string;
  category_id: string;
  question: string;
  answer: string;
  keywords: string[];
  sort_order: number;
  is_active: boolean;
  translations: PlatformFaqTranslations;
  created_at: string;
  updated_at: string;
}

const CATEGORIES_KEY = ['admin-platform-faq-categories'] as const;
const ITEMS_KEY = ['admin-platform-faq-items'] as const;

export function useAdminPlatformFaqCategories() {
  return useQuery({
    queryKey: CATEGORIES_KEY,
    queryFn: async (): Promise<AdminPlatformFaqCategory[]> => {
      const { data, error } = await supabase
        .from('platform_faq_categories')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as AdminPlatformFaqCategory[];
    },
  });
}

export function useAdminPlatformFaqItems(categoryId?: string) {
  return useQuery({
    queryKey: [...ITEMS_KEY, categoryId ?? 'all'],
    queryFn: async (): Promise<AdminPlatformFaqItem[]> => {
      let query = supabase
        .from('platform_faq_items')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as AdminPlatformFaqItem[];
    },
  });
}

export type CategoryInput = {
  slug: string;
  title: string;
  description?: string | null;
  audience: PlatformFaqAudience;
  sort_order: number;
  is_active: boolean;
  translations?: PlatformFaqTranslations;
};

export type ItemInput = {
  category_id: string;
  question: string;
  answer: string;
  keywords: string[];
  sort_order: number;
  is_active: boolean;
  translations?: PlatformFaqTranslations;
};

function invalidateFaq(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY });
  void queryClient.invalidateQueries({ queryKey: ITEMS_KEY });
  void queryClient.invalidateQueries({ queryKey: ['public-platform-faq'] });
}

export function useUpsertPlatformFaqCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CategoryInput & { id?: string }) => {
      const { id, ...row } = payload;
      if (id) {
        const { data, error } = await supabase
          .from('platform_faq_categories')
          .update(row)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase
        .from('platform_faq_categories')
        .insert(row)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => invalidateFaq(queryClient),
  });
}

export function useUpsertPlatformFaqItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ItemInput & { id?: string }) => {
      const { id, ...row } = payload;
      if (id) {
        const { data, error } = await supabase
          .from('platform_faq_items')
          .update(row)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase
        .from('platform_faq_items')
        .insert(row)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => invalidateFaq(queryClient),
  });
}

export function useDeletePlatformFaqCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('platform_faq_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => invalidateFaq(queryClient),
  });
}

export function useDeletePlatformFaqItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('platform_faq_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => invalidateFaq(queryClient),
  });
}
