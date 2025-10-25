import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useProducts } from "@/hooks/useProducts";
import { useReviews } from "@/hooks/useReviews";
import StoreHeader from "@/components/storefront/StoreHeader";
import StoreTabs from "@/components/storefront/StoreTabs";
import ProductCard from "@/components/storefront/ProductCard";
import ProductFilters from "@/components/storefront/ProductFilters";
import StoreFooter from "@/components/storefront/StoreFooter";
import ContactForm from "@/components/storefront/ContactForm";
import ReviewsList from "@/components/storefront/ReviewsList";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart } from "lucide-react";
import { ProductGrid } from "@/components/ui/ProductGrid";
import { SEOMeta, StoreSchema, BreadcrumbSchema } from "@/components/seo";

const Storefront = () => {
  const { slug } = useParams<{ slug: string }>();
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [productType, setProductType] = useState("all");

  const { products, loading: productsLoading } = useProducts(store?.id);
  const { reviews, loading: reviewsLoading } = useReviews(store?.id);

  useEffect(() => {
    const fetchStore = async () => {
      if (!slug) return;

      try {
        const { data, error } = await supabase
          .from("stores")
          .select("*")
          .eq("slug", slug)
          .limit(1);

        if (error) throw error;
        setStore(data && data.length > 0 ? data[0] : null);
      } catch (error) {
        console.error("Error fetching store:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStore();
  }, [slug]);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      category === "all" || product.category === category;
    const matchesType =
      productType === "all" || product.product_type === productType;

    return matchesSearch && matchesCategory && matchesType;
  });

  const categories = Array.from(
    new Set(products.map((p) => p.category).filter(Boolean))
  ) as string[];
  const productTypes = Array.from(
    new Set(products.map((p) => p.product_type).filter(Boolean))
  ) as string[];

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

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Boutique introuvable</h1>
          <p className="text-muted-foreground">
            Cette boutique n'existe pas ou a été supprimée.
          </p>
        </div>
      </div>
    );
  }

  const storeUrl = `${window.location.origin}/stores/${store.slug}`;

  // SEO Meta données
  const seoData = useMemo(() => {
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

  // Breadcrumb
  const breadcrumbItems = useMemo(() => [
    { name: "Accueil", url: window.location.origin },
    { name: "Marketplace", url: `${window.location.origin}/marketplace` },
    { name: store.name, url: storeUrl }
  ], [store.name, storeUrl]);

  return (
    <>
      {/* SEO Meta Tags */}
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
      
      {/* Schema.org Store */}
      <StoreSchema store={store} />
      
      {/* Breadcrumb Schema */}
      <BreadcrumbSchema items={breadcrumbItems} />

      <div className="min-h-screen flex flex-col overflow-x-hidden">
        <StoreHeader store={store} />

        <main className="flex-1 bg-background overflow-x-hidden">
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
                    onProductTypeChange={setProductType}
                    categories={categories}
                    productTypes={productTypes}
                  />

                  {productsLoading ? (
                    <ProductGrid loading={true} skeletonCount={6} />
                  ) : filteredProducts.length > 0 ? (
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
                  ) : (
                    <div className="text-center py-12 sm:py-16 px-4 animate-fade-in">
                      <div className="max-w-md mx-auto">
                        <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                          <ShoppingCart className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold mb-2 text-foreground">Aucun produit disponible</h3>
                        <p className="text-sm sm:text-base text-muted-foreground">
                          Cette boutique n'a pas encore de produits à vendre. Revenez bientôt !
                        </p>
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
