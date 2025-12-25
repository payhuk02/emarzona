/**
 * Hook pour créer des commandes de produits digitaux
 * Date: 28 octobre 2025
 * 
 * Workflow complet:
 * 1. Créer/récupérer customer
 * 2. Générer licence si nécessaire
 * 3. Créer order + order_item
 * 4. Initier paiement Moneroo
 * 5. Retourner checkout URL
 */

import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { initiateMonerooPayment } from '@/lib/moneroo-payment';
import { useToast } from '@/hooks/use-toast';
import { getAffiliateTrackingCookie } from '@/hooks/useAffiliateTracking';
import { logger } from '@/lib/logger';

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
  
  /** URL de checkout Moneroo */
  checkoutUrl: string;
  
  /** ID de transaction Moneroo */
  transactionId: string;
}

/**
 * Génère une clé de licence unique
 */
function generateLicenseKey(): string {
  const segments = 4;
  const segmentLength = 4;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  
  return Array(segments)
    .fill(0)
    .map(() => 
      Array(segmentLength)
        .fill(0)
        .map(() => chars[Math.floor(Math.random() * chars.length)])
        .join('')
    )
    .join('-');
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
 *   // Rediriger vers Moneroo
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

      // 2. Récupérer ou créer le customer
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

      // 3. Générer une licence si nécessaire (AFTER purchase, with correct columns)
      let licenseId: string | undefined;

      if (generateLicense) {
        // Get authenticated user ID for license
        const { data: { user } } = await supabase.auth.getUser();
        
        const expiresAt = licenseExpiryDays
          ? new Date(Date.now() + licenseExpiryDays * 24 * 60 * 60 * 1000).toISOString()
          : null;

        const { data: license, error: licenseError } = await supabase
          .from('digital_licenses')
          .insert({
            digital_product_id: digitalProductId,
            user_id: user?.id || null, // ✅ Required for RLS
            license_key: generateLicenseKey(),
            license_type: licenseType,
            max_activations: licenseType === 'unlimited' ? -1 : maxActivations, // ✅ -1 for unlimited
            current_activations: 0, // ✅ Correct column name
            expires_at: expiresAt,
            status: 'pending', // ✅ Will become 'active' after payment confirmation
            customer_email: customerEmail, // ✅ Store customer email
            customer_name: customerName || customerEmail.split('@')[0], // ✅ Store customer name
          })
          .select('id')
          .single();

        if (licenseError || !license) {
          logger.error('License creation error', { error: licenseError, digitalProductId });
          throw new Error('Erreur lors de la génération de la licence');
        }

        licenseId = license.id;
      }

      // 4. Calculer le montant final (après carte cadeau si applicable)
      const baseAmount = product.promotional_price || product.price;
      const finalAmount = Math.max(0, baseAmount - (giftCardAmount || 0));

      // 5. Générer un numéro de commande
      const { data: orderNumberData } = await supabase.rpc('generate_order_number');
      const orderNumber = orderNumberData || `ORD-${Date.now()}`;

      // 6. Créer la commande
      // Récupérer le cookie d'affiliation s'il existe
      const affiliateTrackingCookie = getAffiliateTrackingCookie();

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          store_id: storeId,
          customer_id: customerId,
          order_number: orderNumber,
          total_amount: finalAmount,
          currency: product.currency,
          payment_status: 'pending',
          status: 'pending',
          affiliate_tracking_cookie: affiliateTrackingCookie,
        })
        .select('*')
        .single();

      if (orderError || !order) {
        throw new Error('Erreur lors de la création de la commande');
      }

      // 7. Rédimer la carte cadeau si applicable (APRÈS création commande)
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

      // 8. Créer automatiquement la facture
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

      // 9. Déclencher webhook order.created (asynchrone, ne bloque pas)
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
        }).catch((err) => {
          logger.error('Error in analytics tracking', { error: err, orderId: order.id });
        });
      });

      // 10. Créer l'order_item avec les références spécialisées
      const { data: orderItem, error: orderItemError } = await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: productId,
          product_type: 'digital',
          digital_product_id: digitalProductId,
          license_id: licenseId,
          product_name: product.name,
          quantity: 1,
          unit_price: product.promotional_price || product.price,
          total_price: product.promotional_price || product.price,
          item_metadata: {
            license_generated: !!licenseId,
            license_type: licenseType,
          },
        })
        .select('id')
        .single();

      if (orderItemError || !orderItem) {
        throw new Error('Erreur lors de la création de l\'élément de commande');
      }

      // 11. Initier le paiement Moneroo
      const paymentResult = await initiateMonerooPayment({
        storeId,
        productId,
        orderId: order.id,
        customerId,
        amount: finalAmount,
        currency: product.currency,
        description: `Achat: ${product.name}`,
        customerEmail,
        customerName: customerName || customerEmail.split('@')[0],
        customerPhone,
        metadata: {
          product_type: 'digital',
          digital_product_id: digitalProductId,
          license_id: licenseId,
          order_item_id: orderItem.id,
        },
      });

      if (!paymentResult.success || !paymentResult.checkout_url) {
        // Déclencher webhook pour échec de paiement si nécessaire
        throw new Error('Erreur lors de l\'initialisation du paiement');
      }

      // 12. Retourner le résultat
      return {
        orderId: order.id,
        orderItemId: orderItem.id,
        licenseId,
        checkoutUrl: paymentResult.checkout_url,
        transactionId: paymentResult.transaction_id,
      };
    },

    onSuccess: (data) => {
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
export const useHasPurchasedDigitalProduct = (
  digitalProductId: string,
  userEmail: string
) => {
  return useMutation({
    mutationFn: async (): Promise<boolean> => {
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          id,
          orders!inner (
            id,
            payment_status,
            customers!inner (
              email
            )
          )
        `)
        .eq('digital_product_id', digitalProductId)
        .eq('orders.payment_status', 'paid')
        .eq('orders.customers.email', userEmail)
        .limit(1);

      if (error) {
        logger.error('Check purchase error', { error, userId, productId });
        return false;
      }

      return data && data.length > 0;
    },
  });
};

