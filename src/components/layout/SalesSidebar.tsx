/**
 * Sales Sidebar - Sidebar contextuelle pour Ventes & Logistique
 * Design professionnel et totalement responsive
 */

import { useLocation } from 'react-router-dom';
import { Breadcrumb, BreadcrumbItem } from './Breadcrumb';
import { BaseContextSidebar } from './BaseContextSidebar';
import { ContextSidebarNavItem } from './ContextSidebarNavItem';
import {
  ShoppingCart,
  Users,
  GanttChart,
  DollarSign,
  CreditCard,
  MessageSquare,
  Calendar,
  Truck,
  Warehouse,
  PackageSearch,
  Boxes,
  TrendingUp,
  Factory,
  Building2,
  Package,
  Hash,
  Camera,
  ShoppingBag,
  Globe,
} from 'lucide-react';

// Navigation des ventes & logistique
const salesNavItems = [
  {
    label: 'Commandes',
    path: '/dashboard/orders',
    icon: ShoppingCart,
  },
  {
    label: 'Équipe',
    path: '/dashboard/store/team',
    icon: Users,
  },
  {
    label: 'Mes Tâches',
    path: '/dashboard/tasks',
    icon: GanttChart,
  },
  {
    label: 'Retraits',
    path: '/dashboard/withdrawals',
    icon: DollarSign,
  },
  {
    label: 'Méthodes de paiement',
    path: '/dashboard/payment-methods',
    icon: CreditCard,
  },
  {
    label: 'Commandes Avancées',
    path: '/dashboard/advanced-orders',
    icon: MessageSquare,
  },
  {
    label: 'Messages Clients',
    path: '/vendor/messaging',
    icon: MessageSquare,
  },
  {
    label: 'Réservations',
    path: '/dashboard/bookings',
    icon: Calendar,
  },
  {
    label: 'Calendrier Avancé',
    path: '/dashboard/advanced-calendar',
    icon: Calendar,
  },
  {
    label: 'Gestion des Services',
    path: '/dashboard/service-management',
    icon: Calendar,
  },
  {
    label: 'Réservations Récurrentes',
    path: '/dashboard/recurring-bookings',
    icon: Calendar,
  },
  {
    label: 'Calendrier Staff',
    path: '/dashboard/services/staff-availability',
    icon: Users,
  },
  {
    label: 'Conflits Ressources',
    path: '/dashboard/services/resource-conflicts',
    icon: PackageSearch,
  },
  {
    label: 'Inventaire',
    path: '/dashboard/inventory',
    icon: Warehouse,
  },
  {
    label: 'Expéditions',
    path: '/dashboard/shipping',
    icon: Truck,
  },
  {
    label: 'Services de Livraison',
    path: '/dashboard/shipping-services',
    icon: Truck,
  },
  {
    label: 'Expéditions Batch',
    path: '/dashboard/batch-shipping',
    icon: PackageSearch,
  },
  {
    label: 'Kits Produits',
    path: '/dashboard/product-kits',
    icon: Boxes,
  },
  {
    label: 'Prévisions Demande',
    path: '/dashboard/demand-forecasting',
    icon: TrendingUp,
  },
  {
    label: 'Optimisation Coûts',
    path: '/dashboard/cost-optimization',
    icon: DollarSign,
  },
  {
    label: 'Fournisseurs',
    path: '/dashboard/suppliers',
    icon: Factory,
  },
  {
    label: 'Entrepôts',
    path: '/dashboard/warehouses',
    icon: Building2,
  },
  {
    label: 'Gestion Stocks',
    path: '/dashboard/physical-inventory',
    icon: Warehouse,
  },
  {
    label: 'Analytics Produits Physiques',
    path: '/dashboard/physical-analytics',
    icon: TrendingUp,
  },
  {
    label: 'Lots & Expiration',
    path: '/dashboard/physical-lots',
    icon: Package,
  },
  {
    label: 'Numéros de Série',
    path: '/dashboard/physical-serial-tracking',
    icon: Hash,
  },
  {
    label: 'Scanner Codes-barres',
    path: '/dashboard/physical-barcode-scanner',
    icon: Camera,
  },
  {
    label: 'Précommandes',
    path: '/dashboard/physical-preorders',
    icon: Package,
  },
  {
    label: 'Backorders',
    path: '/dashboard/physical-backorders',
    icon: Package,
  },
  {
    label: 'Bundles Produits',
    path: '/dashboard/physical-bundles',
    icon: ShoppingBag,
  },
  {
    label: 'Multi-devises',
    path: '/dashboard/multi-currency',
    icon: Globe,
  },
];

// Groupes de navigation pour organisation
const salesNavGroups = [
  {
    label: 'Commandes & Clients',
    items: salesNavItems.slice(0, 7),
  },
  {
    label: 'Services & Réservations',
    items: salesNavItems.slice(7, 12),
  },
  {
    label: 'Logistique & Inventaire',
    items: salesNavItems.slice(12, 18),
  },
  {
    label: 'Optimisation',
    items: salesNavItems.slice(18, 21),
  },
  {
    label: 'Produits Physiques',
    items: salesNavItems.slice(21),
  },
];

export const SalesSidebar = () => {
  const location = useLocation();

  const getActiveSection = () => {
    const activeItem = salesNavItems.find(
      (item) =>
        location.pathname === item.path ||
        (item.path !== '/dashboard/orders' && location.pathname.startsWith(item.path))
    );
    return activeItem?.label || 'Ventes & Logistique';
  };

  const activeSection = getActiveSection();

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Ventes & Logistique', path: '/dashboard/orders' },
    { label: activeSection },
  ];

  return (
    <BaseContextSidebar breadcrumbItems={breadcrumbItems}>
      <nav className="space-y-4 md:space-y-6" aria-label="Navigation ventes">
        {salesNavGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="space-y-2">
            <h3 className="px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold text-blue-200/80 uppercase tracking-wider border-b border-blue-800/30">
              {group.label}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive =
                  location.pathname === item.path ||
                  (item.path !== '/dashboard/orders' &&
                    location.pathname.startsWith(item.path));

                return (
                  <ContextSidebarNavItem
                    key={item.path}
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

