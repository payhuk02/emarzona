/**
 * Routes spécifiques pour les sous-domaines de boutiques (*.myemarzona.shop)
 * 
 * Quand l'app est accédée via un sous-domaine de boutique,
 * ces routes remplacent les routes de la plateforme.
 * Le slug n'apparaît PAS dans l'URL (il est fourni via StoreSlugContext).
 */

import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { StoreSlugProvider } from '@/contexts/StoreSlugContext';
import { StoreSubdomainNav } from '@/components/storefront/StoreSubdomainNav';

const Storefront = lazy(() => import('@/pages/Storefront'));
const ProductDetail = lazy(() => import('@/pages/ProductDetail'));
const StoreLegalPage = lazy(() => import('@/pages/StoreLegalPage'));
const Cart = lazy(() => import('@/pages/CartEnhanced'));
const Checkout = lazy(() => import('@/pages/checkout/Checkout'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const PaymentSuccess = lazy(() => import('@/pages/payments/PaymentSuccess'));
const PaymentCancel = lazy(() => import('@/pages/payments/PaymentCancel'));
const CollectionsPage = lazy(() =>
  import('@/pages/artist/CollectionsPage').then(m => ({ default: m.default }))
);
const CollectionDetail = lazy(() =>
  import('@/components/artist/CollectionDetail').then(m => ({ default: m.CollectionDetail }))
);
const AuctionsListPage = lazy(() => import('@/pages/artist/AuctionsListPage'));
const AuctionDetailPage = lazy(() => import('@/pages/artist/AuctionDetailPage'));
const ArtistPortfolioPage = lazy(() => import('@/pages/artist/ArtistPortfolioPage'));

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
}

const LoadingFallback = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="flex flex-col items-center space-y-4">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      <p className="text-muted-foreground">Chargement...</p>
    </div>
  </div>
);

export function StoreSubdomainRoutes({ storeSlug, storeName, logoUrl, storeThemeColors }: StoreSubdomainRoutesProps) {
  return (
    <StoreSlugProvider slug={storeSlug}>
      <StoreSubdomainNav storeName={storeName} logoUrl={logoUrl || undefined} themeColors={storeThemeColors} />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Root = Storefront de la boutique */}
          <Route path="/" element={<Storefront />} />
          
          {/* Produits */}
          <Route path="/products/:productSlug" element={<ProductDetail />} />
          
          {/* Pages légales */}
          <Route path="/legal/:page" element={<StoreLegalPage />} />
          
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
