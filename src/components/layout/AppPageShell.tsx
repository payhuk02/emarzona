/**
 * AppPageShell — shell dashboard unifié
 * AppSidebar compact + barre horizontale contextuelle (mega-menu) + UtilityBar + main
 * Ctrl+K : palette gated dans AppSidebar (SidebarNavCommandPalette) — pas de double palette.
 *
 * Nesting-safe: when already inside another AppPageShell (AuthenticatedAppLayout),
 * page-level wrappers pass children through without remounting chrome.
 */

import { lazy, ReactNode, Suspense, useEffect, useRef, createContext, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { UtilityBarHeader } from '@/components/layout/UtilityBarHeader';
import {
  shouldShowBottomNavigation,
  shouldShowHorizontalNav,
} from '@/config/navigation.horizontal';
import { detectLayoutType } from '@/config/layoutTypeDetection';
import type { LayoutType } from '@/components/layout/layout.types';
import { cn } from '@/lib/utils';
import { useDeferHorizontalContextNav } from '@/hooks/useDeferHorizontalContextNav';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';

const HorizontalContextNav = lazy(() =>
  import('@/components/layout/HorizontalContextNav').then(m => ({
    default: m.HorizontalContextNav,
  }))
);

const AppPageShellNestContext = createContext(false);

function HorizontalContextNavPlaceholder() {
  return <div className="h-11 shrink-0 border-b border-border bg-muted/40" aria-hidden />;
}

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
  hideSidebar?: boolean;
  hideHorizontalNav?: boolean;
  /**
   * Pad #main-content for mobile bottom-nav (safe-area).
   * Default: auto when bottom-nav would be visible for this route.
   */
  padForBottomNav?: boolean;
};

export function AppPageShell({
  children,
  layoutType,
  shellClassName,
  className,
  mainClassName,
  showUtilityBar = true,
  hideSidebar = false,
  hideHorizontalNav = false,
  padForBottomNav,
}: AppPageShellProps) {
  const nested = useContext(AppPageShellNestContext);
  const { t } = useTranslation();
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const { user } = useAuth();
  const isMobile = useIsMobile();
  void (layoutType ?? detectLayoutType(location.pathname));
  const showHorizontalNav = shouldShowHorizontalNav(location.pathname);
  const showDeferredHorizontalNav = useDeferHorizontalContextNav(location.pathname);
  const shouldPadBottomNav =
    padForBottomNav ?? (isMobile && !!user && shouldShowBottomNavigation(location.pathname));

  useEffect(() => {
    if (nested) return;
    const prefetch = () => {
      if (showHorizontalNav) {
        void import('@/components/layout/HorizontalContextNav');
      }
    };
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const id = requestIdleCallback(prefetch, { timeout: 4000 });
      return () => cancelIdleCallback(id);
    }
    const timer = setTimeout(prefetch, 1500);
    return () => clearTimeout(timer);
  }, [showHorizontalNav, nested]);

  useEffect(() => {
    if (nested) return;
    const el = mainRef.current;
    if (!el) return;
    el.classList.remove('page-enter');
    void el.offsetWidth;
    el.classList.add('page-enter');
  }, [location.pathname, nested]);

  if (nested) {
    return (
      <div className={cn(shellClassName, className, mainClassName)} data-app-shell-nested="">
        {children}
      </div>
    );
  }

  return (
    <AppPageShellNestContext.Provider value={true}>
      <SidebarProvider>
        <div
          className={cn('flex min-h-screen w-full bg-background', shellClassName)}
          data-bottom-nav={shouldPadBottomNav ? 'true' : undefined}
        >
          {!hideSidebar && <AppSidebar />}
          <div className={cn('flex flex-1 flex-col min-w-0 min-h-screen', className)}>
            {showUtilityBar && <UtilityBarHeader />}
            {showHorizontalNav &&
              !hideHorizontalNav &&
              (showDeferredHorizontalNav ? (
                <Suspense fallback={<HorizontalContextNavPlaceholder />}>
                  <HorizontalContextNav />
                </Suspense>
              ) : (
                <HorizontalContextNavPlaceholder />
              ))}
            <main
              ref={mainRef}
              id="main-content"
              role="main"
              tabIndex={-1}
              aria-label={t('sidebar.chrome.mainContentAriaLabel', {
                defaultValue: 'Contenu principal',
              })}
              className={cn(
                'flex-1 overflow-auto page-enter',
                shouldPadBottomNav && 'pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0',
                mainClassName
              )}
            >
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </AppPageShellNestContext.Provider>
  );
}
