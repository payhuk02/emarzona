/**
 * Notifications pour Messages Vendeur
 * Date: 2 Février 2025
 *
 * Système de notifications pour les messages entre clients et vendeurs
 */

import { sendUnifiedNotification } from './unified-notifications';
import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';

export interface VendorMessageNotificationData {
  conversationId: string;
  messageId: string;
  senderId: string;
  senderType: 'customer' | 'store' | 'admin';
  recipientId: string;
  recipientType: 'customer' | 'store' | 'admin';
  storeId?: string;
  productId?: string;
  messagePreview?: string;
}

/**
 * Envoyer une notification quand un message vendeur est reçu
 */
export async function sendVendorMessageNotification(
  data: VendorMessageNotificationData
): Promise<{ success: boolean; error?: string }> {
  try {
    // Récupérer les informations de la conversation
    const { data: conversation } = await supabase
      .from('vendor_conversations')
      .select('store_id, product_id, subject, store_user_id, customer_user_id')
      .eq('id', data.conversationId)
      .single();

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Récupérer les informations du produit si disponible
    let  productName= '';
    if (conversation.product_id) {
      const { data: product } = await supabase
        .from('products')
        .select('name')
        .eq('id', conversation.product_id)
        .single();
      productName = product?.name || '';
    }

    // Récupérer les informations du store
    let  storeName= '';
    if (conversation.store_id) {
      const { data: store } = await supabase
        .from('stores')
        .select('name')
        .eq('id', conversation.store_id)
        .single();
      storeName = store?.name || '';
    }

    // Déterminer le type de notification et le contenu
    let  notificationType: 'vendor_message_received' | 'customer_message_received';
    let  title: string;
    let  message: string;

    if (data.recipientType === 'store') {
      // Notification pour le vendeur
      notificationType = 'vendor_message_received';
      title = '💬 Nouveau message client';
      message = productName
        ? `Vous avez reçu un nouveau message concernant "${productName}".`
        : `Vous avez reçu un nouveau message de ${data.senderType === 'customer' ? 'un client' : "l'administrateur"}.`;

      if (data.messagePreview) {
        message += `\n\n"${data.messagePreview.substring(0, 100)}${data.messagePreview.length > 100 ? '...' : ''}"`;
      }
    } else {
      // Notification pour le client
      notificationType = 'customer_message_received';
      title = '💬 Nouvelle réponse du vendeur';
      message = storeName ? `${storeName} vous a répondu.` : 'Le vendeur vous a répondu.';

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
        store_id: conversation.store_id,
        product_id: conversation.product_id,
        store_name: storeName,
        product_name: productName,
      },
      action_url: `/vendor/messaging?conversation=${data.conversationId}`,
      action_label: 'Voir le message',
    });

    if (result.success) {
      logger.info('Vendor message notification sent', {
        conversationId: data.conversationId,
        recipientId: data.recipientId,
        type: notificationType,
      });
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error sending vendor message notification', {
      error: errorMessage,
      data,
    });
    return { success: false, error: errorMessage };
  }
}

/**
 * Envoyer une notification quand une nouvelle conversation est démarrée
 */
export async function sendVendorConversationStartedNotification(
  conversationId: string,
  customerId: string,
  storeId: string,
  productId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Récupérer les informations
    const { data: conversation } = await supabase
      .from('vendor_conversations')
      .select('store_user_id, subject, product_id')
      .eq('id', conversationId)
      .single();

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Récupérer le nom du produit
    let  productName= '';
    if (conversation.product_id || productId) {
      const { data: product } = await supabase
        .from('products')
        .select('name')
        .eq('id', conversation.product_id || productId)
        .single();
      productName = product?.name || '';
    }

    // Récupérer le nom du store
    const { data: store } = await supabase.from('stores').select('name').eq('id', storeId).single();

    const storeName = store?.name || '';

    // Notifier le vendeur
    const result = await sendUnifiedNotification({
      user_id: conversation.store_user_id,
      type: 'vendor_conversation_started',
      title: '💬 Nouvelle conversation client',
      message: productName
        ? `Un client a démarré une conversation concernant "${productName}".`
        : `Un client a démarré une nouvelle conversation.`,
      priority: 'high',
      channels: ['in_app', 'email', 'push'],
      metadata: {
        conversation_id: conversationId,
        customer_id: customerId,
        store_id: storeId,
        product_id: conversation.product_id || productId,
        product_name: productName,
        store_name: storeName,
        subject: conversation.subject,
      },
      action_url: `/vendor/messaging?conversation=${conversationId}`,
      action_label: 'Voir la conversation',
    });

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error sending conversation started notification', {
      error: errorMessage,
      conversationId,
    });
    return { success: false, error: errorMessage };
  }
}






