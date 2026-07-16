import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { safeRedirect } from '@/lib/url-validator';
import { logger } from '@/lib/logger';
import { useLCPPreload } from '@/hooks/useLCPPreload';
import { generateProductUrl } from '@/lib/store-utils';
import { normalizePhoneForPayment } from '@/lib/validation';

/** Client Supabase assoupli pour tables absentes du schéma généré */
type LooseSupabaseClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (
        column: string,
        value: string
      ) => {
        single: () => Promise<{ data: unknown; error: unknown }>;
      };
    };
  };
};
import type {
  AppliedBuyNowCoupon,
  CheckoutFormData,
  CheckoutProduct,
  CheckoutStore,
  CheckoutUser,
  CheckoutVariant,
} from '@/pages/checkout/buy-now/checkout-buy-now-types';
import { validateBuyNowForm } from '@/pages/checkout/buy-now/checkout-buy-now-validation';
import { calculateBuyNowPrice } from '@/pages/checkout/buy-now/checkout-buy-now-pricing';
import { htmlToPlainText } from '@/lib/html-sanitizer';
import { isSupportedCurrency, type Currency } from '@/lib/currency-converter';
import { useCreatePhysicalOrder } from '@/hooks/orders/useCreatePhysicalOrder';
import { parsePhysicalCheckoutOptions } from '@/lib/physical/physical-checkout-display';
import { notifyPhysicalOrderPlaced } from '@/lib/notifications/physical-order-notification';
import { buildGuestOrderConfirmationPath } from '@/lib/physical/guest-order-confirmation';
import { useCreateOrder } from '@/hooks/orders/useCreateOrder';

const BuyNowOrderSummary = lazy(() => import('@/components/checkout/buy-now/BuyNowOrderSummary'));
const BuyNowCustomerForm = lazy(() => import('@/components/checkout/buy-now/BuyNowCustomerForm'));

function BuyNowSectionFallback() {
  return (
    <Card>
      <CardContent className="py-8 space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-32 w-full" />
      </CardContent>
    </Card>
  );
}

const CHECKOUT_PRODUCT_FIELDS =
  'id, store_id, slug, name, description, short_description, price, promotional_price, currency, image_url, product_type, payment_options';
const CHECKOUT_STORE_FIELDS = 'id, name, slug, subdomain, default_currency, logo_url, created_at';
const CHECKOUT_PUBLIC_STORE_FIELDS =
  'id, name, slug, subdomain, default_currency, logo_url, created_at';
const PHYSICAL_PRODUCT_VARIANT_FIELDS = 'id, price, promotional_price, option1_value, name';
const GENERIC_PRODUCT_VARIANT_FIELDS = 'id, price, promotional_price, option1_value, name';

/**
 * Page de finalisation de commande (Checkout)
 *
 * Permet à l'utilisateur de finaliser son achat en :
 * - Remplissant ses informations de livraison
 * - Appliquant un code promo éventuel
 * - Vérifiant le résumé de commande
 * - Procédant au paiement via GeniusPay
 *
 * @component
 * @returns {JSX.Element} Le composant Checkout
 *
 * @remarks
 * - Preload des images produit pour améliorer LCP
 * - Validation complète du formulaire
 * - Gestion des codes promo
 * - Intégration GeniusPay avec lazy loading
 * - Gestion d'erreurs robuste
 * - Accessible avec ARIA labels complets
 *
 * @example
 * ```tsx
 * <Route path="/checkout" element={<Checkout />} />
 * ```
 *
 * @see {@link loadGeniusPayPayment} pour l'intégration GeniusPay
 * @see {@link CouponInput} pour la gestion des codes promo
 */
