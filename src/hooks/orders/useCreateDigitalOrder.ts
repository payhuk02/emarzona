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
          console.error('License creation error:', licenseError);
          throw new Error('Erreur lors de la génération de la licence');
        }

        licenseId = license.id;
      }

      // 4. Générer un numéro de commande
      const { data: orderNumberData } = await supabase.rpc('generate_order_number');
      const orderNumber = orderNumberData || `ORD-${Date.now()}`;

      // 5. Créer la commande
      // Récupérer le cookie d'affiliation s'il existe
      const affiliateTrackingCookie = getAffiliateTrackingCookie();

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          store_id: storeId,
          customer_id: customerId,
          order_number: orderNumber,
          total_amount: product.promotional_price || product.price,
          currency: product.currency,
          payment_status: 'pending',
          status: 'pending',
          affiliate_tracking_cookie: affiliateTrackingCookie, // Inclure le cookie d'affiliation
        })
        .select('id')
        .single();

      if (orderError || !order) {
        throw new Error('Erreur lors de la création de la commande');
      }

      // 6. Créer l'order_item avec les références spécialisées
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

      // 7. Initier le paiement Moneroo
      const paymentResult = await initiateMonerooPayment({
        storeId,
        productId,
        orderId: order.id,
        customerId,
        amount: product.promotional_price || product.price,
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
        throw new Error('Erreur lors de l\'initialisation du paiement');
      }

      // 8. Retourner le résultat
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
      console.error('Digital order creation error:', error);
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
        console.error('Check purchase error:', error);
        return false;
      }

      return data && data.length > 0;
    },
  });
};

