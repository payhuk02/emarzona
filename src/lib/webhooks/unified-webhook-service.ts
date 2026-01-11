/**
 * Unified Webhook Service
 * Date: 2025-01-28
 * 
 * Service unifié pour remplacer les systèmes fragmentés de webhooks
 * (digitalProductWebhooks, physicalProductWebhooks, etc.)
 * 
 * Utilise le système centralisé via la fonction RPC trigger_webhook
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type { WebhookEventType } from '@/types/webhooks';
import type { RecordString } from '@/types/common';

/**
 * Mappe les anciens types d'événements vers les nouveaux types standardisés
 */
const  EVENT_TYPE_MAPPING: Record<string, WebhookEventType> = {
  // Produits digitaux
  'purchase': 'order.created',
  'download': 'digital_product.downloaded',
  'license_activated': 'digital_product.license_activated',
  'license_revoked': 'digital_product.license_revoked',
  
  // Produits physiques
  'product_created': 'product.created',
  'product_updated': 'product.updated',
  'order_created': 'order.created',
  'order_completed': 'order.completed',
  
  // Retours (RMA)
  'return_requested': 'return.requested',
  'return_approved': 'return.approved',
  'return_rejected': 'return.rejected',
  'return_received': 'return.received',
  'return_refunded': 'return.refunded',
  
  // Expéditions
  'shipment_created': 'shipment.created',
  'shipment_updated': 'shipment.updated',
  'shipment_delivered': 'shipment.delivered',
  
  // Événements génériques (déjà standardisés)
  'order.created': 'order.created',
  'order.completed': 'order.completed',
  'order.cancelled': 'order.cancelled',
  'order.refunded': 'order.refunded',
  'payment.completed': 'payment.completed',
  'payment.failed': 'payment.failed',
  'product.created': 'product.created',
  'product.updated': 'product.updated',
  'product.deleted': 'product.deleted',
};

/**
 * Convertit un ancien type d'événement vers le nouveau format standardisé
 */
function normalizeEventType(eventType: string): WebhookEventType {
  // Si c'est déjà un type standardisé, le retourner tel quel
  if (eventType.includes('.')) {
    return eventType as WebhookEventType;
  }
  
  // Sinon, utiliser le mapping
  return EVENT_TYPE_MAPPING[eventType] || 'custom';
}

/**
 * Déclenche des webhooks pour un événement donné (système unifié)
 * 
 * Remplace:
 * - digitalProductWebhooks.triggerWebhooks()
 * - physicalProductWebhooks.triggerWebhooks()
 * 
 * @param storeId - ID du store
 * @param eventType - Type d'événement (peut être ancien ou nouveau format)
 * @param eventData - Données de l'événement
 * @param eventId - ID de l'entité qui a déclenché l'événement (optionnel)
 */
export async function triggerUnifiedWebhook(
  storeId: string,
  eventType: string,
  eventData: RecordString,
  eventId?: string
): Promise<void> {
  try {
    // Normaliser le type d'événement
    const normalizedEventType = normalizeEventType(eventType);
    
    // Générer un eventId si non fourni
    const finalEventId = eventId || `${normalizedEventType}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    // Appeler la fonction RPC unifiée
    const { data, error } = await supabase.rpc('trigger_webhook', {
      p_store_id: storeId,
      p_event_type: normalizedEventType,
      p_event_id: finalEventId || null,
      p_event_data: eventData,
    } as Record<string, unknown>); // Type assertion pour les paramètres RPC

    if (error) {
      logger.error('Error triggering unified webhook', { 
        error: error.message, 
        storeId, 
        eventType: normalizedEventType,
        originalEventType: eventType 
      });
      return;
    }

    const webhookResults = (data as unknown) as Array<{ webhook_id: string; delivery_id: string }> | null;
    if (webhookResults && webhookResults.length > 0) {
      logger.info('Unified webhooks triggered', { 
        count: webhookResults.length, 
        eventType: normalizedEventType,
        originalEventType: eventType,
        eventId: finalEventId 
      });
    } else {
      logger.debug('No active webhooks found for event', { 
        storeId, 
        eventType: normalizedEventType 
      });
    }
  } catch (_error: unknown) {
    logger.error('Exception triggering unified webhook', {
      error: _error instanceof Error ? _error.message : String(_error),
      storeId,
      eventType
    });
  }
}

/**
 * Déclenche un webhook pour un achat de produit (unifié)
 * Remplace les appels spécifiques aux produits digitaux/physiques
 */
export async function triggerPurchaseWebhook(
  storeId: string,
  orderId: string,
  orderData: {
    order_id: string;
    order_number?: string;
    customer_id: string;
    total_amount: number;
    currency: string;
    payment_status: string;
    status: string;
    items?: unknown[];
    [key: string]: unknown;
  }
): Promise<void> {
  await triggerUnifiedWebhook(
    storeId,
    'order.created',
    {
      order: {
        id: orderData.order_id,
        order_number: orderData.order_number || orderId,
        created_at: new Date().toISOString(),
        ...orderData,
      },
      order_items: orderData.items || [],
    },
    orderId
  );
}

/**
 * Déclenche un webhook pour un téléchargement de produit digital
 */
export async function triggerDownloadWebhook(
  storeId: string,
  downloadId: string,
  downloadData: {
    product_id: string;
    customer_id: string;
    license_key?: string;
    download_url: string;
    [key: string]: unknown;
  }
): Promise<void> {
  await triggerUnifiedWebhook(
    storeId,
    'digital_product.downloaded',
    {
      download: {
        id: downloadId,
        downloaded_at: new Date().toISOString(),
        ...downloadData,
      },
    },
    downloadId
  );
}

/**
 * Déclenche un webhook pour une activation de licence
 */
export async function triggerLicenseActivatedWebhook(
  storeId: string,
  licenseId: string,
  licenseData: {
    product_id: string;
    customer_id: string;
    license_key: string;
    license_type: string;
    [key: string]: unknown;
  }
): Promise<void> {
  await triggerUnifiedWebhook(
    storeId,
    'digital_product.license_activated',
    {
      license: {
        id: licenseId,
        activated_at: new Date().toISOString(),
        ...licenseData,
      },
    },
    licenseId
  );
}

/**
 * Déclenche un webhook pour un produit créé (unifié)
 */
export async function triggerProductCreatedWebhook(
  storeId: string,
  productId: string,
  productData: {
    name: string;
    product_type: string;
    price: number;
    currency: string;
    [key: string]: unknown;
  }
): Promise<void> {
  await triggerUnifiedWebhook(
    storeId,
    'product.created',
    {
      product: {
        id: productId,
        store_id: storeId,
        created_at: new Date().toISOString(),
        ...productData,
      },
    },
    productId
  );
}

/**
 * Wrapper pour compatibilité avec l'ancien système digitalProductWebhooks
 * @deprecated Utilisez triggerUnifiedWebhook() à la place
 */
export async function triggerWebhooks(
  storeId: string,
  eventType: string,
  eventData: RecordString,
  eventId?: string
): Promise<void> {
  logger.warn(
    'triggerWebhooks() is deprecated. Use triggerUnifiedWebhook() instead.',
    { storeId, eventType }
  );
  return triggerUnifiedWebhook(storeId, eventType, eventData, eventId);
}







