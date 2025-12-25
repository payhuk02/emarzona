/**
 * Hooks pour la gestion des posts de la communauté
 * Date: 31 Janvier 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CommunityPost, CommunityPostFormData, CommunityPostsFilter } from '@/types/community';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

// Fetch all community posts with filters
export function useCommunityPosts(filter?: CommunityPostsFilter) {
  return useQuery({
    queryKey: ['community-posts', filter],
    queryFn: async () => {
      let query = supabase
        .from('community_posts')
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
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (filter?.status && filter.status.length > 0) {
        query = query.in('status', filter.status);
      }

      if (filter?.category) {
        query = query.eq('category', filter.category);
      }

      if (filter?.tags && filter.tags.length > 0) {
        query = query.contains('tags', filter.tags);
      }

      if (filter?.author_id) {
        query = query.eq('author_id', filter.author_id);
      }

      if (filter?.is_pinned !== undefined) {
        query = query.eq('is_pinned', filter.is_pinned);
      }

      if (filter?.is_featured !== undefined) {
        query = query.eq('is_featured', filter.is_featured);
      }

      if (filter?.search) {
        query = query.or(`title.ilike.%${filter.search}%,content.ilike.%${filter.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching community posts', { error });
        throw error;
      }

      return data as CommunityPost[];
    },
  });
}

// Fetch single community post with comments
export function useCommunityPost(postId: string) {
  return useQuery({
    queryKey: ['community-post', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_posts')
        .select(`
          *,
          author:community_members!author_id (*)
        `)
        .eq('id', postId)
        .single();

      if (error) {
        logger.error('Error fetching community post', { error });
        throw error;
      }

      // Increment views count
      await supabase.rpc('increment_post_views', { post_id: postId }).catch(() => {
        // Fallback if function doesn't exist
        supabase
          .from('community_posts')
          .update({ views_count: (data.views_count || 0) + 1 })
          .eq('id', postId);
      });

      return data as CommunityPost;
    },
    enabled: !!postId,
  });
}

// Create community post
export function useCreateCommunityPost() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (formData: CommunityPostFormData) => {
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
        throw new Error('Vous devez être membre approuvé de la communauté pour publier');
      }

      const { data, error } = await supabase
        .from('community_posts')
        .insert({
          author_id: member.id,
          ...formData,
          published_at: formData.status === 'published' ? new Date().toISOString() : null,
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
        logger.error('Error creating community post', { error });
        throw error;
      }

      return data as CommunityPost;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      toast({
        title: 'Post publié',
        description: 'Votre post a été publié avec succès.',
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

// Update community post
export function useUpdateCommunityPost() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ postId, formData }: { postId: string; formData: Partial<CommunityPostFormData> }) => {
      const { data, error } = await supabase
        .from('community_posts')
        .update({
          ...formData,
          published_at: formData.status === 'published' ? new Date().toISOString() : undefined,
        })
        .eq('id', postId)
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
        logger.error('Error updating community post', { error });
        throw error;
      }

      return data as CommunityPost;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      queryClient.invalidateQueries({ queryKey: ['community-post', data.id] });
      toast({
        title: 'Post mis à jour',
        description: 'Votre post a été mis à jour avec succès.',
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

// Delete community post
export function useDeleteCommunityPost() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from('community_posts')
        .update({ status: 'deleted', deleted_at: new Date().toISOString() })
        .eq('id', postId);

      if (error) {
        logger.error('Error deleting community post', { error });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      toast({
        title: 'Post supprimé',
        description: 'Le post a été supprimé avec succès.',
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

// Toggle post pin
export function useTogglePostPin() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ postId, isPinned }: { postId: string; isPinned: boolean }) => {
      const { data, error } = await supabase
        .from('community_posts')
        .update({ is_pinned: isPinned })
        .eq('id', postId)
        .select()
        .single();

      if (error) {
        logger.error('Error toggling post pin', { error });
        throw error;
      }

      return data as CommunityPost;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      toast({
        title: 'Post épinglé',
        description: 'Le statut d\'épinglage du post a été mis à jour.',
      });
    },
  });
}

// Toggle post featured
export function useTogglePostFeatured() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ postId, isFeatured }: { postId: string; isFeatured: boolean }) => {
      const { data, error } = await supabase
        .from('community_posts')
        .update({ is_featured: isFeatured })
        .eq('id', postId)
        .select()
        .single();

      if (error) {
        logger.error('Error toggling post featured', { error });
        throw error;
      }

      return data as CommunityPost;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      toast({
        title: 'Post mis en vedette',
        description: 'Le statut de mise en vedette du post a été mis à jour.',
      });
    },
  });
}

