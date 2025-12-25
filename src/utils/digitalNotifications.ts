/**
 * Digital Product Email Notifications
 * Date: 2025-01-27
 * 
 * Système de notifications email automatiques pour produits digitaux
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
  oldPrice: number;
  newPrice: number;
  priceDropPercentage: number;
  priceDropAmount: number;
  wishlistId?: string;
}

export interface NewVersionNotification {
  userId: string;
  userEmail: string;
  userName: string;
  productId: string;
  productName: string;
  productSlug?: string;
  versionNumber: string;
  versionNotes?: string;
  downloadLink?: string;
  previousVersion?: string;
}

export interface LicenseExpiringNotification {
  userId: string;
  userEmail: string;
  userName: string;
  licenseId: string;
  productId: string;
  productName: string;
  productSlug?: string;
  expiresAt: string;
  daysUntilExpiry: number;
  renewalLink?: string;
}

export interface LicenseExpiredNotification {
  userId: string;
  userEmail: string;
  userName: string;
  licenseId: string;
  productId: string;
  productName: string;
  productSlug?: string;
  expiredAt: string;
  renewalLink?: string;
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
      templateSlug: 'price-drop-alert-digital',
      to: notification.userEmail,
      toName: notification.userName,
      userId: notification.userId,
      productType: 'digital',
      productId: notification.productId,
      productName: notification.productName,
      variables: {
        user_name: notification.userName,
        product_name: notification.productName,
        product_slug: notification.productSlug || '',
        old_price: notification.oldPrice.toLocaleString('fr-FR'),
        new_price: notification.newPrice.toLocaleString('fr-FR'),
        price_drop_percentage: notification.priceDropPercentage.toFixed(1),
        price_drop_amount: notification.priceDropAmount.toLocaleString('fr-FR'),
        product_url: notification.productSlug 
          ? `${window.location.origin}/digital/${notification.productSlug}`
          : `${window.location.origin}/digital/${notification.productId}`,
      },
    });

    if (result.success) {
      // Marquer l'alerte comme envoyée dans la base de données
      if (notification.wishlistId) {
        await supabase
          .from('price_drop_alerts')
          .insert({
            user_id: notification.userId,
            product_id: notification.productId,
            old_price: notification.oldPrice,
            new_price: notification.newPrice,
            price_drop_percentage: notification.priceDropPercentage,
            email_sent: true,
          });
      }

      logger.info('Notification de baisse de prix envoyée', {
        userId: notification.userId,
        productId: notification.productId,
        priceDrop: notification.priceDropPercentage,
      });
    }

    return result;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    logger.error('Erreur lors de l\'envoi de la notification de baisse de prix', {
      error: errorMessage,
      notification,
    });
    return { success: false, error: errorMessage };
  }
};

/**
 * Envoyer une notification de nouvelle version
 */
export const sendNewVersionNotification = async (
  notification: NewVersionNotification
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Récupérer tous les clients qui ont acheté ce produit
    const { data: customers, error } = await supabase
      .from('order_items')
      .select(`
        order_id,
        orders!inner (
          customer_id,
          customers!inner (
            id,
            email,
            name
          )
        )
      `)
      .eq('product_id', notification.productId)
      .eq('product_type', 'digital');

    if (error) {
      throw error;
    }

    if (!customers || customers.length === 0) {
      logger.info('Aucun client trouvé pour la notification de nouvelle version', {
        productId: notification.productId,
      });
      return { success: true };
    }

    // Envoyer l'email à chaque client
    const results = await Promise.allSettled(
      customers.map((item) => {
        const customer = item.orders?.customers;
        if (!customer || !customer.email) return Promise.resolve({ success: false });

        return sendEmail({
          templateSlug: 'new-version-digital',
          to: customer.email,
          toName: customer.name || 'Client',
          userId: customer.id,
          productType: 'digital',
          productId: notification.productId,
          productName: notification.productName,
          variables: {
            user_name: customer.name || 'Client',
            product_name: notification.productName,
            product_slug: notification.productSlug || '',
            version_number: notification.versionNumber,
            version_notes: notification.versionNotes || 'Nouvelle version disponible',
            download_link: notification.downloadLink || '',
            previous_version: notification.previousVersion || '',
            product_url: notification.productSlug
              ? `${window.location.origin}/digital/${notification.productSlug}`
              : `${window.location.origin}/digital/${notification.productId}`,
          },
        });
      })
    );

    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    
    logger.info('Notifications de nouvelle version envoyées', {
      productId: notification.productId,
      totalCustomers: customers.length,
      successCount,
    });

    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    logger.error('Erreur lors de l\'envoi des notifications de nouvelle version', {
      error: errorMessage,
      notification,
    });
    return { success: false, error: errorMessage };
  }
};

