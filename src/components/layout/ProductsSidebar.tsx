/**
 * Products Sidebar - Sidebar contextuelle pour la section Produits
 */

import { NavLink, useLocation } from 'react-router-dom';
import { Breadcrumb, BreadcrumbItem } from './Breadcrumb';
import { cn } from '@/lib/utils';
import {
  Package,
  Plus,
  Edit,
  Layers,
  BarChart,
  Download,
  Key,
  Sparkles,
} from 'lucide-react';

// Navigation des produits
const productsNavItems = [
  {
    label: 'Tous les produits',
    path: '/dashboard/products',
    icon: Package,
  },
  {
    label: 'Créer un produit',
    path: '/dashboard/products/new',
    icon: Plus,
  },
  {
    label: 'Produits digitaux',
    path: '/dashboard/digital-products',
    icon: Download,
  },
  {
    label: 'Bundles',
    path: '/dashboard/digital-products/bundles/create',
    icon: Layers,
  },
  {
    label: 'Mes licences',
    path: '/dashboard/my-licenses',
    icon: Key,
  },
  {
    label: 'Mises à jour',
    path: '/dashboard/digital/updates',
    icon: Sparkles,
  },
];

export const ProductsSidebar = () => {
  const location = useLocation();
  
  const getActiveSection = () => {
    if (location.pathname.includes('/create')) return 'Créer';
    if (location.pathname.includes('/digital-products')) return 'Produits digitaux';
    if (location.pathname.includes('/bundles')) return 'Bundles';
    if (location.pathname.includes('/my-licenses')) return 'Licences';
    if (location.pathname.includes('/updates')) return 'Mises à jour';
    return 'Produits';
  };

  const activeSection = getActiveSection();

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Produits', path: '/dashboard/products' },
    { label: activeSection },
  ];

  return (
    <aside className="hidden lg:block fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] border-r bg-background overflow-y-auto z-40">
      <div className="p-4 space-y-4">
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} />

        {/* Navigation */}
        <nav className="space-y-1">
          {productsNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
                           location.pathname.startsWith(item.path + '/');
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

