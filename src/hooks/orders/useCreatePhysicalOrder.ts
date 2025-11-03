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
import { initiateMonerooPayment } from '@/lib/moneroo-payment';
import { useToast } from '@/hooks/use-toast';
import { getAffiliateTrackingCookie } from '@/hooks/useAffiliateTracking';
import { logger } from '@/lib/logger';

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
  
  /** URL de checkout Moneroo */
  checkoutUrl: string;
  
  /** ID de transaction Moneroo */
  transactionId: string;
}

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
      } = options;

      // 1. Récupérer les détails du produit (avec payment_options)
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (productError || !product) {
        throw new Error('Produit non trouvé');
      }

      // Récupérer les options de paiement configurées
      const paymentOptions = (product.payment_options as any) || { payment_type: 'full', percentage_rate: 30 };
      const paymentType = paymentOptions.payment_type || 'full';
      const percentageRate = paymentOptions.percentage_rate || 30;

      // 2. Récupérer les détails physiques
      const { data: physicalProduct, error: physicalError } = await supabase
        .from('physical_products')
        .select('*')
        .eq('id', physicalProductId)
        .single();

      if (physicalError || !physicalProduct) {
        throw new Error('Produit physique non trouvé');
      }

      // 3. Récupérer la variante si spécifiée
      let variantPrice = 0;
      if (variantId) {
        const { data: variant, error: variantError } = await supabase
          .from('physical_product_variants')
          .select('*')
          .eq('id', variantId)
          .single();

        if (variantError || !variant) {
          throw new Error('Variante non trouvée');
        }

        if (!variant.is_available) {
          throw new Error('Cette variante n\'est pas disponible');
        }

        variantPrice = variant.price_adjustment || 0;
      }

      // 4. Vérifier et réserver le stock
      const { data: inventories, error: inventoryError } = await supabase
        .from('physical_product_inventory')
        .select('*')
        .eq('physical_product_id', physicalProductId)
        .eq('track_inventory', true)
        .order('quantity_available', { ascending: false });

      if (inventoryError) {
        throw new Error('Erreur lors de la vérification du stock');
      }

      // Trouver l'inventaire avec stock suffisant
      let selectedInventory = inventories?.find(inv => 
        (inv.quantity_available || 0) >= quantity
      );

      // Si un inventoryLocationId est spécifié, utiliser celui-là
      if (inventoryLocationId) {
        selectedInventory = inventories?.find(inv => inv.id === inventoryLocationId);
      }

      if (!selectedInventory) {
        throw new Error(`Stock insuffisant (demandé: ${quantity})`);
      }

      // Réserver le stock
      const { error: reserveError } = await supabase
        .from('physical_product_inventory')
        .update({
          quantity_reserved: (selectedInventory.quantity_reserved || 0) + quantity,
        })
        .eq('id', selectedInventory.id);

      if (reserveError) {
        throw new Error('Erreur lors de la réservation du stock');
      }

      // 5. Récupérer ou créer le customer
      let customerId: string;
      
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('store_id', storeId)
        .eq('email', customerEmail)
        .single();

      if (existingCustomer) {
        customerId = existingCustomer.id;
        
        // Mettre à jour l'adresse
        await supabase
          .from('customers')
          .update({
            address: `${shippingAddress.street}, ${shippingAddress.city}, ${shippingAddress.postal_code}`,
            city: shippingAddress.city,
            country: shippingAddress.country,
          })
          .eq('id', customerId);
      } else {
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert({
            store_id: storeId,
            email: customerEmail,
            name: customerName || customerEmail.split('@')[0],
            phone: customerPhone,
            address: `${shippingAddress.street}, ${shippingAddress.city}, ${shippingAddress.postal_code}`,
            city: shippingAddress.city,
            country: shippingAddress.country,
          })
          .select('id')
          .single();

        if (customerError || !newCustomer) {
          // Annuler la réservation en cas d'erreur
          await supabase
            .from('physical_product_inventory')
            .update({
              quantity_reserved: (selectedInventory.quantity_reserved || 0),
            })
            .eq('id', selectedInventory.id);
            
          throw new Error('Erreur lors de la création du client');
        }

        customerId = newCustomer.id;
      }

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
          delivery_status: 'pending',
          payment_type: paymentType,
          percentage_paid: percentagePaid,
          remaining_amount: remainingAmount,
          affiliate_tracking_cookie: affiliateTrackingCookie,
        })
        .select('*')
        .single();

      if (orderError || !order) {
        // Annuler la réservation
        await supabase
          .from('physical_product_inventory')
          .update({
            quantity_reserved: (selectedInventory.quantity_reserved || 0),
          })
          .eq('id', selectedInventory.id);
          
        throw new Error('Erreur lors de la création de la commande');
      }

      // 8a. Rédimer la carte cadeau si applicable (APRÈS création commande)
      if (giftCardId && giftCardAmount && giftCardAmount > 0) {
        try {
          const { data: redeemResult, error: redeemError } = await supabase.rpc('redeem_gift_card', {
            p_gift_card_id: giftCardId,
            p_order_id: order.id,
            p_amount: giftCardAmount,
          });

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
        const { data: invoiceId, error: invoiceError } = await supabase.rpc('create_invoice_from_order', {
          p_order_id: order.id,
        });

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
        triggerOrderCreatedWebhook(order.id, {
          store_id: order.store_id,
          customer_id: order.customer_id,
          order_number: order.order_number,
          status: order.status,
          total_amount: order.total_amount,
          currency: order.currency,
          payment_status: order.payment_status,
          created_at: order.created_at,
        }).catch(console.error);
      });

      // 11. Créer l'order_item avec les références spécialisées
      const { data: orderItem, error: orderItemError } = await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: productId,
          product_type: 'physical',
          physical_product_id: physicalProductId,
          variant_id: variantId,
          product_name: product.name,
          quantity,
          unit_price: unitPrice,
          total_price: totalPrice,
          item_metadata: {
            inventory_id: selectedInventory.id,
            inventory_location: selectedInventory.location_name,
            variant_price_adjustment: variantPrice,
            shipping_address: shippingAddress,
          },
        })
        .select('id')
        .single();

      if (orderItemError || !orderItem) {
        // Annuler la réservation
        await supabase
          .from('physical_product_inventory')
          .update({
            quantity_reserved: (selectedInventory.quantity_reserved || 0),
          })
          .eq('id', selectedInventory.id);
          
        throw new Error('Erreur lors de la création de l\'élément de commande');
      }

      // 10. Créer un secured_payment si paiement escrow
      if (paymentType === 'delivery_secured') {
        await supabase
          .from('secured_payments')
          .insert({
            order_id: order.id,
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

      // 11. Initier le paiement Moneroo (avec amountToPay adapté)
      const paymentDescription = paymentType === 'percentage' 
        ? `Acompte ${percentageRate}%: ${product.name} x${quantity}`
        : paymentType === 'delivery_secured'
        ? `Paiement sécurisé: ${product.name} x${quantity}`
        : `Achat: ${product.name} x${quantity}`;

      const paymentResult = await initiateMonerooPayment({
        storeId,
        productId,
        orderId: order.id,
        customerId,
        amount: finalAmountToPay,
        currency: product.currency,
        description: paymentDescription,
        customerEmail,
        customerName: customerName || customerEmail.split('@')[0],
        customerPhone,
        metadata: {
          product_type: 'physical',
          physical_product_id: physicalProductId,
          variant_id: variantId,
          inventory_id: selectedInventory.id,
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
        // Annuler la réservation
        await supabase
          .from('physical_product_inventory')
          .update({
            quantity_reserved: (selectedInventory.quantity_reserved || 0),
          })
          .eq('id', selectedInventory.id);
          
        throw new Error('Erreur lors de l\'initialisation du paiement');
      }

      // 12. Retourner le résultat
      return {
        orderId: order.id,
        orderItemId: orderItem.id,
        inventoryId: selectedInventory.id,
        checkoutUrl: paymentResult.checkout_url,
        transactionId: paymentResult.transaction_id,
      };
    },

    onSuccess: (data) => {
      toast({
        title: '✅ Commande créée',
        description: 'Stock réservé. Redirection vers le paiement...',
      });
    },

    onError: (error: Error) => {
      console.error('Physical order creation error:', error);
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

      const totalAvailable = inventories?.reduce(
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

