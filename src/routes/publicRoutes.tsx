import React, { lazy, useEffect } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { generateStoreUrl, generateProductUrl } from '@/lib/store-utils';

// Pages publiques
const Landing = lazy(() => import('@/pages/Landing'));
const Auth = lazy(() => import('@/pages/Auth'));
const Marketplace = lazy(() =>
  import('@/pages/Marketplace')
    .then(m => ({ default: m.default }))
    .catch(error => ({
      default: () => (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
          <div className="text-center space-y-4 max-w-md">
            <h2 className="text-xl font-semibold">Erreur de chargement</h2>
            <p className="text-muted-foreground">Impossible de charger la page Marketplace</p>
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-primary text-white rounded">Recharger</button>
          </div>
        </div>
      ),
    }))
);
const Recommendations = lazy(() => import('@/pages/Recommendations'));
const HistoryBasedRecommendations = lazy(() => import('@/pages/HistoryBasedRecommendations'));
const Discover = lazy(() => import('@/pages/Discover'));
const Trending = lazy(() => import('@/pages/Trending'));
const CommunityPage = lazy(() => import('@/pages/community/CommunityPage'));
const Cart = lazy(() => import('@/pages/Cart'));
const CartEnhanced = lazy(() => import('@/pages/CartEnhanced'));
const Checkout = lazy(() => import('@/pages/checkout/Checkout'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const CourseDetail = lazy(() => import('@/pages/courses/CourseDetail'));
const DigitalProductDetail = lazy(() => import('@/pages/digital/DigitalProductDetail'));
const DigitalProductsSearch = lazy(() =>
  import('@/pages/digital/DigitalProductsSearch').then(
    (m: { DigitalProductsSearch: React.ComponentType<Record<string, unknown>> }) => ({
      default: m.DigitalProductsSearch,
    })
  )
);
const DigitalProductsCompare = lazy(() =>
  import('@/pages/digital/DigitalProductsCompare').then(
    (m: { DigitalProductsCompare: React.ComponentType<Record<string, unknown>> }) => ({
      default: m.DigitalProductsCompare,
    })
  )
);
const SharedWishlist = lazy(() => import('@/pages/customer/SharedWishlist'));
const BundleDetail = lazy(() => import('@/pages/digital/BundleDetail'));
const ProductsCompare = lazy(() => import('@/pages/ProductsCompare'));
const PhysicalProductDetail = lazy(() => import('@/pages/physical/PhysicalProductDetail'));
const ServiceDetail = lazy(() => import('@/pages/service/ServiceDetail'));
const ArtistProductDetail = lazy(() => import('@/pages/artist/ArtistProductDetail'));
const ArtistPortfolioPage = lazy(() => import('@/pages/artist/ArtistPortfolioPage'));
const CollectionsPage = lazy(() =>
  import('@/pages/artist/CollectionsPage').then(m => ({ default: m.default }))
);
const CollectionDetail = lazy(() =>
  import('@/components/artist/CollectionDetail').then(m => ({ default: m.CollectionDetail }))
);
const AuctionsListPage = lazy(() => import('@/pages/artist/AuctionsListPage'));
const AuctionDetailPage = lazy(() => import('@/pages/artist/AuctionDetailPage'));
const StyleQuizPage = lazy(() =>
  import('@/pages/personalization/StyleQuizPage').then(m => ({ default: m.default }))
);
const PersonalizedRecommendationsPage = lazy(() =>
  import('@/pages/personalization/PersonalizedRecommendationsPage').then(m => ({ default: m.default }))
);

// Pages Légales
const TermsOfService = lazy(() => import('@/pages/legal/TermsOfService'));
const PrivacyPolicy = lazy(() => import('@/pages/legal/PrivacyPolicy'));
const CookiePolicy = lazy(() => import('@/pages/legal/CookiePolicy'));
const RefundPolicy = lazy(() => import('@/pages/legal/RefundPolicy'));

// Pages Moneroo
const PaymentSuccess = lazy(() => import('@/pages/payments/PaymentSuccess'));
const PaymentCancel = lazy(() => import('@/pages/payments/PaymentCancel'));

// Pages Email publiques
const UnsubscribePage = lazy(() => import('@/pages/UnsubscribePage'));

// Affiliation publique
const ShortLinkRedirect = lazy(() =>
  import('@/pages/affiliate/ShortLinkRedirect').then(m => ({ default: m.ShortLinkRedirect }))
);

// Page test i18n
const I18nTest = lazy(() => import('@/pages/I18nTest'));

// Redirection /stores/:slug → sous-domaine myemarzona.shop
const StoreRedirectToSubdomain = () => {
  const { slug } = useParams<{ slug: string }>();
  useEffect(() => {
    if (slug) {
      window.location.href = generateStoreUrl(slug);
    }
  }, [slug]);
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="text-muted-foreground">Redirection vers la boutique...</p>
      </div>
    </div>
  );
};

// Redirection /stores/:slug/products/:productSlug → sous-domaine
const StoreProductRedirectToSubdomain = () => {
  const { slug, productSlug } = useParams<{ slug: string; productSlug: string }>();
  useEffect(() => {
    if (slug && productSlug) {
      window.location.href = generateProductUrl(slug, productSlug);
    }
  }, [slug, productSlug]);
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="text-muted-foreground">Redirection vers le produit...</p>
      </div>
    </div>
  );
};

