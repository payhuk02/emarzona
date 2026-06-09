/**
 * Context Sidebar Nav Item - Composant réutilisable pour les items de navigation
 * Design professionnel et responsive avec animations fluides
 * Supporte le mode horizontal pour mobile (barre en bas)
 */

import { NavLink, useLocation } from 'react-router-dom';
import type { ComponentType } from 'react';
import { Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

type ContextNavIcon = ComponentType<{ className?: string }>;

interface ContextSidebarNavItemProps {
  label: string;
  path: string;
  icon: ContextNavIcon;
  isActive?: boolean;
  onClick?: () => void;
  horizontal?: boolean; // Mode horizontal pour mobile
}

/**
 * Item de navigation pour les sidebars contextuelles
 * - Touch target 44px minimum (accessibilité)
 * - Animations fluides
 * - États actifs/inactifs professionnels
 * - Mode horizontal pour barre de navigation mobile en bas
 */
export const ContextSidebarNavItem = ({
  label,
  path,
  icon: IconProp,
  isActive: forcedActive,
  onClick,
  horizontal = false,
}: ContextSidebarNavItemProps) => {
  const Icon = IconProp ?? Circle;
  const location = useLocation();
  const normalizedPath = path.split('?')[0];
  const isActive =
    forcedActive ??
    (location.pathname === normalizedPath || location.pathname.startsWith(normalizedPath + '/'));

  // Mode horizontal (mobile - barre en bas)
  if (horizontal) {
    return (
      <NavLink
        to={path}
        onClick={onClick}
        className={cn(
          'flex flex-col items-center justify-center gap-0.5',
          'px-2 py-1.5 rounded-md transition-all duration-200 ease-in-out',
          'min-w-[56px] min-h-[52px] touch-manipulation',
          'group relative flex-shrink-0',
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
        )}
        aria-label={label}
        aria-current={isActive ? 'page' : undefined}
      >
        <Icon
          className={cn(
            'h-4 w-4 flex-shrink-0 transition-colors duration-200',
            isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
          )}
          aria-hidden="true"
        />
        <span className="text-xs font-medium text-center leading-tight max-w-[56px] truncate px-0.5">
          {label}
        </span>
        {isActive && (
          <div className="absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-primary" />
        )}
      </NavLink>
    );
  }

  // Mode vertical (desktop - sidebar gauche)
  return (
    <NavLink
      to={path}
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 sm:gap-2.5 px-2 sm:px-2.5 py-2',
        'rounded-md text-xs sm:text-sm font-medium',
        'transition-colors duration-200 ease-in-out',
        'min-h-[40px] touch-manipulation',
        'group relative',
        isActive
          ? 'bg-sidebar-accent text-foreground shadow-sm border-l-2 border-primary pl-[calc(0.5rem-2px)] sm:pl-[calc(0.625rem-2px)]'
          : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
      )}
    >
      <Icon
        className={cn(
          'h-4 w-4 sm:h-4.5 sm:w-4.5 flex-shrink-0 transition-colors duration-200',
          isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
        )}
      />
      <span className="truncate flex-1 min-w-0">{label}</span>
      {isActive && (
        <span
          className="hidden sm:block h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
          aria-hidden="true"
        />
      )}
    </NavLink>
  );
};
