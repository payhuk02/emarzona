/**
 * Extended Context Sidebars - Enterprise-grade navigation
 * Contains advanced features moved from compact sidebar
 * Each domain has its own context sidebar with organized sections
 */

import {
  Package,
  ShoppingCart,
  Users,
  Settings,
  CreditCard,
  BarChart3,
  Tag,
  Store,
  DollarSign,
  UserPlus,
  History,
  Bell,
  Target,
  Search,
  MessageSquare,
  Mail,
  TrendingUp,
  GraduationCap,
  Download,
  Key,
  Truck,
  Warehouse,
  Calendar,
  FileText,
  Sparkles,
  User as UserIcon,
  Heart,
  Receipt,
  RotateCcw,
  Webhook,
  Gift,
  Star,
  Percent,
  Repeat,
  GanttChart,
  Boxes,
  PackageSearch,
  Factory,
  Hash,
  Building2,
  BarChart,
  Layers,
  FileBarChart,
  ShoppingBag,
  Camera,
  Palette,
  Globe,
  Trophy,
  AlertTriangle,
  Phone,
  Wallet,
  Link2,
  Scale,
  Headphones,
  Workflow,
  Gavel,
  ChevronRight,
  ShieldCheck,
  Shield,
  Plus,
  Edit,
  Trash2,
  Eye,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MoreVertical,
  Upload,
  Download as DownloadIcon,
  Play,
  Pause,
  ExternalLink,
  Settings as SettingsIcon,
} from '@/components/icons';
import type { RawNavSection } from '@/config/navigation.enrich';

/**
 * PRODUCTS CONTEXT SIDEBAR
 * Advanced product management features
 */
export const PRODUCTS_CONTEXT_SIDEBAR: RawNavSection[] = [
  {
    label: 'Créer',
    items: [
      {
        title: 'Produit Digital',
        url: '/dashboard/products/new/digital',
        icon: Download,
      },
      {
        title: 'Produit Physique',
        url: '/dashboard/products/new/physical',
        icon: ShoppingBag,
      },
      {
        title: 'Service',
        url: '/dashboard/products/new/service',
        icon: Calendar,
      },
      {
        title: 'Cours',
        url: '/dashboard/courses/new',
        icon: GraduationCap,
      },
      {
        title: "Œuvre d'artiste",
        url: '/dashboard/products/new/artist',
        icon: Camera,
      },
    ],
  },
  {
    label: 'Gestion',
    items: [
      {
        title: 'Avis',
        url: '/dashboard/reviews',
        icon: Star,
      },
      {
        title: 'Licences',
        url: '/dashboard/license-management',
        icon: Key,
      },
      {
        title: 'Bundles Digitaux',
        url: '/dashboard/digital-products/bundles',
        icon: Layers,
      },
      {
        title: 'Packs Cross-type',
        url: '/dashboard/cross-type-bundles',
        icon: Sparkles,
      },
      {
        title: 'Mises à jour Digitaux',
        url: '/dashboard/digital/updates',
        icon: Sparkles,
      },
    ],
  },
  {
    label: 'Artistes & Enchères',
    items: [
      {
        title: "Œuvres d'artiste",
        url: '/dashboard/artist-products',
        icon: Palette,
      },
      {
        title: 'Enchères',
        url: '/dashboard/auctions',
        icon: Gavel,
      },
      {
        title: 'Watchlist Enchères',
        url: '/dashboard/auctions/watchlist',
        icon: Heart,
      },
      {
        title: 'Portfolios',
        url: '/dashboard/portfolios',
        icon: Camera,
      },
      {
        title: "Collections d'Œuvres",
        url: '/collections',
        icon: Boxes,
      },
    ],
  },
  {
    label: 'Cours',
    items: [
      {
        title: 'Sessions Live',
        url: '/dashboard/courses/live-sessions',
        icon: Play,
      },
      {
        title: 'Devoirs',
        url: '/dashboard/courses/assignments',
        icon: FileText,
      },
      {
        title: 'Cohorts',
        url: '/dashboard/cohorts',
        icon: Users,
      },
    ],
  },
];

