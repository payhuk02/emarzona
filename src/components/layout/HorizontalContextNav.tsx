/**
 * Barre de navigation horizontale contextuelle — mega-menus style Systeme.io / enterprise.
 * Desktop : DropdownMenu (portal) + scroll horizontal pour ne pas couper les libellés.
 * Mobile : drawer latéral vertical (sidebar) par domaine.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Lock } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useHorizontalContextNav } from '@/hooks/useHorizontalContextNav';
import type { HorizontalNavDomain, HorizontalNavLink } from '@/lib/navigation/resolveHorizontalNav';
import { usePlanLockNavAction } from '@/hooks/usePlanLockNavAction';
import { isNavItemActive } from '@/config/navigation.helpers';
import { toCommerceNavPersona } from '@/config/navigation.persona';
import { useSidebarPersona } from '@/hooks/useSidebarPersona';
import { useAdmin } from '@/hooks/useAdmin';
import { prefetchRouteChunk } from '@/lib/route-chunk-prefetch';

type PanelVariant = 'mega' | 'sidebar';

const domainTriggerClass = cn(
  'inline-flex min-h-11 h-11 shrink-0 items-center justify-center gap-1 rounded-md',
  'px-2.5 lg:px-3 text-sm font-medium whitespace-nowrap overflow-visible',
  'bg-transparent transition-colors touch-manipulation',
  'hover:bg-accent hover:text-accent-foreground',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
  'data-[state=open]:bg-accent/50'
);

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
    'group flex w-full items-center gap-2 rounded-md text-sm font-bold transition-colors duration-150 ease-out',
    variant === 'sidebar' ? 'min-h-[44px] touch-manipulation px-2.5 py-1.5' : 'px-2 py-1',
    'hover:bg-accent/80 focus:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
    active ? 'bg-primary/5 text-primary shadow-sm' : 'text-foreground/90 hover:text-foreground'
  );

  const renderContent = () => (
    <>
      <div
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition-colors',
          active
            ? 'border-primary/20 bg-primary/10 text-primary'
            : 'border-border/40 bg-background text-muted-foreground group-hover:border-foreground/20 group-hover:text-foreground'
        )}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden />
      </div>
      <span className="leading-tight break-words line-clamp-2 font-bold">
        {item.title}
        {item.locked && <Lock className="inline-block ml-1.5 h-3 w-3 opacity-70" aria-hidden />}
      </span>
    </>
  );

  if (item.locked) {
    return (
      <button
        type="button"
        onClick={() => {
          onNavigate(item);
          onAfterNavigate?.();
        }}
        className={cn(linkClassName, 'text-left')}
      >
        {renderContent()}
      </button>
    );
  }

  return (
    <NavLink to={item.url} onClick={() => onAfterNavigate?.()} className={linkClassName}>
      {renderContent()}
    </NavLink>
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
    const subgroupCount = domain.subgroups.length;
    let gridClass = 'grid gap-2 p-2 ';
    if (subgroupCount === 1) gridClass += 'grid-cols-1 w-[220px]';
    else if (subgroupCount === 2) gridClass += 'grid-cols-2 w-[400px]';
    else if (subgroupCount === 3) gridClass += 'grid-cols-3 w-[560px]';
    else gridClass += 'md:grid-cols-2 lg:grid-cols-3 md:w-[560px] lg:w-[720px]';

    return (
      <div
        className={cn(
          isSidebar
            ? 'flex flex-col gap-3 px-1 py-1'
            : `${gridClass} max-h-[min(74vh,560px)] overflow-y-auto bg-background/95 backdrop-blur-2xl border border-border/40 shadow-2xl rounded-xl`
        )}
      >
        {domain.subgroups.map(group => (
          <div key={group.groupKey} className="min-w-0 space-y-0.5">
            <p
              className={cn(
                'font-bold uppercase tracking-widest text-primary/80 mb-1',
                isSidebar ? 'px-2.5 text-sm' : 'px-2 text-sm'
              )}
            >
              {group.label}
            </p>
            <div className="space-y-0">
              {group.items.map(item => (
                <MegaMenuLink
                  key={`${group.groupKey}-${item.url}`}
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
          ? 'flex flex-col gap-0 px-1 py-1'
          : 'grid gap-0.5 p-2 sm:grid-cols-2 md:w-[440px] lg:w-[520px] max-h-[min(74vh,520px)] overflow-y-auto bg-background/95 backdrop-blur-2xl border border-border/40 shadow-2xl rounded-xl'
      )}
    >
      {domain.items.map(item => (
        <MegaMenuLink
          key={`${domain.domainKey}-${item.url}`}
          item={item}
          onNavigate={onNavigate}
          onAfterNavigate={onAfterNavigate}
          variant={variant}
        />
      ))}
    </div>
  );
}

function DesktopDomainItem({
  domain,
  onNavigate,
}: {
  domain: HorizontalNavDomain;
  onNavigate: (item: HorizontalNavLink) => void;
}) {
  const [open, setOpen] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDirectLink = domain.items.length <= 1 && domain.rootPath;

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const openMenu = useCallback(() => {
    clearCloseTimer();
    setOpen(true);
    if (domain.rootPath) prefetchRouteChunk(domain.rootPath);
    domain.items.slice(0, 6).forEach(item => prefetchRouteChunk(item.url));
  }, [clearCloseTimer, domain.rootPath, domain.items]);

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => setOpen(false), 160);
  }, [clearCloseTimer]);

  useEffect(() => () => clearCloseTimer(), [clearCloseTimer]);

  if (isDirectLink && domain.rootPath) {
    return (
      <NavLink
        to={domain.rootPath}
        className={cn(
          domainTriggerClass,
          domain.isActive && 'bg-primary/10 text-primary shadow-none'
        )}
        onMouseEnter={() => prefetchRouteChunk(domain.rootPath!)}
        onFocus={() => prefetchRouteChunk(domain.rootPath!)}
      >
        <span className="overflow-visible">{domain.shortLabel}</span>
      </NavLink>
    );
  }

  return (
    <DropdownMenu
      modal={false}
      open={open}
      onOpenChange={next => {
        clearCloseTimer();
        setOpen(next);
      }}
    >
      <DropdownMenuTrigger
        className={cn(domainTriggerClass, domain.isActive && 'text-primary bg-primary/5')}
        aria-label={domain.label}
        onMouseEnter={openMenu}
        onMouseLeave={scheduleClose}
        onPointerDown={e => {
          // Survol ouvre déjà ; éviter le toggle click qui ferme immédiatement
          if (open) e.preventDefault();
        }}
      >
        <span className="overflow-visible">{domain.shortLabel}</span>
        <ChevronDown
          className={cn(
            'h-3 w-3 shrink-0 opacity-70 transition-transform duration-200',
            open && 'rotate-180'
          )}
          aria-hidden
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={8}
        className="z-50 w-auto max-w-[min(95vw,720px)] overflow-visible border-0 bg-transparent p-0 shadow-none"
        onMouseEnter={openMenu}
        onMouseLeave={scheduleClose}
        onCloseAutoFocus={e => e.preventDefault()}
      >
        <MegaMenuPanel
          domain={domain}
          onNavigate={onNavigate}
          onAfterNavigate={() => setOpen(false)}
          variant="mega"
        />
      </DropdownMenuContent>
    </DropdownMenu>
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
          'inline-flex h-10 shrink-0 items-center rounded-full px-3 text-sm font-medium whitespace-nowrap',
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
            'h-10 shrink-0 rounded-full px-3 text-sm font-medium gap-1 touch-manipulation whitespace-nowrap',
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
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();
  const { persona: sidebarPersona } = useSidebarPersona(isAdmin);
  const handlePlanLockedNav = usePlanLockNavAction();
  const domains = useHorizontalContextNav();
  const isBuyerNav = toCommerceNavPersona(sidebarPersona) === 'buyer';
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
      className="relative z-40 shrink-0 border-b border-border/50 bg-background/95 backdrop-blur-md shadow-[0_1px_0_0_hsl(var(--border)/0.4)] md:sticky md:top-12"
      data-testid="horizontal-context-nav"
    >
      {/*
        Scroll horizontal OK : les mega-menus sont en DropdownMenu (portal body),
        donc plus de clip overflow-y forcé par overflow-x.
      */}
      <div
        className="hidden md:block overflow-x-auto scrollbar-hide px-3 lg:px-6"
        data-testid="horizontal-context-nav-desktop"
      >
        <nav
          className="flex w-max min-w-full flex-nowrap items-center justify-start gap-0.5 py-1.5 pr-2"
          aria-label={navAriaLabel}
        >
          {domains.map(domain => (
            <DesktopDomainItem key={domain.domainKey} domain={domain} onNavigate={handleNavigate} />
          ))}
        </nav>
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
