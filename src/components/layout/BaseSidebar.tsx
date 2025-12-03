/**
 * Base Sidebar - Composant de base réutilisable pour toutes les sidebars contextuelles
 * Garantit un style professionnel cohérent et stable
 */

import { ReactNode } from 'react';
import { Breadcrumb, BreadcrumbItem } from './Breadcrumb';

interface BaseSidebarProps {
  breadcrumbItems: BreadcrumbItem[];
  children: ReactNode;
  className?: string;
}

/**
 * Composant de base pour toutes les sidebars contextuelles
 * Style professionnel, stable et statique
 */
export const BaseSidebar = ({ breadcrumbItems, children, className = '' }: BaseSidebarProps) => {
  return (
    <aside 
      className={`hidden md:block fixed left-0 top-16 w-56 md:w-64 h-[calc(100vh-4rem)] border-r border-blue-800/30 bg-gradient-to-br from-slate-900 via-blue-950 to-black overflow-y-auto z-40 transition-all duration-300 scrollbar-thin ${className}`}
      aria-label="Navigation contextuelle"
    >
      <div className="p-3 sm:p-4 md:p-5 space-y-4">
        {/* Breadcrumb horizontal en haut - Toujours visible */}
        <Breadcrumb items={breadcrumbItems} />

        {/* Contenu de la sidebar - Navigation ou autres éléments */}
        {children}
      </div>
    </aside>
  );
};

