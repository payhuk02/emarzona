/**
 * Hooks pour la gestion des commentaires de portfolios
 * Date: 28 Janvier 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

export interface PortfolioComment {
  id: string;
  portfolio_id: string;
  user_id?: string;
  parent_comment_id?: string;
  content: string;
  is_approved: boolean;
  is_pinned: boolean;
  is_edited: boolean;
  author_name?: string;
  author_email?: string;
  likes_count: number;
  replies_count: number;
  reported_count: number;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
  edited_at?: string;
  // Relations
  user?: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
    };
  };
  replies?: PortfolioComment[];
  is_liked?: boolean;
}

/**
 * Hook pour récupérer les commentaires d'un portfolio
 */
export const usePortfolioComments = (
  portfolioId: string | undefined,
  options?: {
    includeReplies?: boolean;
    sortBy?: 'newest' | 'oldest' | 'most_liked';
  }
) => {
  return useQuery({
    queryKey: ['portfolio-comments', portfolioId, options],
    queryFn: async () => {
      if (!portfolioId) return [];

      const { data: { user } } = await supabase.auth.getUser();

      // Récupérer les commentaires principaux (sans parent)
      let  query= supabase
        .from('portfolio_comments')
        .select(`
          *,
          user:user_id (
            id,
            email,
            user_metadata
          )
        `)
        .eq('portfolio_id', portfolioId)
        .is('parent_comment_id', null)
        .eq('is_approved', true)
        .eq('is_hidden', false);

      // Tri
      const sortBy = options?.sortBy || 'newest';
      if (sortBy === 'newest') {
        query = query.order('is_pinned', { ascending: false }).order('created_at', { ascending: false });
      } else if (sortBy === 'oldest') {
        query = query.order('is_pinned', { ascending: false }).order('created_at', { ascending: true });
      } else if (sortBy === 'most_liked') {
        query = query.order('is_pinned', { ascending: false }).order('likes_count', { ascending: false });
      }

      const { data: comments, error } = await query;

      if (error) {
        logger.error('Error fetching portfolio comments', { error, portfolioId });
        throw error;
      }

      // Récupérer les réponses si demandé
      if (options?.includeReplies && comments && comments.length > 0) {
        const commentIds = comments.map((c) => c.id);
        const { data: replies } = await supabase
          .from('portfolio_comments')
          .select(`
            *,
            user:user_id (
              id,
              email,
              user_metadata
            )
          `)
          .in('parent_comment_id', commentIds)
          .eq('is_approved', true)
          .eq('is_hidden', false)
          .order('created_at', { ascending: true });

        // Grouper les réponses par commentaire parent
        const commentsWithReplies = comments.map((comment) => ({
          ...comment,
          replies: replies?.filter((r) => r.parent_comment_id === comment.id) || [],
        }));

        // Vérifier les likes de l'utilisateur
        if (user) {
          const { data: userLikes } = await supabase
            .from('portfolio_comment_likes')
            .select('comment_id')
            .eq('user_id', user.id)
            .in('comment_id', [
              ...commentIds,
              ...(replies?.map((r) => r.id) || []),
            ]);

          const likedCommentIds = new Set(userLikes?.map((l) => l.comment_id) || []);

          return commentsWithReplies.map((comment) => ({
            ...comment,
            is_liked: likedCommentIds.has(comment.id),
            replies: comment.replies?.map((reply) => ({
              ...reply,
              is_liked: likedCommentIds.has(reply.id),
            })) || [],
          })) as PortfolioComment[];
        }

        return commentsWithReplies as PortfolioComment[];
      }

      // Vérifier les likes de l'utilisateur
      if (user && comments) {
        const commentIds = comments.map((c) => c.id);
        const { data: userLikes } = await supabase
          .from('portfolio_comment_likes')
          .select('comment_id')
          .eq('user_id', user.id)
          .in('comment_id', commentIds);

        const likedCommentIds = new Set(userLikes?.map((l) => l.comment_id) || []);

        return comments.map((comment) => ({
          ...comment,
          is_liked: likedCommentIds.has(comment.id),
        })) as PortfolioComment[];
      }

      return (comments || []) as PortfolioComment[];
    },
    enabled: !!portfolioId,
  });
};

