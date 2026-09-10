/**
 * Routes compte acheteur — enfants de AuthenticatedAppLayout (shell persistant).
 */

import React from 'react';
import { lazyPage } from '@/routes/lazyPage';
import { Route } from 'react-router-dom';

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

const accountPage = (path: string, Component: React.LazyExoticComponent<React.ComponentType>) => (
  <Route path={path} element={<Component />} />
);

export const customerRoutes = (
  <>
    {accountPage('/account', CustomerPortal)}
    {accountPage('/account/hub', CustomerPortal)}
    {accountPage('/account/orders', CustomerMyOrders)}
    {accountPage('/account/downloads', CustomerMyDownloads)}
    {accountPage('/account/warranties', CustomerWarranties)}
    {accountPage('/account/digital', CustomerDigitalPortal)}
    {accountPage('/account/physical', CustomerPhysicalPortal)}
    {accountPage('/account/courses', CustomerMyCourses)}
    {accountPage('/account/bookings', CustomerMyBookings)}
    {accountPage('/account/artist', CustomerArtistPortal)}
    {accountPage('/account/profile', CustomerMyProfile)}
    {accountPage('/account/wishlist', CustomerMyWishlist)}
    {accountPage('/account/alerts', PriceStockAlerts)}
    {accountPage('/account/invoices', CustomerMyInvoices)}
    {accountPage('/account/returns', CustomerMyReturns)}
    {accountPage('/account/loyalty', CustomerLoyaltyPage)}
    {accountPage('/account/gift-cards', CustomerMyGiftCardsPage)}
    {accountPage('/disputes/create', CreateProtectClaimPage)}
  </>
);
