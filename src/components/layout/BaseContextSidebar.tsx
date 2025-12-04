/**
 * Base Context Sidebar - Composant de base professionnel et responsive
 * Gère desktop (fixed) et mobile (drawer + barre horizontale en bas) avec animations fluides
 */

import { ReactNode, cloneElement, isValidElement, Children, useMemo } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { Breadcrumb, BreadcrumbItem } from './Breadcrumb';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/ui/sidebar';

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
 * - Mobile: Drawer accessible + Barre de navigation horizontale fixe en bas
 * - Design professionnel avec animations fluides
 */
export const BaseContextSidebar = ({ 
  breadcrumbItems, 
  children, 
  className = '',
  triggerClassName = ''
}: BaseContextSidebarProps) => {
  const isMobile = useIsMobile();
  const { setOpenMobile } = useSidebar();

  // Mémoriser les items de navigation pour éviter les re-renders inutiles
  const mobileNavItems = useMemo(() => {
    return extractNavItems(children);
  }, [children]);

  // Desktop: Sidebar fixe
  const desktopSidebar = (
    <aside 
      className={cn(
        'hidden md:block fixed left-0 top-16 w-56 md:w-64 h-[calc(100vh-4rem)]',
        'border-r border-white/10',
        'text-white',
        'overflow-y-auto z-40',
        'transition-all duration-300 ease-in-out',
        'scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent',
        'shadow-[4px_0_12px_rgba(0,0,0,0.15)]',
        'backdrop-blur-sm',
        className
      )}
      style={{
        backgroundColor: '#282870',
      } as React.CSSProperties}
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

  // Mobile: Hamburger pour ouvrir la sidebar principale (AppSidebar)
  const mobileHamburger = (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setOpenMobile(true)}
      className={cn(
        'md:hidden fixed top-16 left-2 z-[60]',
        'h-10 w-10 p-0 rounded-lg',
        'bg-background border border-border',
        'text-foreground',
        'hover:bg-accent hover:text-accent-foreground',
        'shadow-lg',
        'transition-all duration-200 ease-in-out',
        'touch-manipulation',
        triggerClassName
      )}
      aria-label="Ouvrir le menu principal"
    >
      <Menu className="h-5 w-5" />
    </Button>
  );

  // Mobile: Barre de navigation horizontale fixe en bas
  // Toujours visible si des items existent (même après navigation)
  // Utilise useMemo pour éviter les re-renders inutiles
  const mobileBottomNav = useMemo(() => {
    if (mobileNavItems.length === 0) return null;
    
    return (
      <nav
        className={cn(
          'md:hidden fixed bottom-0 left-0 right-0 z-[110]',
          'bg-background border-t border-border',
          'shadow-[0_-2px_8px_rgba(0,0,0,0.1)]',
          'safe-area-bottom',
          'context-bottom-nav' // Classe spécifique pour éviter le CSS global
        )}
        role="navigation"
        aria-label="Navigation contextuelle mobile"
        style={{ 
          position: 'fixed',
          bottom: 0,
          top: 'auto',
          left: 0,
          right: 0,
          zIndex: 110
        }}
      >
        {/* Scroll horizontal pour les items de navigation */}
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex items-center justify-start gap-0.5 px-1 py-1.5 min-h-[56px]">
            {mobileNavItems}
          </div>
        </div>
      </nav>
    );
  }, [mobileNavItems]);

  return (
    <>
      {desktopSidebar}
      {mobileHamburger}
      {mobileBottomNav}
    </>
  );
};

