import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { StoreCreateCtaLink } from '@/components/store/StoreCreateCtaLink';
import { Menu, X } from 'lucide-react';
import { EmarzonaBrandLogo } from './EmarzonaBrandLogo';
import { PremiumLangSwitcher } from './PremiumLangSwitcher';
import { useLandingPremiumT } from '@/hooks/useLandingPremiumT';
import { cn } from '@/lib/utils';

const navItems = [
  { key: 'marketplace', href: '/marketplace', route: true },
  { key: 'features', href: '#fonctionnalites' },
  { key: 'solutions', href: '#solutions' },
  { key: 'pricing', href: '#tarifs' },
  { key: 'resources', href: '#ressources' },
  { key: 'about', href: '#apropos' },
  { key: 'blog', href: '/blog', route: true },
  { key: 'faq', href: '/faq', route: true },
] as const;

function NavLinkItem({
  label,
  href,
  route,
  onClick,
  className,
}: {
  label: string;
  href: string;
  route?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const location = useLocation();
  const isActive = route && location.pathname === href;

  const cls = cn(
    'lp-nav-link whitespace-nowrap rounded-full px-2.5 py-1.5 text-xs font-medium tracking-wide transition-all duration-300 lg:px-3 lg:py-2 lg:text-[13px] xl:px-3.5',
    isActive
      ? 'bg-white/[0.08] text-[var(--lp-gold-bright)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
      : 'text-white/60 hover:bg-white/[0.05] hover:text-white',
    className
  );

  if (route) {
    return (
      <Link to={href} className={cls} onClick={onClick}>
        {label}
      </Link>
    );
  }
  return (
    <a href={href} className={cls} onClick={onClick}>
      {label}
    </a>
  );
}

export function PremiumNav() {
  const { t } = useLandingPremiumT();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header className="lp-premium-nav fixed inset-x-0 top-0 z-50">
      <div className="lp-premium-nav__inner mx-auto h-[4.25rem] max-w-7xl px-4 sm:h-[4.5rem] sm:px-5 lg:h-[4.75rem] lg:px-8">
        <div className="grid h-full w-full grid-cols-[auto_1fr_auto] items-center gap-3 lg:gap-4">
          <Link to="/" className="lp-nav-logo flex h-10 shrink-0 items-center sm:h-11">
            <EmarzonaBrandLogo variant="nav" />
          </Link>

          <nav
            className="lp-nav-menu hidden min-w-0 justify-center lg:flex"
            aria-label="Navigation principale"
          >
            <div className="lp-nav-menu__pill flex max-w-full items-center gap-0.5 overflow-hidden rounded-full border border-white/[0.08] bg-white/[0.03] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              {navItems.map(item => (
                <NavLinkItem
                  key={item.key}
                  label={t(`nav.${item.key}`)}
                  href={item.href}
                  route={'route' in item ? item.route : undefined}
                />
              ))}
            </div>
          </nav>

          <div className="flex shrink-0 items-center justify-end gap-2 xl:gap-3">
            <div className="hidden items-center gap-2 lg:flex xl:gap-3">
              <PremiumLangSwitcher className="lp-nav-control" />
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
            </div>
            <div className="flex items-center gap-2 lg:hidden">
              <PremiumLangSwitcher className="lp-nav-control" />
              <button
                type="button"
                className="lp-nav-icon-btn flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/[0.04] text-white/90 transition-colors hover:border-white/22 hover:bg-white/[0.08]"
                onClick={() => setOpen(!open)}
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
            onClick={() => setOpen(false)}
          />
          <div className="lp-premium-nav__drawer fixed inset-x-0 top-[4.25rem] z-50 max-h-[calc(100dvh-4.25rem)] overflow-y-auto border-t border-white/10 px-5 py-6 sm:top-[4.5rem] lg:hidden">
            <nav className="flex flex-col gap-1">
              {navItems.map(item => (
                <NavLinkItem
                  key={item.key}
                  label={t(`nav.${item.key}`)}
                  href={item.href}
                  route={'route' in item ? item.route : undefined}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-3 text-base"
                />
              ))}
            </nav>
            <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-6">
              <Link
                to="/login"
                className="lp-btn-outline rounded-full py-3 text-center text-sm"
                onClick={() => setOpen(false)}
              >
                {t('nav.login')}
              </Link>
              <StoreCreateCtaLink
                className="lp-btn-primary rounded-full py-3.5 text-center text-sm font-semibold"
                onClick={() => setOpen(false)}
              >
                {t('nav.getStarted')}
              </StoreCreateCtaLink>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
