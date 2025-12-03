import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ArrowLeft, 
  Loader2, 
  ShoppingBag, 
  User, 
  CreditCard,
  AlertCircle,
  Shield,
  Tag
} from "lucide-react";
import CouponInput from '@/components/checkout/CouponInput';
import { loadMonerooPayment } from "@/lib/moneroo-lazy";
import { useToast } from "@/hooks/use-toast";
import { safeRedirect } from "@/lib/url-validator";
import { logger } from "@/lib/logger";
import { formatPrice } from "@/lib/product-helpers";
import { stripHtmlTags } from "@/lib/utils";

interface CheckoutFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
}

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Paramètres URL
  const productId = searchParams.get("productId");
  const storeId = searchParams.get("storeId");
  const variantId = searchParams.get("variantId");
  
  // États
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const [store, setStore] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  
  // State pour le code promo
  const [appliedCouponCode, setAppliedCouponCode] = useState<{
    id: string;
    discountAmount: number;
    code: string;
  } | null>(null);
  
  // Formulaire
  const [formData, setFormData] = useState<CheckoutFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    postalCode: "",
  });
  
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof CheckoutFormData, string>>>({});

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
      logger.warn('Error loading coupon from localStorage:', error as Error);
      localStorage.removeItem('applied_coupon');
    }
  }, []);

  // Charger les données
  useEffect(() => {
    const loadData = async () => {
      if (!productId || !storeId) {
        setError("Paramètres manquants. Veuillez sélectionner un produit.");
        setLoading(false);
        return;
      }

      try {
        // Charger l'utilisateur
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser?.email) {
          toast({
            title: "Authentification requise",
            description: "Veuillez vous connecter pour effectuer un achat",
            variant: "destructive",
          });
          navigate("/login");
          return;
        }
        setUser(currentUser);

        // Charger le produit
        const { data: productData, error: productError } = await supabase
          .from("products")
          .select(`
            *,
            stores!inner (
              id,
              name,
              slug,
              logo_url,
              created_at
            )
          `)
          .eq("id", productId)
          .eq("store_id", storeId)
          .single();

        if (productError) {
          logger.error("Error loading product:", productError);
          setError(`Produit introuvable: ${productError.message}`);
          setLoading(false);
          return;
        }

        if (!productData) {
          setError("Produit introuvable");
          setLoading(false);
          return;
        }

        setProduct(productData);

        // Extraire la boutique depuis la relation
        // Supabase retourne stores comme un tableau même avec !inner
        if (productData.stores && Array.isArray(productData.stores) && productData.stores.length > 0) {
          setStore(productData.stores[0]);
        } else {
          // Fallback: charger la boutique séparément si la relation n'a pas fonctionné
          const { data: storeData, error: storeError } = await supabase
            .from("stores")
            .select("*")
            .eq("id", storeId)
            .single();

          if (storeError) {
            logger.error("Error loading store:", storeError);
          }

          if (storeData) {
            setStore(storeData);
          }
        }

        // Charger la variante si spécifiée
        // Les variantes doivent être chargées séparément car elles ne sont pas directement liées à products
        if (variantId) {
          try {
            // Essayer d'abord physical_product_variants (pour produits physiques)
            const { data: physicalVariant } = await (supabase as any)
              .from("physical_product_variants")
              .select("*")
              .eq("id", variantId)
              .single();

            if (physicalVariant) {
              setSelectedVariant(physicalVariant);
            } else {
              // Si pas trouvé, essayer product_variants (relation générique si elle existe)
              const { data: genericVariant } = await (supabase as any)
                .from("product_variants")
                .select("*")
                .eq("id", variantId)
                .single();

              if (genericVariant) {
                setSelectedVariant(genericVariant);
              }
            }
          } catch (variantError) {
            // Ne pas bloquer le checkout si la variante n'est pas trouvée
            logger.warn("Variant not found:", variantError as Error);
          }
        }

        // Pré-remplir le formulaire avec les données utilisateur
        const fullName = currentUser.user_metadata?.full_name || currentUser.email.split('@')[0];
        const nameParts = fullName.split(' ');
        setFormData({
          firstName: nameParts[0] || "",
          lastName: nameParts.slice(1).join(' ') || "",
          email: currentUser.email || "",
          phone: currentUser.user_metadata?.phone || "",
          address: currentUser.user_metadata?.address || "",
          city: currentUser.user_metadata?.city || "Ouagadougou",
          country: currentUser.user_metadata?.country || "Burkina Faso",
          postalCode: currentUser.user_metadata?.postal_code || "",
        });
      } catch (err: unknown) {
        logger.error("Error loading checkout data:", err instanceof Error ? err : new Error(String(err)));
        setError("Erreur lors du chargement des données");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [productId, storeId, variantId, navigate, toast]);

  // Validation du formulaire
  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof CheckoutFormData, string>> = {};

    if (!formData.firstName.trim()) {
      errors.firstName = "Le prénom est requis";
    }

    if (!formData.lastName.trim()) {
      errors.lastName = "Le nom est requis";
    }

    if (!formData.email.trim()) {
      errors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Email invalide";
    }

    if (!formData.phone.trim()) {
      errors.phone = "Le téléphone est requis";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Calculer le prix - IMPORTANT: Utiliser le prix promo si disponible, puis appliquer le coupon
  const calculatePrice = useCallback((): number => {
    if (!product) return 0;
    
    // Si une variante est sélectionnée, utiliser son prix
    if (selectedVariant?.price) {
      const variantPrice = Number(selectedVariant.price);
      const couponDiscount = appliedCouponCode?.discountAmount || 0;
      return Math.max(0, variantPrice - couponDiscount);
    }
    
    // IMPORTANT: Utiliser le prix promo si disponible, sinon le prix normal
    // Le produit peut avoir promotional_price ou promo_price
    const promoPrice = product.promotional_price || product.promo_price;
    const basePrice = Number(product.price) || 0;
    
    // Déterminer le prix de base (promo ou normal)
    let finalBasePrice: number;
    if (promoPrice && Number(promoPrice) < basePrice && Number(promoPrice) > 0) {
      finalBasePrice = Number(promoPrice);
    } else {
      finalBasePrice = basePrice;
    }
    
    // Appliquer la réduction du code promo sur le prix de base
    const couponDiscount = appliedCouponCode?.discountAmount || 0;
    return Math.max(0, finalBasePrice - couponDiscount);
  }, [product, selectedVariant, appliedCouponCode]);

  // Gérer le changement de champ
  const handleFieldChange = (field: keyof CheckoutFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Effacer l'erreur du champ modifié
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Soumettre le paiement
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Formulaire invalide",
        description: "Veuillez corriger les erreurs dans le formulaire",
        variant: "destructive",
      });
      return;
    }

    if (!product || !store || !user) {
      toast({
        title: "Erreur",
        description: "Données manquantes. Veuillez réessayer.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const finalPrice = calculatePrice();
      const finalCurrency = (product.currency || "XOF").trim();
      const customerName = `${formData.firstName} ${formData.lastName}`.trim();

      // Vérification importante: s'assurer qu'on utilise bien le prix promo, pas le prix barré
      const promoPrice = product.promotional_price || product.promo_price;
      const originalPrice = Number(product.price) || 0;
      
      logger.log("Initiating payment from checkout page:", {
        productId: product.id,
        storeId: store.id,
        amount: finalPrice,
        originalPrice: originalPrice,
        promoPrice: promoPrice ? Number(promoPrice) : null,
        isUsingPromoPrice: promoPrice && Number(promoPrice) < originalPrice,
        currency: finalCurrency,
        customerName,
        customerEmail: formData.email,
      });
      
      // Double vérification: si un prix promo existe et est valide, l'utiliser
      if (promoPrice && Number(promoPrice) < originalPrice && Number(promoPrice) > 0) {
        const verifiedPrice = Number(promoPrice);
        if (verifiedPrice !== finalPrice) {
          logger.warn("Price mismatch detected, using promo price:", {
            calculatedPrice: finalPrice,
            promoPrice: verifiedPrice,
            originalPrice: originalPrice,
          });
        }
      }

      // Charger le module Moneroo de manière asynchrone
      const { initiateMonerooPayment } = await loadMonerooPayment();
      
      const result = await initiateMonerooPayment({
        storeId: store.id,
        productId: product.id,
        amount: finalPrice,
        currency: finalCurrency,
        description: `Achat de ${product.name}`,
        customerEmail: formData.email,
        customerName: customerName,
        metadata: {
          productName: product.name,
          storeSlug: store.slug || '',
          userId: user.id,
          ...(product.product_type && { productType: product.product_type }),
          ...(selectedVariant?.id && { variantId: selectedVariant.id }),
          // Informations client supplémentaires
          customerPhone: formData.phone,
          customerAddress: formData.address,
          customerCity: formData.city,
          customerCountry: formData.country,
          customerPostalCode: formData.postalCode,
        },
      });

      if (result.checkout_url) {
        // Sauvegarder les informations client dans user_metadata (optionnel)
        try {
          await supabase.auth.updateUser({
            data: {
              full_name: customerName,
              phone: formData.phone,
              address: formData.address,
              city: formData.city,
              country: formData.country,
              postal_code: formData.postalCode,
            },
          });
        } catch (updateError) {
          // Ne pas bloquer le paiement si la mise à jour échoue
          logger.warn("Failed to update user metadata:", updateError instanceof Error ? updateError : new Error(String(updateError)));
        }

        // Rediriger vers Moneroo
        safeRedirect(result.checkout_url, () => {
          toast({
            title: "Erreur de paiement",
            description: "URL de paiement invalide. Veuillez réessayer.",
            variant: "destructive",
          });
          setSubmitting(false);
        });
      } else {
        throw new Error("URL de paiement non reçue");
      }
    } catch (error: unknown) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.error("Payment initiation error:", errorObj);
      
      // Extraire le message d'erreur de manière plus lisible
      const errorMessage = errorObj.message || "Impossible d'initialiser le paiement. Veuillez réessayer.";
      
      // Si le message contient des sauts de ligne, prendre seulement la première ligne pour le toast
      const firstLine = errorMessage.split('\n')[0];
      const hasMoreDetails = errorMessage.includes('💡') || errorMessage.includes('🔧') || errorMessage.split('\n').length > 1;
      
      toast({
        title: "Erreur de paiement",
        description: hasMoreDetails 
          ? `${firstLine}\n\nConsultez la console pour plus de détails.`
          : errorMessage,
        variant: "destructive",
        duration: hasMoreDetails ? 10000 : 5000, // Afficher plus longtemps si détails
      });
      
      // Logger le message complet pour debugging
      if (hasMoreDetails) {
        logger.error("Payment error details:", {
          fullMessage: errorMessage,
          error: errorObj,
        } as any);
      }
      
      setSubmitting(false);
    }
  }, [formData, product, store, user, selectedVariant, calculatePrice, toast]);

  // Prix affiché - Utiliser useMemo pour garantir la mise à jour quand appliedCouponCode change
  const displayPrice = useMemo(() => {
    return calculatePrice();
  }, [calculatePrice]);
  const currency = product?.currency || "XOF";

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-12 w-64" />
              <Skeleton className="h-96" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-64" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product || !store) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || "Produit ou boutique introuvable"}
            </AlertDescription>
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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Button asChild variant="ghost" className="mb-4 min-h-[44px]">
            <Link to={product && store ? `/stores/${store.slug}/products/${product.slug}` : "/marketplace"}>
              <ArrowLeft className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base">Retour</span>
            </Link>
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold">Finaliser votre commande</h1>
          <p className="text-muted-foreground mt-2">
            Complétez vos informations pour procéder au paiement
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Formulaire principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informations client */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <User className="h-4 w-4 sm:h-5 sm:w-5" />
                  Informations client
                </CardTitle>
                <CardDescription className="text-sm">
                  Vos informations de contact pour la commande
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Nom et Prénom */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">
                        Prénom <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleFieldChange("firstName", e.target.value)}
                        placeholder="Votre prénom"
                        className={`min-h-[44px] ${formErrors.firstName ? "border-destructive" : ""}`}
                        required
                      />
                      {formErrors.firstName && (
                        <p className="text-sm text-destructive">{formErrors.firstName}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">
                        Nom <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        data-testid="checkout-lastname"
                        value={formData.lastName}
                        onChange={(e) => handleFieldChange("lastName", e.target.value)}
                        placeholder="Votre nom"
                        className={`min-h-[44px] ${formErrors.lastName ? "border-destructive" : ""}`}
                        required
                      />
                      {formErrors.lastName && (
                        <p className="text-sm text-destructive">{formErrors.lastName}</p>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      data-testid="checkout-email"
                      value={formData.email}
                      onChange={(e) => handleFieldChange("email", e.target.value)}
                      placeholder="votre@email.com"
                      className={`min-h-[44px] ${formErrors.email ? "border-destructive" : ""}`}
                      required
                    />
                    {formErrors.email && (
                      <p className="text-sm text-destructive">{formErrors.email}</p>
                    )}
                  </div>

                  {/* Téléphone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      Téléphone <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      data-testid="checkout-phone"
                      value={formData.phone}
                      onChange={(e) => handleFieldChange("phone", e.target.value)}
                      placeholder="+226 XX XX XX XX"
                      className={`min-h-[44px] ${formErrors.phone ? "border-destructive" : ""}`}
                      required
                    />
                    {formErrors.phone && (
                      <p className="text-sm text-destructive">{formErrors.phone}</p>
                    )}
                  </div>

                  <Separator />

                  {/* Adresse */}
                  <div className="space-y-2">
                    <Label htmlFor="address">Adresse</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleFieldChange("address", e.target.value)}
                      placeholder="123 Rue Example"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">Ville</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleFieldChange("city", e.target.value)}
                        placeholder="Ouagadougou"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="postalCode">Code postal</Label>
                      <Input
                        id="postalCode"
                        value={formData.postalCode}
                        onChange={(e) => handleFieldChange("postalCode", e.target.value)}
                        placeholder="01 BP"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Pays</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => handleFieldChange("country", e.target.value)}
                      placeholder="Burkina Faso"
                    />
                  </div>

                  {/* Bouton de soumission */}
                  <div className="pt-4">
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full min-h-[44px] text-base sm:text-lg"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                          <span className="text-sm sm:text-base">Traitement en cours...</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                          <span className="text-sm sm:text-base">Procéder au paiement</span>
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Résumé de la commande */}
          <div className="lg:col-span-1">
            <Card className="lg:sticky lg:top-4">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5" />
                  Résumé de la commande
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4">
                {/* Produit */}
                <div className="flex gap-4">
                  {product.image_url && (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-md flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm line-clamp-2">{product.name}</h3>
                    {selectedVariant && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Variante: {selectedVariant.option1_value || selectedVariant.name || 'Variante sélectionnée'}
                      </p>
                    )}
                    {product.product_type && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        {product.product_type}
                      </Badge>
                    )}
                    {product.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {stripHtmlTags(product.description).substring(0, 100)}
                        {stripHtmlTags(product.description).length > 100 ? '...' : ''}
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Code promo - Visible et proéminent */}
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
                    productId={productId || undefined}
                    productType={product?.product_type}
                    customerId={user?.id || undefined}
                    orderAmount={(() => {
                      // Calculer le prix de base sans coupon pour la validation
                      if (!product) return 0;
                      if (selectedVariant?.price) return Number(selectedVariant.price);
                      const promoPrice = product.promotional_price || product.promo_price;
                      const normalPrice = Number(product.price) || 0;
                      if (promoPrice && Number(promoPrice) < normalPrice && Number(promoPrice) > 0) {
                        return Number(promoPrice);
                      }
                      return normalPrice;
                    })()}
                    onApply={(couponId, discountAmount, code) => {
                      setAppliedCouponCode({
                        id: couponId,
                        discountAmount,
                        code: code || '',
                      });
                      localStorage.setItem('applied_coupon', JSON.stringify({
                        id: couponId,
                        discountAmount,
                        code: code || '',
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

                {/* Prix */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sous-total</span>
                    <span className="font-semibold">
                      {formatPrice((() => {
                        // Prix de base sans coupon
                        if (!product) return 0;
                        if (selectedVariant?.price) return Number(selectedVariant.price);
                        const promoPrice = product.promotional_price || product.promo_price;
                        const normalPrice = Number(product.price) || 0;
                        if (promoPrice && Number(promoPrice) < normalPrice && Number(promoPrice) > 0) {
                          return Number(promoPrice);
                        }
                        return normalPrice;
                      })(), currency)}
                    </span>
                  </div>
                  {appliedCouponCode && appliedCouponCode.discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                      <span>Code promo ({appliedCouponCode.code})</span>
                      <span className="font-semibold">
                        -{formatPrice(appliedCouponCode.discountAmount, currency)}
                      </span>
                    </div>
                  )}
                  {(() => {
                    // Vérifier si une promotion existe (promotional_price ou promo_price)
                    const promoPrice = product.promotional_price || product.promo_price;
                    const originalPrice = Number(product.price) || 0;
                    const hasPromo = promoPrice && Number(promoPrice) < originalPrice && Number(promoPrice) > 0;
                    
                    if (hasPromo) {
                      return (
                        <>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Prix original</span>
                            <span className="line-through">
                              {formatPrice(originalPrice, currency)}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs text-green-600 dark:text-green-400">
                            <span>Économie</span>
                            <span className="font-semibold">
                              {formatPrice(
                                originalPrice - Number(promoPrice),
                                currency
                              )}
                            </span>
                          </div>
                        </>
                      );
                    }
                    return null;
                  })()}
                </div>

                <Separator />

                {/* Total */}
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="font-bold text-lg">Total</span>
                  <span className="font-bold text-lg">
                    {formatPrice(Number(displayPrice) || 0, currency)}
                  </span>
                </div>

                {/* Sécurité */}
                <div className="pt-4 border-t">
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p>
                      Paiement sécurisé par Moneroo. Vos informations sont protégées.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

