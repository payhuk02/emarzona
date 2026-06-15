/**
 * Barre de navigation horizontale contextuelle — mega-menus style Systeme.io / enterprise.
 * Desktop : NavigationMenu Radix. Mobile : drawer latéral vertical (sidebar) par domaine.
 */

import { useCallback, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Lock } from 'lucide-react';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useHorizontalContextNav } from '@/hooks/useHorizontalContextNav';
import type { HorizontalNavDomain, HorizontalNavLink } from '@/lib/navigation/resolveHorizontalNav';
import { usePlanLockNavAction } from '@/hooks/usePlanLockNavAction';
import { isNavItemActive } from '@/config/navigation.helpers';
import { resolveHorizontalNavPersona } from '@/config/navigation.horizontal';
import { useSidebarPersona } from '@/hooks/useSidebarPersona';
import { useAdmin } from '@/hooks/useAdmin';

type PanelVariant = 'mega' | 'sidebar';

function MegaMenuLink({
  item,
  onNavigate,
  onAfterNavigate,
  variant = 'mega',
}: {
  item: HorizontalNavLink;
  onNavigate: (item: HorizontalNavLink) => void;
  onAfterNavigate?: () => void;
  variant?: PanelVariant;
}) {
  const location = useLocation();
  const Icon = item.icon;
  const active = isNavItemActive(item.url, location.pathname, location.search, 'prefix');
  const linkClassName = cn(
    'flex w-full items-center gap-3 rounded-md text-sm transition-colors',
    variant === 'sidebar'
      ? 'min-h-[44px] touch-manipulation px-3 py-2.5'
      : 'items-start gap-2.5 px-2 py-2',
    'hover:bg-accent/60 focus:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    active && 'bg-primary/10 text-primary font-medium'
  );

  if (item.locked) {
    return (
      <button
        type="button"
        onClick={() => {
          onNavigate(item);
          onAfterNavigate?.();
        }}
        className={cn(linkClassName, 'text-left text-muted-foreground')}
      >
        <Icon className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
        <span className="flex-1 leading-snug">
          {item.title}
          <Lock className="inline-block ml-1 h-3 w-3 opacity-70" aria-hidden />
        </span>
      </button>
    );
  }

  if (variant === 'sidebar') {
    return (
      <NavLink to={item.url} onClick={() => onAfterNavigate?.()} className={linkClassName}>
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="leading-snug">{item.title}</span>
      </NavLink>
    );
  }

  return (
    <NavigationMenuLink asChild>
      <NavLink to={item.url} onClick={() => onAfterNavigate?.()} className={linkClassName}>
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="leading-snug">{item.title}</span>
      </NavLink>
    </NavigationMenuLink>
  );
}

