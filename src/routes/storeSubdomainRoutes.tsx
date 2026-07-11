/**
 * Routes spécifiques pour les sous-domaines de boutiques (*.myemarzona.shop)
 *
 * Quand l'app est accédée via un sous-domaine de boutique,
 * ces routes remplacent les routes de la plateforme.
 * Le slug n'apparaît PAS dans l'URL (il est fourni via StoreSlugContext).
 */

import React, { Suspense } from 'react';
import { lazyPage } from '@/routes/lazyPage';
import { Routes, Route, useLocation } from 'react-router-dom';
import { StoreSlugProvider } from '@/contexts/StoreSlugContext';
import { StoreSubdomainNav } from '@/components/storefront/StoreSubdomainNav';
import { RedirectToPlatformAuth } from '@/components/auth/RedirectToPlatformAuth';
import { RedirectToPlatformVendorMessaging } from '@/components/auth/RedirectToPlatformVendorMessaging';
import type { StoreCommerceType } from '@/constants/store-commerce-types';

const Storefront = lazyPage(() => import('@/pages/Storefront'));
const ProductDetail = lazyPage(() => import('@/pages/ProductDetail'));
const StoreLegalPage = lazyPage(() => import('@/pages/StoreLegalPage'));
const Cart = lazyPage(() => import('@/pages/CartEnhanced'));
const Checkout = lazyPage(() => import('@/pages/checkout/CheckoutPage'));
const NotFound = lazyPage(() => import('@/pages/NotFound'));
const PaymentSuccess = lazyPage(() => import('@/pages/payments/PaymentSuccess'));
const PaymentCancel = lazyPage(() => import('@/pages/payments/PaymentCancel'));
const CollectionsPage = lazyPage(() =>
  import('@/pages/artist/CollectionsPage').then(m => ({ default: m.default }))
);
const CollectionDetail = lazyPage(() =>
  import('@/components/artist/CollectionDetail').then(m => ({ default: m.CollectionDetail }))
);
const AuctionsListPage = lazyPage(() => import('@/pages/artist/AuctionsListPage'));
const AuctionDetailPage = lazyPage(() => import('@/pages/artist/AuctionDetailPage'));
const ArtistPortfolioPage = lazyPage(() => import('@/pages/artist/ArtistPortfolioPage'));

interface StoreSubdomainRoutesProps {
  storeSlug: string;
  storeName?: string;
  logoUrl?: string | null;
  storeThemeColors?: {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    backgroundColor?: string;
    textColor?: string;
  };
  commerceType?: StoreCommerceType | null;
}

const LoadingFallback = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="flex flex-col items-center space-y-4">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      <p className="text-muted-foreground">Chargement...</p>
    </div>
  </div>
);

export function StoreSubdomainRoutes({
  storeSlug,
  storeName,
  logoUrl,
  storeThemeColors,
  commerceType,
}: StoreSubdomainRoutesProps) {
  const location = useLocation();
  const isProductDetail = location.pathname.startsWith('/products/');

  return (
    <StoreSlugProvider slug={storeSlug}>
      {!isProductDetail && (
        <StoreSubdomainNav
          storeName={storeName}
          logoUrl={logoUrl || undefined}
          themeColors={storeThemeColors}
          commerceType={commerceType}
        />
      )}
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Root = Storefront de la boutique */}
          <Route path="/" element={<Storefront />} />

          {/* Produits */}
          <Route path="/products/:productSlug" element={<ProductDetail />} />

          {/* Pages légales */}
          <Route path="/legal/:page" element={<StoreLegalPage />} />

          {/* Auth plateforme — jamais sur myemarzona.shop */}
          <Route path="/login" element={<RedirectToPlatformAuth />} />
          <Route path="/connexion" element={<RedirectToPlatformAuth />} />
          <Route path="/register" element={<RedirectToPlatformAuth />} />
          <Route path="/signup" element={<RedirectToPlatformAuth />} />
          <Route path="/inscription" element={<RedirectToPlatformAuth />} />
          <Route path="/auth" element={<RedirectToPlatformAuth />} />
          <Route path="/auth/login" element={<RedirectToPlatformAuth />} />
          <Route path="/auth/signup" element={<RedirectToPlatformAuth />} />

          {/* Messagerie vendeur — plateforme uniquement */}
          <Route path="/vendor/messaging" element={<RedirectToPlatformVendorMessaging />} />
          <Route path="/vendor/messaging/*" element={<RedirectToPlatformVendorMessaging />} />

          {/* Panier et checkout */}
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />

          {/* Paiements */}
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/cancel" element={<PaymentCancel />} />

          {/* Collections & Enchères */}
          <Route path="/collections" element={<CollectionsPage />} />
          <Route path="/collections/:collectionSlug" element={<CollectionDetail />} />
          <Route path="/auctions" element={<AuctionsListPage />} />
          <Route path="/auctions/:slug" element={<AuctionDetailPage />} />

          {/* Portfolio */}
          <Route path="/portfolio" element={<ArtistPortfolioPage />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </StoreSlugProvider>
  );
}
