import React from 'react';
import { lazyPage } from '@/routes/lazyPage';
import { Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const CustomerPortal = lazyPage(() => import('@/pages/customer/CustomerPortal'));
const CustomerMyOrders = lazyPage(() => import('@/pages/customer/MyOrders'));
const CustomerMyDownloads = lazyPage(() => import('@/pages/customer/MyDownloads'));
const CustomerMyCourses = lazyPage(() => import('@/pages/customer/MyCourses'));
const CustomerMyProfile = lazyPage(() => import('@/pages/customer/MyProfile'));
const CustomerMyWishlist = lazyPage(() => import('@/pages/customer/CustomerMyWishlist'));
const CustomerDigitalPortal = lazyPage(() => import('@/pages/customer/CustomerDigitalPortal'));
const CustomerPhysicalPortal = lazyPage(() => import('@/pages/customer/CustomerPhysicalPortal'));
const CustomerMyInvoices = lazyPage(() => import('@/pages/customer/CustomerMyInvoices'));
const CustomerMyReturns = lazyPage(() => import('@/pages/customer/CustomerMyReturns'));
const CustomerLoyaltyPage = lazyPage(() => import('@/pages/customer/CustomerLoyaltyPage'));
const CustomerMyGiftCardsPage = lazyPage(() => import('@/pages/customer/CustomerMyGiftCardsPage'));
const PriceStockAlerts = lazyPage(() => import('@/pages/customer/PriceStockAlerts'));
const CustomerWarranties = lazyPage(() => import('@/pages/customer/CustomerWarranties'));
const CustomerMyBookings = lazyPage(() => import('@/pages/customer/CustomerMyBookings'));
const CustomerArtistPortal = lazyPage(() => import('@/pages/customer/CustomerArtistPortal'));
const CreateProtectClaimPage = lazyPage(() => import('@/pages/disputes/CreateProtectClaimPage'));

const protectedRoute = (
  path: string,
  Component: React.LazyExoticComponent<React.ComponentType>
) => (
  <Route
    path={path}
    element={
      <ProtectedRoute>
        <Component />
      </ProtectedRoute>
    }
  />
);

export const customerRoutes = (
  <>
    {protectedRoute('/account', CustomerPortal)}
    {protectedRoute('/account/hub', CustomerPortal)}
    {protectedRoute('/account/orders', CustomerMyOrders)}
    {protectedRoute('/account/downloads', CustomerMyDownloads)}
    {protectedRoute('/account/warranties', CustomerWarranties)}
    {protectedRoute('/account/digital', CustomerDigitalPortal)}
    {protectedRoute('/account/physical', CustomerPhysicalPortal)}
    {protectedRoute('/account/courses', CustomerMyCourses)}
    {protectedRoute('/account/bookings', CustomerMyBookings)}
    {protectedRoute('/account/artist', CustomerArtistPortal)}
    {protectedRoute('/account/profile', CustomerMyProfile)}
    {protectedRoute('/account/wishlist', CustomerMyWishlist)}
    {protectedRoute('/account/alerts', PriceStockAlerts)}
    {protectedRoute('/account/invoices', CustomerMyInvoices)}
    {protectedRoute('/account/returns', CustomerMyReturns)}
    {protectedRoute('/account/loyalty', CustomerLoyaltyPage)}
    {protectedRoute('/account/gift-cards', CustomerMyGiftCardsPage)}
    {protectedRoute('/disputes/create', CreateProtectClaimPage)}
  </>
);
