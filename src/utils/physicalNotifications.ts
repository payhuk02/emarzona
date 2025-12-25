/**
 * Physical Product Email Notifications
 * Date: 2025-01-27
 * 
 * Système de notifications email automatiques pour produits physiques
 */

import { sendEmail } from '@/lib/sendgrid';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

// =====================================================
// TYPES
// =====================================================

export interface PriceDropNotification {
  userId: string;
  userEmail: string;
  userName: string;
  productId: string;
  productName: string;
  productSlug?: string;
  variantId?: string;
  variantName?: string;
  oldPrice: number;
  newPrice: number;
  priceDropPercentage: number;
  priceDropAmount: number;
  currency?: string;
}

export interface StockAlertNotification {
  userId: string;
  userEmail: string;
  userName: string;
  productId: string;
  productName: string;
  productSlug?: string;
  variantId?: string;
  variantName?: string;
  stockStatus: 'out_of_stock' | 'low_stock' | 'in_stock';
  quantityAvailable: number;
  previousStatus?: 'out_of_stock' | 'low_stock' | 'in_stock';
}

export interface PromotionAlertNotification {
  userId: string;
  userEmail: string;
  userName: string;
  productId: string;
  productName: string;
  productSlug?: string;
  discountPercentage: number;
  originalPrice: number;
  promotionalPrice: number;
  promotionStartDate?: string;
  promotionEndDate?: string;
  currency?: string;
}

export interface ShipmentNotification {
  userId: string;
  userEmail: string;
  userName: string;
  orderId: string;
  orderNumber?: string;
  shipmentStatus: 'preparing' | 'shipped' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception' | 'returned';
  trackingNumber?: string;
  carrierName?: string;
  estimatedDeliveryDate?: string;
  trackingUrl?: string;
  productName?: string;
  productImageUrl?: string;
}

export interface ReturnNotification {
  userId: string;
  userEmail: string;
  userName: string;
  returnId: string;
  orderId: string;
  orderNumber?: string;
  returnStatus: 'requested' | 'approved' | 'rejected' | 'received' | 'processing' | 'refunded' | 'completed' | 'cancelled';
  productName?: string;
  refundAmount?: number;
  refundMethod?: string;
  currency?: string;
}

// =====================================================
// FUNCTIONS
// =====================================================

/**
 * Envoyer une notification de baisse de prix
 */
export const sendPriceDropNotification = async (
  notification: PriceDropNotification
): Promise<{ success: boolean; error?: string }> => {
  try {
    const result = await sendEmail({
      templateSlug: 'price-drop-alert-physical',
      to: notification.userEmail,
      toName: notification.userName,
      userId: notification.userId,
      productType: 'physical',
      productId: notification.productId,
      productName: notification.productName,
      variables: {
        user_name: notification.userName,
        product_name: notification.productName,
        variant_name: notification.variantName || '',
        product_slug: notification.productSlug || '',
        old_price: notification.oldPrice.toLocaleString('fr-FR', {
          style: 'currency',
          currency: notification.currency || 'XOF',
        }),
        new_price: notification.newPrice.toLocaleString('fr-FR', {
          style: 'currency',
          currency: notification.currency || 'XOF',
        }),
        price_drop_percentage: notification.priceDropPercentage.toFixed(1),
        price_drop_amount: notification.priceDropAmount.toLocaleString('fr-FR', {
          style: 'currency',
          currency: notification.currency || 'XOF',
        }),
        product_url: notification.productSlug
          ? `${window.location.origin}/physical/${notification.productSlug}`
          : `${window.location.origin}/physical/${notification.productId}`,
      },
    });

    if (!result.success) {
      logger.error('Failed to send price drop notification', {
        error: result.error,
        notification,
      });
      return result;
    }

    // Mettre à jour l'alerte dans la base de données
    await supabase
      .from('physical_product_price_alerts')
      .update({
        alert_sent: true,
        alert_sent_at: new Date().toISOString(),
        current_price: notification.newPrice,
      })
      .eq('user_id', notification.userId)
      .eq('product_id', notification.productId)
      .eq('variant_id', notification.variantId || null);

    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Error sending price drop notification', { error, notification });
    return { success: false, error: errorMessage };
  }
};

