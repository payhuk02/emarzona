/**
 * Physical Products Notification Triggers
 * Date: 2025-01-27
 * 
 * Service centralisé pour déclencher les notifications automatiques
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import {
  sendPriceDropNotification,
  sendStockAlertNotification,
  sendShipmentNotification,
  sendReturnNotification,
} from '@/utils/physicalNotifications';

/**
 * Déclencher les notifications de changement de prix
 */
export async function triggerPriceChangeNotifications(
  productId: string,
  variantId: string | null,
  oldPrice: number,
  newPrice: number
): Promise<void> {
  try {
    // Vérifier s'il y a une baisse de prix
    if (newPrice >= oldPrice) {
      return; // Pas de baisse, pas de notification
    }

    const priceDrop = oldPrice - newPrice;
    const priceDropPercentage = (priceDrop / oldPrice) * 100;

    // Récupérer toutes les alertes actives pour ce produit/variant
    const { data: alerts } = await supabase
      .from('physical_product_price_alerts')
      .select('*, user_id, product_id')
      .eq('product_id', productId)
      .eq('is_active', true)
      .eq('variant_id', variantId || null);

    if (!alerts || alerts.length === 0) {
      return; // Pas d'alertes actives
    }

    // Récupérer les informations du produit
    const { data: product } = await supabase
      .from('products')
      .select('name, slug, price, currency')
      .eq('id', productId)
      .single();

    if (!product) {
      logger.warn('Product not found for price notification', { productId });
      return;
    }

    // Récupérer les informations des variants si nécessaire
    let variantName: string | undefined;
    if (variantId) {
      const { data: variant } = await supabase
        .from('physical_product_variants')
        .select('name')
        .eq('id', variantId)
        .single();

      if (variant) {
        variantName = variant.name;
      }
    }

    // Envoyer les notifications
    for (const alert of alerts) {
      // Vérifier si le seuil est atteint
      if (alert.price_drop_threshold && priceDropPercentage < alert.price_drop_threshold) {
        continue; // Seuil non atteint
      }

      if (alert.target_price && newPrice > alert.target_price) {
        continue; // Prix cible non atteint
      }

      // Vérifier si une alerte a déjà été envoyée aujourd'hui
      if (alert.alert_sent_date === new Date().toISOString().split('T')[0]) {
        continue; // Déjà notifié aujourd'hui
      }

      // Récupérer les informations utilisateur depuis la table customers
      const { data: customer } = await supabase
        .from('customers')
        .select('email, name')
        .eq('id', alert.user_id)
        .single();
      
      if (!customer || !customer.email) {
        logger.warn('Customer not found for price notification', { userId: alert.user_id });
        continue;
      }

      // Vérifier les préférences de notifications
      const { data: preferences } = await supabase
        .from('user_notification_preferences')
        .select('email_price_alerts')
        .eq('user_id', alert.user_id)
        .single();

      if (preferences && !preferences.email_price_alerts) {
        continue; // Utilisateur a désactivé les alertes de prix
      }

      // Envoyer la notification
      await sendPriceDropNotification({
        userId: alert.user_id,
        userEmail: customer.email,
        userName: customer.name || customer.email.split('@')[0],
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        variantId: variantId || undefined,
        variantName,
        oldPrice,
        newPrice,
        priceDropPercentage,
        priceDropAmount: priceDrop,
        currency: product.currency || 'XOF',
      });

      logger.info('Price drop notification sent', {
        userId: alert.user_id,
        productId,
        priceDropPercentage,
      });
    }
  } catch (error: unknown) {
    logger.error('Error triggering price change notifications', { error, productId, variantId });
  }
}

/**
 * Déclencher les notifications de changement de stock
 */