/**
 * LOGISTICS CONTEXT SIDEBAR
 * Advanced logistics and inventory features
 */
export const LOGISTICS_CONTEXT_SIDEBAR: RawNavSection[] = [
  {
    label: 'Équipe & Tâches',
    items: [
      {
        title: 'Équipe',
        url: '/dashboard/store/team',
        icon: Users,
      },
      {
        title: 'Tâches',
        url: '/dashboard/tasks',
        icon: GanttChart,
      },
      {
        title: 'Commandes Avancées',
        url: '/dashboard/advanced-orders',
        icon: MessageSquare,
      },
    ],
  },
  {
    label: 'Services',
    items: [
      {
        title: 'Catalogue Services',
        url: '/dashboard/services',
        icon: Calendar,
      },
      {
        title: 'Compléments Service',
        url: '/dashboard/services/addons',
        icon: Package,
      },
      {
        title: 'Calendrier Services',
        url: '/dashboard/services/calendar',
        icon: Calendar,
      },
      {
        title: 'Séries Récurrentes',
        url: '/dashboard/services/recurring-bookings',
        icon: Repeat,
      },
      {
        title: 'Calendrier Avancé',
        url: '/dashboard/advanced-calendar',
        icon: Calendar,
      },
      {
        title: 'Gestion Services',
        url: '/dashboard/service-management',
        icon: Calendar,
      },
      {
        title: 'Abonnements Boutique',
        url: '/dashboard/recurring-bookings',
        icon: Repeat,
      },
      {
        title: 'Calendrier Staff',
        url: '/dashboard/services/staff-availability',
        icon: Users,
      },
      {
        title: 'Conflits Ressources',
        url: '/dashboard/services/resource-conflicts',
        icon: AlertTriangle,
      },
      {
        title: 'Intégrations Calendrier',
        url: '/dashboard/services/calendar-integrations',
        icon: Calendar,
      },
      {
        title: "Liste d'Attente",
        url: '/dashboard/services/waitlist',
        icon: Users,
      },
      {
        title: 'Rappels Réservations',
        url: '/dashboard/services/reminders',
        icon: Bell,
      },
    ],
  },
  {
    label: 'Expédition',
    items: [
      {
        title: 'Services Livraison',
        url: '/dashboard/shipping-services',
        icon: SettingsIcon,
      },
      {
        title: 'Contacter Service',
        url: '/dashboard/contact-shipping-service',
        icon: Phone,
      },
      {
        title: 'Expéditions Batch',
        url: '/dashboard/batch-shipping',
        icon: PackageSearch,
      },
      {
        title: 'Kits Produits',
        url: '/dashboard/product-kits',
        icon: Boxes,
      },
    ],
  },
  {
    label: 'Supply Chain',
    items: [
      {
        title: 'Prévisions Demande',
        url: '/dashboard/demand-forecasting',
        icon: TrendingUp,
      },
      {
        title: 'Analytics Inventaire',
        url: '/dashboard/inventory-analytics',
        icon: FileBarChart,
      },
      {
        title: 'Optimisation Coûts',
        url: '/dashboard/cost-optimization',
        icon: DollarSign,
      },
      {
        title: 'Fournisseurs',
        url: '/dashboard/suppliers',
        icon: Factory,
      },
      {
        title: 'Entrepôts',
        url: '/dashboard/warehouses',
        icon: Building2,
      },
    ],
  },
  {
    label: 'Produits Physiques',
    items: [
      {
        title: 'Gestion Stocks',
        url: '/dashboard/physical-inventory',
        icon: Warehouse,
      },
      {
        title: 'Analytics Physiques',
        url: '/dashboard/physical-analytics',
        icon: BarChart3,
      },
      {
        title: 'Lots & Expiration',
        url: '/dashboard/physical-lots',
        icon: Package,
      },
      {
        title: 'Numéros de Série',
        url: '/dashboard/physical-serial-tracking',
        icon: Hash,
      },
      {
        title: 'Scanner Codes-barres',
        url: '/dashboard/physical-barcode-scanner',
        icon: Camera,
      },
      {
        title: 'Précommandes',
        url: '/dashboard/physical-preorders',
        icon: Package,
      },
      {
        title: 'Backorders',
        url: '/dashboard/physical-backorders',
        icon: Package,
      },
      {
        title: 'Bundles Physiques',
        url: '/dashboard/physical-bundles',
        icon: ShoppingBag,
      },
      {
        title: 'Promotions Physiques',
        url: '/dashboard/physical-promotions',
        icon: Tag,
      },
      {
        title: 'Multi-devises',
        url: '/dashboard/multi-currency',
        icon: Globe,
      },
    ],
  },
];