/**
 * Envoyer une notification de retour en stock
 */
export const sendStockAlertNotification = async (
  notification: StockAlertNotification
): Promise<{ success: boolean; error?: string }> => {
  try {
    const statusMessages = {
      out_of_stock: 'Rupture de stock',
      low_stock: 'Stock faible',
      in_stock: 'Retour en stock',
    };

    const result = await sendEmail({
      templateSlug: 'stock-alert-physical',
      to: notification.userEmail,
      toName: notification.userName,
      userId: notification.userId,
      productType: 'physical',
      productId: notification.productId,
      productName: notification.productName,
      variables: {
        user_name: notification.userName,
        product_name: notification.productName,
        variant_name: notification.variantName || '',
        product_slug: notification.productSlug || '',
        stock_status: statusMessages[notification.stockStatus],
        quantity_available: notification.quantityAvailable.toString(),
        previous_status: notification.previousStatus
          ? statusMessages[notification.previousStatus]
          : '',
        product_url: notification.productSlug
          ? `${window.location.origin}/physical/${notification.productSlug}`
          : `${window.location.origin}/physical/${notification.productId}`,
      },
    });

    if (!result.success) {
      logger.error('Failed to send stock alert notification', {
        error: result.error,
        notification,
      });
      return result;
    }

    // Mettre à jour l'alerte dans la base de données
    await supabase
      .from('physical_product_stock_alerts')
      .update({
        alert_sent: true,
        alert_sent_at: new Date().toISOString(),
        stock_status: notification.stockStatus,
      })
      .eq('user_id', notification.userId)
      .eq('product_id', notification.productId)
      .eq('variant_id', notification.variantId || null);

    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Error sending stock alert notification', { error, notification });
    return { success: false, error: errorMessage };
  }
};

/**
 * Envoyer une notification de promotion
 */
export const sendPromotionAlertNotification = async (
  notification: PromotionAlertNotification
): Promise<{ success: boolean; error?: string }> => {
  try {
    const result = await sendEmail({
      templateSlug: 'promotion-alert-physical',
      to: notification.userEmail,
      toName: notification.userName,
      userId: notification.userId,
      productType: 'physical',
      productId: notification.productId,
      productName: notification.productName,
      variables: {
        user_name: notification.userName,
        product_name: notification.productName,
        product_slug: notification.productSlug || '',
        discount_percentage: notification.discountPercentage.toFixed(0),
        original_price: notification.originalPrice.toLocaleString('fr-FR', {
          style: 'currency',
          currency: notification.currency || 'XOF',
        }),
        promotional_price: notification.promotionalPrice.toLocaleString('fr-FR', {
          style: 'currency',
          currency: notification.currency || 'XOF',
        }),
        promotion_start_date: notification.promotionStartDate
          ? new Date(notification.promotionStartDate).toLocaleDateString('fr-FR')
          : '',
        promotion_end_date: notification.promotionEndDate
          ? new Date(notification.promotionEndDate).toLocaleDateString('fr-FR')
          : '',
        product_url: notification.productSlug
          ? `${window.location.origin}/physical/${notification.productSlug}`
          : `${window.location.origin}/physical/${notification.productId}`,
      },
    });

    if (!result.success) {
      logger.error('Failed to send promotion alert notification', {
        error: result.error,
        notification,
      });
      return result;
    }

    // Mettre à jour l'alerte dans la base de données
    await supabase
      .from('physical_product_promotion_alerts')
      .update({
        last_alert_sent_at: new Date().toISOString(),
        last_alert_sent_date: new Date().toISOString().split('T')[0],
      })
      .eq('user_id', notification.userId)
      .eq('product_id', notification.productId);

    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Error sending promotion alert notification', { error, notification });
    return { success: false, error: errorMessage };
  }
};

