/**
 * Digital Product Detail Page - Professional
 * Date: 28 octobre 2025
 *
 * Page complète de détail pour produits digitaux
 * Inspiré de Gumroad, Stripe, Lemonsqueezy
 */

import { useParams, useNavigate } from 'react-router-dom';
import { SEOMeta } from '@/components/seo/SEOMeta';
import { FAQSchema } from '@/components/seo/FAQSchema';
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
import { SafeHTML } from '@/components/security/SafeHTML';
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
import { useAuth } from '@/contexts/AuthContext';
import { useMarketplaceGuestBuy } from '@/hooks/marketplace/useMarketplaceGuestBuy';
import { MarketplaceGuestBuyDialogs } from '@/components/marketplace/MarketplaceGuestBuyDialogs';
import { persistCheckoutCoupon } from '@/lib/checkout/persist-checkout-coupon';
import { useAddToComparison } from './DigitalProductsCompare';
import { FileVersionManager, FileMetadataEditor } from '@/components/digital/files';
import CouponInput from '@/components/checkout/CouponInput';
import { PhysicalProductWhatsAppButton } from '@/components/physical/PhysicalProductWhatsAppButton';
import { generatePaymentUrl } from '@/lib/store-utils';
import {
  formatDigitalFileFormat,
  formatDigitalFileSizeMb,
  getDigitalCategoryLabel,
  resolveDigitalDisplayPrice,
} from '@/lib/digital/digital-product-display';
import { htmlToPlainText } from '@/lib/html-sanitizer';

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
  const [appliedCouponId, setAppliedCouponId] = useState<string | null>(null);
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
  const [appliedDiscountAmount, setAppliedDiscountAmount] = useState<number | null>(null);

  // Fetch digital product with all relations
  const { data: digitalProduct, isLoading, error } = useDigitalProduct(productId || '');

  const marketplaceBuy = useMarketplaceGuestBuy({
    product: {
      id: digitalProduct?.product?.id || productId || '',
      slug: digitalProduct?.product?.slug || productId || '',
      name: digitalProduct?.product?.name || 'Produit digital',
      store_id: digitalProduct?.product?.store_id,
      product_type: 'digital',
      currency: digitalProduct?.product?.currency,
    },
    price: digitalProduct?.product?.promotional_price ?? digitalProduct?.product?.price ?? 0,
    storeSlug: digitalProduct?.store?.slug,
  });

  // Check if user has purchased this product
  const { data: accessData } = useHasDownloadAccess(productId || '');
  const hasAccess = accessData?.hasAccess ?? false;

  // Track analytics event
  const { trackView } = useAnalyticsTracking();

  // Hook pour créer une commande — checkout canonique (invité ou connecté)
  const isBuying = marketplaceBuy.loading;

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
    if (!digitalProduct?.product || !productId) {
      toast({
        title: 'Erreur',
        description: 'Produit non disponible',
        variant: 'destructive',
      });
      return;
    }

    if (!digitalProduct.product.is_active) {
      toast({
        title: 'Produit indisponible',
        description: "Ce produit n'est pas disponible à l'achat",
        variant: 'destructive',
      });
      return;
    }

    if (appliedCouponId && appliedCouponCode && appliedDiscountAmount != null) {
      persistCheckoutCoupon({
        id: appliedCouponId,
        code: appliedCouponCode,
        discountAmount: appliedDiscountAmount,
      });
    } else {
      persistCheckoutCoupon(null);
    }

    await marketplaceBuy.handleBuyClick();
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
  const isFreeProduct =
    product.pricing_model === 'free' || (product.price === 0 && !product.promotional_price);
  const categoryLabel = getDigitalCategoryLabel(product.category);
  const shortDescription = htmlToPlainText(product.short_description || '');
  const displaySizeMb =
    digitalProduct.total_size_mb && digitalProduct.total_size_mb > 0
      ? digitalProduct.total_size_mb
      : digitalProduct.main_file_size_mb;
  const displayFormat = digitalProduct.main_file_format;
  const { displayPrice, compareAtPrice, hasPromo } = resolveDigitalDisplayPrice(
    product.price,
    product.promotional_price
  );
  const faqs = product.faqs ? (Array.isArray(product.faqs) ? product.faqs : []) : [];

  return (
    <div className="min-h-screen bg-background">
      <SEOMeta
        title={product.meta_title || product.name}
        description={
          product.meta_description ||
          (product.short_description || product.description || '').slice(0, 160)
        }
        url={`https://www.emarzona.com/digital/${productId}`}
        image={product.og_image || product.image_url}
        type="product"
        price={isFreeProduct ? 0 : (product.promotional_price ?? product.price)}
        currency={product.currency}
      />
      {faqs.length > 0 && <FAQSchema faqs={faqs} />}
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

              {/* File Preview — masqué si aucun fichier */}
              {files.length > 0 && (
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
              )}
            </div>

            {/* Right: Product Info & Actions */}
            <div className="space-y-6">
              {/* Title & Price */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h1 className="text-lg sm:text-2xl md:text-3xl font-bold">{product.name}</h1>
                  {categoryLabel && (
                    <Badge variant="secondary" className="shrink-0">
                      {categoryLabel}
                    </Badge>
                  )}
                </div>
                {shortDescription && <p className="text-muted-foreground">{shortDescription}</p>}

                {/* Price */}
                <div className="flex items-baseline gap-3 mt-4">
                  {isFreeProduct ? (
                    <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-primary">
                      Gratuit
                    </span>
                  ) : hasPromo ? (
                    <>
                      <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-primary">
                        {displayPrice.toLocaleString()} {product.currency}
                      </span>
                      <span className="text-base sm:text-lg md:text-xl line-through text-muted-foreground">
                        {compareAtPrice?.toLocaleString()} {product.currency}
                      </span>
                      <Badge variant="destructive">
                        -{Math.round(((product.price - displayPrice) / product.price) * 100)}%
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
                  <>
                    {product?.store_id && (
                      <CouponInput
                        storeId={product.store_id}
                        productId={product.id}
                        customerId={user?.id}
                        orderAmount={Number(product.promotional_price ?? product.price ?? 0)}
                        onApply={(promotionId, discountAmount, code) => {
                          setAppliedCouponId(promotionId);
                          setAppliedDiscountAmount(discountAmount);
                          setAppliedCouponCode(code);
                        }}
                        onRemove={() => {
                          setAppliedCouponId(null);
                          setAppliedDiscountAmount(null);
                          setAppliedCouponCode(null);
                        }}
                        appliedCouponId={appliedCouponId}
                        appliedCouponCode={appliedCouponCode}
                        appliedDiscountAmount={appliedDiscountAmount}
                      />
                    )}
                    <Button
                      size="lg"
                      className="w-full sm:w-auto sm:max-w-[min(100%,16rem)] sm:self-start px-6 sm:px-8 rounded-full font-semibold shadow-md hover:shadow-lg"
                      onClick={handlePurchase}
                      disabled={isBuying || !digitalProduct || !product.is_active}
                    >
                      {isBuying ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Traitement...
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4 mr-2" />
                          {isFreeProduct ? 'Obtenir gratuitement' : 'Acheter maintenant'}
                        </>
                      )}
                    </Button>
                    <PhysicalProductWhatsAppButton
                      productName={product.name}
                      whatsappNumber={product.whatsapp_number}
                      whatsappEnabled={product.whatsapp_enabled}
                      paymentUrl={
                        digitalProduct.store?.slug && product.slug
                          ? generatePaymentUrl(digitalProduct.store.slug, product.slug)
                          : undefined
                      }
                      className="w-full sm:w-auto"
                      label="Contacter sur WhatsApp"
                    />
                  </>
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
                      <p className="font-medium">{formatDigitalFileSizeMb(displaySizeMb)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Format</p>
                      <p className="font-medium">{formatDigitalFileFormat(displayFormat)}</p>
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

                  {product.licensing_type && (
                    <div className="flex items-center gap-2 col-span-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Droits d&apos;utilisation</p>
                        <p className="font-medium capitalize">
                          {product.licensing_type === 'plr'
                            ? 'PLR (Private Label Rights)'
                            : product.licensing_type === 'copyrighted'
                              ? "Protégé par droits d'auteur"
                              : product.licensing_type}
                        </p>
                      </div>
                    </div>
                  )}

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

              {product.license_terms && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Conditions de licence</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SafeHTML
                      html={product.license_terms}
                      className="prose max-w-none text-sm text-muted-foreground"
                    />
                  </CardContent>
                </Card>
              )}

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
                <SafeHTML
                  html={product.description || ''}
                  className="bg-white dark:bg-white text-black dark:text-black prose max-w-none prose-headings:text-black dark:prose-headings:text-black prose-p:text-black dark:prose-p:text-black prose-a:text-primary prose-strong:text-black dark:prose-strong:text-black p-4 sm:p-6 rounded-lg"
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
                  <FileVersionManager fileId={files[0].id} digitalProductId={digitalProduct.id} />
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

          {digitalProduct?.product?.store_id && (
            <BoughtTogetherRecommendations
              productId={productId || ''}
              storeId={digitalProduct.product.store_id}
              limit={4}
            />
          )}
        </div>
      </div>

      <MarketplaceGuestBuyDialogs
        product={marketplaceBuy.product}
        price={displayPrice}
        guestOpen={marketplaceBuy.guestOpen}
        setGuestOpen={marketplaceBuy.setGuestOpen}
        physicalOpen={marketplaceBuy.physicalOpen}
        setPhysicalOpen={marketplaceBuy.setPhysicalOpen}
        loading={marketplaceBuy.loading}
        onGuestConfirm={marketplaceBuy.proceedWithCustomer}
      />
    </div>
  );
}
