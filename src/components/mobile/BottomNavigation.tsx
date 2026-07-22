/**
 * Navigation en bas pour mobile
 * Items dérivés de resolveNavItems (RBAC / feature flags alignés sur AppSidebar).
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useResolvedNavItems } from '@/hooks/useResolvedNavItems';
import { usePlanLockNavAction } from '@/hooks/usePlanLockNavAction';
import { isNavItemActive } from '@/config/navigation.helpers';
import { toCommerceNavPersona } from '@/config/navigation.persona';
import { useSidebarPersona } from '@/hooks/useSidebarPersona';
import { useAdmin } from '@/hooks/useAdmin';

interface BottomNavigationProps {
  position?: 'top' | 'bottom';
}

export const BottomNavigation = React.memo<BottomNavigationProps>(({ position = 'bottom' }) => {
  const location = useLocation();
  const { t } = useTranslation();
  const { isAdmin } = useAdmin();
  const { persona: sidebarPersona } = useSidebarPersona(isAdmin);
  const navPersona = toCommerceNavPersona(sidebarPersona);
  const navItems = useResolvedNavItems({ surface: 'bottomnav', persona: navPersona });
  const handlePlanLockedNav = usePlanLockNavAction();
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
          const isActive = isNavItemActive(item.url, location.pathname, location.search, 'prefix');
          const ariaLabel = item.locked
            ? t('sidebar.chrome.planLockTooltip', { item: item.title })
            : item.title;

          const itemClassName = cn(
            'relative flex flex-col items-center justify-center',
            'px-2 sm:px-3 py-2 rounded-lg transition-all duration-200',
            'min-w-[44px] min-h-[44px] touch-manipulation',
            'flex-1 max-w-[80px]',
            isTop ? 'gap-0.5 sm:gap-1' : 'gap-1',
            item.locked
              ? 'text-muted-foreground opacity-75'
              : isActive
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground active:text-foreground active:bg-accent/50'
          );

          const content = (
            <>
              <div className="relative flex items-center justify-center">
                <Icon
                  className={cn('flex-shrink-0', isTop ? 'w-5 h-5 sm:w-6 sm:h-6' : 'w-5 h-5')}
                  aria-hidden="true"
                />
                {item.locked && (
                  <Lock className="absolute -top-1 -right-1 h-2.5 w-2.5 opacity-80" aria-hidden />
                )}
              </div>
              <span
                className={cn(
                  'font-medium leading-tight text-center',
                  isTop ? 'text-xs sm:text-sm' : 'text-xs sm:text-sm'
                )}
              >
                {item.title}
              </span>
              {isActive && !item.locked && (
                <div
                  className={cn(
                    'absolute left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full',
                    isTop ? 'bottom-0' : 'top-0'
                  )}
                />
              )}
            </>
          );

          if (item.locked) {
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => handlePlanLockedNav(item.title, item.url)}
                className={itemClassName}
                aria-label={ariaLabel}
              >
                {content}
              </button>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.url}
              className={itemClassName}
              aria-label={ariaLabel}
              aria-current={isActive ? 'page' : undefined}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
});

BottomNavigation.displayName = 'BottomNavigation';
