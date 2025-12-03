/**
 * Context Sidebar Nav Item - Composant réutilisable pour les items de navigation
 * Design professionnel et responsive avec animations fluides
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
}

/**
 * Item de navigation pour les sidebars contextuelles
 * - Touch target 44px minimum (accessibilité)
 * - Animations fluides
 * - États actifs/inactifs professionnels
 */
export const ContextSidebarNavItem = ({
  label,
  path,
  icon: Icon,
  isActive: forcedActive,
  onClick,
}: ContextSidebarNavItemProps) => {
  const location = useLocation();
  const isActive = forcedActive ?? 
    (location.pathname === path || location.pathname.startsWith(path + '/'));

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
          ? 'bg-blue-600/30 text-blue-200 shadow-md shadow-blue-600/20 border-l-2 border-blue-400'
          : 'text-slate-300 hover:bg-blue-900/30 hover:text-white hover:translate-x-1 hover:shadow-sm'
      )}
    >
      <Icon className={cn(
        'h-4 w-4 sm:h-4.5 sm:w-4.5 flex-shrink-0 transition-colors duration-200',
        isActive ? 'text-blue-300' : 'text-slate-400 group-hover:text-blue-200'
      )} />
      <span className="truncate flex-1">{label}</span>
      {isActive && (
        <div className="absolute right-2 h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
      )}
    </NavLink>
  );
};

