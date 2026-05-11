/**
 * Context Sidebar Nav Item - Composant réutilisable pour les items de navigation
 * Design professionnel et responsive avec animations fluides
 * Supporte le mode horizontal pour mobile (barre en bas)
 */

import { NavLink, useLocation } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContextSidebarNavItemProps {
  label: string;
  path: string;
  icon: LucideIcon;
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
  icon: Icon,
  isActive: forcedActive,
  onClick,
  horizontal = false,
}: ContextSidebarNavItemProps) => {
  const location = useLocation();
  const isActive = forcedActive ?? 
    (location.pathname === path || location.pathname.startsWith(path + '/'));

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
        <Icon className={cn(
          'h-4 w-4 flex-shrink-0 transition-colors duration-200',
          isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
        )} aria-hidden="true" />
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
        'flex items-center gap-2.5 sm:gap-3 px-2.5 sm:px-3 py-2.5 sm:py-3',
        'rounded-lg text-xs sm:text-sm font-medium',
        'transition-all duration-200 ease-in-out',
        'min-h-[44px] touch-manipulation',
        'group relative',
        isActive
          ? 'bg-blue-600/40 text-white shadow-md shadow-blue-600/20 border-l-2 border-blue-300'
          : 'text-blue-100 hover:bg-blue-600/40 hover:text-white hover:translate-x-1 hover:shadow-sm'
      )}
    >
      <Icon className={cn(
        'h-4 w-4 sm:h-4.5 sm:w-4.5 flex-shrink-0 transition-colors duration-200',
        isActive ? 'text-white' : 'text-blue-100 group-hover:text-white'
      )} />
      <span className="truncate flex-1">{label}</span>
      {isActive && (
        <div className="absolute right-2 h-2 w-2 rounded-full bg-blue-300 animate-pulse" />
      )}
    </NavLink>
  );
};







