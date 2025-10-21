import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, Star, ArrowLeft } from "lucide-react";
import ProductCard from "@/components/marketplace/ProductCard";
import StoreFooter from "@/components/storefront/StoreFooter";
import { useProducts } from "@/hooks/useProducts";
import DOMPurify from "dompurify";

const ProductDetails = () => {
  const { slug, productSlug } = useParams<{ slug: string; productSlug: string }>();
  const [product, setProduct] = useState<any>(null);
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const { products: similarProducts } = useProducts(store?.id);

  useEffect(() => {
    const fetchData = async () => {
      if (!slug || !productSlug) return;
      setLoading(true);

      try {
        // Fetch store
        const { data: storeData, error: storeError } = await supabase
          .from("stores")
          .select("*")
          .eq("slug", slug)
          .limit(1);

        if (storeError) throw storeError;
        setStore(storeData && storeData.length > 0 ? storeData[0] : null);

        // Fetch product
        const { data: productData, error: productError } = await supabase
          .from("products")
          .select("*")
          .eq("slug", productSlug)
          .eq("store_id", storeData && storeData.length > 0 ? storeData[0].id : "")
          .eq("is_active", true)
          .limit(1);

        if (productError) throw productError;
        setProduct(productData && productData.length > 0 ? productData[0] : null);
      } catch (error) {
        console.error("Erreur de chargement :", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug, productSlug]);

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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Produit introuvable</h1>
          <p className="text-muted-foreground">
            Ce produit n'existe pas ou n'est plus disponible.
          </p>
          <Link to={`/stores/${slug}`}>
            <Button className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la boutique
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const productUrl = `${window.location.origin}/stores/${store.slug}/products/${product.slug}`;
  const relatedProducts = similarProducts
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  // ✅ Nettoyage du HTML pour éviter les scripts dangereux
  const safeDescription = product.description
    ? DOMPurify.sanitize(product.description)
    : "";

  return (
    <>
      {/* SEO */}
      <Helmet>
        <title>{product.name} - {store.name}</title>
        <meta
          name="description"
          content={product.description?.replace(/<[^>]*>/g, "") || `Acheter ${product.name} sur ${store.name}`}
        />
        <meta property="og:title" content={product.name} />
        <meta property="og:description" content={product.description?.replace(/<[^>]*>/g, "") || ""} />
        {product.image_url && <meta property="og:image" content={product.image_url} />}
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        {/* Header */}
        <header className="border-b bg-card shadow-sm sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 py-3">
            <Link
              to={`/stores/${store.slug}`}
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à {store.name}
            </Link>
          </div>
        </header>

        {/* Contenu principal */}
        <main className="flex-1">
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              {/* Image */}
              <div className="aspect-square overflow-hidden rounded-lg bg-muted">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                    <ShoppingCart className="h-16 w-16 opacity-20" />
                  </div>
                )}
              </div>

              {/* Infos produit */}
              <div className="space-y-6">
                <h1 className="text-3xl font-bold">{product.name}</h1>

                {product.rating > 0 && (
                  <div className="flex items-center gap-2">
                    {renderStars(product.rating)}
                    <span className="text-sm text-muted-foreground">
                      ({product.reviews_count} avis)
                    </span>
                  </div>
                )}

                <div className="text-4xl font-bold">
                  {product.price.toLocaleString()}{" "}
                  <span className="text-2xl text-muted-foreground">
                    {product.currency}
                  </span>
                </div>

                <Button size="lg" className="w-full sm:w-auto">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Acheter maintenant
                </Button>

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

            {/* Produits similaires */}
            {relatedProducts.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Produits similaires</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {relatedProducts.map((related) => (
                    <ProductCard
                      key={related.id}
                      product={related}
                      storeSlug={store.slug}
                    />
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
