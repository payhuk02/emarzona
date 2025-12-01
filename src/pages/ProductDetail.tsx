import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { ShoppingCart, Star, ArrowLeft, CheckCircle2, Package, HelpCircle, ClipboardList, Download, Clock, RefreshCw, DollarSign, Gift, Lock, AlertTriangle, CalendarClock, Shield, AlertCircle, Eye, Loader2, MessageSquare } from "lucide-react";
import ProductCard from "@/components/marketplace/ProductCard";
import { ProductGrid } from "@/components/ui/ProductGrid";
import StoreFooter from "@/components/storefront/StoreFooter";
import { useProductsOptimized } from "@/hooks/useProductsOptimized";
import { sanitizeProductDescription } from "@/lib/html-sanitizer";
import { ProductImageGallery } from "@/components/ui/ProductImageGallery";
import { ResponsiveProductImage } from "@/components/ui/ResponsiveProductImage";
import { CountdownTimer } from "@/components/ui/countdown-timer";
import { CustomFieldsDisplay } from "@/components/products/CustomFieldsDisplay";
import { ProductVariantSelector } from "@/components/products/ProductVariantSelector";
import { SEOMeta, ProductSchema, BreadcrumbSchema } from "@/components/seo";
import { ProductReviewsSummary } from "@/components/reviews";
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { ProductRecommendations, FrequentlyBoughtTogether } from "@/components/marketplace/ProductRecommendations";
import { PriceStockAlertButton } from "@/components/marketplace/PriceStockAlertButton";
import { formatPrice, getDisplayPrice, hasPromotion, calculateDiscount } from '@/lib/product-helpers';
import { useToast } from '@/hooks/use-toast';
import { usePageCustomization } from '@/hooks/usePageCustomization';
import { cn } from '@/lib/utils';

