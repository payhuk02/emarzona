/**
 * Navigation en bas pour mobile
 * Items dérivés de resolveNavItems (RBAC / feature flags alignés sur AppSidebar).
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useResolvedNavItems } from '@/hooks/useResolvedNavItems';

interface BottomNavigationProps {
  position?: 'top' | 'bottom';
}

export const BottomNavigation = React.memo<BottomNavigationProps>(({ position = 'bottom' }) => {
  const location = useLocation();
  const { t } = useTranslation();
  const navItems = useResolvedNavItems({ surface: 'bottomnav' });
  const isTop = position === 'top';

  return (
    <nav
      className={cn(
        'fixed left-0 right-0 z-50 bg-background border-border shadow-sm md:hidden',
        isTop ? 'top-0 border-b safe-area-top' : 'bottom-0 border-t safe-area-bottom'
      )}
      style={{
        position: 'fixed',
        ...(isTop ? { top: 0, bottom: 'auto' } : { bottom: 0, top: 'auto' }),
        left: 0,
        right: 0,
        zIndex: 50,
      }}
      aria-label={t('sidebar.chrome.bottomNavMain')}
    >
      <div className={cn('flex items-center justify-around px-1 sm:px-2', isTop ? 'h-14' : 'h-16')}>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));

          return (
            <Link
              key={item.path}
              to={item.url}
              className={cn(
                'relative flex flex-col items-center justify-center',
                'px-2 sm:px-3 py-2 rounded-lg transition-all duration-200',
                'min-w-[44px] min-h-[44px] touch-manipulation',
                'flex-1 max-w-[80px]',
                isTop ? 'gap-0.5 sm:gap-1' : 'gap-1',
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground active:text-foreground active:bg-accent/50'
              )}
              aria-label={item.title}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative flex items-center justify-center">
                <Icon
                  className={cn('flex-shrink-0', isTop ? 'w-5 h-5 sm:w-6 sm:h-6' : 'w-5 h-5')}
                  aria-hidden="true"
                />
              </div>
              <span
                className={cn(
                  'font-medium leading-tight text-center',
                  isTop ? 'text-xs sm:text-sm' : 'text-xs sm:text-sm'
                )}
              >
                {item.title}
              </span>
              {isActive && (
                <div
                  className={cn(
                    'absolute left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full',
                    isTop ? 'bottom-0' : 'top-0'
                  )}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
});

BottomNavigation.displayName = 'BottomNavigation';
