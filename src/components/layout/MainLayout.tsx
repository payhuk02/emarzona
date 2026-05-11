/**
 * Main Layout - Layout unifié pour toute l'application
 * Gère TopNav + Sidebar + Content selon le type
 * Détecte automatiquement la sidebar selon la route
 */

import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { TopNavigationBar } from './TopNavigationBar';
import { SettingsSidebar } from './SettingsSidebar';
import { EmailsSidebar } from './EmailsSidebar';
import { ProductsSidebar } from './ProductsSidebar';
import { OrdersSidebar } from './OrdersSidebar';
import { CustomersSidebar } from './CustomersSidebar';
import { AnalyticsSidebar } from './AnalyticsSidebar';
import { AccountSidebar } from './AccountSidebar';
import { SalesSidebar } from './SalesSidebar';
import { FinanceSidebar } from './FinanceSidebar';
import { MarketingSidebar } from './MarketingSidebar';
import { SystemsSidebar } from './SystemsSidebar';
import { StoreSidebar } from './StoreSidebar';
import { BookingsSidebar } from './BookingsSidebar';
import { InventorySidebar } from './InventorySidebar';
import { ShippingSidebar } from './ShippingSidebar';
import { PromotionsSidebar } from './PromotionsSidebar';
import { CoursesSidebar } from './CoursesSidebar';
import { AffiliateSidebar } from './AffiliateSidebar';
import { DigitalPortalSidebar } from './DigitalPortalSidebar';
import { PhysicalPortalSidebar } from './PhysicalPortalSidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

export type LayoutType =
  | 'default'
  | 'settings'
  | 'emails'
  | 'products'
  | 'orders'
  | 'customers'
  | 'analytics'
  | 'account'
  | 'sales'
  | 'finance'
  | 'marketing'
  | 'systems'
  | 'store'
  | 'bookings'
  | 'inventory'
  | 'shipping'
  | 'promotions'
  | 'courses'
  | 'affiliate'
  | 'digital-portal'
  | 'physical-portal'
  | 'minimal';

interface MainLayoutProps {
  children: ReactNode;
  layoutType?: LayoutType;
  showTopNav?: boolean;
}

/**
 * Détecte automatiquement le type de layout selon la route
 * Ordre de priorité: du plus spécifique au plus général
 */
const detectLayoutType = (pathname: string): LayoutType => {
  // 1. Routes très spécifiques avec sidebars dédiées
  if (pathname.includes('/affiliate/')) return 'affiliate';
  if (
    pathname.includes('/account/digital') ||
    pathname.includes('/my-downloads') ||
    pathname.includes('/my-licenses') ||
    pathname.includes('/digital/updates')
  )
    return 'digital-portal';
  if (
    pathname.includes('/account/physical') ||
    pathname.includes('/physical-inventory') ||
    pathname.includes('/physical-analytics') ||
    pathname.includes('/physical-serial-tracking')
  )
    return 'physical-portal';
  if (
    pathname.includes('/account/courses') ||
    pathname.includes('/dashboard/courses/') ||
    pathname.includes('/dashboard/my-courses')
  )
    return 'courses';
  if (pathname.includes('/dashboard/store/') || pathname === '/dashboard/store') return 'store';
  if (pathname.includes('/dashboard/promotions') || pathname === '/promotions') return 'promotions';
  if (
    pathname.includes('/bookings') ||
    pathname.includes('/advanced-calendar') ||
    pathname.includes('/service-management') ||
    pathname.includes('/recurring-bookings') ||
    pathname.includes('/services/')
  )
    return 'bookings';
  if (
    pathname.includes('/dashboard/inventory') ||
    pathname.includes('/physical-inventory') ||
    pathname.includes('/physical-lots') ||
    pathname.includes('/physical-serial-tracking') ||
    pathname.includes('/physical-barcode-scanner') ||
    pathname.includes('/physical-preorders') ||
    pathname.includes('/physical-backorders')
  )
    return 'inventory';
  if (
    pathname.includes('/dashboard/shipping') ||
    pathname.includes('/shipping-services') ||
    pathname.includes('/contact-shipping-service') ||
    pathname.includes('/batch-shipping')
  )
    return 'shipping';

  // 2. Routes avec sidebars existantes
  if (pathname.includes('/settings')) return 'settings';
  if (pathname.includes('/emails')) return 'emails';
  if (
    pathname.includes('/products') ||
    pathname.includes('/digital-products') ||
    pathname.includes('/bundles') ||
    pathname.includes('/updates')
  )
    return 'products';
  if (
    pathname.includes('/orders') ||
    pathname.includes('/advanced-orders') ||
    pathname.includes('/vendor/messaging')
  )
    return 'orders';
  if (
    pathname.includes('/payments') ||
    pathname.includes('/pay-balance') ||
    pathname.includes('/payment-management') ||
    pathname.includes('/withdrawals') ||
    pathname.includes('/payment-methods')
  )
    return 'finance';
  if (
    pathname.includes('/customers') ||
    pathname.includes('/referrals') ||
    pathname.includes('/affiliates')
  )
    return 'customers';
  if (pathname.includes('/analytics') || pathname.includes('/pixels') || pathname.includes('/seo'))
    return 'analytics';
  if (
    pathname.includes('/integrations') ||
    pathname.includes('/webhooks') ||
    pathname.includes('/loyalty') ||
    pathname.includes('/gift-cards')
  )
    return 'systems';
  if (pathname.startsWith('/account')) return 'account';

  // 3. Routes générales (sales, marketing)
  if (
    pathname.includes('/product-kits') ||
    pathname.includes('/demand-forecasting') ||
    pathname.includes('/cost-optimization') ||
    pathname.includes('/suppliers') ||
    pathname.includes('/warehouses')
  )
    return 'sales';
  if (pathname === '/dashboard/marketing' || pathname.startsWith('/dashboard/marketing/'))
    return 'marketing';

  return 'default';
};

