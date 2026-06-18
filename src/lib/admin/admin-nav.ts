import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  UserPlus,
  Settings,
  Bell,
  Store,
  Package,
  History,
  BoxIcon,
  CreditCard,
  Scale,
  TrendingUp,
  BarChart3,
  ShieldCheck,
  Headphones,
  GraduationCap,
  Brain,
  Warehouse,
  Truck,
  DollarSign,
  FileText,
  Sparkles,
  Shield,
  RotateCcw,
  Webhook,
  Gift,
  Star,
  Percent,
  MessageSquare,
  Activity,
  Accessibility,
  Bot,
  Wallet,
  Megaphone,
  GitCompare,
  Factory,
  Layers,
  LineChart,
  Calculator,
  PackageCheck,
  Database,
  WifiOff,
  AlertTriangle,
  HardDrive,
  KeyRound,
  Repeat,
  Building2,
  Globe,
  Zap,
  LayoutGrid,
  Mail,
  CircleHelp,
  Newspaper,
} from 'lucide-react';

export type AdminNavItem = {
  icon: LucideIcon;
  label: string;
  path: string;
  /** Une permission suffit (OR). Absent = visible pour tout admin. */
  permissions?: string[];
  superAdminOnly?: boolean;
};

export type AdminNavSection = {
  label: string;
  items: AdminNavItem[];
};

/** Vérifie l'accès admin plateforme (profiles.role / is_super_admin / has_role). */
export function isAdminPanelRole(role: string | null, isSuperAdmin: boolean): boolean {
  if (isSuperAdmin) return true;
  return ['admin', 'staff', 'manager', 'support', 'viewer', 'super_admin'].includes(role ?? '');
}

export function canAccessAdminNavItem(
  item: AdminNavItem,
  can: (key: string) => boolean,
  isSuperAdmin: boolean
): boolean {
  if (item.superAdminOnly && !isSuperAdmin) return false;
  if (!item.permissions?.length) return true;
  if (isSuperAdmin) return true;
  return item.permissions.some(p => can(p));
}

export function filterAdminNavSections(
  sections: AdminNavSection[],
  can: (key: string) => boolean,
  isSuperAdmin: boolean
): AdminNavSection[] {
  return sections
    .map(section => ({
      ...section,
      items: section.items.filter(item => canAccessAdminNavItem(item, can, isSuperAdmin)),
    }))
    .filter(section => section.items.length > 0);
}

