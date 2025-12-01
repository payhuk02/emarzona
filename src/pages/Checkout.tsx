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

import { useState, useMemo, useEffect } from 'react';
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
import {
  ShoppingBag,
  MapPin,
  Phone,
  Mail,
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
  const { items, summary, isLoading: cartLoading, appliedCoupon: appliedCouponLegacy } = useCart();
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
  const [selectedPaymentProvider, setSelectedPaymentProvider] = useState<'moneroo' | 'paydunya'>('moneroo');
  
  
  // Récupérer l'utilisateur pour pré-remplir le formulaire
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
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
            // Grouper les items par boutique
            const { storeGroups: groups, skippedItems } = await groupItemsByStore(items);
            setStoreGroups(groups);
            
            // Afficher un avertissement si des produits ont été ignorés
            if (skippedItems.length > 0) {
              const productNames = skippedItems.map(item => `${item.product_name} (x${item.quantity})`).join(', ');
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
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('Error in checkMultiStore:', { error: errorMessage });
      } finally {
        setIsCheckingStores(false);
      }
    };

    checkMultiStore();
  }, [items]);

  // Restaurer le code promo depuis localStorage au chargement
  useEffect(() => {
    try {
      const savedCoupon = localStorage.getItem('applied_coupon');
      if (savedCoupon) {
        const coupon = JSON.parse(savedCoupon);
        if (coupon.id && coupon.discountAmount && coupon.code) {
          setAppliedCouponCode({
            id: coupon.id,
            discountAmount: coupon.discountAmount,
            code: coupon.code,
          });
        }
      }
    } catch (error) {
      logger.warn('Error loading coupon from localStorage:', error);
      localStorage.removeItem('applied_coupon');
    }
  }, []);

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
    const savedGiftCard = localStorage.getItem('applied_gift_card');
    if (savedGiftCard) {
      try {
        const giftCard = JSON.parse(savedGiftCard);
        setAppliedGiftCard(giftCard);
      } catch (e) {
        localStorage.removeItem('applied_gift_card');
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

  // Calculer taxes automatiquement selon le pays (estimation avant création commande)
  // Le calcul précis se fera via la fonction RPC lors de la création de la commande
  const taxRate = useMemo(() => {
    // TVA par défaut selon le pays
    const defaultRates: Record<string, number> = {
      'BF': 0.18, // Burkina Faso
      'CI': 0.18, // Côte d'Ivoire
      'SN': 0.18, // Sénégal
      'ML': 0.18, // Mali
      'NE': 0.19, // Niger
      'TG': 0.18, // Togo
      'BJ': 0.18, // Bénin
    };
    return defaultRates[formData.country] || 0.18;
  }, [formData.country]);

  // Calculer shipping (exemple simple : 5000 XOF pour BF, 15000 pour autres)
  const shippingAmount = useMemo(() => {
    if (formData.country === 'BF') {
      return 5000; // Frais de livraison Burkina Faso
    }
    return 15000; // International
  }, [formData.country]);

  // Montant du coupon (calculé avant taxes et shipping)
  // Extraire les valeurs primitives pour garantir la détection des changements par React
  const couponDiscountValue = appliedCouponCode?.discountAmount ?? 0;
  const couponId = appliedCouponCode?.id ?? null;
  
  const couponDiscountAmount = useMemo(() => {
    return couponDiscountValue ? Number(couponDiscountValue) : 0;
  }, [couponDiscountValue, couponId]);

  const taxAmount = useMemo(() => {
    // Calculer sur le montant après remise et coupon (mais avant carte cadeau pour simplifier)
    // La carte cadeau sera appliquée après le calcul des taxes
    const taxableAmount = summary.subtotal - summary.discount_amount - couponDiscountAmount;
    return Math.max(0, taxableAmount * taxRate);
  }, [summary.subtotal, summary.discount_amount, couponDiscountAmount, taxRate]);

  // Montant à utiliser de la carte cadeau (calculé après taxes et shipping)
  const giftCardAmount = useMemo(() => {
    if (!appliedGiftCard || !appliedGiftCard.balance) return 0;
    
    // Montant total avant carte cadeau : subtotal - coupon - discount existant + taxes + shipping
    const baseAmount = summary.subtotal - summary.discount_amount - couponDiscountAmount;
    const amountWithTaxesAndShipping = baseAmount + (baseAmount * taxRate) + shippingAmount;
    
    // Utiliser le maximum possible de la carte cadeau (mais pas plus que le montant dû)
    return Math.min(appliedGiftCard.balance, amountWithTaxesAndShipping);
  }, [appliedGiftCard, summary.subtotal, summary.discount_amount, couponDiscountAmount, taxRate, shippingAmount]);

  // Total final - Calculé après toutes les réductions (panier, coupon, carte cadeau)
  // Utiliser directement les valeurs primitives dans les dépendances pour garantir la détection
  const finalTotal = useMemo(() => {
    // Calculer le montant de base : sous-total - réductions du panier - réduction du coupon
    const subtotalAfterDiscounts = summary.subtotal - summary.discount_amount - couponDiscountAmount;
    
    // Ajouter les taxes (calculées sur le montant après réductions)
    const subtotalWithTaxes = subtotalAfterDiscounts + taxAmount;
    
    // Ajouter les frais de livraison
    const subtotalWithShipping = subtotalWithTaxes + shippingAmount;
    
    // Appliquer la carte cadeau en dernier
    const finalAmount = Math.max(0, subtotalWithShipping - giftCardAmount);
    
    return finalAmount;
  }, [
    summary.subtotal, 
    summary.discount_amount, 
    couponDiscountAmount,
    couponDiscountValue,
    couponId,
    appliedCouponCode?.discountAmount ?? 0, // Ajouter aussi directement pour garantir
    appliedCouponCode?.id ?? null, // Ajouter aussi directement pour garantir
    taxAmount, 
    shippingAmount, 
    giftCardAmount
  ]);

  // Validation formulaire
  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof ShippingAddress, string>> = {};

    if (!formData.full_name.trim()) {
      errors.full_name = 'Le nom complet est requis';
    }

    if (!formData.email.trim()) {
      errors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email invalide';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Le téléphone est requis';
    }

    if (!formData.address_line1.trim()) {
      errors.address_line1 = 'L\'adresse est requise';
    }

    if (!formData.city.trim()) {
      errors.city = 'La ville est requise';
    }

    if (!formData.postal_code.trim()) {
      errors.postal_code = 'Le code postal est requis';
    }

    if (!formData.country.trim()) {
      errors.country = 'Le pays est requis';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

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
      const { data: { user } } = await supabase.auth.getUser();
      
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
        // Traitement multi-stores
        logger.log('Multi-store checkout detected', { storeCount: storeGroups.size });

        // Récupérer les infos d'affiliation si disponible
        const affiliateInfo = await getAffiliateInfo();

        // Traiter le checkout multi-stores
        const multiStoreResult = await processMultiStoreCheckout(items, {
          shippingAddress: formData,
          customerId: user.id,
          customerEmail: formData.email,
          customerName: formData.full_name,
          customerPhone: formData.phone,
          paymentProvider: selectedPaymentProvider || 'moneroo',
          taxRate,
          shippingAmount,
          appliedCoupon: appliedCouponCode ? {
            id: appliedCouponCode.id,
            discountAmount: couponDiscountAmount,
            code: appliedCouponCode.code,
            storeId: storeId || undefined, // Si le coupon est spécifique à une boutique
          } : undefined,
          appliedGiftCard: appliedGiftCard ? {
            id: appliedGiftCard.id,
            balance: appliedGiftCard.balance,
            code: appliedGiftCard.code,
            storeId: storeId || undefined, // Si la carte cadeau est spécifique à une boutique
          } : undefined,
          affiliateInfo: affiliateInfo, // Passer les infos d'affiliation
        });

        if (!multiStoreResult.success) {
          throw new Error(multiStoreResult.error || 'Erreur lors du traitement multi-stores');
        }

        // Vérifier que des commandes ont été créées
        if (multiStoreResult.orders.length === 0) {
          throw new Error('Aucune commande n\'a été créée');
        }

        // Afficher un message de succès
        toast({
          title: 'Commandes créées avec succès',
          description: `${multiStoreResult.orders.length} commande(s) créée(s) pour ${multiStoreResult.orders.length} boutique(s) différente(s)`,
        });

        // Afficher un avertissement si des produits ont été ignorés ou si des transactions n'ont pas pu être créées
        if (multiStoreResult.warning) {
          toast({
            title: 'Avertissement',
            description: multiStoreResult.warning,
            variant: 'default',
          });
        }

        // Rediriger vers la page de résumé multi-commandes
        const orderIds = multiStoreResult.orders.map(o => o.order_id).join(',');
        navigate(`/checkout/multi-store-summary?orders=${orderIds}`);

        return; // Sortir de la fonction
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

      // Générer numéro de commande
      const { data: orderNumberData } = await supabase.rpc('generate_order_number');
      const orderNumber = orderNumberData || `ORD-${Date.now()}`;

      // Créer la commande
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          store_id: product.store_id,
          customer_id: user.id,
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

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

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
      if (appliedCouponCode && appliedCouponCode.id && couponDiscountAmount > 0) {
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
          const { error: usageError } = await supabase
            .from('promotion_usage')
            .insert({
              promotion_id: appliedCouponCode.id,
              order_id: order.id,
              customer_id: finalCustomerId || null,
              user_id: user?.id || null,
              discount_amount: couponDiscountAmount,
              order_total_before_discount: orderTotalBefore,
              order_total_after_discount: orderTotalAfter,
            });

          if (usageError) {
            logger.error('Error recording promotion usage:', { error: usageError });
          } else {
            // Mettre à jour le compteur current_uses de la promotion
            await supabase.rpc('increment_promotion_usage', {
              p_promotion_id: appliedCouponCode.id,
            }).catch((err) => {
              logger.warn('Error incrementing promotion usage counter:', { error: err });
            });

            logger.info('Promotion usage recorded', { promotionId: appliedCouponCode.id, orderId: order.id });
          }
        } catch (promotionError) {
          logger.error('Error recording promotion usage:', { error: promotionError });
          // Ne pas bloquer la commande si l'enregistrement échoue
        }
      }

      // Enregistrer l'utilisation du coupon legacy si un coupon a été appliqué
      interface LegacyCoupon {
        promotionId?: string;
        discountAmount?: number;
      }
      const legacyCoupon = appliedCouponLegacy as LegacyCoupon | null;
      if (legacyCoupon?.promotionId) {
        try {
          const { data: sessionId } = await supabase.auth.getSession();
          const { recordCouponUsage } = await import('@/lib/supabase-rpc');
          const { error: recordError } = await recordCouponUsage({
            promotion_id_param: legacyCoupon.promotionId,
            order_id_param: order.id,
            discount_amount_param: legacyCoupon.discountAmount || 0,
            original_amount_param: summary.subtotal + taxAmount,
            final_amount_param: finalTotal,
            session_id_param: sessionId?.session?.access_token || null,
          });

          if (recordError) {
            logger.error('Error recording coupon usage:', { error: recordError });
          }

          // Retirer le coupon après utilisation
          localStorage.removeItem('applied_coupon');
          sessionStorage.removeItem('applied_coupon');
        } catch (couponError) {
          logger.error('Error recording coupon usage:', { error: couponError });
          // Ne pas bloquer la commande si l'enregistrement du coupon échoue
        }
      }

      // Rédimer la carte cadeau si une carte a été appliquée
      if (appliedGiftCard && giftCardAmount > 0) {
        try {
          const { data: redeemResult, error: redeemError } = await supabase.rpc('redeem_gift_card' as any, {
            p_gift_card_id: appliedGiftCard.id,
            p_order_id: order.id,
            p_amount: giftCardAmount,
          });

          if (redeemError) {
            logger.error('Error redeeming gift card:', redeemError as any);
            toast({
              title: 'Attention',
              description: 'La carte cadeau n\'a pas pu être utilisée, mais la commande a été créée.',
              variant: 'destructive',
            });
          } else if (redeemResult && Array.isArray(redeemResult) && redeemResult.length > 0 && !(redeemResult[0] as any).success) {
            logger.error('Gift card redemption failed:', (redeemResult[0] as any).message);
            toast({
              title: 'Attention',
              description: (redeemResult[0] as any).message || 'La carte cadeau n\'a pas pu être utilisée.',
              variant: 'destructive',
            });
          } else {
            // Succès - retirer la carte cadeau du localStorage
            localStorage.removeItem('applied_gift_card');
            setAppliedGiftCard(null);
          }
        } catch (giftCardError) {
          logger.error('Error in gift card redemption:', giftCardError as any);
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
        customerId: user.id,
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
        throw new Error(paymentResult.error || 'Impossible d\'initialiser le paiement');
      }

      // Marquer le panier comme récupéré (pour abandoned cart recovery)
      try {
        const { error: recoveryError } = await (supabase.rpc as any)('mark_cart_recovered', {
          p_user_id: user?.id || null,
          p_session_id: null, // Session ID pourrait être récupéré si nécessaire
        });
        
        if (recoveryError) {
          logger.warn('Failed to mark cart as recovered', { error: recoveryError });
          // Ne pas bloquer le processus si l'erreur survient
        }
      } catch (recoveryError: any) {
        logger.warn('Error marking cart as recovered', { error: recoveryError });
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

    } catch (error: any) {
      logger.error('Erreur lors du checkout:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de finaliser la commande',
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
          <main className="flex-1 p-6">
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
          <main className="flex-1 p-6">
            <div className="max-w-4xl mx-auto">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Votre panier est vide. <Button variant="link" onClick={() => navigate('/cart')}>Retour au panier</Button>
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
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <header>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <ShoppingBag className="h-8 w-8" aria-hidden="true" />
                Finaliser la commande
              </h1>
              <p className="text-muted-foreground mt-1" id="checkout-description">
                Remplissez vos informations pour compléter votre achat
              </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Formulaire (2/3) */}
              <div className="lg:col-span-2 space-y-6">
                {/* Informations de livraison */}
                <Card role="region" aria-labelledby="shipping-title" aria-describedby="shipping-description">
                  <CardHeader>
                    <CardTitle id="shipping-title" className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" aria-hidden="true" />
                      Informations de livraison
                    </CardTitle>
                    <CardDescription id="shipping-description">
                      Où souhaitez-vous recevoir votre commande ?
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="full_name">
                          Nom complet <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="full_name"
                          value={formData.full_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                          placeholder="Jean Dupont"
                          className={formErrors.full_name ? 'border-red-500' : ''}
                        />
                        {formErrors.full_name && (
                          <p className="text-sm text-red-500">{formErrors.full_name}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">
                          Email <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="jean@example.com"
                            className={`pl-10 ${formErrors.email ? 'border-red-500' : ''}`}
                            aria-invalid={!!formErrors.email}
                            aria-describedby={formErrors.email ? "email-error" : undefined}
                            autoComplete="email"
                          />
                        </div>
                        {formErrors.email && (
                          <p id="email-error" className="text-sm text-red-500" role="alert">{formErrors.email}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">
                        Téléphone <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="+225 07 12 34 56 78"
                          className={`pl-10 ${formErrors.phone ? 'border-red-500' : ''}`}
                          aria-invalid={!!formErrors.phone}
                          aria-describedby={formErrors.phone ? "phone-error" : undefined}
                          autoComplete="tel"
                        />
                      </div>
                      {formErrors.phone && (
                        <p id="phone-error" className="text-sm text-red-500" role="alert">{formErrors.phone}</p>
                      )}
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label htmlFor="address_line1">
                        Adresse <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="address_line1"
                        value={formData.address_line1}
                        onChange={(e) => setFormData(prev => ({ ...prev, address_line1: e.target.value }))}
                        placeholder="123 Rue principale"
                        className={formErrors.address_line1 ? 'border-red-500' : ''}
                      />
                      {formErrors.address_line1 && (
                        <p className="text-sm text-red-500">{formErrors.address_line1}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address_line2">
                        Complément d'adresse (optionnel)
                      </Label>
                      <Input
                        id="address_line2"
                        value={formData.address_line2}
                        onChange={(e) => setFormData(prev => ({ ...prev, address_line2: e.target.value }))}
                        placeholder="Appartement, étage, etc."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">
                          Ville <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                          placeholder="Abidjan"
                          className={formErrors.city ? 'border-red-500' : ''}
                        />
                        {formErrors.city && (
                          <p className="text-sm text-red-500">{formErrors.city}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="postal_code">
                          Code postal <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="postal_code"
                          value={formData.postal_code}
                          onChange={(e) => setFormData(prev => ({ ...prev, postal_code: e.target.value }))}
                          placeholder="01 BP 1234"
                          className={formErrors.postal_code ? 'border-red-500' : ''}
                        />
                        {formErrors.postal_code && (
                          <p className="text-sm text-red-500">{formErrors.postal_code}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="country">
                          Pays <span className="text-red-500">*</span>
                        </Label>
                        <select
                          id="country"
                          value={formData.country}
                          onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                          className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${formErrors.country ? 'border-red-500' : ''}`}
                          aria-invalid={!!formErrors.country}
                          aria-describedby={formErrors.country ? "country-error" : undefined}
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
                          <p id="country-error" className="text-sm text-red-500" role="alert">{formErrors.country}</p>
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
                            localStorage.setItem('applied_gift_card', JSON.stringify({
                              id: giftCardId,
                              balance,
                              code: code || '',
                            }));
                          }}
                          onRemove={() => {
                            setAppliedGiftCard(null);
                            localStorage.removeItem('applied_gift_card');
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
                              {group.items.map((item) => (
                                <div key={item.id || item.product_id} className="flex gap-2 text-xs">
                                  <div className="w-8 h-8 rounded border overflow-hidden flex-shrink-0">
                                    <img
                                      src={item.product_image_url || '/placeholder-product.png'}
                                      alt={item.product_name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate text-xs">{item.product_name}</p>
                                    {item.variant_name && (
                                      <p className="text-xs text-muted-foreground">{item.variant_name}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                      {item.quantity} × {item.unit_price.toLocaleString('fr-FR')} XOF
                                    </p>
                                  </div>
                                  <p className="font-medium whitespace-nowrap text-xs">
                                    {((item.unit_price - (item.discount_amount || 0)) * item.quantity).toLocaleString('fr-FR')} XOF
                                  </p>
                                </div>
                              ))}
                            </div>
                            <Separator />
                            <div className="space-y-1 text-xs pt-1">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Sous-total:</span>
                                <span>{group.subtotal.toLocaleString('fr-FR')} XOF</span>
                              </div>
                              {group.tax_amount > 0 && (
                                <div className="flex justify-between text-muted-foreground">
                                  <span>Taxes:</span>
                                  <span>{group.tax_amount.toLocaleString('fr-FR')} XOF</span>
                                </div>
                              )}
                              {group.shipping_amount > 0 && (
                                <div className="flex justify-between text-muted-foreground">
                                  <span>Livraison:</span>
                                  <span>{group.shipping_amount.toLocaleString('fr-FR')} XOF</span>
                                </div>
                              )}
                              {group.discount_amount > 0 && (
                                <div className="flex justify-between text-green-600">
                                  <span>Réduction panier:</span>
                                  <span>-{group.discount_amount.toLocaleString('fr-FR')} XOF</span>
                                </div>
                              )}
                              {appliedCouponCode && couponDiscountAmount > 0 && (
                                <div className="flex justify-between text-green-600">
                                  <span>Code promo ({appliedCouponCode.code}):</span>
                                  <span>-{couponDiscountAmount.toLocaleString('fr-FR')} XOF</span>
                                </div>
                              )}
                              <div className="flex justify-between font-semibold pt-1 border-t">
                                <span>Total:</span>
                                <span>{group.total.toLocaleString('fr-FR')} XOF</span>
                              </div>
                            </div>
                          </div>
                        ))}
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-xs">
                            Votre commande sera divisée en {storeGroups.size} commande(s) distincte(s), une par boutique.
                          </AlertDescription>
                        </Alert>
                        <Separator />
                        <div className="space-y-2 text-sm pt-2">
                          {appliedCouponCode && couponDiscountAmount > 0 && (
                            <div className="flex justify-between text-green-600">
                              <span>Code promo ({appliedCouponCode.code}):</span>
                              <span>-{couponDiscountAmount.toLocaleString('fr-FR')} XOF</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center text-lg font-bold pt-2 border-t">
                            <span>Total Général:</span>
                            <span className="text-2xl text-primary">
                              {Math.max(0, Array.from(storeGroups.values())
                                .reduce((sum, group) => sum + group.total, 0) - (appliedCouponCode ? couponDiscountAmount : 0))
                                .toLocaleString('fr-FR')} XOF
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
                          aria-label={isProcessing ? "Traitement de la commande en cours" : `Finaliser les commandes pour ${Array.from(storeGroups.values()).reduce((sum, group) => sum + group.total, 0).toLocaleString('fr-FR')} XOF`}
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
                                .reduce((sum, group) => sum + group.total, 0)
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
                          {items.map((item) => (
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
                                  <p className="text-xs text-muted-foreground">{item.variant_name}</p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                  Quantité: {item.quantity}
                                </p>
                              </div>
                              <p className="font-medium whitespace-nowrap">
                                {((item.unit_price - (item.discount_amount || 0)) * item.quantity).toLocaleString('fr-FR')} XOF
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
                            <Label htmlFor="coupon-code" className="text-sm font-semibold text-foreground">
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
                              setAppliedCouponCode({
                                id: promotionId,
                                discountAmount,
                                code: code || '',
                              });
                              localStorage.setItem('applied_coupon', JSON.stringify({
                                id: promotionId,
                                discountAmount,
                                code: code || '',
                                appliedAt: new Date().toISOString(),
                              }));
                              toast({
                                title: '✅ Code promo appliqué',
                                description: `Réduction de ${discountAmount.toLocaleString('fr-FR')} XOF appliquée`,
                              });
                            }}
                            onRemove={() => {
                              setAppliedCouponCode(null);
                              localStorage.removeItem('applied_coupon');
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

                          {summary.discount_amount > 0 && (
                            <div className="flex justify-between text-green-600">
                              <span>Remise panier</span>
                              <span>-{summary.discount_amount.toLocaleString('fr-FR')} XOF</span>
                            </div>
                          )}

                          {appliedCouponCode && couponDiscountAmount > 0 && (
                            <div className="flex justify-between text-green-600">
                              <span>Code promo ({appliedCouponCode.code})</span>
                              <span>-{couponDiscountAmount.toLocaleString('fr-FR')} XOF</span>
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

                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Taxes (TVA 18% - BF)</span>
                            <span>{taxAmount.toLocaleString('fr-FR')} XOF</span>
                          </div>
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
                          aria-label={isProcessing ? "Traitement de la commande en cours" : `Finaliser la commande pour ${finalTotal.toLocaleString('fr-FR')} XOF`}
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

