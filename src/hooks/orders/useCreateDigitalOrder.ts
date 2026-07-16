/**
 * Hook pour créer des commandes de produits digitaux
 * Date: 28 octobre 2025
 *
 * Workflow complet:
 * 1. Créer/récupérer customer
 * 2. Générer licence si nécessaire
 * 3. Créer order + order_item
 * 4. Initier paiement GeniusPay
 * 5. Retourner checkout URL
 */

import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { initiatePayment } from '@/lib/payment-service';
import { useToast } from '@/hooks/use-toast';
import { getAffiliateTrackingCookie } from '@/hooks/useAffiliateTracking';
import { logger } from '@/lib/logger';
import { isSupportedCurrency, type Currency } from '@/lib/currency-converter';
import { validateCheckoutPromotion } from '@/lib/checkout/promotion';
import { findOrCreateStoreCustomer } from '@/lib/orders/customers-data';
import { generateOrderNumber } from '@/lib/orders/orders-data';
import { insertOrderItem, orderItemsTable } from '@/lib/orders/order-items-client';
import { extractCheckoutToken } from '@/lib/checkout/checkout-access';

const PRODUCT_FIELDS = 'id, name, price, promotional_price, currency';

/**
 * Options pour créer une commande digital
 */
export interface CreateDigitalOrderOptions {
  /** ID du produit digital */
  digitalProductId: string;

  /** ID du produit de base (pour price, etc.) */
  productId: string;

  /** ID du store */
  storeId: string;

  /** Email du client */
  customerEmail: string;

  /** Nom du client (optionnel) */
  customerName?: string;

  /** Téléphone du client (optionnel) */
  customerPhone?: string;

  /** Générer une licence ? */
  generateLicense?: boolean;

  /** Type de licence */
  licenseType?: 'single' | 'multi' | 'unlimited';

  /** Nombre max d'activations (pour multi) */
  maxActivations?: number;

  /** Durée de validité licence en jours */
  licenseExpiryDays?: number;

  /** ID de la carte cadeau à utiliser (optionnel) */
  giftCardId?: string;

  /** Montant de la carte cadeau à utiliser (optionnel) */
  giftCardAmount?: number;

  /** Code promo (product_promotions / validate_unified_promotion) */
  couponCode?: string;

  /** Montant de réduction promo déjà validé côté client */
  couponDiscountAmount?: number;

  /** ID promotion pour promotion_usage */
  promotionId?: string;
}

/**
 * Résultat de la création de commande
 */
export interface CreateDigitalOrderResult {
  /** ID de la commande créée */
  orderId: string;

  /** ID de l'order_item */
  orderItemId: string;

  /** ID de la licence générée (si applicable) */
  licenseId?: string;

  /** URL de checkout GeniusPay */
  checkoutUrl: string;

  /** ID de transaction GeniusPay */
  transactionId: string;
}

async function generateLicenseKeyViaRpc(): Promise<string> {
  const { data, error } = await supabase.rpc('generate_license_key');
  if (error || !data) {
    logger.error('generate_license_key RPC failed', { error });
    throw new Error('Erreur lors de la génération de la clé de licence');
  }
  return data as string;
}

/**
 * Hook pour créer une commande de produit digital
 *
 * @example
 * ```typescript
 * const { mutateAsync: createDigitalOrder, isPending } = useCreateDigitalOrder();
 *
 * const handleBuy = async () => {
 *   const result = await createDigitalOrder({
 *     digitalProductId: 'xxx',
 *     productId: 'yyy',
 *     storeId: 'zzz',
 *     customerEmail: 'user@example.com',
 *     generateLicense: true,
 *     licenseType: 'single',
 *   });
 *
 *   // Rediriger vers GeniusPay
 *   window.location.href = result.checkoutUrl;
 * };
 * ```
 */
