/**
 * Hook pour créer des commandes de cours en ligne
 * Date: 28 Janvier 2025
 *
 * Workflow complet:
 * 1. Créer/récupérer customer
 * 2. Vérifier si l'utilisateur est déjà inscrit
 * 3. Créer order + order_item
 * 4. Initier paiement Moneroo
 * 5. Créer enrollment automatique après paiement réussi (via webhook)
 */

import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { initiateMonerooPayment } from '@/lib/moneroo-payment';
import { useToast } from '@/hooks/use-toast';
import { getAffiliateTrackingCookie } from '@/hooks/useAffiliateTracking';
import { logger } from '@/lib/logger';

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

  /** URL de checkout Moneroo */
  checkoutUrl: string;

  /** ID de transaction Moneroo */
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
 *   // Rediriger vers Moneroo
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

      // 1. Récupérer les détails du produit
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (productError || !product) {
        throw new Error('Produit non trouvé');
      }

      // Récupérer les options de paiement configurées
      const paymentOptions = (product.payment_options as {
        payment_type?: string;
        percentage_rate?: number;
      } | null) || { payment_type: 'full', percentage_rate: 30 };
      const paymentType = paymentOptions.payment_type || 'full';
      const percentageRate = paymentOptions.percentage_rate || 30;

      // 2. Vérifier que le cours existe
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError || !course) {
        throw new Error('Cours non trouvé');
      }

      // 3. Vérifier si l'utilisateur est déjà inscrit (si connecté)
      const {
        data: { user },
      } = await supabase.auth.getUser();
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

      // 4. Créer/récupérer customer
      let customerId: string;
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

      // 5. Calculer le prix total
      const basePrice = product.promotional_price || product.price;
      const totalPrice = basePrice * quantity;

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

      // 6. Générer un numéro de commande
      const { data: orderNumberData } = await supabase.rpc('generate_order_number');
      const orderNumber = orderNumberData || `ORD-${Date.now()}`;

      // 7. Créer la commande (avec payment_type)
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
          payment_type: paymentType,
          percentage_paid: percentagePaid,
          remaining_amount: remainingAmount,
          affiliate_tracking_cookie: affiliateTrackingCookie,
          // Métadonnées spécifiques pour cours
          notes: JSON.stringify({
            course_id: courseId,
            course_name: product.name,
            auto_enroll: true, // Flag pour créer enrollment automatiquement
          }),
        })
        .select('*')
        .single();

      if (orderError || !order) {
        throw new Error('Erreur lors de la création de la commande');
      }

      // 8. Créer order_item avec métadonnées spécifiques
      const { data: orderItem, error: orderItemError } = await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: productId,
          product_type: 'course',
          product_name: product.name,
          quantity,
          unit_price: basePrice,
          total_price: totalPrice - (giftCardAmount || 0),
          // Métadonnées spécifiques
          metadata: JSON.stringify({
            course_id: courseId,
            auto_enroll: true,
          }),
        })
        .select('id')
        .single();

      if (orderItemError || !orderItem) {
        // Rollback: supprimer la commande en cas d'erreur
        await supabase.from('orders').delete().eq('id', order.id);
        throw new Error("Erreur lors de la création de l'élément de commande");
      }

      // 9. Rédimer la carte cadeau si applicable (APRÈS création commande)
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

      // 10. Initier paiement Moneroo
      // Convertir currency en type Currency
      const { isSupportedCurrency } = await import('@/lib/currency-converter');
      type Currency = 'XOF' | 'EUR' | 'USD' | 'GBP' | 'NGN' | 'GHS' | 'KES' | 'ZAR';
      const paymentCurrency: Currency = isSupportedCurrency(product.currency)
        ? (product.currency as Currency)
        : 'XOF';

      const paymentResult = await initiateMonerooPayment({
        storeId,
        productId,
        orderId: order.id,
        customerId,
        amount: finalAmountToPay,
        currency: paymentCurrency,
        description: `Achat: ${product.name}`,
        customerEmail,
        customerName: customerName || customerEmail.split('@')[0],
        customerPhone,
        metadata: {
          product_type: 'course',
          order_item_id: orderItem.id,
          course_id: courseId,
          auto_enroll: true, // Flag pour webhook
        },
      });

      if (!paymentResult.success || !paymentResult.checkout_url) {
        // Rollback: supprimer la commande et l'order_item en cas d'erreur
        await supabase.from('order_items').delete().eq('id', orderItem.id);
        await supabase.from('orders').delete().eq('id', order.id);
        throw new Error("Erreur lors de l'initialisation du paiement");
      }

      logger.info('Commande de cours créée avec succès', {
        orderId: order.id,
        courseId,
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
      logger.error('Course order creation error', { error: error.message });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de créer la commande',
        variant: 'destructive',
      });
    },
  });
};