export async function triggerStockChangeNotifications(
  productId: string,
  variantId: string | null,
  previousQuantity: number,
  currentQuantity: number
): Promise<void> {
  try {
    // Déterminer le statut précédent et actuel
    const previousStatus: 'out_of_stock' | 'low_stock' | 'in_stock' =
      previousQuantity === 0
        ? 'out_of_stock'
        : previousQuantity < 10
          ? 'low_stock'
          : 'in_stock';

    const currentStatus: 'out_of_stock' | 'low_stock' | 'in_stock' =
      currentQuantity === 0
        ? 'out_of_stock'
        : currentQuantity < 10
          ? 'low_stock'
          : 'in_stock';

    // Si le statut n'a pas changé, pas de notification
    if (previousStatus === currentStatus) {
      return;
    }

    // Récupérer toutes les alertes actives pour ce produit/variant
    const { data: alerts } = await supabase
      .from('physical_product_stock_alerts')
      .select('*, user_id, product_id')
      .eq('product_id', productId)
      .eq('is_active', true)
      .eq('variant_id', variantId || null);

    if (!alerts || alerts.length === 0) {
      return;
    }

    // Récupérer les informations du produit
    const { data: product } = await supabase
      .from('products')
      .select('name, slug')
      .eq('id', productId)
      .single();

    if (!product) {
      logger.warn('Product not found for stock notification', { productId });
      return;
    }

    // Vérifier si on doit notifier
    const shouldNotify =
      (currentStatus === 'in_stock' && previousStatus === 'out_of_stock') ||
      (currentStatus === 'low_stock' && previousStatus === 'out_of_stock');

    if (!shouldNotify) {
      return;
    }

    // Récupérer les informations des variants si nécessaire
    let variantName: string | undefined;
    if (variantId) {
      const { data: variant } = await supabase
        .from('physical_product_variants')
        .select('name')
        .eq('id', variantId)
        .single();

      if (variant) {
        variantName = variant.name;
      }
    }

    // Envoyer les notifications
    for (const alert of alerts) {
      // Vérifier les conditions de notification
      if (currentStatus === 'in_stock' && !alert.notify_on_back_in_stock) {
        continue;
      }

      if (currentStatus === 'low_stock' && !alert.notify_on_low_stock) {
        continue;
      }

      // Vérifier si une alerte a déjà été envoyée aujourd'hui
      if (alert.alert_sent_date === new Date().toISOString().split('T')[0]) {
        continue;
      }

      // Récupérer les informations utilisateur depuis la table customers
      const { data: customer } = await supabase
        .from('customers')
        .select('email, name')
        .eq('id', alert.user_id)
        .single();
      
      if (!customer || !customer.email) {
        logger.warn('Customer not found for stock notification', { userId: alert.user_id });
        continue;
      }

      // Vérifier les préférences de notifications (optionnel)
      const { data: preferences } = await supabase
        .from('user_notification_preferences')
        .select('email_stock_alerts')
        .eq('user_id', alert.user_id)
        .maybeSingle();

      if (preferences && !preferences.email_stock_alerts) {
        continue;
      }

      // Envoyer la notification
      await sendStockAlertNotification({
        userId: alert.user_id,
        userEmail: customer.email,
        userName: customer.name || customer.email.split('@')[0],
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        variantId: variantId || undefined,
        variantName,
        stockStatus: currentStatus,
        quantityAvailable: currentQuantity,
        previousStatus,
      });

      logger.info('Stock alert notification sent', {
        userId: alert.user_id,
        productId,
        currentStatus,
      });
    }
  } catch (error: unknown) {
    logger.error('Error triggering stock change notifications', { error, productId, variantId });
  }
}

/**
 * Déclencher une notification d'expédition
 */
