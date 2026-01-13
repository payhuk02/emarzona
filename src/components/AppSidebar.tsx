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
  Scale,
  Headphones,
  Workflow,
  Gavel,
} from '@/components/icons';
import { Database, Brain } from 'lucide-react';
import { usePlatformLogo } from '@/hooks/usePlatformLogo';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useState, useEffect } from 'react';
import React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { LazyImage } from '@/components/ui/lazy-image';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from '@/hooks/useAdmin';
import { useStoreContext } from '@/contexts/StoreContext';
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
        title: 'Mes Notifications',
        url: '/notifications',
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
      {
        title: 'Gamification',
        url: '/dashboard/gamification',
        icon: Trophy,
      },
      {
        title: 'Ma Watchlist Enchères',
        url: '/dashboard/auctions/watchlist',
        icon: Heart,
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
        title: 'Créer un Cours',
        url: '/dashboard/courses/new',
        icon: GraduationCap,
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
        title: 'Mes Licences',
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
        title: 'Méthodes de paiement',
        url: '/dashboard/payment-methods',
        icon: CreditCard,
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
        title: 'Réservations Récurrentes',
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
        title: 'Mes Pixels',
        url: '/dashboard/pixels',
        icon: Target,
      },
      {
        title: 'Mon SEO',
        url: '/dashboard/seo',
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
        title: 'Paramètres',
        url: '/dashboard/settings',
        icon: Settings,
      },
      {
        title: 'IA Recommandations',
        url: '/admin/ai-settings',
        icon: Brain,
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
        title: 'Produits Physiques',
        url: '/dashboard/products',
        icon: Package,
      },
      {
        title: 'Services',
        url: '/dashboard/bookings',
        icon: Calendar,
      },
      {
        title: "Collections d'Œuvres",
        url: '/collections',
        icon: Boxes,
      },
      {
        title: 'Avis',
        url: '/admin/reviews',
        icon: FileText,
      },
      {
        title: 'Licences',
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
        title: 'Retours',
        url: '/admin/returns',
        icon: RotateCcw,
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
        title: 'Réservations Récurrentes',
        url: '/dashboard/recurring-bookings',
        icon: Repeat,
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
        title: 'Expéditions Batch',
        url: '/dashboard/batch-shipping',
        icon: PackageSearch,
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
        title: 'Gestion des Affiliés',
        url: '/dashboard/store-affiliates',
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
        title: 'Statistiques Moneroo',
        url: '/admin/moneroo-analytics',
        icon: BarChart3,
      },
      {
        title: 'Réconciliation Moneroo',
        url: '/admin/moneroo-reconciliation',
        icon: RotateCcw,
      },
      {
        title: 'Monitoring Transactions',
        url: '/admin/transaction-monitoring',
        icon: BarChart, // Utiliser BarChart au lieu de AlertCircle pour éviter les problèmes de bundling
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
        url: '/dashboard/webhooks',
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
    ],
  },
  {
    label: 'Croissance',
    items: [
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
      {
        title: 'Analytics',
        url: '/admin/analytics',
        icon: BarChart3,
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
    ],
  },
];

