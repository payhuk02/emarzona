/**
 * Page Checkout - Processus de commande unifié
 * Date: 26 Janvier 2025
 *
 * Fonctionnalités:
 * - Récapitulatif panier
 * - Formulaire informations livraison
 * - Calcul taxes automatique
 * - Calcul shipping automatique
 * - Validation formulaires
 * - Intégration Moneroo
 * - Support 4 types produits
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useCart } from '@/hooks/cart/useCart';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { initiatePayment } from '@/lib/payment-service';
import { getAffiliateInfo } from '@/lib/affiliation-tracking';
import { safeRedirect } from '@/lib/url-validator';
import { logger } from '@/lib/logger';
import GiftCardInput from '@/components/checkout/GiftCardInput';
import CouponInput from '@/components/checkout/CouponInput';
import { PaymentProviderSelector } from '@/components/checkout/PaymentProviderSelector';
import { FormFieldWithValidation } from '@/components/checkout/FormFieldWithValidation';
import type { CartItem } from '@/types/cart';
import {
  ShoppingBag,
  MapPin,
  CreditCard,
  ArrowRight,
  AlertCircle,
  Loader2,
  Tag,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface ShippingAddress {
  full_name: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  postal_code: string;
  country: string;
  state?: string;
}

export default function Checkout() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { items, summary, isLoading: cartLoading } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);

  // State pour la carte cadeau
  const [appliedGiftCard, setAppliedGiftCard] = useState<{
    id: string;
    balance: number;
    code: string;
  } | null>(null);

  // State pour le coupon (nouveau système)
  const [appliedCouponCode, setAppliedCouponCode] = useState<{
    id: string;
    discountAmount: number;
    code: string;
  } | null>(null);

  // State pour charger le store_id (nécessaire pour la carte cadeau et coupon)
  const [storeId, setStoreId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [isFirstOrder, setIsFirstOrder] = useState<boolean>(false);

  // State pour le provider de paiement sélectionné
  const [selectedPaymentProvider, setSelectedPaymentProvider] = useState<'moneroo'>('moneroo');

  // State pour la gestion multi-stores
  const [isMultiStore, setIsMultiStore] = useState<boolean>(false);
  interface StoreGroup {
    items: CartItem[];
    store_name?: string;
    subtotal?: number;
    tax_amount?: number;
    shipping_amount?: number;
    discount_amount?: number;
    total?: number;
  }
  const [storeGroups, setStoreGroups] = useState<Map<string, StoreGroup>>(new Map());
  const [isCheckingStores, setIsCheckingStores] = useState<boolean>(false);

  // Récupérer l'utilisateur pour pré-remplir le formulaire
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user;
    },
  });

  // Vérifier si le panier contient des produits de plusieurs boutiques
  useEffect(() => {
    const checkMultiStore = async () => {
      if (items.length === 0) {
        setIsMultiStore(false);
        setStoreGroups(new Map());
        return;
      }

      setIsCheckingStores(true);

      try {
        // Récupérer tous les store_id des produits du panier
        const productIds = items.map(item => item.product_id);
        const { data: products, error } = await supabase
          .from('products')
          .select('id, store_id, name')
          .in('id', productIds);

        if (error) {
          logger.error('Error checking stores:', error);
          setIsCheckingStores(false);
          return;
        }

        if (products && products.length > 0) {
          // Compter les stores uniques
          const uniqueStoreIds = new Set(
            products
              .map(p => p.store_id)
              .filter((id): id is string => id !== null && id !== undefined)
          );

          const hasMultipleStores = uniqueStoreIds.size > 1;
          setIsMultiStore(hasMultipleStores);

          if (hasMultipleStores) {
            // Grouper les items par boutique (fonction simplifiée pour l'instant)
            const groups = new Map<string, StoreGroup>();
            const  skippedItems: CartItem[] = [];

            for (const item of items) {
              const product = products.find(p => p.id === item.product_id);
              if (product && product.store_id) {
                if (!groups.has(product.store_id)) {
                  groups.set(product.store_id, { items: [] });
                }
                const group = groups.get(product.store_id)!;
                group.items.push(item);
                // Calculer le subtotal pour ce groupe
                group.subtotal = (group.subtotal || 0) + item.unit_price * item.quantity;
              } else {
                skippedItems.push(item);
              }
            }

            setStoreGroups(groups);

            // Afficher un avertissement si des produits ont été ignorés
            if (skippedItems.length > 0) {
              const productNames = skippedItems
                .map(item => `${item.product_name} (x${item.quantity})`)
                .join(', ');
              toast({
                title: 'Produits ignorés',
                description: `${skippedItems.length} produit(s) ignoré(s) car ils n'ont pas de boutique associée : ${productNames}`,
                variant: 'default',
              });
            }

            // Pour la compatibilité, garder le premier store_id
            const firstStoreId = Array.from(uniqueStoreIds)[0] as string;
            setStoreId(firstStoreId);
          } else {
            // Un seul store, comportement normal
            const firstStoreId = Array.from(uniqueStoreIds)[0] as string;
            setStoreId(firstStoreId || null);
            setStoreGroups(new Map());
          }
        }
      } catch ( _error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('Error in checkMultiStore:', { error: errorMessage });
      } finally {
        setIsCheckingStores(false);
      }
    };

    checkMultiStore();
  }, [items]);

  // Restaurer le code promo depuis localStorage au chargement
  // IMPORTANT: Ne charger que si le coupon n'est pas déjà chargé
  // pour éviter la double application
  useEffect(() => {
    // Ne charger que si appliedCouponCode n'est pas déjà défini
    if (appliedCouponCode) {
      return; // Déjà chargé, ne pas recharger
    }

    try {
      const savedCoupon = localStorage.getItem('applied_coupon');
      if (savedCoupon) {
        const coupon = JSON.parse(savedCoupon) as unknown;
        const c = coupon as {
          id?: unknown;
          discountAmount?: unknown;
          code?: unknown;
          appliedAt?: unknown;
        };
        // Vérifier que le coupon n'est pas expiré (24h)
        if (c.appliedAt) {
          const appliedAt = new Date(String(c.appliedAt));
          const now = new Date();
          const hoursDiff = (now.getTime() - appliedAt.getTime()) / (1000 * 60 * 60);

          if (hoursDiff >= 24) {
            // Coupon expiré, le supprimer
            try {
              localStorage.removeItem('applied_coupon');
            } catch {
              // ignore
            }
            return;
          }
        }

        const discountAmount = Number(c.discountAmount);
        if (
          typeof c.id === 'string' &&
          typeof c.code === 'string' &&
          Number.isFinite(discountAmount)
        ) {
          setAppliedCouponCode({
            id: c.id,
            discountAmount, // S'assurer que c'est un nombre
            code: c.code,
          });
        }
      }
    } catch ( _error: unknown) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.warn('Error loading coupon from localStorage:', errorObj);
      try {
        localStorage.removeItem('applied_coupon');
      } catch {
        // ignore
      }
    }
  }, [appliedCouponCode]); // Ne s'exécute qu'une fois au montage ou quand appliedCouponCode change

  // Charger le customer_id et vérifier si c'est la première commande
  useEffect(() => {
    if (user?.email && storeId) {
      supabase
        .from('customers')
        .select('id')
        .eq('store_id', storeId)
        .eq('email', user.email)
        .single()
        .then(({ data: customer }) => {
          if (customer?.id) {
            setCustomerId(customer.id);

            // Vérifier si c'est la première commande
            supabase
              .from('orders')
              .select('id', { count: 'exact', head: true })
              .eq('customer_id', customer.id)
              .in('payment_status', ['completed', 'pending'])
              .then(({ count }) => {
                setIsFirstOrder(count === 0);
              });
          } else {
            // Nouveau client = première commande
            setIsFirstOrder(true);
          }
        });
    }
  }, [user, storeId]);

  // Charger la carte cadeau depuis localStorage si disponible
  useEffect(() => {
    let  savedGiftCard: string | null = null;
    try {
      savedGiftCard = localStorage.getItem('applied_gift_card');
    } catch {
      savedGiftCard = null;
    }
    if (savedGiftCard) {
      try {
        const giftCard = JSON.parse(savedGiftCard) as unknown;
        const g = giftCard as { id?: unknown; balance?: unknown; code?: unknown };
        const balance = Number(g.balance);
        if (typeof g.id === 'string' && typeof g.code === 'string' && Number.isFinite(balance)) {
          setAppliedGiftCard({ id: g.id, balance, code: g.code });
        }
      } catch (e) {
        try {
          localStorage.removeItem('applied_gift_card');
        } catch {
          // ignore
        }
      }
    }
  }, []);
  const [formData, setFormData] = useState<ShippingAddress>({
    full_name: '',
    email: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    postal_code: '',
    country: 'BF', // Burkina Faso par défaut
    state: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ShippingAddress, string>>>({});

  // Pré-remplir avec données utilisateur si disponible
  useMemo(() => {
    if (user?.email && !formData.email) {
      setFormData(prev => ({
        ...prev,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || '',
      }));
    }
  }, [user]);

  // ============================================
  // CALCUL AVEC USEMEMO ET DÉPENDANCES EXPLICITES POUR GARANTIR LA MISE À JOUR
  // IMPORTANT: summary.subtotal inclut déjà les remises sur items (voir useCart.ts ligne 108-111)
  // Donc on ne soustrait QUE le coupon, pas les remises items qui sont déjà dans summary.subtotal
  // ============================================

  // 1. Calculer les remises sur les items (pour affichage uniquement)
  // NOTE: Ces remises sont DÉJÀ incluses dans summary.subtotal, on ne les soustrait pas
  const itemDiscounts = useMemo(() => {
    return items.reduce((total, item) => total + (item.discount_amount || 0) * item.quantity, 0);
  }, [items]);

  // 2. Montant du coupon - Extraction explicite avec dépendances individuelles
  const couponDiscount = useMemo(() => {
    if (!appliedCouponCode || !appliedCouponCode.discountAmount) return 0;
    return Number(appliedCouponCode.discountAmount);
  }, [appliedCouponCode?.id, appliedCouponCode?.discountAmount, appliedCouponCode?.code]);

  // 3. Sous-total après remises
  // IMPORTANT: summary.subtotal = prix total - remises items (déjà calculé dans useCart)
  // On soustrait UNIQUEMENT le coupon, pas les remises items qui sont déjà dans summary.subtotal
  const subtotalAfterDiscounts = useMemo(() => {
    return Math.max(0, summary.subtotal - couponDiscount);
  }, [summary.subtotal, couponDiscount]);

  // Calculer shipping - Support spécialisé pour œuvres d'artiste
  const shippingAmount = useMemo(() => {
    // Vérifier si le panier contient des œuvres d'artiste nécessitant un shipping spécialisé
    const artistProducts = items.filter(item => item.product_type === 'artist');

    if (artistProducts.length > 0) {
      // Pour les œuvres d'artiste, utiliser le calcul spécialisé
      // Le calcul sera fait dynamiquement via le hook useCalculateArtistShipping
      // Pour l'instant, estimation basique
      if (formData.country === 'BF') {
        return 15000; // Shipping spécialisé BF (plus cher que standard)
      }
      return 35000; // Shipping spécialisé international (emballage + assurance)
    }

    // Shipping standard pour autres produits
    if (formData.country === 'BF') {
      return 5000; // Frais de livraison Burkina Faso
    }
    return 15000; // International
  }, [formData.country, items]);

  // Calculer taxes automatiquement via la fonction RPC
  type TaxBreakdownItem = {
    type: string;
    name: string;
    rate: number;
    amount: number;
    applies_to_shipping: boolean;
    tax_inclusive: boolean;
    is_default?: boolean;
  };

  type TaxCalculationResult = {
    tax_amount: number;
    tax_breakdown: TaxBreakdownItem[];
    subtotal: number;
    shipping_amount: number;
    total_with_tax: number;
  };

  const isTaxCalculationResult = (value: unknown): value is TaxCalculationResult => {
    if (!value || typeof value !== 'object') return false;
    const v = value as Record<string, unknown>;
    return typeof v.tax_amount === 'number' && Array.isArray(v.tax_breakdown);
  };

  // Utilise les configurations de taxes de la base de données
  // NOTE: Cette query doit être après la déclaration de subtotalAfterDiscounts et shippingAmount
  const { data: taxCalculation, isLoading: taxLoading } = useQuery({
    queryKey: [
      'tax-calculation',
      subtotalAfterDiscounts,
      shippingAmount,
      formData.country,
      formData.state,
      storeId,
      items.map(i => i.product_type),
    ],
    queryFn: async () => {
      if (!formData.country || subtotalAfterDiscounts <= 0) {
        return null;
      }

      const productTypes = Array.from(new Set(items.map(item => item.product_type)));

      const { data, error } = await supabase.rpc('calculate_taxes_pre_order' as never, {
        p_subtotal: subtotalAfterDiscounts,
        p_shipping_amount: shippingAmount,
        p_country_code: formData.country,
        p_state_province: formData.state || null,
        p_store_id: storeId || null,
        p_product_types: productTypes.length > 0 ? productTypes : null,
      });

      if (error) {
        logger.error('Error calculating taxes', { error });
        // Fallback sur taux par défaut en cas d'erreur
        return {
          tax_amount: subtotalAfterDiscounts * 0.18,
          tax_breakdown: [
            {
              type: 'VAT',
              name: 'TVA',
              rate: 18,
              amount: subtotalAfterDiscounts * 0.18,
              applies_to_shipping: false,
              tax_inclusive: false,
              is_default: true,
            },
          ],
          subtotal: subtotalAfterDiscounts,
          shipping_amount: shippingAmount,
          total_with_tax: subtotalAfterDiscounts + shippingAmount + subtotalAfterDiscounts * 0.18,
        };
      }

      return data;
    },
    enabled: !!formData.country && subtotalAfterDiscounts > 0,
    staleTime: 30000, // Cache pendant 30 secondes
  });

  // 5. Calcul des taxes via RPC (utilise les configurations de la base de données)
  const taxAmount = useMemo(() => {
    if (isTaxCalculationResult(taxCalculation)) return Number(taxCalculation.tax_amount);
    // Fallback si pas encore chargé ou erreur
    return Math.max(0, subtotalAfterDiscounts * 0.18);
  }, [taxCalculation, subtotalAfterDiscounts]);

  // Breakdown des taxes pour affichage détaillé
  const taxBreakdown = useMemo(() => {
    if (isTaxCalculationResult(taxCalculation)) return taxCalculation.tax_breakdown;
    return [];
  }, [taxCalculation]);

  // 6. Montant avec taxes
  const subtotalWithTaxes = useMemo(() => {
    return subtotalAfterDiscounts + taxAmount;
  }, [subtotalAfterDiscounts, taxAmount]);

  // 7. Montant avec shipping
  const subtotalWithShipping = useMemo(() => {
    return subtotalWithTaxes + shippingAmount;
  }, [subtotalWithTaxes, shippingAmount]);

  // 8. Montant à utiliser de la carte cadeau (calculé après taxes et shipping)
  const giftCardAmount = useMemo(() => {
    if (!appliedGiftCard || !appliedGiftCard.balance) return 0;
    return Math.min(appliedGiftCard.balance, subtotalWithShipping);
  }, [appliedGiftCard?.id, appliedGiftCard?.balance, subtotalWithShipping]);

  // 9. Total final - Calculé avec toutes les dépendances pour garantir la mise à jour
  const finalTotal = useMemo(() => {
    return Math.max(0, subtotalWithShipping - giftCardAmount);
  }, [subtotalWithShipping, giftCardAmount]);

  // Vérification du calcul du coupon (logs uniquement en développement)
  useEffect(() => {
    if (import.meta.env.DEV && appliedCouponCode) {
      logger.debug('[Checkout] Coupon appliqué', {
        couponCode: appliedCouponCode.code,
        discountAmount: appliedCouponCode.discountAmount,
        finalTotal,
      });
    }
  }, [
    appliedCouponCode?.id,
    appliedCouponCode?.discountAmount,
    appliedCouponCode?.code,
    summary.subtotal,
    itemDiscounts,
    couponDiscount,
    subtotalAfterDiscounts,
    taxAmount,
    subtotalWithShipping,
    giftCardAmount,
    finalTotal,
  ]);

  /**
   * Traite le checkout multi-stores
   * Crée une commande par boutique et initie les paiements
   */
  const processMultiStoreCheckout = async ({
    storeGroups,
    formData,
    checkoutUser,
    taxAmount,
    shippingAmount,
    couponDiscount,
    giftCardAmount,
    appliedCouponCode,
    appliedGiftCard,
    selectedPaymentProvider,
  }: {
    storeGroups: Map<string, StoreGroup>;
    formData: ShippingAddress;
    checkoutUser?: { id: string; email: string; user_metadata?: { full_name?: string } };
    taxAmount: number;
    shippingAmount: number;
    couponDiscount: number;
    giftCardAmount: number;
    appliedCouponCode: { id: string; discountAmount: number; code: string } | null;
    appliedGiftCard: { id: string; balance: number; code: string } | null;
    selectedPaymentProvider: 'moneroo';
  }) => {
    const  createdOrders: Array<{
      orderId: string;
      storeId: string;
      orderNumber: string;
      checkoutUrl?: string;
    }> = [];
    const  errors: Array<{ storeId: string; error: string }> = [];

    // Récupérer les infos d'affiliation si disponible
    const affiliateInfo = await getAffiliateInfo();
    const hasAffiliate = affiliateInfo.affiliate_link_id && affiliateInfo.product_id;

    // Traiter chaque boutique
    for (const [storeId, group] of storeGroups.entries()) {
      try {
        logger.info(`Processing checkout for store: ${storeId}`, { itemCount: group.items.length });

        // Récupérer les informations de la boutique
        const { data: store } = await supabase
          .from('stores')
          .select('id, name, slug')
          .eq('id', storeId)
          .single();

        if (!store) {
          errors.push({ storeId, error: 'Boutique non trouvée' });
          continue;
        }

        // Calculer les totaux pour ce groupe
        const groupSubtotal = group.items.reduce(
          (sum, item) =>
            sum + item.unit_price * item.quantity - (item.discount_amount || 0) * item.quantity,
          0
        );

        // Répartir proportionnellement les taxes, shipping, et réductions
        const totalSubtotal = Array.from(storeGroups.values()).reduce(
          (sum, g) => sum + g.items.reduce((s, item) => s + item.unit_price * item.quantity, 0),
          0
        );
        const proportion = totalSubtotal > 0 ? groupSubtotal / totalSubtotal : 1 / storeGroups.size;

        const groupTaxAmount = taxAmount * proportion;
        const groupShippingAmount = shippingAmount * proportion;
        const groupCouponDiscount = couponDiscount * proportion;
        const groupGiftCardAmount = giftCardAmount * proportion;
        const groupTotal =
          groupSubtotal +
          groupTaxAmount +
          groupShippingAmount -
          groupCouponDiscount -
          groupGiftCardAmount;

        // Créer ou mettre à jour le client pour cette boutique
        let  finalCustomerId: string | null = null;
        try {
          const { data: existingCustomer } = await supabase
            .from('customers')
            .select('id')
            .eq('store_id', storeId)
            .eq('email', formData.email)
            .maybeSingle();

          if (existingCustomer) {
            finalCustomerId = existingCustomer.id;
            // Mettre à jour les informations du client
            await supabase
              .from('customers')
              .update({
                full_name: formData.full_name,
                phone: formData.phone,
                address: formData.address_line1,
                city: formData.city,
                postal_code: formData.postal_code,
                country: formData.country,
                updated_at: new Date().toISOString(),
              })
              .eq('id', finalCustomerId);
          } else {
            // Créer un nouveau client
            const { data: newCustomer, error: customerError } = await supabase
              .from('customers')
              .insert({
                store_id: storeId,
                email: formData.email,
                full_name: formData.full_name,
                phone: formData.phone,
                address: formData.address_line1,
                city: formData.city,
                postal_code: formData.postal_code,
                country: formData.country,
              })
              .select()
              .single();

            if (customerError || !newCustomer) {
              logger.warn('Error creating customer for store:', { storeId, error: customerError });
            } else {
              finalCustomerId = newCustomer.id;
            }
          }
        } catch (customerErr) {
          logger.warn('Error in customer creation/update for store:', {
            storeId,
            error: customerErr,
          });
        }

        // Générer numéro de commande
        const { data: orderNumberData } = await supabase.rpc('generate_order_number');
        const orderNumber = orderNumberData || `ORD-${Date.now()}-${storeId.slice(0, 8)}`;

        // Créer la commande
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            store_id: storeId,
            customer_id: finalCustomerId || checkoutUser?.id || null,
            order_number: orderNumber,
            total_amount: groupTotal,
            currency: 'XOF',
            payment_status: 'pending',
            status: 'pending',
            shipping_address: formData,
          })
          .select()
          .single();

        if (orderError) {
          errors.push({ storeId, error: `Erreur création commande: ${orderError.message}` });
          continue;
        }

        // Créer les order_items
        const orderItems = group.items.map(item => ({
          order_id: order.id,
          product_id: item.product_id,
          product_type: item.product_type,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: (item.unit_price - (item.discount_amount || 0)) * item.quantity,
          variant_id: item.variant_id,
        }));

        const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

        if (itemsError) {
          errors.push({ storeId, error: `Erreur création items: ${itemsError.message}` });
          continue;
        }

        // Créer automatiquement la facture
        try {
          const { createInvoiceFromOrder } = await import('@/lib/supabase-rpc');
          const { data: invoiceResult, error: invoiceError } = await createInvoiceFromOrder({
            p_order_id: order.id,
          });

          if (invoiceError) {
            logger.error('Error creating invoice for store:', { storeId, error: invoiceError });
          } else if (invoiceResult) {
            logger.info(`Invoice created for store ${storeId}: ${invoiceResult.invoice_id}`);
          }
        } catch (invoiceErr) {
          logger.error('Error in invoice creation for store:', { storeId, error: invoiceErr });
        }

        // Enregistrer l'utilisation de la promotion si applicable
        if (appliedCouponCode && appliedCouponCode.id && groupCouponDiscount > 0) {
          try {
            const orderTotalBefore = groupSubtotal + groupTaxAmount + groupShippingAmount;
            const orderTotalAfter = groupTotal;

            await supabase.from('promotion_usage').insert({
              promotion_id: appliedCouponCode.id,
              order_id: order.id,
              customer_id: finalCustomerId || null,
              user_id: checkoutUser?.id || null,
              discount_amount: groupCouponDiscount,
              order_total_before_discount: orderTotalBefore,
              order_total_after_discount: orderTotalAfter,
            });

            // Incrémenter le compteur d'utilisation
            try {
              await supabase.rpc('increment_promotion_usage' as never, {
                p_promotion_id: appliedCouponCode.id,
              });
            } catch (rpcError) {
              // Ignorer si la fonction RPC n'existe pas
              logger.warn('increment_promotion_usage RPC not available', { error: rpcError });
            }
          } catch (promotionError) {
            logger.error('Error recording promotion usage for store:', {
              storeId,
              error: promotionError,
            });
          }
        }

        // Rédimer la carte cadeau si applicable
        if (appliedGiftCard && groupGiftCardAmount > 0) {
          try {
            const { data: redeemResult, error: redeemError } = await supabase.rpc(
              'redeem_gift_card' as never,
              {
                p_gift_card_id: appliedGiftCard.id,
                p_order_id: order.id,
                p_amount: groupGiftCardAmount,
              }
            );

            const firstRow = Array.isArray(redeemResult) ? redeemResult[0] : null;
            const redeemRow =
              firstRow && typeof firstRow === 'object'
                ? (firstRow as { success?: boolean; message?: string | null })
                : null;

            if (redeemError) {
              logger.error('Error redeeming gift card for store:', { storeId, error: redeemError });
            } else if (redeemRow && redeemRow.success === false) {
              logger.error('Gift card redemption failed for store:', {
                storeId,
                message: redeemRow.message,
              });
            }
          } catch (giftCardError) {
            logger.error('Error in gift card redemption for store:', {
              storeId,
              error: giftCardError,
            });
          }
        }

        // Initier le paiement
        const paymentProvider = selectedPaymentProvider || 'moneroo';
        const paymentResult = await initiatePayment({
          storeId,
          orderId: order.id,
          customerId: checkoutUser?.id || undefined,
          amount: groupTotal,
          currency: 'XOF',
          description: `Commande ${orderNumber} - ${group.items.length} article(s) - ${store.name}`,
          customerEmail: formData.email,
          customerName: formData.full_name,
          customerPhone: formData.phone,
          provider: paymentProvider,
          metadata: {
            order_number: orderNumber,
            item_count: group.items.length,
            shipping_address: formData,
            store_name: store.name,
            store_slug: store.slug,
            is_multi_store: true,
            total_stores: storeGroups.size,
            ...(hasAffiliate && {
              affiliate_link_id: affiliateInfo.affiliate_link_id,
              affiliate_id: affiliateInfo.affiliate_id,
              tracking_cookie: affiliateInfo.tracking_cookie,
            }),
          },
        });

        if (!paymentResult.success || !paymentResult.checkout_url) {
          errors.push({
            storeId,
            error: paymentResult.error || "Impossible d'initialiser le paiement",
          });
          continue;
        }

        createdOrders.push({
          orderId: order.id,
          storeId,
          orderNumber,
          checkoutUrl: paymentResult.checkout_url,
        });

        logger.info(`Order created successfully for store ${storeId}`, {
          orderId: order.id,
          orderNumber,
        });
      } catch ( _error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        logger.error(`Error processing checkout for store ${storeId}:`, { error: errorMessage });
        errors.push({ storeId, error: errorMessage });
      }
    }

    // Résumé des résultats
    if (createdOrders.length === 0) {
      toast({
        title: 'Erreur',
        description: "Aucune commande n'a pu être créée. Veuillez réessayer.",
        variant: 'destructive',
      });
      setIsProcessing(false);
      return;
    }

    if (errors.length > 0) {
      toast({
        title: 'Attention',
        description: `${createdOrders.length} commande(s) créée(s) avec succès, ${errors.length} erreur(s).`,
        variant: 'default',
      });
    } else {
      toast({
        title: 'Succès',
        description: `${createdOrders.length} commande(s) créée(s) avec succès !`,
      });
    }

    // Marquer le panier comme récupéré
    try {
      await supabase.rpc('mark_cart_recovered', {
        p_user_id: checkoutUser?.id || undefined,
        p_session_id: undefined,
      });
    } catch (recoveryError) {
      logger.warn('Failed to mark cart as recovered', { error: recoveryError });
    }

    // Rediriger vers la page de suivi multi-stores
    const orderIds = createdOrders.map(o => o.orderId).join(',');
    navigate(`/checkout/multi-store-tracking?orders=${orderIds}`);
  };

  // Validation formulaire améliorée
  const validateForm = (): boolean => {
    const  errors: Partial<Record<keyof ShippingAddress, string>> = {};

    if (!formData.full_name.trim()) {
      errors.full_name = 'Le nom complet est requis';
    } else if (formData.full_name.trim().length < 2) {
      errors.full_name = 'Le nom doit contenir au moins 2 caractères';
    }

    if (!formData.email.trim()) {
      errors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Format d'email invalide (ex: jean@example.com)";
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Le téléphone est requis';
    } else if (
      !/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/.test(
        formData.phone.replace(/\s/g, '')
      )
    ) {
      errors.phone = 'Format de téléphone invalide (ex: +225 07 12 34 56 78)';
    }

    if (!formData.address_line1.trim()) {
      errors.address_line1 = "L'adresse est requise";
    } else if (formData.address_line1.trim().length < 5) {
      errors.address_line1 = "L'adresse doit contenir au moins 5 caractères";
    }

    if (!formData.city.trim()) {
      errors.city = 'La ville est requise';
    } else if (formData.city.trim().length < 2) {
      errors.city = 'La ville doit contenir au moins 2 caractères';
    }

    if (!formData.postal_code.trim()) {
      errors.postal_code = 'Le code postal est requis';
    } else if (formData.postal_code.trim().length < 3) {
      errors.postal_code = 'Le code postal doit contenir au moins 3 caractères';
    }

    if (!formData.country.trim()) {
      errors.country = 'Le pays est requis';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validation d'un champ spécifique
  const validateField = useCallback(
    (field: keyof ShippingAddress, value: string): string | null => {
      switch (field) {
        case 'full_name':
          if (!value.trim()) return 'Le nom complet est requis';
          if (value.trim().length < 2) return 'Le nom doit contenir au moins 2 caractères';
          return null;
        case 'email':
          if (!value.trim()) return "L'email est requis";
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Format d'email invalide";
          return null;
        case 'phone':
          if (!value.trim()) return 'Le téléphone est requis';
          if (
            !/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/.test(
              value.replace(/\s/g, '')
            )
          ) {
            return 'Format de téléphone invalide';
          }
          return null;
        case 'address_line1':
          if (!value.trim()) return "L'adresse est requise";
          if (value.trim().length < 5) return "L'adresse doit contenir au moins 5 caractères";
          return null;
        case 'city':
          if (!value.trim()) return 'La ville est requise';
          if (value.trim().length < 2) return 'La ville doit contenir au moins 2 caractères';
          return null;
        case 'postal_code':
          if (!value.trim()) return 'Le code postal est requis';
          if (value.trim().length < 3) return 'Le code postal doit contenir au moins 3 caractères';
          return null;
        case 'country':
          if (!value.trim()) return 'Le pays est requis';
          return null;
        default:
          return null;
      }
    },
    []
  );

  // Traitement de la commande
  const handleCheckout = async () => {
    if (!validateForm()) {
      toast({
        title: 'Formulaire incomplet',
        description: 'Veuillez corriger les erreurs dans le formulaire',
        variant: 'destructive',
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: 'Panier vide',
        description: 'Votre panier est vide',
        variant: 'destructive',
      });
      navigate('/cart');
      return;
    }

    setIsProcessing(true);

    try {
      // Récupérer l'utilisateur
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        toast({
          title: 'Authentification requise',
          description: 'Veuillez vous connecter pour continuer',
          variant: 'destructive',
        });
        navigate('/auth');
        return;
      }

      // 🆕 Vérifier si le panier contient des produits de plusieurs boutiques
      if (isMultiStore && storeGroups.size > 1) {
        logger.info('Multi-store checkout detected', { storeCount: storeGroups.size });

        // Implémenter le traitement complet multi-stores
        await processMultiStoreCheckout({
          storeGroups,
          formData,
          checkoutUser:
            user && user.email
              ? {
                  id: user.id || '',
                  email: user.email,
                  user_metadata: user.user_metadata as { full_name?: string } | undefined,
                }
              : undefined,
          taxAmount,
          shippingAmount,
          couponDiscount,
          giftCardAmount,
          appliedCouponCode,
          appliedGiftCard,
          selectedPaymentProvider,
        });
        return; // processMultiStoreCheckout gère la redirection
      }

      // Comportement normal (un seul store ou fallback)
      const firstProduct = items[0];
      const { data: product } = await supabase
        .from('products')
        .select('store_id')
        .eq('id', firstProduct.product_id)
        .single();

      if (!product?.store_id) {
        throw new Error('Boutique non trouvée');
      }

      // 🆕 Créer ou mettre à jour le client dans la table customers
      let  finalCustomerId: string | null = null;
      try {
        // Vérifier si le client existe déjà
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id')
          .eq('store_id', product.store_id)
          .eq('email', formData.email)
          .maybeSingle();

        if (existingCustomer) {
          // Mettre à jour le client existant avec les nouvelles informations
          finalCustomerId = existingCustomer.id;
          const { error: updateError } = await supabase
            .from('customers')
            .update({
              full_name: formData.full_name,
              phone: formData.phone,
              metadata: {
                address: `${formData.address_line1}${formData.address_line2 ? `, ${formData.address_line2}` : ''}`,
                city: formData.city,
                postal_code: formData.postal_code,
                country: formData.country,
                state: formData.state || null,
                address_line1: formData.address_line1,
                address_line2: formData.address_line2 || null,
              },
              updated_at: new Date().toISOString(),
            })
            .eq('id', finalCustomerId);

          if (updateError) {
            logger.warn('Error updating customer:', updateError);
            // Ne pas bloquer le processus si la mise à jour échoue
          }
        } else {
          // Créer un nouveau client
          const { data: newCustomer, error: customerError } = await supabase
            .from('customers')
            .insert({
              store_id: product.store_id,
              email: formData.email,
              full_name: formData.full_name,
              phone: formData.phone,
              metadata: {
                address: `${formData.address_line1}${formData.address_line2 ? `, ${formData.address_line2}` : ''}`,
                city: formData.city,
                postal_code: formData.postal_code,
                country: formData.country,
                state: formData.state || null,
                address_line1: formData.address_line1,
                address_line2: formData.address_line2 || null,
              },
            })
            .select('id')
            .single();

          if (customerError || !newCustomer) {
            logger.warn('Error creating customer:', customerError);
            // Ne pas bloquer le processus si la création échoue
          } else {
            finalCustomerId = newCustomer.id;
          }
        }
      } catch (customerErr) {
        logger.warn('Error in customer creation/update:', { error: customerErr });
        // Ne pas bloquer le processus
      }

      // Générer numéro de commande
      const { data: orderNumberData } = await supabase.rpc('generate_order_number');
      const orderNumber = orderNumberData || `ORD-${Date.now()}`;

      // Créer la commande
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          store_id: product.store_id,
          customer_id: finalCustomerId || user?.id || null, // Utiliser customer_id si disponible, sinon user.id
          order_number: orderNumber,
          total_amount: finalTotal,
          currency: 'XOF',
          payment_status: 'pending',
          status: 'pending',
          shipping_address: formData,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Créer les order_items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        product_type: item.product_type,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: (item.unit_price - (item.discount_amount || 0)) * item.quantity,
        variant_id: item.variant_id,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

      if (itemsError) throw itemsError;

      // Créer automatiquement la facture
      try {
        const { createInvoiceFromOrder } = await import('@/lib/supabase-rpc');
        const { data: invoiceResult, error: invoiceError } = await createInvoiceFromOrder({
          p_order_id: order.id,
        });

        if (invoiceError) {
          logger.error('Error creating invoice:', { error: invoiceError });
          // Ne pas bloquer la commande si la facture échoue
        } else if (invoiceResult) {
          logger.info(`Invoice created: ${invoiceResult.invoice_id}`);
        }
      } catch (invoiceErr) {
        logger.error('Error in invoice creation:', { error: invoiceErr });
        // Ne pas bloquer la commande
      }

      // Enregistrer l'utilisation de la promotion unifiée si un code promo a été appliqué
      if (appliedCouponCode && appliedCouponCode.id && couponDiscount > 0) {
        try {
          // Récupérer le customer_id si pas encore chargé
          let  finalCustomerId= customerId;
          if (!finalCustomerId && user?.email && storeId) {
            const { data: customer } = await supabase
              .from('customers')
              .select('id')
              .eq('store_id', storeId)
              .eq('email', user.email)
              .single();

            if (customer) {
              finalCustomerId = customer.id;
            }
          }

          // Calculer les montants avant et après réduction
          const orderTotalBefore = summary.subtotal + taxAmount + shippingAmount;
          const orderTotalAfter = finalTotal;

          // Enregistrer l'utilisation dans promotion_usage (système unifié)
          const { error: usageError } = await supabase.from('promotion_usage').insert({
            promotion_id: appliedCouponCode.id,
            order_id: order.id,
            customer_id: finalCustomerId || null,
            user_id: user?.id || null,
            discount_amount: couponDiscount,
            order_total_before_discount: orderTotalBefore,
            order_total_after_discount: orderTotalAfter,
          });

          if (usageError) {
            logger.error('Error recording promotion usage:', { error: usageError });
          } else {
            // Mettre à jour le compteur current_uses de la promotion
            // Note: On utilise une fonction RPC ou une mise à jour SQL directe
            try {
              // Essayer d'abord avec une fonction RPC si elle existe
              const { error: rpcError } = await supabase.rpc('increment_promotion_usage' as never, {
                p_promotion_id: appliedCouponCode.id,
              });

              if (rpcError) {
                // Si la fonction RPC n'existe pas, on peut ignorer l'erreur
                logger.warn('Could not increment promotion usage (RPC may not exist):', {
                  error: rpcError,
                });
              }
            } catch ( _err: unknown) {
              const errorMessage = err instanceof Error ? err.message : String(err);
              logger.warn('Error incrementing promotion usage counter:', { error: errorMessage });
            }

            logger.info('Promotion usage recorded', {
              promotionId: appliedCouponCode.id,
              orderId: order.id,
            });
          }
        } catch (promotionError) {
          logger.error('Error recording promotion usage:', { error: promotionError });
          // Ne pas bloquer la commande si l'enregistrement échoue
        }
      }

      // NOTE: L'ancien système de coupons a été supprimé
      // Seul le nouveau système (appliedCouponCode) est utilisé maintenant
      // L'enregistrement de l'utilisation du coupon est fait plus haut (lignes 579-641)

      // Rédimer la carte cadeau si une carte a été appliquée
      if (appliedGiftCard && giftCardAmount > 0) {
        try {
          const { data: redeemResult, error: redeemError } = await supabase.rpc(
            'redeem_gift_card' as never,
            {
              p_gift_card_id: appliedGiftCard.id,
              p_order_id: order.id,
              p_amount: giftCardAmount,
            }
          );

          const firstRow = Array.isArray(redeemResult) ? redeemResult[0] : null;
          const redeemRow =
            firstRow && typeof firstRow === 'object'
              ? (firstRow as { success?: boolean; message?: string | null })
              : null;

          if (redeemError) {
            logger.error('Error redeeming gift card:', { error: redeemError });
            toast({
              title: 'Attention',
              description:
                "La carte cadeau n'a pas pu être utilisée, mais la commande a été créée.",
              variant: 'destructive',
            });
          } else if (redeemRow && redeemRow.success === false) {
            logger.error('Gift card redemption failed:', { message: redeemRow.message });
            toast({
              title: 'Attention',
              description: redeemRow.message || "La carte cadeau n'a pas pu être utilisée.",
              variant: 'destructive',
            });
          } else {
            // Succès - retirer la carte cadeau du localStorage
            try {
              localStorage.removeItem('applied_gift_card');
            } catch {
              // ignore
            }
            setAppliedGiftCard(null);
          }
        } catch (giftCardError) {
          logger.error('Error in gift card redemption:', { error: giftCardError });
          // Ne pas bloquer la commande si la rédemption échoue
        }
      }

      // Récupérer les infos d'affiliation si disponible
      const affiliateInfo = await getAffiliateInfo();
      const hasAffiliate = affiliateInfo.affiliate_link_id && affiliateInfo.product_id;

      // Initier le paiement avec le provider sélectionné
      const paymentProvider = selectedPaymentProvider || 'moneroo';
      const paymentResult = await initiatePayment({
        storeId: product.store_id,
        orderId: order.id,
        customerId: user?.id || undefined,
        amount: finalTotal,
        currency: 'XOF',
        description: `Commande ${orderNumber} - ${items.length} article(s)`,
        customerEmail: formData.email,
        customerName: formData.full_name,
        customerPhone: formData.phone,
        provider: paymentProvider,
        metadata: {
          order_number: orderNumber,
          item_count: items.length,
          shipping_address: formData,
          // Inclure les infos d'affiliation dans les métadonnées
          ...(hasAffiliate && {
            affiliate_link_id: affiliateInfo.affiliate_link_id,
            affiliate_id: affiliateInfo.affiliate_id,
            tracking_cookie: affiliateInfo.tracking_cookie,
          }),
        },
      });

      if (!paymentResult.success || !paymentResult.checkout_url) {
        throw new Error(paymentResult.error || "Impossible d'initialiser le paiement");
      }

      // Marquer le panier comme récupéré (pour abandoned cart recovery)
      try {
        const { error: recoveryError } = await supabase.rpc('mark_cart_recovered', {
          p_user_id: user?.id || undefined,
          p_session_id: undefined, // Session ID pourrait être récupéré si nécessaire
        });

        if (recoveryError) {
          logger.warn('Failed to mark cart as recovered', { error: recoveryError });
          // Ne pas bloquer le processus si l'erreur survient
        }
      } catch ( _recoveryError: unknown) {
        const errorMessage =
          recoveryError instanceof Error ? recoveryError.message : String(recoveryError);
        logger.warn('Error marking cart as recovered', { error: errorMessage });
        // Ne pas bloquer le processus si l'erreur survient
      }

      // Rediriger vers le provider de paiement
      safeRedirect(paymentResult.checkout_url, () => {
        toast({
          title: 'Erreur de paiement',
          description: 'URL de paiement invalide',
          variant: 'destructive',
        });
      });
    } catch ( _error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Impossible de finaliser la commande';
      logger.error('Erreur lors du checkout:', { error: errorMessage });
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (cartLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1 p-6 pb-16 md:pb-0">
            <div className="max-w-6xl mx-auto space-y-6">
              <Skeleton className="h-10 w-64" />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <Skeleton className="h-96" />
                </div>
                <Skeleton className="h-96" />
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (items.length === 0) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1 p-6 pb-16 md:pb-0">
            <div className="max-w-4xl mx-auto">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Votre panier est vide.{' '}
                  <Button variant="link" onClick={() => navigate('/cart')}>
                    Retour au panier
                  </Button>
                </AlertDescription>
              </Alert>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50 dark:bg-gray-900">
        <AppSidebar />
        <main className="flex-1 p-4 md:p-6 lg:p-8 pb-16 md:pb-0">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <header>
              <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold flex items-center gap-1.5 sm:gap-2">
                <ShoppingBag className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8" aria-hidden="true" />
                Finaliser la commande
              </h1>
              <p
                className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground mt-0.5 sm:mt-1"
                id="checkout-description"
              >
                Remplissez vos informations pour compléter votre achat
              </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Formulaire (2/3) */}
              <div className="lg:col-span-2 space-y-6">
                {/* Informations de livraison */}
                <Card
                  role="region"
                  aria-labelledby="shipping-title"
                  aria-describedby="shipping-description"
                >
                  <CardHeader>
                    <CardTitle
                      id="shipping-title"
                      className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base lg:text-lg"
                    >
                      <MapPin className="h-5 w-5" aria-hidden="true" />
                      Informations de livraison
                    </CardTitle>
                    <CardDescription id="shipping-description">
                      Où souhaitez-vous recevoir votre commande ?
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormFieldWithValidation
                        label="Nom complet"
                        name="full_name"
                        value={formData.full_name}
                        onChange={value => {
                          setFormData(prev => ({ ...prev, full_name: value }));
                          if (formErrors.full_name) {
                            const error = validateField('full_name', value);
                            setFormErrors(prev => ({ ...prev, full_name: error || undefined }));
                          }
                        }}
                        onBlur={() => {
                          const error = validateField('full_name', formData.full_name);
                          setFormErrors(prev => ({ ...prev, full_name: error || undefined }));
                        }}
                        error={formErrors.full_name}
                        placeholder="Jean Dupont"
                        required
                        autoComplete="name"
                        validationRules={[
                          value => (!value.trim() ? 'Le nom complet est requis' : null),
                          value =>
                            value.trim().length < 2
                              ? 'Le nom doit contenir au moins 2 caractères'
                              : null,
                        ]}
                      />

                      <FormFieldWithValidation
                        label="Email"
                        name="email"
                        value={formData.email}
                        onChange={value => {
                          setFormData(prev => ({ ...prev, email: value }));
                          if (formErrors.email) {
                            const error = validateField('email', value);
                            setFormErrors(prev => ({ ...prev, email: error || undefined }));
                          }
                        }}
                        onBlur={() => {
                          const error = validateField('email', formData.email);
                          setFormErrors(prev => ({ ...prev, email: error || undefined }));
                        }}
                        error={formErrors.email}
                        type="email"
                        placeholder="jean@example.com"
                        required
                        autoComplete="email"
                        validationRules={[
                          value => (!value.trim() ? "L'email est requis" : null),
                          value =>
                            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
                              ? "Format d'email invalide"
                              : null,
                        ]}
                      />
                    </div>

                    <FormFieldWithValidation
                      label="Téléphone"
                      name="phone"
                      value={formData.phone}
                      onChange={value => {
                        setFormData(prev => ({ ...prev, phone: value }));
                        if (formErrors.phone) {
                          const error = validateField('phone', value);
                          setFormErrors(prev => ({ ...prev, phone: error || undefined }));
                        }
                      }}
                      onBlur={() => {
                        const error = validateField('phone', formData.phone);
                        setFormErrors(prev => ({ ...prev, phone: error || undefined }));
                      }}
                      error={formErrors.phone}
                      type="tel"
                      placeholder="+225 07 12 34 56 78"
                      required
                      autoComplete="tel"
                      validationRules={[
                        value => (!value.trim() ? 'Le téléphone est requis' : null),
                        value =>
                          !/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/.test(
                            value.replace(/\s/g, '')
                          )
                            ? 'Format de téléphone invalide'
                            : null,
                      ]}
                    />

                    <Separator />

                    <FormFieldWithValidation
                      label="Adresse"
                      name="address_line1"
                      value={formData.address_line1}
                      onChange={value => {
                        setFormData(prev => ({ ...prev, address_line1: value }));
                        if (formErrors.address_line1) {
                          const error = validateField('address_line1', value);
                          setFormErrors(prev => ({ ...prev, address_line1: error || undefined }));
                        }
                      }}
                      onBlur={() => {
                        const error = validateField('address_line1', formData.address_line1);
                        setFormErrors(prev => ({ ...prev, address_line1: error || undefined }));
                      }}
                      error={formErrors.address_line1}
                      placeholder="123 Rue principale"
                      required
                      autoComplete="street-address"
                      validationRules={[
                        value => (!value.trim() ? "L'adresse est requise" : null),
                        value =>
                          value.trim().length < 5
                            ? "L'adresse doit contenir au moins 5 caractères"
                            : null,
                      ]}
                    />

                    <div className="space-y-2">
                      <Label htmlFor="address_line2">Complément d'adresse (optionnel)</Label>
                      <Input
                        id="address_line2"
                        value={formData.address_line2}
                        onChange={e =>
                          setFormData(prev => ({ ...prev, address_line2: e.target.value }))
                        }
                        placeholder="Appartement, étage, etc."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormFieldWithValidation
                        label="Ville"
                        name="city"
                        value={formData.city}
                        onChange={value => {
                          setFormData(prev => ({ ...prev, city: value }));
                          if (formErrors.city) {
                            const error = validateField('city', value);
                            setFormErrors(prev => ({ ...prev, city: error || undefined }));
                          }
                        }}
                        onBlur={() => {
                          const error = validateField('city', formData.city);
                          setFormErrors(prev => ({ ...prev, city: error || undefined }));
                        }}
                        error={formErrors.city}
                        placeholder="Abidjan"
                        required
                        autoComplete="address-level2"
                        validationRules={[
                          value => (!value.trim() ? 'La ville est requise' : null),
                          value =>
                            value.trim().length < 2
                              ? 'La ville doit contenir au moins 2 caractères'
                              : null,
                        ]}
                      />

                      <FormFieldWithValidation
                        label="Code postal"
                        name="postal_code"
                        value={formData.postal_code}
                        onChange={value => {
                          setFormData(prev => ({ ...prev, postal_code: value }));
                          if (formErrors.postal_code) {
                            const error = validateField('postal_code', value);
                            setFormErrors(prev => ({ ...prev, postal_code: error || undefined }));
                          }
                        }}
                        onBlur={() => {
                          const error = validateField('postal_code', formData.postal_code);
                          setFormErrors(prev => ({ ...prev, postal_code: error || undefined }));
                        }}
                        error={formErrors.postal_code}
                        placeholder="01 BP 1234"
                        required
                        autoComplete="postal-code"
                        validationRules={[
                          value => (!value.trim() ? 'Le code postal est requis' : null),
                          value =>
                            value.trim().length < 3
                              ? 'Le code postal doit contenir au moins 3 caractères'
                              : null,
                        ]}
                      />

                      <div className="space-y-2">
                        <Label htmlFor="country">
                          Pays <span className="text-red-500">*</span>
                        </Label>
                        <select
                          id="country"
                          value={formData.country}
                          onChange={e =>
                            setFormData(prev => ({ ...prev, country: e.target.value }))
                          }
                          className={`flex min-h-[44px] h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base touch-manipulation cursor-pointer ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${formErrors.country ? 'border-red-500' : ''}`}
                          aria-invalid={!!formErrors.country}
                          aria-describedby={formErrors.country ? 'country-error' : undefined}
                          autoComplete="country"
                        >
                          <option value="BF">Burkina Faso</option>
                          <option value="CI">Côte d'Ivoire</option>
                          <option value="SN">Sénégal</option>
                          <option value="ML">Mali</option>
                          <option value="BJ">Bénin</option>
                          <option value="TG">Togo</option>
                          <option value="GN">Guinée</option>
                          <option value="NE">Niger</option>
                          <option value="CM">Cameroun</option>
                          <option value="GA">Gabon</option>
                          <option value="CD">Congo</option>
                          <option value="CG">Congo-Brazzaville</option>
                          <option value="TD">Tchad</option>
                          <option value="CF">Centrafrique</option>
                          <option value="FR">France</option>
                          <option value="BE">Belgique</option>
                          <option value="CA">Canada</option>
                          <option value="US">États-Unis</option>
                        </select>
                        {formErrors.country && (
                          <p id="country-error" className="text-sm text-red-500" role="alert">
                            {formErrors.country}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Carte cadeau */}
                    {storeId && (
                      <div className="space-y-2 mt-4">
                        <GiftCardInput
                          storeId={storeId}
                          onApply={(giftCardId, balance, code) => {
                            setAppliedGiftCard({
                              id: giftCardId,
                              balance,
                              code: code || '',
                            });
                            try {
                              localStorage.setItem(
                                'applied_gift_card',
                                JSON.stringify({
                                  id: giftCardId,
                                  balance,
                                  code: code || '',
                                })
                              );
                            } catch {
                              // ignore
                            }
                          }}
                          onRemove={() => {
                            setAppliedGiftCard(null);
                            try {
                              localStorage.removeItem('applied_gift_card');
                            } catch {
                              // ignore
                            }
                          }}
                          appliedGiftCardId={appliedGiftCard?.id || null}
                          appliedGiftCardBalance={appliedGiftCard?.balance || null}
                          appliedGiftCardCode={appliedGiftCard?.code || null}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Méthode de paiement */}
                <PaymentProviderSelector
                  value={selectedPaymentProvider}
                  onChange={setSelectedPaymentProvider}
                  storeId={storeId || undefined}
                  amount={finalTotal}
                />
              </div>

              {/* Récapitulatif (1/3) */}
              <aside className="lg:col-span-1" aria-label="Récapitulatif de la commande">
                <Card className="sticky top-4" role="region" aria-labelledby="summary-title">
                  <CardHeader>
                    <CardTitle id="summary-title">
                      Récapitulatif
                      {isMultiStore && storeGroups.size > 1 && (
                        <span className="ml-2 text-sm text-orange-600 font-normal">
                          ({storeGroups.size} boutique{storeGroups.size > 1 ? 's' : ''})
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isCheckingStores ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : isMultiStore && storeGroups.size > 1 ? (
                      // Affichage multi-stores
                      <div className="space-y-4">
                        {Array.from(storeGroups.entries()).map(([storeId, group]) => (
                          <div key={storeId} className="border rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-sm">
                                {group.store_name || `Boutique ${storeId.substring(0, 8)}`}
                              </h4>
                              <span className="text-xs text-muted-foreground">
                                {group.items.length} article{group.items.length > 1 ? 's' : ''}
                              </span>
                            </div>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {group.items.map(item => (
                                <div
                                  key={item.id || item.product_id}
                                  className="flex gap-2 text-xs"
                                >
                                  <div className="w-8 h-8 rounded border overflow-hidden flex-shrink-0">
                                    <img
                                      src={item.product_image_url || '/placeholder-product.png'}
                                      alt={item.product_name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate text-xs">
                                      {item.product_name}
                                    </p>
                                    {item.variant_name && (
                                      <p className="text-xs text-muted-foreground">
                                        {item.variant_name}
                                      </p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                      {item.quantity} × {item.unit_price.toLocaleString('fr-FR')}{' '}
                                      XOF
                                    </p>
                                  </div>
                                  <p className="font-medium whitespace-nowrap text-xs">
                                    {(
                                      (item.unit_price - (item.discount_amount || 0)) *
                                      item.quantity
                                    ).toLocaleString('fr-FR')}{' '}
                                    XOF
                                  </p>
                                </div>
                              ))}
                            </div>
                            <Separator />
                            <div className="space-y-1 text-xs pt-1">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Sous-total:</span>
                                <span>{(group.subtotal || 0).toLocaleString('fr-FR')} XOF</span>
                              </div>
                              {(group.tax_amount || 0) > 0 && (
                                <div className="flex justify-between text-muted-foreground">
                                  <span>Taxes:</span>
                                  <span>{(group.tax_amount || 0).toLocaleString('fr-FR')} XOF</span>
                                </div>
                              )}
                              {(group.shipping_amount || 0) > 0 && (
                                <div className="flex justify-between text-muted-foreground">
                                  <span>Livraison:</span>
                                  <span>
                                    {(group.shipping_amount || 0).toLocaleString('fr-FR')} XOF
                                  </span>
                                </div>
                              )}
                              {(group.discount_amount || 0) > 0 && (
                                <div className="flex justify-between text-green-600">
                                  <span>Réduction panier:</span>
                                  <span>
                                    -{(group.discount_amount || 0).toLocaleString('fr-FR')} XOF
                                  </span>
                                </div>
                              )}
                              {appliedCouponCode && couponDiscount > 0 && (
                                <div className="flex justify-between text-green-600">
                                  <span>Code promo ({appliedCouponCode.code}):</span>
                                  <span>-{couponDiscount.toLocaleString('fr-FR')} XOF</span>
                                </div>
                              )}
                              <div className="flex justify-between font-semibold pt-1 border-t">
                                <span>Total:</span>
                                <span>{(group.total || 0).toLocaleString('fr-FR')} XOF</span>
                              </div>
                            </div>
                          </div>
                        ))}
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-xs">
                            Votre commande sera divisée en {storeGroups.size} commande(s)
                            distincte(s), une par boutique.
                          </AlertDescription>
                        </Alert>
                        <Separator />
                        <div className="space-y-2 text-sm pt-2">
                          {appliedCouponCode && couponDiscount > 0 && (
                            <div className="flex justify-between text-green-600">
                              <span>Code promo ({appliedCouponCode.code}):</span>
                              <span>-{couponDiscount.toLocaleString('fr-FR')} XOF</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center text-lg font-bold pt-2 border-t">
                            <span>Total Général:</span>
                            <span className="text-base sm:text-xl md:text-2xl text-primary">
                              {Math.max(
                                0,
                                Array.from(storeGroups.values()).reduce(
                                  (sum, group) => sum + (group.total || 0),
                                  0
                                ) - (appliedCouponCode ? couponDiscount : 0)
                              ).toLocaleString('fr-FR')}{' '}
                              XOF
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                          Réparti sur {storeGroups.size} commande{storeGroups.size > 1 ? 's' : ''}
                        </p>

                        {/* Bouton checkout pour multi-stores */}
                        <Button
                          onClick={handleCheckout}
                          disabled={isProcessing || items.length === 0 || isCheckingStores}
                          className="w-full mt-4"
                          size="lg"
                          aria-label={
                            isProcessing
                              ? 'Traitement de la commande en cours'
                              : `Finaliser les commandes pour ${Array.from(storeGroups.values())
                                  .reduce((sum, group) => sum + (group.total || 0), 0)
                                  .toLocaleString('fr-FR')} XOF`
                          }
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                              Traitement...
                            </>
                          ) : isCheckingStores ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                              Vérification des boutiques...
                            </>
                          ) : (
                            <>
                              <CreditCard className="mr-2 h-4 w-4" aria-hidden="true" />
                              Payer{' '}
                              {Array.from(storeGroups.values())
                                .reduce((sum, group) => sum + (group.total || 0), 0)
                                .toLocaleString('fr-FR')}{' '}
                              XOF
                              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                            </>
                          )}
                        </Button>

                        <p className="text-xs text-center text-muted-foreground mt-2">
                          {items.length} {items.length > 1 ? 'articles' : 'article'}
                        </p>
                      </div>
                    ) : (
                      // Affichage normal (un seul store)
                      <>
                        {/* Articles */}
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {items.map(item => (
                            <div key={item.id} className="flex gap-3 text-sm">
                              <div className="w-12 h-12 rounded border overflow-hidden flex-shrink-0">
                                <img
                                  src={item.product_image_url || '/placeholder-product.png'}
                                  alt={item.product_name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{item.product_name}</p>
                                {item.variant_name && (
                                  <p className="text-xs text-muted-foreground">
                                    {item.variant_name}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                  Quantité: {item.quantity}
                                </p>
                              </div>
                              <p className="font-medium whitespace-nowrap">
                                {(
                                  (item.unit_price - (item.discount_amount || 0)) *
                                  item.quantity
                                ).toLocaleString('fr-FR')}{' '}
                                XOF
                              </p>
                            </div>
                          ))}
                        </div>

                        <Separator />

                        {/* Code promo - Visible et proéminent dans le récapitulatif */}
                        <div className="space-y-3 py-3 border-t border-b border-border/50 bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 rounded-lg p-4">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-md bg-primary/10">
                              <Tag className="h-4 w-4 text-primary" />
                            </div>
                            <Label
                              htmlFor="coupon-code"
                              className="text-sm font-semibold text-foreground"
                            >
                              Avez-vous un code promo ?
                            </Label>
                          </div>
                          <CouponInput
                            storeId={storeId || undefined}
                            productIds={items.map(item => item.product_id)}
                            customerId={customerId || undefined}
                            orderAmount={summary.subtotal}
                            isFirstOrder={isFirstOrder}
                            onApply={(promotionId, discountAmount, code) => {
                              // Forcer la mise à jour en créant un nouvel objet avec discountAmount converti en nombre
                              const newCoupon = {
                                id: promotionId,
                                discountAmount: Number(discountAmount),
                                code: code || '',
                              };
                              setAppliedCouponCode(newCoupon);
                              try {
                                localStorage.setItem(
                                  'applied_coupon',
                                  JSON.stringify({
                                    ...newCoupon,
                                    appliedAt: new Date().toISOString(),
                                  })
                                );
                              } catch {
                                // ignore
                              }
                              toast({
                                title: '✅ Code promo appliqué',
                                description: `Réduction de ${discountAmount.toLocaleString('fr-FR')} XOF appliquée`,
                              });
                            }}
                            onRemove={() => {
                              setAppliedCouponCode(null);
                              try {
                                localStorage.removeItem('applied_coupon');
                              } catch {
                                // ignore
                              }
                              toast({
                                title: 'Code promo retiré',
                                description: 'Le code promo a été retiré de votre commande',
                              });
                            }}
                            appliedCouponId={appliedCouponCode?.id || null}
                            appliedCouponCode={appliedCouponCode?.code || null}
                            appliedDiscountAmount={appliedCouponCode?.discountAmount || null}
                          />
                        </div>

                        <Separator />

                        {/* Détails prix */}
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Sous-total</span>
                            <span>{summary.subtotal.toLocaleString('fr-FR')} XOF</span>
                          </div>

                          {itemDiscounts > 0 && (
                            <div className="flex justify-between text-green-600">
                              <span>Remise panier</span>
                              <span>-{itemDiscounts.toLocaleString('fr-FR')} XOF</span>
                            </div>
                          )}

                          {appliedCouponCode && couponDiscount > 0 && (
                            <div className="flex justify-between text-green-600">
                              <span>Code promo ({appliedCouponCode.code})</span>
                              <span>-{couponDiscount.toLocaleString('fr-FR')} XOF</span>
                            </div>
                          )}

                          {appliedGiftCard && giftCardAmount > 0 && (
                            <div className="flex justify-between text-green-600">
                              <span>Carte cadeau ({appliedGiftCard.code})</span>
                              <span>-{giftCardAmount.toLocaleString('fr-FR')} XOF</span>
                            </div>
                          )}

                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Livraison</span>
                            <span>{shippingAmount.toLocaleString('fr-FR')} XOF</span>
                          </div>

                          {/* Affichage détaillé des taxes */}
                          {taxLoading ? (
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Taxes</span>
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                          ) : taxBreakdown.length > 0 ? (
                            <div className="space-y-1">
                              {taxBreakdown.map((tax, index) => (
                                <div key={index} className="flex justify-between text-xs">
                                  <span className="text-muted-foreground">
                                    {tax.name} ({tax.rate}%)
                                    {tax.applies_to_shipping && ' + Livraison'}
                                    {tax.is_default && ' (par défaut)'}
                                  </span>
                                  <span>{Number(tax.amount).toLocaleString('fr-FR')} XOF</span>
                                </div>
                              ))}
                              <div className="flex justify-between font-medium pt-1 border-t">
                                <span className="text-muted-foreground">Total Taxes</span>
                                <span>{taxAmount.toLocaleString('fr-FR')} XOF</span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Taxes</span>
                              <span>{taxAmount.toLocaleString('fr-FR')} XOF</span>
                            </div>
                          )}
                        </div>

                        <Separator />

                        {/* Total */}
                        <div className="flex justify-between items-center text-lg font-bold">
                          <span>Total</span>
                          <span className="text-2xl text-primary">
                            {finalTotal.toLocaleString('fr-FR')} XOF
                          </span>
                        </div>

                        {/* Bouton checkout */}
                        <Button
                          onClick={handleCheckout}
                          disabled={isProcessing || items.length === 0 || isCheckingStores}
                          className="w-full"
                          size="lg"
                          aria-label={
                            isProcessing
                              ? 'Traitement de la commande en cours'
                              : `Finaliser la commande pour ${finalTotal.toLocaleString('fr-FR')} XOF`
                          }
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                              Traitement...
                            </>
                          ) : isCheckingStores ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                              Vérification des boutiques...
                            </>
                          ) : (
                            <>
                              <CreditCard className="mr-2 h-4 w-4" aria-hidden="true" />
                              Payer {finalTotal.toLocaleString('fr-FR')} XOF
                              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                            </>
                          )}
                        </Button>

                        <p className="text-xs text-center text-muted-foreground">
                          {summary.item_count} {summary.item_count > 1 ? 'articles' : 'article'}
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              </aside>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}