export async function triggerShipmentNotification(
  orderId: string,
  shipmentStatus: 'preparing' | 'shipped' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception' | 'returned',
  trackingNumber?: string,
  carrierName?: string,
  estimatedDeliveryDate?: string
): Promise<void> {
  try {
    // Récupérer les informations de la commande
    const { data: order } = await supabase
      .from('orders')
      .select('*, customer_id, customers(*, email)')
      .eq('id', orderId)
      .single();

    if (!order || !order.customers) {
      logger.warn('Order or customer not found for shipment notification', { orderId });
      return;
    }

    const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers;
    if (!customer || !customer.email) {
      logger.warn('Customer email not found for shipment notification', { orderId });
      return;
    }

    // Pour les notifications, on utilise directement les données du customer
    // Pas besoin de récupérer l'utilisateur auth car on a déjà l'email
    type CustomerWithName = typeof customer & { name?: string };
    const customerWithName = customer as CustomerWithName;
    const userEmail = customer.email;
    const userName = customerWithName.name || customer.email.split('@')[0];
    const userId = customer.id;

    // Vérifier les préférences de notifications (optionnel, on peut aussi notifier même si pas de préférences)
    const { data: preferences } = await supabase
      .from('user_notification_preferences')
      .select('email_shipment_updates, sms_shipment_updates')
      .eq('user_id', userId)
      .single();

    if (preferences && !preferences.email_shipment_updates) {
      return; // Utilisateur a désactivé les notifications d'expédition
    }

    // Récupérer les informations du produit (premier item)
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('product_id, products(name, image_url)')
      .eq('order_id', orderId)
      .limit(1);

    const productName = orderItems?.[0]?.products?.name || 'Votre commande';
    const productImageUrl = orderItems?.[0]?.products?.image_url;

    // Créer ou mettre à jour la notification dans la base
    const { data: existingNotification } = await supabase
      .from('physical_product_shipment_notifications')
      .select('id')
      .eq('order_id', orderId)
      .eq('shipment_status', shipmentStatus)
      .maybeSingle();

    if (!existingNotification) {
      await supabase.from('physical_product_shipment_notifications').insert({
        order_id: orderId,
        customer_id: customer.id,
        shipment_status: shipmentStatus,
        tracking_number: trackingNumber,
        carrier_name: carrierName,
        estimated_delivery_date: estimatedDeliveryDate,
        notify_on_status_change: true,
        notify_on_delivery: true,
        notify_on_exception: true,
      });
    }

    // Envoyer la notification email
    await sendShipmentNotification({
      userId: userId,
      userEmail: userEmail,
      userName: userName,
      orderId: order.id,
      orderNumber: order.order_number || order.id,
      shipmentStatus,
      trackingNumber,
      carrierName,
      estimatedDeliveryDate,
      trackingUrl: trackingNumber
        ? `https://tracking.fedex.com/${trackingNumber}`
        : undefined,
      productName,
      productImageUrl,
    });

    logger.info('Shipment notification sent', {
      userId: userId,
      orderId,
      shipmentStatus,
    });
  } catch (error: unknown) {
    logger.error('Error triggering shipment notification', { error, orderId });
  }
}

/**
 * Déclencher une notification de retour
 */
export async function triggerReturnNotification(
  returnId: string,
  returnStatus: 'requested' | 'approved' | 'rejected' | 'received' | 'processing' | 'refunded' | 'completed' | 'cancelled'
): Promise<void> {
  try {
    // Récupérer les informations du retour
    const { data: returnData } = await supabase
      .from('product_returns')
      .select('*, order_id, orders(*, order_number, customer_id, customers(*, email))')
      .eq('id', returnId)
      .single();

    if (!returnData || !returnData.orders) {
      logger.warn('Return or order not found for return notification', { returnId });
      return;
    }

    const order = Array.isArray(returnData.orders) ? returnData.orders[0] : returnData.orders;
    const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers;
    if (!customer || !customer.email) {
      logger.warn('Customer email not found for return notification', { returnId });
      return;
    }

    // Pour les notifications, on utilise directement les données du customer
    type CustomerWithName = typeof customer & { name?: string };
    const customerWithName = customer as CustomerWithName;
    const userEmail = customer.email;
    const userName = customerWithName.name || customer.email.split('@')[0];
    const userId = customer.id;

    // Vérifier les préférences de notifications (optionnel)
    const { data: preferences } = await supabase
      .from('user_notification_preferences')
      .select('email_return_updates')
      .eq('user_id', userId)
      .single();

    if (preferences && !preferences.email_return_updates) {
      return; // Utilisateur a désactivé les notifications de retour
    }

    // Récupérer les informations du produit
    const { data: orderItem } = await supabase
      .from('order_items')
      .select('product_id, products(name)')
      .eq('id', returnData.order_item_id)
      .single();

    const productName = orderItem?.products?.name || 'Produit';

    // Créer ou mettre à jour la notification dans la base
    const { data: existingNotification } = await supabase
      .from('physical_product_return_notifications')
      .select('id')
      .eq('return_id', returnId)
      .eq('return_status', returnStatus)
      .maybeSingle();

    if (!existingNotification) {
      await supabase.from('physical_product_return_notifications').insert({
        return_id: returnId,
        customer_id: customer.id,
        order_id: order.id,
        return_status: returnStatus,
        notify_on_status_change: true,
        notify_on_approval: true,
        notify_on_refund: true,
      });
    }

    // Envoyer la notification email
    await sendReturnNotification({
      userId: userId,
      userEmail: userEmail,
      userName: userName,
      returnId: returnData.id,
      orderId: order.id,
      orderNumber: order.order_number || order.id,
      returnStatus,
      productName,
      refundAmount: returnData.refund_amount || undefined,
      refundMethod: returnData.refund_method || undefined,
      currency: returnData.currency || 'XOF',
    });

    logger.info('Return notification sent', {
      userId: userId,
      returnId,
      returnStatus,
    });
  } catch (error: unknown) {
    logger.error('Error triggering return notification', { error, returnId });
  }
}

