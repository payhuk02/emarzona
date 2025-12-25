/**
 * Hooks pour la gestion des réactions de la communauté
 * Date: 31 Janvier 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CommunityReaction, ReactionType } from '@/types/community';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

// Fetch reactions for a post
export function useCommunityPostReactions(postId: string) {
  return useQuery({
    queryKey: ['community-post-reactions', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_reactions')
        .select(`
          *,
          member:community_members!member_id (
            id,
            first_name,
            last_name,
            profile_image_url
          )
        `)
        .eq('post_id', postId);

      if (error) {
        logger.error('Error fetching post reactions', { error });
        throw error;
      }

      return data as CommunityReaction[];
    },
    enabled: !!postId,
  });
}

// Fetch current user's reaction for a post
export function useCurrentUserPostReaction(postId: string) {
  return useQuery({
    queryKey: ['current-user-post-reaction', postId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: member } = await supabase
        .from('community_members')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!member) return null;

      const { data, error } = await supabase
        .from('community_reactions')
        .select('*')
        .eq('post_id', postId)
        .eq('member_id', member.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        logger.error('Error fetching user reaction', { error });
        throw error;
      }

      return data as CommunityReaction | null;
    },
    enabled: !!postId,
  });
}

// Toggle reaction (like/unlike)
export function useToggleReaction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ postId, reactionType }: { postId: string; reactionType: ReactionType }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: member } = await supabase
        .from('community_members')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .single();

      if (!member) {
        throw new Error('Vous devez être membre approuvé de la communauté pour réagir');
      }

      // Check if reaction already exists
      const { data: existingReaction } = await supabase
        .from('community_reactions')
        .select('*')
        .eq('post_id', postId)
        .eq('member_id', member.id)
        .eq('reaction_type', reactionType)
        .maybeSingle();

      if (existingReaction) {
        // Remove reaction
        const { error } = await supabase
          .from('community_reactions')
          .delete()
          .eq('id', existingReaction.id);

        if (error) {
          logger.error('Error removing reaction', { error });
          throw error;
        }

        return { action: 'removed' as const, reaction: null };
      } else {
        // Remove any existing reaction of different type
        await supabase
          .from('community_reactions')
          .delete()
          .eq('post_id', postId)
          .eq('member_id', member.id);

        // Add new reaction
        const { data, error } = await supabase
          .from('community_reactions')
          .insert({
            post_id: postId,
            member_id: member.id,
            reaction_type: reactionType,
          })
          .select()
          .single();

        if (error) {
          logger.error('Error adding reaction', { error });
          throw error;
        }

        return { action: 'added' as const, reaction: data as CommunityReaction };
      }
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['community-post-reactions', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['current-user-post-reaction', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['community-post', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
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

