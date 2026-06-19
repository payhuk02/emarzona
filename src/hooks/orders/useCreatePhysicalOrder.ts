/**
 * Hook pour créer des commandes de produits physiques
 * Date: 28 octobre 2025
 *
 * Workflow complet:
 * 1. Créer/récupérer customer
 * 2. Vérifier disponibilité stock
 * 3. Réserver stock (quantity_reserved)
 * 4. Créer order + order_item
 * 5. Initier paiement Moneroo
 * 6. Déduire stock si paiement réussi (via webhook)
 */

import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { initiatePayment } from '@/lib/payment-service';
import {
  releasePhysicalInventoryForOrder,
  reservePhysicalInventoryForOrder,
} from '@/lib/physical-inventory';
import { useToast } from '@/hooks/use-toast';
import { getAffiliateTrackingCookie } from '@/hooks/useAffiliateTracking';
import { logger } from '@/lib/logger';
import { findOrCreateStoreCustomer } from '@/lib/orders/customers-data';
import { generateOrderNumber } from '@/lib/orders/orders-data';
import { parsePhysicalCheckoutOptions } from '@/lib/physical/physical-checkout-display';
import type { PhysicalCheckoutMethod } from '@/constants/physical-checkout-options';

const PRODUCT_FIELDS = 'id, name, price, promotional_price, currency, payment_options';
const PHYSICAL_PRODUCT_FIELDS = 'id, product_id';
const PHYSICAL_PRODUCT_VARIANT_FIELDS = 'id';

/**
 * Options pour créer une commande physical
 */
export interface CreatePhysicalOrderOptions {
  /** ID du produit physical */
  physicalProductId: string;

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

  /** Adresse de livraison */
  shippingAddress: {
    street: string;
    city: string;
    state?: string;
    postal_code: string;
    country: string;
  };

  /** ID de la variante sélectionnée (optionnel) */
  variantId?: string;

  /** Quantité commandée */
  quantity?: number;

  /** ID de location inventaire (optionnel, sinon prend la première) */
  inventoryLocationId?: string;

  /** ID de la carte cadeau à utiliser (optionnel) */
  giftCardId?: string;

  /** Montant de la carte cadeau à utiliser (optionnel) */
  giftCardAmount?: number;

  /** Surcharge du mode checkout (sinon lu depuis payment_options produit) */
  checkoutMethod?: PhysicalCheckoutMethod;
}

/**
 * Résultat de la création de commande
 */
export interface CreatePhysicalOrderResult {
  /** ID de la commande créée */
  orderId: string;

  /** ID de l'order_item */
  orderItemId: string;

  /** ID de l'inventaire réservé */
  inventoryId: string;

  /** URL de checkout Moneroo (absent si paiement à la livraison) */
  checkoutUrl?: string;

  /** ID de transaction Moneroo */
  transactionId?: string;

  /** True si commande en paiement à la livraison */
  cashOnDelivery?: boolean;

  /** Numéro de commande lisible */
  orderNumber?: string;
}

type OrderRow = {
  id: string;
  store_id: string;
  customer_id: string;
  order_number: string;
  total_amount: number;
  currency: string;
  status: string;
  payment_status: string;
  created_at: string;
  order_items?: unknown[];
};

/**
 * Hook pour créer une commande de produit physique
 *
 * @example
 * ```typescript
 * const { mutateAsync: createPhysicalOrder, isPending } = useCreatePhysicalOrder();
 *
 * const handleBuy = async () => {
 *   const result = await createPhysicalOrder({
 *     physicalProductId: 'xxx',
 *     productId: 'yyy',
 *     storeId: 'zzz',
 *     customerEmail: 'user@example.com',
 *     shippingAddress: {
 *       street: '123 Main St',
 *       city: 'Paris',
 *       postal_code: '75001',
 *       country: 'France',
 *     },
 *     quantity: 2,
 *   });
 *
 *   // Rediriger vers Moneroo
 *   window.location.href = result.checkoutUrl;
 * };
 * ```
 */
