// Import optimisé depuis l'index centralisé
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
  Lock,
  MessageSquare as LucideMessageSquare,
} from 'lucide-react';
import { usePlatformLogo } from '@/hooks/usePlatformLogo';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { PremiumLangSwitcher } from '@/components/landing/premium/PremiumLangSwitcher';
import { SidebarCollapsibleSection } from '@/components/sidebar/SidebarCollapsibleSection';
import { SidebarNavCommandPalette } from '@/components/sidebar/SidebarNavCommandPalette';
import { SidebarPersonaSwitch } from '@/components/sidebar/SidebarPersonaSwitch';
import { NAV_LINK_ACTIVE, NAV_LINK_INACTIVE } from '@/components/sidebar/sidebar-nav-shared';
import {
  DEFAULT_OPEN_SECTION_LABELS,
  enrichNavSections,
  filterNavSections,
  flattenNavSections,
  sectionContainsPath,
} from '@/config/navigation.enrich';
import { getNavItemPath, isNavItemActive, parseNavTo } from '@/config/navigation.helpers';
import type { NavSection, SidebarPersona } from '@/config/navigation.types';
import { useSidebarPersona } from '@/hooks/useSidebarPersona';
import { useState, useEffect, useMemo } from 'react';
import React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from '@/hooks/useAdmin';
import { useStoreContext } from '@/contexts/StoreContext';
import { useStorePhysicalAccess } from '@/hooks/billing/useStorePhysicalAccess';
import {
  hasPhysicalFeatureAccess,
  requiredPlanForFeature,
  type PhysicalPlanSlug,
} from '@/lib/billing/physical-plan-capabilities';
import { requiredPhysicalFeatureForPath } from '@/lib/billing/physical-route-capabilities';
import { logger } from '@/lib/logger';
import { Check, Plus } from '@/components/icons';

// Menu organisé par sections
const menuSections = [
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
        title: 'Mes Cours (Vendeur)',
        url: '/dashboard/my-courses',
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
      },
      {
        title: "Studio IA d'images",
        url: '/dashboard/image-studio',
        icon: Sparkles,
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

// Menu flat pour rétrocompatibilité (réservé pour usage futur)
// const menuItems = menuSections.flatMap(section => section.items);

// Menu Admin organisé par sections
const adminMenuSections = [
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
        title: 'Newsletter',
        url: '/admin/newsletter-subscribers',
        icon: Mail,
      },
    ],
  },
];

// Menu Admin flat pour rétrocompatibilité (réservé pour usage futur)
// const adminMenuItems = adminMenuSections.flatMap(section => section.items);

const PINNED_NAV_KEY = 'sidebarPinnedUrls';
const RECENT_NAV_KEY = 'sidebarRecentUrls';
const COLLAPSED_SECTIONS_KEY = 'sidebarCollapsedSections';
const STORES_EXPANDED_KEY = 'sidebarStoresExpanded';
const MAX_RECENT_ITEMS = 2;

const isNavItemPlanLocked = (url: string, planSlug: string | null) => {
  const feature = requiredPhysicalFeatureForPath(getNavItemPath(url));
  if (!feature) return false;
  return !hasPhysicalFeatureAccess(planSlug as PhysicalPlanSlug, feature);
};

const buildDefaultCollapsedSections = (
  sections: NavSection[],
  pathname: string,
  search: string
): string[] => {
  const openLabels = new Set(DEFAULT_OPEN_SECTION_LABELS);
  sections.forEach(s => {
    if (s.defaultOpen) openLabels.add(s.label);
  });
  const activeLabel = sections.find(s => sectionContainsPath(s, pathname, search))?.label;
  if (activeLabel) openLabels.add(activeLabel);
  return sections.map(s => s.label).filter(label => !openLabels.has(label));
};