// Redirection /stores/:slug/legal/:page → sous-domaine
const StoreLegalRedirectToSubdomain = () => {
  const { slug, page } = useParams<{ slug: string; page: string }>();
  useEffect(() => {
    if (slug && page) {
      const storeUrl = generateStoreUrl(slug);
      window.location.href = `${storeUrl}/legal/${page}`;
    }
  }, [slug, page]);
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="text-muted-foreground">Redirection...</p>
      </div>
    </div>
  );
};

// Ancienne route /store/:slug/product/:productSlug → sous-domaine
const OldProductRouteRedirect = () => {
  const { slug, productSlug } = useParams<{ slug: string; productSlug: string }>();
  useEffect(() => {
    if (slug && productSlug) {
      window.location.href = generateProductUrl(slug, productSlug);
    }
  }, [slug, productSlug]);
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="text-muted-foreground">Redirection...</p>
      </div>
    </div>
  );
};

export const publicRoutes = (
  <>
    <Route path="/" element={<Landing />} />
    <Route path="/auth" element={<Auth />} />
    <Route path="/login" element={<Navigate to="/auth" replace />} />
    <Route path="/auth/login" element={<Navigate to="/auth" replace />} />
    <Route path="/marketplace" element={<Marketplace />} />
    <Route path="/recommendations" element={<Recommendations />} />
    <Route path="/recommendations/history-based" element={<HistoryBasedRecommendations />} />
    <Route path="/discover" element={<Discover />} />
    <Route path="/trending" element={<Trending />} />
    <Route path="/personalization/quiz" element={<StyleQuizPage />} />
    <Route path="/personalization/recommendations" element={<PersonalizedRecommendationsPage />} />
    <Route path="/community" element={<CommunityPage />} />
    <Route path="/cart" element={<CartEnhanced />} />
    <Route path="/cart-old" element={<Cart />} />
    <Route path="/checkout" element={<Checkout />} />

    {/* Storefront — Redirection vers sous-domaine myemarzona.shop */}
    <Route path="/store/:slug/product/:productSlug" element={<OldProductRouteRedirect />} />
    <Route path="/stores/:slug" element={<StoreRedirectToSubdomain />} />
    <Route path="/stores/:slug/products/:productSlug" element={<StoreProductRedirectToSubdomain />} />
    <Route path="/stores/:slug/legal/:page" element={<StoreLegalRedirectToSubdomain />} />

    {/* Légal */}
    <Route path="/legal/terms" element={<TermsOfService />} />
    <Route path="/legal/privacy" element={<PrivacyPolicy />} />
    <Route path="/legal/cookies" element={<CookiePolicy />} />
    <Route path="/legal/refund" element={<RefundPolicy />} />

    {/* Email */}
    <Route path="/unsubscribe" element={<UnsubscribePage />} />

    {/* Moneroo */}
    <Route path="/payment/success" element={<PaymentSuccess />} />
    <Route path="/payment/cancel" element={<PaymentCancel />} />

    {/* Produits publics */}
    <Route path="/digital/search" element={<DigitalProductsSearch />} />
    <Route path="/digital/compare" element={<DigitalProductsCompare />} />
    <Route path="/products/compare" element={<ProductsCompare />} />
    <Route path="/digital/:productId" element={<DigitalProductDetail />} />
    <Route path="/wishlist/shared/:token" element={<SharedWishlist />} />
    <Route path="/bundles/:bundleId" element={<BundleDetail />} />
    <Route path="/physical/:productId" element={<PhysicalProductDetail />} />
    <Route path="/service/:serviceId" element={<ServiceDetail />} />
    <Route path="/artist/:productId" element={<ArtistProductDetail />} />
    <Route path="/portfolio/:slug" element={<ArtistPortfolioPage />} />
    <Route path="/courses/:slug" element={<CourseDetail />} />

    {/* Collections & Enchères */}
    <Route path="/collections" element={<CollectionsPage />} />
    <Route path="/collections/:collectionSlug" element={<CollectionDetail />} />
    {/* Collections sous stores — redirection vers sous-domaine */}
    {/* TODO: Ajouter redirection collections vers sous-domaine quand les routes subdomain les supporteront */}
    <Route path="/auctions" element={<AuctionsListPage />} />
    <Route path="/auctions/:slug" element={<AuctionDetailPage />} />

    {/* Affiliation */}
    <Route path="/aff/:code" element={<ShortLinkRedirect />} />

    {/* Test i18n (dev only) */}
    {import.meta.env.DEV && <Route path="/i18n-test" element={<I18nTest />} />}

    {/* Fallback */}
    <Route path="*" element={<NotFound />} />
  </>
);
