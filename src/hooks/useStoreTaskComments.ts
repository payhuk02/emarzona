/**
 * Store Task Comments Hooks
 * Date: 2 Février 2025
 * 
 * Hooks pour gérer les commentaires sur les tâches
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { sendTaskUpdateNotification } from '@/lib/team/team-notifications';

// =====================================================
// TYPES
// =====================================================

export interface StoreTaskComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  attachments: Array<{
    url: string;
    name: string;
    size: number;
    type: string;
  }>;
  is_internal: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  user?: {
    id: string;
    email: string;
    user_metadata?: {
      display_name?: string;
      avatar_url?: string;
    };
  };
}

export interface StoreTaskCommentCreateData {
  content: string;
  attachments?: Array<{
    url: string;
    name: string;
    size: number;
    type: string;
  }>;
  is_internal?: boolean;
}

// =====================================================
// HOOK: useStoreTaskComments
// =====================================================

export const useStoreTaskComments = (taskId: string | null) => {
  return useQuery({
    queryKey: ['store-task-comments', taskId],
    queryFn: async () => {
      if (!taskId) {
        throw new Error('Task ID is required');
      }

      const { data, error } = await supabase
        .from('store_task_comments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) {
        logger.error('Error fetching task comments:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Récupérer les profils et emails des utilisateurs
      const userIds = [...new Set(data.map((c) => c.user_id))];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      const { data: emailsData } = await supabase.rpc('get_users_emails', {
        p_user_ids: userIds,
      });

      const emailMap = new Map<string, string>();
      if (emailsData) {
        emailsData.forEach((item: { user_id: string; email: string }) => {
          emailMap.set(item.user_id, item.email);
        });
      }

      const profileMap = new Map(
        profiles?.map((p) => [
          p.user_id,
          {
            id: p.user_id,
            email: emailMap.get(p.user_id) || '',
            user_metadata: {
              display_name: p.display_name,
              avatar_url: p.avatar_url,
            },
          },
        ]) || []
      );

      // Enrichir les commentaires avec les données utilisateur
      const commentsWithUsers = data.map((comment) => {
        const user = profileMap.get(comment.user_id);
        return {
          ...comment,
          user: user || {
            id: comment.user_id,
            email: emailMap.get(comment.user_id) || '',
            user_metadata: {},
          },
        };
      });

      return commentsWithUsers as StoreTaskComment[];
    },
    enabled: !!taskId,
    staleTime: 10000, // 10 secondes
  });
};

// =====================================================
// HOOK: useStoreTaskCommentCreate
// =====================================================

export const useStoreTaskCommentCreate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      taskId,
      commentData,
    }: {
      taskId: string;
      commentData: StoreTaskCommentCreateData;
    }) => {
      const { data: currentUser } = await supabase.auth.getUser();
      const userId = currentUser.data.user?.id;

      if (!userId) {
        throw new Error('Non authentifié');
      }

      const { data, error } = await supabase
        .from('store_task_comments')
        .insert({
          task_id: taskId,
          user_id: userId,
          content: commentData.content,
          attachments: commentData.attachments || [],
          is_internal: commentData.is_internal || false,
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating task comment:', error);
        throw error;
      }

      // Récupérer les informations de la tâche et de la boutique
      const { data: taskData } = await supabase
        .from('store_tasks')
        .select('title, store_id, assigned_to')
        .eq('id', taskId)
        .single();

      if (taskData) {
        const { data: storeData } = await supabase
          .from('stores')
          .select('name')
          .eq('id', taskData.store_id)
          .single();

        // Notifier les membres assignés qu'un commentaire a été ajouté
        if (taskData.assigned_to && taskData.assigned_to.length > 0) {
          await sendTaskUpdateNotification(
            taskId,
            taskData.title,
            taskData.store_id,
            storeData?.name || 'Boutique',
            taskData.assigned_to,
            'comment_added'
          ).catch((err) => {
            logger.warn('Error sending comment notification', { error: err });
          });
        }
      }

      return data as StoreTaskComment;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['store-task-comments', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['store-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['store-task'] });
    },
    onError: (error: Error) => {
      logger.error('Error creating task comment:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'ajouter le commentaire',
        variant: 'destructive',
      });
    },
  });
};

// =====================================================
// HOOK: useStoreTaskCommentUpdate
// =====================================================

export const useStoreTaskCommentUpdate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      commentId,
      content,
    }: {
      commentId: string;
      content: string;
    }) => {
      const { data, error } = await supabase
        .from('store_task_comments')
        .update({ content })
        .eq('id', commentId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating task comment:', error);
        throw error;
      }

      return data as StoreTaskComment;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['store-task-comments'] });
      toast({
        title: 'Commentaire mis à jour',
        description: 'Le commentaire a été modifié',
      });
    },
    onError: (error: Error) => {
      logger.error('Error updating task comment:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de mettre à jour le commentaire',
        variant: 'destructive',
      });
    },
  });
};

// =====================================================
// HOOK: useStoreTaskCommentDelete
// =====================================================

export const useStoreTaskCommentDelete = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.from('store_task_comments').delete().eq('id', commentId);

      if (error) {
        logger.error('Error deleting task comment:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-task-comments'] });
      queryClient.invalidateQueries({ queryKey: ['store-tasks'] });
      toast({
        title: 'Commentaire supprimé',
        description: 'Le commentaire a été supprimé',
      });
    },
    onError: (error: Error) => {
      logger.error('Error deleting task comment:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer le commentaire',
        variant: 'destructive',
      });
    },
  });
};