/**
 * Envoyer une notification de licence expirant bientôt
 */
export const sendLicenseExpiringNotification = async (
  notification: LicenseExpiringNotification
): Promise<{ success: boolean; error?: string }> => {
  try {
    const result = await sendEmail({
      templateSlug: 'license-expiring-digital',
      to: notification.userEmail,
      toName: notification.userName,
      userId: notification.userId,
      productType: 'digital',
      productId: notification.productId,
      productName: notification.productName,
      variables: {
        user_name: notification.userName,
        product_name: notification.productName,
        product_slug: notification.productSlug || '',
        expires_at: new Date(notification.expiresAt).toLocaleDateString('fr-FR'),
        days_until_expiry: notification.daysUntilExpiry.toString(),
        renewal_link: notification.renewalLink || '',
        product_url: notification.productSlug
          ? `${window.location.origin}/digital/${notification.productSlug}`
          : `${window.location.origin}/digital/${notification.productId}`,
      },
    });

    if (result.success) {
      logger.info('Notification de licence expirant envoyée', {
        userId: notification.userId,
        licenseId: notification.licenseId,
        daysUntilExpiry: notification.daysUntilExpiry,
      });
    }

    return result;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    logger.error('Erreur lors de l\'envoi de la notification de licence expirant', {
      error: errorMessage,
      notification,
    });
    return { success: false, error: errorMessage };
  }
};

/**
 * Envoyer une notification de licence expirée
 */
export const sendLicenseExpiredNotification = async (
  notification: LicenseExpiredNotification
): Promise<{ success: boolean; error?: string }> => {
  try {
    const result = await sendEmail({
      templateSlug: 'license-expired-digital',
      to: notification.userEmail,
      toName: notification.userName,
      userId: notification.userId,
      productType: 'digital',
      productId: notification.productId,
      productName: notification.productName,
      variables: {
        user_name: notification.userName,
        product_name: notification.productName,
        product_slug: notification.productSlug || '',
        expired_at: new Date(notification.expiredAt).toLocaleDateString('fr-FR'),
        renewal_link: notification.renewalLink || '',
        product_url: notification.productSlug
          ? `${window.location.origin}/digital/${notification.productSlug}`
          : `${window.location.origin}/digital/${notification.productId}`,
      },
    });

    if (result.success) {
      logger.info('Notification de licence expirée envoyée', {
        userId: notification.userId,
        licenseId: notification.licenseId,
      });
    }

    return result;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    logger.error('Erreur lors de l\'envoi de la notification de licence expirée', {
      error: errorMessage,
      notification,
    });
    return { success: false, error: errorMessage };
  }
};

/**
 * Vérifier et envoyer les notifications de baisse de prix
 * À appeler périodiquement (cron job ou scheduler)
 */