// Menu Admin flat pour rétrocompatibilité (réservé pour usage futur)
// const adminMenuItems = adminMenuSections.flatMap(section => section.items);

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
  const platformLogo = usePlatformLogo();
  const isCollapsed = state === 'collapsed';
  // Détecte si on est sur une page admin
  const isOnAdminPage = location.pathname.startsWith('/admin');

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
      className="[&_[data-sidebar=sidebar]]:!text-white"
      style={
        {
          '--sidebar-background': '#282870',
        } as React.CSSProperties
      }
    >
      <Sidebar
        collapsible="icon"
        className="border-r border-white/10 transition-all duration-300"
        style={
          {
            '--sidebar-background': '#282870',
          } as React.CSSProperties
        }
      >
        <SidebarContent>
          {/* Logo */}
          <div className="p-2 sm:p-3 md:p-4 lg:p-5 border-b border-white/10 min-h-[60px] sm:min-h-[70px] md:min-h-[80px] flex items-center">
            <Link
              to="/dashboard"
              className="flex items-center gap-1 sm:gap-1.5 md:gap-2 group transition-all duration-200 hover:opacity-90 w-full"
              aria-label="Retour au tableau de bord Emarzona"
            >
              {platformLogo ? (
                <LogoImageWithFallback
                  src={platformLogo}
                  className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 lg:h-12 lg:w-12 flex-shrink-0"
                />
              ) : (
                <div
                  className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 lg:h-12 lg:w-12 flex-shrink-0 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md transition-transform duration-200 group-hover:scale-105"
                  style={{ minWidth: '32px', minHeight: '32px' }}
                  aria-hidden="true"
                >
                  <span className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white">
                    E
                  </span>
                </div>
              )}
              {!isCollapsed && (
                <span
                  className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-extrabold tracking-tight leading-none whitespace-nowrap drop-shadow-lg"
                  style={{ fontFamily: 'Times New Roman, serif', color: '#6A0DAD' }}
                >
                  Emarzona
                </span>
              )}
            </Link>
          </div>

          {/* Menu Items - Organisé par sections (masqué sur pages admin) */}
          {!isOnAdminPage &&
            menuSections.map(section => (
              <SidebarGroup key={section.label}>
                <SidebarGroupLabel
                  className="font-semibold opacity-90"
                  aria-label={`Section ${section.label}`}
                >
                  {!isCollapsed && (
                    <span className="text-orange-500" style={{ color: '#FF8C00' }}>
                      {section.label}
                    </span>
                  )}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map(item => {
                      const IconComponent = item.icon;
                      if (!IconComponent) {
                        logger.warn(`Menu item missing icon: ${item.title}`);
                        return null;
                      }

                      // Menu spécial pour "Tableau de bord" avec sous-menu des boutiques - STATIQUE (toujours ouvert)
                      if (item.title === 'Tableau de bord' && !storesLoading && stores.length > 0) {
                        const isDashboardActive = location.pathname === '/dashboard';
                        return (
                          <SidebarMenuItem
                            key={`${section.label}-${item.title}-${item.url}-dashboard`}
                          >
                            <SidebarMenuButton
                              asChild
                              className={`transition-all duration-300 group relative flex items-center ${
                                isDashboardActive
                                  ? 'bg-white/20 !text-white font-semibold border-l-2 border-white/50 [&_*]:!text-white [&_svg]:!text-white [&_span]:!text-white'
                                  : '!text-white hover:bg-white/10 hover:!text-white hover:translate-x-1 [&_svg]:!text-white [&_span]:!text-white opacity-90'
                              }`}
                            >
                              <NavLink to={item.url} end className="flex items-center gap-2 w-full">
                                <IconComponent
                                  className="h-4 w-4 flex-shrink-0"
                                  aria-hidden="true"
                                />
                                {!isCollapsed && (
                                  <span className="flex-1 font-medium">{item.title}</span>
                                )}
                              </NavLink>
                            </SidebarMenuButton>
                            {/* Sous-menu des boutiques - TOUJOURS VISIBLE (statique) */}
                            {!isCollapsed && (
                              <div className="ml-4 mt-1 space-y-1">
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
                                        ? 'bg-white/20 !text-white font-semibold [&_*]:!text-white [&_svg]:!text-white [&_span]:!text-white opacity-100'
                                        : 'hover:bg-white/10 hover:!text-white hover:translate-x-1 [&_svg]:hover:!text-white [&_span]:hover:!text-white'
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
                                    className="w-full justify-start !text-white hover:bg-white/10 hover:!text-white hover:translate-x-1 transition-all duration-200 [&_svg]:!text-white [&_span]:!text-white opacity-90"
                                  >
                                    <Plus className="h-3 w-3 mr-2" />
                                    <span>Créer une boutique</span>
                                  </Button>
                                )}
                              </div>
                            )}
                          </SidebarMenuItem>
                        );
                      }

                      // Menu items normaux
                      return (
                        <SidebarMenuItem key={`${section.label}-${item.title}-${item.url}`}>
                          <SidebarMenuButton asChild>
                            <NavLink
                              to={item.url}
                              end={item.url === '/dashboard'}
                              className={({ isActive }) =>
                                `transition-all duration-300 group relative flex items-center ${
                                  isActive
                                    ? 'bg-white/20 !text-white font-semibold border-l-2 border-white/50 [&_*]:!text-white [&_svg]:!text-white [&_span]:!text-white'
                                    : '!text-white hover:bg-white/10 hover:!text-white hover:translate-x-1 [&_svg]:!text-white [&_span]:!text-white opacity-90'
                                }`
                              }
                            >
                              <IconComponent className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
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
              </SidebarGroup>
            ))}

          {/* Bouton Retour Dashboard (visible uniquement sur pages admin) */}
          {isAdmin && isOnAdminPage && (
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to="/dashboard"
                        className="!text-white hover:bg-white/10 hover:!text-white hover:translate-x-1 transition-all duration-300 [&_svg]:!text-white [&_span]:!text-white opacity-90"
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
          {isAdmin &&
            adminMenuSections.map(section => (
              <SidebarGroup key={section.label}>
                <SidebarGroupLabel className="font-semibold opacity-90">
                  {!isCollapsed && (
                    <span className="text-orange-500" style={{ color: '#FF8C00' }}>
                      {section.label}
                    </span>
                  )}
                </SidebarGroupLabel>
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
                          <SidebarMenuButton asChild>
                            <NavLink
                              to={item.url}
                              className={({ isActive }) =>
                                `transition-all duration-300 ${
                                  isActive
                                    ? 'bg-white/20 !text-white font-semibold border-l-2 border-white/50 [&_*]:!text-white [&_svg]:!text-white [&_span]:!text-white'
                                    : '!text-white hover:bg-white/10 hover:!text-white hover:translate-x-1 [&_svg]:!text-white [&_span]:!text-white opacity-90'
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
              </SidebarGroup>
            ))}
        </SidebarContent>

        {/* Footer */}
        <SidebarFooter className="border-t border-blue-400/30 p-4 space-y-2">
          {!isCollapsed && (
            <LanguageSwitcher
              variant="default"
              showLabel={true}
              className="w-full"
              buttonClassName="w-full bg-gradient-to-r from-[#7851A9] to-[#FF69B4] text-white hover:opacity-90 border-0 [&_svg]:text-white [&_span]:text-white transition-all duration-300"
            />
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
