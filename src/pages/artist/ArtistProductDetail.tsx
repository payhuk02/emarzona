/**
 * Artist Product Detail Page - Professional
 * Date: 28 Janvier 2025
 *
 * Page complète de détail pour œuvres d'artiste avec certificats, authentification, shipping
 * Améliorée avec SEO, analytics, recommandations, partage social et wishlist
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { sanitizeProductDescription } from '@/lib/html-sanitizer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  ShoppingCart,
  Heart,
  Share2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  User,
  Award,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ProductReviewsSummary } from '@/components/reviews/ProductReviewsSummary';
import { ReviewsList } from '@/components/reviews/ReviewsList';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import { ProductImages } from '@/components/shared';
import { useCart } from '@/hooks/cart/useCart';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';
import { useAnalyticsTracking } from '@/hooks/useProductAnalytics';
import { useWishlistToggle } from '@/hooks/wishlist/useWishlistToggle';
import { SEOMeta, ProductSchema } from '@/components/seo';
import { ArtistCertificateDisplay } from '@/components/artist/ArtistCertificateDisplay';
import { Artwork3DViewer } from '@/components/artist/Artwork3DViewer';
import { ArtworkProvenanceDisplay } from '@/components/artist/ArtworkProvenanceDisplay';
import {
  useArtwork3DModel,
  useArtworkProvenanceHistory,
  useArtworkCertificates,
  useIncrement3DModelViews,
} from '@/hooks/artist/useArtworkProvenance';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FileText } from 'lucide-react';
import { ArtistShippingCalculator } from '@/components/artist/ArtistShippingCalculator';

const ArtistProductDetail = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Utiliser le hook unifié pour la wishlist
  const {
    isInWishlist,
    toggle: handleWishlistToggle,
    isLoading: isCheckingWishlist,
  } = useWishlistToggle(productId);

  // Track analytics event
  const { trackView } = useAnalyticsTracking();

  // Fetch 3D model and provenance
  const { data: artwork3D } = useArtwork3DModel(productId || '');
  const { data: provenanceHistory } = useArtworkProvenanceHistory(productId || '');
  const { data: certificates } = useArtworkCertificates(productId || '');
  const incrementViews = useIncrement3DModelViews();

  // Fetch product data with store and artist details - OPTIMIZED: Single query with joins
  const { data: product, isLoading } = useQuery({
    queryKey: ['artist-product', productId],
    queryFn: async () => {
      if (!productId) {
        throw new Error('Product ID is required');
      }
      const validProductId = productId; // Type narrowing
      // Single optimized query with all joins to eliminate N+1 queries
      const { data: productData, error } = await supabase
        .from('products')
        .select(
          `
          *,
          stores (
            id,
            name,
            slug,
            logo_url
          ),
          artist_products (
            *
          )
        `
        )
        .eq('id', validProductId)
        .single();

      if (error) throw error;

      // Extract artist data from the joined result
      const artistProducts = productData.artist_products;
      const artistData = Array.isArray(artistProducts) ? artistProducts[0] : artistProducts;

      // Extract images safely
      const images = Array.isArray(productData.images)
        ? productData.images
        : productData.image_url
          ? [productData.image_url]
          : [];

      return {
        ...productData,
        artist: artistData || null,
        store: Array.isArray(productData.stores) ? productData.stores[0] : productData.stores,
        images: images as string[],
      };
    },
    enabled: !!productId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  // La vérification de wishlist est gérée par useWishlistToggle via useMarketplaceFavorites

  // Track product view on mount
  useEffect(() => {
    if (productId && product) {
      trackView(productId, {
        product_type: 'artist',
        timestamp: new Date().toISOString(),
      });

      // Track with external pixels
      if (typeof window !== 'undefined') {
        if ((window as Window & { gtag?: (...args: unknown[]) => void }).gtag) {
          (window as Window & { gtag: (...args: unknown[]) => void }).gtag('event', 'view_item', {
            items: [
              {
                item_id: productId,
                item_name: product?.name || 'Artist Product',
                item_category: 'artist',
                price: product?.price,
                currency: product?.currency,
              },
            ],
          });
        }

        if ((window as Window & { fbq?: (...args: unknown[]) => void }).fbq) {
          (window as Window & { fbq: (...args: unknown[]) => void }).fbq('track', 'ViewContent', {
            content_type: 'product',
            content_ids: [productId],
            content_category: 'artist',
            value: product?.price,
            currency: product?.currency,
          });
        }

        if ((window as Window & { ttq?: { track: (...args: unknown[]) => void } }).ttq) {
          (window as Window & { ttq: { track: (...args: unknown[]) => void } }).ttq.track(
            'ViewContent',
            {
              content_type: 'product',
              content_id: productId,
              value: product?.price,
              currency: product?.currency,
            }
          );
        }
      }
    }
  }, [productId, trackView, product]);

  // La gestion de wishlist est gérée par useWishlistToggle (via handleWishlistToggle)

  // Handle social share
  const handleShare = async () => {
    const url = window.location.href;
    const title = product?.name || "Œuvre d'artiste";
    const text = product?.short_description || '';

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch (error) {
        logger.info('Partage annulé ou erreur', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast({
          title: 'Lien copié',
          description: 'Le lien a été copié dans le presse-papiers',
        });
      } catch (error) {
        logger.error('Erreur lors de la copie', {
          error: error instanceof Error ? error.message : String(error),
        });
        toast({
          title: 'Erreur',
          description: 'Impossible de copier le lien',
          variant: 'destructive',
        });
      }
    }
  };

  const handleAddToCart = async () => {
    if (!product) {
      toast({
        title: '❌ Erreur',
        description: 'Produit non trouvé',
        variant: 'destructive',
      });
      return;
    }

    setIsAddingToCart(true);

    try {
      await addItem({
        product_id: productId!,
        product_type: 'artist',
        quantity,
        metadata: {
          store_id: product.store_id,
          artist_product_id: product.artist?.id,
          selected_at: new Date().toISOString(),
        },
      });

      logger.info('Produit ajouté au panier', {
        productId,
        quantity,
      });

      setQuantity(1);
    } catch (error) {
      logger.error("Erreur lors de l'ajout au panier", error);
      toast({
        title: '❌ Erreur',
        description: error.message || "Impossible d'ajouter au panier",
        variant: 'destructive',
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <div className="space-y-8">
              <Skeleton className="h-10 w-32" />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Skeleton className="h-96 w-full" />
                <Skeleton className="h-96 w-full" />
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (!product) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  <p>Œuvre non trouvée</p>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  const images =
    product?.images && Array.isArray(product.images)
      ? product.images
      : product?.image_url
        ? [product.image_url]
        : [];
  const availability = product?.is_active ? 'instock' : 'outofstock';
  const currentPrice = product?.promotional_price || product?.price;
  const productUrl = `${window.location.origin}/artist/${productId}`;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-8">
          {/* SEO Meta Tags */}
          <SEOMeta
            title={product.name || "Œuvre d'artiste"}
            description={
              product.short_description ||
              product.description ||
              `${product.name || 'Œuvre'} - Œuvre d'artiste disponible sur Emarzona`
            }
            keywords={product.category || undefined}
            url={productUrl}
            image={images[0] || undefined}
            imageAlt={product.name || "Œuvre d'artiste"}
            type="product"
            price={currentPrice}
            currency={product.currency || 'XOF'}
            availability={availability}
          />

          {/* Product Schema.org */}
          {product.store && (
            <ProductSchema
              product={{
                id: product.id,
                name: product.name || '',
                slug: product.slug || '',
                description: product.description || product.short_description || '',
                price: currentPrice || 0,
                currency: product.currency || 'XOF',
                image_url: images[0] || undefined,
                images: images.map((url: string) => ({ url })),
                category: product.category || undefined,
                is_active: product.is_active || false,
                created_at: product.created_at || new Date().toISOString(),
              }}
              store={{
                name: product.store?.name || '',
                slug: product.store?.slug || '',
                logo_url: product.store?.logo_url || undefined,
              }}
              url={productUrl}
            />
          )}

          {/* Back Button */}
          <Button
            variant="ghost"
            className="mb-6"
            onClick={() => navigate(-1)}
            aria-label="Retour à la page précédente"
          >
            <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
            Retour
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-12">
            {/* Left: Images / 3D Viewer */}
            {artwork3D ? (
              <div className="space-y-4">
                <Artwork3DViewer
                  modelUrl={artwork3D.model_url}
                  modelType={artwork3D.model_type}
                  thumbnailUrl={artwork3D.thumbnail_url}
                  autoRotate={artwork3D.auto_rotate}
                  autoPlay={artwork3D.auto_play}
                  showControls={artwork3D.show_controls}
                  backgroundColor={artwork3D.background_color}
                  cameraPosition={artwork3D.camera_position}
                  cameraTarget={artwork3D.camera_target}
                  onView={() => {
                    if (artwork3D.id) {
                      incrementViews.mutate(artwork3D.id);
                    }
                  }}
                />
                <div className="text-sm text-muted-foreground text-center">
                  {artwork3D.views_count} vue{artwork3D.views_count > 1 ? 's' : ''}
                </div>
              </div>
            ) : (
              <ProductImages
                images={images}
                productName={product?.name || "Œuvre d'artiste"}
                showThumbnails={true}
                enableLightbox={true}
                aspectRatio="square"
              />
            )}

            {/* Right: Product Info */}
            <div className="space-y-6">
              {/* Title & Category */}
              <div>
                <div
                  className="flex items-center gap-2 mb-2"
                  role="group"
                  aria-label="Catégories du produit"
                >
                  <Badge aria-label={`Catégorie: ${product?.category}`}>{product?.category}</Badge>
                  {product?.artist?.artist_type && (
                    <Badge
                      variant="outline"
                      aria-label={`Type d'artiste: ${product.artist.artist_type}`}
                    >
                      {product.artist.artist_type === 'writer'
                        ? 'Écrivain'
                        : product.artist.artist_type === 'musician'
                          ? 'Musicien'
                          : product.artist.artist_type === 'visual_artist'
                            ? 'Artiste visuel'
                            : product.artist.artist_type === 'designer'
                              ? 'Designer'
                              : product.artist.artist_type === 'multimedia'
                                ? 'Multimédia'
                                : 'Artiste'}
                    </Badge>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-2" id="product-title">
                  {product?.name}
                </h1>
                {product?.artist?.artwork_title && (
                  <p className="text-lg text-muted-foreground mb-2">
                    {product.artist.artwork_title}
                  </p>
                )}
                {product?.short_description && (
                  <p className="text-muted-foreground">{product.short_description}</p>
                )}
              </div>

              {/* Artist Info */}
              {product?.artist && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5" />À propos de l'artiste
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {product.artist.artist_name && (
                      <div>
                        <p className="text-sm text-muted-foreground">Nom</p>
                        <p className="font-medium">{product.artist.artist_name}</p>
                      </div>
                    )}
                    {product.artist.artist_bio && (
                      <div>
                        <p className="text-sm text-muted-foreground">Biographie</p>
                        <p className="text-sm">{product.artist.artist_bio}</p>
                      </div>
                    )}
                    {product.artist.artwork_year && (
                      <div>
                        <p className="text-sm text-muted-foreground">Année de création</p>
                        <p className="font-medium">{product.artist.artwork_year}</p>
                      </div>
                    )}
                    {product.artist.artwork_medium && (
                      <div>
                        <p className="text-sm text-muted-foreground">Médium</p>
                        <p className="font-medium">{product.artist.artwork_medium}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Price */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                <span className="text-2xl sm:text-3xl font-bold">
                  {product?.price.toLocaleString()} {product?.currency}
                </span>
                {product?.promotional_price && (
                  <span className="text-lg sm:text-xl line-through text-gray-500">
                    {product.promotional_price.toLocaleString()} {product?.currency}
                  </span>
                )}
              </div>

              {/* Edition Info */}
              {product?.artist?.artwork_edition_type && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="font-medium">
                          {product.artist.artwork_edition_type === 'original'
                            ? 'Original'
                            : product.artist.artwork_edition_type === 'limited_edition'
                              ? 'Édition limitée'
                              : product.artist.artwork_edition_type === 'print'
                                ? 'Tirage'
                                : 'Reproduction'}
                        </p>
                        {product.artist.edition_number && product.artist.total_editions && (
                          <p className="text-sm text-muted-foreground">
                            Édition {product.artist.edition_number} sur{' '}
                            {product.artist.total_editions}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quantity */}
              <div>
                <h3 className="font-semibold mb-3" id="quantity-label">
                  Quantité
                </h3>
                <div
                  className="flex items-center gap-3"
                  role="group"
                  aria-labelledby="quantity-label"
                >
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    aria-label="Diminuer la quantité"
                    aria-describedby="quantity-value"
                  >
                    <span aria-hidden="true">-</span>
                  </Button>
                  <span
                    id="quantity-value"
                    className="text-lg font-medium w-12 text-center"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    {quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                    aria-label="Augmenter la quantité"
                    aria-describedby="quantity-value"
                  >
                    <span aria-hidden="true">+</span>
                  </Button>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <Button
                  onClick={handleAddToCart}
                  className="w-full"
                  size="lg"
                  disabled={!product?.is_active || isAddingToCart}
                  aria-label={!product?.is_active ? 'Produit non disponible' : 'Ajouter au panier'}
                  aria-describedby="product-title"
                >
                  {isAddingToCart ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" aria-hidden="true" />
                      <span aria-live="polite">Ajout en cours...</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-5 w-5 mr-2" aria-hidden="true" />
                      {!product?.is_active ? 'Non disponible' : 'Ajouter au panier'}
                    </>
                  )}
                </Button>

                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <Button
                    variant="outline"
                    className="w-full min-h-[44px] touch-manipulation"
                    onClick={handleWishlistToggle}
                    disabled={isCheckingWishlist}
                    aria-label={isInWishlist ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    aria-pressed={isInWishlist}
                  >
                    {isCheckingWishlist ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                    ) : (
                      <Heart
                        className={`h-4 w-4 mr-2 ${isInWishlist ? 'fill-red-500 text-red-500' : ''}`}
                        aria-hidden="true"
                      />
                    )}
                    <span className="hidden sm:inline" aria-live="polite">
                      {isInWishlist ? 'Retiré' : 'Favori'}
                    </span>
                    <span className="sm:hidden" aria-live="polite">
                      {isInWishlist ? 'Retiré' : 'Favori'}
                    </span>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full min-h-[44px] touch-manipulation"
                    onClick={handleShare}
                    aria-label="Partager cette œuvre"
                  >
                    <Share2 className="h-4 w-4 mr-2" aria-hidden="true" />
                    <span className="hidden sm:inline">Partager</span>
                    <span className="sm:hidden">Partager</span>
                  </Button>
                </div>
              </div>

              {/* Shipping Info */}
              {product?.artist?.requires_shipping && (
                <>
                  <ArtistShippingCalculator
                    productId={productId!}
                    artworkValue={product?.price || 0}
                  />
                </>
              )}

              {/* Certificate Display */}
              {product?.artist && (
                <ArtistCertificateDisplay
                  certificateUrl={product.artist.certificate_file_url || undefined}
                  certificateOfAuthenticity={product.artist.certificate_of_authenticity || false}
                  signatureAuthenticated={product.artist.signature_authenticated || false}
                  signatureLocation={product.artist.signature_location || undefined}
                  editionType={product.artist.artwork_edition_type || undefined}
                  editionNumber={product.artist.edition_number || undefined}
                  totalEditions={product.artist.total_editions || undefined}
                />
              )}
            </div>
          </div>

          {/* Content Tabs */}
          <Tabs defaultValue="description" className="mt-8 sm:mt-12 space-y-4 sm:space-y-6">
            <TabsList
              className={`grid w-full h-auto ${(provenanceHistory && provenanceHistory.length > 0) || (certificates && certificates.length > 0) ? 'grid-cols-4' : 'grid-cols-3'}`}
            >
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="details">Détails</TabsTrigger>
              {(provenanceHistory && provenanceHistory.length > 0) ||
              (certificates && certificates.length > 0) ? (
                <TabsTrigger value="provenance">
                  Provenance {certificates && certificates.length > 0 && `(${certificates.length})`}
                </TabsTrigger>
              ) : null}
              <TabsTrigger value="reviews">Avis</TabsTrigger>
            </TabsList>

            {/* Description Tab */}
            <TabsContent value="description" className="space-y-6">
              {product?.description && (
                <Card>
                  <CardHeader>
                    <CardTitle>À propos de cette œuvre</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      className="bg-white dark:bg-white text-black dark:text-black prose max-w-none prose-headings:text-black dark:prose-headings:text-black prose-p:text-black dark:prose-p:text-black prose-a:text-primary prose-strong:text-black dark:prose-strong:text-black p-4 sm:p-6 rounded-lg"
                      dangerouslySetInnerHTML={{
                        __html: sanitizeProductDescription(product.description || ''),
                      }}
                    />
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-6">
              {/* Shipping Calculator - Only show if shipping required */}
              {product?.artist?.requires_shipping && (
                <ArtistShippingCalculator
                  productId={productId!}
                  artworkValue={product?.price || 0}
                />
              )}

              {/* Provenance Display */}
              {provenanceHistory && provenanceHistory.length > 0 && (
                <ArtworkProvenanceDisplay provenanceHistory={provenanceHistory} />
              )}

              {/* Certificates Display */}
              {certificates && certificates.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Certificats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {certificates.map(cert => (
                      <Card key={cert.id} className="border-l-4 border-l-primary">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{cert.certificate_type}</CardTitle>
                            {cert.is_verified && (
                              <Badge variant="default" className="bg-green-500">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Vérifié
                              </Badge>
                            )}
                          </div>
                          {cert.certificate_number && (
                            <CardDescription>N° {cert.certificate_number}</CardDescription>
                          )}
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="font-medium">Émis par:</span> {cert.issued_by}
                            </div>
                            <div>
                              <span className="font-medium">Date d'émission:</span>{' '}
                              {format(new Date(cert.issued_date), 'PP', { locale: fr })}
                            </div>
                            {cert.certificate_pdf_url && (
                              <Button variant="outline" size="sm" asChild>
                                <a
                                  href={cert.certificate_pdf_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  Télécharger le certificat
                                </a>
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Détails de l'œuvre</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {product?.artist && (
                    <>
                      {product.artist.artwork_title && (
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Titre</span>
                          <span className="font-medium">{product.artist.artwork_title}</span>
                        </div>
                      )}
                      {product.artist.artwork_year && (
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Année</span>
                          <span className="font-medium">{product.artist.artwork_year}</span>
                        </div>
                      )}
                      {product.artist.artwork_medium && (
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Médium</span>
                          <span className="font-medium">{product.artist.artwork_medium}</span>
                        </div>
                      )}
                      {product.artist.artwork_dimensions && (
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Dimensions</span>
                          <span className="font-medium">
                            {typeof product.artist.artwork_dimensions === 'object' &&
                            !Array.isArray(product.artist.artwork_dimensions)
                              ? `${(product.artist.artwork_dimensions as { width?: number; height?: number; unit?: string }).width || ''} x ${(product.artist.artwork_dimensions as { width?: number; height?: number; unit?: string }).height || ''} ${(product.artist.artwork_dimensions as { width?: number; height?: number; unit?: string }).unit || 'cm'}`
                              : String(product.artist.artwork_dimensions)}
                          </span>
                        </div>
                      )}
                      {product.artist.artwork_edition_type && (
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Type d'édition</span>
                          <span className="font-medium capitalize">
                            {product.artist.artwork_edition_type === 'original'
                              ? 'Original'
                              : product.artist.artwork_edition_type === 'limited_edition'
                                ? 'Édition limitée'
                                : product.artist.artwork_edition_type === 'print'
                                  ? 'Tirage'
                                  : 'Reproduction'}
                          </span>
                        </div>
                      )}
                      {product.artist.requires_shipping !== undefined && (
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Expédition</span>
                          <span className="font-medium">
                            {product.artist.requires_shipping ? 'Oui' : 'Non'}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Provenance Tab */}
            {(provenanceHistory && provenanceHistory.length > 0) ||
            (certificates && certificates.length > 0) ? (
              <TabsContent value="provenance" className="space-y-6">
                {provenanceHistory && provenanceHistory.length > 0 && (
                  <ArtworkProvenanceDisplay provenanceHistory={provenanceHistory} />
                )}
                {certificates && certificates.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Certificats d'Authenticité
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {certificates.map(cert => (
                        <Card key={cert.id} className="border-l-4 border-l-primary">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg capitalize">
                                {cert.certificate_type === 'authenticity'
                                  ? "Certificat d'Authenticité"
                                  : cert.certificate_type === 'provenance'
                                    ? 'Certificat de Provenance'
                                    : cert.certificate_type === 'condition'
                                      ? "Certificat d'État"
                                      : cert.certificate_type === 'appraisal'
                                        ? "Certificat d'Expertise"
                                        : cert.certificate_type === 'export'
                                          ? "Certificat d'Exportation"
                                          : cert.certificate_type}
                              </CardTitle>
                              {cert.is_verified && (
                                <Badge variant="default" className="bg-green-500">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Vérifié
                                </Badge>
                              )}
                            </div>
                            {cert.certificate_number && (
                              <CardDescription>N° {cert.certificate_number}</CardDescription>
                            )}
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="font-medium text-muted-foreground">
                                    Émis par:
                                  </span>
                                  <p>{cert.issued_by}</p>
                                </div>
                                <div>
                                  <span className="font-medium text-muted-foreground">
                                    Date d'émission:
                                  </span>
                                  <p>{format(new Date(cert.issued_date), 'PP', { locale: fr })}</p>
                                </div>
                                {cert.expiry_date && (
                                  <div>
                                    <span className="font-medium text-muted-foreground">
                                      Date d'expiration:
                                    </span>
                                    <p>
                                      {format(new Date(cert.expiry_date), 'PP', { locale: fr })}
                                    </p>
                                  </div>
                                )}
                                {cert.verification_code && (
                                  <div>
                                    <span className="font-medium text-muted-foreground">
                                      Code de vérification:
                                    </span>
                                    <p className="font-mono">{cert.verification_code}</p>
                                  </div>
                                )}
                              </div>
                              {cert.certificate_content && (
                                <div className="mt-4 p-4 bg-muted rounded-lg">
                                  <p className="text-sm whitespace-pre-wrap">
                                    {cert.certificate_content}
                                  </p>
                                </div>
                              )}
                              <div className="flex gap-2">
                                {cert.certificate_pdf_url && (
                                  <Button variant="outline" size="sm" asChild>
                                    <a
                                      href={cert.certificate_pdf_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <FileText className="h-4 w-4 mr-2" />
                                      Télécharger le PDF
                                    </a>
                                  </Button>
                                )}
                                {cert.qr_code_url && (
                                  <Button variant="outline" size="sm" asChild>
                                    <a
                                      href={cert.qr_code_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <FileText className="h-4 w-4 mr-2" />
                                      QR Code
                                    </a>
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            ) : null}

            {/* Reviews Tab */}
            <TabsContent value="reviews" className="space-y-6">
              <ProductReviewsSummary productId={productId!} productType="artist" />

              <Card>
                <CardHeader>
                  <CardTitle>Avis des utilisateurs</CardTitle>
                </CardHeader>
                <CardContent>
                  <ReviewsList productId={productId!} />
                </CardContent>
              </Card>

              {user && (
                <Card>
                  <CardHeader>
                    <CardTitle>Donner votre avis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ReviewForm
                      productId={productId!}
                      productType="artist"
                      onSubmit={() => {
                        // Refresh reviews after submission
                        window.location.reload();
                      }}
                    />
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          {/* Reviews Summary (outside tabs for visibility) */}
          <ProductReviewsSummary productId={productId!} productType="artist" />
        </main>
      </div>
    </SidebarProvider>
  );
};

// Optimisation avec React.memo pour éviter les re-renders inutiles
export default React.memo(ArtistProductDetail);
