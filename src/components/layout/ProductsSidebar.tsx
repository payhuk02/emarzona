/**
 * Products Sidebar - Sidebar contextuelle pour la section Produits & Cours
 * Design professionnel et totalement responsive
 */

import { useLocation } from 'react-router-dom';
import { BreadcrumbItem } from './Breadcrumb';
import { BaseContextSidebar } from './BaseContextSidebar';
import { ContextSidebarNavItem } from './ContextSidebarNavItem';
import {
  Package,
  GraduationCap,
  Download,
  Key,
  Layers,
  BarChart,
  Sparkles,
} from 'lucide-react';

// Navigation des produits & cours
const productsNavItems = [
  {
    label: 'Produits',
    path: '/dashboard/products',
    icon: Package,
  },
  {
    label: 'Mes Cours',
    path: '/dashboard/my-courses',
    icon: GraduationCap,
  },
  {
    label: 'Produits Digitaux',
    path: '/dashboard/digital-products',
    icon: Download,
  },
  {
    label: 'Mes Téléchargements',
    path: '/dashboard/my-downloads',
    icon: Download,
  },
  {
    label: 'Mes Licences',
    path: '/dashboard/my-licenses',
    icon: Key,
  },
  {
    label: 'Bundles Produits',
    path: '/dashboard/digital-products/bundles/create',
    icon: Layers,
  },
  {
    label: 'Analytics Digitaux',
    path: '/dashboard/digital-products?view=analytics',
    icon: BarChart,
  },
  {
    label: 'Mises à jour Digitales',
    path: '/dashboard/digital/updates',
    icon: Sparkles,
  },
];

// Groupes de navigation pour organisation
const productsNavGroups = [
  {
    label: 'Gestion',
    items: productsNavItems.slice(0, 2),
  },
  {
    label: 'Produits Digitaux',
    items: productsNavItems.slice(2, 6),
  },
  {
    label: 'Analytics',
    items: productsNavItems.slice(6),
  },
];

export const ProductsSidebar = () => {
  const location = useLocation();

  const getActiveSection = () => {
    const activeItem = productsNavItems.find(
      (item) =>
        location.pathname === item.path ||
        (item.path !== '/dashboard/products' && location.pathname.startsWith(item.path))
    );
    return activeItem?.label || 'Produits & Cours';
  };

  const activeSection = getActiveSection();

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Produits & Cours', path: '/dashboard/products' },
    { label: activeSection },
  ];

  return (
    <BaseContextSidebar breadcrumbItems={breadcrumbItems}>
      <nav className="space-y-4 md:space-y-6" aria-label="Navigation produits et cours">
        {productsNavGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="space-y-2">
            <h3 className="px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold text-blue-200/80 uppercase tracking-wider border-b border-blue-800/30">
              {group.label}
            </h3>
            <div className="space-y-1">
              {group.items.map((item, itemIndex) => {
                const isActive =
                  location.pathname === item.path ||
                  (item.path !== '/dashboard/products' &&
                    location.pathname.startsWith(item.path.split('?')[0]));

                // Générer une clé unique pour éviter les duplications
                const uniqueKey = `${item.path}-${itemIndex}-${item.label}`;

                return (
                  <ContextSidebarNavItem
                    key={uniqueKey}
                    label={item.label}
                    path={item.path}
                    icon={item.icon}
                    isActive={isActive}
                    onClick={() => {
                      if (window.innerWidth < 768) {
                        setTimeout(() => {
                          const event = new Event('close-mobile-sidebar');
                          window.dispatchEvent(event);
                        }, 100);
                      }
                    }}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </BaseContextSidebar>
  );
};