/**
 * Hook pour créer un commentaire
 */
export const useCreateComment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      portfolio_id: string;
      content: string;
      parent_comment_id?: string;
      author_name?: string;
      author_email?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: comment, error } = await supabase
        .from('portfolio_comments')
        .insert({
          portfolio_id: data.portfolio_id,
          content: data.content,
          parent_comment_id: data.parent_comment_id || null,
          user_id: user?.id || null,
          author_name: data.author_name || null,
          author_email: data.author_email || null,
        })
        .select(`
          *,
          user:user_id (
            id,
            email,
            user_metadata
          )
        `)
        .single();

      if (error) {
        logger.error('Error creating comment', { error });
        throw error;
      }

      return comment as PortfolioComment;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-comments', data.portfolio_id] });
      
      toast({
        title: '✅ Commentaire publié',
        description: 'Votre commentaire a été publié avec succès.',
      });
    },
    onError: (error: any) => {
      toast({
        title: '❌ Erreur',
        description: error.message || 'Une erreur est survenue lors de la publication du commentaire.',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour liker/unliker un commentaire
 */
export const useToggleCommentLike = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ commentId, isLiked }: { commentId: string; isLiked: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Vous devez être connecté pour liker un commentaire');
      }

      if (isLiked) {
        // Retirer le like
        const { error } = await supabase
          .from('portfolio_comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Ajouter le like
        const { error } = await supabase
          .from('portfolio_comment_likes')
          .insert({
            comment_id: commentId,
            user_id: user.id,
          });

        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      // Invalider les commentaires pour mettre à jour les likes
      queryClient.invalidateQueries({ queryKey: ['portfolio-comments'] });
    },
    onError: (error: any) => {
      toast({
        title: '❌ Erreur',
        description: error.message || 'Une erreur est survenue.',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour signaler un commentaire
 */
export const useReportComment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      comment_id: string;
      reason: 'spam' | 'inappropriate' | 'harassment' | 'hate_speech' | 'false_information' | 'other';
      details?: string;
      reporter_email?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('portfolio_comment_reports')
        .insert({
          comment_id: data.comment_id,
          reason: data.reason,
          details: data.details || null,
          user_id: user?.id || null,
          reporter_email: data.reporter_email || null,
        });

      if (error) {
        logger.error('Error reporting comment', { error });
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: '✅ Commentaire signalé',
        description: 'Merci pour votre signalement. Nous allons examiner ce commentaire.',
      });
    },
    onError: (error: any) => {
      toast({
        title: '❌ Erreur',
        description: error.message || 'Une erreur est survenue lors du signalement.',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour modifier un commentaire
 */
export const useUpdateComment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ commentId, content }: { commentId: string; content: string }) => {
      const { data, error } = await supabase
        .from('portfolio_comments')
        .update({ content })
        .eq('id', commentId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating comment', { error });
        throw error;
      }

      return data as PortfolioComment;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-comments'] });
      
      toast({
        title: '✅ Commentaire modifié',
        description: 'Votre commentaire a été modifié avec succès.',
      });
    },
    onError: (error: any) => {
      toast({
        title: '❌ Erreur',
        description: error.message || 'Une erreur est survenue lors de la modification.',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour supprimer un commentaire
 */
export const useDeleteComment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from('portfolio_comments')
        .delete()
        .eq('id', commentId);

      if (error) {
        logger.error('Error deleting comment', { error });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-comments'] });
      
      toast({
        title: '✅ Commentaire supprimé',
        description: 'Votre commentaire a été supprimé.',
      });
    },
    onError: (error: any) => {
      toast({
        title: '❌ Erreur',
        description: error.message || 'Une erreur est survenue lors de la suppression.',
        variant: 'destructive',
      });
    },
  });
};







