import React, { lazy } from 'react';
import { Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const CustomerPortal = lazy(() => import('@/pages/customer/CustomerPortal'));
const CustomerMyOrders = lazy(() => import('@/pages/customer/MyOrders'));
const CustomerMyDownloads = lazy(() => import('@/pages/customer/MyDownloads'));
const CustomerMyCourses = lazy(() => import('@/pages/customer/MyCourses'));
const CustomerMyProfile = lazy(() => import('@/pages/customer/MyProfile'));
const CustomerMyWishlist = lazy(() => import('@/pages/customer/CustomerMyWishlist'));
const CustomerDigitalPortal = lazy(() => import('@/pages/customer/CustomerDigitalPortal'));
const CustomerPhysicalPortal = lazy(() => import('@/pages/customer/CustomerPhysicalPortal'));
const CustomerMyInvoices = lazy(() => import('@/pages/customer/CustomerMyInvoices'));
const CustomerMyReturns = lazy(() => import('@/pages/customer/CustomerMyReturns'));
const CustomerLoyaltyPage = lazy(() => import('@/pages/customer/CustomerLoyaltyPage'));
const CustomerMyGiftCardsPage = lazy(() => import('@/pages/customer/CustomerMyGiftCardsPage'));
const PriceStockAlerts = lazy(() => import('@/pages/customer/PriceStockAlerts'));
const CustomerWarranties = lazy(() => import('@/pages/customer/CustomerWarranties'));
const MultiStoreCheckoutTracking = lazy(() => import('@/pages/checkout/MultiStoreCheckoutTracking'));

const protectedRoute = (path: string, Component: React.LazyExoticComponent<any>) => (
  <Route path={path} element={<ProtectedRoute><Component /></ProtectedRoute>} />
);

export const customerRoutes = (
  <>
    {protectedRoute('/account', CustomerPortal)}
    {protectedRoute('/account/orders', CustomerMyOrders)}
    {protectedRoute('/account/downloads', CustomerMyDownloads)}
    {protectedRoute('/account/warranties', CustomerWarranties)}
    {protectedRoute('/account/digital', CustomerDigitalPortal)}
    {protectedRoute('/account/physical', CustomerPhysicalPortal)}
    {protectedRoute('/account/courses', CustomerMyCourses)}
    {protectedRoute('/account/profile', CustomerMyProfile)}
    {protectedRoute('/account/wishlist', CustomerMyWishlist)}
    {protectedRoute('/account/alerts', PriceStockAlerts)}
    {protectedRoute('/account/invoices', CustomerMyInvoices)}
    {protectedRoute('/account/returns', CustomerMyReturns)}
    {protectedRoute('/account/loyalty', CustomerLoyaltyPage)}
    {protectedRoute('/account/gift-cards', CustomerMyGiftCardsPage)}
    {protectedRoute('/checkout/multi-store-tracking', MultiStoreCheckoutTracking)}
  </>
);