export const MainLayout = ({ children, layoutType, showTopNav = true }: MainLayoutProps) => {
  const location = useLocation();
  const detectedType = layoutType || detectLayoutType(location.pathname);

  // Déterminer quelle sidebar contextuelle afficher (en plus de AppSidebar)
  const renderContextSidebar = () => {
    switch (detectedType) {
      // Sidebars existantes
      case 'settings':
        return <SettingsSidebar />;
      case 'emails':
        return <EmailsSidebar />;
      case 'products':
        return <ProductsSidebar />;
      case 'orders':
        return <OrdersSidebar />;
      case 'customers':
        return <CustomersSidebar />;
      case 'analytics':
        return <AnalyticsSidebar />;
      case 'account':
        return <AccountSidebar />;
      case 'sales':
        return <SalesSidebar />;
      case 'finance':
        return <FinanceSidebar />;
      case 'marketing':
        return <MarketingSidebar />;
      case 'systems':
        return <SystemsSidebar />;

      // Nouvelles sidebars
      case 'store':
        return <StoreSidebar />;
      case 'bookings':
        return <BookingsSidebar />;
      case 'inventory':
        return <InventorySidebar />;
      case 'shipping':
        return <ShippingSidebar />;
      case 'promotions':
        return <PromotionsSidebar />;
      case 'courses':
        return <CoursesSidebar />;
      case 'affiliate':
        return <AffiliateSidebar />;
      case 'digital-portal':
        return <DigitalPortalSidebar />;
      case 'physical-portal':
        return <PhysicalPortalSidebar />;

      case 'default':
      case 'minimal':
      default:
        return null; // Pas de sidebar contextuelle, seulement AppSidebar
    }
  };

  // Déterminer si on doit ajouter une marge pour la sidebar fixe
  const hasFixedSidebar = [
    'settings',
    'emails',
    'products',
    'orders',
    'customers',
    'analytics',
    'account',
    'sales',
    'finance',
    'marketing',
    'systems',
    'store',
    'bookings',
    'inventory',
    'shipping',
    'promotions',
    'courses',
    'affiliate',
    'digital-portal',
    'physical-portal',
  ].includes(detectedType);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col">
        {/* Top Navigation Bar - Fixe en haut */}
        {showTopNav && <TopNavigationBar />}

        {/* Main Content Area */}
        <div className="flex flex-1 pt-16">
          {/* AppSidebar principal
              - Quand il n'y a PAS de sidebar contextuelle : visible sur desktop, gère aussi le Sheet mobile.
              - Quand une sidebar contextuelle est présente (produits, commandes, inventaire, etc.) :
                on ne l'affiche pas sur desktop pour éviter une double colonne vide, mais on le rend
                toujours sur mobile pour que le Sheet fonctionne. */}
          {!hasFixedSidebar && <AppSidebar />}

          {/* AppSidebar uniquement pour mobile lorsqu'une sidebar contextuelle est présente.
              Sur mobile, le composant Sidebar bascule automatiquement en Sheet,
              et ce wrapper est masqué sur desktop pour ne pas réserver d'espace supplémentaire. */}
          {hasFixedSidebar && (
            <div className="md:hidden">
              <AppSidebar />
            </div>
          )}

          {/* Sidebar Contextuelle - Remplace AppSidebar quand présente (stable et statique) */}
          {renderContextSidebar()}

          {/* Main Content */}
          <main
            id="main-content"
            role="main"
            className={cn(
              'flex-1 overflow-auto bg-background transition-all duration-300',
              // Marge pour sidebar (AppSidebar OU ContextSidebar - 16rem = 256px = 64 en Tailwind)
              hasFixedSidebar ? 'md:ml-56 lg:ml-64' : 'lg:ml-64',
              // Marge en bas sur mobile pour la barre de navigation horizontale (64px = 16 en Tailwind)
              hasFixedSidebar ? 'pb-16 md:pb-0' : ''
            )}
            tabIndex={-1}
            aria-label="Contenu principal"
          >
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};