function MegaMenuPanel({
  domain,
  onNavigate,
  onAfterNavigate,
  variant = 'mega',
}: {
  domain: HorizontalNavDomain;
  onNavigate: (item: HorizontalNavLink) => void;
  onAfterNavigate?: () => void;
  variant?: PanelVariant;
}) {
  const isSidebar = variant === 'sidebar';

  if (domain.subgroups) {
    return (
      <div
        className={cn(
          isSidebar
            ? 'flex flex-col gap-5 px-1 py-1'
            : 'grid gap-4 p-4 md:grid-cols-2 lg:grid-cols-3 md:w-[720px] lg:w-[880px] max-h-[min(70vh,520px)] overflow-y-auto'
        )}
      >
        {domain.subgroups.map(group => (
          <div key={group.groupKey} className="min-w-0 space-y-1">
            <p
              className={cn(
                'font-semibold uppercase tracking-wider text-muted-foreground',
                isSidebar ? 'px-3 text-xs' : 'px-2 text-[11px]'
              )}
            >
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(item => (
                <MegaMenuLink
                  key={item.url}
                  item={item}
                  onNavigate={onNavigate}
                  onAfterNavigate={onAfterNavigate}
                  variant={variant}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        isSidebar
          ? 'flex flex-col gap-0.5 px-1 py-1'
          : 'grid gap-1 p-4 sm:grid-cols-2 md:w-[520px] lg:w-[640px] max-h-[min(70vh,480px)] overflow-y-auto'
      )}
    >
      {domain.items.map(item => (
        <MegaMenuLink
          key={item.url}
          item={item}
          onNavigate={onNavigate}
          onAfterNavigate={onAfterNavigate}
          variant={variant}
        />
      ))}
    </div>
  );
}

function MobileDomainDrawer({
  domain,
  onNavigate,
}: {
  domain: HorizontalNavDomain;
  onNavigate: (item: HorizontalNavLink) => void;
}) {
  const [open, setOpen] = useState(false);
  const isDirectLink = domain.items.length <= 1 && domain.rootPath;

  if (isDirectLink && domain.rootPath) {
    return (
      <NavLink
        to={domain.rootPath}
        className={cn(
          'inline-flex h-9 shrink-0 items-center rounded-full px-3 text-xs font-medium',
          domain.isActive && 'bg-primary/10 text-primary'
        )}
      >
        {domain.shortLabel}
      </NavLink>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            'h-9 shrink-0 rounded-full px-3 text-xs font-medium gap-1 touch-manipulation',
            domain.isActive && 'bg-primary/10 text-primary'
          )}
          aria-expanded={open}
          aria-controls={`mobile-domain-drawer-${domain.domainKey}`}
        >
          {domain.shortLabel}
          <ChevronDown className="h-3 w-3 opacity-70" aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        id={`mobile-domain-drawer-${domain.domainKey}`}
        data-testid={`mobile-domain-drawer-${domain.domainKey}`}
        className="w-[min(88vw,300px)] sm:max-w-xs p-0 flex flex-col gap-0"
        aria-label={domain.label}
      >
        <SheetHeader className="shrink-0 border-b px-4 py-3 text-left space-y-0">
          <SheetTitle className="text-base">{domain.label}</SheetTitle>
        </SheetHeader>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-2 py-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <MegaMenuPanel
            domain={domain}
            onNavigate={onNavigate}
            onAfterNavigate={() => setOpen(false)}
            variant="sidebar"
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function HorizontalContextNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();
  const { persona: sidebarPersona } = useSidebarPersona(isAdmin);
  const handlePlanLockedNav = usePlanLockNavAction();
  const domains = useHorizontalContextNav();
  const isBuyerNav = resolveHorizontalNavPersona(location.pathname, sidebarPersona) === 'buyer';
  const navAriaLabel = isBuyerNav
    ? t('sidebar.chrome.horizontalContextNavBuyer', { defaultValue: 'Navigation acheteur' })
    : t('sidebar.chrome.horizontalContextNav', { defaultValue: 'Navigation par domaine' });

  const handleNavigate = useCallback(
    (item: HorizontalNavLink) => {
      if (item.locked) {
        handlePlanLockedNav(item.title, item.url);
        return;
      }
      navigate(item.url);
    },
    [navigate, handlePlanLockedNav]
  );

  if (domains.length === 0) return null;

  return (
    <div
      className="sticky top-11 sm:top-12 z-20 shrink-0 border-b border-border/50 bg-background/95 backdrop-blur-md shadow-[0_1px_0_0_hsl(var(--border)/0.4)]"
      data-testid="horizontal-context-nav"
    >
      <div className="hidden md:block px-3 lg:px-6">
        <NavigationMenu
          className="horizontal-context-nav-menu max-w-none w-full justify-start [&>div.absolute]:left-0 [&>div.absolute]:justify-start"
          aria-label={navAriaLabel}
        >
          <NavigationMenuList className="flex flex-wrap justify-start gap-0.5 py-1.5">
            {domains.map(domain => (
              <NavigationMenuItem key={domain.domainKey}>
                {domain.items.length <= 1 && domain.rootPath ? (
                  <NavigationMenuLink asChild>
                    <NavLink
                      to={domain.rootPath}
                      className={cn(
                        navigationMenuTriggerStyle(),
                        'h-9 px-3 text-sm font-medium',
                        domain.isActive && 'bg-primary/10 text-primary shadow-none'
                      )}
                    >
                      {domain.shortLabel}
                    </NavLink>
                  </NavigationMenuLink>
                ) : (
                  <>
                    <NavigationMenuTrigger
                      className={cn(
                        'h-9 bg-transparent px-3 text-sm font-medium data-[state=open]:bg-accent/50',
                        domain.isActive && 'text-primary bg-primary/5'
                      )}
                    >
                      {domain.shortLabel}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <MegaMenuPanel domain={domain} onNavigate={handleNavigate} />
                    </NavigationMenuContent>
                  </>
                )}
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      <div
        className="md:hidden flex items-center gap-1 overflow-x-auto px-3 py-2 scrollbar-hide"
        role="navigation"
        aria-label={navAriaLabel}
        data-testid="horizontal-context-nav-mobile"
      >
        {domains.map(domain => (
          <MobileDomainDrawer key={domain.domainKey} domain={domain} onNavigate={handleNavigate} />
        ))}
      </div>
    </div>
  );
}
