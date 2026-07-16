/**
 * Hook pour créer des commandes d'œuvres d'artiste
 * Date: 28 Janvier 2025
 *
 * Workflow complet:
 * 1. Créer/récupérer customer
 * 2. Vérifier disponibilité (éditions limitées)
 * 3. Créer order + order_item avec métadonnées spécifiques
 * 4. Gérer shipping fragile et assurance si nécessaire
 * 5. Initier paiement GeniusPay
 */

import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { initiatePayment } from '@/lib/payment-service';
import { useToast } from '@/hooks/use-toast';
import { getAffiliateTrackingCookie } from '@/hooks/useAffiliateTracking';
import { logger } from '@/lib/logger';
import { retryWithExponentialBackoff } from '@/lib/retry-utils';
import { reserveArtistLimitedEdition } from '@/lib/artist-edition-reservation';

const PRODUCT_FIELDS = 'id, name, price, promotional_price, currency, payment_options';
const ARTIST_PRODUCT_FIELDS =
  'id, artist_name, artwork_title, artwork_year, artwork_edition_type, edition_number, total_editions, requires_shipping, certificate_of_authenticity, signature_authenticated, shipping_fragile, shipping_insurance_required, shipping_insurance_amount, version';

/**
 * Options pour créer une commande d'œuvre d'artiste
 */
export interface CreateArtistOrderOptions {
  /** ID du produit artiste */
  artistProductId: string;

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

  /** Adresse de livraison (requis si requires_shipping = true) */
  shippingAddress?: {
    street: string;
    city: string;
    state?: string;
    postal_code: string;
    country: string;
  };

  /** Quantité commandée (généralement 1 pour œuvres d'art) */
  quantity?: number;

  /** ID de la carte cadeau à utiliser (optionnel) */
  giftCardId?: string;

  /** Montant de la carte cadeau à utiliser (optionnel) */
  giftCardAmount?: number;
}

/**
 * Résultat de la création de commande
 */
