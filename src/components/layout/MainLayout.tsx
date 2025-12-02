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
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

export type LayoutType = 'default' | 'settings' | 'emails' | 'products' | 'orders' | 'customers' | 'analytics' | 'account' | 'sales' | 'finance' | 'marketing' | 'systems' | 'minimal';

interface MainLayoutProps {
  children: ReactNode;
  layoutType?: LayoutType;
  showTopNav?: boolean;
}

/**
 * Détecte automatiquement le type de layout selon la route
 */
const detectLayoutType = (pathname: string): LayoutType => {
  // Détection par ordre de spécificité (du plus spécifique au plus général)
  // Routes exactes d'abord pour éviter les conflits
  if (pathname === '/dashboard/marketing' || pathname.startsWith('/dashboard/marketing/')) return 'marketing';
  if (pathname.includes('/settings')) return 'settings';
  if (pathname.includes('/emails')) return 'emails';
  if (pathname.includes('/products') || pathname.includes('/digital-products') || pathname.includes('/my-courses') || pathname.includes('/my-downloads') || pathname.includes('/my-licenses') || pathname.includes('/bundles') || pathname.includes('/updates')) return 'products';
  if (pathname.includes('/orders') || pathname.includes('/advanced-orders') || pathname.includes('/vendor/messaging') || pathname.includes('/bookings') || pathname.includes('/advanced-calendar') || pathname.includes('/service-management') || pathname.includes('/recurring-bookings') || pathname.includes('/services/') || pathname.includes('/inventory') || pathname.includes('/shipping') || pathname.includes('/batch-shipping') || pathname.includes('/product-kits') || pathname.includes('/demand-forecasting') || pathname.includes('/cost-optimization') || pathname.includes('/suppliers') || pathname.includes('/warehouses') || pathname.includes('/physical-')) return 'sales';
  if (pathname.includes('/payments') || pathname.includes('/pay-balance') || pathname.includes('/payment-management') || pathname.includes('/withdrawals') || pathname.includes('/payment-methods')) return 'finance';
  if (pathname.includes('/customers') || pathname.includes('/promotions') || pathname.includes('/referrals') || pathname.includes('/affiliates') || pathname.includes('/affiliate/')) return 'marketing';
  if (pathname.includes('/analytics') || pathname.includes('/pixels') || pathname.includes('/seo')) return 'analytics';
  if (pathname.includes('/integrations') || pathname.includes('/webhooks') || pathname.includes('/loyalty') || pathname.includes('/gift-cards')) return 'systems';
  if (pathname.startsWith('/account')) return 'account';
  return 'default';
};

export const MainLayout = ({
  children,
  layoutType,
  showTopNav = true,
}: MainLayoutProps) => {
  const location = useLocation();
  const detectedType = layoutType || detectLayoutType(location.pathname);
  
  // Déterminer quelle sidebar afficher
  const renderSidebar = () => {
    switch (detectedType) {
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
      case 'default':
        return <AppSidebar />;
      case 'minimal':
        return null;
      default:
        return <AppSidebar />;
    }
  };

  // Déterminer si on doit ajouter une marge pour la sidebar fixe
  const hasFixedSidebar = ['settings', 'emails', 'products', 'orders', 'customers', 'analytics', 'account', 'sales', 'finance', 'marketing', 'systems'].includes(detectedType);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col">
        {/* Top Navigation Bar - Fixe en haut */}
        {showTopNav && <TopNavigationBar />}

        {/* Main Content Area */}
        <div className="flex flex-1 pt-16">
          {/* Sidebar */}
          {renderSidebar()}

          {/* Main Content */}
          <main
            id="main-content"
            role="main"
            className={cn(
              'flex-1 overflow-auto bg-background transition-all duration-300',
              hasFixedSidebar && 'md:ml-56 lg:ml-64', // Margin responsive pour sidebar fixe
              detectedType === 'default' && 'lg:ml-0' // AppSidebar gère son propre positionnement
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

