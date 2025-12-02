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
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

export type LayoutType = 'default' | 'settings' | 'emails' | 'products' | 'orders' | 'customers' | 'analytics' | 'account' | 'minimal';

interface MainLayoutProps {
  children: ReactNode;
  layoutType?: LayoutType;
  showTopNav?: boolean;
}

/**
 * Détecte automatiquement le type de layout selon la route
 */
const detectLayoutType = (pathname: string): LayoutType => {
  if (pathname.includes('/settings')) return 'settings';
  if (pathname.includes('/emails')) return 'emails';
  if (pathname.includes('/products') || pathname.includes('/digital-products')) return 'products';
  if (pathname.includes('/orders') || pathname.includes('/advanced-orders') || pathname.includes('/messaging')) return 'orders';
  if (pathname.includes('/customers') || pathname.includes('/referrals') || pathname.includes('/affiliates')) return 'customers';
  if (pathname.includes('/analytics') || pathname.includes('/pixels') || pathname.includes('/seo')) return 'analytics';
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
      case 'default':
        return <AppSidebar />;
      case 'minimal':
        return null;
      default:
        return <AppSidebar />;
    }
  };

  // Déterminer si on doit ajouter une marge pour la sidebar fixe
  const hasFixedSidebar = ['settings', 'emails', 'products', 'orders', 'customers', 'analytics', 'account'].includes(detectedType);

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
            className={cn(
              'flex-1 overflow-auto bg-background',
              hasFixedSidebar && 'lg:ml-64', // Margin pour sidebar fixe (256px) sur desktop uniquement
              detectedType === 'default' && 'lg:ml-0' // AppSidebar gère son propre positionnement
            )}
          >
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

