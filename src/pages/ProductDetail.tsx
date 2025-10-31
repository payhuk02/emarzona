import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
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
import { ShoppingCart, Star, ArrowLeft, CheckCircle2, Package, HelpCircle, ClipboardList, Download, Clock, RefreshCw, DollarSign, Gift, Lock, AlertTriangle, CalendarClock, Shield, AlertCircle } from "lucide-react";
import ProductCard from "@/components/marketplace/ProductCard";
import StoreFooter from "@/components/storefront/StoreFooter";
import { useProducts } from "@/hooks/useProducts";
import { sanitizeHTML } from "@/lib/html-sanitizer";
import { ProductImageGallery } from "@/components/ui/ProductImageGallery";
import { CountdownTimer } from "@/components/ui/countdown-timer";
import { CustomFieldsDisplay } from "@/components/products/CustomFieldsDisplay";
import { ProductVariantSelector } from "@/components/products/ProductVariantSelector";
import { SEOMeta, ProductSchema, BreadcrumbSchema } from "@/components/seo";
import { ProductReviewsSummary } from "@/components/reviews";
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const ProductDetails = () => {
  const { slug, productSlug } = useParams<{ slug: string; productSlug: string }>();
  const [product, setProduct] = useState<any>(null);
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariantPrice, setSelectedVariantPrice] = useState<number | null>(null);

  // ID stable pour éviter les violations des règles des hooks
  const storeId = store?.id || null;
  const { products: similarProducts } = useProducts(storeId);

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
        setProduct(productData[0]);
        logger.info(`Produit chargé: ${productData[0].name} (${productSlug})`);
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
    product?.description ? sanitizeHTML(product.description, 'productDescription') : "",
    [product?.description]
  );

  // SEO Meta données
  const seoData = useMemo(() => {
    if (!product || !store || !productUrl) return null;
    
    const plainDescription = product.description?.replace(/<[^>]*>/g, "").trim() || "";
    const truncatedDescription = plainDescription.length > 160 
      ? plainDescription.substring(0, 157) + "..." 
      : plainDescription;
    
    return {
      title: String(product.name || 'Produit') + ' - ' + String(store.name || 'Boutique'),
      description: truncatedDescription || `Acheter ${product.name} sur ${store.name}. ${product.category || 'Produit digital'} disponible sur Payhula. Paiement sécurisé en ${product.currency || 'XOF'}.`,
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
      price: typeof product.price === 'number' ? product.price : undefined,
      currency: product.currency ? String(product.currency) : undefined,
      availability: product.is_active ? ('instock' as const) : ('outofstock' as const)
    };
  }, [product, store, productUrl]);

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
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Skeleton className="h-6 w-32 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
        </div>
      </div>
    );
  }

  if (!product || !store) {
    if (loading) return null; // Le skeleton sera affiché

    return (
      <div className="min-h-screen flex items-center justify-center bg-background" role="alert" aria-live="polite">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="h-20 w-20 rounded-full bg-red-500/10 mx-auto mb-4 flex items-center justify-center">
            <AlertCircle className="h-10 w-10 text-red-500" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-foreground">
            {error?.includes("Boutique") ? "Boutique introuvable" : "Produit introuvable"}
          </h1>
          <p className="text-muted-foreground mb-6">
            {error || "Ce produit n'existe pas ou n'est plus disponible."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {error && (
              <Button
                onClick={() => {
                  setError(null);
                  fetchData();
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:scale-105"
                aria-label="Réessayer le chargement"
              >
                Réessayer
              </Button>
            )}
            {slug && (
              <Link to={`/stores/${slug}`}>
                <Button variant="outline" className="w-full sm:w-auto">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour à la boutique
                </Button>
              </Link>
            )}
            <Link to="/marketplace">
              <Button variant="outline" className="w-full sm:w-auto">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour au marketplace
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
          <div className="max-w-6xl mx-auto px-4 py-3">
            <Link
              to={`/stores/${store.slug}`}
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
              aria-label={`Retour à la boutique ${store.name}`}
            >
              <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
              Retour à {store.name}
            </Link>
          </div>
        </header>

        {/* Contenu principal */}
        <main className="flex-1" role="main">
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              {/* 🖼️ AMÉLIORÉ: Galerie d'images complète (toutes sources) */}
              <div ref={galleryRef} className="space-y-4" role="group" aria-label="Galerie d'images du produit">
                <ProductImageGallery
                  images={[
                    product.image_url,
                    ...(Array.isArray(product.images) ? product.images : []),
                    ...(Array.isArray(product.gallery_images) ? product.gallery_images : [])
                  ].filter(Boolean)}
                  alt={product.name}
                  context="detail"
                  priority={true}
                  showZoom={true}
                  showThumbnails={true}
                />

                {/* 🎥 NOUVEAU: Vidéo produit */}
                {product.video_url && (
                  <div className="aspect-video rounded-lg overflow-hidden border border-border shadow-sm">
                    <iframe
                      src={product.video_url}
                      title={`Vidéo de ${product.name}`}
                      className="w-full h-full"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  </div>
                )}
              </div>

              {/* Infos produit */}
              <div ref={detailsRef} className="space-y-6">
                <h1 className="text-3xl font-bold" id="product-title">{product.name}</h1>

                {/* Licensing banner */}
                {product.licensing_type && (
                  <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/50">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${product.licensing_type === 'plr' ? 'bg-emerald-100' : product.licensing_type === 'copyrighted' ? 'bg-red-100' : 'bg-gray-100'}`}>
                      <Shield className={`h-4 w-4 ${product.licensing_type === 'plr' ? 'text-emerald-700' : product.licensing_type === 'copyrighted' ? 'text-red-700' : 'text-gray-700'}`} />
                    </div>
                    <div className="text-sm">
                      <p className="font-semibold">
                        {product.licensing_type === 'plr' ? 'Licence PLR (droits de label privé)' : product.licensing_type === 'copyrighted' ? "Protégé par droit d'auteur" : 'Licence standard'}
                      </p>
                      {product.license_terms && (
                        <p className="text-muted-foreground mt-1 whitespace-pre-wrap">{product.license_terms}</p>
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

                <div className="space-y-2">
                  <div className="text-4xl font-bold">
                    {product.price.toLocaleString()}{" "}
                    <span className="text-2xl text-muted-foreground">
                      {product.currency}
                    </span>
                  </div>

                  {/* 🎯 NOUVEAU: Modèle de tarification */}
                  {product.pricing_model && (
                    <div className="flex items-center gap-2">
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
                    </div>
                  )}
                </div>

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
                    basePrice={product.price}
                    currency={product.currency || "XOF"}
                    onVariantChange={(variant, price) => {
                      setSelectedVariantPrice(price);
                    }}
                  />
                )}

                <Button size="lg" className="w-full sm:w-auto">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Acheter maintenant
                  {selectedVariantPrice && selectedVariantPrice !== product.price && (
                    <span className="ml-2">
                      ({selectedVariantPrice.toLocaleString()} {product.currency})
                    </span>
                  )}
                </Button>

                {/* 🔒 NOUVEAU: Badges informatifs (Phase 4) */}
                {(product.password_protected || product.purchase_limit || product.preorder_allowed) && (
                  <div className="flex flex-wrap gap-2">
                    {/* Protection par mot de passe */}
                    {product.password_protected && (
                      <Badge variant="outline" className="text-sm bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
                        <Lock className="h-3 w-3 mr-1" />
                        Accès protégé
                      </Badge>
                    )}

                    {/* Limite d'achat */}
                    {product.purchase_limit && product.purchase_limit > 0 && (
                      <Badge variant="outline" className="text-sm bg-orange-500/10 text-orange-700 border-orange-500/20">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Max {product.purchase_limit} par personne
                      </Badge>
                    )}

                    {/* Précommande */}
                    {product.preorder_allowed && (
                      <Badge variant="outline" className="text-sm bg-blue-500/10 text-blue-700 border-blue-500/20">
                        <CalendarClock className="h-3 w-3 mr-1" />
                        Précommande disponible
                      </Badge>
                    )}
                  </div>
                )}

                {/* Messages détaillés */}
                {product.password_protected && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                    <Lock className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold text-yellow-700 mb-1">Produit à accès restreint</p>
                      <p className="text-muted-foreground">
                        Un mot de passe sera requis après l'achat pour accéder à ce produit.
                      </p>
                    </div>
                  </div>
                )}

                {product.purchase_limit && product.purchase_limit > 0 && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-orange-500/5 border border-orange-500/20">
                    <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold text-orange-700 mb-1">Limite d'achat par personne</p>
                      <p className="text-muted-foreground">
                        Vous pouvez acheter maximum {product.purchase_limit} {product.purchase_limit === 1 ? 'exemplaire' : 'exemplaires'} de ce produit.
                      </p>
                    </div>
                  </div>
                )}

                {/* ✨ NOUVEAU: Caractéristiques principales */}
                {product.features && Array.isArray(product.features) && product.features.length > 0 && (
                  <div className="pt-6 border-t border-border">
                    <div className="flex items-center gap-2 mb-4">
                      <Package className="h-5 w-5 text-primary" />
                      <h2 className="text-xl font-semibold">Caractéristiques principales</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {product.features.map((feature: string, index: number) => (
                        <div key={index} className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                          <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm leading-relaxed">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ✅ Description HTML nettoyée */}
                {safeDescription && (
                  <div className="pt-6 border-t border-border">
                    <h2 className="text-xl font-semibold mb-3">Description</h2>
                    <div
                      className="text-muted-foreground leading-relaxed prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: safeDescription }}
                    />
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

            {/* 📖 NOUVEAU: FAQ Section */}
            {product.faqs && Array.isArray(product.faqs) && product.faqs.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center gap-2 mb-6">
                  <HelpCircle className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold">Questions fréquentes</h2>
                </div>
                <Accordion type="single" collapsible className="w-full space-y-2">
                  {product.faqs.map((faq: any, index: number) => (
                    <AccordionItem 
                      key={index} 
                      value={`faq-${index}`}
                      className="border border-border rounded-lg px-4 bg-card"
                    >
                      <AccordionTrigger className="text-left hover:no-underline">
                        <span className="font-medium">{faq.question}</span>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}

            {/* Reviews & Ratings */}
            {product && (
              <div ref={reviewsRef} className="mb-12" role="region" aria-labelledby="reviews-heading">
                <h2 id="reviews-heading" className="sr-only">Avis et évaluations</h2>
                <ProductReviewsSummary
                  productId={product.id}
                  productType={product.product_type}
                />
              </div>
            )}

            {/* Produits similaires */}
            {relatedProducts.length > 0 && (
              <div role="region" aria-labelledby="related-products-heading">
                <h2 id="related-products-heading" className="text-2xl font-bold mb-6">Produits similaires</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6" role="list" aria-label="Liste de produits similaires">
                  {relatedProducts.map((related) => (
                    <div key={related.id} role="listitem">
                      <ProductCard
                        product={related}
                        storeSlug={store.slug}
                      />
                    </div>
                  ))}
                </div>
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
