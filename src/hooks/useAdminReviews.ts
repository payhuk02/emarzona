/**
 * Hooks pour la modération admin des reviews
 * Date : 27 octobre 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import type { Review } from '@/types/review';

/**
 * Fetch all reviews for admin (avec filtres et pagination)
 */
export function useAdminReviews(filters?: {
  status?: 'pending' | 'approved' | 'flagged' | 'all';
  productType?: string;
  searchQuery?: string;
  page?: number;
  pageSize?: number;
}) {
  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  return useQuery({
    queryKey: ['admin-reviews', filters, page, pageSize],
    queryFn: async () => {
      let query = supabase
        .from('reviews')
        .select(`
          *,
          user:profiles(full_name, email),
          product:products(name, product_type)
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply status filter
      if (filters?.status === 'pending') {
        query = query.eq('is_approved', false).eq('is_flagged', false);
      } else if (filters?.status === 'approved') {
        query = query.eq('is_approved', true);
      } else if (filters?.status === 'flagged') {
        query = query.eq('is_flagged', true);
      }

      // Apply product type filter
      if (filters?.productType) {
        query = query.eq('product_type', filters.productType);
      }

      // Apply search query filter
      if (filters?.searchQuery) {
        query = query.or(`comment.ilike.%${filters.searchQuery}%,reviewer_name.ilike.%${filters.searchQuery}%`);
      }

      // Apply pagination
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;
      return { data: data as Review[], count: count || 0 };
    },
  });
}

/**
 * Approve reviews
 */
export function useApproveReviews() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (reviewIds: string[]) => {
      const { error } = await supabase
        .from('reviews')
        .update({ is_approved: true, is_flagged: false })
        .in('id', reviewIds);

      if (error) throw error;
    },
    onSuccess: (_, reviewIds) => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['product-reviews'] });
      toast({
        title: '✅ Avis approuvés',
        description: `${reviewIds.length} avis ont été approuvés avec succès.`,
      });
    },
    onError: (error, reviewIds) => {
      toast({
        title: '❌ Erreur',
        description: 'Impossible d\'approuver les avis.',
        variant: 'destructive',
      });
      logger.error('Error approving reviews', { error, reviewIds });
    },
  });
}

/**
 * Reject reviews
 */
export function useRejectReviews() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (reviewIds: string[]) => {
      const { error } = await supabase
        .from('reviews')
        .update({ is_approved: false })
        .in('id', reviewIds);

      if (error) throw error;
    },
    onSuccess: (_, reviewIds) => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast({
        title: '❌ Avis rejetés',
        description: `${reviewIds.length} avis ont été rejetés.`,
      });
    },
    onError: (error, reviewIds) => {
      toast({
        title: '❌ Erreur',
        description: 'Impossible de rejeter les avis.',
        variant: 'destructive',
      });
      logger.error('Error rejecting reviews', { error, reviewIds });
    },
  });
}

/**
 * Flag reviews
 */
export function useFlagReviews() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (reviewIds: string[]) => {
      const { error } = await supabase
        .from('reviews')
        .update({ is_flagged: true })
        .in('id', reviewIds);

      if (error) throw error;
    },
    onSuccess: (_, reviewIds) => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast({
        title: '🚩 Avis signalés',
        description: `${reviewIds.length} avis ont été signalés.`,
      });
    },
    onError: (error, reviewIds) => {
      toast({
        title: '❌ Erreur',
        description: 'Impossible de signaler les avis.',
        variant: 'destructive',
      });
      logger.error('Error flagging reviews', { error, reviewIds });
    },
  });
}

/**
 * Delete reviews
 */
export function useDeleteReviews() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (reviewIds: string[]) => {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .in('id', reviewIds);

      if (error) throw error;
    },
    onSuccess: (_, reviewIds) => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['product-reviews'] });
      toast({
        title: '🗑️ Avis supprimés',
        description: `${reviewIds.length} avis ont été supprimés.`,
      });
    },
    onError: (error, reviewIds) => {
      toast({
        title: '❌ Erreur',
        description: 'Impossible de supprimer les avis.',
        variant: 'destructive',
      });
      logger.error('Error deleting reviews', { error, reviewIds });
    },
  });
}

/**
 * Get review stats for admin dashboard
 */
export function useAdminReviewStats() {
  return useQuery({
    queryKey: ['admin-review-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_review_stats');

      if (error) {
        // Fallback: count manually if RPC doesn't exist
        const [pending, flagged, approved, rejected] = await Promise.all([
          supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('is_approved', false).eq('is_flagged', false),
          supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('is_flagged', true),
          supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('is_approved', true),
          supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('is_approved', false),
        ]);

        return {
          pending: pending.count || 0,
          flagged: flagged.count || 0,
          approved: approved.count || 0,
          rejected: rejected.count || 0,
        };
      }

      return data;
    },
  });
}

