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
import { findOrCreateStoreCustomer } from '@/lib/orders/customers-data';
import { generateOrderNumber } from '@/lib/orders/orders-data';

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

      const customerId = await findOrCreateStoreCustomer({
        storeId,
        email: customerEmail,
        name: customerName || customerEmail.split('@')[0],
        phone: customerPhone,
      });

      // 6. Calculer le prix total
      const basePrice = product.promotional_price || product.price;
      let totalPrice = basePrice * quantity;

      // Ajouter l'assurance si nécessaire
      if (artistProduct.shipping_insurance_required && artistProduct.shipping_insurance_amount) {
        totalPrice += artistProduct.shipping_insurance_amount;
      }

      // Calculer le montant à payer selon le type de paiement
      let amountToPay = totalPrice;
      let percentagePaid = 0;
      let remainingAmount = 0;

      if (paymentType === 'percentage') {
        // Paiement partiel : calculer l'acompte
        amountToPay = Math.round((totalPrice * percentageRate) / 100);
        percentagePaid = amountToPay;
        remainingAmount = totalPrice - amountToPay;
      } else if (paymentType === 'delivery_secured') {
        // Paiement sécurisé : montant total mais retenu en escrow
        amountToPay = totalPrice;
      }
      // Si 'full', amountToPay = totalPrice (déjà défini)

      // Appliquer la carte cadeau si applicable
      const finalAmountToPay = Math.max(0, amountToPay - (giftCardAmount || 0));

      // 7. Générer un numéro de commande
      const orderNumber = await generateOrderNumber();

      // 8. Créer la commande (avec payment_type)
      // Récupérer le cookie d'affiliation s'il existe
      const affiliateTrackingCookie = getAffiliateTrackingCookie();

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          store_id: storeId,
          customer_id: customerId,
          order_number: orderNumber,
          total_amount: totalPrice - (giftCardAmount || 0), // Montant final après gift card
          currency: product.currency,
          payment_status: 'pending',
          status: 'pending',
          delivery_status: artistProduct.requires_shipping ? 'pending' : null,
          payment_type: paymentType,
          percentage_paid: percentagePaid,
          remaining_amount: remainingAmount,
          affiliate_tracking_cookie: affiliateTrackingCookie,
          metadata: {
            artist_name: artistProduct.artist_name,
            artwork_title: artistProduct.artwork_title,
            artwork_year: artistProduct.artwork_year,
            edition_type: artistProduct.artwork_edition_type,
            edition_number: artistProduct.edition_number,
            certificate_of_authenticity: artistProduct.certificate_of_authenticity,
            signature_authenticated: artistProduct.signature_authenticated,
            shipping_fragile: artistProduct.shipping_fragile,
            shipping_insurance_required: artistProduct.shipping_insurance_required,
            shipping_insurance_amount: artistProduct.shipping_insurance_amount,
          },
        })
        .select(
          'id, store_id, customer_id, order_number, total_amount, currency, status, payment_status, created_at'
        )
        .single();

      if (orderError || !order) {
        throw new Error('Erreur lors de la création de la commande');
      }

      // 9. Créer order_item avec métadonnées spécifiques
      const { data: orderItem, error: orderItemError } = await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: productId,
          product_type: 'artist',
          product_name: product.name,
          quantity,
          unit_price: basePrice,
          total_price: totalPrice - (giftCardAmount || 0),
        })
        .select('id')
        .single();

      if (orderItemError || !orderItem) {
        // Rollback: supprimer la commande en cas d'erreur
        await supabase.from('orders').delete().eq('id', order.id);
        throw new Error(
          `Erreur lors de la création de l'élément de commande${
            orderItemError?.message ? `: ${orderItemError.message}` : ''
          }`
        );
      }

      // 9b. Déclencher webhook order.created (asynchrone, ne bloque pas)
      import('@/lib/webhooks').then(({ triggerOrderCreatedWebhook }) => {
        triggerOrderCreatedWebhook(order.id, {
          store_id: order.store_id || storeId,
          customer_id: order.customer_id || customerId,
          order_number: order.order_number || orderNumber,
          status: order.status || 'pending',
          total_amount: order.total_amount || totalPrice,
          currency: order.currency || product.currency || 'XOF',
          payment_status: order.payment_status || 'pending',
          created_at: order.created_at || new Date().toISOString(),
        }).catch(err => {
          logger.error('Error triggering order created webhook', { error: err, orderId: order.id });
        });
      });

      // 10. Rédimer la carte cadeau si applicable (APRÈS création commande)
      if (giftCardId && giftCardAmount && giftCardAmount > 0) {
        try {
          const { error: redeemError } = await supabase.rpc('redeem_gift_card', {
            p_gift_card_id: giftCardId,
            p_order_id: order.id,
            p_amount: giftCardAmount,
          });

          if (redeemError) {
            logger.error('Erreur lors du rachat de la carte cadeau', { error: redeemError });
            // Ne pas bloquer la commande si le rachat échoue
          }
        } catch (giftCardErr) {
          logger.error('Erreur lors du rachat de la carte cadeau', { error: giftCardErr });
        }
      }

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
            orderId: order.id,
            customerId,
            amount: finalAmountToPay,
            currency: paymentCurrency,
            description: `Achat: ${product.name}${artistProduct.artwork_title ? ` - ${artistProduct.artwork_title}` : ''}`,
            customerEmail,
            customerName: customerName || customerEmail.split('@')[0],
            customerPhone,
            metadata: {
              product_type: 'artist',
              order_item_id: orderItem.id,
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
        // Rollback: supprimer la commande et l'order_item en cas d'erreur
        await supabase.from('order_items').delete().eq('id', orderItem.id);
        await supabase.from('orders').delete().eq('id', order.id);
        throw new Error("Erreur lors de l'initialisation du paiement");
      }

      logger.info("Commande d'œuvre d'artiste créée avec succès", {
        orderId: order.id,
        artistProductId,
        productId,
      });

      return {
        orderId: order.id,
        orderItemId: orderItem.id,
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
