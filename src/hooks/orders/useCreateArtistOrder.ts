/**
 * Hook pour créer des commandes d'œuvres d'artiste
 * Date: 28 Janvier 2025
 *
 * Workflow complet:
 * 1. Créer/récupérer customer
 * 2. Vérifier disponibilité (éditions limitées)
 * 3. Créer order + order_item avec métadonnées spécifiques
 * 4. Gérer shipping fragile et assurance si nécessaire
 * 5. Initier paiement Moneroo
 */

import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { initiateMonerooPayment } from '@/lib/moneroo-payment';
import { useToast } from '@/hooks/use-toast';
import { getAffiliateTrackingCookie } from '@/hooks/useAffiliateTracking';
import { logger } from '@/lib/logger';
import { retryWithExponentialBackoff } from '@/lib/retry-utils';

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

  /** URL de checkout Moneroo */
  checkoutUrl: string;

  /** ID de transaction Moneroo */
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
 *   // Rediriger vers Moneroo
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

      // 1. Récupérer les détails du produit (avec payment_options) - avec retry
      const product = await retryWithExponentialBackoff(
        async () => {
          const { data, error } = await supabase
            .from('products')
            .select('*')
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
        .select('*')
        .eq('id', artistProductId)
        .single();

      if (artistError || !artistProduct) {
        throw new Error("Œuvre d'artiste non trouvée");
      }

      // 3. Vérifier les éditions limitées avec optimistic locking
      if (
        artistProduct.artwork_edition_type === 'limited_edition' &&
        artistProduct.total_editions
      ) {
        // Utiliser la fonction optimisée avec optimistic locking
        const currentVersion = artistProduct.version || 1;

        const { data: lockResult, error: lockError } = await supabase.rpc(
          'check_and_increment_artist_product_version',
          {
            p_product_id: productId,
            p_expected_version: currentVersion,
            p_quantity: quantity,
          }
        );

        if (lockError) {
          logger.error('Erreur optimistic locking', { error: lockError });
          throw new Error('Erreur lors de la vérification de disponibilité');
        }

        const result = Array.isArray(lockResult) ? lockResult[0] : lockResult;

        if (!result?.success) {
          throw new Error(
            result?.message ||
              `Seulement ${result?.available_editions || 0} exemplaire(s) disponible(s)`
          );
        }

        // Version mise à jour, continuer avec la nouvelle version
        logger.info('Optimistic locking réussi', {
          oldVersion: currentVersion,
          newVersion: result.current_version,
          available: result.available_editions,
        });
      }

      // 4. Vérifier l'adresse de livraison si nécessaire
      if (artistProduct.requires_shipping && !shippingAddress) {
        throw new Error('Adresse de livraison requise pour cette œuvre');
      }

      // 5. Créer/récupérer customer
      let  customerId: string;
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('store_id', storeId)
        .eq('email', customerEmail)
        .single();

      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert({
            store_id: storeId,
            email: customerEmail,
            name: customerName || customerEmail.split('@')[0],
            phone: customerPhone,
          })
          .select('id')
          .single();

        if (customerError || !newCustomer) {
          throw new Error('Erreur lors de la création du client');
        }

        customerId = newCustomer.id;
      }

      // 6. Calculer le prix total
      const basePrice = product.promotional_price || product.price;
      let  totalPrice= basePrice * quantity;

      // Ajouter l'assurance si nécessaire
      if (artistProduct.shipping_insurance_required && artistProduct.shipping_insurance_amount) {
        totalPrice += artistProduct.shipping_insurance_amount;
      }

      // Calculer le montant à payer selon le type de paiement
      let  amountToPay= totalPrice;
      let  percentagePaid= 0;
      let  remainingAmount= 0;

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
      const { data: orderNumberData } = await supabase.rpc('generate_order_number');
      const orderNumber = orderNumberData || `ORD-${Date.now()}`;

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
          // Métadonnées spécifiques pour œuvres d'artiste
          notes: JSON.stringify({
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
          }),
        })
        .select('*')
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
          // Métadonnées spécifiques
          metadata: JSON.stringify({
            artist_product_id: artistProductId,
            artist_name: artistProduct.artist_name,
            artwork_title: artistProduct.artwork_title,
            artwork_year: artistProduct.artwork_year,
            edition_type: artistProduct.artwork_edition_type,
            edition_number: artistProduct.edition_number,
            total_editions: artistProduct.total_editions,
            certificate_of_authenticity: artistProduct.certificate_of_authenticity,
            signature_authenticated: artistProduct.signature_authenticated,
            shipping_fragile: artistProduct.shipping_fragile,
            shipping_insurance_required: artistProduct.shipping_insurance_required,
            shipping_insurance_amount: artistProduct.shipping_insurance_amount,
          }),
        })
        .select('id')
        .single();

      if (orderItemError || !orderItem) {
        // Rollback: supprimer la commande en cas d'erreur
        await supabase.from('orders').delete().eq('id', order.id);
        throw new Error("Erreur lors de la création de l'élément de commande");
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
        }).catch( err => {
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

      // 11. Initier paiement Moneroo - avec retry automatique
      // Convertir currency en type Currency
      const { isSupportedCurrency } = await import('@/lib/currency-converter');
      type Currency = 'XOF' | 'EUR' | 'USD' | 'GBP' | 'NGN' | 'GHS' | 'KES' | 'ZAR';
      const  paymentCurrency: Currency = isSupportedCurrency(product.currency)
        ? (product.currency as Currency)
        : 'XOF';

      const paymentResult = await retryWithExponentialBackoff(
        async () => {
          return await initiateMonerooPayment({
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
            logger.warn('Retry paiement Moneroo', {
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