/**
 * MARKETING CONTEXT SIDEBAR
 * Advanced marketing and growth features
 */
export const MARKETING_CONTEXT_SIDEBAR: RawNavSection[] = [
  {
    label: 'Campagnes',
    items: [
      {
        title: 'Séquences Email',
        url: '/dashboard/emails/sequences',
        icon: Mail,
      },
      {
        title: "Segments d'Audience",
        url: '/dashboard/emails/segments',
        icon: Users,
      },
      {
        title: 'Analytics Email',
        url: '/dashboard/emails/analytics',
        icon: BarChart3,
      },
      {
        title: 'Workflows Email',
        url: '/dashboard/emails/workflows',
        icon: Workflow,
      },
      {
        title: 'Tags Email',
        url: '/dashboard/emails/tags',
        icon: Tag,
      },
      {
        title: 'Éditeur Templates',
        url: '/dashboard/emails/templates/editor',
        icon: FileText,
      },
    ],
  },
  {
    label: 'Promotions',
    items: [
      {
        title: 'Statistiques Promotions',
        url: '/dashboard/promotions/stats',
        icon: BarChart3,
      },
      {
        title: 'Coupons',
        url: '/dashboard/coupons',
        icon: Percent,
      },
      {
        title: 'Paniers Abandonnés',
        url: '/dashboard/abandoned-carts',
        icon: ShoppingCart,
      },
    ],
  },
  {
    label: 'Croissance',
    items: [
      {
        title: 'Parrainage',
        url: '/dashboard/referrals',
        icon: UserPlus,
      },
      {
        title: 'Affiliation',
        url: '/dashboard/affiliates',
        icon: TrendingUp,
      },
      {
        title: 'Gamification',
        url: '/dashboard/gamification',
        icon: Trophy,
      },
      {
        title: 'Affiliation Boutique',
        url: '/dashboard/store-affiliates',
        icon: TrendingUp,
      },
    ],
  },
];

/**
 * ANALYTICS CONTEXT SIDEBAR
 * Advanced analytics and SEO features
 */
export const ANALYTICS_CONTEXT_SIDEBAR: RawNavSection[] = [
  {
    label: 'Analytics',
    items: [
      {
        title: 'Tableaux de bord',
        url: '/dashboard/analytics/dashboards',
        icon: GanttChart,
      },
      {
        title: 'Pixels',
        url: '/dashboard/pixels',
        icon: Target,
      },
    ],
  },
  {
    label: 'SEO',
    items: [
      {
        title: 'Inspecteur SEO',
        url: '/dashboard/seo/inspector',
        icon: Search,
      },
    ],
  },
];

/**
 * PAYMENTS CONTEXT SIDEBAR
 * Advanced payments and finance features
 */
export const PAYMENTS_CONTEXT_SIDEBAR: RawNavSection[] = [
  {
    label: 'Paiements',
    items: [
      {
        title: 'Paiements & Clients',
        url: '/dashboard/payments-customers',
        icon: Users,
      },
      {
        title: 'Solde à Payer',
        url: '/dashboard/pay-balance',
        icon: DollarSign,
      },
      {
        title: 'Gestion Paiements',
        url: '/dashboard/payment-management',
        icon: FileText,
      },
      {
        title: 'Méthodes de paiement',
        url: '/dashboard/payment-methods',
        icon: Wallet,
      },
      {
        title: 'Connexions paiement',
        url: '/dashboard/payment-connections',
        icon: Link2,
      },
    ],
  },
];

