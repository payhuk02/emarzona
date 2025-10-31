import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useProducts } from "@/hooks/useProducts";
import { useProductReviews } from "@/hooks/useReviews";
import StoreHeader from "@/components/storefront/StoreHeader";
import StoreTabs from "@/components/storefront/StoreTabs";
import ProductCard from "@/components/storefront/ProductCard";
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

const Storefront = () => {
  const { slug } = useParams<{ slug: string }>();
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [productType, setProductType] = useState("all");
  const [licensingType, setLicensingType] = useState<'all' | 'standard' | 'plr' | 'copyrighted'>('all');

  // Utiliser un ID stable pour éviter les violations des règles des hooks
  const storeId = store?.id || null;
  const { products, loading: productsLoading } = useProducts(storeId);
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
        setStore(data[0]);
        logger.info(`Boutique chargée: ${data[0].name} (${slug})`);
      } else {
        setStore(null);
        setError("Boutique introuvable");
      }
    } catch (error: any) {
      logger.error("Erreur lors du chargement de la boutique:", error);
      const errorMessage = error?.message || "Impossible de charger la boutique. Veuillez réessayer plus tard.";
      setError(errorMessage);
      setStore(null);
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
    
    const description = store.description || `Découvrez les produits de ${store.name} sur Payhula. ${products.length} produits disponibles. Boutique en ligne sécurisée avec paiement Mobile Money et CB.`;
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
          <h1 className="text-2xl font-bold mb-2 text-foreground">Boutique introuvable</h1>
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

                  {productsLoading ? (
                    <ProductGrid loading={true} skeletonCount={6} />
                  ) : filteredProducts.length > 0 ? (
                    <div ref={productsRef}>
                      <ProductGrid>
                        {filteredProducts.map((product, index) => (
                          <div key={product.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                            <ProductCard
                              product={product}
                              storeSlug={store.slug}
                            />
                          </div>
                        ))}
                      </ProductGrid>
                    </div>
                  ) : (
                    <div className="text-center py-12 sm:py-16 px-4 animate-fade-in" role="status" aria-live="polite">
                      <div className="max-w-md mx-auto">
                        <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                          <ShoppingCart className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" aria-hidden="true" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold mb-2 text-foreground">
                          {searchQuery || category !== "all" || productType !== "all" || licensingType !== "all"
                            ? "Aucun produit ne correspond à vos filtres"
                            : "Aucun produit disponible"}
                        </h3>
                        <p className="text-sm sm:text-base text-muted-foreground mb-4">
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