export const ADMIN_NAV_SECTIONS: AdminNavSection[] = [
  {
    label: 'Administration',
    items: [
      { icon: LayoutDashboard, label: "Vue d'ensemble", path: '/admin' },
      { icon: Users, label: 'Utilisateurs', path: '/admin/users', permissions: ['users.manage'] },
      {
        icon: Store,
        label: 'Boutiques',
        path: '/admin/stores',
        permissions: ['users.manage', 'analytics.view'],
      },
      { icon: Users, label: 'Communauté', path: '/admin/community', permissions: ['users.manage'] },
    ],
  },
  {
    label: 'Catalogue',
    items: [
      {
        icon: Package,
        label: 'Produits',
        path: '/admin/products',
        permissions: ['products.manage'],
      },
      {
        icon: GraduationCap,
        label: 'Cours',
        path: '/admin/courses',
        permissions: ['products.manage'],
      },
      { icon: FileText, label: 'Avis', path: '/admin/reviews', permissions: ['products.manage'] },
      {
        icon: Layers,
        label: 'Kits produits',
        path: '/admin/product-kits',
        permissions: ['products.manage'],
      },
    ],
  },
  {
    label: 'Commerce',
    items: [
      {
        icon: ShoppingCart,
        label: 'Ventes',
        path: '/admin/sales',
        permissions: ['orders.manage', 'analytics.view'],
      },
      { icon: BoxIcon, label: 'Commandes', path: '/admin/orders', permissions: ['orders.manage'] },
      {
        icon: Warehouse,
        label: 'Inventaire',
        path: '/admin/inventory',
        permissions: ['products.manage', 'orders.manage'],
      },
      {
        icon: Factory,
        label: 'Fournisseurs',
        path: '/admin/suppliers',
        permissions: ['products.manage'],
      },
      {
        icon: Warehouse,
        label: 'Entrepôts',
        path: '/admin/warehouses',
        permissions: ['products.manage'],
      },
      {
        icon: Truck,
        label: 'Expéditions',
        path: '/admin/shipping',
        permissions: ['orders.manage'],
      },
      {
        icon: PackageCheck,
        label: 'Expédition groupée',
        path: '/admin/batch-shipping',
        permissions: ['orders.manage'],
      },
      {
        icon: MessageSquare,
        label: 'Conversations Livraison',
        path: '/admin/shipping-conversations',
        permissions: ['orders.manage'],
      },
      {
        icon: MessageSquare,
        label: 'Conversations Clients-Vendeurs',
        path: '/admin/vendor-conversations',
        permissions: ['orders.manage'],
      },
      { icon: RotateCcw, label: 'Retours', path: '/admin/returns', permissions: ['orders.manage'] },
      {
        icon: LineChart,
        label: 'Prévisions demande',
        path: '/admin/demand-forecasting',
        permissions: ['analytics.view'],
      },
      {
        icon: Calculator,
        label: 'Optimisation coûts',
        path: '/admin/cost-optimization',
        permissions: ['analytics.view'],
      },
    ],
  },
  {
    label: 'Finance',
    items: [
      {
        icon: DollarSign,
        label: 'Revenus',
        path: '/admin/revenue',
        permissions: ['payments.manage', 'analytics.view'],
      },
      {
        icon: CreditCard,
        label: 'Paiements',
        path: '/admin/payments',
        permissions: ['payments.manage'],
      },
      {
        icon: Wallet,
        label: 'Retraits boutiques',
        path: '/admin/store-withdrawals',
        permissions: ['payments.manage'],
      },
      {
        icon: Percent,
        label: 'Taxes',
        path: '/admin/taxes',
        permissions: ['payments.manage', 'settings.manage'],
      },
      { icon: Scale, label: 'Litiges', path: '/admin/disputes', permissions: ['disputes.manage'] },
      {
        icon: GitCompare,
        label: 'Réconciliation transactions',
        path: '/admin/transaction-reconciliation',
        permissions: ['payments.manage'],
      },
      {
        icon: BarChart3,
        label: 'Statistiques Moneroo',
        path: '/admin/moneroo-analytics',
        permissions: ['payments.manage'],
      },
      {
        icon: RotateCcw,
        label: 'Réconciliation Moneroo',
        path: '/admin/moneroo-reconciliation',
        permissions: ['payments.manage'],
      },
      {
        icon: Repeat,
        label: 'Abonnements',
        path: '/admin/subscriptions',
        permissions: ['payments.manage', 'analytics.view'],
      },
      {
        icon: Building2,
        label: 'Facturation SaaS',
        path: '/admin/vendor-billing',
        permissions: ['payments.manage', 'settings.manage'],
      },
    ],
  },
  {
    label: 'Marketing & Engagement',
    items: [
      {
        icon: Megaphone,
        label: 'Marketing automation',
        path: '/admin/marketing',
        permissions: ['emails.manage'],
      },
      {
        icon: UserPlus,
        label: 'Parrainages',
        path: '/admin/referrals',
        permissions: ['analytics.view'],
      },
      {
        icon: TrendingUp,
        label: 'Affiliation',
        path: '/admin/affiliates',
        permissions: ['analytics.view'],
      },
      {
        icon: Star,
        label: 'Programme de Fidélité',
        path: '/admin/loyalty',
        permissions: ['analytics.view'],
      },
      {
        icon: Gift,
        label: 'Cartes Cadeaux',
        path: '/admin/gift-cards',
        permissions: ['analytics.view'],
      },
    ],
  },
  {
    label: 'Systèmes & Intégrations',
    items: [
      {
        icon: Settings,
        label: 'Intégrations',
        path: '/admin/integrations',
        permissions: ['settings.manage'],
      },
      {
        icon: Webhook,
        label: 'Webhooks',
        path: '/admin/webhooks',
        permissions: ['settings.manage'],
      },
      {
        icon: KeyRound,
        label: 'Clés API',
        path: '/admin/api-keys',
        permissions: ['settings.manage'],
      },
      {
        icon: Globe,
        label: 'Domaines & DNS',
        path: '/admin/domains',
        permissions: ['settings.manage'],
      },
      {
        icon: Zap,
        label: 'Feature flags',
        path: '/admin/feature-flags',
        permissions: ['settings.manage'],
      },
      {
        icon: Database,
        label: 'Stockage données',
        path: '/admin/data-storage',
        permissions: ['settings.manage'],
      },
      {
        icon: HardDrive,
        label: 'Diagnostic stockage',
        path: '/admin/storage-diagnostic',
        permissions: ['settings.manage'],
      },
      {
        icon: WifiOff,
        label: 'File offline',
        path: '/admin/offline-queue',
        permissions: ['settings.manage'],
      },
    ],
  },
  {
    label: 'Analytics & Monitoring',
    items: [
      {
        icon: BarChart3,
        label: 'Analytics',
        path: '/admin/analytics',
        permissions: ['analytics.view'],
      },
      {
        icon: BarChart3,
        label: 'Monitoring Transactions',
        path: '/admin/transaction-monitoring',
        permissions: ['payments.manage', 'analytics.view'],
      },
      {
        icon: Activity,
        label: 'Monitoring',
        path: '/admin/monitoring',
        permissions: ['analytics.view'],
      },
      {
        icon: PackageCheck,
        label: 'Alertes fulfillment',
        path: '/admin/fulfillment-alerts',
        permissions: ['analytics.view'],
      },
      {
        icon: AlertTriangle,
        label: 'Monitoring erreurs',
        path: '/admin/error-monitoring',
        permissions: ['analytics.view'],
      },
    ],
  },
  {
    label: 'Sécurité & Support',
    items: [
      { icon: ShieldCheck, label: 'Admin KYC', path: '/admin/kyc', permissions: ['users.manage'] },
      { icon: Shield, label: 'Sécurité 2FA', path: '/admin/security' },
      {
        icon: History,
        label: 'Activité',
        path: '/admin/activity',
        permissions: ['analytics.view'],
      },
      {
        icon: FileText,
        label: 'Audit',
        path: '/admin/audit',
        permissions: ['settings.manage', 'users.roles'],
      },
      {
        icon: Headphones,
        label: 'Support',
        path: '/admin/support',
        permissions: ['disputes.manage'],
      },
      {
        icon: Bell,
        label: 'Notifications',
        path: '/admin/notifications',
        permissions: ['emails.manage'],
      },
      {
        icon: Accessibility,
        label: 'Accessibilité',
        path: '/admin/accessibility',
        permissions: ['settings.manage'],
      },
    ],
  },
  {
    label: 'Configuration',
    items: [
      {
        icon: Settings,
        label: 'Paramètres',
        path: '/admin/settings',
        permissions: ['settings.manage'],
      },
      {
        icon: Bot,
        label: 'Centre AI',
        path: '/admin/ai-management',
        permissions: ['settings.manage'],
      },
      {
        icon: Brain,
        label: 'IA Recommandations',
        path: '/admin/ai-settings',
        permissions: ['settings.manage'],
      },
      {
        icon: LayoutGrid,
        label: 'Outils avancés',
        path: '/admin/advanced-tools',
        permissions: ['settings.manage', 'analytics.view'],
      },
      {
        icon: Percent,
        label: 'Commissions',
        path: '/admin/commission-settings',
        permissions: ['settings.manage', 'users.roles'],
      },
      {
        icon: DollarSign,
        label: 'Paiements Commissions',
        path: '/admin/commission-payments',
        permissions: ['payments.manage'],
      },
      {
        icon: Sparkles,
        label: 'Personnalisation',
        path: '/admin/platform-customization',
        permissions: ['settings.manage'],
      },
      {
        icon: CircleHelp,
        label: 'FAQ plateforme',
        path: '/admin/platform-faq',
        permissions: ['settings.manage'],
      },
      {
        icon: Newspaper,
        label: 'Blog plateforme',
        path: '/admin/platform-blog',
        permissions: ['settings.manage'],
      },
      {
        icon: Mail,
        label: 'Newsletter',
        path: '/admin/newsletter-subscribers',
        permissions: ['settings.manage'],
      },
    ],
  },
];
