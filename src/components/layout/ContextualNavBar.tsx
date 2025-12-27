/**
 * Contextual Navigation Bar - Barre de navigation horizontale contextuelle
 * Inspiré de Notion, Linear, Stripe Dashboard
 * Affiche les sous-sections d'une section principale dans une barre horizontale
 */

import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export interface ContextualNavItem {
  label: string;
  path: string;
  icon?: LucideIcon;
  badge?: string | number;
}

interface ContextualNavBarProps {
  title: string;
  items: ContextualNavItem[];
  basePath: string;
  className?: string;
}

export const ContextualNavBar = ({
  title,
  items,
  basePath,
  className,
}: ContextualNavBarProps) => {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === basePath) {
      return location.pathname === basePath;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div
      className={cn(
        'sticky top-16 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        className
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center justify-between gap-4">
          {/* Title */}
          <div className="flex items-center gap-3 shrink-0">
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          </div>

          {/* Navigation Items */}
          <nav className="flex items-center gap-1 flex-1 overflow-x-auto scrollbar-hide">
            {items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap',
                    'hover:bg-accent',
                    active
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {Icon && <Icon className="h-4 w-4 shrink-0" />}
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={cn(
                        'ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-semibold',
                        active
                          ? 'bg-primary-foreground/20 text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
};







