/**
 * Notifications pour Messages de Commandes
 * Date: 2 Février 2025
 *
 * Système de notifications pour les messages entre clients et vendeurs concernant les commandes
 */

import { sendUnifiedNotification } from './unified-notifications';
import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';

export interface OrderMessageNotificationData {
  conversationId: string;
  messageId: string;
  senderId: string;
  senderType: 'customer' | 'store' | 'admin';
  recipientId: string;
  recipientType: 'customer' | 'store' | 'admin';
  orderId: string;
  storeId?: string;
  messagePreview?: string;
}

/**
 * Envoyer une notification quand un message de commande est reçu
 */
export async function sendOrderMessageNotification(
  data: OrderMessageNotificationData
): Promise<{ success: boolean; error?: string }> {
  try {
    // Récupérer les informations de la commande
    const { data: order } = await supabase
      .from('orders')
      .select('order_number, total_amount, currency, store_id')
      .eq('id', data.orderId)
      .single();

    if (!order) {
      throw new Error('Order not found');
    }

    // Récupérer les informations du store
    let storeName = '';
    if (order.store_id || data.storeId) {
      const { data: store } = await supabase
        .from('stores')
        .select('name')
        .eq('id', order.store_id || data.storeId)
        .single();
      storeName = store?.name || '';
    }

    // Déterminer le type de notification et le contenu
    const notificationType = 'order_message_received';
    let title: string;
    let message: string;

    if (data.recipientType === 'store') {
      // Notification pour le vendeur
      title = '💬 Nouveau message - Commande #' + order.order_number;
      message = `Vous avez reçu un nouveau message concernant la commande #${order.order_number}.`;

      if (data.messagePreview) {
        message += `\n\n"${data.messagePreview.substring(0, 100)}${data.messagePreview.length > 100 ? '...' : ''}"`;
      }
    } else {
      // Notification pour le client
      title = '💬 Nouvelle réponse - Commande #' + order.order_number;
      message = storeName
        ? `${storeName} vous a répondu concernant votre commande #${order.order_number}.`
        : `Le vendeur vous a répondu concernant votre commande #${order.order_number}.`;

      if (data.messagePreview) {
        message += `\n\n"${data.messagePreview.substring(0, 100)}${data.messagePreview.length > 100 ? '...' : ''}"`;
      }
    }

    // Envoyer la notification
    const result = await sendUnifiedNotification({
      user_id: data.recipientId,
      type: notificationType,
      title,
      message,
      priority: 'high',
      channels: ['in_app', 'email', 'push'],
      metadata: {
        conversation_id: data.conversationId,
        message_id: data.messageId,
        sender_id: data.senderId,
        sender_type: data.senderType,
        order_id: data.orderId,
        order_number: order.order_number,
        store_id: order.store_id || data.storeId,
        store_name: storeName,
      },
      action_url: `/orders/${data.orderId}/messages?conversation=${data.conversationId}`,
      action_label: 'Voir le message',
      order_id: data.orderId,
    });

    if (result.success) {
      logger.info('Order message notification sent', {
        conversationId: data.conversationId,
        recipientId: data.recipientId,
        orderId: data.orderId,
      });
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error sending order message notification', {
      error: errorMessage,
      data,
    });
    return { success: false, error: errorMessage };
  }
}
