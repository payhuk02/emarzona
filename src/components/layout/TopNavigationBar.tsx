/**
 * Top Navigation Bar - Navigation principale horizontale
 * Inspiré de systeme.io
 */

import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePlatformLogo } from '@/hooks/usePlatformLogo';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { ThemeSelectorCompact } from '@/components/navigation/ThemeSelector';
import { Button } from '@/components/ui/button';
import { LazyImage } from '@/components/ui/lazy-image';
import {
  MobileDropdown,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/mobile-dropdown';
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
  LogOut,
  Menu,
} from '@/components/icons';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';
import { LoyaltyBadge } from '@/components/loyalty/LoyaltyBadge';

export const TopNavigationBar = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const platformLogo = usePlatformLogo();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Navigation principale avec i18n
  const mainNavItems = [
    { label: t('navigation.dashboard', 'Tableau de bord'), path: '/dashboard', icon: LayoutDashboard },
    { label: t('navigation.products', 'Produits'), path: '/dashboard/products', icon: Package },
    { label: t('navigation.orders', 'Commandes'), path: '/dashboard/orders', icon: ShoppingCart },
    { label: t('navigation.customers', 'Clients'), path: '/dashboard/customers', icon: Users },
    { label: t('navigation.marketing', 'Marketing'), path: '/dashboard/marketing', icon: Target },
    { label: t('navigation.emails', 'Emails'), path: '/dashboard/emails/campaigns', icon: Mail },
    { label: t('navigation.analytics', 'Analytics'), path: '/dashboard/analytics', icon: BarChart3 },
    { label: t('navigation.settings', 'Paramètres'), path: '/dashboard/settings', icon: Settings },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: t('auth.signOutSuccess', 'Déconnexion réussie'),
        description: t('auth.signOutSuccessDescription', 'Vous avez été déconnecté avec succès.'),
      });
    } catch (error) {
      toast({
        title: t('common.error', 'Erreur'),
        description: t('auth.signOutError', 'Une erreur est survenue lors de la déconnexion.'),
        variant: 'destructive',
      });
    }
  };

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <NavLink to="/dashboard" className="flex items-center gap-2 shrink-0">
            {platformLogo ? (
              <LazyImage
                src={platformLogo}
                alt="Emarzona"
                className="h-8 w-8 object-contain"
              />
            ) : (
              <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-bold text-primary">E</span>
              </div>
            )}
            <span className="hidden sm:inline-block text-lg font-bold text-foreground">
              Emarzona
            </span>
          </NavLink>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center max-w-4xl">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Mobile Menu Button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
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
                      <LazyImage
                        src={platformLogo}
                        alt="Emarzona"
                        className="h-8 w-8 object-contain"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded bg-primary/20 flex items-center justify-center">
                        <span className="text-sm font-bold">E</span>
                      </div>
                    )}
                    <span className="text-lg font-bold">Emarzona</span>
                  </div>
                </div>
                <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                  {mainNavItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`
                          flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                          ${
                            active
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-muted'
                          }
                        `}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </nav>
                {/* Language Switcher dans le menu mobile */}
                <div className="p-4 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{t('common.language', 'Langue')}</span>
                  </div>
                  <LanguageSwitcher variant="outline" showLabel={true} className="w-full" />
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Right Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Notifications */}
            <div className="hidden sm:block">
              <NotificationBell />
            </div>

            {/* Theme Selector (compact) */}
            <div className="hidden md:block w-32">
              <ThemeSelectorCompact />
            </div>

            {/* Language Switcher - Visible sur desktop et tablette */}
            <div className="hidden sm:block">
              <LanguageSwitcher variant="outline" showLabel={false} />
            </div>

            {/* Loyalty Badge */}
            <div className="hidden sm:block">
              <LoyaltyBadge />
            </div>

            {/* User Menu */}
            <MobileDropdown
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-accent touch-manipulation"
                  aria-label="Menu utilisateur"
                >
                  <User className="h-5 w-5" />
                </Button>
              }
              align="end"
              side="bottom"
              width={224}
              contentClassName="w-56"
            >
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-2">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">
                      {user?.user_metadata?.full_name || user?.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                  {/* Loyalty Badge in User Menu */}
                  <div className="flex justify-center">
                    <LoyaltyBadge size="sm" />
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <NavLink to="/account/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  {t('navigation.myProfile', 'Mon Profil')}
                </NavLink>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <NavLink to="/dashboard/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  {t('navigation.settings', 'Paramètres')}
                </NavLink>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                {t('auth.signOut', 'Déconnexion')}
              </DropdownMenuItem>
            </MobileDropdown>
          </div>
        </div>
      </div>
    </header>
  );
};







