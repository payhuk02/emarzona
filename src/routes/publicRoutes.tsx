import React, { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';

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
const Storefront = lazy(() => import('@/pages/Storefront'));
const StoreLegalPage = lazy(() => import('@/pages/StoreLegalPage'));
const ProductDetail = lazy(() => import('@/pages/ProductDetail'));
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

// Composant de redirection pour l'ancienne route
const OldProductRouteRedirect = () => {
  const { slug, productSlug } = useParams<{ slug: string; productSlug: string }>();
  return <Navigate to={`/stores/${slug}/products/${productSlug}`} replace />;
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

    {/* Storefront */}
    <Route path="/store/:slug/product/:productSlug" element={<OldProductRouteRedirect />} />
    <Route path="/stores/:slug" element={<Storefront />} />
    <Route path="/stores/:slug/products/:productSlug" element={<ProductDetail />} />
    <Route path="/stores/:slug/legal/:page" element={<StoreLegalPage />} />

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
    <Route path="/stores/:storeSlug/collections" element={<CollectionsPage />} />
    <Route path="/stores/:storeSlug/collections/:collectionSlug" element={<CollectionDetail />} />
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
