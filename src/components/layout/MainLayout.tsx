/**
 * Main Layout - Layout unifié pour toute l'application
 * Gère TopNav + Sidebar + Content selon le type
 * Détecte automatiquement la sidebar selon la route
 */

import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { TopNavigationBar } from './TopNavigationBar';
import { ConfigContextSidebar } from './SectionContextSidebar';
import { UtilityBarHeader } from './UtilityBarHeader';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import {
  CONTEXT_SIDEBAR_LAYOUT_TYPES,
  getContextSidebarConfigId,
} from '@/config/contextSidebar.registry';
import { detectLayoutType } from '@/config/layoutTypeDetection';
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

export const MainLayout = ({ children, layoutType, showTopNav = true }: MainLayoutProps) => {
  const location = useLocation();
  const detectedType = layoutType || detectLayoutType(location.pathname);

  const contextConfigId = getContextSidebarConfigId(detectedType);
  const hasFixedSidebar = CONTEXT_SIDEBAR_LAYOUT_TYPES.includes(detectedType);

  const contentMargins = cn(
    'flex flex-1 flex-col min-w-0',
    hasFixedSidebar ? 'md:ml-[15rem] lg:ml-60 xl:ml-64' : 'lg:ml-64',
    hasFixedSidebar ? 'pb-16 md:pb-0' : ''
  );

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col">
        {showTopNav && <TopNavigationBar />}

        <div className={cn('flex flex-1', showTopNav && 'pt-16')}>
          {!hasFixedSidebar && <AppSidebar />}

          {hasFixedSidebar && (
            <div className="md:hidden">
              <AppSidebar />
            </div>
          )}

          {contextConfigId && <ConfigContextSidebar configId={contextConfigId} />}

          <div className={contentMargins}>
            {!showTopNav && <UtilityBarHeader />}
            <main
              id="main-content"
              role="main"
              className="flex-1 overflow-auto bg-background transition-all duration-300"
              tabIndex={-1}
              aria-label="Contenu principal"
            >
              {children}
            </main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};
