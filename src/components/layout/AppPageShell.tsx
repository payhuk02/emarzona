/**
 * AppPageShell — shell dashboard unifié
 * AppSidebar compact + barre horizontale contextuelle (mega-menu) + UtilityBar + main
 */

import { lazy, ReactNode, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { UtilityBarHeader } from '@/components/layout/UtilityBarHeader';
import { shouldShowHorizontalNav } from '@/config/navigation.horizontal';
import { detectLayoutType } from '@/config/layoutTypeDetection';
import type { LayoutType } from '@/components/layout/layout.types';
import { cn } from '@/lib/utils';

const HorizontalContextNav = lazy(() =>
  import('@/components/layout/HorizontalContextNav').then(m => ({
    default: m.HorizontalContextNav,
  }))
);

export type AppPageShellProps = {
  children: ReactNode;
  /** @deprecated Détection automatique via pathname — ignoré par AppPageShell. */
  layoutType?: LayoutType;
  /** Classes on outer flex row (sidebar + content) */
  shellClassName?: string;
  /** Classes on content column wrapper */
  className?: string;
  /** Classes on <main id="main-content"> */
  mainClassName?: string;
  showUtilityBar?: boolean;
};

export function AppPageShell({
  children,
  layoutType,
  shellClassName,
  className,
  mainClassName,
  showUtilityBar = true,
}: AppPageShellProps) {
  const { t } = useTranslation();
  const location = useLocation();
  void (layoutType ?? detectLayoutType(location.pathname));
  const showHorizontalNav = shouldShowHorizontalNav(location.pathname);

  return (
    <SidebarProvider>
      <div
        className={cn('flex min-h-screen w-full bg-background overflow-x-hidden', shellClassName)}
      >
        <AppSidebar />
        <div className={cn('flex flex-1 flex-col min-w-0 min-h-screen', className)}>
          {showUtilityBar && <UtilityBarHeader />}
          {showHorizontalNav && (
            <Suspense fallback={null}>
              <HorizontalContextNav />
            </Suspense>
          )}
          <main
            id="main-content"
            role="main"
            tabIndex={-1}
            aria-label={t('sidebar.chrome.mainContentAriaLabel', {
              defaultValue: 'Contenu principal',
            })}
            className={cn('flex-1 overflow-auto', mainClassName)}
          >
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
