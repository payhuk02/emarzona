/**
 * Store Tasks Hooks
 * Date: 2 Février 2025
 * 
 * Hooks pour gérer les tâches assignées aux membres d'équipe
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import {
  sendTaskAssignedNotification,
  sendTaskUpdateNotification,
} from '@/lib/team/team-notifications';

// =====================================================
// TYPES
// =====================================================

export interface StoreTask {
  id: string;
  store_id: string;
  created_by: string;
  assigned_to: string[];
  assigned_by: string | null;
  title: string;
  description: string | null;
  category: 'product' | 'order' | 'customer' | 'marketing' | 'inventory' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'review' | 'completed' | 'cancelled' | 'on_hold';
  due_date: string | null;
  started_at: string | null;
  completed_at: string | null;
  tags: string[];
  attachments: Array<{
    url: string;
    name: string;
    size: number;
    type: string;
  }>;
  related_product_id: string | null;
  related_order_id: string | null;
  related_customer_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  // Relations
  created_by_user?: {
    id: string;
    email: string;
    user_metadata?: {
      display_name?: string;
      avatar_url?: string;
    };
  };
  assigned_to_users?: Array<{
    id: string;
    email: string;
    user_metadata?: {
      display_name?: string;
      avatar_url?: string;
    };
  }>;
  related_product?: {
    id: string;
    name: string;
    slug: string;
  };
  related_order?: {
    id: string;
    order_number: string;
    total_amount: number;
  };
  related_customer?: {
    id: string;
    name: string;
    email: string;
  };
  comments_count?: number;
}

export interface StoreTaskCreateData {
  title: string;
  description?: string;
  category?: 'product' | 'order' | 'customer' | 'marketing' | 'inventory' | 'other';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string[];
  due_date?: string;
  tags?: string[];
  related_product_id?: string;
  related_order_id?: string;
  related_customer_id?: string;
  attachments?: Array<{
    url: string;
    name: string;
    size: number;
    type: string;
  }>;
}

export interface StoreTaskUpdateData {
  title?: string;
  description?: string;
  category?: 'product' | 'order' | 'customer' | 'marketing' | 'inventory' | 'other';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'pending' | 'in_progress' | 'review' | 'completed' | 'cancelled' | 'on_hold';
  assigned_to?: string[];
  due_date?: string | null;
  tags?: string[];
  related_product_id?: string | null;
  related_order_id?: string | null;
  related_customer_id?: string | null;
  attachments?: Array<{
    url: string;
    name: string;
    size: number;
    type: string;
  }>;
}

export interface TaskFilters {
  status?: 'pending' | 'in_progress' | 'review' | 'completed' | 'cancelled' | 'on_hold';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category?: 'product' | 'order' | 'customer' | 'marketing' | 'inventory' | 'other';
  assigned_to?: string;
  created_by?: string;
  tags?: string[];
  search?: string;
}

// =====================================================
// HOOK: useStoreTasks
// =====================================================

export const useStoreTasks = (storeId: string | null, filters?: TaskFilters) => {
  return useQuery({
    queryKey: ['store-tasks', storeId, filters],
    queryFn: async () => {
      if (!storeId) {
        throw new Error('Store ID is required');
      }

      let query = supabase.from('store_tasks').select('*').eq('store_id', storeId);

      // Appliquer les filtres
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.assigned_to) {
        query = query.contains('assigned_to', [filters.assigned_to]);
      }
      if (filters?.created_by) {
        query = query.eq('created_by', filters.created_by);
      }
      if (filters?.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching store tasks:', error);
        throw error;
      }

      const tasks = (data || []) as StoreTask[];

      // Récupérer les utilisateurs (créateurs et assignés)
      const userIds = new Set<string>();
      tasks.forEach((task) => {
        userIds.add(task.created_by);
        task.assigned_to?.forEach((id) => userIds.add(id));
      });

      if (userIds.size > 0) {
        // Récupérer les profils
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', Array.from(userIds));

        // Récupérer les emails
        const { data: emailsData } = await supabase.rpc('get_users_emails', {
          p_user_ids: Array.from(userIds),
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

        // Enrichir les tâches avec les données utilisateur
        tasks.forEach((task) => {
          // Créateur
          const creator = profileMap.get(task.created_by);
          if (creator) {
            task.created_by_user = creator;
          }

          // Assignés
          if (task.assigned_to && task.assigned_to.length > 0) {
            task.assigned_to_users = task.assigned_to
              .map((id) => {
                const user = profileMap.get(id);
                if (user) return user;
                // Si pas de profil, créer un objet minimal avec l'email
                return {
                  id,
                  email: emailMap.get(id) || '',
                  user_metadata: {},
                };
              })
              .filter(Boolean) as StoreTask['assigned_to_users'];
          }
        });
      }

      // Compter les commentaires pour chaque tâche
      const taskIds = tasks.map((t) => t.id);
      if (taskIds.length > 0) {
        const { data: commentsCount } = await supabase
          .from('store_task_comments')
          .select('task_id')
          .in('task_id', taskIds);

        const countMap = new Map<string, number>();
        commentsCount?.forEach((c) => {
          countMap.set(c.task_id, (countMap.get(c.task_id) || 0) + 1);
        });

        tasks.forEach((task) => {
          task.comments_count = countMap.get(task.id) || 0;
        });
      }

      return tasks;
    },
    enabled: !!storeId,
    staleTime: 30000, // 30 secondes
  });
};

// =====================================================
// HOOK: useStoreTask
// =====================================================

export const useStoreTask = (storeId: string | null, taskId: string | null) => {
  return useQuery({
    queryKey: ['store-task', storeId, taskId],
    queryFn: async () => {
      if (!storeId || !taskId) {
        throw new Error('Store ID and Task ID are required');
      }

      const { data, error } = await supabase
        .from('store_tasks')
        .select('*')
        .eq('id', taskId)
        .eq('store_id', storeId)
        .single();

      if (error) {
        logger.error('Error fetching store task:', error);
        throw error;
      }

      const task = data as StoreTask;

      // Récupérer les utilisateurs (créateur et assignés)
      const userIds = new Set<string>([task.created_by]);
      if (task.assigned_to) {
        task.assigned_to.forEach((id) => userIds.add(id));
      }

      if (userIds.size > 0) {
        // Récupérer les profils
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', Array.from(userIds));

        // Récupérer les emails
        const { data: emailsData } = await supabase.rpc('get_users_emails', {
          p_user_ids: Array.from(userIds),
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

        // Créateur
        const creator = profileMap.get(task.created_by);
        if (creator) {
          task.created_by_user = creator;
        }

        // Assignés
        if (task.assigned_to && task.assigned_to.length > 0) {
          task.assigned_to_users = task.assigned_to
            .map((id) => {
              const user = profileMap.get(id);
              if (user) return user;
              return {
                id,
                email: emailMap.get(id) || '',
                user_metadata: {},
              };
            })
            .filter(Boolean) as StoreTask['assigned_to_users'];
        }
      }

      return task;
    },
    enabled: !!storeId && !!taskId,
  });
};

// =====================================================
// HOOK: useStoreTaskCreate
// =====================================================

export const useStoreTaskCreate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ storeId, taskData }: { storeId: string; taskData: StoreTaskCreateData }) => {
      const { data: currentUser } = await supabase.auth.getUser();
      const userId = currentUser.data.user?.id;

      if (!userId) {
        throw new Error('Non authentifié');
      }

      const { data, error } = await supabase
        .from('store_tasks')
        .insert({
          store_id: storeId,
          created_by: userId,
          assigned_to: taskData.assigned_to || [],
          assigned_by: taskData.assigned_to && taskData.assigned_to.length > 0 ? userId : null,
          title: taskData.title,
          description: taskData.description || null,
          category: taskData.category || 'other',
          priority: taskData.priority || 'medium',
          status: 'pending',
          due_date: taskData.due_date || null,
          tags: taskData.tags || [],
          attachments: taskData.attachments || [],
          related_product_id: taskData.related_product_id || null,
          related_order_id: taskData.related_order_id || null,
          related_customer_id: taskData.related_customer_id || null,
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating store task:', error);
        throw error;
      }

      // Récupérer les informations de la boutique
      const { data: storeData } = await supabase
        .from('stores')
        .select('name')
        .eq('id', storeId)
        .single();

      const { data: creatorData } = await supabase.auth.getUser();

      // Envoyer des notifications aux membres assignés
      if (taskData.assigned_to && taskData.assigned_to.length > 0) {
        await sendTaskAssignedNotification({
          taskId: data.id,
          taskTitle: taskData.title,
          storeId,
          storeName: storeData?.name || 'Boutique',
          assignedTo: taskData.assigned_to,
          createdBy: userId,
          createdByName: creatorData.user?.user_metadata?.display_name,
          priority: taskData.priority || 'medium',
          dueDate: taskData.due_date,
        }).catch((err) => {
          logger.warn('Error sending task assigned notification', { error: err });
        });
      }

      return data as StoreTask;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['store-tasks', variables.storeId] });
      toast({
        title: 'Tâche créée',
        description: 'La tâche a été créée avec succès',
      });
    },
    onError: (error: Error) => {
      logger.error('Error creating store task:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer la tâche',
        variant: 'destructive',
      });
    },
  });
};

// =====================================================
// HOOK: useStoreTaskUpdate
// =====================================================

export const useStoreTaskUpdate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      storeId,
      taskId,
      updateData,
    }: {
      storeId: string;
      taskId: string;
      updateData: StoreTaskUpdateData;
    }) => {
      const { data: currentUser } = await supabase.auth.getUser();
      const userId = currentUser.data.user?.id;

      if (!userId) {
        throw new Error('Non authentifié');
      }

      // Gérer les changements de statut
      const updatePayload: any = { ...updateData };

      if (updateData.status === 'in_progress' && !updateData.started_at) {
        updatePayload.started_at = new Date().toISOString();
      }

      if (updateData.status === 'completed') {
        updatePayload.completed_at = new Date().toISOString();
        if (!updatePayload.started_at) {
          updatePayload.started_at = new Date().toISOString();
        }
      }

      if (updateData.assigned_to) {
        updatePayload.assigned_by = userId;
      }

      const { data, error } = await supabase
        .from('store_tasks')
        .update(updatePayload)
        .eq('id', taskId)
        .eq('store_id', storeId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating store task:', error);
        throw error;
      }

      // Récupérer les informations de la boutique
      const { data: storeData } = await supabase
        .from('stores')
        .select('name')
        .eq('id', storeId)
        .single();

      // Envoyer des notifications si le statut change ou si de nouveaux membres sont assignés
      if (updateData.status && updateData.status !== data.status) {
        await sendTaskUpdateNotification(
          taskId,
          data.title,
          storeId,
          storeData?.name || 'Boutique',
          updateData.assigned_to || data.assigned_to,
          'status_changed',
          { old_status: data.status, new_status: updateData.status }
        ).catch((err) => {
          logger.warn('Error sending task update notification', { error: err });
        });
      }

      if (updateData.priority && updateData.priority !== data.priority) {
        await sendTaskUpdateNotification(
          taskId,
          data.title,
          storeId,
          storeData?.name || 'Boutique',
          updateData.assigned_to || data.assigned_to,
          'priority_changed',
          { old_priority: data.priority, new_priority: updateData.priority }
        ).catch((err) => {
          logger.warn('Error sending task update notification', { error: err });
        });
      }

      if (updateData.assigned_to && JSON.stringify(updateData.assigned_to) !== JSON.stringify(data.assigned_to)) {
        // Notifier les nouveaux membres assignés
        const newAssignees = updateData.assigned_to.filter(
          (id) => !data.assigned_to.includes(id)
        );
        if (newAssignees.length > 0) {
          await sendTaskAssignedNotification({
            taskId,
            taskTitle: data.title,
            storeId,
            storeName: storeData?.name || 'Boutique',
            assignedTo: newAssignees,
            createdBy: userId,
            priority: updateData.priority || data.priority,
            dueDate: updateData.due_date || data.due_date || undefined,
          }).catch((err) => {
            logger.warn('Error sending task assigned notification', { error: err });
          });
        }
      }

      return data as StoreTask;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['store-tasks', variables.storeId] });
      queryClient.invalidateQueries({ queryKey: ['store-task', variables.storeId, variables.taskId] });
      toast({
        title: 'Tâche mise à jour',
        description: 'Les modifications ont été enregistrées',
      });
    },
    onError: (error: Error) => {
      logger.error('Error updating store task:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de mettre à jour la tâche',
        variant: 'destructive',
      });
    },
  });
};

// =====================================================
// HOOK: useStoreTaskDelete
// =====================================================

export const useStoreTaskDelete = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ storeId, taskId }: { storeId: string; taskId: string }) => {
      const { error } = await supabase.from('store_tasks').delete().eq('id', taskId).eq('store_id', storeId);

      if (error) {
        logger.error('Error deleting store task:', error);
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['store-tasks', variables.storeId] });
      toast({
        title: 'Tâche supprimée',
        description: 'La tâche a été supprimée avec succès',
      });
    },
    onError: (error: Error) => {
      logger.error('Error deleting store task:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer la tâche',
        variant: 'destructive',
      });
    },
  });
};

// =====================================================
// HOOK: useMyStoreTasks
// =====================================================

export const useMyStoreTasks = (storeId: string | null) => {
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });

  return useStoreTasks(storeId, {
    assigned_to: currentUser?.id,
  });
};

