import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { Link } from 'react-router-dom';
import * as NavigationMenuPrimitive from '@radix-ui/react-navigation-menu';
import { ChevronDown } from 'lucide-react';
import type { TFunction } from 'i18next';
import { cn } from '@/lib/utils';
import {
  LANDING_PREMIUM_MEGA_MENUS,
  LANDING_PREMIUM_TOP_NAV,
  type LandingPremiumHrefKind,
  type LandingPremiumMegaId,
  type LandingPremiumMegaLink,
  type LandingPremiumMegaMenu,
  type LandingPremiumTopNavItem,
} from '@/config/landing-premium-nav';

const landingNavPillLinkClass =
  'lp-nav-link whitespace-nowrap rounded-full px-2.5 py-1.5 text-xs font-medium tracking-wide transition-all duration-300 lg:px-3 lg:py-2 lg:text-[13px] xl:px-3.5';

const landingNavPillLinkIdleClass = 'text-white/60 hover:bg-white/[0.05] hover:text-white';
const landingNavPillLinkActiveClass =
  'bg-white/[0.08] text-[var(--lp-gold-bright)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]';

type PremiumNavHrefProps = Omit<ComponentPropsWithoutRef<'a'>, 'href'> & {
  href: string;
  kind: LandingPremiumHrefKind;
  active?: boolean;
};

export const PremiumNavHref = forwardRef<HTMLAnchorElement, PremiumNavHrefProps>(
  function PremiumNavHref({ href, kind, active, className, children, ...props }, ref) {
    const cls = cn(className, active && landingNavPillLinkActiveClass);

    if (kind === 'route') {
      return (
        <Link ref={ref} to={href} className={cls} {...props}>
          {children}
        </Link>
      );
    }

    return (
      <a ref={ref} href={href} className={cls} {...props}>
        {children}
      </a>
    );
  }
);

function megaItemCopy(t: TFunction, menuId: LandingPremiumMegaId, itemKey: string) {
  return {
    title: t(`nav.mega.${menuId}.items.${itemKey}.title`),
    desc: t(`nav.mega.${menuId}.items.${itemKey}.desc`),
  };
}

function MegaItemLink({
  t,
  menuId,
  item,
  onNavigate,
  featured = false,
}: {
  t: TFunction;
  menuId: LandingPremiumMegaId;
  item: LandingPremiumMegaLink;
  onNavigate?: () => void;
  featured?: boolean;
}) {
  const { title, desc } = megaItemCopy(t, menuId, item.key);
  const Icon = item.icon;

  return (
    <PremiumNavHref
      href={item.href}
      kind={item.kind}
      onClick={onNavigate}
      data-testid={`lp-nav-item-${menuId}-${item.key}`}
      className={cn(
        'group/item flex gap-3 rounded-xl text-left transition-colors',
        featured
          ? 'h-full flex-col border border-white/10 bg-white/[0.04] p-4 hover:border-white/18 hover:bg-white/[0.07]'
          : 'items-start px-2 py-2 hover:bg-white/[0.06]'
      )}
    >
      <span
        className={cn(
          'flex shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/70',
          featured ? 'mb-3 h-10 w-10' : 'mt-0.5 h-8 w-8'
        )}
      >
        <Icon className={featured ? 'h-5 w-5' : 'h-4 w-4'} strokeWidth={1.5} aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-white/90 group-hover/item:text-white">
          {title}
        </span>
        <span className="mt-0.5 block text-xs leading-relaxed text-white/45">{desc}</span>
      </span>
    </PremiumNavHref>
  );
}