export const useCreatePhysicalOrder = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (options: CreatePhysicalOrderOptions): Promise<CreatePhysicalOrderResult> => {
      const {
        physicalProductId,
        productId,
        storeId,
        customerEmail,
        customerName,
        customerPhone,
        shippingAddress,
        variantId,
        quantity = 1,
        inventoryLocationId,
        giftCardId,
        giftCardAmount = 0,
        checkoutMethod: checkoutMethodOverride,
      } = options;

      let resolvedPhysicalProductId = physicalProductId;

      // 1. Récupérer les détails du produit (avec payment_options)
      const { data: product, error: productError } = await supabase
        .from('products')
        .select(PRODUCT_FIELDS)
        .eq('id', productId)
        .single();

      if (productError || !product) {
        throw new Error('Produit non trouvé');
      }

      const parsedCheckout = parsePhysicalCheckoutOptions(
        product.payment_options as Parameters<typeof parsePhysicalCheckoutOptions>[0]
      );
      const checkoutMethod = checkoutMethodOverride ?? parsedCheckout.checkout_method;
      const isCashOnDelivery = checkoutMethod === 'cash_on_delivery';

      if (!resolvedPhysicalProductId) {
        const { data: physicalRow } = await supabase
          .from('physical_products')
          .select('id')
          .eq('product_id', productId)
          .maybeSingle();
        resolvedPhysicalProductId = physicalRow?.id ?? '';
      }

      if (!resolvedPhysicalProductId) {
        throw new Error('Produit physique non trouvé');
      }

      // Récupérer les options de paiement configurées
      const paymentOptions = (product.payment_options as {
        payment_type?: string;
        percentage_rate?: number;
      } | null) || { payment_type: 'full', percentage_rate: 30 };
      const paymentType = isCashOnDelivery ? 'full' : paymentOptions.payment_type || 'full';
      const percentageRate = paymentOptions.percentage_rate || 30;

      // 2. Récupérer les détails physiques
      const { data: physicalProduct, error: physicalError } = await supabase
        .from('physical_products')
        .select(PHYSICAL_PRODUCT_FIELDS)
        .eq('id', resolvedPhysicalProductId)
        .single();

      if (physicalError || !physicalProduct) {
        throw new Error('Produit physique non trouvé');
      }

      // 3. Récupérer la variante si spécifiée
      let variantPrice = 0;
      if (variantId) {
        const { data: variant, error: variantError } = await supabase
          .from('physical_product_variants')
          .select(PHYSICAL_PRODUCT_VARIANT_FIELDS)
          .eq('id', variantId)
          .single();

        if (variantError || !variant) {
          throw new Error('Variante non trouvée');
        }

        const variantRecord = variant as { is_available?: boolean; price_adjustment?: number };
        if (variantRecord.is_available === false) {
          throw new Error("Cette variante n'est pas disponible");
        }

        variantPrice = variantRecord.price_adjustment || 0;
      }

      const customerId = await findOrCreateStoreCustomer({
        storeId,
        email: customerEmail,
        name: customerName || customerEmail.split('@')[0],
        phone: customerPhone,
        address: `${shippingAddress.street}, ${shippingAddress.city}, ${shippingAddress.postal_code}`,
        city: shippingAddress.city,
        country: shippingAddress.country,
      });

      // 6. Calculer le prix total
      const unitPrice = (product.promotional_price || product.price) + variantPrice;
      const totalPrice = unitPrice * quantity;

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

      const unsafeOrdersClient = supabase as unknown as {
        from: (table: 'orders') => {
          insert: (values: Record<string, unknown>) => {
            select: (columns: string) => {
              single: () => Promise<{ data: Record<string, unknown> | null; error: unknown }>;
            };
          };
        };
      };
      const { data: order, error: orderError } = await unsafeOrdersClient
        .from('orders')
        .insert({
          store_id: storeId,
          customer_id: customerId,
          customer_email: customerEmail,
          order_number: orderNumber,
          total_amount: totalPrice - (giftCardAmount || 0),
          currency: product.currency,
          payment_status: isCashOnDelivery ? 'cod_pending' : 'pending',
          status: isCashOnDelivery ? 'confirmed' : 'pending',
          delivery_status: 'pending',
          payment_type: paymentType,
          percentage_paid: percentagePaid,
          remaining_amount: remainingAmount,
          affiliate_tracking_cookie: affiliateTrackingCookie,
          metadata: {
            checkout_method: checkoutMethod,
            guest_checkout: true,
          },
        })
        .select(
          'id, store_id, customer_id, order_number, total_amount, currency, status, payment_status, created_at'
        )
        .single();

      if (orderError || !order) {
        throw new Error('Erreur lors de la création de la commande');
      }
      const typedOrder = order as unknown as OrderRow;

      // 8a. Rédimer la carte cadeau si applicable (APRÈS création commande)
      if (giftCardId && giftCardAmount && giftCardAmount > 0) {
        try {
          const { data: redeemResult, error: redeemError } = await supabase.rpc(
            'redeem_gift_card',
            {
              p_gift_card_id: giftCardId,
              p_order_id: typedOrder.id,
              p_amount: giftCardAmount,
            }
          );

          if (redeemError) {
            logger.error('Error redeeming gift card:', redeemError);
            // Ne pas bloquer la commande
          } else if (redeemResult && redeemResult.length > 0 && !redeemResult[0].success) {
            logger.error('Gift card redemption failed:', redeemResult[0].message);
            // Ne pas bloquer la commande
          }
        } catch (giftCardError) {
          logger.error('Error in gift card redemption:', giftCardError);
          // Ne pas bloquer la commande
        }
      }

      // 9. Créer automatiquement la facture
      try {
        const { data: invoiceId, error: invoiceError } = await supabase.rpc(
          'create_invoice_from_order',
          {
            p_order_id: typedOrder.id,
          }
        );

        if (invoiceError) {
          logger.error('Error creating invoice:', invoiceError);
          // Ne pas bloquer la commande si la facture échoue
        } else {
          logger.info(`Invoice created: ${invoiceId}`);
        }
      } catch (invoiceErr) {
        logger.error('Error in invoice creation:', invoiceErr);
        // Ne pas bloquer la commande
      }

      // 10. Déclencher webhook order.created (asynchrone, ne bloque pas)
      import('@/lib/webhooks').then(({ triggerOrderCreatedWebhook }) => {
        triggerOrderCreatedWebhook(typedOrder.id, {
          store_id: typedOrder.store_id,
          customer_id: typedOrder.customer_id,
          order_number: typedOrder.order_number,
          status: typedOrder.status,
          total_amount: typedOrder.total_amount,
          currency: typedOrder.currency,
          payment_status: typedOrder.payment_status,
          created_at: typedOrder.created_at,
        }).catch(err => {
          logger.error('Error in analytics tracking', { error: err, orderId: typedOrder.id });
        });
      });

      // 11. Créer l'order_item avec les références spécialisées
      const unsafeOrderItemsClient = supabase as unknown as {
        from: (table: 'order_items') => {
          insert: (values: Record<string, unknown>) => {
            select: (columns: string) => {
              single: () => Promise<{ data: { id: string } | null; error: unknown }>;
            };
          };
          select: (columns: string) => {
            eq: (
              column: string,
              value: string
            ) => {
              single: () => Promise<{ data: Record<string, unknown> | null; error: unknown }>;
            };
          };
        };
      };
      const { data: orderItem, error: orderItemError } = await unsafeOrderItemsClient
        .from('order_items')
        .insert({
          order_id: typedOrder.id,
          product_id: productId,
          product_type: 'physical',
          physical_product_id: resolvedPhysicalProductId,
          variant_id: variantId,
          product_name: product.name,
          quantity,
          unit_price: unitPrice,
          total_price: totalPrice,
          item_metadata: {
            variant_price_adjustment: variantPrice,
            shipping_address: shippingAddress,
            ...(inventoryLocationId ? { preferred_inventory_id: inventoryLocationId } : {}),
          },
        })
        .select('id')
        .single();

      if (orderItemError || !orderItem) {
        throw new Error("Erreur lors de la création de l'élément de commande");
      }

      try {
        await reservePhysicalInventoryForOrder(typedOrder.id);
      } catch (stockErr) {
        throw stockErr instanceof Error ? stockErr : new Error('Stock insuffisant');
      }

      const { data: reservedItem } = await unsafeOrderItemsClient
        .from('order_items')
        .select('item_metadata')
        .eq('id', orderItem.id)
        .single();

      const reservedMeta = ((reservedItem as { item_metadata?: unknown } | null)?.item_metadata ??
        {}) as Record<string, unknown>;
      const inventoryId =
        typeof reservedMeta.inventory_id === 'string' ? reservedMeta.inventory_id : '';
      const inventoryLocation =
        typeof reservedMeta.inventory_location === 'string'
          ? reservedMeta.inventory_location
          : undefined;

      // 10. Créer un secured_payment si paiement escrow
      if (paymentType === 'delivery_secured') {
        await supabase.from('secured_payments').insert({
          order_id: typedOrder.id,
          total_amount: totalPrice,
          held_amount: amountToPay,
          status: 'held',
          hold_reason: 'delivery_confirmation',
          release_conditions: {
            requires_delivery_confirmation: true,
            auto_release_days: 7,
          },
        });
      }

      // 11. Paiement en ligne ou confirmation COD
      if (isCashOnDelivery) {
        return {
          orderId: typedOrder.id,
          orderItemId: orderItem.id,
          inventoryId,
          cashOnDelivery: true,
          orderNumber: typedOrder.order_number,
        };
      }

      const paymentDescription =
        paymentType === 'percentage'
          ? `Acompte ${percentageRate}%: ${product.name} x${quantity}`
          : paymentType === 'delivery_secured'
            ? `Paiement sécurisé: ${product.name} x${quantity}`
            : `Achat: ${product.name} x${quantity}`;

      const paymentResult = await initiatePayment({
        storeId,
        productId,
        orderId: typedOrder.id,
        customerId,
        amount: finalAmountToPay,
        currency: product.currency,
        description: paymentDescription,
        customerEmail,
        customerName: customerName || customerEmail.split('@')[0],
        customerPhone,
        metadata: {
          product_type: 'physical',
          physical_product_id: resolvedPhysicalProductId,
          variant_id: variantId,
          inventory_id: inventoryId || undefined,
          inventory_location: inventoryLocation,
          quantity,
          order_item_id: orderItem.id,
          shipping_address: shippingAddress,
          payment_type: paymentType,
          percentage_rate: paymentType === 'percentage' ? percentageRate : null,
          total_price: totalPrice,
          amount_paid: amountToPay,
          remaining_amount: remainingAmount,
        },
      });

      if (!paymentResult.success || !paymentResult.checkout_url) {
        await releasePhysicalInventoryForOrder(typedOrder.id);
        throw new Error("Erreur lors de l'initialisation du paiement");
      }

      // 12. Retourner le résultat
      return {
        orderId: typedOrder.id,
        orderItemId: orderItem.id,
        inventoryId,
        checkoutUrl: paymentResult.checkout_url,
        transactionId: paymentResult.transaction_id,
        orderNumber: typedOrder.order_number,
      };
    },

    onSuccess: async (data, variables) => {
      toast({
        title: data.cashOnDelivery ? '✅ Commande confirmée' : '✅ Commande créée',
        description: data.cashOnDelivery
          ? 'Paiement à la livraison — votre commande est enregistrée.'
          : 'Stock réservé. Redirection vers le paiement...',
      });

      // Déclencher webhook pour achat (en arrière-plan) - Système unifié
      if (data.orderId && variables.storeId) {
        import('@/lib/webhooks/unified-webhook-service')
          .then(({ triggerPurchaseWebhook }) => {
            // Récupérer les détails de la commande pour le payload
            (
              supabase as unknown as {
                from: (table: 'orders') => {
                  select: (columns: string) => {
                    eq: (
                      column: string,
                      value: string
                    ) => { single: () => Promise<{ data: Record<string, unknown> | null }> };
                  };
                };
              }
            )
              .from('orders')
              .select('*, order_items(*, product_id, products(*))')
              .eq('id', data.orderId)
              .single()
              .then(
                ({ data: orderData }) => {
                  if (orderData) {
                    const orderRecord = orderData as OrderRow;
                    triggerPurchaseWebhook(variables.storeId, orderRecord.id, {
                      order_id: orderRecord.id,
                      order_number: orderRecord.order_number || data.orderId,
                      customer_id: orderRecord.customer_id,
                      total_amount: orderRecord.total_amount,
                      currency: orderRecord.currency,
                      payment_status: orderRecord.payment_status,
                      status: orderRecord.status,
                      items: orderRecord.order_items || [],
                    }).catch(error => {
                      logger.error('Error triggering purchase webhook', { error });
                    });
                  }
                },
                error => {
                  logger.error('Error fetching order for webhook', { error });
                }
              );
          })
          .catch(error => {
            logger.error('Error loading unified webhook service', { error });
          });
      }
    },

    onError: (error: Error) => {
      logger.error('Physical order creation error', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de créer la commande',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour vérifier la disponibilité du stock
 */
export const useCheckStockAvailability = () => {
  return useMutation({
    mutationFn: async ({
      physicalProductId,
      quantity = 1,
    }: {
      physicalProductId: string;
      quantity?: number;
    }): Promise<{ available: boolean; availableQuantity: number }> => {
      const { data: inventories, error } = await supabase
        .from('physical_product_inventory')
        .select('quantity_available, quantity_reserved')
        .eq('physical_product_id', physicalProductId)
        .eq('track_inventory', true);

      if (error) {
        throw error;
      }

      const totalAvailable =
        inventories?.reduce(
          (sum, inv) => sum + ((inv.quantity_available || 0) - (inv.quantity_reserved || 0)),
          0
        ) || 0;

      return {
        available: totalAvailable >= quantity,
        availableQuantity: totalAvailable,
      };
    },
  });
};
