/**
 * Base Context Sidebar - Composant de base professionnel et responsive
 * Gère desktop (fixed) et mobile (Sheet) avec animations fluides
 */

import { ReactNode, useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { Breadcrumb, BreadcrumbItem } from './Breadcrumb';
import { cn } from '@/lib/utils';

interface BaseContextSidebarProps {
  breadcrumbItems: BreadcrumbItem[];
  children: ReactNode;
  className?: string;
  triggerClassName?: string;
}

/**
 * Composant de base pour toutes les sidebars contextuelles
 * - Desktop: Sidebar fixe à gauche
 * - Mobile: Sheet (drawer) avec bouton trigger
 * - Design professionnel avec animations fluides
 */
export const BaseContextSidebar = ({ 
  breadcrumbItems, 
  children, 
  className = '',
  triggerClassName = ''
}: BaseContextSidebarProps) => {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  // Fermer le drawer mobile après navigation
  useEffect(() => {
    const handleClose = () => setOpen(false);
    window.addEventListener('close-mobile-sidebar', handleClose);
    return () => window.removeEventListener('close-mobile-sidebar', handleClose);
  }, []);

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

  // Mobile: Sheet (drawer) avec trigger
  const mobileSidebar = (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'md:hidden fixed top-20 left-3 z-50',
            'h-11 w-11 p-0 rounded-full',
            'bg-gradient-to-br from-blue-700/95 via-blue-800/95 to-blue-900/95',
            'border-blue-600/30 text-blue-100',
            'hover:bg-blue-600/40 hover:text-white hover:scale-110',
            'shadow-lg backdrop-blur-sm',
            'transition-all duration-200 ease-in-out',
            'touch-manipulation',
            triggerClassName
          )}
          aria-label="Ouvrir le menu contextuel"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className={cn(
          'w-[85vw] sm:w-80 p-0',
          'bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900',
          'border-r border-blue-600/30',
          'overflow-y-auto',
          'scrollbar-thin scrollbar-thumb-blue-500/50 scrollbar-track-transparent'
        )}
      >
        <div className="p-4 space-y-4">
          {/* Header avec bouton fermer */}
          <div className="flex items-center justify-between pb-3 border-b border-blue-600/30">
            <Breadcrumb items={breadcrumbItems} />
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-blue-100 hover:text-white hover:bg-blue-600/40 touch-manipulation"
              onClick={() => setOpen(false)}
              aria-label="Fermer le menu"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Contenu de la sidebar */}
          <div className="space-y-1">
            {children}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <>
      {desktopSidebar}
      {mobileSidebar}
    </>
  );
};

