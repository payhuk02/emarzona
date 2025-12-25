/**
 * Hooks pour la gestion des commentaires de la communauté
 * Date: 31 Janvier 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CommunityComment, CommunityCommentFormData } from '@/types/community';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

// Fetch comments for a post
export function useCommunityPostComments(postId: string) {
  return useQuery({
    queryKey: ['community-post-comments', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_comments')
        .select(`
          *,
          author:community_members!author_id (
            id,
            first_name,
            last_name,
            profile_image_url,
            profession,
            company
          )
        `)
        .eq('post_id', postId)
        .eq('status', 'published')
        .is('parent_comment_id', null)
        .order('created_at', { ascending: true });

      if (error) {
        logger.error('Error fetching post comments', { error });
        throw error;
      }

      // Fetch replies for each comment
      const commentsWithReplies = await Promise.all(
        (data || []).map(async (comment) => {
          const { data: replies } = await supabase
            .from('community_comments')
            .select(`
              *,
              author:community_members!author_id (
                id,
                first_name,
                last_name,
                profile_image_url,
                profession,
                company
              )
            `)
            .eq('parent_comment_id', comment.id)
            .eq('status', 'published')
            .order('created_at', { ascending: true });

          return {
            ...comment,
            replies: replies || [],
          } as CommunityComment;
        })
      );

      return commentsWithReplies;
    },
    enabled: !!postId,
  });
}

// Create comment
export function useCreateCommunityComment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ postId, formData }: { postId: string; formData: CommunityCommentFormData }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get current user's community member profile
      const { data: member } = await supabase
        .from('community_members')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .single();

      if (!member) {
        throw new Error('Vous devez être membre approuvé de la communauté pour commenter');
      }

      const { data, error } = await supabase
        .from('community_comments')
        .insert({
          post_id: postId,
          author_id: member.id,
          ...formData,
        })
        .select(`
          *,
          author:community_members!author_id (
            id,
            first_name,
            last_name,
            profile_image_url,
            profession,
            company
          )
        `)
        .single();

      if (error) {
        logger.error('Error creating comment', { error });
        throw error;
      }

      return data as CommunityComment;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['community-post-comments', data.post_id] });
      queryClient.invalidateQueries({ queryKey: ['community-post', data.post_id] });
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      toast({
        title: 'Commentaire publié',
        description: 'Votre commentaire a été publié avec succès.',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
}

// Update comment
export function useUpdateCommunityComment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ commentId, content }: { commentId: string; content: string }) => {
      const { data, error } = await supabase
        .from('community_comments')
        .update({ content })
        .eq('id', commentId)
        .select(`
          *,
          author:community_members!author_id (
            id,
            first_name,
            last_name,
            profile_image_url,
            profession,
            company
          )
        `)
        .single();

      if (error) {
        logger.error('Error updating comment', { error });
        throw error;
      }

      return data as CommunityComment;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['community-post-comments', data.post_id] });
      toast({
        title: 'Commentaire mis à jour',
        description: 'Votre commentaire a été mis à jour avec succès.',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
}

// Delete comment
export function useDeleteCommunityComment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (commentId: string) => {
      const { data: comment } = await supabase
        .from('community_comments')
        .select('post_id')
        .eq('id', commentId)
        .single();

      const { error } = await supabase
        .from('community_comments')
        .update({ status: 'deleted', deleted_at: new Date().toISOString() })
        .eq('id', commentId);

      if (error) {
        logger.error('Error deleting comment', { error });
        throw error;
      }

      return comment?.post_id;
    },
    onSuccess: (postId) => {
      if (postId) {
        queryClient.invalidateQueries({ queryKey: ['community-post-comments', postId] });
        queryClient.invalidateQueries({ queryKey: ['community-post', postId] });
      }
      toast({
        title: 'Commentaire supprimé',
        description: 'Le commentaire a été supprimé avec succès.',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
}

