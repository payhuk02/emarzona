import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { StoreCreateCtaLink } from '@/components/store/StoreCreateCtaLink';
import { Menu, X } from 'lucide-react';
import { EmarzonaBrandLogo } from './EmarzonaBrandLogo';
import { PremiumLangSwitcher } from './PremiumLangSwitcher';
import { PremiumNavTopLinks } from './PremiumNavTopLinks';
import { useLandingPremiumT } from '@/hooks/useLandingPremiumT';
import { useAuth } from '@/contexts/AuthContext';
import { useStoreContext } from '@/contexts/StoreContext';
import type { LandingPremiumMegaId } from '@/config/landing-premium-nav';

const PremiumNavDesktopMenu = lazy(() =>
  import('./PremiumNavMega').then(m => ({ default: m.PremiumNavDesktopMenu }))
);
const PremiumNavMobileList = lazy(() =>
  import('./PremiumNavMega').then(m => ({ default: m.PremiumNavMobileList }))
);

function NavAuthCtaSkeleton() {
  return <div className="h-10 w-[7.25rem] shrink-0 rounded-full bg-white/[0.08]" aria-hidden />;
}

export function PremiumNav() {
  const { t } = useLandingPremiumT();
  const { pathname } = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { stores, loading: storesLoading } = useStoreContext();
  const [open, setOpen] = useState(false);
  const [openMega, setOpenMega] = useState<LandingPremiumMegaId | null>(null);
  const [megaReady, setMegaReady] = useState(false);

  const authReady = !authLoading;
  const isAuthenticated = authReady && Boolean(user);
  const hasStores = isAuthenticated && !storesLoading && stores.length > 0;
  const authHomeHref = hasStores ? '/dashboard' : '/account/hub';
  const authHomeLabel = hasStores ? t('nav.dashboard') : t('nav.myAccount');

  const armMega = () => setMegaReady(true);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
    setOpenMega(null);
  }, [pathname]);

  useEffect(() => {
    if (megaReady) return;

    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (typeof win.requestIdleCallback === 'function') {
      const id = win.requestIdleCallback(() => setMegaReady(true), { timeout: 2800 });
      return () => win.cancelIdleCallback?.(id);
    }

    const timer = window.setTimeout(() => setMegaReady(true), 1800);
    return () => window.clearTimeout(timer);
  }, [megaReady]);

  const closeDrawer = () => {
    setOpen(false);
    setOpenMega(null);
  };

  return (
    <header className="lp-premium-nav fixed inset-x-0 top-0 z-50 overflow-visible">
      <div className="lp-premium-nav__inner mx-auto h-[4.25rem] max-w-7xl px-4 sm:h-[4.5rem] sm:px-5 lg:h-[4.75rem] lg:px-8">
        <div className="grid h-full w-full grid-cols-[auto_1fr_auto] items-center gap-3 lg:gap-4">
          <Link to="/" className="lp-nav-logo flex h-10 shrink-0 items-center sm:h-11">
            <EmarzonaBrandLogo variant="nav" />
          </Link>

          <nav
            className="lp-nav-menu hidden min-w-0 justify-center lg:flex"
            aria-label="Navigation principale"
            onPointerEnter={armMega}
            onFocusCapture={armMega}
          >
            {megaReady ? (
              <Suspense fallback={<PremiumNavTopLinks t={t} pathname={pathname} />}>
                <PremiumNavDesktopMenu t={t} pathname={pathname} />
              </Suspense>
            ) : (
              <PremiumNavTopLinks t={t} pathname={pathname} />
            )}
          </nav>

          <div className="flex shrink-0 items-center justify-end gap-2 xl:gap-3">
            <div className="hidden items-center gap-2 lg:flex xl:gap-3">
              <PremiumLangSwitcher className="lp-nav-control" />
              {!authReady ? (
                <NavAuthCtaSkeleton />
              ) : isAuthenticated ? (
                <Link
                  to={authHomeHref}
                  className="lp-btn-primary lp-nav-cta inline-flex h-10 items-center whitespace-nowrap rounded-full px-4 text-sm font-semibold xl:px-5"
                >
                  {authHomeLabel}
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="lp-nav-ghost inline-flex h-10 items-center whitespace-nowrap px-1"
                  >
                    {t('nav.login')}
                  </Link>
                  <StoreCreateCtaLink className="lp-btn-primary lp-nav-cta inline-flex h-10 items-center whitespace-nowrap rounded-full px-4 text-sm font-semibold xl:px-5">
                    <span className="hidden xl:inline">{t('nav.getStarted')}</span>
                    <span className="xl:hidden">{t('nav.getStartedShort')}</span>
                  </StoreCreateCtaLink>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 lg:hidden">
              <PremiumLangSwitcher className="lp-nav-control" />
              <button
                type="button"
                className="lp-nav-icon-btn flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/[0.04] text-white/90 transition-colors hover:border-white/22 hover:bg-white/[0.08]"
                onClick={() => {
                  armMega();
                  setOpen(!open);
                }}
                aria-label={open ? t('nav.menuClose') : t('nav.menuOpen')}
                aria-expanded={open}
              >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 top-[4.25rem] z-40 bg-black/60 backdrop-blur-sm sm:top-[4.5rem] lg:hidden"
            aria-label={t('nav.menuClose')}
            onClick={closeDrawer}
          />
          <div className="lp-premium-nav__drawer fixed inset-x-0 top-[4.25rem] z-50 max-h-[calc(100dvh-4.25rem)] overflow-y-auto border-t border-white/10 px-5 py-6 sm:top-[4.5rem] lg:hidden">
            <Suspense
              fallback={
                <div className="space-y-2" aria-hidden>
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-11 rounded-xl bg-white/[0.06]" />
                  ))}
                </div>
              }
            >
              <PremiumNavMobileList
                t={t}
                pathname={pathname}
                openMega={openMega}
                onOpenMega={setOpenMega}
                onNavigate={closeDrawer}
              />
            </Suspense>
            <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-6">
              {!authReady ? (
                <div className="h-11 w-full rounded-full bg-white/[0.08]" aria-hidden />
              ) : isAuthenticated ? (
                <Link
                  to={authHomeHref}
                  className="lp-btn-primary rounded-full py-3.5 text-center text-sm font-semibold"
                  onClick={closeDrawer}
                >
                  {authHomeLabel}
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="lp-btn-outline rounded-full py-3 text-center text-sm"
                    onClick={closeDrawer}
                  >
                    {t('nav.login')}
                  </Link>
                  <StoreCreateCtaLink
                    className="lp-btn-primary rounded-full py-3.5 text-center text-sm font-semibold"
                    onClick={closeDrawer}
                  >
                    {t('nav.getStarted')}
                  </StoreCreateCtaLink>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
}
