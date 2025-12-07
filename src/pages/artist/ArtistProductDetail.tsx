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
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  ShoppingCart,
  Heart,
  Share2,
  Package,
  Truck,
  Shield,
  Star,
  Check,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  User,
  Calendar,
  MapPin,
  Award,
  PenTool,
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
import { SEOMeta, ProductSchema } from '@/components/seo';
import { ArtistCertificateDisplay } from '@/components/artist/ArtistCertificateDisplay';
import { ShippingInfoDisplay } from '@/components/physical/ShippingInfoDisplay';
import { ArtistShippingCalculator } from '@/components/artist/ArtistShippingCalculator';

const ArtistProductDetail = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isCheckingWishlist, setIsCheckingWishlist] = useState(false);

  // Track analytics event
  const { trackView } = useAnalyticsTracking();

  // Fetch product data with store and artist details
  const { data: product, isLoading } = useQuery({
    queryKey: ['artist-product', productId],
    queryFn: async () => {
      const { data: productData, error } = await supabase
        .from('products')
        .select(`
          *,
          stores (
            id,
            name,
            slug,
            logo_url
          )
        `)
        .eq('id', productId)
        .single();

      if (error) throw error;

      // Fetch artist product details
      const { data: artistData } = await supabase
        .from('artist_products')
        .select('*')
        .eq('product_id', productId)
        .single();

      return {
        ...productData,
        artist: artistData,
        store: productData.stores,
      };
    },
    enabled: !!productId,
  });

  // Check if product is in wishlist
  useEffect(() => {
    const checkWishlist = async () => {
      if (!user?.id || !productId) return;
      
      setIsCheckingWishlist(true);
      try {
        const { data, error } = await supabase
          .from('wishlist_items')
          .select('id')
          .eq('user_id', user.id)
          .eq('product_id', productId)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        setIsInWishlist(!!data);
      } catch (error) {
        logger.error('Erreur lors de la vérification de la wishlist', error);
      } finally {
        setIsCheckingWishlist(false);
      }
    };

    checkWishlist();
  }, [user?.id, productId]);

  // Track product view on mount
  useEffect(() => {
    if (productId && product) {
      trackView(productId, {
        product_type: 'artist',
        timestamp: new Date().toISOString(),
      });

      // Track with external pixels
      if (typeof window !== 'undefined') {
        if ((window as any).gtag) {
          (window as any).gtag('event', 'view_item', {
            items: [{
              item_id: productId,
              item_name: product?.name || 'Artist Product',
              item_category: 'artist',
              price: product?.price,
              currency: product?.currency,
            }]
          });
        }

        if ((window as any).fbq) {
          (window as any).fbq('track', 'ViewContent', {
            content_type: 'product',
            content_ids: [productId],
            content_category: 'artist',
            value: product?.price,
            currency: product?.currency,
          });
        }

        if ((window as any).ttq) {
          (window as any).ttq.track('ViewContent', {
            content_type: 'product',
            content_id: productId,
            value: product?.price,
            currency: product?.currency,
          });
        }
      }
    }
  }, [productId, trackView, product]);

  // Handle wishlist toggle
  const handleWishlistToggle = async () => {
    if (!user?.id) {
      toast({
        title: 'Authentification requise',
        description: 'Veuillez vous connecter pour ajouter à la wishlist',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    try {
      if (isInWishlist) {
        const { error } = await supabase
          .from('wishlist_items')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);

        if (error) throw error;

        setIsInWishlist(false);
        toast({
          title: 'Retiré de la wishlist',
          description: 'L\'œuvre a été retirée de votre liste de souhaits',
        });
      } else {
        const { error } = await supabase
          .from('wishlist_items')
          .insert({
            user_id: user.id,
            product_id: productId,
            product_type: 'artist',
          });

        if (error) throw error;

        setIsInWishlist(true);
        toast({
          title: 'Ajouté à la wishlist',
          description: 'L\'œuvre a été ajoutée à votre liste de souhaits',
        });
      }
    } catch (error: any) {
      logger.error('Erreur lors de la gestion de la wishlist', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de modifier la wishlist',
        variant: 'destructive',
      });
    }
  };

  // Handle social share
  const handleShare = async () => {
    const url = window.location.href;
    const title = product?.name || 'Œuvre d\'artiste';
    const text = product?.short_description || '';

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch (error) {
        logger.info('Partage annulé ou erreur', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast({
          title: 'Lien copié',
          description: 'Le lien a été copié dans le presse-papiers',
        });
      } catch (error) {
        logger.error('Erreur lors de la copie', error);
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
    } catch (error: any) {
      logger.error('Erreur lors de l\'ajout au panier', error);
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible d\'ajouter au panier',
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

  const images = product?.images || [product?.image_url] || [];
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
            title={product.name}
            description={product.short_description || product.description || `${product.name} - Œuvre d'artiste disponible sur Emarzona`}
            keywords={product.category}
            url={productUrl}
            image={images[0]}
            imageAlt={product.name}
            type="product"
            price={currentPrice}
            currency={product.currency}
            availability={availability}
          />

          {/* Product Schema.org */}
          {product.store && (
            <ProductSchema
              product={{
                id: product.id,
                name: product.name,
                slug: product.slug,
                description: product.description || product.short_description || '',
                price: currentPrice,
                currency: product.currency,
                image_url: images[0],
                images: images.map((url: string) => ({ url })),
                category: product.category,
                is_active: product.is_active,
                created_at: product.created_at,
              }}
              store={{
                name: product.store.name,
                slug: product.store.slug,
                logo_url: product.store.logo_url,
              }}
              url={productUrl}
            />
          )}

          {/* Back Button */}
          <Button
            variant="ghost"
            className="mb-6"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-12">
            {/* Left: Images */}
            <ProductImages
              images={images}
              productName={product?.name || 'Œuvre d\'artiste'}
              showThumbnails={true}
              enableLightbox={true}
              aspectRatio="square"
            />

            {/* Right: Product Info */}
            <div className="space-y-6">
              {/* Title & Category */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge>{product?.category}</Badge>
                  {product?.artist?.artist_type && (
                    <Badge variant="outline">
                      {product.artist.artist_type === 'writer' ? 'Écrivain' :
                       product.artist.artist_type === 'musician' ? 'Musicien' :
                       product.artist.artist_type === 'visual_artist' ? 'Artiste visuel' :
                       product.artist.artist_type === 'designer' ? 'Designer' :
                       product.artist.artist_type === 'multimedia' ? 'Multimédia' :
                       'Artiste'}
                    </Badge>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">{product?.name}</h1>
                {product?.artist?.artwork_title && (
                  <p className="text-lg text-muted-foreground mb-2">
                    {product.artist.artwork_title}
                  </p>
                )}
                {product?.short_description && (
                  <p className="text-muted-foreground">
                    {product.short_description}
                  </p>
                )}
              </div>

              {/* Artist Info */}
              {product?.artist && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5" />
                      À propos de l'artiste
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
                          {product.artist.artwork_edition_type === 'original' ? 'Original' :
                           product.artist.artwork_edition_type === 'limited_edition' ? 'Édition limitée' :
                           product.artist.artwork_edition_type === 'print' ? 'Tirage' :
                           'Reproduction'}
                        </p>
                        {product.artist.edition_number && product.artist.total_editions && (
                          <p className="text-sm text-muted-foreground">
                            Édition {product.artist.edition_number} sur {product.artist.total_editions}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quantity */}
              <div>
                <h3 className="font-semibold mb-3">Quantité</h3>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    aria-label="Diminuer la quantité"
                  >
                    -
                  </Button>
                  <span className="text-lg font-medium w-12 text-center">
                    {quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                    aria-label="Augmenter la quantité"
                  >
                    +
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
                >
                  {isAddingToCart ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Ajout en cours...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-5 w-5 mr-2" />
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
                  >
                    {isCheckingWishlist ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Heart className={`h-4 w-4 mr-2 ${isInWishlist ? 'fill-red-500 text-red-500' : ''}`} />
                    )}
                    <span className="hidden sm:inline">{isInWishlist ? 'Retiré' : 'Favori'}</span>
                    <span className="sm:hidden">{isInWishlist ? 'Retiré' : 'Favori'}</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full min-h-[44px] touch-manipulation"
                    onClick={handleShare}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Partager</span>
                    <span className="sm:hidden">Partager</span>
                  </Button>
                </div>
              </div>

              {/* Shipping Info */}
              {product?.artist?.requires_shipping && (
                <>
                  <ShippingInfoDisplay productId={productId!} />
                  <ArtistShippingCalculator 
                    productId={productId!} 
                    artworkValue={product?.price || 0} 
                  />
                </>
              )}

              {/* Certificate Display */}
              {product?.artist && (
                <ArtistCertificateDisplay
                  certificateUrl={product.artist.certificate_file_url}
                  certificateOfAuthenticity={product.artist.certificate_of_authenticity}
                  signatureAuthenticated={product.artist.signature_authenticated}
                  signatureLocation={product.artist.signature_location}
                  editionType={product.artist.artwork_edition_type}
                  editionNumber={product.artist.edition_number}
                  totalEditions={product.artist.total_editions}
                />
              )}
            </div>
          </div>

          {/* Content Tabs */}
          <Tabs defaultValue="description" className="mt-8 sm:mt-12 space-y-4 sm:space-y-6">
            <TabsList className="grid w-full grid-cols-3 h-auto">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="details">Détails</TabsTrigger>
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
                      dangerouslySetInnerHTML={{ __html: sanitizeProductDescription(product.description || '') }}
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
                            {typeof product.artist.artwork_dimensions === 'object' 
                              ? `${product.artist.artwork_dimensions.width || ''} x ${product.artist.artwork_dimensions.height || ''} ${product.artist.artwork_dimensions.unit || 'cm'}`
                              : String(product.artist.artwork_dimensions)}
                          </span>
                        </div>
                      )}
                      {product.artist.artwork_edition_type && (
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Type d'édition</span>
                          <span className="font-medium capitalize">
                            {product.artist.artwork_edition_type === 'original' ? 'Original' :
                             product.artist.artwork_edition_type === 'limited_edition' ? 'Édition limitée' :
                             product.artist.artwork_edition_type === 'print' ? 'Tirage' :
                             'Reproduction'}
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

            {/* Reviews Tab */}
            <TabsContent value="reviews" className="space-y-6">
              <ProductReviewsSummary productId={productId!} productType="artist" />
              
              <Card>
                <CardHeader>
                  <CardTitle>Avis des utilisateurs</CardTitle>
                </CardHeader>
                <CardContent>
                  <ReviewsList productId={productId!} productType="artist" />
                </CardContent>
              </Card>

              {user && (
                <Card>
                  <CardHeader>
                    <CardTitle>Donner votre avis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ReviewForm productId={productId!} productType="artist" />
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

