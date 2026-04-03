/**
 * Digital Product Detail Page - Professional
 * Date: 28 octobre 2025
 *
 * Page complète de détail pour produits digitaux
 * Inspiré de Gumroad, Stripe, Lemonsqueezy
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Download,
  FileText,
  Shield,
  Star,
  Package,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Monitor,
  Globe,
  HardDrive,
  Clock,
  Lock,
  Unlock,
  Loader2,
  Search,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DigitalDownloadButton } from '@/components/digital/DigitalDownloadButton';
import { DigitalLicenseCard } from '@/components/digital/DigitalLicenseCard';
import { DigitalFilePreview } from '@/components/digital/DigitalFilePreview';
import { ResponsiveProductImage } from '@/components/ui/ResponsiveProductImage';
import {
  DigitalProductRecommendations,
  BoughtTogetherRecommendations,
} from '@/components/digital/DigitalProductRecommendations';
import { useDigitalProduct } from '@/hooks/digital/useDigitalProducts';
import { useHasDownloadAccess } from '@/hooks/digital/useDigitalProducts';
import { sanitizeProductDescription } from '@/lib/html-sanitizer';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ProductReviewsSummary } from '@/components/reviews/ProductReviewsSummary';
import { ReviewsList } from '@/components/reviews/ReviewsList';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import type { ProductFAQ } from '@/types/product-form';
import { useEffect, useState } from 'react';
import { useAnalyticsTracking } from '@/hooks/useProductAnalytics';
import { useCreateDigitalOrder } from '@/hooks/orders/useCreateDigitalOrder';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';
import { useAddToComparison } from './DigitalProductsCompare';
import { FileVersionManager, FileMetadataEditor } from '@/components/digital/files';

interface DigitalProductDetailParams {
  productId: string;
}

interface WindowWithTracking extends Window {
  gtag?: (command: string, eventName: string, params?: Record<string, unknown>) => void;
  fbq?: (command: string, eventName: string, params?: Record<string, unknown>) => void;
  ttq?: {
    track: (eventName: string, params?: Record<string, unknown>) => void;
  };
}

/**
 * Page de détail d'un produit digital
 */
