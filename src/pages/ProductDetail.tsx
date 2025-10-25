import { useEffect, useState, useMemo } from "react";
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
import { ShoppingCart, Star, ArrowLeft, CheckCircle2, Package, HelpCircle, ClipboardList, Download, Clock, RefreshCw, DollarSign, Gift } from "lucide-react";
import ProductCard from "@/components/marketplace/ProductCard";
import StoreFooter from "@/components/storefront/StoreFooter";
import { useProducts } from "@/hooks/useProducts";
import DOMPurify from "dompurify";
import { ProductImageGallery } from "@/components/ui/ProductImageGallery";
import { SEOMeta, ProductSchema, BreadcrumbSchema } from "@/components/seo";

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

  // SEO Meta données
  const seoData = useMemo(() => {
    const plainDescription = product.description?.replace(/<[^>]*>/g, "").trim() || "";
    const truncatedDescription = plainDescription.length > 160 
      ? plainDescription.substring(0, 157) + "..." 
      : plainDescription;
    
    return {
      title: `${product.name} - ${store.name}`,
      description: truncatedDescription || `Acheter ${product.name} sur ${store.name}. ${product.category || 'Produit digital'} disponible sur Payhula. Paiement sécurisé en ${product.currency}.`,
      keywords: [
        product.name,
        product.category,
        product.product_type,
        store.name,
        'achat en ligne',
        'marketplace afrique',
        product.currency === 'XOF' ? 'FCFA' : product.currency
      ].filter(Boolean).join(', '),
      url: productUrl,
      image: product.image_url || `${window.location.origin}/og-default.jpg`,
      imageAlt: `${product.name} - ${store.name}`,
      price: product.price,
      currency: product.currency,
      availability: product.is_active ? 'instock' : 'outofstock'
    };
  }, [product, store, productUrl]);

  // Breadcrumb
  const breadcrumbItems = useMemo(() => [
    { name: "Accueil", url: window.location.origin },
    { name: "Marketplace", url: `${window.location.origin}/marketplace` },
    { name: store.name, url: `${window.location.origin}/stores/${store.slug}` },
    { name: product.name, url: productUrl }
  ], [store, product, productUrl]);

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
        type="product"
        price={seoData.price}
        currency={seoData.currency}
        availability={seoData.availability}
      />
      
      {/* Schema.org Product */}
      <ProductSchema
        product={{
          ...product,
          store: {
            name: store.name,
            slug: store.slug
          }
        }}
      />
      
      {/* Breadcrumb Schema */}
      <BreadcrumbSchema items={breadcrumbItems} />

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
              {/* 🖼️ AMÉLIORÉ: Galerie d'images complète (toutes sources) */}
              <div className="space-y-4">
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

                <Button size="lg" className="w-full sm:w-auto">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Acheter maintenant
                </Button>

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
