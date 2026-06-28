/**
 * Top Navigation Bar - Navigation principale horizontale
 * Items dérivés de resolveNavItems (même pipeline RBAC / plan / feature flags que AppSidebar).
 */

import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePlatformLogo } from '@/hooks/usePlatformLogo';
import { EmarzonaBrandName } from '@/components/brand/EmarzonaBrandName';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { UserUtilityActions } from '@/components/layout/UserUtilityActions';
import { ThemeSelectorCompact } from '@/components/navigation/ThemeSelector';
import { Button } from '@/components/ui/button';
import { LazyImage } from '@/components/ui/lazy-image';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { User, Menu, Settings } from '@/components/icons';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { LoyaltyBadge } from '@/components/loyalty/LoyaltyBadge';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useResolvedNavItems } from '@/hooks/useResolvedNavItems';
import { isNavItemActive } from '@/config/navigation.helpers';
import { usePlanLockNavAction } from '@/hooks/usePlanLockNavAction';
import type { ResolvedNavItem } from '@/lib/navigation/resolveNavItems';
import { useProgressiveUX } from '@/hooks/useProgressiveUX';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

function TopNavMainLink({
  item,
  active,
  onLockedClick,
  className,
  showLabel = true,
  onNavigate,
}: {
  item: ResolvedNavItem;
  active: boolean;
  onLockedClick: (title: string, url: string) => void;
  className: string;
  showLabel?: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const content = (
    <>
      <Icon className="h-4 w-4 shrink-0" />
      <span className={showLabel ? undefined : 'hidden xl:inline'}>{item.title}</span>
      {item.locked && <Lock className="h-3 w-3 shrink-0 opacity-70" aria-hidden />}
    </>
  );

  if (item.locked) {
    return (
      <button
        type="button"
        onClick={() => onLockedClick(item.title, item.url)}
        className={className}
        title={item.title}
        aria-label={item.title}
      >
        {content}
      </button>
    );
  }

  return (
    <NavLink
      to={item.url}
      onClick={onNavigate}
      title={item.title}
      aria-label={item.title}
      className={className}
      aria-current={active ? 'page' : undefined}
    >
      {content}
    </NavLink>
  );
}

export const TopNavigationBar = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const platformLogo = usePlatformLogo();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mainNavItems = useResolvedNavItems({ surface: 'topnav' });
  const handlePlanLockedNav = usePlanLockNavAction();
  const { isExpertMode, toggleExpertMode } = useProgressiveUX();

  const isActive = (url: string) =>
    isNavItemActive(url, location.pathname, location.search, 'prefix');

  return (
    <header className="app-premium-topnav fixed top-0 left-0 right-0 z-50 border-b shadow-sm overflow-visible">
      <div className="mx-auto w-full max-w-[100vw] px-3 sm:px-4 lg:px-5">
        <div className="flex h-16 items-center gap-2 sm:gap-3 min-w-0 w-full">
          <div className="flex items-center gap-0.5 shrink-0">
            <NavLink
              to="/dashboard"
              className="topnav-brand flex items-center gap-2 shrink-0 text-white hover:text-white"
            >
              {platformLogo ? (
                <div className="h-8 w-8 flex-shrink-0">
                  <LazyImage
                    src={platformLogo}
                    alt="Emarzona"
                    className="object-contain w-full h-full"
                  />
                </div>
              ) : (
                <div className="h-8 w-8 rounded bg-white/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">E</span>
                </div>
              )}
              <EmarzonaBrandName className="hidden text-lg sm:inline-block" />
            </NavLink>

            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="topnav-icon-btn lg:hidden h-9 w-9 touch-manipulation"
                  aria-label={t('sidebar.chrome.topNavOpenMenu')}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b">
                    <div className="flex items-center gap-2">
                      {platformLogo ? (
                        <div className="h-8 w-8 flex-shrink-0">
                          <LazyImage
                            src={platformLogo}
                            alt="Emarzona"
                            className="object-contain w-full h-full"
                          />
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded bg-primary/20 flex items-center justify-center">
                          <span className="text-sm font-bold">E</span>
                        </div>
                      )}
                      <EmarzonaBrandName className="text-lg" />
                    </div>
                  </div>
                  <nav
                    className="flex-1 overflow-y-auto p-4 space-y-1"
                    aria-label={t('sidebar.chrome.topNavMain')}
                  >
                    {mainNavItems.map(item => {
                      const active = isActive(item.url);
                      return (
                        <TopNavMainLink
                          key={item.path}
                          item={item}
                          active={active}
                          onLockedClick={handlePlanLockedNav}
                          onNavigate={() => setMobileMenuOpen(false)}
                          className={cn(
                            'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors w-full',
                            active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                            item.locked && 'opacity-75'
                          )}
                        />
                      );
                    })}
                  </nav>
                  <div className="p-4 border-t space-y-4">
                    <div>
                      <span className="text-sm font-medium mb-2 block">
                        {t('common.theme', 'Thème')}
                      </span>
                      <ThemeSelectorCompact variant="select" />
                    </div>
                    <UserUtilityActions variant="floating" className="w-full justify-between" />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <nav
            className="topnav-main-nav hidden lg:flex items-center gap-0.5 xl:gap-1 flex-1 min-w-0 overflow-x-auto scrollbar-hide px-1"
            aria-label={t('sidebar.chrome.topNavMain')}
          >
            {mainNavItems.map(item => {
              const active = isActive(item.url);
              return (
                <TopNavMainLink
                  key={item.path}
                  item={item}
                  active={active}
                  onLockedClick={handlePlanLockedNav}
                  showLabel={false}
                  className={cn(
                    'topnav-main-link inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md px-2.5 xl:px-3 text-xs xl:text-sm font-medium transition-colors whitespace-nowrap',
                    active
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-white/10 hover:text-white',
                    item.locked && 'opacity-75'
                  )}
                />
              );
            })}
          </nav>

          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 ml-auto">
            {/* 🔒 UX Progressive Toggle */}
            <div className="hidden md:flex items-center gap-2 mr-2 px-2 border-r">
              <Label
                htmlFor="expert-mode"
                className="text-xs font-medium text-muted-foreground whitespace-nowrap cursor-pointer hover:text-foreground"
              >
                Mode Expert
              </Label>
              <Switch
                id="expert-mode"
                checked={isExpertMode}
                onCheckedChange={toggleExpertMode}
                className="scale-75 data-[state=checked]:bg-primary"
              />
            </div>

            <NotificationBell />
            <ThemeSelectorCompact variant="nav" className="hidden sm:inline-flex" />
            <UserUtilityActions variant="topnav" />
            <div className="hidden xl:flex shrink-0">
              <LoyaltyBadge display="nav" />
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="topnav-icon-btn h-9 w-9 min-h-9 min-w-9 touch-manipulation"
                  aria-label={t('sidebar.chrome.topNavUserMenu')}
                >
                  <User className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle>{t('sidebar.chrome.topNavUserMenu')}</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col space-y-4 mt-6">
                  <div className="flex flex-col space-y-2 p-4 bg-muted/50 rounded-lg">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">
                        {user?.user_metadata?.full_name || user?.email}
                      </p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                    <div className="flex justify-center">
                      <LoyaltyBadge size="sm" />
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <NavLink
                      to="/account/profile"
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer"
                    >
                      <User className="h-5 w-5" />
                      <span>{t('navigation.myProfile', 'Mon Profil')}</span>
                    </NavLink>
                    <NavLink
                      to="/dashboard/settings"
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer"
                    >
                      <Settings className="h-5 w-5" />
                      <span>{t('navigation.settings', 'Paramètres')}</span>
                    </NavLink>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};
