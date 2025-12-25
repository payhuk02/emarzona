/**
 * Digital Product Updates Notification System
 * Date: 28 Janvier 2025
 * 
 * Système de notifications pour les mises à jour de produits digitaux
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { notifyDigitalProductUpdate } from '@/lib/notifications/unified-notifications';

export interface ProductUpdate {
  product_id: string;
  version: string;
  version_notes?: string;
  download_url: string;
  previous_version?: string;
  is_major_update: boolean;
}

/**
 * Notifier tous les clients d'une mise à jour de produit
 */
export async function notifyAllCustomersOfUpdate(
  update: ProductUpdate
): Promise<{ success: boolean; notified_count: number; error?: string }> {
  try {
    // Récupérer le produit
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, slug, store_id')
      .eq('id', update.product_id)
      .single();

    if (productError || !product) {
      throw new Error('Product not found');
    }

    // Récupérer tous les clients qui ont acheté ce produit
    const { data: customers, error: customersError } = await supabase
      .from('order_items')
      .select(`
        order_id,
        orders!inner(
          customer_id,
          customers!inner(
            id,
            email,
            profiles!inner(id, user_id)
          )
        )
      `)
      .eq('product_id', update.product_id)
      .eq('orders.status', 'completed');

    if (customersError) {
      throw customersError;
    }

    if (!customers || customers.length === 0) {
      logger.info('No customers to notify for product update', { productId: update.product_id });
      return { success: true, notified_count: 0 };
    }

    // Extraire les IDs utilisateurs uniques
    const userIds = new Set<string>();
    customers.forEach((item: any) => {
      const customer = item.orders?.customers;
      if (customer?.profiles?.user_id) {
        userIds.add(customer.profiles.user_id);
      }
    });

    // Envoyer les notifications
    const notifications = Array.from(userIds).map(userId =>
      notifyDigitalProductUpdate(
        userId,
        update.product_id,
        product.name,
        update.version,
        update.download_url
      )
    );

    const results = await Promise.allSettled(notifications);
    const successCount = results.filter(r => r.status === 'fulfilled').length;

    // Enregistrer la mise à jour dans la base de données
    await supabase
      .from('digital_product_updates')
      .insert({
        product_id: update.product_id,
        version: update.version,
        version_notes: update.version_notes,
        download_url: update.download_url,
        previous_version: update.previous_version,
        is_major_update: update.is_major_update,
        notified_count: successCount,
        total_customers: userIds.size,
      });

    logger.info('Product update notifications sent', {
      productId: update.product_id,
      version: update.version,
      notified: successCount,
      total: userIds.size,
    });

    return { success: true, notified_count: successCount };
  } catch (error: any) {
    logger.error('Error notifying customers of product update', {
      error: error.message,
      update,
    });
    return { success: false, notified_count: 0, error: error.message };
  }
}

/**
 * Créer une nouvelle version d'un produit digital
 */
export async function createProductVersion(
  productId: string,
  version: string,
  fileUrl: string,
  versionNotes?: string,
  isMajorUpdate: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    // Récupérer la version actuelle
    const { data: currentProduct } = await supabase
      .from('digital_products')
      .select('version, main_file_url')
      .eq('product_id', productId)
      .single();

    const previousVersion = currentProduct?.version || '1.0';

    // Mettre à jour le produit
    const { error: updateError } = await supabase
      .from('digital_products')
      .update({
        main_file_url: fileUrl,
        main_file_version: version,
        updated_at: new Date().toISOString(),
      })
      .eq('product_id', productId);

    if (updateError) throw updateError;

    // Notifier tous les clients
    await notifyAllCustomersOfUpdate({
      product_id: productId,
      version,
      version_notes: versionNotes,
      download_url: fileUrl,
      previous_version: previousVersion,
      is_major_update: isMajorUpdate,
    });

    return { success: true };
  } catch (error: any) {
    logger.error('Error creating product version', { error: error.message, productId });
    return { success: false, error: error.message };
  }
}

