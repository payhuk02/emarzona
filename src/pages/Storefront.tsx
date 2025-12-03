import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useProductsOptimized } from "@/hooks/useProductsOptimized";
import { useProductReviews } from "@/hooks/useReviews";
import StoreHeader from "@/components/storefront/StoreHeader";
import StoreTabs from "@/components/storefront/StoreTabs";
import ProductCardModern from "@/components/marketplace/ProductCardModern";
import UnifiedProductCard from "@/components/products/UnifiedProductCard";
import { transformToUnifiedProduct } from "@/lib/product-transform";
import ProductFilters from "@/components/storefront/ProductFilters";
import StoreFooter from "@/components/storefront/StoreFooter";
import ContactForm from "@/components/storefront/ContactForm";
import ReviewsList from "@/components/storefront/ReviewsList";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, AlertCircle, ArrowRight } from "lucide-react";
import { ProductGrid } from "@/components/ui/ProductGrid";
import { Button } from "@/components/ui/button";
import { SEOMeta, StoreSchema, BreadcrumbSchema, ItemListSchema } from "@/components/seo";
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useToast } from '@/hooks/use-toast';
import { usePageCustomization } from '@/hooks/usePageCustomization';

const Storefront = () => {
  const { slug } = useParams<{ slug: string }>();
  const { getValue } = usePageCustomization('storefront');
  const navigate = useNavigate();
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false); // Pour savoir si on a déjà chargé une fois
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [productType, setProductType] = useState("all");
  const [licensingType, setLicensingType] = useState<'all' | 'standard' | 'plr' | 'copyrighted'>('all');
  const { toast } = useToast();

  // Utiliser un ID stable pour éviter les violations des règles des hooks
  const storeId = store?.id || null;
  // Utiliser useProductsOptimized avec pagination pour meilleures performances
  const { products, isLoading: productsLoading } = useProductsOptimized(storeId, {
    page: 1,
    itemsPerPage: 100, // Limite raisonnable pour storefront public
  });
  // Store-wide reviews not implemented yet; keep placeholders to avoid runtime errors
  const reviews: any[] = [];
  const reviewsLoading = false;

  const fetchStore = useCallback(async () => {
    if (!slug) {
      setError("Slug de boutique manquant");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from("stores")
        .select("*")
        .eq("slug", slug)
        .limit(1);

      if (fetchError) throw fetchError;
      
      if (data && data.length > 0) {
        const storeData = data[0];
        // Debug: Vérifier les champs récupérés
        if (process.env.NODE_ENV === 'development') {
          logger.debug('[Storefront] Store data loaded', {
            name: storeData.name,
            hasInfoMessage: !!storeData.info_message,
            infoMessage: storeData.info_message,
            infoMessageColor: storeData.info_message_color,
            infoMessageFont: storeData.info_message_font,
            allFields: Object.keys(storeData),
          });
        }
        setStore(storeData);
        logger.info(`Boutique chargée: ${storeData.name} (${slug})`);
        setHasLoadedOnce(true); // Marquer qu'on a chargé au moins une fois
      } else {
        setStore(null);
        setError("Boutique introuvable");
        setHasLoadedOnce(true); // Même en cas d'erreur, on a tenté de charger
      }
    } catch (error: any) {
      logger.error("Erreur lors du chargement de la boutique:", error);
      const errorMessage = error?.message || "Impossible de charger la boutique. Veuillez réessayer plus tard.";
      setError(errorMessage);
      setStore(null);
      setHasLoadedOnce(true); // Même en cas d'erreur, on a tenté de charger
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchStore();
  }, [fetchStore]);

  const filteredProducts = useMemo(() => 
    products.filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCategory =
        category === "all" || product.category === category;
      const matchesType =
        productType === "all" || product.product_type === productType;
      const matchesLicense =
        licensingType === 'all' || (product as any).licensing_type === licensingType;

      return matchesSearch && matchesCategory && matchesType && matchesLicense;
    }), [products, searchQuery, category, productType, licensingType]
  );

  const categories = useMemo(() => 
    Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[],
    [products]
  );
  
  const productTypes = useMemo(() =>
    Array.from(new Set(products.map((p) => p.product_type).filter(Boolean))) as string[],
    [products]
  );

  const storeUrl = useMemo(() => 
    store ? `${window.location.origin}/stores/${store.slug}` : '',
    [store]
  );

  // SEO Meta données - APPELÉ AVANT LES EARLY RETURNS
  const seoData = useMemo(() => {
    if (!store) return null;
    
    const description = store.description || `Découvrez les produits de ${store.name} sur Emarzona. ${products.length} produits disponibles. Boutique en ligne sécurisée avec paiement Mobile Money et CB.`;
    const truncatedDescription = description.length > 160 
      ? description.substring(0, 157) + "..." 
      : description;
    
    return {
      title: `${store.name} - Boutique en ligne`,
      description: truncatedDescription,
      keywords: [
        store.name,
        'boutique en ligne',
        'marketplace',
        'produits digitaux',
        'achat en ligne afrique',
        ...categories.slice(0, 3)
      ].filter(Boolean).join(', '),
      url: storeUrl,
      image: store.logo_url || store.banner_url || `${window.location.origin}/og-default.jpg`,
      imageAlt: `Logo de ${store.name}`
    };
  }, [store, storeUrl, products.length, categories]);

  // Breadcrumb - APPELÉ AVANT LES EARLY RETURNS
  const breadcrumbItems = useMemo(() => {
    if (!store) return [];
    return [
      { name: "Accueil", url: window.location.origin },
      { name: "Marketplace", url: `${window.location.origin}/marketplace` },
      { name: store.name, url: storeUrl }
    ];
  }, [store, storeUrl]);

  // Items pour ItemListSchema (produits de la boutique)
  const itemListItems = useMemo(() => {
    if (!store || filteredProducts.length === 0) return [];
    return filteredProducts.slice(0, 20).map(product => ({
      id: product.id,
      name: product.name,
      url: `/stores/${store.slug}/products/${product.slug}`,
      image: product.image_url,
      description: product.short_description || product.description,
      price: product.promotional_price || product.price,
      currency: product.currency || 'XOF',
      rating: product.rating
    }));
  }, [store, filteredProducts]);

  // Animations au scroll
  const headerRef = useScrollAnimation<HTMLElement>();
  const productsRef = useScrollAnimation<HTMLDivElement>();

  // Handler pour l'achat - Redirige vers checkout (utilisé par UnifiedProductCard)
  const handleBuyProduct = useCallback(async (action: 'view' | 'buy' | 'favorite', product: any) => {
    if (action !== 'buy') return;
    
    if (!product.store_id) {
      toast({
        title: "Erreur",
        description: "Boutique non disponible",
        variant: "destructive",
      });
      return;
    }

    // Vérifier l'authentification
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.email) {
      toast({
        title: "Authentification requise",
        description: "Veuillez vous connecter pour effectuer un achat",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    // Rediriger vers la page de checkout
    const checkoutParams = new URLSearchParams({
      productId: product.id,
      storeId: product.store_id,
    });

    navigate(`/checkout?${checkoutParams.toString()}`);
  }, [toast, navigate, store]);

  // MAINTENANT les early returns APRÈS tous les hooks
  if (loading) {
    return (
      <div className="min-h-screen">
        <Skeleton className="h-48 w-full" />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-80" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!store && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" role="alert" aria-live="polite">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="h-20 w-20 rounded-full bg-red-500/10 mx-auto mb-4 flex items-center justify-center">
            <AlertCircle className="h-10 w-10 text-red-500" aria-hidden="true" />
          </div>
          <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold mb-1.5 sm:mb-2 text-foreground">Boutique introuvable</h1>
          <p className="text-muted-foreground mb-6">
            {error || "Cette boutique n'existe pas ou a été supprimée."}
          </p>
          {error && (
            <Button
              onClick={() => {
                setError(null);
                fetchStore();
              }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:scale-105"
              aria-label="Réessayer le chargement de la boutique"
            >
              Réessayer
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          )}
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
          type="website"
        />
      )}
      
      {/* Schema.org Store */}
      <StoreSchema store={store} />
      
      {/* Breadcrumb Schema */}
      {breadcrumbItems.length > 0 && <BreadcrumbSchema items={breadcrumbItems} />}
      
      {/* Schema.org ItemList pour les produits de la boutique */}
      {itemListItems.length > 0 && store && (
        <ItemListSchema
          items={itemListItems}
          name={`Produits de ${store.name}`}
          description={`Collection de produits disponibles chez ${store.name}`}
          url={`/stores/${store.slug}`}
          numberOfItems={filteredProducts.length}
        />
      )}

      <div className="min-h-screen flex flex-col overflow-x-hidden">
        <StoreHeader store={store} />

        <main ref={headerRef} className="flex-1 bg-background overflow-x-hidden">
          <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
            <StoreTabs
              productsContent={
                <>
                  <ProductFilters
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    category={category}
                    onCategoryChange={setCategory}
                    productType={productType}
                    licensingType={licensingType}
                    onLicensingTypeChange={setLicensingType}
                    onProductTypeChange={setProductType}
                    categories={categories}
                    productTypes={productTypes}
                  />

                  {filteredProducts.length > 0 ? (
                    <div ref={productsRef}>
                      {/* Indicateur de chargement discret en haut si rechargement */}
                      {productsLoading && hasLoadedOnce && (
                        <div className="flex justify-center mb-4">
                          <div className="h-1 w-32 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-full animate-pulse" />
                        </div>
                      )}

                      <ProductGrid className={productsLoading && hasLoadedOnce ? 'opacity-75 transition-opacity duration-300' : ''}>
                        {filteredProducts.map((product, index) => {
                          // Transformer le produit vers le format unifié
                          const unifiedProduct = transformToUnifiedProduct({
                            ...product,
                            stores: store ? {
                              id: store.id,
                              name: store.name,
                              slug: store.slug,
                              logo_url: store.logo_url,
                            } : undefined,
                          });
                          
                          return (
                            <div key={product.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                              <UnifiedProductCard
                                product={unifiedProduct}
                                variant="store"
                                showAffiliate={true}
                                showActions={true}
                                onAction={handleBuyProduct}
                              />
                            </div>
                          );
                        })}
                      </ProductGrid>
                    </div>
                  ) : (
                    <div className="text-center py-12 sm:py-16 px-4 animate-fade-in" role="status" aria-live="polite">
                      <div className="max-w-md mx-auto">
                        <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                          <ShoppingCart className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" aria-hidden="true" />
                        </div>
                        <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold mb-1.5 sm:mb-2 text-foreground">
                          {searchQuery || category !== "all" || productType !== "all" || licensingType !== "all"
                            ? getValue('storefront.noProducts') || "Aucun produit ne correspond à vos filtres"
                            : getValue('storefront.noProducts') || "Aucun produit disponible"}
                        </h3>
                        <p className="text-xs sm:text-sm md:text-base text-muted-foreground mb-3 sm:mb-4">
                          {searchQuery || category !== "all" || productType !== "all" || licensingType !== "all"
                            ? "Essayez de modifier vos critères de recherche ou de filtrage."
                            : "Cette boutique n'a pas encore de produits à vendre. Revenez bientôt !"}
                        </p>
                        {(searchQuery || category !== "all" || productType !== "all" || licensingType !== "all") && (
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSearchQuery("");
                              setCategory("all");
                              setProductType("all");
                              setLicensingType("all");
                            }}
                            aria-label="Réinitialiser les filtres"
                          >
                            Réinitialiser les filtres
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </>
              }
              aboutContent={
                store.about ? (
                  <div className="prose prose-sm sm:prose max-w-none px-2 sm:px-0 animate-fade-in">
                    <p className="whitespace-pre-wrap text-foreground">{store.about}</p>
                  </div>
                ) : undefined
              }
              reviewsContent={
                <ReviewsList 
                  reviews={reviews} 
                  loading={reviewsLoading}
                  storeSlug={store.slug}
                />
              }
              contactContent={
                <ContactForm 
                  storeName={store.name}
                  contactEmail={store.contact_email}
                  contactPhone={store.contact_phone}
                />
              }
            />
          </div>
        </main>

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

export default Storefront;