export interface CreateArtistOrderResult {
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
 * Hook pour créer une commande d'œuvre d'artiste
 *
 * @example
 * ```typescript
 * const { mutateAsync: createArtistOrder, isPending } = useCreateArtistOrder();
 *
 * const handleBuy = async () => {
 *   const result = await createArtistOrder({
 *     artistProductId: 'xxx',
 *     productId: 'yyy',
 *     storeId: 'zzz',
 *     customerEmail: 'user@example.com',
 *     shippingAddress: {
 *       street: '123 Main St',
 *       city: 'Paris',
 *       postal_code: '75001',
 *       country: 'France',
 *     },
 *     quantity: 1,
 *   });
 *
 *   // Rediriger vers GeniusPay
 *   window.location.href = result.checkoutUrl;
 * };
 * ```
 */
export const useCreateArtistOrder = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (options: CreateArtistOrderOptions): Promise<CreateArtistOrderResult> => {
      const {
        artistProductId,
        productId,
        storeId,
        customerEmail,
        customerName,
        customerPhone,
        shippingAddress,
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
          )}&productId=${encodeURIComponent(productId)}&artistProductId=${encodeURIComponent(
            artistProductId
          )}`,
          transactionId: `e2e-tx-${Date.now()}`,
        };
      }

      // 1. Récupérer les détails du produit (avec payment_options) - avec retry
      const product = await retryWithExponentialBackoff(
        async () => {
          const { data, error } = await supabase
            .from('products')
            .select(PRODUCT_FIELDS)
            .eq('id', productId)
            .single();
          if (error) throw error;
          if (!data) throw new Error('Produit non trouvé');
          return data;
        },
        {
          maxRetries: 3,
          initialDelay: 1000,
          shouldRetry: error => {
            // Retry seulement sur erreurs réseau/timeout
            if (error instanceof Error) {
              const msg = error.message.toLowerCase();
              return msg.includes('network') || msg.includes('timeout') || msg.includes('fetch');
            }
            return false;
          },
        }
      );

      // Récupérer les options de paiement configurées
      const paymentOptions = (product.payment_options as {
        payment_type?: string;
        percentage_rate?: number;
      } | null) || { payment_type: 'full', percentage_rate: 30 };
      const paymentType = paymentOptions.payment_type || 'full';
      const percentageRate = paymentOptions.percentage_rate || 30;

      // 2. Récupérer les détails de l'œuvre d'artiste
      const { data: artistProduct, error: artistError } = await supabase
        .from('artist_products')
        .select(ARTIST_PRODUCT_FIELDS)
        .eq('id', artistProductId)
        .single();

      if (artistError || !artistProduct) {
        throw new Error("Œuvre d'artiste non trouvée");
      }

      // 3. Vérifier les éditions limitées avec optimistic locking (panier + achat direct)
      await reserveArtistLimitedEdition(productId, quantity);

      // 4. Vérifier l'adresse de livraison si nécessaire
      if (artistProduct.requires_shipping && !shippingAddress) {
        throw new Error('Adresse de livraison requise pour cette œuvre');
      }

      // 5. Auto-provisioning invité avant la création de commande
      // Pour s'assurer que le webhook post-paiement puisse générer le Certificat et la Provenance
      const { data: authData } = await supabase.auth.getUser();
      let finalUserId = authData?.user?.id;

      if (!finalUserId) {
        const { data: provisionData, error: provisionError } = await supabase.functions.invoke(
          'artist-checkout-provisioning',
          {
            body: {
              email: customerEmail,
              customerName: customerName,
              userId: null,
            },
          }
        );

        if (provisionError) {
          logger.error('Artist checkout provisioning error', { error: provisionError });
          throw new Error(provisionError.message || "Impossible de finaliser l'achat invité.");
        }

        if (provisionData?.error) {
          throw new Error(provisionData.error);
        }

        finalUserId = provisionData?.user_id;
      }

      // 6. Créer la commande via RPC sécurisée
      const affiliateTrackingCookie = getAffiliateTrackingCookie();

      const { data: rpcResult, error: orderError } = await supabase.rpc(
        // @ts-expect-error: RPC type not yet updated in supabase types
        'create_public_artist_order',
        {
          p_product_id: productId,
          p_store_id: storeId,
          p_customer_email: customerEmail,
          p_customer_name: customerName || customerEmail.split('@')[0],
          p_customer_phone: customerPhone,
          p_gift_card_id: giftCardId,
          p_gift_card_amount_requested: giftCardAmount || 0,
          p_coupon_code: undefined, // Options n'incluent pas couponCode pour l'instant
          p_affiliate_tracking_cookie: affiliateTrackingCookie,
          p_guest_checkout: !finalUserId,
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

      // 11. Initier paiement GeniusPay - avec retry automatique
      // Convertir currency en type Currency
      const { isSupportedCurrency } = await import('@/lib/currency-converter');
      type Currency = 'XOF' | 'EUR' | 'USD' | 'GBP' | 'NGN' | 'GHS' | 'KES' | 'ZAR';
      const paymentCurrency: Currency = isSupportedCurrency(product.currency)
        ? (product.currency as Currency)
        : 'XOF';

      const paymentResult = await retryWithExponentialBackoff(
        async () => {
          return await initiatePayment({
            storeId,
            productId,
            orderId: orderId,
            customerId,
            amount: finalAmountToPay,
            currency: paymentCurrency,
            description: `Achat: ${product.name}${artistProduct.artwork_title ? ` - ${artistProduct.artwork_title}` : ''}`,
            customerEmail,
            customerName: customerName || customerEmail.split('@')[0],
            customerPhone,
            metadata: {
              product_type: 'artist',
              order_item_id: orderItemId,
              artist_product_id: artistProductId,
              shipping_fragile: artistProduct.shipping_fragile,
              shipping_insurance_required: artistProduct.shipping_insurance_required,
            },
          });
        },
        {
          maxRetries: 3,
          initialDelay: 2000,
          shouldRetry: error => {
            // Retry seulement sur erreurs réseau/timeout, pas sur erreurs de validation
            if (error instanceof Error) {
              const msg = error.message.toLowerCase();
              return (
                msg.includes('network') ||
                msg.includes('timeout') ||
                msg.includes('fetch') ||
                msg.includes('503') ||
                msg.includes('502')
              );
            }
            return false;
          },
          onRetry: (attempt, delay, error) => {
            logger.warn('Retry paiement GeniusPay', {
              attempt,
              delay,
              error: error instanceof Error ? error.message : String(error),
            });
          },
        }
      );

      if (!paymentResult.success || !paymentResult.checkout_url) {
        // Rollback is now handled by failing the transaction if possible, or manual cleanup
        throw new Error("Erreur lors de l'initialisation du paiement");
      }

      logger.info("Commande d'œuvre d'artiste créée avec succès", {
        orderId: orderId,
        artistProductId,
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
      logger.error('Artist order creation error', { error: error.message });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de créer la commande',
        variant: 'destructive',
      });
    },
  });
};
