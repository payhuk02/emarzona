/**
 * Layout Components - Exports centralisés (légers uniquement).
 * Layouts lourds (AppPageShell, AuthenticatedAppLayout, BuyerDiscoveryShellLayout,
 * StorefrontAppLayout, PublicAppLayout, HorizontalContextNav) : importer depuis leur fichier.
 */

/** @deprecated Non monté en production — réservé aux mockups landing. */
export { TopNavigationBar } from './TopNavigationBar';
export { Breadcrumb } from './Breadcrumb';
export type { BreadcrumbItem } from './Breadcrumb';
/** @deprecated Remplacé par HorizontalContextNav — aucun import runtime. */
export { ContextualNavBar } from './ContextualNavBar';
export type { ContextualNavItem } from './ContextualNavBar';
export { BuyerDiscoveryPageLayout } from './BuyerDiscoveryPageLayout';
export type { BuyerDiscoveryPageLayoutProps } from './BuyerDiscoveryPageLayout';
export { PublicPremiumChrome } from './PublicPremiumChrome';
export type { LayoutType } from './layout.types';
export { MainLayout } from './MainLayout';
