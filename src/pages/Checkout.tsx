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

import { useState, useMemo, useEffect, useCallback, lazy, Suspense } from 'react';
import { AppPageShell } from '@/components/layout/AppPageShell';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCart } from '@/hooks/cart/useCart';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { initiatePayment } from '@/lib/payment-service';
import { getAffiliateInfo } from '@/lib/affiliation-tracking';
import { safeRedirect } from '@/lib/url-validator';
import { redirectToPlatformLogin } from '@/lib/auth-routes';
import { logger } from '@/lib/logger';
import {
  PaymentProviderSelector,
  type PaymentProvider,
} from '@/components/checkout/PaymentProviderSelector';
import type { CartItem } from '@/types/cart';
import type {
  AppliedCoupon,
  AppliedGiftCard,
  CheckoutStoreGroup,
  ShippingAddress,
} from '@/pages/checkout/cart/checkout-types';
import { isTaxCalculationResult } from '@/pages/checkout/cart/checkout-types';
import { validateShippingForm } from '@/pages/checkout/cart/checkout-validation';
import { buildOrderItemRows } from '@/lib/checkout-order-items';
import { resolveOrderNumber } from '@/lib/orders/resolve-order-number';
import { resolveCheckoutShippingAmount } from '@/lib/checkout-shipping';
import { calculateCheckoutTaxes } from '@/lib/checkout/taxes';
import { validateCheckoutCart } from '@/lib/checkout/cart-validation';
import { showCheckoutBlockedToast, showPaymentErrorToast } from '@/lib/checkout/payment-toast';
import { assessCheckoutFraudRisk } from '@/lib/checkout/fraud-assessment';
import { isPaymentOrchestrationV2Enabled } from '@/lib/payments/feature-flags';
import { validateMultiStorePaymentProvider } from '@/lib/payments/multi-store-checkout';
import { reserveArtistLimitedEditionsForCart } from '@/lib/artist-edition-reservation';
import {
  cartHasArtistDedications,
  getCartDedicationPreview,
  persistArtistDedicationsFromCartItems,
} from '@/lib/checkout/artist-dedications';
import {
  cartHasPhysicalItems,
  releasePhysicalInventoryForOrder,
  reservePhysicalInventoryForOrder,
} from '@/lib/physical-inventory';
import { ShoppingBag, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

const CheckoutShippingSection = lazy(
  () => import('@/components/checkout/cart/CheckoutShippingSection')
);
const CheckoutOrderSummary = lazy(() => import('@/components/checkout/cart/CheckoutOrderSummary'));

function CheckoutSectionFallback() {
  return (
    <Card>
      <CardContent className="py-8 space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
      </CardContent>
    </Card>
  );
}

export default function Checkout() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { items, summary, isLoading: cartLoading } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);

  const checkoutCartValidation = useMemo(() => validateCheckoutCart(items), [items]);
  const checkoutBlocked = !checkoutCartValidation.canCheckout;

  useEffect(() => {
    if (
      !checkoutCartValidation.canCheckout &&
      checkoutCartValidation.message &&
      (checkoutCartValidation.serviceOnly || checkoutCartValidation.hasMixedWithService)
    ) {
      showCheckoutBlockedToast(toast, checkoutCartValidation.message);
    }
  }, [checkoutCartValidation.canCheckout, checkoutCartValidation.message, toast]);

  // State pour la carte cadeau
  const [appliedGiftCard, setAppliedGiftCard] = useState<AppliedGiftCard | null>(null);

  // State pour le coupon (nouveau système)
  const [appliedCouponCode, setAppliedCouponCode] = useState<AppliedCoupon | null>(null);

  // State pour charger le store_id (nécessaire pour la carte cadeau et coupon)
  const [storeId, setStoreId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [isFirstOrder, setIsFirstOrder] = useState<boolean>(false);

  // State pour le provider de paiement sélectionné
  const [selectedPaymentProvider, setSelectedPaymentProvider] =
    useState<PaymentProvider>('moneroo');

  // State pour la gestion multi-stores
  const [isMultiStore, setIsMultiStore] = useState<boolean>(false);
  const [storeGroups, setStoreGroups] = useState<Map<string, CheckoutStoreGroup>>(new Map());
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
            const groups = new Map<string, CheckoutStoreGroup>();
            const skippedItems: CartItem[] = [];

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
      } catch (_error: unknown) {
        const errorMessage = _error instanceof Error ? _error.message : String(_error);
        logger.error('Error in checkMultiStore:', { error: errorMessage });
      } finally {
        setIsCheckingStores(false);
      }
    };

    checkMultiStore();
  }, [items, toast]);

  // Restaurer le code promo depuis localStorage au chargement
  // IMPORTANT: Ne charger que si le coupon n'est pas déjà chargé
  // pour éviter la double application
  useEffect(() => {
    setAppliedCouponCode(prev => {
      if (prev) return prev; // Déjà chargé, ne pas recharger
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
              return null;
            }
          }

          const discountAmount = Number(c.discountAmount);
          if (
            typeof c.id === 'string' &&
            typeof c.code === 'string' &&
            Number.isFinite(discountAmount)
          ) {
            return {
              id: c.id,
              discountAmount, // S'assurer que c'est un nombre
              code: c.code,
            };
          }
        }
      } catch (_error: unknown) {
        const errorObj = _error instanceof Error ? _error : new Error(String(_error));
        logger.warn('Error loading coupon from localStorage:', errorObj);
        try {
          localStorage.removeItem('applied_coupon');
        } catch {
          // ignore
        }
      }
      return null;
    });
  }, []); // S'exécute uniquement au montage

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
    let savedGiftCard: string | null = null;
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
      } catch (_e) {
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
  useEffect(() => {
    if (user?.email && !formData.email) {
      setFormData(prev => ({
        ...prev,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || '',
      }));
    }
  }, [user, formData.email]);

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
  }, [appliedCouponCode]);

  // 3. Sous-total après remises
  // IMPORTANT: summary.subtotal = prix total - remises items (déjà calculé dans useCart)
  // On soustrait UNIQUEMENT le coupon, pas les remises items qui sont déjà dans summary.subtotal
  const subtotalAfterDiscounts = useMemo(() => {
    return Math.max(0, summary.subtotal - couponDiscount);
  }, [summary.subtotal, couponDiscount]);

  const { data: computedShipping } = useQuery({
    queryKey: [
      'checkout-shipping',
      formData.country,
      formData.city,
      formData.postal_code,
      items.map(i => `${i.product_id}:${i.quantity}:${i.product_type}`).join('|'),
    ],
    queryFn: () =>
      resolveCheckoutShippingAmount(items, {
        country: formData.country,
        city: formData.city,
        postal_code: formData.postal_code,
      }),
    enabled: !!formData.country && items.length > 0,
    staleTime: 60_000,
  });

  const shippingAmount = useMemo(() => {
    if (computedShipping != null) return computedShipping;
    if (!formData.country) return 0;
    const hasArtist = items.some(i => i.product_type === 'artist');
    if (hasArtist) return formData.country === 'BF' ? 15000 : 35000;
    const hasPhysical = items.some(i => i.product_type === 'physical');
    if (hasPhysical) return formData.country === 'BF' ? 5000 : 15000;
    return 0;
  }, [computedShipping, formData.country, items]);

  // Calculer taxes automatiquement via la fonction RPC
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

      return calculateCheckoutTaxes({
        subtotal: subtotalAfterDiscounts,
        shippingAmount,
        countryCode: formData.country,
        stateProvince: formData.state || null,
        postalCode: formData.postal_code || null,
        city: formData.city || null,
        currency:
          items[0]?.currency && items[0].currency.length === 3
            ? items[0].currency.toUpperCase()
            : 'XOF',
        storeId: storeId || null,
        items,
      });
    },
    enabled: !!formData.country && subtotalAfterDiscounts > 0,
    staleTime: 30000, // Cache pendant 30 secondes
  });

  // 5. Calcul des taxes via RPC (utilise les configurations de la base de données)
  const taxAmount = useMemo(() => {
    if (isTaxCalculationResult(taxCalculation)) return Number(taxCalculation.tax_amount);
    return 0;
  }, [taxCalculation]);

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
  }, [appliedGiftCard, subtotalWithShipping]);

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
    appliedCouponCode,
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
    selectedPaymentProvider: PaymentProvider;
  }) => {
    const createdOrders: Array<{
      orderId: string;
      storeId: string;
      orderNumber: string;
      checkoutUrl?: string;
    }> = [];
    const errors: Array<{ storeId: string; error: string }> = [];

    // Éditions limitées : verrou inventaire avant toute création de commande (évite survente panier)
    const allCartItems = Array.from(storeGroups.values()).flatMap(g => g.items);
    await reserveArtistLimitedEditionsForCart(allCartItems);

    // Récupérer les infos d'affiliation si disponible
    const affiliateInfo = await getAffiliateInfo();
    const hasAffiliate = affiliateInfo.affiliate_link_id && affiliateInfo.product_id;

    // Traiter chaque boutique
    for (const [storeId, group] of storeGroups.entries()) {
      try {
        logger.info(`Processing checkout for store: ${storeId}`, { itemCount: group.items.length });

        // Récupérer les informations de la boutique
        const { data: store } = await supabase
          .from('stores_public')
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
        let finalCustomerId: string | null = null;
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
        const { data: orderNumberData, error: orderNumberError } =
          await supabase.rpc('generate_order_number');
        const orderNumber = resolveOrderNumber(orderNumberData, orderNumberError, {
          suffix: storeId.slice(0, 8),
        });

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
            metadata: {
              multi_store: true,
              checkout_user_id: checkoutUser?.id ?? null,
            },
          })
          .select()
          .single();

        if (orderError) {
          errors.push({ storeId, error: `Erreur création commande: ${orderError.message}` });
          continue;
        }

        const orderItems = await buildOrderItemRows(order.id, group.items);

        const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

        if (itemsError) {
          errors.push({ storeId, error: `Erreur création items: ${itemsError.message}` });
          continue;
        }

        await persistArtistDedicationsFromCartItems(order.id, group.items);

        if (cartHasPhysicalItems(group.items)) {
          try {
            await reservePhysicalInventoryForOrder(order.id);
          } catch (stockErr: unknown) {
            const stockMessage = stockErr instanceof Error ? stockErr.message : 'Stock insuffisant';
            errors.push({ storeId, error: stockMessage });
            await releasePhysicalInventoryForOrder(order.id);
            continue;
          }
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
          if (cartHasPhysicalItems(group.items)) {
            await releasePhysicalInventoryForOrder(order.id);
          }
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
      } catch (_error: unknown) {
        const errorMessage = _error instanceof Error ? _error.message : 'Erreur inconnue';
        logger.error(`Error processing checkout for store ${storeId}:`, { error: errorMessage });
        errors.push({ storeId, error: errorMessage });
      }
    }

    // Résumé des résultats
    if (createdOrders.length === 0) {
      showPaymentErrorToast(
        toast,
        "Aucune commande n'a pu être créée. Veuillez réessayer.",
        'Erreur'
      );
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

  const validateForm = (): boolean => {
    const errors = validateShippingForm(formData);
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleGiftCardApply = useCallback((id: string, balance: number, code: string) => {
    setAppliedGiftCard({ id, balance, code: code || '' });
    try {
      localStorage.setItem('applied_gift_card', JSON.stringify({ id, balance, code: code || '' }));
    } catch {
      // ignore
    }
  }, []);

  const handleGiftCardRemove = useCallback(() => {
    setAppliedGiftCard(null);
    try {
      localStorage.removeItem('applied_gift_card');
    } catch {
      // ignore
    }
  }, []);

  const handleCouponApply = useCallback(
    (promotionId: string, discountAmount: number, code: string) => {
      const newCoupon: AppliedCoupon = {
        id: promotionId,
        discountAmount: Number(discountAmount),
        code: code || '',
      };
      setAppliedCouponCode(newCoupon);
      try {
        localStorage.setItem(
          'applied_coupon',
          JSON.stringify({ ...newCoupon, appliedAt: new Date().toISOString() })
        );
      } catch {
        // ignore
      }
      toast({
        title: '✅ Code promo appliqué',
        description: `Réduction de ${discountAmount.toLocaleString('fr-FR')} XOF appliquée`,
      });
    },
    [toast]
  );

  const handleCouponRemove = useCallback(() => {
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
  }, [toast]);

  // Traitement de la commande
  const handleCheckout = async () => {
    if (!validateForm()) {
      showCheckoutBlockedToast(toast, 'Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    if (items.length === 0) {
      showCheckoutBlockedToast(toast, 'Votre panier est vide');
      navigate('/cart');
      return;
    }

    if (!checkoutCartValidation.canCheckout) {
      showCheckoutBlockedToast(
        toast,
        checkoutCartValidation.message ??
          'Certains articles ne peuvent pas être payés via ce checkout.'
      );
      return;
    }

    setIsProcessing(true);

    try {
      // Récupérer l'utilisateur
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        showCheckoutBlockedToast(toast, 'Veuillez vous connecter pour continuer');
        redirectToPlatformLogin(navigate);
        return;
      }

      const fraud = await assessCheckoutFraudRisk({
        email: formData.email || user.email,
        amount: finalTotal,
        currency: items[0]?.currency ?? 'XOF',
      });
      if (fraud.block) {
        showPaymentErrorToast(
          toast,
          'Cette transaction a été bloquée pour des raisons de sécurité. Contactez le support si besoin.',
          'Paiement refusé'
        );
        return;
      }

      // 🆕 Vérifier si le panier contient des produits de plusieurs boutiques
      if (isMultiStore && storeGroups.size > 1) {
        logger.info('Multi-store checkout detected', { storeCount: storeGroups.size });

        const multiStorePaymentCheck = validateMultiStorePaymentProvider({
          storeCount: storeGroups.size,
          provider: selectedPaymentProvider,
          orchestrationEnabled: isPaymentOrchestrationV2Enabled(),
        });
        if (!multiStorePaymentCheck.allowed) {
          toast({
            title: 'Paiement non disponible',
            description: multiStorePaymentCheck.message,
            variant: 'destructive',
          });
          return;
        }

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
      let finalCustomerId: string | null = null;
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

      // Éditions limitées : verrou inventaire (même logique que useCreateArtistOrder)
      await reserveArtistLimitedEditionsForCart(items);

      // Générer numéro de commande
      const { data: orderNumberData, error: orderNumberError } =
        await supabase.rpc('generate_order_number');
      const orderNumber = resolveOrderNumber(orderNumberData, orderNumberError);

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

      const orderItems = await buildOrderItemRows(order.id, items);

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

      if (itemsError) throw itemsError;

      await persistArtistDedicationsFromCartItems(order.id, items);

      if (cartHasPhysicalItems(items)) {
        await reservePhysicalInventoryForOrder(order.id);
      }

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
          let finalCustomerId = customerId;
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
            } catch (_err: unknown) {
              const errorMessage = _err instanceof Error ? _err.message : String(_err);
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
        if (cartHasPhysicalItems(items)) {
          await releasePhysicalInventoryForOrder(order.id);
        }
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
      } catch (_recoveryError: unknown) {
        const errorMessage =
          _recoveryError instanceof Error ? _recoveryError.message : String(_recoveryError);
        logger.warn('Error marking cart as recovered', { error: errorMessage });
        // Ne pas bloquer le processus si l'erreur survient
      }

      // Rediriger vers le provider de paiement
      safeRedirect(paymentResult.checkout_url, () => {
        showPaymentErrorToast(toast, 'URL de paiement invalide');
      });
    } catch (_error: unknown) {
      const errorMessage =
        _error instanceof Error ? _error.message : 'Impossible de finaliser la commande';
      logger.error('Erreur lors du checkout:', { error: errorMessage });
      showPaymentErrorToast(toast, errorMessage, 'Erreur');
    } finally {
      setIsProcessing(false);
    }
  };

  if (cartLoading) {
    return (
      <AppPageShell mainClassName="p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-96" />
            </div>
            <Skeleton className="h-96" />
          </div>
        </div>
      </AppPageShell>
    );
  }

  if (items.length === 0) {
    return (
      <AppPageShell mainClassName="p-6">
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
      </AppPageShell>
    );
  }

  return (
    <AppPageShell shellClassName="bg-gray-50 dark:bg-gray-900" mainClassName="p-4 md:p-6 lg:p-8">
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
            <Suspense fallback={<CheckoutSectionFallback />}>
              <CheckoutShippingSection
                formData={formData}
                setFormData={setFormData}
                formErrors={formErrors}
                setFormErrors={setFormErrors}
                storeId={storeId}
                appliedGiftCard={appliedGiftCard}
                onGiftCardApply={handleGiftCardApply}
                onGiftCardRemove={handleGiftCardRemove}
              />
            </Suspense>

            {cartHasArtistDedications(items) && (
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <h2 className="font-semibold">Dédicaces personnalisées</h2>
                  {items
                    .filter(item => item.product_type === 'artist')
                    .map(item => {
                      const dedication = getCartDedicationPreview(item);
                      if (!dedication) return null;
                      return (
                        <div
                          key={item.id ?? item.product_id}
                          className="rounded-lg border p-3 text-sm"
                        >
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-muted-foreground mt-1">{dedication.dedication_text}</p>
                          {dedication.recipient_name && (
                            <p className="text-muted-foreground">
                              Pour : {dedication.recipient_name}
                            </p>
                          )}
                        </div>
                      );
                    })}
                </CardContent>
              </Card>
            )}

            {/* Méthode de paiement */}
            <PaymentProviderSelector
              value={selectedPaymentProvider}
              onChange={setSelectedPaymentProvider}
              storeId={storeId || undefined}
              amount={finalTotal}
              currency={
                items[0]?.currency && items[0].currency.length === 3
                  ? items[0].currency.toUpperCase()
                  : 'XOF'
              }
              buyerCountry={formData.country || null}
            />
          </div>

          <aside className="lg:col-span-1" aria-label="Récapitulatif de la commande">
            <Suspense fallback={<CheckoutSectionFallback />}>
              <CheckoutOrderSummary
                items={items}
                summary={summary}
                isCheckingStores={isCheckingStores}
                isMultiStore={isMultiStore}
                storeGroups={storeGroups}
                appliedCouponCode={appliedCouponCode}
                couponDiscount={couponDiscount}
                giftCardAmount={giftCardAmount}
                appliedGiftCard={appliedGiftCard}
                taxLoading={taxLoading}
                taxBreakdown={taxBreakdown}
                taxAmount={taxAmount}
                itemDiscounts={itemDiscounts}
                shippingAmount={shippingAmount}
                finalTotal={finalTotal}
                storeId={storeId}
                customerId={customerId}
                isFirstOrder={isFirstOrder}
                isProcessing={isProcessing}
                checkoutBlocked={checkoutBlocked}
                handleCheckout={handleCheckout}
                onCouponApply={handleCouponApply}
                onCouponRemove={handleCouponRemove}
              />
            </Suspense>
          </aside>
        </div>
      </div>
    </AppPageShell>
  );
}
