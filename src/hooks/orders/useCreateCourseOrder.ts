/**
 * Hook pour créer des commandes de cours en ligne
 * Date: 28 Janvier 2025
 *
 * Workflow complet:
 * 1. Créer/récupérer customer
 * 2. Vérifier si l'utilisateur est déjà inscrit
 * 3. Créer order + order_item
 * 4. Initier paiement GeniusPay
 * 5. Créer enrollment automatique après paiement réussi (via webhook)
 */

import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { initiatePayment } from '@/lib/payment-service';
import { useToast } from '@/hooks/use-toast';
import { getAffiliateTrackingCookie } from '@/hooks/useAffiliateTracking';
import { logger } from '@/lib/logger';
import { findOrCreateStoreCustomer } from '@/lib/orders/customers-data';
import { generateOrderNumber } from '@/lib/orders/orders-data';

const PRODUCT_FIELDS = 'id, name, price, promotional_price, currency, payment_options';
const COURSE_FIELDS = 'id, product_id';

/**
 * Options pour créer une commande de cours
 */
export interface CreateCourseOrderOptions {
  /** ID du cours */
  courseId: string;

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

  /** Quantité (généralement 1 pour cours) */
  quantity?: number;

  /** ID de la carte cadeau à utiliser (optionnel) */
  giftCardId?: string;

  /** Montant de la carte cadeau à utiliser (optionnel) */
  giftCardAmount?: number;
}

/**
 * Résultat de la création de commande
 */
export interface CreateCourseOrderResult {
  /** ID de la commande créée */
  orderId: string;

  /** ID de l'order_item */
  orderItemId: string;

  /** URL de checkout GeniusPay */
  checkoutUrl: string;

  /** ID de transaction GeniusPay */
  transactionId: string;
}

/**
 * Hook pour créer une commande de cours en ligne
 *
 * @example
 * ```typescript
 * const { mutateAsync: createCourseOrder, isPending } = useCreateCourseOrder();
 *
 * const handleBuy = async () => {
 *   const result = await createCourseOrder({
 *     courseId: 'xxx',
 *     productId: 'yyy',
 *     storeId: 'zzz',
 *     customerEmail: 'user@example.com',
 *   });
 *
 *   // Rediriger vers GeniusPay
 *   window.location.href = result.checkoutUrl;
 * };
 * ```
 */
export const useCreateCourseOrder = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (options: CreateCourseOrderOptions): Promise<CreateCourseOrderResult> => {
      const {
        courseId,
        productId,
        storeId,
        customerEmail,
        customerName,
        customerPhone,
        quantity = 1,
        giftCardId,
        giftCardAmount = 0,
      } = options;

      // E2E local: bypass RLS + PSP dependencies (checkout stub).
      if (import.meta.env.DEV && import.meta.env.VITE_E2E_PAYMENT_STUB === 'true') {
        return {
          orderId: `e2e-order-${Date.now()}`,
          orderItemId: `e2e-item-${Date.now()}`,
          checkoutUrl: `/checkout?e2e=1&storeId=${encodeURIComponent(
            storeId
          )}&productId=${encodeURIComponent(productId)}&courseId=${encodeURIComponent(courseId)}`,
          transactionId: `e2e-tx-${Date.now()}`,
        };
      }

      // 1. Récupérer les détails du produit
      const { data: product, error: productError } = await supabase
        .from('products')
        .select(PRODUCT_FIELDS)
        .eq('id', productId)
        .single();

      if (productError || !product) {
        throw new Error('Produit non trouvé');
      }

      // 3. Vérifier si l'utilisateur est déjà inscrit (si connecté)
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const isGuestCheckout = !user;

      if (user) {
        const { data: existingEnrollment } = await supabase
          .from('course_enrollments')
          .select('id')
          .eq('course_id', courseId)
          .eq('user_id', user.id)
          .single();

        if (existingEnrollment) {
          throw new Error('Vous êtes déjà inscrit à ce cours');
        }
      }

      // 6. Créer la commande via RPC sécurisée
      const affiliateTrackingCookie = getAffiliateTrackingCookie();

      const { data: rpcResult, error: orderError } = await supabase.rpc(
        // @ts-expect-error: RPC type not yet updated in supabase types
        'create_public_course_order',
        {
          p_product_id: productId,
          p_store_id: storeId,
          p_customer_email: customerEmail,
          p_customer_name: customerName || customerEmail.split('@')[0],
          p_customer_phone: customerPhone,
          p_gift_card_id: giftCardId,
          p_gift_card_amount_requested: giftCardAmount || 0,
          p_coupon_code: undefined, // no coupon code in options
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
        course_id: string;
        total_amount: number;
      };

      const finalAmountToPay = orderData.total_amount;
      const orderId = orderData.order_id;
      const orderNumber = orderData.order_number;
      const customerId = orderData.customer_id;
      const orderItemId = orderData.order_item_id;

      // 9b. Déclencher webhook order.created (asynchrone, ne bloque pas)
      import('@/lib/webhooks').then(({ triggerOrderCreatedWebhook }) => {
        triggerOrderCreatedWebhook(orderId, {
          store_id: storeId,
          customer_id: customerId,
          order_number: orderNumber,
          status: 'pending',
          total_amount: finalAmountToPay,
          currency: product.currency || 'XOF',
          payment_status: 'pending',
          created_at: new Date().toISOString(),
        }).catch(err => {
          logger.error('Error triggering order created webhook', { error: err, orderId: orderId });
        });
      });

      // 10. Initier paiement GeniusPay
      // Convertir currency en type Currency
      const { isSupportedCurrency } = await import('@/lib/currency-converter');
      type Currency = 'XOF' | 'EUR' | 'USD' | 'GBP' | 'NGN' | 'GHS' | 'KES' | 'ZAR';
      const paymentCurrency: Currency = isSupportedCurrency(product.currency)
        ? (product.currency as Currency)
        : 'XOF';

      const paymentResult = await initiatePayment({
        storeId,
        productId,
        orderId: orderId,
        customerId,
        amount: finalAmountToPay,
        currency: paymentCurrency,
        description: `Achat: ${product.name}`,
        customerEmail,
        customerName: customerName || customerEmail.split('@')[0],
        customerPhone,
        metadata: {
          product_type: 'course',
          order_item_id: orderItemId,
          course_id: courseId,
          auto_enroll: true, // Flag pour webhook
        },
      });

      if (!paymentResult.success || !paymentResult.checkout_url) {
        // Rollback is now handled by failing the transaction if possible, or manual cleanup
        throw new Error("Erreur lors de l'initialisation du paiement");
      }

      logger.info('Commande de cours créée avec succès', {
        orderId: orderId,
        courseId,
        productId,
      });

      return {
        orderId: orderId,
        orderItemId: orderItemId,
        checkoutUrl: paymentResult.checkout_url,
        transactionId: paymentResult.transaction_id,
      };
    },

    onError: (error: Error) => {
      logger.error('Course order creation error', { error: error.message });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de créer la commande',
        variant: 'destructive',
      });
    },
  });
};
