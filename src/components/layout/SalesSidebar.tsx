/**
 * Sales Sidebar - Sidebar contextuelle pour Ventes & Logistique
 * Design professionnel et totalement responsive
 */

import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BreadcrumbItem } from './Breadcrumb';
import { BaseContextSidebar } from './BaseContextSidebar';
import { ContextSidebarNavItem } from './ContextSidebarNavItem';
import { useStore } from '@/hooks/useStore';
import { useStorePhysicalAccess } from '@/hooks/billing/useStorePhysicalAccess';
import { useToast } from '@/hooks/use-toast';
import {
  hasPhysicalFeatureAccess,
  requiredPlanForFeature,
  type PhysicalFeatureKey,
} from '@/lib/billing/physical-plan-capabilities';
import {
  ShoppingCart,
  Users,
  GanttChart,
  DollarSign,
  Wallet,
  Link2,
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
  ChevronDown,
  ChevronRight,
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
    icon: Wallet,
  },
  {
    label: 'Connexions paiement',
    path: '/dashboard/payment-connections',
    icon: Link2,
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
    featureKey: 'shipping.tracking' as PhysicalFeatureKey,
  },
  {
    label: 'Expéditions Batch',
    path: '/dashboard/batch-shipping',
    icon: PackageSearch,
    featureKey: 'batch_shipping.manage' as PhysicalFeatureKey,
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
    featureKey: 'forecasting.demand' as PhysicalFeatureKey,
  },
  {
    label: 'Optimisation Coûts',
    path: '/dashboard/cost-optimization',
    icon: DollarSign,
    featureKey: 'cost_optimization.manage' as PhysicalFeatureKey,
  },
  {
    label: 'Fournisseurs',
    path: '/dashboard/suppliers',
    icon: Factory,
    featureKey: 'suppliers.manage' as PhysicalFeatureKey,
  },
  {
    label: 'Entrepôts',
    path: '/dashboard/warehouses',
    icon: Building2,
    featureKey: 'warehouses.manage' as PhysicalFeatureKey,
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
    featureKey: 'analytics.physical' as PhysicalFeatureKey,
  },
  {
    label: 'Lots & Expiration',
    path: '/dashboard/physical-lots',
    icon: Package,
    featureKey: 'lots_expiration.manage' as PhysicalFeatureKey,
  },
  {
    label: 'Numéros de Série',
    path: '/dashboard/physical-serial-tracking',
    icon: Hash,
    featureKey: 'serial_tracking.manage' as PhysicalFeatureKey,
  },
  {
    label: 'Scanner Codes-barres',
    path: '/dashboard/physical-barcode-scanner',
    icon: Camera,
    featureKey: 'barcode_scanner.use' as PhysicalFeatureKey,
  },
  {
    label: 'Précommandes',
    path: '/dashboard/physical-preorders',
    icon: Package,
    featureKey: 'preorders.manage' as PhysicalFeatureKey,
  },
  {
    label: 'Backorders',
    path: '/dashboard/physical-backorders',
    icon: Package,
    featureKey: 'backorders.manage' as PhysicalFeatureKey,
  },
  {
    label: 'Bundles Produits',
    path: '/dashboard/physical-bundles',
    icon: ShoppingBag,
    featureKey: 'bundles.manage' as PhysicalFeatureKey,
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
  const navigate = useNavigate();
  const { toast } = useToast();
  const { store } = useStore();
  const { planSlug } = useStorePhysicalAccess(store?.id ?? null);
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([]);

  const resolvedGroups = useMemo(() => {
    return salesNavGroups.map(group => ({
      ...group,
      items: group.items.map(item => {
        const featureKey = item.featureKey as PhysicalFeatureKey | undefined;
        const locked = featureKey ? !hasPhysicalFeatureAccess(planSlug, featureKey) : false;
        return { ...item, locked, featureKey };
      }),
    }));
  }, [planSlug]);

  const getActiveSection = () => {
    const activeItem = salesNavItems.find(
      item =>
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
        {resolvedGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="space-y-2">
            <button
              type="button"
              onClick={() =>
                setCollapsedGroups(prev =>
                  prev.includes(group.label)
                    ? prev.filter(label => label !== group.label)
                    : [...prev, group.label]
                )
              }
              className="w-full flex items-center justify-between px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold text-blue-200/80 uppercase tracking-wider border-b border-blue-800/30"
              aria-expanded={!collapsedGroups.includes(group.label)}
            >
              <span>{group.label}</span>
              {collapsedGroups.includes(group.label) ? (
                <ChevronRight className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
            {!collapsedGroups.includes(group.label) && (
              <div className="space-y-1">
                {group.items.map(item => {
                  const isActive =
                    location.pathname === item.path ||
                    (item.path !== '/dashboard/orders' && location.pathname.startsWith(item.path));

                  return (
                    <div key={item.path} className="relative">
                      <ContextSidebarNavItem
                        label={item.locked ? `${item.label} (upgrade)` : item.label}
                        path={item.locked ? '/dashboard/billing/physical' : item.path}
                        icon={item.icon}
                        isActive={isActive}
                        onClick={() => {
                          if (item.locked && item.featureKey) {
                            const required = requiredPlanForFeature(item.featureKey)
                              .replace('physical_', '')
                              .toUpperCase();
                            toast({
                              title: 'Fonctionnalité verrouillée',
                              description: `${item.label} requiert le plan ${required}.`,
                            });
                            navigate('/dashboard/billing/physical');
                          }
                          if (window.innerWidth < 768) {
                            setTimeout(() => {
                              const event = new Event('close-mobile-sidebar');
                              window.dispatchEvent(event);
                            }, 100);
                          }
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>
    </BaseContextSidebar>
  );
};
