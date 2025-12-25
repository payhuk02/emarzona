/**
 * Navigation en bas pour mobile
 * Optimisée pour les appareils tactiles
 * Affiche les pages principales avec icônes
 * Typographie ≥ 14px et touch targets ≥ 44px
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Home,
  ShoppingBag,
  ShoppingCart,
  User,
  Menu,
  Store,
  Package,
  BarChart3,
} from 'lucide-react';

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  badge?: number;
}

const navItems: NavItem[] = [
  {
    label: 'Accueil',
    icon: Home,
    path: '/',
  },
  {
    label: 'Boutique',
    icon: Store,
    path: '/dashboard/store',
  },
  {
    label: 'Produits',
    icon: Package,
    path: '/dashboard/products',
  },
  {
    label: 'Panier',
    icon: ShoppingCart,
    path: '/cart',
    badge: 0, // TODO: Récupérer depuis le contexte panier
  },
  {
    label: 'Compte',
    icon: User,
    path: '/account',
  },
];

interface BottomNavigationProps {
  position?: 'top' | 'bottom';
}

export const BottomNavigation = React.memo<BottomNavigationProps>(({ position = 'bottom' }) => {
  const location = useLocation();
  const isTop = position === 'top';

  return (
    <nav
      className={cn(
        'fixed left-0 right-0 z-50 bg-background border-border shadow-sm md:hidden',
        isTop 
          ? 'top-0 border-b safe-area-top' 
          : 'bottom-0 border-t safe-area-bottom'
      )}
      style={{
        position: 'fixed',
        ...(isTop ? { top: 0, bottom: 'auto' } : { bottom: 0, top: 'auto' }),
        left: 0,
        right: 0,
        zIndex: 50
      }}
      aria-label="Navigation principale"
    >
      <div className={cn(
        'flex items-center justify-around px-1 sm:px-2',
        isTop ? 'h-14' : 'h-16'
      )}>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center',
                'px-2 sm:px-3 py-2 rounded-lg transition-all duration-200',
                'min-w-[44px] min-h-[44px] touch-manipulation',
                'flex-1 max-w-[80px]',
                isTop ? 'gap-0.5 sm:gap-1' : 'gap-1',
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground active:text-foreground active:bg-accent/50'
              )}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative flex items-center justify-center">
                <Icon className={cn(
                  'flex-shrink-0',
                  isTop ? 'w-5 h-5 sm:w-6 sm:h-6' : 'w-5 h-5'
                )} aria-hidden="true" />
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] sm:text-xs font-semibold text-white bg-destructive rounded-full"
                    aria-label={`${item.badge} éléments`}
                  >
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className={cn(
                'font-medium leading-tight text-center',
                isTop ? 'text-xs sm:text-sm' : 'text-xs sm:text-sm'
              )}>
                {item.label}
              </span>
              {isActive && (
                <div className={cn(
                  'absolute left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full',
                  isTop ? 'bottom-0' : 'top-0'
                )} />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
});

BottomNavigation.displayName = 'BottomNavigation';
