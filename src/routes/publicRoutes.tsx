import React, { useEffect } from 'react';
import { lazyPage } from '@/routes/lazyPage';
import { Route, Navigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { generateStoreUrl, generateProductUrl } from '@/lib/store-utils';

// Pages publiques
const Landing = lazyPage(() => import('@/pages/Landing'));
const Auth = lazyPage(() => import('@/pages/Auth'));
const StoreSsoLoginPage = lazyPage(() => import('@/pages/auth/StoreSsoLoginPage'));
const Marketplace = lazyPage(() =>
  import('@/pages/Marketplace')
    .then(m => ({ default: m.default }))
    .catch(error => ({
      default: () => (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
          <div className="text-center space-y-4 max-w-md">
            <h2 className="text-xl font-semibold">Erreur de chargement</h2>
            <p className="text-muted-foreground">Impossible de charger la page Marketplace</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-white rounded"
            >
              Recharger
            </button>
          </div>
        </div>
      ),
    }))
);
const Recommendations = lazyPage(() => import('@/pages/Recommendations'));
const HistoryBasedRecommendations = lazyPage(() => import('@/pages/HistoryBasedRecommendations'));
const Discover = lazyPage(() => import('@/pages/Discover'));
const Trending = lazyPage(() => import('@/pages/Trending'));
const CommunityPage = lazyPage(() => import('@/pages/community/CommunityPage'));
const Cart = lazyPage(() => import('@/pages/Cart'));
const CartEnhanced = lazyPage(() => import('@/pages/CartEnhanced'));
const Checkout = lazyPage(() => import('@/pages/checkout/CheckoutPage'));
const CheckoutLegacyRedirect = lazyPage(() =>
  import('@/pages/checkout/CheckoutLegacyRedirect').then(m => ({
    default: () => <m.CheckoutLegacyRedirect legacyPath="/checkout/cart" />,
  }))
);
const CartCheckoutLegacyRedirect = lazyPage(() =>
  import('@/pages/checkout/CheckoutLegacyRedirect').then(m => ({
    default: () => <m.CheckoutLegacyRedirect legacyPath="/cart/checkout" />,
  }))
);
const NotFound = lazyPage(() => import('@/pages/NotFound'));
const StatusPage = lazyPage(() => import('@/pages/StatusPage'));
const CourseDetail = lazyPage(() => import('@/pages/courses/CourseDetail'));
const CoursesCatalog = lazyPage(() => import('@/pages/courses/CoursesCatalog'));
const DigitalProductDetail = lazyPage(() => import('@/pages/digital/DigitalProductDetail'));
const DigitalProductsSearch = lazyPage(() =>
  import('@/pages/digital/DigitalProductsSearch').then(
    (m: { DigitalProductsSearch: React.ComponentType<Record<string, unknown>> }) => ({
      default: m.DigitalProductsSearch,
    })
  )
);
const DigitalProductsCompare = lazyPage(() =>
  import('@/pages/digital/DigitalProductsCompare').then(
    (m: { DigitalProductsCompare: React.ComponentType<Record<string, unknown>> }) => ({
      default: m.DigitalProductsCompare,
    })
  )
);
const SharedWishlist = lazyPage(() => import('@/pages/customer/SharedWishlist'));
const BundleDetail = lazyPage(() => import('@/pages/digital/BundleDetail'));
const SecureDownloadPage = lazyPage(() => import('@/pages/digital/SecureDownloadPage'));
const ProductsCompare = lazyPage(() => import('@/pages/ProductsCompare'));
const PhysicalProductDetail = lazyPage(() => import('@/pages/physical/PhysicalProductDetail'));
const ServiceDetail = lazyPage(() => import('@/pages/service/ServiceDetail'));
const ArtistProductDetail = lazyPage(() => import('@/pages/artist/ArtistProductDetail'));
const ArtistPortfolioPage = lazyPage(() => import('@/pages/artist/ArtistPortfolioPage'));
const CollectionsPage = lazyPage(() =>
  import('@/pages/artist/CollectionsPage').then(m => ({ default: m.default }))
);
const CollectionDetail = lazyPage(() =>
  import('@/components/artist/CollectionDetail').then(m => ({ default: m.CollectionDetail }))
);
const AuctionsListPage = lazyPage(() => import('@/pages/artist/AuctionsListPage'));
const AuctionDetailPage = lazyPage(() => import('@/pages/artist/AuctionDetailPage'));
const VerifyCertificatePage = lazyPage(() => import('@/pages/artist/VerifyCertificatePage'));
const StyleQuizPage = lazyPage(() =>
  import('@/pages/personalization/StyleQuizPage').then(m => ({ default: m.default }))
);
const PersonalizedRecommendationsPage = lazyPage(() =>
  import('@/pages/personalization/PersonalizedRecommendationsPage').then(m => ({
    default: m.default,
  }))
);

// Pages marketing plateforme (pied de page)
const PlatformMarketingPage = lazyPage(() => import('@/pages/platform/PlatformMarketingPage'));
const PlatformFaqPage = lazyPage(() => import('@/pages/platform/PlatformFaqPage'));

// Pages Légales
const TermsOfService = lazyPage(() => import('@/pages/legal/TermsOfService'));
const TermsOfSale = lazyPage(() => import('@/pages/legal/TermsOfSale'));
const PrivacyPolicy = lazyPage(() => import('@/pages/legal/PrivacyPolicy'));
const CookiePolicy = lazyPage(() => import('@/pages/legal/CookiePolicy'));
const RefundPolicy = lazyPage(() => import('@/pages/legal/RefundPolicy'));
const DataProcessingAgreement = lazyPage(() => import('@/pages/legal/DataProcessingAgreement'));

// Pages Moneroo
const PaymentSuccess = lazyPage(() => import('@/pages/payments/PaymentSuccess'));
const PaymentCancel = lazyPage(() => import('@/pages/payments/PaymentCancel'));
const GuestOrderConfirmation = lazyPage(() => import('@/pages/orders/GuestOrderConfirmation'));

// Pages Email publiques
const UnsubscribePage = lazyPage(() => import('@/pages/UnsubscribePage'));

// Affiliation publique
const ShortLinkRedirect = lazyPage(() =>
  import('@/pages/affiliate/ShortLinkRedirect').then(m => ({ default: m.ShortLinkRedirect }))
);

// Page test i18n
const I18nTest = lazyPage(() => import('@/pages/I18nTest'));

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
    <Route path="/login" element={<Auth />} />
    <Route path="/register" element={<Auth />} />
    <Route path="/connexion" element={<Navigate to="/login" replace />} />
    <Route path="/inscription" element={<Navigate to="/register" replace />} />
    <Route path="/signup" element={<Navigate to="/register" replace />} />
    <Route path="/auth" element={<Navigate to="/login" replace />} />
    <Route path="/auth/login" element={<Navigate to="/login" replace />} />
    <Route path="/auth/signup" element={<Navigate to="/register" replace />} />
    <Route path="/auth/sso/:storeSlug" element={<StoreSsoLoginPage />} />
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
    <Route path="/checkout/cart" element={<CheckoutLegacyRedirect />} />
    <Route path="/cart/checkout" element={<CartCheckoutLegacyRedirect />} />

    {/* Storefront — Redirection vers sous-domaine myemarzona.shop */}
    <Route path="/store/:slug/product/:productSlug" element={<OldProductRouteRedirect />} />
    <Route path="/stores/:slug" element={<StoreRedirectToSubdomain />} />
    <Route
      path="/stores/:slug/products/:productSlug"
      element={<StoreProductRedirectToSubdomain />}
    />
    <Route path="/stores/:slug/legal/:page" element={<StoreLegalRedirectToSubdomain />} />

    {/* Pages marketing (footer — contenu admin) */}
    <Route path="/about" element={<PlatformMarketingPage />} />
    <Route path="/contact" element={<PlatformMarketingPage />} />
    <Route path="/careers" element={<PlatformMarketingPage />} />
    <Route path="/press" element={<PlatformMarketingPage />} />
    <Route path="/blog" element={<PlatformMarketingPage />} />
    <Route path="/docs" element={<PlatformMarketingPage />} />
    <Route path="/help" element={<PlatformMarketingPage />} />
    <Route path="/faq" element={<PlatformFaqPage />} />
    <Route path="/faqs" element={<Navigate to="/faq" replace />} />
    <Route path="/integrations" element={<PlatformMarketingPage />} />

    {/* Légal */}
    <Route path="/legal/terms" element={<TermsOfService />} />
    <Route path="/legal/cgv" element={<TermsOfSale />} />
    <Route path="/legal/privacy" element={<PrivacyPolicy />} />
    <Route path="/legal/cookies" element={<CookiePolicy />} />
    <Route path="/legal/refund" element={<RefundPolicy />} />
    <Route path="/legal/dpa" element={<DataProcessingAgreement />} />

    {/* Email */}
    <Route path="/unsubscribe" element={<UnsubscribePage />} />

    {/* Moneroo */}
    <Route path="/payment/success" element={<PaymentSuccess />} />
    <Route path="/payment/cancel" element={<PaymentCancel />} />
    <Route path="/orders/confirmed" element={<GuestOrderConfirmation />} />

    {/* Produits publics */}
    <Route path="/digital/search" element={<DigitalProductsSearch />} />
    <Route path="/digital/compare" element={<DigitalProductsCompare />} />
    <Route path="/products/compare" element={<ProductsCompare />} />
    <Route path="/download/:token" element={<SecureDownloadPage />} />
    <Route path="/digital/:productId" element={<DigitalProductDetail />} />
    <Route path="/wishlist/shared/:token" element={<SharedWishlist />} />
    <Route path="/bundles/:bundleId" element={<BundleDetail />} />
    <Route path="/physical/:productId" element={<PhysicalProductDetail />} />
    <Route path="/service/:serviceId" element={<ServiceDetail />} />
    <Route path="/artist/:productId" element={<ArtistProductDetail />} />
    <Route path="/portfolio/:slug" element={<ArtistPortfolioPage />} />
    <Route path="/courses" element={<CoursesCatalog />} />
    <Route path="/courses/:slug" element={<CourseDetail />} />
    <Route path="/learn/:slug" element={<CourseDetail learnMode />} />

    {/* Collections & Enchères */}
    <Route path="/collections" element={<CollectionsPage />} />
    <Route path="/collections/:collectionSlug" element={<CollectionDetail />} />
    {/* Collections sous stores — redirection vers sous-domaine */}
    {/* TODO: Ajouter redirection collections vers sous-domaine quand les routes subdomain les supporteront */}
    <Route path="/auctions" element={<AuctionsListPage />} />
    <Route path="/auctions/:slug" element={<AuctionDetailPage />} />
    <Route path="/verify/:code" element={<VerifyCertificatePage />} />

    {/* Affiliation */}
    <Route path="/aff/:code" element={<ShortLinkRedirect />} />

    {/* Epic 5.3 — Status plateforme */}
    <Route path="/status" element={<StatusPage />} />

    {/* Test i18n (dev only) */}
    {import.meta.env.DEV && <Route path="/i18n-test" element={<I18nTest />} />}

    {/* Fallback */}
    <Route path="*" element={<NotFound />} />
  </>
);