export const useCreateDigitalOrder = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (options: CreateDigitalOrderOptions): Promise<CreateDigitalOrderResult> => {
      const {
        digitalProductId,
        productId,
        storeId,
        customerEmail,
        customerName,
        customerPhone,
        generateLicense = true,
        licenseType = 'single',
        maxActivations = 1,
        licenseExpiryDays,
        giftCardId,
        giftCardAmount = 0,
        couponCode,
        couponDiscountAmount = 0,
        promotionId,
      } = options;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      const isGuestCheckout = !user;

      const { data: product } = await supabase
        .from('products')
        .select('name, currency')
        .eq('id', productId)
        .single();
      const productName = product?.name || 'Produit Digital';
      const productCurrency = product?.currency || 'XOF';

      // 6. Créer la commande via RPC sécurisée
      const affiliateTrackingCookie = getAffiliateTrackingCookie();

      const { data: rpcResult, error: orderError } = await supabase.rpc(
        // @ts-expect-error: RPC type not yet updated in supabase types
        'create_public_digital_order',
        {
          p_product_id: productId,
          p_store_id: storeId,
          p_customer_email: customerEmail,
          p_customer_name: customerName || customerEmail.split('@')[0],
          p_customer_phone: customerPhone,
          p_generate_license: generateLicense,
          p_license_type: licenseType,
          p_max_activations: maxActivations,
          p_license_expiry_days: licenseExpiryDays,
          p_gift_card_id: giftCardId,
          p_gift_card_amount_requested: giftCardAmount || 0,
          p_coupon_code: couponCode,
          p_affiliate_tracking_cookie: affiliateTrackingCookie,
          p_guest_checkout: isGuestCheckout,
        }
      );

      if (orderError || !rpcResult) {
        throw new Error('Erreur lors de la création de la commande');
      }

      const orderData = rpcResult as unknown as {
        order_id: string;
        order_item_id: string;
        order_number: string;
        customer_id: string;
        digital_product_id: string;
        total_amount: number;
      };

      const finalAmount = orderData.total_amount;
      const orderId = orderData.order_id;
      const orderNumber = orderData.order_number;
      const customerId = orderData.customer_id;
      const orderItemId = orderData.order_item_id;

      // 8. Créer automatiquement la facture
      try {
        const { data: invoiceId, error: invoiceError } = await supabase.rpc(
          'create_invoice_from_order',
          {
            p_order_id: orderId,
          }
        );

        if (invoiceError) {
          logger.error('Error creating invoice:', { error: invoiceError });
          // Ne pas bloquer la commande si la facture échoue
        } else {
          logger.info(`Invoice created: ${invoiceId}`);
        }
      } catch (invoiceErr) {
        logger.error('Error in invoice creation:', { error: invoiceErr });
        // Ne pas bloquer la commande
      }

      // 9. Déclencher webhook order.created (asynchrone, ne bloque pas)
      import('@/lib/webhooks').then(({ triggerOrderCreatedWebhook }) => {
        triggerOrderCreatedWebhook(orderId, {
          store_id: storeId,
          customer_id: customerId,
          order_number: orderNumber,
          status: 'pending',
          total_amount: finalAmount,
          currency: productCurrency,
          payment_status: 'pending',
          created_at: new Date().toISOString(),
        }).catch(err => {
          logger.error('Error in analytics tracking', { error: err, orderId: orderId });
        });
      });

      // 11. Initier le paiement GeniusPay
      const paymentCurrency: Currency = isSupportedCurrency(String(productCurrency))
        ? (productCurrency as Currency)
        : 'XOF';

      // Re-extract checkoutToken if needed (it might be in local storage or metadata, but for payment metadata we can just generate it or omit it, let's omit it for security or use the one from auth)
      const checkoutToken = null;

      const paymentResult = await initiatePayment({
        storeId,
        productId,
        orderId: orderId,
        customerId,
        amount: finalAmount,
        currency: paymentCurrency,
        description: `Achat: ${productName}`,
        customerEmail,
        customerName: customerName || customerEmail.split('@')[0],
        customerPhone,
        metadata: {
          product_type: 'digital',
          order_id: orderId,
          order_number: orderNumber,
          digital_product_id: orderData.digital_product_id,
          order_item_id: orderItemId,
          ...(isGuestCheckout ? { guest_checkout: true } : {}),
        },
        checkoutToken,
      });

      if (!paymentResult.success || !paymentResult.checkout_url) {
        // #region agent log
        fetch('http://127.0.0.1:7740/ingest/c21af8ec-02ef-48c9-95f8-23aa8fa2c366', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'fed886' },
          body: JSON.stringify({
            sessionId: 'fed886',
            hypothesisId: 'H4-digital-payment-auth',
            location: 'useCreateDigitalOrder.ts:paymentFailed',
            message: 'Digital payment initiation failed',
            data: {
              orderId,
              success: paymentResult.success,
              error: paymentResult.error ?? null,
              hasCheckoutUrl: !!paymentResult.checkout_url,
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
        throw new Error(paymentResult.error || "Erreur lors de l'initialisation du paiement");
      }

      // 12. Retourner le résultat
      return {
        orderId,
        orderItemId,
        licenseId: undefined,
        checkoutUrl: paymentResult.checkout_url,
        transactionId: paymentResult.transaction_id,
      };
    },

    onSuccess: () => {
      toast({
        title: '✅ Commande créée',
        description: 'Redirection vers le paiement...',
      });
    },

    onError: (error: Error) => {
      logger.error('Digital order creation error', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de créer la commande',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour vérifier si un utilisateur a déjà acheté un produit digital
 */
export const useHasPurchasedDigitalProduct = (digitalProductId: string, userEmail: string) => {
  return useMutation({
    mutationFn: async (): Promise<boolean> => {
      const { data, error } = await orderItemsTable()
        .select(
          `
          id,
          orders!inner (
            id,
            payment_status,
            customers!inner (
              email
            )
          )
        `
        )
        .eq('digital_product_id', digitalProductId)
        .eq('orders.payment_status', 'paid')
        .eq('orders.customers.email', userEmail)
        .limit(1);

      if (error) {
        logger.error('Check purchase error', { error, userEmail, digitalProductId });
        return false;
      }

      return data && data.length > 0;
    },
  });
};