function MegaPanel({
  t,
  menu,
  onNavigate,
}: {
  t: TFunction;
  menu: LandingPremiumMegaMenu;
  onNavigate?: () => void;
}) {
  const colCount = menu.columns.length + (menu.featured ? 1 : 0);

  return (
    <div
      data-testid={`lp-nav-panel-${menu.id}`}
      className="lp-nav-mega-panel w-[min(calc(100vw-2rem),44rem)] overflow-hidden rounded-2xl border border-white/10 text-white"
    >
      <div
        className={cn(
          'grid gap-6 p-4 sm:p-5',
          colCount >= 3
            ? 'sm:grid-cols-3'
            : colCount === 2
              ? 'sm:grid-cols-[1fr_13.5rem]'
              : 'grid-cols-1'
        )}
      >
        {menu.columns.map(column => (
          <div key={column.key} className="min-w-0">
            <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">
              {t(`nav.mega.${menu.id}.columns.${column.key}`)}
            </p>
            <div className="space-y-0.5">
              {column.items.map(item => (
                <MegaItemLink
                  key={item.key}
                  t={t}
                  menuId={menu.id}
                  item={item}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>
        ))}
        {menu.featured ? (
          <MegaItemLink
            t={t}
            menuId={menu.id}
            item={menu.featured}
            onNavigate={onNavigate}
            featured
          />
        ) : null}
      </div>
      {menu.footer ? (
        <div className="border-t border-white/10 px-5 py-3">
          <PremiumNavHref
            href={menu.footer.href}
            kind={menu.footer.kind}
            onClick={onNavigate}
            data-testid={`lp-nav-item-${menu.id}-footer`}
            className="text-sm font-medium text-white/70 transition-colors hover:text-white"
          >
            {t(`nav.mega.${menu.id}.footer`)}
          </PremiumNavHref>
        </div>
      ) : null}
    </div>
  );
}

function contentAlignClass(id: LandingPremiumMegaId): string {
  if (id === 'features') return 'left-1/2 -translate-x-1/2';
  if (id === 'resources') return 'right-0';
  return 'left-0';
}

function DesktopMegaTrigger({
  t,
  item,
  pathname,
}: {
  t: TFunction;
  item: LandingPremiumTopNavItem;
  pathname: string;
}) {
  const isActive = item.kind === 'route' && pathname === item.href;

  return (
    <NavigationMenuPrimitive.Trigger asChild>
      <PremiumNavHref
        href={item.href}
        kind={item.kind}
        active={isActive}
        data-testid={`lp-nav-trigger-${item.mega}`}
        className={cn(
          landingNavPillLinkClass,
          landingNavPillLinkIdleClass,
          'group inline-flex items-center gap-0.5 data-[state=open]:bg-white/[0.08] data-[state=open]:text-white data-[state=open]:[&_svg]:rotate-180'
        )}
        aria-haspopup="menu"
      >
        {t(`nav.${item.key}`)}
        <ChevronDown
          className="relative top-px h-3 w-3 opacity-55 transition-transform duration-200 group-data-[state=open]:rotate-180"
          aria-hidden
        />
      </PremiumNavHref>
    </NavigationMenuPrimitive.Trigger>
  );
}

export function PremiumNavDesktopMenu({ t, pathname }: { t: TFunction; pathname: string }) {
  return (
    <NavigationMenuPrimitive.Root
      data-testid="lp-nav-desktop"
      delayDuration={150}
      skipDelayDuration={250}
      className="relative z-50 flex max-w-full justify-center"
    >
      <NavigationMenuPrimitive.List className="lp-nav-menu__pill flex max-w-full list-none items-center gap-0.5 rounded-full border border-white/[0.08] bg-white/[0.03] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
        {LANDING_PREMIUM_TOP_NAV.map(item => {
          if (!item.mega) {
            const isActive = item.kind === 'route' && pathname === item.href;
            return (
              <NavigationMenuPrimitive.Item key={item.key}>
                <NavigationMenuPrimitive.Link asChild>
                  <PremiumNavHref
                    href={item.href}
                    kind={item.kind}
                    active={isActive}
                    data-testid={`lp-nav-link-${item.key}`}
                    className={cn(
                      landingNavPillLinkClass,
                      isActive ? landingNavPillLinkActiveClass : landingNavPillLinkIdleClass
                    )}
                  >
                    {t(`nav.${item.key}`)}
                  </PremiumNavHref>
                </NavigationMenuPrimitive.Link>
              </NavigationMenuPrimitive.Item>
            );
          }

          const menu = LANDING_PREMIUM_MEGA_MENUS[item.mega];
          return (
            <NavigationMenuPrimitive.Item key={item.key} className="relative">
              <DesktopMegaTrigger t={t} item={item} pathname={pathname} />
              <NavigationMenuPrimitive.Content
                className={cn(
                  'absolute top-full z-[60] pt-2 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
                  contentAlignClass(item.mega)
                )}
              >
                <MegaPanel t={t} menu={menu} />
              </NavigationMenuPrimitive.Content>
            </NavigationMenuPrimitive.Item>
          );
        })}
      </NavigationMenuPrimitive.List>
    </NavigationMenuPrimitive.Root>
  );
}

export function PremiumNavMobileList({
  t,
  pathname,
  openMega,
  onOpenMega,
  onNavigate,
}: {
  t: TFunction;
  pathname: string;
  openMega: LandingPremiumMegaId | null;
  onOpenMega: (id: LandingPremiumMegaId | null) => void;
  onNavigate: () => void;
}) {
  return (
    <nav className="flex flex-col gap-1" aria-label="Navigation principale">
      {LANDING_PREMIUM_TOP_NAV.map(item => {
        if (!item.mega) {
          const isActive = item.kind === 'route' && pathname === item.href;
          return (
            <PremiumNavHref
              key={item.key}
              href={item.href}
              kind={item.kind}
              active={isActive}
              onClick={onNavigate}
              data-testid={`lp-nav-mobile-link-${item.key}`}
              className={cn(
                landingNavPillLinkClass,
                'rounded-xl px-4 py-3 text-base',
                isActive ? landingNavPillLinkActiveClass : landingNavPillLinkIdleClass
              )}
            >
              {t(`nav.${item.key}`)}
            </PremiumNavHref>
          );
        }

        const megaId = item.mega;
        const menu = LANDING_PREMIUM_MEGA_MENUS[megaId];
        const expanded = openMega === megaId;
        const panelId = `lp-nav-mobile-panel-${megaId}`;

        return (
          <div key={item.key} className="rounded-xl">
            <button
              type="button"
              className={cn(
                landingNavPillLinkClass,
                landingNavPillLinkIdleClass,
                'flex w-full items-center justify-between rounded-xl px-4 py-3 text-base'
              )}
              aria-expanded={expanded}
              aria-controls={panelId}
              aria-haspopup="menu"
              data-testid={`lp-nav-mobile-accordion-${megaId}`}
              onClick={() => onOpenMega(expanded ? null : megaId)}
            >
              {t(`nav.${item.key}`)}
              <ChevronDown
                className={cn('h-4 w-4 opacity-55 transition-transform', expanded && 'rotate-180')}
                aria-hidden
              />
            </button>
            {expanded ? (
              <div id={panelId} className="mb-2 space-y-3 border-l border-white/10 py-1 pl-3">
                {menu.columns.map(column => (
                  <div key={column.key}>
                    <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">
                      {t(`nav.mega.${menu.id}.columns.${column.key}`)}
                    </p>
                    {column.items.map(link => {
                      const { title } = megaItemCopy(t, menu.id, link.key);
                      return (
                        <PremiumNavHref
                          key={link.key}
                          href={link.href}
                          kind={link.kind}
                          onClick={onNavigate}
                          className="block rounded-lg px-2 py-2 text-sm text-white/70 hover:bg-white/[0.05] hover:text-white"
                        >
                          {title}
                        </PremiumNavHref>
                      );
                    })}
                  </div>
                ))}
                {menu.featured ? (
                  <PremiumNavHref
                    href={menu.featured.href}
                    kind={menu.featured.kind}
                    onClick={onNavigate}
                    className="block rounded-lg px-2 py-2 text-sm text-white/70 hover:bg-white/[0.05] hover:text-white"
                  >
                    {megaItemCopy(t, menu.id, menu.featured.key).title}
                  </PremiumNavHref>
                ) : null}
                {menu.footer ? (
                  <PremiumNavHref
                    href={menu.footer.href}
                    kind={menu.footer.kind}
                    onClick={onNavigate}
                    className="block rounded-lg px-2 py-2 text-sm font-medium text-white/80 hover:text-white"
                  >
                    {t(`nav.mega.${menu.id}.footer`)}
                  </PremiumNavHref>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