const Checkout = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Paramètres URL
  const productId = searchParams.get('productId');
  const storeId = searchParams.get('storeId');
  const variantId = searchParams.get('variantId');
  const guestEmail = searchParams.get('guestEmail');
  const guestName = searchParams.get('guestName');
  const guestPhone = searchParams.get('guestPhone');
  const isGuestCheckout = Boolean(guestEmail?.trim());

  // États
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [product, setProduct] = useState<CheckoutProduct>(null);

  // ✅ PERFORMANCE: Preload image LCP pour améliorer Core Web Vitals
  // L'image sera mise à jour une fois le produit chargé
  const productImage = product?.image_url || undefined;
  useLCPPreload({
    src: productImage || '',
    sizes: productImage ? '(max-width: 640px) 100vw, 200px' : undefined,
    priority: !!productImage,
  });
  const [store, setStore] = useState<CheckoutStore>(null);
  const [user, setUser] = useState<CheckoutUser>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<CheckoutVariant>(null);

  // State pour le code promo
  const [appliedCouponCode, setAppliedCouponCode] = useState<AppliedBuyNowCoupon | null>(null);

  // Formulaire
  const [formData, setFormData] = useState<CheckoutFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    postalCode: '',
  });

  const [formErrors, setFormErrors] = useState<Partial<Record<keyof CheckoutFormData, string>>>({});

  const { mutateAsync: createPhysicalOrder } = useCreatePhysicalOrder();
  const { mutateAsync: createOrder } = useCreateOrder();

  const isGuestBuyer = !user;

  const physicalCheckout = useMemo(
    () =>
      product?.product_type === 'physical'
        ? parsePhysicalCheckoutOptions(product.payment_options)
        : null,
    [product]
  );

  const isPhysicalCod = physicalCheckout?.checkout_method === 'cash_on_delivery';
  const submitButtonLabel = isPhysicalCod ? 'Confirmer la commande' : 'Procéder au paiement';

  // Restaurer le code promo depuis localStorage au chargement
  useEffect(() => {
    try {
      const savedCoupon = localStorage.getItem('applied_coupon');
      if (savedCoupon) {
        const coupon = JSON.parse(savedCoupon) as unknown;
        const c = coupon as { id?: unknown; discountAmount?: unknown; code?: unknown };
        const discountAmount = Number(c.discountAmount);
        if (
          typeof c.id === 'string' &&
          typeof c.code === 'string' &&
          Number.isFinite(discountAmount)
        ) {
          setAppliedCouponCode({
            id: c.id,
            discountAmount,
            code: c.code,
          });
        }
      }
    } catch (error) {
      logger.warn('Error loading coupon from localStorage:', error as Error);
      try {
        localStorage.removeItem('applied_coupon');
      } catch {
        // ignore
      }
    }
  }, []);

  // Charger les données
  useEffect(() => {
    const loadData = async () => {
      if (!productId || !storeId) {
        setError('Paramètres manquants. Veuillez sélectionner un produit.');
        setLoading(false);
        return;
      }

      try {
        // Charger l'utilisateur
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
        if (currentUser) {
          setUser(currentUser);
        }

        // Charger le produit
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select(
            `
            ${CHECKOUT_PRODUCT_FIELDS},
            stores!inner (
              ${CHECKOUT_STORE_FIELDS}
            )
          `
          )
          .eq('id', productId)
          .eq('store_id', storeId)
          .single();

        if (productError) {
          logger.error('Error loading product:', productError);
          setError(`Produit introuvable: ${productError.message}`);
          setLoading(false);
          return;
        }

        if (!productData) {
          setError('Produit introuvable');
          setLoading(false);
          return;
        }

        setProduct(productData as unknown as CheckoutProduct);

        // Extraire la boutique depuis la relation
        // Supabase retourne stores comme un tableau même avec !inner
        if (
          productData.stores &&
          Array.isArray(productData.stores) &&
          productData.stores.length > 0
        ) {
          setStore(productData.stores[0] as CheckoutStore);
        } else {
          // Fallback: charger la boutique séparément si la relation n'a pas fonctionné
          const { data: storeData, error: storeError } = await supabase
            .from('stores_public')
            .select(CHECKOUT_PUBLIC_STORE_FIELDS)
            .eq('id', storeId)
            .single();

          if (storeError) {
            logger.error('Error loading store:', storeError);
          }

          if (storeData) {
            setStore(storeData as unknown as CheckoutStore);
          }
        }

        // Charger la variante si spécifiée
        // Les variantes doivent être chargées séparément car elles ne sont pas directement liées à products
        if (variantId) {
          try {
            const supabaseLoose = supabase as unknown as LooseSupabaseClient;
            // Essayer d'abord physical_product_variants (pour produits physiques)
            const { data: physicalVariant } = await supabaseLoose
              .from('physical_product_variants')
              .select(PHYSICAL_PRODUCT_VARIANT_FIELDS)
              .eq('id', variantId)
              .single();

            if (physicalVariant) {
              setSelectedVariant(physicalVariant as unknown as CheckoutVariant);
            } else {
              // Si pas trouvé, essayer product_variants (relation générique si elle existe)
              const { data: genericVariant } = await supabaseLoose
                .from('product_variants')
                .select(GENERIC_PRODUCT_VARIANT_FIELDS)
                .eq('id', variantId)
                .single();

              if (genericVariant) {
                setSelectedVariant(genericVariant as unknown as CheckoutVariant);
              }
            }
          } catch (variantError) {
            // Ne pas bloquer le checkout si la variante n'est pas trouvée
            logger.warn('Variant not found:', variantError as Error);
          }
        }

        // Pré-remplir le formulaire avec les données utilisateur ou invité
        if (currentUser?.email) {
          const fullName = currentUser.user_metadata?.full_name || currentUser.email.split('@')[0];
          const nameParts = fullName.split(' ');
          setFormData({
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || '',
            email: currentUser.email || '',
            phone: currentUser.user_metadata?.phone || '',
            address: currentUser.user_metadata?.address || '',
            city: currentUser.user_metadata?.city || 'Ouagadougou',
            country: currentUser.user_metadata?.country || 'Burkina Faso',
            postalCode: currentUser.user_metadata?.postal_code || '',
          });
        } else if (guestEmail) {
          const displayName = guestName?.trim() || guestEmail.split('@')[0];
          const nameParts = displayName.split(' ');
          setFormData({
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || '',
            email: guestEmail,
            phone: guestPhone || '',
            address: '',
            city: 'Ouagadougou',
            country: 'Burkina Faso',
            postalCode: '',
          });
        }
      } catch (_err: unknown) {
        logger.error(
          'Error loading checkout data:',
          _err instanceof Error ? _err : new Error(String(_err))
        );
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [
    productId,
    storeId,
    variantId,
    navigate,
    toast,
    isGuestCheckout,
    guestEmail,
    guestName,
    guestPhone,
  ]);

  /**
   * Valide le formulaire de commande
   *
   * @function validateForm
   * @returns {boolean} true si le formulaire est valide, false sinon
   *
   * @remarks
   * - Vérifie que tous les champs requis sont remplis
   * - Valide le format de l'email
   * - Met à jour les erreurs de formulaire
   * - Retourne true uniquement si aucune erreur
   */
  const validateForm = useCallback((): boolean => {
    const errors = validateBuyNowForm(formData);
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleCouponApply = useCallback(
    (couponId: string, discountAmount: number, code: string) => {
      setAppliedCouponCode({
        id: couponId,
        discountAmount,
        code: code || '',
      });
      localStorage.setItem(
        'applied_coupon',
        JSON.stringify({ id: couponId, discountAmount, code: code || '' })
      );
      toast({
        title: '✅ Code promo appliqué',
        description: `Réduction de ${discountAmount.toLocaleString('fr-FR')} XOF appliquée`,
      });
    },
    [toast]
  );

  const handleCouponRemove = useCallback(() => {
    setAppliedCouponCode(null);
    localStorage.removeItem('applied_coupon');
    toast({
      title: 'Code promo retiré',
      description: 'Le code promo a été retiré de votre commande',
    });
  }, [toast]);

  /**
   * Calcule le prix final de la commande
   *
   * @function calculatePrice
   * @returns {number} Le prix final après application des promotions et coupons
   *
   * @remarks
   * - Priorité : Prix variante > Prix promo > Prix normal
   * - Applique la réduction du code promo sur le prix de base
   * - Retourne toujours un prix >= 0
   *
   * @example
   * ```tsx
   * const finalPrice = calculatePrice();
   * // Si produit à 10000 XOF avec promo à 8000 XOF et coupon -1000 XOF
   * // Retourne : 7000 XOF
   * ```
   */
  const calculatePrice = useCallback(
    (): number => calculateBuyNowPrice(product, selectedVariant, appliedCouponCode),
    [product, selectedVariant, appliedCouponCode]
  );

  // Gérer le changement de champ
  const handleFieldChange = (field: keyof CheckoutFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Effacer l'erreur du champ modifié
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Soumettre le paiement
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) {
        toast({
          title: 'Formulaire invalide',
          description: 'Veuillez corriger les erreurs dans le formulaire',
          variant: 'destructive',
        });
        return;
      }

      if (!product || !store) {
        toast({
          title: 'Erreur',
          description: 'Données manquantes. Veuillez réessayer.',
          variant: 'destructive',
        });
        return;
      }

      const isPhysical = product.product_type === 'physical';

      setSubmitting(true);

      try {
        const finalPrice = calculatePrice();
        const rawCurrency = (product.currency || 'XOF').trim();
        const finalCurrency: Currency = isSupportedCurrency(rawCurrency) ? rawCurrency : 'XOF';
        const customerName = `${formData.firstName} ${formData.lastName}`.trim();
        const customerPhone = normalizePhoneForPayment(formData.phone, formData.country);

        if (isPhysical) {
          const result = await createPhysicalOrder({
            physicalProductId: '',
            productId: product.id,
            storeId: store.id,
            customerEmail: formData.email,
            customerName,
            customerPhone,
            quantity: 1,
            variantId: selectedVariant?.id,
            guestCheckout: isGuestBuyer,
            shippingAddress: {
              street: formData.address,
              city: formData.city,
              postal_code: formData.postalCode || '—',
              country: formData.country,
            },
          });

          await notifyPhysicalOrderPlaced({
            customerEmail: formData.email,
            customerUserId: user?.id ?? null,
            productName: product.name ? htmlToPlainText(product.name) : 'Produit',
            orderNumber: result.orderNumber ?? result.orderId.slice(0, 8),
            orderId: result.orderId,
            quantity: 1,
            totalAmount: finalPrice,
            currency: finalCurrency,
            checkoutMethod: physicalCheckout?.checkout_method ?? 'online',
            customerName,
            customerPhone,
            shippingSummary: `${formData.address}, ${formData.city}`,
          });

          if (result.cashOnDelivery || !result.checkoutUrl) {
            const orderNumber = result.orderNumber ?? result.orderId.slice(0, 8);
            if (user) {
              navigate('/account/orders', { replace: true });
            } else {
              navigate(
                buildGuestOrderConfirmationPath({
                  orderId: result.orderId,
                  orderNumber,
                  productName: product.name ? htmlToPlainText(product.name) : 'Produit',
                  customerEmail: formData.email,
                  cashOnDelivery: true,
                }),
                { replace: true }
              );
            }
            setSubmitting(false);
            return;
          }

          try {
            await supabase.auth.updateUser({
              data: {
                full_name: customerName,
                phone: customerPhone,
                address: formData.address,
                city: formData.city,
                country: formData.country,
                postal_code: formData.postalCode,
              },
            });
          } catch (updateError) {
            logger.warn(
              'Failed to update user metadata:',
              updateError instanceof Error ? updateError : new Error(String(updateError))
            );
          }

          safeRedirect(result.checkoutUrl, () => {
            toast({
              title: 'Erreur de paiement',
              description: 'URL de paiement invalide. Veuillez réessayer.',
              variant: 'destructive',
            });
            setSubmitting(false);
          });
          return;
        }

        // Services : réservation requise avant paiement
        if (product.product_type === 'service') {
          const params = new URLSearchParams({ guestEmail: formData.email });
          if (customerName) params.set('guestName', customerName);
          if (customerPhone) params.set('guestPhone', customerPhone);
          navigate(`/service/${product.id}?${params.toString()}`);
          setSubmitting(false);
          return;
        }

        const orderResult = await createOrder({
          productId: product.id,
          storeId: store.id,
          customerEmail: formData.email,
          customerName,
          customerPhone,
          guestCheckout: isGuestBuyer,
          digitalOptions: appliedCouponCode
            ? {
                couponCode: appliedCouponCode.code,
                couponDiscountAmount: appliedCouponCode.discountAmount,
              }
            : undefined,
          artistOptions:
            product.product_type === 'artist'
              ? {
                  shippingAddress: {
                    street: formData.address,
                    city: formData.city,
                    postal_code: formData.postalCode || '—',
                    country: formData.country,
                  },
                }
              : undefined,
        });

        if (!orderResult.checkoutUrl) {
          throw new Error('URL de paiement non reçue');
        }

        if (user) {
          try {
            await supabase.auth.updateUser({
              data: {
                full_name: customerName,
                phone: customerPhone,
                address: formData.address,
                city: formData.city,
                country: formData.country,
                postal_code: formData.postalCode,
              },
            });
          } catch (updateError) {
            logger.warn(
              'Failed to update user metadata:',
              updateError instanceof Error ? updateError : new Error(String(updateError))
            );
          }
        }

        safeRedirect(orderResult.checkoutUrl, () => {
          toast({
            title: 'Erreur de paiement',
            description: 'URL de paiement invalide. Veuillez réessayer.',
            variant: 'destructive',
          });
          setSubmitting(false);
        });
      } catch (_error: unknown) {
        const errorObj = _error instanceof Error ? _error : new Error(String(_error));
        logger.error('Payment initiation error:', errorObj);

        // Extraire le message d'erreur de manière plus lisible
        const errorMessage =
          errorObj.message || "Impossible d'initialiser le paiement. Veuillez réessayer.";

        // Si le message contient des sauts de ligne, prendre seulement la première ligne pour le toast
        const firstLine = errorMessage.split('\n')[0];
        const hasMoreDetails =
          errorMessage.includes('💡') ||
          errorMessage.includes('🔧') ||
          errorMessage.split('\n').length > 1;

        toast({
          title: 'Erreur de paiement',
          description: hasMoreDetails
            ? `${firstLine}\n\nConsultez la console pour plus de détails.`
            : errorMessage,
          variant: 'destructive',
          duration: hasMoreDetails ? 10000 : 5000, // Afficher plus longtemps si détails
        });

        // Logger le message complet pour debugging
        if (hasMoreDetails) {
          logger.error('Payment error details:', {
            fullMessage: errorMessage,
            error: errorObj,
          });
        }

        setSubmitting(false);
      }
    },
    [
      formData,
      product,
      store,
      user,
      selectedVariant,
      calculatePrice,
      toast,
      validateForm,
      createPhysicalOrder,
      createOrder,
      navigate,
      physicalCheckout,
      isGuestBuyer,
      appliedCouponCode,
    ]
  );

  // Prix affiché - Utiliser useMemo pour garantir la mise à jour quand appliedCouponCode change
  const displayPrice = useMemo(() => {
    return calculatePrice();
  }, [calculatePrice]);
  const currency = product?.currency || 'XOF';

  if (loading) {
    return (
      <div
        className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8 px-4 sm:px-6 lg:px-8"
        role="main"
        aria-label="Page de paiement"
        aria-busy="true"
        aria-live="polite"
      >
        <div className="max-w-7xl mx-auto">
          <div className="sr-only" role="status" aria-live="polite">
            Chargement des informations de paiement...
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="lg:col-span-2 space-y-6" aria-label="Informations de commande">
              <Skeleton className="h-12 w-64" aria-hidden="true" />
              <Skeleton className="h-96" aria-hidden="true" />
            </div>
            <div className="space-y-6" aria-label="Résumé de commande">
              <Skeleton className="h-64" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product || !store) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8 px-4 sm:px-6 lg:px-8 pb-16 md:pb-0">
        <div className="max-w-7xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || 'Produit ou boutique introuvable'}</AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button asChild variant="outline">
              <Link to="/marketplace">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour à la marketplace
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8 px-4 sm:px-6 lg:px-8 pb-16 md:pb-0"
      role="main"
      aria-label="Page de finalisation de commande"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-6 sm:mb-8">
          <nav aria-label="Navigation de la page de paiement">
            <Button asChild variant="ghost" className="mb-4 min-h-[44px]">
              <Link
                to={
                  product && store
                    ? generateProductUrl(store.slug, product.slug, store.subdomain)
                    : '/marketplace'
                }
                aria-label="Retour à la page précédente"
              >
                <ArrowLeft className="mr-2 h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                <span className="text-sm sm:text-base">Retour</span>
              </Link>
            </Button>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-bold">Finaliser votre commande</h1>
          <p className="text-muted-foreground mt-2">
            {isPhysicalCod
              ? 'Complétez vos informations pour confirmer votre commande (paiement à la livraison)'
              : isGuestBuyer
                ? 'Achetez en tant qu’invité — renseignez votre email pour accéder à votre espace client après paiement'
                : 'Complétez vos informations pour procéder au paiement'}
          </p>
        </header>

        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Résumé de la commande - En haut sur mobile, à droite sur desktop */}
          <aside
            className="order-2 lg:order-2 lg:col-span-1"
            role="complementary"
            aria-label="Résumé de la commande"
          >
            <Suspense fallback={<BuyNowSectionFallback />}>
              <BuyNowOrderSummary
                product={product}
                store={store}
                selectedVariant={selectedVariant}
                appliedCouponCode={appliedCouponCode}
                displayPrice={displayPrice}
                currency={currency}
                storeId={storeId}
                productId={productId}
                user={user}
                submitting={submitting}
                submitButtonLabel={submitButtonLabel}
                isCashOnDelivery={isPhysicalCod}
                onCouponApply={handleCouponApply}
                onCouponRemove={handleCouponRemove}
              />
            </Suspense>
          </aside>

          {/* Formulaire principal - En bas sur mobile, à gauche sur desktop */}
          <div className="order-1 lg:order-1 lg:col-span-2 space-y-6">
            <Suspense fallback={<BuyNowSectionFallback />}>
              <BuyNowCustomerForm
                formData={formData}
                formErrors={formErrors}
                onFieldChange={handleFieldChange}
                onSubmit={handleSubmit}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