// Composant Logo avec fallback en cas d'erreur
const LogoImageWithFallback = ({ src, className }: { src: string; className?: string }) => {
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [retryCount, setRetryCount] = useState(0);

  // Réinitialiser l'erreur si le src change
  useEffect(() => {
    if (src !== currentSrc) {
      setCurrentSrc(src);
      setHasError(false);
      setRetryCount(0);
    }
  }, [src, currentSrc]);

  const handleError = () => {
    // Si l'image ne charge pas, essayer le logo par défaut (une seule fois)
    if (currentSrc !== '/emarzona-logo.png' && retryCount === 0) {
      logger.warn('Logo failed to load, trying default', { failedUrl: currentSrc });
      setCurrentSrc('/emarzona-logo.png');
      setHasError(false);
      setRetryCount(1);
    } else {
      // Si même le logo par défaut ne charge pas, afficher le fallback
      setHasError(true);
      logger.error('Default logo also failed to load', {
        attemptedUrl: currentSrc,
        defaultLogo: '/emarzona-logo.png',
      });
    }
  };

  // Valider que l'URL est valide avant de l'utiliser
  const isValidUrl =
    currentSrc &&
    (currentSrc.startsWith('/') ||
      currentSrc.startsWith('http://') ||
      currentSrc.startsWith('https://') ||
      currentSrc.startsWith('data:'));

  if (hasError || !isValidUrl) {
    // Fallback : afficher un placeholder avec la lettre E
    return (
      <div
        className={`${className} bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md transition-transform duration-200 group-hover:scale-105`}
        style={{ minWidth: '32px', minHeight: '32px' }}
        aria-label="Logo Emarzona"
      >
        <span className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white">E</span>
      </div>
    );
  }

  return (
    <div className={className} style={{ minWidth: '32px', minHeight: '32px' }}>
      <img
        src={currentSrc}
        alt="Logo Emarzona"
        className="object-contain w-full h-full"
        onError={handleError}
        onLoad={() => {
          // Logo chargé avec succès
          setHasError(false);
        }}
        loading="eager"
        style={{ maxWidth: '100%', maxHeight: '100%' }}
      />
    </div>
  );
};