export const checkAndSendPriceDropNotifications = async (): Promise<{
  sent: number;
  errors: number;
}> => {
  try {
    // Récupérer les alertes de baisse de prix non envoyées
    const { data: alerts, error } = await supabase
      .from('price_drop_alerts')
      .select(`
        *,
        products!inner (
          name,
          slug
        )
      `)
      .eq('email_sent', false)
      .order('alert_sent_at', { ascending: true })
      .limit(100); // Limite pour éviter surcharge

    if (error) {
      throw error;
    }

    if (!alerts || alerts.length === 0) {
      return { sent: 0, errors: 0 };
    }

    let sent = 0;
    let errorsCount = 0;

    for (const alert of alerts) {
      const product = alert.products;

      if (!product) {
        errorsCount++;
        continue;
      }

      // Récupérer l'utilisateur séparément
      const { data: userData } = await supabase.auth.admin.getUserById(alert.user_id);
      const user = userData?.user;

      if (!user || !user.email) {
        errorsCount++;
        continue;
      }

      const result = await sendPriceDropNotification({
        userId: alert.user_id,
        userEmail: user.email,
        userName: user.user_metadata?.full_name as string || user.email,
        productId: alert.product_id,
        productName: product.name,
        productSlug: product.slug,
        oldPrice: Number(alert.old_price),
        newPrice: Number(alert.new_price),
        priceDropPercentage: Number(alert.price_drop_percentage),
        priceDropAmount: Number(alert.old_price) - Number(alert.new_price),
      });

      if (result.success) {
        sent++;
        // Marquer comme envoyé
        await supabase
          .from('price_drop_alerts')
          .update({ email_sent: true })
          .eq('id', alert.id);
      } else {
        errorsCount++;
      }
    }

    logger.info('Vérification des alertes de baisse de prix terminée', {
      total: alerts.length,
      sent,
      errors: errorsCount,
    });

    return { sent, errors: errorsCount };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    logger.error('Erreur lors de la vérification des alertes de baisse de prix', {
      error: errorMessage,
    });
    return { sent: 0, errors: 1 };
  }
};

/**
 * Vérifier et envoyer les notifications de licences expirant
 * À appeler périodiquement (cron job ou scheduler)
 */
export const checkAndSendLicenseExpiringNotifications = async (): Promise<{
  sent: number;
  errors: number;
}> => {
  try {
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Récupérer les licences expirant dans les 30 prochains jours
    const { data: licenses, error } = await supabase
      .from('digital_product_licenses')
      .select(`
        *,
        products!inner (
          name,
          slug
        ),
        customers!inner (
          email,
          name
        )
      `)
      .gte('expires_at', now.toISOString())
      .lte('expires_at', in30Days.toISOString())
      .eq('is_active', true)
      .limit(100);

    if (error) {
      throw error;
    }

    if (!licenses || licenses.length === 0) {
      return { sent: 0, errors: 0 };
    }

    let sent = 0;
    let errorsCount = 0;

    for (const license of licenses) {
      const product = license.products;
      const customer = license.customers;

      if (!customer || !customer.email || !product || !license.expires_at) {
        errorsCount++;
        continue;
      }

      const expiresAt = new Date(license.expires_at);
      const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Envoyer seulement si expirant dans 7 jours ou 30 jours
      if (daysUntilExpiry === 7 || daysUntilExpiry === 30) {
        const result = await sendLicenseExpiringNotification({
          userId: license.customer_id || '',
          userEmail: customer.email,
          userName: customer.name || customer.email,
          licenseId: license.id,
          productId: license.product_id,
          productName: product.name,
          productSlug: product.slug,
          expiresAt: license.expires_at,
          daysUntilExpiry,
        });

        if (result.success) {
          sent++;
          // Note: Le champ notification_sent n'existe pas encore dans la table
          // Il faudra créer une migration pour l'ajouter si nécessaire
          logger.info('License expiring notification sent', { licenseId: license.id });
        } else {
          errorsCount++;
        }
      }
    }

    logger.info('Vérification des licences expirant terminée', {
      total: licenses.length,
      sent,
      errors: errorsCount,
    });

    return { sent, errors: errorsCount };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    logger.error('Erreur lors de la vérification des licences expirant', {
      error: errorMessage,
    });
    return { sent: 0, errors: 1 };
  }
};

