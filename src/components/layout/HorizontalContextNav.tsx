/**
 * Barre de navigation horizontale contextuelle — mega-menus style Systeme.io / enterprise.
 * Remplace la sidebar contextuelle verticale sur desktop ; scroll + sheets sur mobile.
 */

import { useCallback, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
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
import { useLocation } from 'react-router-dom';

function MegaMenuLink({
  item,
  onNavigate,
  onAfterNavigate,
}: {
  item: HorizontalNavLink;
  onNavigate: (item: HorizontalNavLink) => void;
  onAfterNavigate?: () => void;
}) {
  const location = useLocation();
  const Icon = item.icon;
  const active = isNavItemActive(item.url, location.pathname, location.search, 'prefix');

  if (item.locked) {
    return (
      <button
        type="button"
        onClick={() => {
          onNavigate(item);
          onAfterNavigate?.();
        }}
        className="flex w-full items-start gap-2.5 rounded-md px-2 py-2 text-left text-sm text-muted-foreground hover:bg-accent/60 transition-colors"
      >
        <Icon className="mt-0.5 h-4 w-4 shrink-0 opacity-60" aria-hidden />
        <span className="flex-1 leading-snug">
          {item.title}
          <Lock className="inline-block ml-1 h-3 w-3 opacity-70" aria-hidden />
        </span>
      </button>
    );
  }

  return (
    <NavigationMenuLink asChild>
      <NavLink
        to={item.url}
        onClick={() => onAfterNavigate?.()}
        className={cn(
          'flex items-start gap-2.5 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent/60 focus:bg-accent/60',
          active && 'bg-primary/10 text-primary font-medium'
        )}
      >
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
}: {
  domain: HorizontalNavDomain;
  onNavigate: (item: HorizontalNavLink) => void;
  onAfterNavigate?: () => void;
}) {
  if (domain.subgroups) {
    return (
      <div className="grid gap-4 p-4 md:grid-cols-2 lg:grid-cols-3 md:w-[720px] lg:w-[880px] max-h-[min(70vh,520px)] overflow-y-auto">
        {domain.subgroups.map(group => (
          <div key={group.groupKey} className="min-w-0 space-y-1">
            <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(item => (
                <MegaMenuLink
                  key={item.url}
                  item={item}
                  onNavigate={onNavigate}
                  onAfterNavigate={onAfterNavigate}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-1 p-4 sm:grid-cols-2 md:w-[520px] lg:w-[640px] max-h-[min(70vh,480px)] overflow-y-auto">
      {domain.items.map(item => (
        <MegaMenuLink
          key={item.url}
          item={item}
          onNavigate={onNavigate}
          onAfterNavigate={onAfterNavigate}
        />
      ))}
    </div>
  );
}

function MobileDomainSheet({
  domain,
  onNavigate,
}: {
  domain: HorizontalNavDomain;
  onNavigate: (item: HorizontalNavLink) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            'h-9 shrink-0 rounded-full px-3 text-xs font-medium gap-1',
            domain.isActive && 'bg-primary/10 text-primary'
          )}
        >
          {domain.shortLabel}
          <ChevronDown className="h-3 w-3 opacity-70" aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-xl">
        <SheetHeader>
          <SheetTitle>{domain.label}</SheetTitle>
        </SheetHeader>
        <div className="mt-4 pb-6">
          <MegaMenuPanel
            domain={domain}
            onNavigate={onNavigate}
            onAfterNavigate={() => setOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function HorizontalContextNav() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const handlePlanLockedNav = usePlanLockNavAction();
  const domains = useHorizontalContextNav();

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
          aria-label={t('sidebar.chrome.horizontalContextNav', {
            defaultValue: 'Navigation par domaine',
          })}
        >
          <NavigationMenuList className="flex flex-wrap justify-start gap-0.5 py-1.5">
            {domains.map(domain => (
              <NavigationMenuItem key={domain.sectionKey}>
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
        aria-label={t('sidebar.chrome.horizontalContextNav', {
          defaultValue: 'Navigation contextuelle',
        })}
      >
        {domains.map(domain => (
          <MobileDomainSheet key={domain.sectionKey} domain={domain} onNavigate={handleNavigate} />
        ))}
      </div>
    </div>
  );
}