export default function DigitalProductDetail() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Fetch digital product with all relations
  const { data: digitalProduct, isLoading, error } = useDigitalProduct(productId || '');

  // Check if user has purchased this product
  const { data: hasAccess } = useHasDownloadAccess(productId || '');

  // Track analytics event
  const { trackView } = useAnalyticsTracking();

  // Hook pour créer une commande
  const { mutateAsync: createDigitalOrder, isPending: isCreatingOrder } = useCreateDigitalOrder();

  // Hook pour ajouter à la comparaison
  const addToComparison = useAddToComparison();

  // Track product view on mount
  useEffect(() => {
    if (productId) {
      trackView(productId, {
        product_type: 'digital',
        timestamp: new Date().toISOString(),
      });

      // Track with external pixels (Google Analytics, Facebook, TikTok)
      if (typeof window !== 'undefined') {
        const windowWithTracking = window as WindowWithTracking;
        // Google Analytics
        if (windowWithTracking.gtag) {
          windowWithTracking.gtag('event', 'view_item', {
            items: [
              {
                item_id: productId,
                item_name: digitalProduct?.product?.name || 'Digital Product',
                item_category: 'digital',
              },
            ],
          });
        }

        // Facebook Pixel
        if (windowWithTracking.fbq) {
          windowWithTracking.fbq('track', 'ViewContent', {
            content_type: 'product',
            content_ids: [productId],
            content_category: 'digital',
          });
        }

        // TikTok Pixel
        if (windowWithTracking.ttq) {
          windowWithTracking.ttq.track('ViewContent', {
            content_type: 'product',
            content_id: productId,
          });
        }
      }
    }
  }, [productId, trackView, digitalProduct]);

  // Handler pour l'achat
  const handlePurchase = async () => {
    if (!digitalProduct || !productId) {
      toast({
        title: 'Erreur',
        description: 'Produit non disponible',
        variant: 'destructive',
      });
      return;
    }

    if (!user?.email) {
      toast({
        title: 'Authentification requise',
        description: 'Veuillez vous connecter pour effectuer un achat',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }

    const product = digitalProduct.product;
    if (!product?.store_id) {
      toast({
        title: 'Erreur',
        description: 'Boutique non disponible',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsPurchasing(true);

      logger.debug('Initiating digital product purchase', {
        digitalProductId: digitalProduct.id,
        productId: product.id,
        storeId: product.store_id,
        userEmail: user.email,
      });

      const result = await createDigitalOrder({
        digitalProductId: digitalProduct.id,
        productId: product.id,
        storeId: product.store_id,
        customerEmail: user.email,
        customerName: user.user_metadata?.full_name || user.email.split('@')[0],
        generateLicense: digitalProduct.license_type !== 'none',
        licenseType:
          digitalProduct.license_type === 'single'
            ? 'single'
            : digitalProduct.license_type === 'multi'
              ? 'multi'
              : 'unlimited',
        maxActivations:
          digitalProduct.license_type === 'multi' ? digitalProduct.max_licenses : undefined,
      });

      if (result.checkoutUrl) {
        logger.info('Redirecting to payment checkout', {
          orderId: result.orderId,
          checkoutUrl: result.checkoutUrl,
        });
        const { safeRedirect } = await import('@/lib/url-validator');
        safeRedirect(result.checkoutUrl, error => {
          toast({
            title: 'Erreur de redirection',
            description: error,
            variant: 'destructive',
          });
        });
      } else {
        throw new Error('URL de paiement non disponible');
      }
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error initiating purchase', {
        error: errorMessage,
        digitalProductId: digitalProduct.id,
        productId: product.id,
      });
      toast({
        title: 'Erreur',
        description: errorMessage || "Impossible d'initialiser le paiement. Veuillez réessayer.",
        variant: 'destructive',
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-8">
          {/* Header skeleton */}
          <div className="animate-pulse space-y-6">
            <div className="h-10 w-32 bg-muted rounded" />
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left: Image skeleton */}
              <div className="space-y-4">
                <div className="aspect-video bg-muted rounded-lg" />
                <div className="space-y-3">
                  <div className="h-6 bg-muted rounded w-1/3" />
                  <div className="space-y-2">
                    <div className="h-16 bg-muted rounded" />
                    <div className="h-16 bg-muted rounded" />
                  </div>
                </div>
              </div>
              {/* Right: Info skeleton */}
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="h-8 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                  <div className="h-10 bg-muted rounded w-1/2" />
                </div>
                <div className="h-24 bg-muted rounded" />
                <div className="h-32 bg-muted rounded" />
              </div>
            </div>
          </div>
          {/* Tabs skeleton */}
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-muted rounded w-full" />
            <div className="space-y-3">
              <div className="h-48 bg-muted rounded" />
              <div className="h-48 bg-muted rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !digitalProduct) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p>Produit non trouvé</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const product = digitalProduct.product;
  const files = digitalProduct.files || [];

  // Parse FAQs if exists
  const faqs = product.faqs ? (Array.isArray(product.faqs) ? product.faqs : []) : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Left: Product Image */}
            <div className="space-y-4">
              <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                <ResponsiveProductImage
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full"
                  // ✅ Évite que l'image soit rognée en bas sur les pages détails
                  fit="contain"
                  fill={false}
                  context="detail"
                  fallbackIcon={<Package className="h-24 w-24 text-muted-foreground" />}
                />
              </div>

              {/* File Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Fichiers inclus ({files.length})
                  </CardTitle>
                  <CardDescription>
                    {hasAccess ? 'Téléchargez vos fichiers' : 'Aperçu des fichiers disponibles'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {files.map(file => (
                    <DigitalFilePreview key={file.id} file={file} isLocked={!hasAccess} />
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Right: Product Info & Actions */}
            <div className="space-y-6">
              {/* Title & Price */}
              <div>
                <div className="flex items-start justify-between mb-2">
                  <h1 className="text-lg sm:text-2xl md:text-3xl font-bold">{product.name}</h1>
                  <Badge variant={product.is_active ? 'default' : 'secondary'}>
                    {product.is_active ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
                <p className="text-muted-foreground">{product.short_description}</p>

                {/* Price */}
                <div className="flex items-baseline gap-3 mt-4">
                  {product.promotional_price ? (
                    <>
                      <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-primary">
                        {product.promotional_price.toLocaleString()} {product.currency}
                      </span>
                      <span className="text-base sm:text-lg md:text-xl line-through text-muted-foreground">
                        {product.price.toLocaleString()} {product.currency}
                      </span>
                      <Badge variant="destructive">
                        -
                        {Math.round(
                          ((product.price - product.promotional_price) / product.price) * 100
                        )}
                        %
                      </Badge>
                    </>
                  ) : (
                    <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold">
                      {product.price.toLocaleString()} {product.currency}
                    </span>
                  )}
                </div>
              </div>

              <Separator />

              {/* Reviews Summary (compact) */}
              <div className="py-2">
                <ProductReviewsSummary productId={productId || ''} productType="digital" compact />
              </div>

              <Separator />

              {/* Access Status & Actions */}
              <div className="space-y-4">
                {hasAccess ? (
                  <Card className="border-green-500 bg-green-50 dark:bg-green-950">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-full bg-green-500">
                          <CheckCircle2 className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-green-900 dark:text-green-100">
                            Vous possédez ce produit
                          </p>
                          <p className="text-sm text-green-700 dark:text-green-300">
                            Téléchargez vos fichiers ci-dessous
                          </p>
                        </div>
                      </div>

                      {/* Download Buttons */}
                      <div className="space-y-2">
                        {files.map(file => (
                          <DigitalDownloadButton
                            key={file.id}
                            fileId={file.id}
                            fileName={file.name}
                            fileSize={file.file_size_mb}
                            digitalProductId={digitalProduct.id}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={handlePurchase}
                    disabled={
                      isPurchasing ||
                      isCreatingOrder ||
                      !digitalProduct ||
                      !user ||
                      !product.is_active
                    }
                  >
                    {isPurchasing || isCreatingOrder ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Traitement...
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Acheter maintenant
                      </>
                    )}
                  </Button>
                )}

                {/* Actions supplémentaires */}
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => addToComparison(productId || '')}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Comparer
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/digital/search')}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Product Specs */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Spécifications</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Taille</p>
                      <p className="font-medium">
                        {digitalProduct.total_size_mb?.toFixed(2) || 0} MB
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Format</p>
                      <p className="font-medium">{digitalProduct.main_file_format || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Téléchargements</p>
                      <p className="font-medium">
                        {digitalProduct.download_limit === -1
                          ? 'Illimités'
                          : digitalProduct.download_limit}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Expiration</p>
                      <p className="font-medium">
                        {digitalProduct.download_expiry_days === -1
                          ? 'Permanent'
                          : `${digitalProduct.download_expiry_days} jours`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">License</p>
                      <p className="font-medium capitalize">{digitalProduct.license_type}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {digitalProduct.watermark_enabled ? (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Unlock className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground">Watermark</p>
                      <p className="font-medium">
                        {digitalProduct.watermark_enabled ? 'Oui' : 'Non'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* License Card (if user owns) */}
              {hasAccess && <DigitalLicenseCard productId={productId || ''} />}
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Tabs defaultValue="description" className="space-y-6">
          <TabsList className="w-full overflow-x-auto flex-nowrap justify-start">
            <TabsTrigger value="description" className="min-h-[44px] shrink-0">
              Description
            </TabsTrigger>
            <TabsTrigger value="files" className="min-h-[44px] shrink-0">
              Fichiers détails
            </TabsTrigger>
            <TabsTrigger value="reviews" className="min-h-[44px] shrink-0">
              Avis
            </TabsTrigger>
            <TabsTrigger value="faqs" className="min-h-[44px] shrink-0">
              FAQs
            </TabsTrigger>
          </TabsList>

          {/* Description Tab */}
          <TabsContent value="description" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>À propos de ce produit</CardTitle>
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
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files" className="space-y-6">
            {/* Gestion avancée des fichiers - Onglet dans l'onglet Files */}
            <Tabs defaultValue="list" className="w-full">
              <TabsList className="w-full overflow-x-auto flex-nowrap justify-start">
                <TabsTrigger value="list" className="min-h-[44px] shrink-0">
                  Liste des fichiers
                </TabsTrigger>
                <TabsTrigger value="versions" className="min-h-[44px] shrink-0">
                  Versions
                </TabsTrigger>
                <TabsTrigger value="metadata" className="min-h-[44px] shrink-0">
                  Métadonnées
                </TabsTrigger>
              </TabsList>

              <TabsContent value="list" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Détails des fichiers</CardTitle>
                    <CardDescription>
                      Liste complète des fichiers inclus avec ce produit
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {files.map((file, index) => (
                        <div key={file.id} className="flex items-start gap-4 p-4 rounded-lg border">
                          <div className="p-3 rounded-lg bg-primary/10">
                            <FileText className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-semibold">{file.name}</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Version {file.version || '1.0'}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                {file.is_main && <Badge variant="default">Principal</Badge>}
                                {file.is_preview && <Badge variant="secondary">Aperçu</Badge>}
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Type</p>
                                <p className="font-medium">{file.file_type}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Taille</p>
                                <p className="font-medium">{file.file_size_mb.toFixed(2)} MB</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Téléchargements</p>
                                <p className="font-medium">{file.download_count || 0}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="versions" className="space-y-4">
                {files.length > 0 && files[0]?.id && (
                  <FileVersionManager fileId={files[0].id} digitalProductId={productId || ''} />
                )}
              </TabsContent>

              <TabsContent value="metadata" className="space-y-4">
                {files.length > 0 && files[0]?.id && (
                  <FileMetadataEditor fileId={files[0].id} fileType={files[0].file_type} />
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-6">
            {/* Reviews Summary */}
            <ProductReviewsSummary productId={productId || ''} productType="digital" />

            {/* Write Review (if user owns) */}
            {hasAccess && (
              <Card>
                <CardHeader>
                  <CardTitle>Laisser un avis</CardTitle>
                  <CardDescription>Partagez votre expérience avec ce produit</CardDescription>
                </CardHeader>
                <CardContent>
                  <ReviewForm productId={productId || ''} productType="digital" />
                </CardContent>
              </Card>
            )}

            {/* Reviews List */}
            <Card>
              <CardHeader>
                <CardTitle>Avis des utilisateurs</CardTitle>
              </CardHeader>
              <CardContent>
                <ReviewsList productId={productId || ''} productType="digital" />
              </CardContent>
            </Card>
          </TabsContent>

          {/* FAQs Tab */}
          <TabsContent value="faqs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Questions fréquentes</CardTitle>
                <CardDescription>Trouvez rapidement des réponses à vos questions</CardDescription>
              </CardHeader>
              <CardContent>
                {faqs.length > 0 ? (
                  <Accordion type="single" collapsible className="w-full">
                    {faqs.map((faq: ProductFAQ, index: number) => (
                      <AccordionItem key={index} value={`faq-${index}`}>
                        <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Aucune FAQ disponible pour ce produit
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Recommendations */}
        <div className="mt-12 space-y-8">
          <DigitalProductRecommendations
            productId={productId || ''}
            category={product.category}
            tags={product.tags}
            limit={6}
            variant="grid"
            title="Produits similaires"
          />

          <BoughtTogetherRecommendations productId={productId || ''} limit={4} />
        </div>
      </div>
    </div>
  );
}






