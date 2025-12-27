/**
 * Breadcrumb - Fil d'Ariane pour navigation contextuelle
 * Inspiré de systeme.io
 */

import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumb = ({ items, className }: BreadcrumbProps) => {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        'flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-300 pb-3 sm:pb-4 border-b border-blue-800/30 overflow-x-auto',
        className
      )}
    >
      <Link
        to="/dashboard"
        className="flex items-center gap-1 hover:text-white transition-colors duration-200 p-1 rounded hover:bg-blue-900/30 flex-shrink-0"
        aria-label="Retour au tableau de bord"
      >
        <Home className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={index} className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-slate-400/60 flex-shrink-0" />
            {isLast ? (
              <span className="text-blue-200 font-semibold whitespace-nowrap">{item.label}</span>
            ) : item.path ? (
              <Link
                to={item.path}
                className="hover:text-white transition-colors duration-200 px-1 py-0.5 rounded hover:bg-blue-900/30 whitespace-nowrap"
              >
                {item.label}
              </Link>
            ) : (
              <span className="px-1 whitespace-nowrap">{item.label}</span>
            )}
          </div>
        );
      })}
    </nav>
  );
};






