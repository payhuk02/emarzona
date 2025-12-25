/**
 * Hook universel pour créer une commande
 * Date: 28 octobre 2025
 * 
 * Router intelligent qui détecte le type de produit et appelle le bon hook
 */

import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCreateDigitalOrder, type CreateDigitalOrderOptions } from './useCreateDigitalOrder';
import { useCreatePhysicalOrder, type CreatePhysicalOrderOptions } from './useCreatePhysicalOrder';
import { useCreateServiceOrder, type CreateServiceOrderOptions } from './useCreateServiceOrder';
import { useCreateCourseOrder, type CreateCourseOrderOptions } from './useCreateCourseOrder';
import { useCreateArtistOrder, type CreateArtistOrderOptions } from './useCreateArtistOrder';
import { initiateMonerooPayment } from '@/lib/moneroo-payment';
import { getAffiliateTrackingCookie } from '@/hooks/useAffiliateTracking';
import { logger } from '@/lib/logger';

/**
 * Options génériques pour créer une commande
 */
export interface CreateOrderOptions {
  /** ID du produit */
  productId: string;
  
  /** ID du store */
  storeId: string;
  
  /** Email du client */
  customerEmail: string;
  
  /** Nom du client (optionnel) */
  customerName?: string;
  
  /** Téléphone du client (optionnel) */
  customerPhone?: string;
  
  /** Quantité (pour produits physiques) */
  quantity?: number;
  
  /** Options spécifiques selon le type */
  digitalOptions?: Partial<CreateDigitalOrderOptions>;
  physicalOptions?: Partial<CreatePhysicalOrderOptions>;
  serviceOptions?: Partial<CreateServiceOrderOptions>;
  courseOptions?: Partial<CreateCourseOrderOptions>;
  artistOptions?: Partial<CreateArtistOrderOptions>;
}

/**
 * Hook universel pour créer une commande
 * Détecte automatiquement le type de produit et appelle le bon hook
 * 
 * @example
 * ```typescript
 * const { mutateAsync: createOrder, isPending } = useCreateOrder();
 * 
 * const handleBuy = async () => {
 *   const result = await createOrder({
 *     productId: 'xxx',
 *     storeId: 'yyy',
 *     customerEmail: 'user@example.com',
 *     // Options spécifiques seront automatiquement passées selon le type
 *   });
 *   
 *   window.location.href = result.checkoutUrl;
 * };
 * ```
 */
