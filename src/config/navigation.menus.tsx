/**
 * Sidebar navigation menu data (Phase 3 extraction).
 */
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  CreditCard,
  BarChart3,
  Tag,
  LogOut,
  Store,
  Shield,
  ShieldCheck,
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
  User,
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
} from '@/components/icons';
import {
  Database,
  Brain,
  Clock3,
  ChevronDown,
  ChevronRight,
  Accessibility,
  Bot,
  Megaphone,
  GitCompare,
  Activity,
  WifiOff,
  HardDrive,
  PackageCheck,
  MessageSquare as LucideMessageSquare,
  CircleHelp,
  Newspaper,
} from 'lucide-react';
import type { RawNavSection } from '@/config/navigation.enrich';

export const userMenuSections = [
  {
    label: 'Principal',
    items: [
      {
        title: 'Tableau de bord',
        url: '/dashboard',
        icon: LayoutDashboard,
      },
      {
        title: 'Boutique',
        url: '/dashboard/store',
        icon: Store,
      },
      {
        title: 'Marketplace',
        url: '/marketplace',
        icon: ShoppingCart,
      },
      {
        title: 'Enchères Publiques',
        url: '/auctions',
        icon: Gavel,
      },
    ],
  },
  {
    label: 'Mon Compte',
    items: [
      {
        title: 'Portail Client',
        url: '/account',
        icon: User,
      },
      {
        title: 'Mon Profil',
        url: '/account/profile',
        icon: User,
      },
      {
        title: 'Mes Commandes',
        url: '/account/orders',
        icon: ShoppingCart,
      },
      {
        title: 'Mes Factures',
        url: '/account/invoices',
        icon: Receipt,
      },
      {
        title: 'Mes Retours',
        url: '/account/returns',
        icon: RotateCcw,
      },
      {
        title: 'Mes Garanties',
        url: '/account/warranties',
        icon: ShieldCheck,
      },
      {
        title: 'Mes Réservations',
        url: '/account/bookings',
        icon: Calendar,
      },
      {
        title: 'Portail Artiste',
        url: '/account/artist',
        icon: Camera,
      },
      {
        title: 'Programme Fidélité',
        url: '/account/loyalty',
        icon: Star,
      },
      {
        title: 'Mes Cartes Cadeaux',
        url: '/account/gift-cards',
        icon: Gift,
      },
      {
        title: 'Suivi Multi-boutiques',
        url: '/checkout/multi-store-tracking',
        icon: Truck,
      },
      {
        title: 'Ma Liste de Souhaits',
        url: '/account/wishlist',
        icon: Heart,
      },
      {
        title: 'Mes Alertes',
        url: '/account/alerts',
        icon: Bell,
      },
      {
        title: 'Mes Téléchargements',
        url: '/account/downloads',
        icon: Download,
      },
      {
        title: 'Mon Portail Digital',
        url: '/account/digital',
        icon: Package,
      },
      {
        title: 'Mon Portail Produits Physiques',
        url: '/account/physical',
        icon: ShoppingBag,
      },
      {
        title: 'Mes Cours',
        url: '/account/courses',
        icon: GraduationCap,
      },
    ],
  },
  {
    label: 'Produits & Cours',
    items: [
      {
        title: 'Produits',
        url: '/dashboard/products',
        icon: Package,
      },
      {
        title: 'Créer un produit digital',
        url: '/dashboard/products/new/digital',
        icon: Download,
      },
      {
        title: 'Créer un produit physique',
        url: '/dashboard/products/new/physical',
        icon: ShoppingBag,
      },
      {
        title: 'Créer un service',
        url: '/dashboard/products/new/service',
        icon: Calendar,
      },
      {
        title: 'Créer un cours',
        url: '/dashboard/courses/new',
        icon: GraduationCap,
      },
      {
        title: "Créer une œuvre d'artiste",
        url: '/dashboard/products/new/artist',
        icon: Camera,
      },
      {
        title: "Mes œuvres d'artiste",
        url: '/dashboard/artist-products',
        icon: Palette,
      },
      {
        title: 'Mes cours en ligne',
        url: '/dashboard/courses',
        icon: GraduationCap,
      },
      {
        title: 'Sessions Live',
        url: '/dashboard/courses/live-sessions',
        icon: Calendar,
      },
      {
        title: 'Devoirs',
        url: '/dashboard/courses/assignments',
        icon: FileText,
      },
      {
        title: 'Avis',
        url: '/dashboard/reviews',
        icon: Star,
      },
      {
        title: 'Produits Digitaux',
        url: '/dashboard/digital-products',
        icon: Download,
      },
      {
        title: 'Recherche Produits Digitaux',
        url: '/digital/search',
        icon: Search,
      },
      {
        title: 'Comparer Produits Digitaux',
        url: '/digital/compare',
        icon: Layers,
      },
      {
        title: 'Comparer Produits',
        url: '/products/compare',
        icon: Layers,
      },
      {
        title: 'Mes licences achetées',
        url: '/dashboard/my-licenses',
        icon: Key,
      },
      {
        title: 'Gestion des Licences',
        url: '/dashboard/license-management',
        icon: Key,
      },
      {
        title: 'Bundles Produits Digitaux',
        url: '/dashboard/digital-products/bundles',
        icon: Layers,
      },
      {
        title: 'Créer un Bundle Digital',
        url: '/dashboard/digital-products/bundles/create',
        icon: Layers,
      },
      {
        title: 'Packs cross-type',
        url: '/dashboard/cross-type-bundles',
        icon: Sparkles,
      },
      {
        title: 'Mes Téléchargements (Vendeur)',
        url: '/dashboard/my-downloads',
        icon: Download,
      },
      {
        title: 'Mises à jour Digitales',
        url: '/dashboard/digital/updates',
        icon: Sparkles,
      },
      {
        title: 'Enchères Artistes',
        url: '/dashboard/auctions',
        icon: Gavel,
      },
      {
        title: 'Ma Watchlist Enchères',
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
      {
        title: 'Cohorts Cours',
        url: '/dashboard/cohorts',
        icon: Users,
      },
    ],
  },
  {
    label: 'Ventes & Logistique',
    items: [
      {
        title: 'Commandes',
        url: '/dashboard/orders',
        icon: ShoppingCart,
      },
      {
        title: 'Équipe',
        url: '/dashboard/store/team',
        icon: Users,
      },
      {
        title: 'Mes Tâches',
        url: '/dashboard/tasks',
        icon: GanttChart,
      },
      {
        title: 'Retraits',
        url: '/dashboard/withdrawals',
        icon: DollarSign,
      },
      {
        title: 'Commandes Avancées',
        url: '/dashboard/advanced-orders',
        icon: MessageSquare,
      },
      {
        title: 'Messages Clients',
        url: '/vendor/messaging',
        icon: MessageSquare,
      },
      {
        title: 'Réservations',
        url: '/dashboard/bookings',
        icon: Calendar,
      },
      {
        title: 'Catalogue Services',
        url: '/dashboard/services',
        icon: Calendar,
      },
      {
        title: 'Compléments service',
        url: '/dashboard/services/addons',
        icon: Package,
      },
      {
        title: 'Calendrier Services',
        url: '/dashboard/services/calendar',
        icon: Calendar,
      },
      {
        title: 'Séries récurrentes (par client)',
        url: '/dashboard/services/recurring-bookings',
        icon: Repeat,
      },
      {
        title: 'Calendrier Avancé',
        url: '/dashboard/advanced-calendar',
        icon: Calendar,
      },
      {
        title: 'Gestion des Services',
        url: '/dashboard/service-management',
        icon: Calendar,
      },
      {
        title: 'Abonnements récurrents (boutique)',
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
        title: "Liste d'Attente Services",
        url: '/dashboard/services/waitlist',
        icon: Users,
      },
      {
        title: 'Rappels Réservations',
        url: '/dashboard/services/reminders',
        icon: Bell,
      },
      {
        title: 'Inventaire',
        url: '/dashboard/inventory',
        icon: Warehouse,
      },
      {
        title: 'Expéditions',
        url: '/dashboard/shipping',
        icon: Truck,
      },
      {
        title: 'Services de Livraison',
        url: '/dashboard/shipping-services',
        icon: Settings,
      },
      {
        title: 'Contacter un Service',
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
      {
        title: 'Produits Physiques',
        url: '/dashboard/physical-products',
        icon: Package,
      },
      {
        title: 'Gestion Stocks Produits Physiques',
        url: '/dashboard/physical-inventory',
        icon: Warehouse,
      },
      {
        title: 'Analytics Produits Physiques',
        url: '/dashboard/physical-analytics',
        icon: BarChart3,
      },
      {
        title: 'Lots & Expiration',
        url: '/dashboard/physical-lots',
        icon: Package,
      },
      {
        title: 'Numéros de Série & Traçabilité',
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
        title: 'Bundles Produits Physiques',
        url: '/dashboard/physical-bundles',
        icon: ShoppingBag,
      },
      {
        title: 'Promotions Produits Physiques',
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
  {
    label: 'Finance & Paiements',
    items: [
      {
        title: 'Paiements',
        url: '/dashboard/payments',
        icon: CreditCard,
      },
      {
        title: 'Taxes',
        url: '/dashboard/taxes',
        icon: Percent,
      },
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
  {
    label: 'Marketing & Croissance',
    items: [
      {
        title: 'Marketing',
        url: '/dashboard/marketing',
        icon: Target,
      },
      {
        title: 'Clients',
        url: '/dashboard/customers',
        icon: Users,
      },
      {
        title: 'Promotions',
        url: '/dashboard/promotions',
        icon: Tag,
      },
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
      {
        title: 'Campagnes Email',
        url: '/dashboard/emails/campaigns',
        icon: Mail,
      },
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
      {
        title: 'Tableau de bord Affilié',
        url: '/affiliate/dashboard',
        icon: TrendingUp,
      },
      {
        title: 'Cours Promus',
        url: '/affiliate/courses',
        icon: GraduationCap,
      },
    ],
  },
  {
    label: 'Analytics & SEO',
    items: [
      {
        title: 'Statistiques',
        url: '/dashboard/analytics',
        icon: BarChart3,
      },
      {
        title: 'Tableaux de bord Analytics',
        url: '/dashboard/analytics/dashboards',
        icon: GanttChart,
      },
      {
        title: 'Analyses avancées',
        url: '/dashboard/advanced',
        icon: Activity,
      },
      {
        title: 'Mes Pixels',
        url: '/dashboard/pixels',
        icon: Target,
      },
      {
        title: 'Mon SEO',
        url: '/dashboard/seo',
        icon: Search,
      },
      {
        title: 'Inspecteur SEO',
        url: '/dashboard/seo/inspector',
        icon: Search,
      },
    ],
  },
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
        title: 'Basé sur mon Historique',
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
  {
    label: 'Systèmes & Intégrations',
    items: [
      {
        title: 'Intégrations',
        url: '/dashboard/integrations',
        icon: Settings,
      },
      {
        title: 'Webhooks',
        url: '/dashboard/webhooks',
        icon: Webhook,
        // Système unifié pour tous les types de webhooks
      },
      {
        title: 'Programme de Fidélité',
        url: '/dashboard/loyalty',
        icon: Star,
      },
      {
        title: 'Cartes Cadeaux',
        url: '/dashboard/gift-cards',
        icon: Gift,
      },
      {
        title: 'Centre de notifications',
        url: '/notifications',
        icon: Bell,
      },
    ],
  },
  {
    label: 'Configuration',
    items: [
      {
        title: 'KYC',
        url: '/dashboard/kyc',
        icon: Shield,
      },
      {
        title: 'Domaines',
        url: '/dashboard/domain',
        icon: Globe,
      },
      {
        title: 'Paramètres',
        url: '/dashboard/settings',
        icon: Settings,
      },
      {
        title: 'Notifications',
        url: '/settings/notifications',
        icon: Bell,
      },
      {
        title: 'Rejoindre la communauté',
        url: '/community',
        icon: Users,
      },
    ],
  },
];

export const adminMenuSections = [
  {
    label: 'Administration',
    items: [
      {
        title: "Vue d'ensemble",
        url: '/admin',
        icon: LayoutDashboard,
      },
      {
        title: 'Utilisateurs',
        url: '/admin/users',
        icon: Users,
      },
      {
        title: 'Boutiques',
        url: '/admin/stores',
        icon: Store,
      },
      {
        title: 'Communauté',
        url: '/admin/community',
        icon: Users,
      },
    ],
  },
  {
    label: 'Catalogue',
    items: [
      {
        title: 'Produits',
        url: '/admin/products',
        icon: Package,
      },
      {
        title: 'Cours',
        url: '/admin/courses',
        icon: GraduationCap,
      },
      {
        title: 'Opérations Physiques (Vendeur)',
        url: '/dashboard/physical-inventory',
        icon: Package,
      },
      {
        title: 'Réservations Services (Vendeur)',
        url: '/dashboard/bookings',
        icon: Calendar,
      },
      {
        title: "Collections d'Œuvres (Public)",
        url: '/collections',
        icon: Boxes,
      },
      {
        title: 'Avis',
        url: '/admin/reviews',
        icon: FileText,
      },
      {
        title: 'Licences (Vendeur)',
        url: '/dashboard/license-management',
        icon: Key,
      },
    ],
  },
  {
    label: 'Commerce',
    items: [
      {
        title: 'Ventes',
        url: '/admin/sales',
        icon: ShoppingCart,
      },
      {
        title: 'Commandes',
        url: '/admin/orders',
        icon: ShoppingCart,
      },
      {
        title: 'Inventaire Global',
        url: '/admin/inventory',
        icon: Warehouse,
      },
      {
        title: 'Expéditions',
        url: '/admin/shipping',
        icon: Truck,
      },
      {
        title: 'Conversations Livraison',
        url: '/admin/shipping-conversations',
        icon: LucideMessageSquare,
      },
      {
        title: 'Conversations Clients-Vendeurs',
        url: '/admin/vendor-conversations',
        icon: LucideMessageSquare,
      },
      {
        title: 'Retours',
        url: '/admin/returns',
        icon: RotateCcw,
      },
      {
        title: 'Calendrier Avancé (Vendeur)',
        url: '/dashboard/advanced-calendar',
        icon: Calendar,
      },
      {
        title: 'Gestion des Services (Vendeur)',
        url: '/dashboard/service-management',
        icon: Calendar,
      },
      {
        title: 'Abonnements récurrents (boutique)',
        url: '/dashboard/recurring-bookings',
        icon: Repeat,
      },
      {
        title: 'Kits Produits',
        url: '/admin/product-kits',
        icon: Boxes,
      },
      {
        title: 'Prévisions Demande',
        url: '/admin/demand-forecasting',
        icon: TrendingUp,
      },
      {
        title: 'Analytics Inventaire (Vendeur)',
        url: '/dashboard/inventory-analytics',
        icon: FileBarChart,
      },
      {
        title: 'Optimisation Coûts',
        url: '/admin/cost-optimization',
        icon: DollarSign,
      },
      {
        title: 'Expéditions Batch',
        url: '/admin/batch-shipping',
        icon: PackageSearch,
      },
      {
        title: 'Fournisseurs',
        url: '/admin/suppliers',
        icon: Factory,
      },
      {
        title: 'Entrepôts',
        url: '/admin/warehouses',
        icon: Building2,
      },
      {
        title: 'Gestion des Affiliés',
        url: '/admin/affiliates',
        icon: TrendingUp,
      },
    ],
  },
  {
    label: 'Finance',
    items: [
      {
        title: 'Revenus Plateforme',
        url: '/admin/revenue',
        icon: DollarSign,
      },
      {
        title: 'Paiements',
        url: '/admin/payments',
        icon: CreditCard,
      },
      {
        title: 'Retraits Vendeurs',
        url: '/admin/store-withdrawals',
        icon: Wallet,
      },
      {
        title: 'Taxes',
        url: '/admin/taxes',
        icon: Percent,
      },
      {
        title: 'Litiges',
        url: '/admin/disputes',
        icon: Scale,
      },
      {
        title: 'Réconciliation Transactions',
        url: '/admin/transaction-reconciliation',
        icon: GitCompare,
      },
      {
        title: 'Statistiques Moneroo',
        url: '/admin/moneroo-analytics',
        icon: BarChart3,
      },
      {
        title: 'Réconciliation Moneroo',
        url: '/admin/moneroo-reconciliation',
        icon: RotateCcw,
      },
    ],
  },
  {
    label: 'Systèmes & Intégrations',
    items: [
      {
        title: 'Intégrations',
        url: '/admin/integrations',
        icon: Settings,
      },
      {
        title: 'Webhooks',
        url: '/admin/webhooks',
        icon: Webhook,
        // Système unifié pour tous les types de webhooks
      },
      {
        title: 'Programme de Fidélité',
        url: '/admin/loyalty',
        icon: Star,
      },
      {
        title: 'Cartes Cadeaux',
        url: '/admin/gift-cards',
        icon: Gift,
      },
      {
        title: 'Stockage Données',
        url: '/admin/data-storage',
        icon: HardDrive,
      },
      {
        title: 'File Offline',
        url: '/admin/offline-queue',
        icon: WifiOff,
      },
    ],
  },
  {
    label: 'Croissance',
    items: [
      {
        title: 'Marketing Automation',
        url: '/admin/marketing',
        icon: Megaphone,
      },
      {
        title: 'Parrainages',
        url: '/admin/referrals',
        icon: UserPlus,
      },
      {
        title: 'Affiliation',
        url: '/admin/affiliates',
        icon: TrendingUp,
      },
    ],
  },
  {
    label: 'Analytics & Monitoring',
    items: [
      {
        title: 'Analytics',
        url: '/admin/analytics',
        icon: BarChart3,
      },
      {
        title: 'Monitoring',
        url: '/admin/monitoring',
        icon: Activity,
      },
      {
        title: 'Alertes Fulfillment',
        url: '/admin/fulfillment-alerts',
        icon: PackageCheck,
      },
      {
        title: 'Monitoring Erreurs',
        url: '/admin/error-monitoring',
        icon: AlertTriangle,
      },
      {
        title: 'Monitoring Transactions',
        url: '/admin/transaction-monitoring',
        icon: BarChart,
      },
    ],
  },
  {
    label: 'Sécurité & Support',
    items: [
      {
        title: 'Admin KYC',
        url: '/admin/kyc',
        icon: ShieldCheck,
      },
      {
        title: 'Sécurité 2FA',
        url: '/admin/security',
        icon: Shield,
      },
      {
        title: 'Activité',
        url: '/admin/activity',
        icon: History,
      },
      {
        title: 'Audit',
        url: '/admin/audit',
        icon: FileText,
      },
      {
        title: 'Support',
        url: '/admin/support',
        icon: Headphones,
      },
      {
        title: 'Notifications',
        url: '/admin/notifications',
        icon: Bell,
      },
      {
        title: 'Accessibilité',
        url: '/admin/accessibility',
        icon: Accessibility,
      },
      {
        title: 'Diagnostic Storage',
        url: '/admin/storage-diagnostic',
        icon: Database,
      },
    ],
  },
  {
    label: 'Configuration',
    items: [
      {
        title: 'Paramètres',
        url: '/admin/settings',
        icon: Settings,
      },
      {
        title: 'Centre AI',
        url: '/admin/ai-management',
        icon: Bot,
      },
      {
        title: 'IA Recommandations',
        url: '/admin/ai-settings',
        icon: Brain,
      },
      {
        title: 'Commissions',
        url: '/admin/commission-settings',
        icon: Percent,
      },
      {
        title: 'Paiements Commissions',
        url: '/admin/commission-payments',
        icon: DollarSign,
      },
      {
        title: 'Personnalisation',
        url: '/admin/platform-customization',
        icon: Sparkles,
      },
      {
        title: 'FAQ plateforme',
        url: '/admin/platform-faq',
        icon: CircleHelp,
      },
      {
        title: 'Blog plateforme',
        url: '/admin/platform-blog',
        icon: Newspaper,
      },
      {
        title: 'Newsletter',
        url: '/admin/newsletter-subscribers',
        icon: Mail,
      },
    ],
  },
];