/**
 * SETTINGS CONTEXT SIDEBAR
 * Advanced settings and integrations
 */
export const SETTINGS_CONTEXT_SIDEBAR: RawNavSection[] = [
  {
    label: 'Paramètres',
    items: [
      {
        title: 'Domaines',
        url: '/dashboard/domain',
        icon: Globe,
      },
      {
        title: 'Notifications',
        url: '/settings/notifications',
        icon: Bell,
      },
      {
        title: 'Rejoindre Communauté',
        url: '/community',
        icon: Users,
      },
    ],
  },
  {
    label: 'Systèmes',
    items: [
      {
        title: 'Webhooks',
        url: '/dashboard/webhooks',
        icon: Webhook,
      },
      {
        title: 'Programme Fidélité',
        url: '/dashboard/loyalty',
        icon: Star,
      },
      {
        title: 'Cartes Cadeaux',
        url: '/dashboard/gift-cards',
        icon: Gift,
      },
      {
        title: 'Centre Notifications',
        url: '/notifications',
        icon: Bell,
      },
    ],
  },
];

/**
 * AI RECOMMENDATIONS CONTEXT SIDEBAR
 * AI-powered features
 */
export const AI_CONTEXT_SIDEBAR: RawNavSection[] = [
  {
    label: 'Recommandations IA',
    items: [
      {
        title: 'Mes Recommandations',
        url: '/recommendations',
        icon: TrendingUp,
      },
      {
        title: 'Découvertes Personnalisées',
        url: '/discover',
        icon: Sparkles,
      },
      {
        title: 'Tendances Produits',
        url: '/trending',
        icon: BarChart3,
      },
      {
        title: 'Basé sur Historique',
        url: '/recommendations/history-based',
        icon: History,
      },
      {
        title: 'Quiz Style',
        url: '/personalization/quiz',
        icon: Sparkles,
      },
      {
        title: 'Recommandations Personnalisées',
        url: '/personalization/recommendations',
        icon: Sparkles,
      },
      {
        title: 'Assistant IA',
        url: '/dashboard/ai-chatbot',
        icon: Sparkles,
        featureFlag: 'nav.ai-chatbot',
      },
      {
        title: "Studio IA d'images",
        url: '/dashboard/image-studio',
        icon: Sparkles,
        featureFlag: 'nav.image-studio',
      },
    ],
  },
];

/**
 * Mapping of path patterns to context sidebars
 */
export const CONTEXT_SIDEBAR_MAPPING: Record<string, RawNavSection[]> = {
  '/dashboard/products': PRODUCTS_CONTEXT_SIDEBAR,
  '/dashboard/courses': PRODUCTS_CONTEXT_SIDEBAR,
  '/dashboard/digital-products': PRODUCTS_CONTEXT_SIDEBAR,
  '/dashboard/physical-products': PRODUCTS_CONTEXT_SIDEBAR,
  '/dashboard/orders': LOGISTICS_CONTEXT_SIDEBAR,
  '/dashboard/inventory': LOGISTICS_CONTEXT_SIDEBAR,
  '/dashboard/shipping': LOGISTICS_CONTEXT_SIDEBAR,
  '/dashboard/customers': MARKETING_CONTEXT_SIDEBAR,
  '/dashboard/promotions': MARKETING_CONTEXT_SIDEBAR,
  '/dashboard/emails': MARKETING_CONTEXT_SIDEBAR,
  '/dashboard/analytics': ANALYTICS_CONTEXT_SIDEBAR,
  '/dashboard/seo': ANALYTICS_CONTEXT_SIDEBAR,
  '/dashboard/payments': PAYMENTS_CONTEXT_SIDEBAR,
  '/dashboard/settings': SETTINGS_CONTEXT_SIDEBAR,
  '/dashboard/integrations': SETTINGS_CONTEXT_SIDEBAR,
  '/dashboard/ai-chatbot': AI_CONTEXT_SIDEBAR,
  '/dashboard/image-studio': AI_CONTEXT_SIDEBAR,
};