export function AppSidebar() {
  const { state } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { isAdmin } = useAdmin();
  const {
    stores,
    selectedStoreId,
    switchStore,
    canCreateStore,
    loading: storesLoading,
  } = useStoreContext();
  const { planSlug } = useStorePhysicalAccess(selectedStoreId);
  const platformLogo = usePlatformLogo();
  const isCollapsed = state === 'collapsed';
  const { persona, setPersona } = useSidebarPersona(isAdmin);
  const [commandOpen, setCommandOpen] = useState(false);
  const [pinnedUrls, setPinnedUrls] = useState<string[]>([]);
  const [recentUrls, setRecentUrls] = useState<string[]>([]);
  const [collapsedSections, setCollapsedSections] = useState<string[]>([]);
  const [prefsHydrated, setPrefsHydrated] = useState(false);
  const [storesMenuOpen, setStoresMenuOpen] = useState(false);

  const enrichedUserSections = useMemo(() => enrichNavSections(menuSections), []);

  const showAdminMenu = isAdmin && persona === 'admin';
  const showUserMenu = !showAdminMenu;

  const sidebarUserSections = useMemo(() => {
    const navPersona = persona === 'buyer' ? 'buyer' : 'seller';
    return filterNavSections(enrichedUserSections, navPersona, { sidebarOnly: true });
  }, [enrichedUserSections, persona]);

  const activeSections = showAdminMenu ? enrichNavSections(adminMenuSections) : sidebarUserSections;

  const commandPaletteSections = useMemo(() => {
    if (showAdminMenu) return enrichNavSections(adminMenuSections);
    const navPersona = persona === 'buyer' ? 'buyer' : 'seller';
    return filterNavSections(enrichedUserSections, navPersona, { sidebarOnly: false });
  }, [showAdminMenu, enrichedUserSections, persona]);

  const allCurrentEntries = useMemo(() => flattenNavSections(activeSections), [activeSections]);

  const navCommandEntries = useMemo(
    () =>
      flattenNavSections(commandPaletteSections).map(entry => ({
        title: entry.title,
        url: entry.url,
        icon: entry.icon,
        sectionLabel: entry.sectionLabel,
      })),
    [commandPaletteSections]
  );

  const handlePersonaChange = (next: SidebarPersona) => {
    setPersona(next);
    if (next === 'admin' && isAdmin) navigate('/admin');
    else if (next === 'buyer') navigate('/account');
    else navigate('/dashboard');
  };

  const currentNavItem = useMemo(() => {
    return allCurrentEntries.find(item =>
      isNavItemActive(item.url, location.pathname, location.search)
    );
  }, [allCurrentEntries, location.pathname, location.search]);

  useEffect(() => {
    try {
      const storedPinned = localStorage.getItem(PINNED_NAV_KEY);
      const storedRecent = localStorage.getItem(RECENT_NAV_KEY);
      const storedCollapsed = localStorage.getItem(COLLAPSED_SECTIONS_KEY);
      const storedStores = localStorage.getItem(STORES_EXPANDED_KEY);

      if (storedPinned) setPinnedUrls(JSON.parse(storedPinned));
      if (storedRecent) {
        const parsed = JSON.parse(storedRecent) as string[];
        setRecentUrls(Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT_ITEMS) : []);
      }
      if (storedCollapsed) setCollapsedSections(JSON.parse(storedCollapsed));
      if (storedStores !== null) setStoresMenuOpen(JSON.parse(storedStores));
      setPrefsHydrated(true);
    } catch (error) {
      logger.warn('Failed to restore sidebar preferences', error);
      setPrefsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!prefsHydrated) return;
    if (localStorage.getItem(COLLAPSED_SECTIONS_KEY) !== null) return;
    setCollapsedSections(
      buildDefaultCollapsedSections(activeSections, location.pathname, location.search)
    );
  }, [prefsHydrated, activeSections, location.pathname, location.search]);

  useEffect(() => {
    if (!prefsHydrated) return;
    if (localStorage.getItem(STORES_EXPANDED_KEY) !== null) return;
    setStoresMenuOpen(stores.length <= 1);
  }, [prefsHydrated, stores.length]);

  useEffect(() => {
    const activeLabel = activeSections.find(s =>
      sectionContainsPath(s, location.pathname, location.search)
    )?.label;
    if (!activeLabel) return;
    setCollapsedSections(prev =>
      prev.includes(activeLabel) ? prev.filter(l => l !== activeLabel) : prev
    );
  }, [location.pathname, location.search, activeSections]);

  useEffect(() => {
    if (!prefsHydrated) return;
    localStorage.setItem(STORES_EXPANDED_KEY, JSON.stringify(storesMenuOpen));
  }, [storesMenuOpen, prefsHydrated]);

  useEffect(() => {
    localStorage.setItem(PINNED_NAV_KEY, JSON.stringify(pinnedUrls));
  }, [pinnedUrls]);

  useEffect(() => {
    localStorage.setItem(RECENT_NAV_KEY, JSON.stringify(recentUrls));
  }, [recentUrls]);

  useEffect(() => {
    localStorage.setItem(COLLAPSED_SECTIONS_KEY, JSON.stringify(collapsedSections));
  }, [collapsedSections]);

  useEffect(() => {
    if (!currentNavItem?.url) return;

    setRecentUrls(prev => {
      const deduped = prev.filter(url => url !== currentNavItem.url);
      return [currentNavItem.url, ...deduped].slice(0, MAX_RECENT_ITEMS);
    });
  }, [currentNavItem?.url]);

  const toggleSectionCollapse = (sectionLabel: string) => {
    setCollapsedSections(prev =>
      prev.includes(sectionLabel)
        ? prev.filter(label => label !== sectionLabel)
        : [...prev, sectionLabel]
    );
  };

  const togglePinForCurrentPage = () => {
    if (!currentNavItem?.url) return;
    setPinnedUrls(prev =>
      prev.includes(currentNavItem.url)
        ? prev.filter(url => url !== currentNavItem.url)
        : [currentNavItem.url, ...prev].slice(0, 10)
    );
  };

  const pinnedItems = useMemo(
    () => allCurrentEntries.filter(item => pinnedUrls.includes(item.url)),
    [allCurrentEntries, pinnedUrls]
  );

  const recentItems = useMemo(
    () =>
      recentUrls
        .map(url => allCurrentEntries.find(item => item.url === url))
        .filter((item): item is (typeof allCurrentEntries)[number] => Boolean(item))
        .filter(item => !pinnedUrls.includes(item.url))
        .slice(0, MAX_RECENT_ITEMS),
    [allCurrentEntries, recentUrls, pinnedUrls]
  );

  const collapseAllSections = () => {
    setCollapsedSections(activeSections.map(s => s.label));
  };

  const expandAllSections = () => {
    setCollapsedSections([]);
  };

  const handleLockedNavClick = (itemTitle: string, itemUrl: string) => {
    const feature = requiredPhysicalFeatureForPath(getNavItemPath(itemUrl));
    const requiredPlan = feature
      ? requiredPlanForFeature(feature).replace('physical_', '').toUpperCase()
      : 'SUPÉRIEUR';
    toast({
      title: 'Fonctionnalité verrouillée',
      description: `${itemTitle} requiert le plan ${requiredPlan}.`,
    });
    navigate('/dashboard/billing/physical', {
      state: { blockedPath: getNavItemPath(itemUrl), requiredFeature: feature, requiredPlan },
    });
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast({
        title: 'Déconnexion réussie',
        description: 'À bientôt !',
      });
      navigate('/');
    } catch (error) {
      logger.error('Logout error', {
        error: error instanceof Error ? error.message : String(error),
      });
      toast({
        title: 'Erreur',
        description: 'Impossible de se déconnecter',
        variant: 'destructive',
      });
    }
  };

  return (
    <div
      className="[&_[data-sidebar=sidebar]]:!text-white [&_[data-sidebar=menu-button]]:!text-white [&_[data-sidebar=menu-button]_*]:!text-white [&_[data-sidebar=group-label]]:!text-white [&_[data-sidebar=group-label]_*]:!text-white"
      style={
        {
          '--sidebar-background': '#282870',
        } as React.CSSProperties
      }
    >
      <Sidebar
        collapsible="icon"
        className="border-r border-white/10 transition-all duration-300 [&_[data-sidebar=menu-button]]:!text-white [&_[data-sidebar=menu-button]_svg]:!text-white [&_[data-sidebar=menu-button]_span]:!text-white [&_[data-sidebar=group-label]]:!text-white"
        style={
          {
            '--sidebar-background': '#282870',
          } as React.CSSProperties
        }
      >
        <SidebarNavCommandPalette
          entries={navCommandEntries}
          open={commandOpen}
          onOpenChange={setCommandOpen}
        />

        {/* En-tête compact : logo + palette */}
        <div
          className={cn('shrink-0 border-b border-white/10', isCollapsed ? 'p-2' : 'px-3 py-2.5')}
        >
          <div className="flex items-center gap-2 min-h-[2.75rem]">
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 group transition-opacity duration-200 hover:opacity-90 shrink-0"
              aria-label="Retour au tableau de bord Emarzona"
            >
              {platformLogo ? (
                <LogoImageWithFallback
                  src={platformLogo}
                  className={cn(
                    'flex-shrink-0',
                    isCollapsed ? 'h-8 w-8' : 'h-9 w-9 sm:h-10 sm:w-10'
                  )}
                />
              ) : (
                <div
                  className={cn(
                    'flex-shrink-0 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md',
                    isCollapsed ? 'h-8 w-8' : 'h-9 w-9 sm:h-10 sm:w-10'
                  )}
                  aria-hidden="true"
                >
                  <span className="text-sm font-bold text-white">E</span>
                </div>
              )}
              {!isCollapsed && (
                <span
                  className="hidden sm:inline text-lg font-extrabold tracking-tight text-white"
                  style={{ fontFamily: 'Times New Roman, serif' }}
                >
                  Emarzona
                </span>
              )}
            </Link>
            {isCollapsed ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/10 shrink-0"
                onClick={() => setCommandOpen(true)}
                aria-label="Rechercher (Ctrl+K)"
              >
                <Search className="h-4 w-4" />
              </Button>
            ) : (
              <button
                type="button"
                onClick={() => setCommandOpen(true)}
                className="app-sidebar-command-trigger flex flex-1 items-center gap-2 h-9 rounded-lg border border-white/12 bg-white/[0.05] px-2.5 text-left text-sm text-white/70 hover:border-[#d4af37]/35 hover:bg-white/[0.08] hover:text-white transition-all duration-200 min-w-0"
                aria-label="Ouvrir la palette de navigation (Ctrl+K)"
              >
                <Search className="h-4 w-4 shrink-0 text-white/50" aria-hidden />
                <span className="flex-1 truncate text-xs">Rechercher…</span>
                <kbd className="hidden lg:inline-flex h-5 items-center rounded border border-white/15 bg-white/5 px-1.5 text-[10px] font-medium text-white/50">
                  Ctrl+K
                </kbd>
              </button>
            )}
          </div>
          <SidebarPersonaSwitch
            persona={persona === 'admin' && !isAdmin ? 'seller' : persona}
            isAdmin={isAdmin}
            isCollapsed={isCollapsed}
            onPersonaChange={handlePersonaChange}
          />
          {!isCollapsed && (
            <div className="mt-2 flex items-center justify-between gap-2 flex-wrap">
              <Button
                variant="ghost"
                size="sm"
                onClick={togglePinForCurrentPage}
                disabled={!currentNavItem}
                className="h-7 px-2 text-xs text-white/90 hover:bg-white/10 hover:text-white"
              >
                {currentNavItem && pinnedUrls.includes(currentNavItem.url)
                  ? 'Désépingler'
                  : 'Épingler'}
              </Button>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={expandAllSections}
                  className="h-7 px-2 text-[10px] text-white/70 hover:text-white hover:bg-white/10"
                >
                  Tout ouvrir
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={collapseAllSections}
                  className="h-7 px-2 text-[10px] text-white/70 hover:text-white hover:bg-white/10"
                >
                  Tout replier
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Épinglés en mode rail */}
        {isCollapsed && pinnedItems.length > 0 && (
          <div className="app-sidebar-pinned-rail shrink-0 flex flex-col items-center gap-1 py-2 border-b border-white/10">
            {pinnedItems.slice(0, 3).map(item => {
              const Icon = item.icon;
              return (
                <Button
                  key={`rail-pin-${item.url}`}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/10"
                  onClick={() => navigate(item.url)}
                  title={item.title}
                  aria-label={item.title}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              );
            })}
          </div>
        )}

        {!isCollapsed && (pinnedItems.length > 0 || recentItems.length > 0) && (
          <div className="shrink-0 px-3 py-2 border-b border-white/10 space-y-2">
            {pinnedItems.length > 0 && (
              <div>
                <p className="text-[11px] uppercase tracking-wide text-white font-semibold mb-1">
                  Accès épinglés
                </p>
                <div className="space-y-1">
                  {pinnedItems.slice(0, 5).map(item => (
                    <Button
                      key={`pin-${item.url}`}
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(item.url)}
                      className="w-full justify-start h-7 px-2 text-xs text-white/90 hover:bg-white/10 hover:text-white"
                    >
                      <item.icon className="h-3.5 w-3.5 mr-2" />
                      <span className="truncate">{item.title}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}
            {recentItems.length > 0 && (
              <div>
                <p className="text-[11px] uppercase tracking-wide text-white font-semibold mb-1 flex items-center gap-1">
                  <Clock3 className="h-3 w-3" />
                  Récents
                </p>
                <div className="space-y-1">
                  {recentItems.slice(0, MAX_RECENT_ITEMS).map(item => (
                    <Button
                      key={`recent-${item.url}`}
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(item.url)}
                      className="w-full justify-start h-7 px-2 text-xs text-white hover:bg-white/10 hover:text-white"
                    >
                      <item.icon className="h-3.5 w-3.5 mr-2" />
                      <span className="truncate">{item.title}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <SidebarContent className="app-sidebar-scroll flex-1 min-h-0 overflow-y-auto scrollbar-thin">
          {/* Menu Items - Organisé par sections */}
          {showUserMenu &&
            activeSections.map((section, sectionIndex) => (
              <React.Fragment key={section.label}>
                {isCollapsed && sectionIndex > 0 && (
                  <div
                    className="app-sidebar-rail-separator mx-auto my-1 h-px w-6 bg-white/15"
                    role="separator"
                  />
                )}
                <SidebarCollapsibleSection
                  label={section.label}
                  isOpen={isCollapsed || !collapsedSections.includes(section.label)}
                  onToggle={() => toggleSectionCollapse(section.label)}
                  hideHeader={isCollapsed}
                >
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {section.items.map(item => {
                        const IconComponent = item.icon;
                        if (!IconComponent) {
                          logger.warn(`Menu item missing icon: ${item.title}`);
                          return null;
                        }

                        // Menu spécial pour "Tableau de bord" avec sous-menu des boutiques - STATIQUE (toujours ouvert)
                        if (
                          item.title === 'Tableau de bord' &&
                          !storesLoading &&
                          stores.length > 0
                        ) {
                          const isDashboardActive = location.pathname === '/dashboard';
                          return (
                            <SidebarMenuItem
                              key={`${section.label}-${item.title}-${item.url}-dashboard`}
                            >
                              <SidebarMenuButton
                                asChild
                                tooltip={item.title}
                                className={`transition-all duration-200 group relative flex items-center ${
                                  isDashboardActive ? NAV_LINK_ACTIVE : NAV_LINK_INACTIVE
                                }`}
                              >
                                <NavLink
                                  to={item.url}
                                  end
                                  className="flex items-center gap-2 w-full"
                                >
                                  <IconComponent
                                    className="h-4 w-4 flex-shrink-0"
                                    aria-hidden="true"
                                  />
                                  {!isCollapsed && (
                                    <span className="flex-1 font-medium">{item.title}</span>
                                  )}
                                </NavLink>
                              </SidebarMenuButton>
                              {!isCollapsed && stores.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setStoresMenuOpen(open => !open)}
                                  className="ml-6 mt-1 flex w-[calc(100%-1.5rem)] items-center justify-between rounded-md px-2 py-1.5 text-xs font-medium text-white/80 hover:bg-white/[0.08] hover:text-white transition-colors"
                                  aria-expanded={storesMenuOpen}
                                >
                                  <span>Mes boutiques ({stores.length})</span>
                                  {storesMenuOpen ? (
                                    <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                                  ) : (
                                    <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                                  )}
                                </button>
                              )}
                              {!isCollapsed && stores.length > 0 && (
                                <div
                                  className={cn(
                                    'ml-4 grid transition-[grid-template-rows] duration-300 ease-out',
                                    storesMenuOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                                  )}
                                >
                                  <div className="overflow-hidden min-h-0 space-y-1 border-l border-white/15 pl-2 mt-1">
                                    {stores.map(store => (
                                      <Button
                                        key={store.id}
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          switchStore(store.id);
                                          navigate('/dashboard');
                                          toast({
                                            title: 'Boutique changée',
                                            description: `Vous consultez maintenant les données de "${store.name}"`,
                                          });
                                        }}
                                        className={`w-full justify-start !text-white transition-all duration-200 [&_svg]:!text-white [&_span]:!text-white opacity-90 ${
                                          selectedStoreId === store.id
                                            ? NAV_LINK_ACTIVE
                                            : NAV_LINK_INACTIVE
                                        }`}
                                      >
                                        {selectedStoreId === store.id && (
                                          <Check className="h-3 w-3 mr-2" />
                                        )}
                                        <span className="truncate">{store.name}</span>
                                      </Button>
                                    ))}
                                    {canCreateStore() && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => navigate('/dashboard/store')}
                                        className={`w-full justify-start ${NAV_LINK_INACTIVE} transition-all duration-200`}
                                      >
                                        <Plus className="h-3 w-3 mr-2" />
                                        <span>Créer une boutique</span>
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </SidebarMenuItem>
                          );
                        }

                        // Menu items normaux
                        const isPlanLocked =
                          showUserMenu && isNavItemPlanLocked(item.url, planSlug);

                        if (isPlanLocked) {
                          return (
                            <SidebarMenuItem key={`${section.label}-${item.title}-${item.url}`}>
                              <SidebarMenuButton
                                tooltip={`${item.title} — plan supérieur requis`}
                                onClick={() => handleLockedNavClick(item.title, item.url)}
                                className={`${NAV_LINK_INACTIVE} opacity-75 transition-all duration-200 group relative flex items-center`}
                              >
                                <IconComponent
                                  className="h-4 w-4 flex-shrink-0"
                                  aria-hidden="true"
                                />
                                {!isCollapsed ? (
                                  <>
                                    <span className="flex-1 font-medium">{item.title}</span>
                                    <Lock
                                      className="h-3 w-3 flex-shrink-0 opacity-80"
                                      aria-hidden="true"
                                    />
                                  </>
                                ) : (
                                  <span className="sr-only">
                                    {item.title} — plan supérieur requis
                                  </span>
                                )}
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          );
                        }

                        return (
                          <SidebarMenuItem key={`${section.label}-${item.title}-${item.url}`}>
                            <SidebarMenuButton asChild tooltip={item.title}>
                              <NavLink
                                to={parseNavTo(item.url)}
                                end
                                isActive={() =>
                                  isNavItemActive(item.url, location.pathname, location.search)
                                }
                                className={({ isActive }) =>
                                  `transition-all duration-200 group relative flex items-center ${
                                    isActive ? NAV_LINK_ACTIVE : NAV_LINK_INACTIVE
                                  }`
                                }
                              >
                                <IconComponent
                                  className="h-4 w-4 flex-shrink-0"
                                  aria-hidden="true"
                                />
                                {!isCollapsed ? (
                                  <span className="flex-1 font-medium">{item.title}</span>
                                ) : (
                                  <span className="sr-only">{item.title}</span>
                                )}
                              </NavLink>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarCollapsibleSection>
              </React.Fragment>
            ))}

          {/* Bouton Retour Dashboard (visible uniquement sur pages admin) */}
          {showAdminMenu && (
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Retour Dashboard">
                      <NavLink
                        to="/dashboard"
                        className={`${NAV_LINK_INACTIVE} transition-all duration-200`}
                      >
                        <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                        {!isCollapsed && <span>← Retour Dashboard</span>}
                        {isCollapsed && <span className="sr-only">Retour au tableau de bord</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* Admin Menu Items - Organisé par sections */}
          {showAdminMenu &&
            activeSections.map((section, sectionIndex) => (
              <React.Fragment key={section.label}>
                {isCollapsed && sectionIndex > 0 && (
                  <div
                    className="app-sidebar-rail-separator mx-auto my-1 h-px w-6 bg-white/15"
                    role="separator"
                  />
                )}
                <SidebarCollapsibleSection
                  label={section.label}
                  isOpen={isCollapsed || !collapsedSections.includes(section.label)}
                  onToggle={() => toggleSectionCollapse(section.label)}
                  hideHeader={isCollapsed}
                >
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {section.items.map(item => {
                        const IconComponent = item.icon;
                        if (!IconComponent) {
                          logger.warn(`Menu item missing icon: ${item.title}`);
                          return null;
                        }
                        return (
                          <SidebarMenuItem key={`${section.label}-${item.title}-${item.url}`}>
                            <SidebarMenuButton asChild tooltip={item.title}>
                              <NavLink
                                to={parseNavTo(item.url)}
                                end
                                isActive={() =>
                                  isNavItemActive(item.url, location.pathname, location.search)
                                }
                                className={({ isActive }) =>
                                  `transition-all duration-200 ${
                                    isActive ? NAV_LINK_ACTIVE : NAV_LINK_INACTIVE
                                  }`
                                }
                              >
                                <IconComponent className="h-4 w-4" aria-hidden="true" />
                                {!isCollapsed ? (
                                  <span>{item.title}</span>
                                ) : (
                                  <span className="sr-only">{item.title}</span>
                                )}
                              </NavLink>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarCollapsibleSection>
              </React.Fragment>
            ))}
        </SidebarContent>

        {/* Footer */}
        <SidebarFooter className="app-sidebar-footer shrink-0 border-t border-white/10 bg-[#1e1e4a]/90 backdrop-blur-md p-3 space-y-2">
          {!isCollapsed && (
            <PremiumLangSwitcher className="app-sidebar-lang-switcher w-full" fullWidth />
          )}
          <Button
            variant="ghost"
            className="w-full justify-start !text-white hover:bg-white/10 hover:!text-white transition-all duration-200 [&_svg]:!text-white [&_span]:!text-white opacity-90"
            onClick={handleLogout}
            aria-label={isCollapsed ? 'Déconnexion' : undefined}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            {!isCollapsed ? <span>Déconnexion</span> : <span className="sr-only">Déconnexion</span>}
          </Button>
        </SidebarFooter>
      </Sidebar>
    </div>
  );
}
