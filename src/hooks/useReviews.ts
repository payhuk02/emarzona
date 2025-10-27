/**
 * Hooks pour le système de Reviews & Ratings
 * Date : 27 octobre 2025
 * Universel : Digital, Physical, Service, Course
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import type {
  Review,
  ReviewReply,
  ReviewVote,
  ReviewMedia,
  ProductReviewStats,
  CreateReviewPayload,
  UpdateReviewPayload,
  ReviewFilters,
} from '@/types/review';

// ============================================================
// PRODUCT REVIEWS
// ============================================================

/**
 * Hook pour récupérer les reviews d'un produit
 */
export const useProductReviews = (
  productId?: string,
  filters?: ReviewFilters
) => {
  return useQuery({
    queryKey: ['product-reviews', productId, filters],
    queryFn: async (): Promise<Review[]> => {
      if (!productId) return [];

      let query = supabase
        .from('reviews')
        .select(`
          *,
          replies:review_replies(
            *,
            user:profiles(id, full_name, avatar_url)
          ),
          media:review_media(*),
          user_vote:review_votes!review_votes_review_id_fkey(*)
        `)
        .eq('product_id', productId)
        .eq('is_approved', true);

      // Filtres
      if (filters?.rating) {
        query = query.eq('rating', filters.rating);
      }
      if (filters?.min_rating) {
        query = query.gte('rating', filters.min_rating);
      }
      if (filters?.verified_only) {
        query = query.eq('verified_purchase', true);
      }
      if (filters?.has_media) {
        query = query.not('media', 'is', null);
      }

      // Tri
      switch (filters?.sort_by) {
        case 'helpful':
          query = query.order('helpful_count', { ascending: false });
          break;
        case 'rating_high':
          query = query.order('rating', { ascending: false });
          break;
        case 'rating_low':
          query = query.order('rating', { ascending: true });
          break;
        case 'recent':
        default:
          query = query.order('created_at', { ascending: false });
      }

      // Pagination
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      if (filters?.offset) {
        query = query.range(
          filters.offset,
          filters.offset + (filters.limit || 10) - 1
        );
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching product reviews:', error);
        throw error;
      }

      return data as Review[];
    },
    enabled: !!productId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook pour récupérer les statistiques de reviews d'un produit
 */
export const useProductReviewStats = (productId?: string) => {
  return useQuery({
    queryKey: ['product-review-stats', productId],
    queryFn: async (): Promise<ProductReviewStats | null> => {
      if (!productId) return null;

      const { data, error } = await supabase
        .from('product_review_stats')
        .select('*')
        .eq('product_id', productId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching product review stats:', error);
        throw error;
      }

      return data as ProductReviewStats | null;
    },
    enabled: !!productId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

/**
 * Hook pour récupérer une review spécifique
 */
export const useReview = (reviewId?: string) => {
  return useQuery({
    queryKey: ['review', reviewId],
    queryFn: async (): Promise<Review | null> => {
      if (!reviewId) return null;

        const { data, error } = await supabase
          .from('reviews')
          .select(`
            *,
          replies:review_replies(
            *,
            user:profiles(id, full_name, avatar_url)
          ),
          media:review_media(*)
        `)
        .eq('id', reviewId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching review:', error);
        throw error;
      }

      return data as Review | null;
    },
    enabled: !!reviewId,
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * Hook pour vérifier si l'utilisateur peut laisser un avis
 */
export const useCanReview = (productId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['can-review', productId, user?.id],
    queryFn: async (): Promise<{
      can_review: boolean;
      reason?: string;
      existing_review_id?: string;
    }> => {
      if (!productId || !user) {
        return { can_review: false, reason: 'Not authenticated' };
      }

      // Vérifier si l'utilisateur a déjà laissé un avis
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('product_id', productId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingReview) {
        return {
          can_review: false,
          reason: 'Already reviewed',
          existing_review_id: existingReview.id,
        };
      }

      // Vérifier si l'utilisateur a acheté le produit
      const { data: order } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .or(`product_id.eq.${productId}`)
        .limit(1)
        .maybeSingle();

      if (!order) {
        return { can_review: false, reason: 'No purchase found' };
      }

      return { can_review: true };
    },
    enabled: !!productId && !!user,
    staleTime: 1000 * 60 * 5,
  });
};

// ============================================================
// CREATE/UPDATE/DELETE REVIEW
// ============================================================

/**
 * Hook pour créer une review
 */
export const useCreateReview = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, profile } = useAuth();

  return useMutation({
    mutationFn: async (payload: CreateReviewPayload) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('reviews')
        .insert({
          product_id: payload.product_id,
          user_id: user.id,
          order_id: payload.order_id,
          rating: payload.rating,
          title: payload.title,
          content: payload.content,
          product_type: payload.product_type,
          quality_rating: payload.quality_rating,
          value_rating: payload.value_rating,
          service_rating: payload.service_rating,
          delivery_rating: payload.delivery_rating,
          course_content_rating: payload.course_content_rating,
          instructor_rating: payload.instructor_rating,
          verified_purchase: !!payload.order_id,
          reviewer_name: profile?.full_name || profile?.username,
          reviewer_avatar: profile?.avatar_url,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating review:', error);
        throw error;
      }

      // Upload media si présent
      if (payload.media_files && payload.media_files.length > 0) {
        for (let i = 0; i < payload.media_files.length; i++) {
          const file = payload.media_files[i];
          const fileExt = file.name.split('.').pop();
          const fileName = `${data.id}/${Date.now()}.${fileExt}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('review-media')
            .upload(fileName, file);

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('review-media')
              .getPublicUrl(fileName);

            await supabase.from('review_media').insert({
              review_id: data.id,
              media_type: file.type.startsWith('video/') ? 'video' : 'image',
              media_url: publicUrl,
              mime_type: file.type,
              display_order: i,
            });
          }
        }
      }

      return data as Review;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['product-reviews', variables.product_id] });
      queryClient.invalidateQueries({ queryKey: ['product-review-stats', variables.product_id] });
      queryClient.invalidateQueries({ queryKey: ['can-review', variables.product_id] });
      toast({
        title: 'Avis publié',
        description: 'Votre avis a été publié avec succès.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour mettre à jour une review
 */
export const useUpdateReview = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ reviewId, payload }: { reviewId: string; payload: UpdateReviewPayload }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('reviews')
        .update(payload)
        .eq('id', reviewId)
        .eq('user_id', user.id) // Sécurité
        .select()
        .single();

      if (error) {
        console.error('Error updating review:', error);
        throw error;
      }

      return data as Review;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['review', data.id] });
      queryClient.invalidateQueries({ queryKey: ['product-reviews', data.product_id] });
      queryClient.invalidateQueries({ queryKey: ['product-review-stats', data.product_id] });
      toast({
        title: 'Avis modifié',
        description: 'Votre avis a été modifié avec succès.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour supprimer une review
 */
export const useDeleteReview = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (reviewId: string) => {
      if (!user) throw new Error('User not authenticated');

      // Récupérer review pour avoir product_id
      const { data: review } = await supabase
        .from('reviews')
        .select('product_id')
        .eq('id', reviewId)
        .single();

      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId)
        .eq('user_id', user.id); // Sécurité

      if (error) {
        console.error('Error deleting review:', error);
        throw error;
      }

      return { reviewId, productId: review?.product_id };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['product-reviews', result.productId] });
      queryClient.invalidateQueries({ queryKey: ['product-review-stats', result.productId] });
      queryClient.invalidateQueries({ queryKey: ['can-review', result.productId] });
      toast({
        title: 'Avis supprimé',
        description: 'Votre avis a été supprimé.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// ============================================================
// REVIEW VOTES
// ============================================================

/**
 * Hook pour voter sur une review
 */
export const useVoteReview = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ reviewId, isHelpful }: { reviewId: string; isHelpful: boolean }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('review_votes')
        .upsert(
          {
            review_id: reviewId,
            user_id: user.id,
            is_helpful: isHelpful,
          },
          { onConflict: ['review_id', 'user_id'] }
        )
        .select()
        .single();

      if (error) {
        console.error('Error voting review:', error);
        throw error;
      }

      return data as ReviewVote;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['review', variables.reviewId] });
      queryClient.invalidateQueries({ queryKey: ['product-reviews'] });
    },
  });
};

// ============================================================
// REVIEW REPLIES
// ============================================================

/**
 * Hook pour répondre à une review
 */
export const useReplyToReview = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, profile } = useAuth();

  return useMutation({
    mutationFn: async ({ reviewId, content, replyType = 'customer' }: {
      reviewId: string;
      content: string;
      replyType?: 'seller' | 'admin' | 'customer';
    }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('review_replies')
        .insert({
          review_id: reviewId,
          user_id: user.id,
          content,
          reply_type: replyType,
          is_official: replyType === 'seller' || replyType === 'admin',
        })
        .select()
        .single();

      if (error) {
        console.error('Error replying to review:', error);
        throw error;
      }

      return data as ReviewReply;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['review', variables.reviewId] });
      queryClient.invalidateQueries({ queryKey: ['product-reviews'] });
      toast({
        title: 'Réponse publiée',
        description: 'Votre réponse a été publiée.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// ============================================================
// USER REVIEWS
// ============================================================

/**
 * Hook pour récupérer les reviews d'un utilisateur
 */
export const useUserReviews = (userId?: string, limit: number = 50) => {
  return useQuery({
    queryKey: ['user-reviews', userId, limit],
    queryFn: async (): Promise<Review[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          media:review_media(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching user reviews:', error);
        throw error;
      }

      return data as Review[];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
};
