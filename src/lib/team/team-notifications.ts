/**
 * Team Notifications Service
 * Date: 2 Février 2025
 * 
 * Service pour gérer les notifications liées à l'équipe (invitations, tâches)
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { sendUnifiedNotification } from '@/lib/notifications/unified-notifications';
import { createNotification } from '@/lib/notifications/helpers';

// =====================================================
// TYPES
// =====================================================

export interface TeamInvitationNotificationData {
  storeId: string;
  storeName: string;
  inviterEmail: string;
  inviterName?: string;
  memberEmail: string;
  memberName?: string;
  role: string;
  invitationToken: string;
  message?: string;
}

export interface TaskNotificationData {
  taskId: string;
  taskTitle: string;
  storeId: string;
  storeName: string;
  assignedTo: string[];
  createdBy: string;
  createdByName?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
}

// =====================================================
// NOTIFICATIONS D'INVITATION
// =====================================================

/**
 * Envoyer une notification d'invitation à rejoindre une équipe
 */
export async function sendTeamInvitationNotification(
  data: TeamInvitationNotificationData
): Promise<{ success: boolean; error?: string }> {
  try {
    // Récupérer l'utilisateur invité
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('email', data.memberEmail)
      .single();

    if (userError || !userData) {
      logger.warn('User not found for invitation', { email: data.memberEmail });
      // L'utilisateur n'existe pas encore, on ne peut pas envoyer de notification in-app
      // Mais on peut quand même envoyer un email
    }

    const userId = userData?.user_id;

    // Construire l'URL d'acceptation
    const acceptUrl = `${window.location.origin}/dashboard/store/team?invitation=${data.invitationToken}`;

    // Notification in-app (si l'utilisateur existe)
    if (userId) {
      await createNotification({
        user_id: userId,
        type: 'team_invitation',
        title: `Invitation à rejoindre ${data.storeName}`,
        message: `${data.inviterName || data.inviterEmail} vous a invité à rejoindre l'équipe en tant que ${data.role}`,
        metadata: {
          store_id: data.storeId,
          store_name: data.storeName,
          role: data.role,
          invitation_token: data.invitationToken,
          inviter_email: data.inviterEmail,
        },
        action_url: acceptUrl,
        action_label: 'Voir l\'invitation',
        priority: 'high',
      });
    }

    // Email d'invitation
    try {
      // Utiliser la fonction Supabase Edge Function pour envoyer l'email
      const { error: emailError } = await supabase.functions.invoke('send-email', {
        body: {
          to: data.memberEmail,
          subject: `Invitation à rejoindre l'équipe ${data.storeName}`,
          template: 'team-invitation',
          data: {
            storeName: data.storeName,
            inviterName: data.inviterName || data.inviterEmail,
            role: data.role,
            message: data.message || '',
            acceptUrl: acceptUrl,
            invitationToken: data.invitationToken,
          },
        },
      });

      if (emailError) {
        logger.error('Error sending invitation email', { error: emailError });
      }
    } catch (emailErr) {
      logger.warn('Email service not available', { error: emailErr });
    }

    return { success: true };
  } catch (error: any) {
    logger.error('Error sending team invitation notification', { error, data });
    return { success: false, error: error.message };
  }
}

// =====================================================
// NOTIFICATIONS DE TÂCHES
// =====================================================

/**
 * Envoyer une notification pour une nouvelle tâche assignée
 */
export async function sendTaskAssignedNotification(
  data: TaskNotificationData
): Promise<{ success: boolean; error?: string }> {
  try {
    const notifications = [];

    // Créer une notification pour chaque membre assigné
    for (const userId of data.assignedTo) {
      const priorityMap = {
        low: 'normal',
        medium: 'normal',
        high: 'high',
        urgent: 'high',
      } as const;

      const dueDateText = data.dueDate
        ? ` (Échéance: ${new Date(data.dueDate).toLocaleDateString('fr-FR')})`
        : '';

      notifications.push(
        createNotification({
          user_id: userId,
          type: 'task_assigned',
          title: `Nouvelle tâche assignée: ${data.taskTitle}`,
          message: `${data.createdByName || 'Un membre'} vous a assigné une tâche dans ${data.storeName}${dueDateText}`,
          metadata: {
            task_id: data.taskId,
            task_title: data.taskTitle,
            store_id: data.storeId,
            store_name: data.storeName,
            priority: data.priority,
            due_date: data.dueDate,
            created_by: data.createdBy,
          },
          action_url: `/dashboard/tasks?task=${data.taskId}`,
          action_label: 'Voir la tâche',
          priority: priorityMap[data.priority],
        })
      );
    }

    await Promise.all(notifications);

    return { success: true };
  } catch (error: any) {
    logger.error('Error sending task assigned notification', { error, data });
    return { success: false, error: error.message };
  }
}

/**
 * Envoyer une notification pour une mise à jour de tâche
 */
export async function sendTaskUpdateNotification(
  taskId: string,
  taskTitle: string,
  storeId: string,
  storeName: string,
  assignedTo: string[],
  updateType: 'status_changed' | 'priority_changed' | 'due_date_changed' | 'comment_added',
  updateDetails?: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateMessages = {
      status_changed: 'Le statut de la tâche a été modifié',
      priority_changed: 'La priorité de la tâche a été modifiée',
      due_date_changed: 'La date d\'échéance de la tâche a été modifiée',
      comment_added: 'Un nouveau commentaire a été ajouté',
    };

    const notifications = assignedTo.map((userId) =>
      createNotification({
        user_id: userId,
        type: 'task_updated',
        title: `Tâche mise à jour: ${taskTitle}`,
        message: `${updateMessages[updateType]} dans ${storeName}`,
        metadata: {
          task_id: taskId,
          task_title: taskTitle,
          store_id: storeId,
          store_name: storeName,
          update_type: updateType,
          ...updateDetails,
        },
        action_url: `/dashboard/tasks?task=${taskId}`,
        action_label: 'Voir la tâche',
        priority: 'normal',
      })
    );

    await Promise.all(notifications);

    return { success: true };
  } catch (error: any) {
    logger.error('Error sending task update notification', { error, taskId });
    return { success: false, error: error.message };
  }
}

/**
 * Envoyer une notification pour une tâche en retard
 */
export async function sendTaskOverdueNotification(
  taskId: string,
  taskTitle: string,
  storeId: string,
  storeName: string,
  assignedTo: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const notifications = assignedTo.map((userId) =>
      createNotification({
        user_id: userId,
        type: 'task_overdue',
        title: `⚠️ Tâche en retard: ${taskTitle}`,
        message: `La tâche "${taskTitle}" dans ${storeName} est en retard`,
        metadata: {
          task_id: taskId,
          task_title: taskTitle,
          store_id: storeId,
          store_name: storeName,
        },
        action_url: `/dashboard/tasks?task=${taskId}`,
        action_label: 'Voir la tâche',
        priority: 'high',
      })
    );

    await Promise.all(notifications);

    return { success: true };
  } catch (error: any) {
    logger.error('Error sending task overdue notification', { error, taskId });
    return { success: false, error: error.message };
  }
}