/**
 * Envoyer une notification d'expédition
 */
export const sendShipmentNotification = async (
  notification: ShipmentNotification
): Promise<{ success: boolean; error?: string }> => {
  try {
    const statusMessages = {
      preparing: 'En préparation',
      shipped: 'Expédié',
      in_transit: 'En transit',
      out_for_delivery: 'En livraison',
      delivered: 'Livré',
      exception: 'Exception',
      returned: 'Retourné',
    };

    const result = await sendEmail({
      templateSlug: 'shipment-update-physical',
      to: notification.userEmail,
      toName: notification.userName,
      userId: notification.userId,
      productType: 'physical',
      orderId: notification.orderId,
      variables: {
        user_name: notification.userName,
        order_number: notification.orderNumber || notification.orderId,
        shipment_status: statusMessages[notification.shipmentStatus],
        tracking_number: notification.trackingNumber || '',
        carrier_name: notification.carrierName || '',
        estimated_delivery_date: notification.estimatedDeliveryDate
          ? new Date(notification.estimatedDeliveryDate).toLocaleDateString('fr-FR')
          : '',
        tracking_url: notification.trackingUrl || '',
        product_name: notification.productName || '',
        order_url: `${window.location.origin}/orders/${notification.orderId}`,
      },
    });

    if (!result.success) {
      logger.error('Failed to send shipment notification', {
        error: result.error,
        notification,
      });
      return result;
    }

    // Mettre à jour la notification dans la base de données
    await supabase
      .from('physical_product_shipment_notifications')
      .update({
        email_sent: true,
        email_sent_at: new Date().toISOString(),
      })
      .eq('order_id', notification.orderId)
      .eq('shipment_status', notification.shipmentStatus);

    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Error sending shipment notification', { error, notification });
    return { success: false, error: errorMessage };
  }
};

/**
 * Envoyer une notification de retour
 */
export const sendReturnNotification = async (
  notification: ReturnNotification
): Promise<{ success: boolean; error?: string }> => {
  try {
    const statusMessages = {
      requested: 'Demandé',
      approved: 'Approuvé',
      rejected: 'Rejeté',
      received: 'Reçu',
      processing: 'En traitement',
      refunded: 'Remboursé',
      completed: 'Terminé',
      cancelled: 'Annulé',
    };

    const result = await sendEmail({
      templateSlug: 'return-update-physical',
      to: notification.userEmail,
      toName: notification.userName,
      userId: notification.userId,
      productType: 'physical',
      orderId: notification.orderId,
      variables: {
        user_name: notification.userName,
        return_id: notification.returnId,
        order_number: notification.orderNumber || notification.orderId,
        return_status: statusMessages[notification.returnStatus],
        product_name: notification.productName || '',
        refund_amount: notification.refundAmount
          ? notification.refundAmount.toLocaleString('fr-FR', {
              style: 'currency',
              currency: notification.currency || 'XOF',
            })
          : '',
        refund_method: notification.refundMethod || '',
        return_url: `${window.location.origin}/returns/${notification.returnId}`,
        order_url: `${window.location.origin}/orders/${notification.orderId}`,
      },
    });

    if (!result.success) {
      logger.error('Failed to send return notification', {
        error: result.error,
        notification,
      });
      return result;
    }

    // Mettre à jour la notification dans la base de données
    await supabase
      .from('physical_product_return_notifications')
      .update({
        email_sent: true,
        email_sent_at: new Date().toISOString(),
      })
      .eq('return_id', notification.returnId)
      .eq('return_status', notification.returnStatus);

    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Error sending return notification', { error, notification });
    return { success: false, error: errorMessage };
  }
};