export const useCreateOrder = () => {
  const { toast } = useToast();
  const { mutateAsync: createDigitalOrder } = useCreateDigitalOrder();
  const { mutateAsync: createPhysicalOrder } = useCreatePhysicalOrder();
  const { mutateAsync: createServiceOrder } = useCreateServiceOrder();
  const { mutateAsync: createCourseOrder } = useCreateCourseOrder();
  const { mutateAsync: createArtistOrder } = useCreateArtistOrder();

  return useMutation({
    mutationFn: async (options: CreateOrderOptions) => {
      const {
        productId,
        storeId,
        customerEmail,
        customerName,
        customerPhone,
        quantity = 1,
        digitalOptions,
        physicalOptions,
        serviceOptions,
        courseOptions,
        artistOptions,
      } = options;

      // 1. Récupérer le produit pour déterminer son type
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*, product_type')
        .eq('id', productId)
        .single();

      if (productError || !product) {
        throw new Error('Produit non trouvé');
      }

      const productType = product.product_type;

      // 2. Router vers le bon hook selon le type
      switch (productType) {
        case 'digital': {
          // Récupérer le digital_product_id
          const { data: digitalProduct } = await supabase
            .from('digital_products')
            .select('id')
            .eq('product_id', productId)
            .single();

          if (!digitalProduct) {
            throw new Error('Produit digital non trouvé');
          }

          return await createDigitalOrder({
            digitalProductId: digitalProduct.id,
            productId,
            storeId,
            customerEmail,
            customerName,
            customerPhone,
            generateLicense: digitalOptions?.generateLicense ?? true,
            licenseType: digitalOptions?.licenseType || 'single',
            maxActivations: digitalOptions?.maxActivations,
            licenseExpiryDays: digitalOptions?.licenseExpiryDays,
          });
        }

        case 'physical': {
          // Récupérer le physical_product_id
          const { data: physicalProduct } = await supabase
            .from('physical_products')
            .select('id')
            .eq('product_id', productId)
            .single();

          if (!physicalProduct) {
            throw new Error('Produit physique non trouvé');
          }

          if (!physicalOptions?.shippingAddress) {
            throw new Error('Adresse de livraison requise pour un produit physique');
          }

          return await createPhysicalOrder({
            physicalProductId: physicalProduct.id,
            productId,
            storeId,
            customerEmail,
            customerName,
            customerPhone,
            shippingAddress: physicalOptions.shippingAddress,
            variantId: physicalOptions.variantId,
            quantity,
            inventoryLocationId: physicalOptions.inventoryLocationId,
          });
        }

        case 'service': {
          // Récupérer le service_product_id
          const { data: serviceProduct } = await supabase
            .from('service_products')
            .select('id')
            .eq('product_id', productId)
            .single();

          if (!serviceProduct) {
            throw new Error('Service non trouvé');
          }

          if (!serviceOptions?.bookingDateTime) {
            throw new Error('Date et heure de réservation requises pour un service');
          }

          return await createServiceOrder({
            serviceProductId: serviceProduct.id,
            productId,
            storeId,
            customerEmail,
            customerName,
            customerPhone,
            bookingDateTime: serviceOptions.bookingDateTime,
            durationMinutes: serviceOptions.durationMinutes,
            staffId: serviceOptions.staffId,
            numberOfParticipants: serviceOptions.numberOfParticipants || 1,
            notes: serviceOptions.notes,
          });
        }

        case 'course': {
          // Récupérer le course_id
          const { data: course } = await supabase
            .from('courses')
            .select('id')
            .eq('product_id', productId)
            .single();

          if (!course) {
            throw new Error('Cours non trouvé');
          }

          return await createCourseOrder({
            courseId: course.id,
            productId,
            storeId,
            customerEmail,
            customerName,
            customerPhone,
            quantity,
            giftCardId: courseOptions?.giftCardId,
            giftCardAmount: courseOptions?.giftCardAmount,
          });
        }

        case 'artist': {
          // Récupérer le artist_product_id
          const { data: artistProduct } = await supabase
            .from('artist_products')
            .select('id')
            .eq('product_id', productId)
            .single();

          if (!artistProduct) {
            throw new Error('Œuvre d\'artiste non trouvée');
          }

          return await createArtistOrder({
            artistProductId: artistProduct.id,
            productId,
            storeId,
            customerEmail,
            customerName,
            customerPhone,
            shippingAddress: artistOptions?.shippingAddress,
            quantity,
            giftCardId: artistOptions?.giftCardId,
            giftCardAmount: artistOptions?.giftCardAmount,
          });
        }

        case 'generic':
        default: {
          // Pour les produits génériques, utiliser l'ancien système
          toast({
            title: 'ℹ️ Type de produit',
            description: `Utilisation du flux générique pour ${productType}`,
          });

          // Créer customer
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

          // Créer order générique
          const { data: orderNumberData } = await supabase.rpc('generate_order_number');
          const orderNumber = orderNumberData || `ORD-${Date.now()}`;

          const totalPrice = (product.promotional_price || product.price) * quantity;

          // Récupérer le cookie d'affiliation s'il existe
          const affiliateTrackingCookie = getAffiliateTrackingCookie();

          const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
              store_id: storeId,
              customer_id: customerId,
              order_number: orderNumber,
              total_amount: totalPrice,
              currency: product.currency,
              payment_status: 'pending',
              status: 'pending',
              affiliate_tracking_cookie: affiliateTrackingCookie, // Inclure le cookie d'affiliation
            })
            .select('*')
            .single();

          if (orderError || !order) {
            throw new Error('Erreur lors de la création de la commande');
          }

          // Déclencher webhook order.created (asynchrone, ne bloque pas)
          if (order) {
            import('@/lib/webhooks/webhook-system').then(({ triggerWebhook }) => {
              triggerWebhook(order.store_id, 'order.created', {
                order_id: order.id,
                order_number: order.order_number,
                customer_id: order.customer_id,
                total_amount: order.total_amount,
                currency: order.currency,
                status: order.status,
                payment_status: order.payment_status,
                created_at: order.created_at,
              }).catch((err) => {
                logger.error('Error triggering webhook', { error: err, orderId: order.id });
              });
            });
          }

          // Créer order_item générique
          const { data: orderItem, error: orderItemError } = await supabase
            .from('order_items')
            .insert({
              order_id: order.id,
              product_id: productId,
              product_type: productType,
              product_name: product.name,
              quantity,
              unit_price: product.promotional_price || product.price,
              total_price: totalPrice,
            })
            .select('id')
            .single();

          if (orderItemError || !orderItem) {
            throw new Error('Erreur lors de la création de l\'élément de commande');
          }

          // Initier paiement
          const paymentResult = await initiateMonerooPayment({
            storeId,
            productId,
            orderId: order.id,
            customerId,
            amount: totalPrice,
            currency: product.currency,
            description: `Achat: ${product.name}`,
            customerEmail,
            customerName: customerName || customerEmail.split('@')[0],
            customerPhone,
            metadata: {
              product_type: productType,
              order_item_id: orderItem.id,
            },
          });

          if (!paymentResult.success || !paymentResult.checkout_url) {
            throw new Error('Erreur lors de l\'initialisation du paiement');
          }

          return {
            orderId: order.id,
            orderItemId: orderItem.id,
            checkoutUrl: paymentResult.checkout_url,
            transactionId: paymentResult.transaction_id,
          };
        }
      }
    },

    onError: (error: Error) => {
      logger.error('Order creation error', { error: error.message });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de créer la commande',
        variant: 'destructive',
      });
    },
  });
};