const ProductDetails = () => {
  const { slug, productSlug } = useParams<{ slug: string; productSlug: string }>();
  const { getValue } = usePageCustomization('productDetail');
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariantPrice, setSelectedVariantPrice] = useState<number | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const { toast } = useToast();

  // ID stable pour éviter les violations des règles des hooks
  const storeId = store?.id || null;
  // Utiliser useProductsOptimized avec limite pour produits similaires
  const { products: similarProductsData } = useProductsOptimized(storeId, {
    page: 1,
    itemsPerPage: 20, // Limite raisonnable pour produits similaires
  });
  const similarProducts = similarProductsData || [];

  const fetchData = useCallback(async () => {
    if (!slug || !productSlug) {
      setError("Slug de boutique ou produit manquant");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch store
      const { data: storeData, error: storeError } = await supabase
        .from("stores")
        .select("*")
        .eq("slug", slug)
        .limit(1);

      if (storeError) throw storeError;
      
      if (!storeData || storeData.length === 0) {
        setStore(null);
        setProduct(null);
        setError("Boutique introuvable");
        setLoading(false);
        return;
      }

      const foundStore = storeData[0];
      setStore(foundStore);
      logger.info(`Boutique chargée: ${foundStore.name} (${slug})`);

      // Fetch product
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("*")
        .eq("slug", productSlug)
        .eq("store_id", foundStore.id)
        .eq("is_active", true)
        .limit(1);

      if (productError) throw productError;
      
      if (!productData || productData.length === 0) {
        setProduct(null);
        setError("Produit introuvable ou non disponible");
        logger.warn(`Produit introuvable: ${productSlug} dans la boutique ${foundStore.name}`);
      } else {
        const product = productData[0];
        
        // Fetch related preview/paid products if they exist
        let freeProduct = null;
        let paidProduct = null;
        
        if (product.free_product_id) {
          const { data: freeData } = await supabase
            .from("products")
            .select("*")
            .eq("id", product.free_product_id)
            .single();
          freeProduct = freeData;
        }
        
        if (product.paid_product_id) {
          const { data: paidData } = await supabase
            .from("products")
            .select("*")
            .eq("id", product.paid_product_id)
            .single();
          paidProduct = paidData;
        }
        
        // S'assurer que store_id est présent (utiliser foundStore.id si manquant)
        const productWithStore = {
          ...product,
          store_id: product.store_id || foundStore.id,
          free_product: freeProduct,
          paid_product: paidProduct,
        };
        
        setProduct(productWithStore);
        
        logger.info(`Produit chargé: ${product.name} (${productSlug})`, {
          productId: product.id,
          storeId: productWithStore.store_id,
          price: product.price,
          promotional_price: product.promotional_price,
        });
      }
    } catch (error: any) {
      logger.error("Erreur lors du chargement du produit:", error);
      const errorMessage = error?.message || "Impossible de charger le produit. Veuillez réessayer plus tard.";
      setError(errorMessage);
      setStore(null);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }, [slug, productSlug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculs et hooks AVANT les early returns
  const productUrl = useMemo(() => 
    product && store ? `${window.location.origin}/stores/${store.slug}/products/${product.slug}` : '',
    [product, store]
  );

  const relatedProducts = useMemo(() => 
    product ? similarProducts.filter((p) => p.id !== product.id).slice(0, 4) : [],
    [product, similarProducts]
  );

  const safeDescription = useMemo(() => 
    product?.description ? sanitizeProductDescription(product.description) : "",
    [product?.description]
  );

  // Prix affiché cohérent avec Marketplace
  const displayPriceInfo = useMemo(() => {
    if (!product) return null;
    return getDisplayPrice({
      price: product.price,
      promo_price: product.promotional_price,
      currency: product.currency || 'FCFA'
    } as any);
  }, [product?.price, product?.promotional_price, product?.currency]);

  const hasPromo = useMemo(() => {
    if (!product) return false;
    return hasPromotion({
      price: product.price,
      promo_price: product.promotional_price
    } as any);
  }, [product?.price, product?.promotional_price]);

  const discountPercent = useMemo(() => {
    if (!hasPromo || !product) return 0;
    return calculateDiscount(product.price, product.promotional_price);
  }, [hasPromo, product?.price, product?.promotional_price]);

  // Handler pour l'achat - redirection vers checkout
  const handleBuyNow = useCallback(async () => {
    if (!product || !store) {
      toast({
        title: "Erreur",
        description: "Produit ou boutique non disponible",
        variant: "destructive",
      });
      return;
    }

    // Utiliser store.id si product.store_id n'est pas disponible
    const storeId = product.store_id || store.id;
    
    if (!storeId || !product.id) {
      toast({
        title: "Erreur",
        description: "Produit ou boutique non disponible",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsPurchasing(true);
      
      // Rediriger vers la page checkout avec les paramètres nécessaires
      const checkoutParams = new URLSearchParams({
        productId: String(product.id).trim(),
        storeId: String(storeId).trim(),
      });
      
      if (selectedVariantId) {
        checkoutParams.append('variantId', selectedVariantId);
      }
      
      navigate(`/checkout?${checkoutParams.toString()}`);
    } catch (error: any) {
      logger.error("Erreur lors de la redirection vers checkout:", error);
      toast({
        title: "Erreur",
        description: "Impossible de rediriger vers la page de paiement. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsPurchasing(false);
    }
  }, [product, store, selectedVariantId, navigate, toast]);

  // SEO Meta données
  const seoData = useMemo(() => {
    if (!product || !store || !productUrl) return null;
    
    const plainDescription = product.description?.replace(/<[^>]*>/g, "").trim() || "";
    const truncatedDescription = plainDescription.length > 160 
      ? plainDescription.substring(0, 157) + "..." 
      : plainDescription;
    
    return {
      title: String(product.name || 'Produit') + ' - ' + String(store.name || 'Boutique'),
      description: truncatedDescription || `Acheter ${product.name} sur ${store.name}. ${product.category || 'Produit digital'} disponible sur Emarzona. Paiement sécurisé en ${product.currency || 'XOF'}.`,
      keywords: [
        product.name,
        product.category,
        product.product_type,
        store.name,
        'achat en ligne',
        'marketplace afrique',
        product.currency === 'XOF' ? 'FCFA' : product.currency
      ].filter(Boolean).map(k => String(k)).join(', '),
      url: String(productUrl),
      image: String(product.image_url || `${window.location.origin}/og-default.jpg`),
      imageAlt: String(product.name || 'Produit') + ' - ' + String(store.name || 'Boutique'),
      price: displayPriceInfo ? (typeof displayPriceInfo.price === 'number' ? displayPriceInfo.price : undefined) : undefined,
      currency: product.currency ? String(product.currency) : undefined,
      availability: product.is_active ? ('instock' as const) : ('outofstock' as const)
    };
  }, [product, store, productUrl, displayPriceInfo]);

  // Breadcrumb
  const breadcrumbItems = useMemo(() => {
    if (!product || !store || !productUrl) return [];
    return [
      { name: "Accueil", url: String(window.location.origin) },
      { name: "Marketplace", url: String(`${window.location.origin}/marketplace`) },
      { name: String(store.name || 'Boutique'), url: String(`${window.location.origin}/stores/${store.slug}`) },
      { name: String(product.name || 'Produit'), url: String(productUrl) }
    ];
  }, [store, product, productUrl]);

  // Animations au scroll
  const headerRef = useScrollAnimation<HTMLElement>();
  const galleryRef = useScrollAnimation<HTMLDivElement>();
  const detailsRef = useScrollAnimation<HTMLDivElement>();
  const reviewsRef = useScrollAnimation<HTMLDivElement>();

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating ? "fill-primary text-primary" : "fill-muted text-muted"
          }`}
        />
      ))}
    </div>
  );

  // MAINTENANT les early returns APRÈS tous les hooks
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
          <Skeleton className="h-5 sm:h-6 w-24 sm:w-32 mb-4 sm:mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            <Skeleton className="h-64 sm:h-72 md:h-80" />
            <Skeleton className="h-64 sm:h-72 md:h-80" />
          </div>
        </div>
      </div>
    );
  }

  if (!product || !store) {
    if (loading) return null; // Le skeleton sera affiché

    return (
      <div className="min-h-screen flex items-center justify-center bg-background" role="alert" aria-live="polite">
        <div className="text-center max-w-md mx-auto px-4 sm:px-6">
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-red-500/10 mx-auto mb-4 sm:mb-6 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 sm:h-10 sm:w-10 text-red-500" aria-hidden="true" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 text-foreground">
            {error?.includes("Boutique") ? "Boutique introuvable" : "Produit introuvable"}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 break-words">
            {error || "Ce produit n'existe pas ou n'est plus disponible."}
          </p>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
            {error && (
              <Button
                onClick={() => {
                  setError(null);
                  fetchData();
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:scale-105 touch-manipulation min-h-[44px] text-sm sm:text-base"
                aria-label="Réessayer le chargement"
              >
                Réessayer
              </Button>
            )}
            {slug && (
              <Link to={`/stores/${slug}`}>
                <Button variant="outline" className="w-full sm:w-auto touch-manipulation min-h-[44px] text-sm sm:text-base">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Retour à la boutique</span>
                  <span className="sm:hidden">Boutique</span>
                </Button>
              </Link>
            )}
            <Link to="/marketplace">
              <Button variant="outline" className="w-full sm:w-auto touch-manipulation min-h-[44px] text-sm sm:text-base">
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Retour au marketplace</span>
                <span className="sm:hidden">Marketplace</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* SEO Meta Tags */}
      {seoData && (
        <SEOMeta
          title={seoData.title}
          description={seoData.description}
          keywords={seoData.keywords}
          url={seoData.url}
          canonical={seoData.url}
          image={seoData.image}
          imageAlt={seoData.imageAlt}
          type="product"
          price={seoData.price}
          currency={seoData.currency}
          availability={seoData.availability}
        />
      )}
      
      {/* Schema.org Product */}
      {product && store && (
        <ProductSchema
          product={product}
          store={store}
          url={productUrl}
        />
      )}
      
      {/* Breadcrumb Schema */}
      {breadcrumbItems.length > 0 && <BreadcrumbSchema items={breadcrumbItems} />}

      <div className="min-h-screen flex flex-col bg-background">
        {/* Header */}
        <header ref={headerRef} className="border-b bg-card shadow-sm sticky top-0 z-10" role="banner">
          <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
            <Link
              to={`/stores/${store.slug}`}
              className="inline-flex items-center text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors touch-manipulation min-h-[44px]"
              aria-label={`Retour à la boutique ${store.name}`}
            >
              <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" aria-hidden="true" />
              <span className="hidden sm:inline">Retour à {store.name}</span>
              <span className="sm:hidden">Retour</span>
            </Link>
          </div>
        </header>

        {/* Contenu principal */}
        <main className="flex-1" role="main">
          <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8 mb-8 sm:mb-10 md:mb-12">
              {/* 🖼️ Galerie d'images inspirée du design professionnel - Image principale à gauche, miniatures à droite */}
              <div ref={galleryRef} className="flex flex-col lg:flex-row gap-3 sm:gap-4" role="group" aria-label="Galerie du produit">
                {/* Collection de toutes les images */}
                {(() => {
                  const allImages: string[] = [];
                  
                  // Ajouter l'image principale
                  if (product.image_url) {
                    allImages.push(product.image_url);
                  }
                  
                  // Ajouter les images secondaires
                  if (Array.isArray(product.images)) {
                    product.images.forEach((img: any) => {
                      if (typeof img === 'string' && img && img !== product.image_url) {
                        allImages.push(img);
                      } else if (typeof img === 'object' && img?.url && img.url !== product.image_url) {
                        allImages.push(img.url);
                      }
                    });
                  }
                  
                  const currentImage = allImages[selectedImageIndex] || product.image_url;
                  
                  if (allImages.length === 0 && !product.image_url) {
                    return null;
                  }
                  
                  return (
                    <>
                      {/* Image principale - Grande taille à gauche (ou en haut sur mobile) */}
                      <div className="flex-1 lg:w-[75%]">
                        <div className="rounded-lg overflow-hidden border border-border shadow-sm bg-transparent product-image-container">
                          {currentImage && (
                            <ResponsiveProductImage
                              src={currentImage}
                              alt={product.name}
                              className="w-full h-auto object-contain max-h-[500px] sm:max-h-[600px] md:max-h-[700px] lg:max-h-[800px] product-image cursor-pointer transition-opacity duration-300"
                              priority={selectedImageIndex === 0}
                            />
                          )}
                        </div>
                      </div>
                      
                      {/* Miniatures à droite (ou en bas sur mobile) - Colonne verticale */}
                      {allImages.length > 1 && (
                        <div className="flex lg:flex-col gap-2 sm:gap-3 lg:w-[25%] overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
                          {allImages.map((imageUrl, index) => (
                            <button
                              key={index}
                              onClick={() => setSelectedImageIndex(index)}
                              className={cn(
                                "flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all duration-200 product-image-container",
                                "w-20 h-20 sm:w-24 sm:h-24 lg:w-full lg:aspect-square",
                                selectedImageIndex === index
                                  ? "border-amber-500 ring-2 ring-amber-500/30 shadow-md scale-105"
                                  : "border-gray-300 hover:border-amber-400 hover:shadow-sm opacity-75 hover:opacity-100"
                              )}
                              aria-label={`Voir l'image ${index + 1} de ${product.name}`}
                            >
                              <ResponsiveProductImage
                                src={imageUrl}
                                alt={`${product.name} - Miniature ${index + 1}`}
                                className="w-full h-full object-cover product-image"
                                priority={index < 3}
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}

                {/* 🎥 Vidéo produit */}
                {product.video_url && (
                  <div className="aspect-video rounded-lg overflow-hidden border border-border shadow-sm bg-card">
                    <iframe
                      src={product.video_url}
                      title={`Vidéo de ${product.name}`}
                      className="w-full h-full"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      loading="lazy"
                    />
                  </div>
                )}
              </div>

              {/* Infos produit */}
              <div ref={detailsRef} className="space-y-4 sm:space-y-5 md:space-y-6">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight" id="product-title">{product.name}</h1>

                {/* Licensing banner */}
                {product.licensing_type && (
                  <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg border bg-muted/50">
                    <div className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center flex-shrink-0 ${product.licensing_type === 'plr' ? 'bg-emerald-100' : product.licensing_type === 'copyrighted' ? 'bg-red-100' : 'bg-gray-100'}`}>
                      <Shield className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${product.licensing_type === 'plr' ? 'text-emerald-700' : product.licensing_type === 'copyrighted' ? 'text-red-700' : 'text-gray-700'}`} />
                    </div>
                    <div className="text-xs sm:text-sm min-w-0 flex-1">
                      <p className="font-semibold">
                        {product.licensing_type === 'plr' ? 'Licence PLR (droits de label privé)' : product.licensing_type === 'copyrighted' ? "Protégé par droit d'auteur" : 'Licence standard'}
                      </p>
                      {product.license_terms && (
                        <p className="text-muted-foreground mt-1 whitespace-pre-wrap break-words">{product.license_terms}</p>
                      )}
                    </div>
                  </div>
                )}

                {product.rating > 0 && (
                  <div className="flex items-center gap-2">
                    {renderStars(product.rating)}
                    <span className="text-sm text-muted-foreground">
                      ({product.reviews_count} avis)
                    </span>
                  </div>
                )}

                <div className="space-y-2 sm:space-y-3">
                  {/* Prix avec promotion cohérent avec Marketplace */}
                  {displayPriceInfo && (
                    <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
                      {displayPriceInfo.originalPrice && (
                        <span className="text-lg sm:text-xl md:text-2xl text-muted-foreground line-through">
                          {formatPrice(displayPriceInfo.originalPrice, product.currency || 'FCFA')}
                        </span>
                      )}
                      <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary">
                        {formatPrice(displayPriceInfo.price, product.currency || 'FCFA')}
                      </div>
                      {hasPromo && discountPercent > 0 && (
                        <Badge variant="destructive" className="text-xs sm:text-sm font-semibold px-2 py-1">
                          -{discountPercent}%
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* 🎯 NOUVEAU: Modèle de tarification */}
                  {product.pricing_model && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {product.pricing_model === 'subscription' && (
                        <Badge variant="outline" className="text-sm bg-blue-500/10 text-blue-700 border-blue-500/20">
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Abonnement
                        </Badge>
                      )}
                      {product.pricing_model === 'one-time' && (
                        <Badge variant="outline" className="text-sm bg-purple-500/10 text-purple-700 border-purple-500/20">
                          <DollarSign className="h-3 w-3 mr-1" />
                          Achat unique
                        </Badge>
                      )}
                      {product.pricing_model === 'free' && (
                        <Badge variant="outline" className="text-sm bg-green-500/10 text-green-700 border-green-500/20">
                          <Gift className="h-3 w-3 mr-1" />
                          Gratuit
                        </Badge>
                      )}
                      {product.pricing_model === 'pay-what-you-want' && (
                        <Badge variant="outline" className="text-sm bg-orange-500/10 text-orange-700 border-orange-500/20">
                          <DollarSign className="h-3 w-3 mr-1" />
                          Prix libre
                        </Badge>
                      )}
                      {/* Badge Preview Gratuit */}
                      {product.is_free_preview && (
                        <Badge variant="outline" className="text-sm bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-700 border-purple-500/20">
                          <Eye className="h-3 w-3 mr-1" />
                          Version Preview Gratuite
                        </Badge>
                      )}
                      {/* Badge si produit payant a un preview */}
                      {product.free_product && !product.is_free_preview && (
                        <Badge variant="outline" className="text-sm bg-gradient-to-r from-green-500/10 to-emerald-500/10 text-green-700 border-green-500/20">
                          <Gift className="h-3 w-3 mr-1" />
                          Version Preview Disponible
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                {/* Lien vers produit preview ou payant */}
                {product.is_free_preview && product.paid_product && (
                  <div className="p-4 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800">
                    <div className="flex items-start gap-3">
                      <Gift className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-semibold text-purple-900 dark:text-purple-100 mb-1">
                          Version Preview Gratuite
                        </p>
                        {product.preview_content_description && (
                          <p className="text-sm text-purple-800 dark:text-purple-200 mb-3">
                            {product.preview_content_description}
                          </p>
                        )}
                        <Link
                          to={`/${slug}/${product.paid_product.slug}`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors font-medium text-sm"
                        >
                          <Package className="h-4 w-4" />
                          Accéder à la version complète ({formatPrice(product.paid_product.price, product.paid_product.currency || 'FCFA')})
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {/* Lien vers preview gratuit si produit payant */}
                {product.free_product && !product.is_free_preview && (
                  <div className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
                    <div className="flex items-start gap-3">
                      <Eye className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-semibold text-green-900 dark:text-green-100 mb-1">
                          Version Preview Gratuite Disponible
                        </p>
                        <p className="text-sm text-green-800 dark:text-green-200 mb-3">
                          Téléchargez gratuitement un aperçu de ce produit avant d'acheter la version complète.
                        </p>
                        <Link
                          to={`/${slug}/${product.free_product.slug}`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-colors font-medium text-sm"
                        >
                          <Gift className="h-4 w-4" />
                          Télécharger la version preview gratuite
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {/* ⏰ NOUVEAU: Countdown promo */}
                {product.sale_end_date && (
                  <div className="flex justify-center sm:justify-start">
                    <CountdownTimer
                      endDate={product.sale_end_date}
                      startDate={product.sale_start_date}
                    />
                  </div>
                )}

                {/* 🎨 NOUVEAU: Sélecteur de variantes */}
                {product.variants && Array.isArray(product.variants) && product.variants.length > 0 && (
                  <ProductVariantSelector
                    variants={product.variants}
                    basePrice={displayPriceInfo?.price ?? product.price}
                    currency={product.currency || "XOF"}
                    onVariantChange={(variant, price) => {
                      setSelectedVariantPrice(price);
                      setSelectedVariantId(variant?.id || null);
                    }}
                  />
                )}

                {/* Boutons d'action - Responsive optimisé */}
                <div className="space-y-2 sm:space-y-0">
                  {/* Bouton principal - Acheter maintenant */}
                  <Button 
                    size="lg" 
                    className="w-full touch-manipulation min-h-[44px] text-sm sm:text-base font-semibold shadow-md hover:shadow-lg transition-shadow"
                    onClick={handleBuyNow}
                    disabled={isPurchasing || !product || !product.is_active}
                  >
                    {isPurchasing ? (
                      <>
                        <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin" />
                        <span className="hidden sm:inline">Traitement...</span>
                        <span className="sm:hidden">Chargement...</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
                        <span className="hidden sm:inline">{getValue('productDetail.cta.buyNow') || 'Acheter maintenant'}</span>
                        <span className="sm:hidden">{getValue('productDetail.cta.buyNow') || 'Acheter'}</span>
                        {selectedVariantPrice && selectedVariantPrice !== (displayPriceInfo?.price ?? product.price) && (
                          <span className="ml-2 hidden sm:inline">
                            ({formatPrice(selectedVariantPrice, product.currency || 'FCFA')})
                          </span>
                        )}
                      </>
                    )}
                  </Button>

                  {/* Boutons secondaires - Ligne horizontale sur desktop */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
                    {/* Bouton Contacter le vendeur */}
                    {product.store_id && (
                      <Button
                        size="lg"
                        variant="outline"
                        className="flex-1 sm:flex-1 touch-manipulation min-h-[44px] text-sm sm:text-base border-2"
                        asChild
                      >
                        <Link to={`/vendor/messaging/${product.store_id}?productId=${product.id}`}>
                          <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
                          <span className="hidden sm:inline">Contacter le vendeur</span>
                          <span className="sm:hidden">Contacter</span>
                        </Link>
                      </Button>
                    )}

                    {/* Bouton Alerte prix */}
                    <div className="flex-1 sm:flex-1">
                      <PriceStockAlertButton
                        productId={product.id}
                        productName={product.name}
                        currentPrice={selectedVariantPrice || (displayPriceInfo?.price ?? product.price)}
                        currency={product.currency || 'XOF'}
                        productType={product.product_type}
                        stockQuantity={(product as any).stock_quantity}
                        variant="outline"
                        size="lg"
                        className="w-full touch-manipulation min-h-[44px]"
                      />
                    </div>
                  </div>
                </div>

                {/* 🔒 NOUVEAU: Badges informatifs (Phase 4) */}
                {(product.password_protected || product.purchase_limit || product.preorder_allowed) && (
                  <div className="flex flex-wrap gap-2">
                    {/* Protection par mot de passe */}
                    {product.password_protected && (
                      <Badge variant="outline" className="text-xs sm:text-sm bg-yellow-500/10 text-yellow-700 border-yellow-500/20 px-2 py-1">
                        <Lock className="h-3 w-3 mr-1" />
                        <span className="hidden sm:inline">Accès protégé</span>
                        <span className="sm:hidden">Protégé</span>
                      </Badge>
                    )}

                    {/* Limite d'achat */}
                    {product.purchase_limit && product.purchase_limit > 0 && (
                      <Badge variant="outline" className="text-xs sm:text-sm bg-orange-500/10 text-orange-700 border-orange-500/20 px-2 py-1">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        <span className="hidden sm:inline">Max {product.purchase_limit} par personne</span>
                        <span className="sm:hidden">Max {product.purchase_limit}</span>
                      </Badge>
                    )}

                    {/* Précommande */}
                    {product.preorder_allowed && (
                      <Badge variant="outline" className="text-xs sm:text-sm bg-blue-500/10 text-blue-700 border-blue-500/20 px-2 py-1">
                        <CalendarClock className="h-3 w-3 mr-1" />
                        <span className="hidden sm:inline">Précommande disponible</span>
                        <span className="sm:hidden">Précommande</span>
                      </Badge>
                    )}
                  </div>
                )}

                {/* Messages détaillés */}
                {product.password_protected && (
                  <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                    <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs sm:text-sm min-w-0 flex-1">
                      <p className="font-semibold text-yellow-700 mb-1">Produit à accès restreint</p>
                      <p className="text-muted-foreground break-words">
                        Un mot de passe sera requis après l'achat pour accéder à ce produit.
                      </p>
                    </div>
                  </div>
                )}

                {product.purchase_limit && product.purchase_limit > 0 && (
                  <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg bg-orange-500/5 border border-orange-500/20">
                    <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs sm:text-sm min-w-0 flex-1">
                      <p className="font-semibold text-orange-700 mb-1">Limite d'achat par personne</p>
                      <p className="text-muted-foreground break-words">
                        Vous pouvez acheter maximum {product.purchase_limit} {product.purchase_limit === 1 ? 'exemplaire' : 'exemplaires'} de ce produit.
                      </p>
                    </div>
                  </div>
                )}

                {/* ✨ NOUVEAU: Caractéristiques principales */}
                {product.features && Array.isArray(product.features) && product.features.length > 0 && (
                  <div className="pt-4 sm:pt-6 border-t border-border">
                    <div className="flex items-center gap-2 mb-3 sm:mb-4">
                      <Package className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      <h2 className="text-lg sm:text-xl font-semibold">Caractéristiques principales</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      {product.features.map((feature: string, index: number) => (
                        <div key={index} className="flex items-start gap-2 p-2 sm:p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                          <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-xs sm:text-sm leading-relaxed break-words">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}


                {/* 📜 Conditions de licence */}
                {product.licensing_type && (
                  <div className="pt-6 border-t border-border">
                    <h2 className="text-xl font-semibold mb-3">Conditions de licence</h2>
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p>
                        Type de licence: <strong>{product.licensing_type === 'plr' ? 'PLR (droits de label privé)' : product.licensing_type === 'copyrighted' ? "Protégé par droit d'auteur" : 'Standard'}</strong>
                      </p>
                      {product.license_terms ? (
                        <p className="whitespace-pre-wrap">{product.license_terms}</p>
                      ) : (
                        <p>Les conditions détaillées de licence seront précisées par le vendeur.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* 📊 NOUVEAU: Specifications techniques */}
                {product.specifications && Array.isArray(product.specifications) && product.specifications.length > 0 && (
                  <div className="pt-6 border-t border-border">
                    <div className="flex items-center gap-2 mb-4">
                      <ClipboardList className="h-5 w-5 text-primary" />
                      <h2 className="text-xl font-semibold">Spécifications techniques</h2>
                    </div>
                    <div className="rounded-lg border border-border overflow-hidden bg-card">
                      <Table>
                        <TableBody>
                          {product.specifications.map((spec: any, index: number) => (
                            <TableRow key={index} className={index % 2 === 0 ? 'bg-muted/50' : ''}>
                              <TableCell className="font-medium w-1/3 py-3">
                                {spec.name || spec.label || spec.key}
                              </TableCell>
                              <TableCell className="py-3">
                                {spec.value}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {/* 💾 NOUVEAU: Informations de téléchargement */}
                {product.downloadable_files && Array.isArray(product.downloadable_files) && product.downloadable_files.length > 0 && (
                  <div className="pt-6 border-t border-border">
                    <div className="flex items-center gap-2 mb-4">
                      <Download className="h-5 w-5 text-primary" />
                      <h2 className="text-xl font-semibold">Fichiers inclus</h2>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Download className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {product.downloadable_files.length} fichier{product.downloadable_files.length > 1 ? 's' : ''} téléchargeable{product.downloadable_files.length > 1 ? 's' : ''}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Accès immédiat après l'achat
                            </p>
                          </div>
                        </div>
                        {product.download_limit && (
                          <div className="text-sm text-muted-foreground">
                            Limite: {product.download_limit} téléchargement{product.download_limit > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                      {product.download_expiry_days && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground px-4">
                          <Clock className="h-4 w-4" />
                          <span>Disponible pendant {product.download_expiry_days} jours</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 📝 NOUVEAU: Champs personnalisés */}
                {product.custom_fields && Array.isArray(product.custom_fields) && product.custom_fields.length > 0 && (
                  <CustomFieldsDisplay fields={product.custom_fields} />
                )}

                {/* Catégorie et Type */}
                <div className="pt-6 border-t border-border space-y-2 text-sm">
                  {product.category && (
                    <div>
                      <strong>Catégorie :</strong> {product.category}
                    </div>
                  )}
                  {product.product_type && (
                    <div>
                      <strong>Type :</strong> {product.product_type}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ✅ Description complète du produit */}
            {safeDescription && (
              <div className="mb-8 sm:mb-10 md:mb-12 pt-6 sm:pt-8 border-t border-border">
                <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">Description</h2>
                <div
                  className="bg-white dark:bg-white text-black dark:text-black text-sm sm:text-base leading-relaxed prose prose-sm sm:prose-base max-w-none prose-headings:text-black dark:prose-headings:text-black prose-p:text-black dark:prose-p:text-black prose-a:text-primary prose-strong:text-black dark:prose-strong:text-black p-4 sm:p-6 rounded-lg"
                  dangerouslySetInnerHTML={{ __html: safeDescription }}
                />
              </div>
            )}

            {/* 📖 NOUVEAU: FAQ Section */}
            {product.faqs && Array.isArray(product.faqs) && product.faqs.length > 0 && (
              <div className="mb-8 sm:mb-10 md:mb-12">
                <div className="flex items-center gap-2 mb-4 sm:mb-6">
                  <HelpCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  <h2 className="text-xl sm:text-2xl font-bold">Questions fréquentes</h2>
                </div>
                <Accordion type="single" collapsible className="w-full space-y-2">
                  {product.faqs.map((faq: any, index: number) => (
                    <AccordionItem 
                      key={index} 
                      value={`faq-${index}`}
                      className="border border-border rounded-lg px-3 sm:px-4 bg-card"
                    >
                      <AccordionTrigger className="text-left hover:no-underline text-sm sm:text-base py-3 sm:py-4">
                        <span className="font-medium break-words pr-4">{faq.question}</span>
                      </AccordionTrigger>
                      <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed pb-3 sm:pb-4 break-words">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}

            {/* Reviews & Ratings */}
            {product && (
              <div ref={reviewsRef} className="mb-8 sm:mb-10 md:mb-12" role="region" aria-labelledby="reviews-heading">
                <h2 id="reviews-heading" className="sr-only">Avis et évaluations</h2>
                <ProductReviewsSummary
                  productId={product.id}
                  productType={product.product_type}
                />
              </div>
            )}

            {/* Produits fréquemment achetés ensemble */}
            {product && (
              <div className="mb-8 sm:mb-10 md:mb-12">
                <FrequentlyBoughtTogether
                  productId={product.id}
                  limit={4}
                />
              </div>
            )}

            {/* Produits similaires - Recommandations intelligentes */}
            {product && (
              <div className="mb-8 sm:mb-10 md:mb-12">
                <ProductRecommendations
                  productId={product.id}
                  productCategory={product.category}
                  limit={6}
                  title="Produits similaires"
                />
              </div>
            )}

            {/* Produits similaires (fallback si pas de recommandations) */}
            {relatedProducts.length > 0 && (
              <div role="region" aria-labelledby="related-products-heading" className="mb-8 sm:mb-10 md:mb-12">
                <h2 id="related-products-heading" className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 px-2 sm:px-0">Autres produits de cette boutique</h2>
                <ProductGrid>
                  {relatedProducts.map((related, index) => (
                    <div 
                      key={related.id} 
                      role="listitem"
                      className="animate-in fade-in slide-in-from-bottom-4"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <ProductCard
                        product={related}
                        storeSlug={store.slug}
                      />
                    </div>
                  ))}
                </ProductGrid>
              </div>
            )}
          </div>
        </main>

        {/* Pied de page */}
        <StoreFooter
          storeName={store.name}
          facebook_url={store.facebook_url}
          instagram_url={store.instagram_url}
          twitter_url={store.twitter_url}
          linkedin_url={store.linkedin_url}
        />
      </div>
    </>
  );
};

export default ProductDetails;
