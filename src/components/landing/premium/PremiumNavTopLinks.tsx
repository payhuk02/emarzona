import { Link } from 'react-router-dom';
import type { TFunction } from 'i18next';
import { cn } from '@/lib/utils';
import { LANDING_PREMIUM_TOP_NAV } from '@/config/landing-premium-nav';

const landingNavPillLinkClass =
  'lp-nav-link whitespace-nowrap rounded-full px-2.5 py-1.5 text-xs font-medium tracking-wide transition-all duration-300 lg:px-3 lg:py-2 lg:text-[13px] xl:px-3.5';

const landingNavPillLinkIdleClass = 'text-white/60 hover:bg-white/[0.05] hover:text-white';
const landingNavPillLinkActiveClass =
  'bg-white/[0.08] text-[var(--lp-gold-bright)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]';

/**
 * Top links légers (sans Radix / panels mega) — fallback avant chargement de PremiumNavMega.
 */
export function PremiumNavTopLinks({ t, pathname }: { t: TFunction; pathname: string }) {
  return (
    <div
      data-testid="lp-nav-desktop-fallback"
      className="lp-nav-menu__pill flex max-w-full list-none items-center gap-0.5 rounded-full border border-white/[0.08] bg-white/[0.03] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
    >
      {LANDING_PREMIUM_TOP_NAV.map(item => {
        const isActive = item.kind === 'route' && pathname === item.href;
        const className = cn(
          landingNavPillLinkClass,
          isActive ? landingNavPillLinkActiveClass : landingNavPillLinkIdleClass
        );

        if (item.kind === 'route') {
          return (
            <Link
              key={item.key}
              to={item.href}
              data-testid={`lp-nav-link-${item.key}`}
              className={className}
            >
              {t(`nav.${item.key}`)}
            </Link>
          );
        }

        return (
          <a
            key={item.key}
            href={item.href}
            data-testid={`lp-nav-link-${item.key}`}
            className={className}
          >
            {t(`nav.${item.key}`)}
          </a>
        );
      })}
    </div>
  );
}
