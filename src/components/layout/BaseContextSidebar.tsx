/**
 * Base Context Sidebar - Composant de base professionnel et responsive
 * Gère desktop (fixed) et mobile (barre horizontale en bas) avec animations fluides
 */

import { ReactNode, cloneElement, isValidElement, Children } from 'react';
import { Breadcrumb, BreadcrumbItem } from './Breadcrumb';
import { cn } from '@/lib/utils';

interface BaseContextSidebarProps {
  breadcrumbItems: BreadcrumbItem[];
  children: ReactNode;
  className?: string;
  triggerClassName?: string;
}

/**
 * Fonction récursive pour extraire les ContextSidebarNavItem des enfants
 * Détecte les items par leurs props (label, path, icon)
 */
const extractNavItems = (children: ReactNode): ReactNode[] => {
  const items: ReactNode[] = [];
  
  Children.forEach(children, (child) => {
    if (isValidElement(child)) {
      const props = child.props || {};
      // Si c'est un ContextSidebarNavItem (a les props label, path, icon)
      if (props.label && props.path && props.icon) {
        items.push(cloneElement(child as React.ReactElement<any>, { horizontal: true }));
      } 
      // Si c'est un nav ou un autre conteneur, on extrait ses enfants
      else if (props.children) {
        const nestedItems = extractNavItems(props.children);
        items.push(...nestedItems);
      }
    }
  });
  
  return items;
};

/**
 * Composant de base pour toutes les sidebars contextuelles
 * - Desktop: Sidebar fixe à gauche
 * - Mobile: Barre de navigation horizontale fixe en bas
 * - Design professionnel avec animations fluides
 */
export const BaseContextSidebar = ({ 
  breadcrumbItems, 
  children, 
  className = '',
  triggerClassName = ''
}: BaseContextSidebarProps) => {
  // Desktop: Sidebar fixe
  const desktopSidebar = (
    <aside 
      className={cn(
        'hidden md:block fixed left-0 top-16 w-56 md:w-64 h-[calc(100vh-4rem)]',
        'border-r border-blue-600/30',
        'bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900',
        'overflow-y-auto z-40',
        'transition-all duration-300 ease-in-out',
        'scrollbar-thin scrollbar-thumb-blue-500/50 scrollbar-track-transparent',
        'shadow-[4px_0_12px_rgba(0,0,0,0.15)]',
        'backdrop-blur-sm',
        className
      )}
      aria-label="Navigation contextuelle"
    >
      <div className="p-3 sm:p-4 md:p-5 space-y-4 md:space-y-5">
        {/* Breadcrumb horizontal en haut */}
        <Breadcrumb items={breadcrumbItems} />

        {/* Contenu de la sidebar */}
        <div className="space-y-1">
          {children}
        </div>
      </div>
    </aside>
  );

  // Mobile: Barre de navigation horizontale fixe en bas
  // Extrait les items de navigation des enfants
  const mobileNavItems = extractNavItems(children);

  const mobileSidebar = (
    <nav
      className={cn(
        'md:hidden fixed bottom-0 left-0 right-0 z-50',
        'bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900',
        'border-t border-blue-600/30',
        'shadow-[0_-4px_12px_rgba(0,0,0,0.15)]',
        'backdrop-blur-sm',
        'safe-area-bottom'
      )}
      role="navigation"
      aria-label="Navigation contextuelle mobile"
    >
      {/* Scroll horizontal pour les items de navigation */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex items-center justify-start gap-1 px-2 py-2 min-h-[64px]">
          {mobileNavItems}
        </div>
      </div>
    </nav>
  );

  return (
    <>
      {desktopSidebar}
      {mobileSidebar}
    </>
  );
};

