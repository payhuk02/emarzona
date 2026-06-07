/**
 * Top Navigation Bar - Navigation principale horizontale
 * Inspiré de systeme.io
 */

import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePlatformLogo } from '@/hooks/usePlatformLogo';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { UserUtilityActions } from '@/components/layout/UserUtilityActions';
import { ThemeSelectorCompact } from '@/components/navigation/ThemeSelector';
import { Button } from '@/components/ui/button';
import { LazyImage } from '@/components/ui/lazy-image';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Target,
  Mail,
  BarChart3,
  Settings,
  User,
  Menu,
} from '@/components/icons';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { LoyaltyBadge } from '@/components/loyalty/LoyaltyBadge';
import { cn } from '@/lib/utils';

export const TopNavigationBar = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const platformLogo = usePlatformLogo();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const mainNavItems = [
    {
      label: t('navigation.dashboard', 'Tableau de bord'),
      path: '/dashboard',
      icon: LayoutDashboard,
    },
    { label: t('navigation.products', 'Produits'), path: '/dashboard/products', icon: Package },
    { label: t('navigation.orders', 'Commandes'), path: '/dashboard/orders', icon: ShoppingCart },
    { label: t('navigation.customers', 'Clients'), path: '/dashboard/customers', icon: Users },
    { label: t('navigation.marketing', 'Marketing'), path: '/dashboard/marketing', icon: Target },
    { label: t('navigation.emails', 'Emails'), path: '/dashboard/emails/campaigns', icon: Mail },
    {
      label: t('navigation.analytics', 'Analytics'),
      path: '/dashboard/analytics',
      icon: BarChart3,
    },
    { label: t('navigation.settings', 'Paramètres'), path: '/dashboard/settings', icon: Settings },
  ];

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

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
              <span className="hidden sm:inline-block text-lg font-bold">Emarzona</span>
            </NavLink>

            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="topnav-icon-btn lg:hidden h-9 w-9 touch-manipulation"
                  aria-label="Ouvrir le menu de navigation"
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
                      <span className="text-lg font-bold">Emarzona</span>
                    </div>
                  </div>
                  <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                    {mainNavItems.map(item => {
                      const Icon = item.icon;
                      const active = isActive(item.path);
                      return (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                            active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                          )}
                        >
                          <Icon className="h-5 w-5" />
                          <span>{item.label}</span>
                        </NavLink>
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
            aria-label="Navigation principale"
          >
            {mainNavItems.map(item => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  title={item.label}
                  className={cn(
                    'topnav-main-link inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md px-2.5 xl:px-3 text-xs xl:text-sm font-medium transition-colors whitespace-nowrap',
                    active
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-white/10 hover:text-white'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="hidden xl:inline">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 ml-auto">
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
                  aria-label="Menu utilisateur"
                >
                  <User className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle>Menu utilisateur</SheetTitle>
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
