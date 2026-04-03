/**
 * Page Customer Portal - Dashboard client complet
 * Date: 26 Janvier 2025
 *
 * Fonctionnalités:
 * - Vue d'ensemble tous achats (5 types)
 * - Statistiques personnelles
 * - Navigation vers sections détaillées
 * - Support complet 5 types produits (digital, physical, service, course, artist)
 */

import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import {
  ShoppingBag,
  Download,
  BookOpen,
  Calendar,
  Package,
  TrendingUp,
  FileText,
  User as UserIcon,
  ArrowRight,
  Heart,
  Menu,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { ReturnsTab } from '@/components/customer/ReturnsTab';
import CustomerMyGiftCards from './CustomerMyGiftCards';
import { DownloadsTab } from '@/components/customer/DownloadsTab';
import { LicensesTab } from '@/components/customer/LicensesTab';
import { UpdatesTab } from '@/components/customer/UpdatesTab';
import { FavoritesTab } from '@/components/customer/FavoritesTab';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

interface CustomerStats {
  totalOrders: number;
  totalSpent: number;
  digitalProducts: number;
  physicalProducts: number;
  services: number;
  courses: number;
  artistProducts: number;
  activeSubscriptions: number;
}

// Composant interne pour utiliser useSidebar
function MobileHeader() {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="sticky top-0 z-50 border-b bg-white dark:bg-gray-900 shadow-sm lg:hidden">
      <div className="flex h-14 sm:h-16 items-center gap-2 sm:gap-3 px-3 sm:px-4">
        {/* Hamburger Menu - Très visible */}
        <button
          onClick={toggleSidebar}
          className="touch-manipulation h-10 w-10 sm:h-11 sm:w-11 min-h-[44px] min-w-[44px] p-0 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 transition-colors border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 shadow-md hover:shadow-lg"
          aria-label="Ouvrir le menu"
          type="button"
        >
          <Menu
            className="h-6 w-6 sm:h-7 sm:w-7 text-gray-900 dark:text-gray-50"
            aria-hidden="true"
          />
        </button>

        {/* Titre avec Icône */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <UserIcon
            className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0"
            aria-hidden="true"
          />
          <h1 className="text-sm sm:text-base md:text-lg font-bold truncate text-gray-900 dark:text-gray-50">
            Mon Espace Client
          </h1>
        </div>
      </div>
    </header>
  );
}

export default function CustomerPortal() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const headerRef = useScrollAnimation<HTMLDivElement>();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  // Fonctions de navigation optimisées pour des redirections rapides et fluides
  const navigateToOrders = useCallback(
    (e?: React.MouseEvent) => {
      e?.preventDefault();
      e?.stopPropagation();
      navigate('/account/orders', { replace: true });
    },
    [navigate]
  );

  const navigateToDownloads = useCallback(
    (e?: React.MouseEvent) => {
      e?.preventDefault();
      e?.stopPropagation();
      navigate('/account/downloads', { replace: true });
    },
    [navigate]
  );

  const navigateToLicenses = useCallback(
    (e?: React.MouseEvent) => {
      e?.preventDefault();
      e?.stopPropagation();
      navigate('/dashboard/my-licenses', { replace: true });
    },
    [navigate]
  );

  const navigateToCourses = useCallback(
    (e?: React.MouseEvent) => {
      e?.preventDefault();
      e?.stopPropagation();
      navigate('/account/courses', { replace: true });
    },
    [navigate]
  );

  const navigateToWishlist = useCallback(
    (e?: React.MouseEvent) => {
      e?.preventDefault();
      e?.stopPropagation();
      navigate('/account/wishlist', { replace: true });
    },
    [navigate]
  );

  const navigateToLoyalty = useCallback(
    (e?: React.MouseEvent) => {
      e?.preventDefault();
      e?.stopPropagation();
      navigate('/dashboard/loyalty', { replace: true });
    },
    [navigate]
  );

  const navigateToProfile = useCallback(
    (e?: React.MouseEvent) => {
      e?.preventDefault();
      e?.stopPropagation();
      navigate('/account/profile', { replace: true });
    },
    [navigate]
  );

  const navigateToBookings = useCallback(
    (e?: React.MouseEvent) => {
      e?.preventDefault();
      e?.stopPropagation();
      navigate('/account/bookings', { replace: true });
    },
    [navigate]
  );

  const navigateToInvoices = useCallback(
    (e?: React.MouseEvent) => {
      e?.preventDefault();
      e?.stopPropagation();
      navigate('/account/invoices', { replace: true });
    },
    [navigate]
  );

  // Fetch customer statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['customer-stats', user?.id],
    queryFn: async (): Promise<CustomerStats> => {
      if (!user?.id) throw new Error('User not authenticated');

      // Total orders
      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', user.id);

      // Get all orders for customer (for total spent and product type counting)
      const { data: allOrders } = await supabase
        .from('orders')
        .select('id, total_amount, payment_status')
        .eq('customer_id', user.id);

      // Calculate total spent from paid orders (payment_status can be 'paid' or 'completed')
      const totalSpent =
        allOrders
          ?.filter(order => order.payment_status === 'paid' || order.payment_status === 'completed')
          .reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

      // Get order IDs for product type counting
      const orderIds = allOrders?.map(o => o.id) || [];

      const typeCounts = {
        digital: 0,
        physical: 0,
        service: 0,
        course: 0,
        artist: 0,
      };

      if (orderIds.length > 0) {
        // Récupérer les order_items avec jointure vers products pour obtenir product_type
        const { data: orderItemsWithProducts } = await supabase
          .from('order_items')
          .select(
            `
            id,
            product_id,
            products (
              product_type
            )
          `
          )
          .in('order_id', orderIds);

        // Compter par type de produit (tous les 5 types sont pris en compte)
        if (orderItemsWithProducts) {
          orderItemsWithProducts.forEach(item => {
            const productType = item.products?.product_type;
            if (productType === 'digital') typeCounts.digital++;
            else if (productType === 'physical') typeCounts.physical++;
            else if (productType === 'service') typeCounts.service++;
            else if (productType === 'course') typeCounts.course++;
            else if (productType === 'artist') typeCounts.artist++;
          });
        }
      }

      // Active subscriptions (si la table existe)
      let  subscriptionsCount= 0;
      try {
        // La table subscriptions peut ne pas être dans les types Supabase générés
        // mais elle peut exister dans la base de données. Le try-catch gère le cas où elle n'existe pas.
        const { count } = await (supabase as any)
          .from('subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'active');
        subscriptionsCount = count || 0;
      } catch (_error) {
        // Table subscriptions n'existe peut-être pas, ignorer l'erreur
        subscriptionsCount = 0;
      }

      return {
        totalOrders: ordersCount || 0,
        totalSpent,
        digitalProducts: typeCounts.digital,
        physicalProducts: typeCounts.physical,
        services: typeCounts.service,
        courses: typeCounts.course,
        artistProducts: typeCounts.artist,
        activeSubscriptions: subscriptionsCount || 0,
      };
    },
    enabled: !!user?.id,
  });

  if (statsLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gray-50 dark:bg-gray-900">
          <AppSidebar />
          <main className="flex-1 flex flex-col min-w-0">
            {/* Mobile Header avec SidebarTrigger et Icône - Loading State */}
            <header className="sticky top-0 z-50 border-b bg-white dark:bg-gray-900 shadow-sm lg:hidden">
              <div className="flex h-14 sm:h-16 items-center gap-2 sm:gap-3 px-3 sm:px-4">
                {/* Hamburger Menu Skeleton */}
                <div className="h-10 w-10 sm:h-11 sm:w-11 min-h-[44px] min-w-[44px] rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse border border-gray-300 dark:border-gray-600" />
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                  <Skeleton className="h-5 w-40 sm:w-48" />
                </div>
              </div>
            </header>

            {/* Contenu principal */}
            <div className="flex-1 p-2.5 sm:p-3 md:p-4 lg:p-6 xl:p-8 overflow-x-hidden">
              <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4 md:space-y-6">
                {/* Header - Desktop seulement */}
                <div className="hidden lg:block space-y-2">
                  <Skeleton className="h-10 w-64" />
                  <Skeleton className="h-5 w-80" />
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <Skeleton key={i} className="h-28 sm:h-32" />
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50 dark:bg-gray-900">
        <AppSidebar />
        <main className="flex-1 flex flex-col min-w-0">
          {/* Mobile Header avec Hamburger et Icône */}
          <MobileHeader />

          {/* Contenu principal */}
          <div className="flex-1 p-2.5 sm:p-3 md:p-4 lg:p-6 xl:p-8 overflow-x-hidden">
            <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4 md:space-y-6">
              {/* Header - Desktop seulement */}
              <div
                ref={headerRef}
                className="hidden lg:block space-y-2 animate-in fade-in slide-in-from-top-4"
              >
                <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold flex items-center gap-1.5 sm:gap-2 md:gap-3 text-gray-900 dark:text-gray-50">
                  <div className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20 flex items-center justify-center">
                    <UserIcon className="h-4 w-4 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Mon Espace Client
                  </span>
                </h1>
                <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-gray-600 dark:text-gray-400">
                  Gérez vos achats, téléchargements et informations personnelles
                </p>
              </div>

              {/* Statistiques */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                <Card className="border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300 touch-manipulation animate-in fade-in slide-in-from-bottom-4">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2 px-3 pt-3 sm:px-4 sm:pt-4">
                    <CardTitle className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium text-gray-900 dark:text-gray-50 leading-tight">
                      Total Commandes
                    </CardTitle>
                    <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-500/20 flex items-center justify-center">
                      <ShoppingBag className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    </div>
                  </CardHeader>
                  <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
                    <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                      {stats?.totalOrders || 0}
                    </div>
                    <p className="text-[10px] xs:text-xs text-muted-foreground mt-0.5 sm:mt-1 leading-tight">
                      Commandes passées
                    </p>
                  </CardContent>
                </Card>

                <Card className="border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300 touch-manipulation animate-in fade-in slide-in-from-bottom-4">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2 px-3 pt-3 sm:px-4 sm:pt-4">
                    <CardTitle className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium text-gray-900 dark:text-gray-50 leading-tight">
                      Total Dépensé
                    </CardTitle>
                    <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20 flex items-center justify-center">
                      <TrendingUp className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                    </div>
                  </CardHeader>
                  <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
                    <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent break-words">
                      {(stats?.totalSpent || 0).toLocaleString('fr-FR')} XOF
                    </div>
                    <p className="text-[10px] xs:text-xs text-muted-foreground mt-0.5 sm:mt-1 leading-tight">
                      Depuis le début
                    </p>
                  </CardContent>
                </Card>

                <Card className="border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300 touch-manipulation animate-in fade-in slide-in-from-bottom-4">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2 px-3 pt-3 sm:px-4 sm:pt-4">
                    <CardTitle className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium text-gray-900 dark:text-gray-50 leading-tight">
                      Produits Digitaux
                    </CardTitle>
                    <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20 flex items-center justify-center">
                      <Download className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                    </div>
                  </CardHeader>
                  <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
                    <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {stats?.digitalProducts || 0}
                    </div>
                    <p className="text-[10px] xs:text-xs text-muted-foreground mt-0.5 sm:mt-1 leading-tight">
                      Achetés
                    </p>
                  </CardContent>
                </Card>

                <Card className="border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300 touch-manipulation animate-in fade-in slide-in-from-bottom-4">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2 px-3 pt-3 sm:px-4 sm:pt-4">
                    <CardTitle className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium text-gray-900 dark:text-gray-50 leading-tight">
                      Cours En Ligne
                    </CardTitle>
                    <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-gradient-to-br from-orange-500/10 to-red-500/5 border border-orange-500/20 flex items-center justify-center">
                      <BookOpen className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                    </div>
                  </CardHeader>
                  <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
                    <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                      {stats?.courses || 0}
                    </div>
                    <p className="text-[10px] xs:text-xs text-muted-foreground mt-0.5 sm:mt-1 leading-tight">
                      Inscrit(e)s
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Sections principales */}
              <Tabs defaultValue="overview" className="space-y-3 sm:space-y-4 md:space-y-6 w-full">
                {/* Container pour tabs avec scroll horizontal sur mobile */}
                <div className="relative w-full">
                  {/* Indicateur de scroll à gauche (mobile uniquement) */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-900 pointer-events-none z-10 lg:hidden"
                    aria-hidden="true"
                  ></div>

                  {/* Indicateur de scroll à droite (mobile uniquement) */}
                  <div
                    className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-50 to-transparent dark:from-gray-900 pointer-events-none z-10 lg:hidden"
                    aria-hidden="true"
                  ></div>

                  {/* Tabs avec scroll horizontal */}
                  <div
                    className="overflow-x-auto overflow-y-hidden -mx-2.5 sm:-mx-3 md:mx-0 px-2.5 sm:px-3 md:px-0 scrollbar-hide scroll-smooth"
                    style={{
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none',
                      WebkitOverflowScrolling: 'touch',
                    }}
                  >
                    <TabsList className="inline-flex min-w-max sm:w-auto sm:min-w-0 flex-nowrap sm:flex-wrap gap-1.5 sm:gap-2 p-1.5 sm:p-2 h-auto touch-manipulation bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                      <TabsTrigger
                        value="overview"
                        className="text-[10px] xs:text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 whitespace-nowrap min-h-[44px] touch-manipulation font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-200 flex-shrink-0"
                      >
                        Vue d'ensemble
                      </TabsTrigger>
                      <TabsTrigger
                        value="orders"
                        className="text-[10px] xs:text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 whitespace-nowrap min-h-[44px] touch-manipulation font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-200 flex-shrink-0"
                        onClick={navigateToOrders}
                      >
                        Commandes
                      </TabsTrigger>
                      <TabsTrigger
                        value="downloads"
                        className="text-[10px] xs:text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 whitespace-nowrap min-h-[44px] touch-manipulation font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-200 flex-shrink-0"
                        onClick={navigateToDownloads}
                      >
                        Téléchargements
                      </TabsTrigger>
                      <TabsTrigger
                        value="licenses"
                        className="text-[10px] xs:text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 whitespace-nowrap min-h-[44px] touch-manipulation font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-200 flex-shrink-0"
                        onClick={navigateToLicenses}
                      >
                        Licences
                      </TabsTrigger>
                      <TabsTrigger
                        value="updates"
                        className="text-[10px] xs:text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 whitespace-nowrap min-h-[44px] touch-manipulation font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-200 flex-shrink-0"
                      >
                        Mises à jour
                      </TabsTrigger>
                      <TabsTrigger
                        value="courses"
                        className="text-[10px] xs:text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 whitespace-nowrap min-h-[44px] touch-manipulation font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-200 flex-shrink-0"
                        onClick={navigateToCourses}
                      >
                        Mes Cours
                      </TabsTrigger>
                      <TabsTrigger
                        value="wishlist"
                        className="text-[10px] xs:text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 whitespace-nowrap min-h-[44px] touch-manipulation font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-200 flex-shrink-0"
                        onClick={navigateToWishlist}
                      >
                        Favoris
                      </TabsTrigger>
                      <TabsTrigger
                        value="loyalty"
                        className="text-[10px] xs:text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 whitespace-nowrap min-h-[44px] touch-manipulation font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-200 flex-shrink-0"
                        onClick={navigateToLoyalty}
                      >
                        Fidélité
                      </TabsTrigger>
                      <TabsTrigger
                        value="gift-cards"
                        className="text-[10px] xs:text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 whitespace-nowrap min-h-[44px] touch-manipulation font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-200 flex-shrink-0"
                      >
                        Cartes Cadeaux
                      </TabsTrigger>
                      <TabsTrigger
                        value="returns"
                        className="text-[10px] xs:text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 whitespace-nowrap min-h-[44px] touch-manipulation font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-200 flex-shrink-0"
                      >
                        Mes Retours
                      </TabsTrigger>
                      <TabsTrigger
                        value="profile"
                        className="text-[10px] xs:text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 whitespace-nowrap min-h-[44px] touch-manipulation font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-200 flex-shrink-0"
                        onClick={navigateToProfile}
                      >
                        Mon Profil
                      </TabsTrigger>
                    </TabsList>
                  </div>
                </div>

                {/* Vue d'ensemble */}
                <TabsContent
                  value="overview"
                  className="space-y-2.5 sm:space-y-3 md:space-y-4 mt-3 sm:mt-4 md:mt-6"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 md:gap-4">
                    {/* Mes Commandes */}
                    <Card
                      className="border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-lg active:scale-[0.98] transition-all duration-300 cursor-pointer group touch-manipulation animate-in fade-in slide-in-from-bottom-4"
                      onClick={navigateToOrders}
                    >
                      <CardHeader className="pb-2 sm:pb-3 px-3 pt-3 sm:px-4 sm:pt-4">
                        <CardTitle className="flex items-center gap-2 text-xs sm:text-sm md:text-base lg:text-lg text-gray-900 dark:text-gray-50">
                          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-500/20 flex items-center justify-center">
                            <Package className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                          </div>
                          <span>Mes Commandes</span>
                        </CardTitle>
                        <CardDescription className="text-[10px] sm:text-xs md:text-sm mt-1 leading-snug">
                          Consultez toutes vos commandes et leur statut
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
                        <Button
                          variant="outline"
                          className="w-full justify-between bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 border-0 transition-all duration-300 min-h-[44px] touch-manipulation text-xs sm:text-sm"
                        >
                          <span className="truncate">Voir toutes mes commandes</span>
                          <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-2 flex-shrink-0" />
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Mes Téléchargements */}
                    <Card
                      className="border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-lg active:scale-[0.98] transition-all duration-300 cursor-pointer group touch-manipulation animate-in fade-in slide-in-from-bottom-4"
                      onClick={navigateToDownloads}
                    >
                      <CardHeader className="pb-2 sm:pb-3 px-3 pt-3 sm:px-4 sm:pt-4">
                        <CardTitle className="flex items-center gap-2 text-xs sm:text-sm md:text-base lg:text-lg text-gray-900 dark:text-gray-50">
                          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20 flex items-center justify-center">
                            <Download className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                          </div>
                          <span>Mes Téléchargements</span>
                        </CardTitle>
                        <CardDescription className="text-[10px] sm:text-xs md:text-sm mt-1 leading-snug">
                          Accédez à vos produits digitaux achetés
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
                        <Button
                          variant="outline"
                          className="w-full justify-between bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 border-0 transition-all duration-300 min-h-[44px] touch-manipulation text-xs sm:text-sm"
                        >
                          <span className="truncate">Accéder aux téléchargements</span>
                          <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-2 flex-shrink-0" />
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Mes Cours */}
                    <Card
                      className="border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-lg active:scale-[0.98] transition-all duration-300 cursor-pointer group touch-manipulation animate-in fade-in slide-in-from-bottom-4"
                      onClick={navigateToCourses}
                    >
                      <CardHeader className="pb-2 sm:pb-3 px-3 pt-3 sm:px-4 sm:pt-4">
                        <CardTitle className="flex items-center gap-2 text-xs sm:text-sm md:text-base lg:text-lg text-gray-900 dark:text-gray-50">
                          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gradient-to-br from-orange-500/10 to-red-500/5 border border-orange-500/20 flex items-center justify-center">
                            <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                          </div>
                          <span>Mes Cours</span>
                        </CardTitle>
                        <CardDescription className="text-[10px] sm:text-xs md:text-sm mt-1 leading-snug">
                          Continuez votre apprentissage
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
                        <Button
                          variant="outline"
                          className="w-full justify-between bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-700 hover:to-red-700 border-0 transition-all duration-300 min-h-[44px] touch-manipulation text-xs sm:text-sm"
                        >
                          <span className="truncate">Voir mes cours</span>
                          <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-2 flex-shrink-0" />
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Mes Réservations */}
                    <Card
                      className="border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-lg active:scale-[0.98] transition-all duration-300 cursor-pointer group touch-manipulation animate-in fade-in slide-in-from-bottom-4"
                      onClick={navigateToBookings}
                    >
                      <CardHeader className="pb-2 sm:pb-3 px-3 pt-3 sm:px-4 sm:pt-4">
                        <CardTitle className="flex items-center gap-2 text-xs sm:text-sm md:text-base lg:text-lg text-gray-900 dark:text-gray-50">
                          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20 flex items-center justify-center">
                            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                          </div>
                          <span>Mes Réservations</span>
                        </CardTitle>
                        <CardDescription className="text-[10px] sm:text-xs md:text-sm mt-1 leading-snug">
                          Gérez vos réservations de services
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
                        <Button
                          variant="outline"
                          className="w-full justify-between bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 border-0 transition-all duration-300 min-h-[44px] touch-manipulation text-xs sm:text-sm"
                        >
                          <span className="truncate">Voir mes réservations</span>
                          <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-2 flex-shrink-0" />
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Factures */}
                    <Card
                      className="border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-lg active:scale-[0.98] transition-all duration-300 cursor-pointer group touch-manipulation animate-in fade-in slide-in-from-bottom-4"
                      onClick={navigateToInvoices}
                    >
                      <CardHeader className="pb-2 sm:pb-3 px-3 pt-3 sm:px-4 sm:pt-4">
                        <CardTitle className="flex items-center gap-2 text-xs sm:text-sm md:text-base lg:text-lg text-gray-900 dark:text-gray-50">
                          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gradient-to-br from-indigo-500/10 to-blue-500/5 border border-indigo-500/20 flex items-center justify-center">
                            <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                          </div>
                          <span>Mes Factures</span>
                        </CardTitle>
                        <CardDescription className="text-[10px] sm:text-xs md:text-sm mt-1 leading-snug">
                          Téléchargez vos factures et reçus
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
                        <Button
                          variant="outline"
                          className="w-full justify-between bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:from-indigo-700 hover:to-blue-700 border-0 transition-all duration-300 min-h-[44px] touch-manipulation text-xs sm:text-sm"
                        >
                          <span className="truncate">Voir mes factures</span>
                          <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-2 flex-shrink-0" />
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Ma Wishlist */}
                    <Card
                      className="border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-lg active:scale-[0.98] transition-all duration-300 cursor-pointer group touch-manipulation animate-in fade-in slide-in-from-bottom-4"
                      onClick={navigateToWishlist}
                    >
                      <CardHeader className="pb-2 sm:pb-3 px-3 pt-3 sm:px-4 sm:pt-4">
                        <CardTitle className="flex items-center gap-2 text-xs sm:text-sm md:text-base lg:text-lg text-gray-900 dark:text-gray-50">
                          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gradient-to-br from-red-500/10 to-pink-500/5 border border-red-500/20 flex items-center justify-center">
                            <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                          </div>
                          <span>Ma Wishlist</span>
                        </CardTitle>
                        <CardDescription className="text-[10px] sm:text-xs md:text-sm mt-1 leading-snug">
                          Consultez vos produits favoris
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
                        <Button
                          variant="outline"
                          className="w-full justify-between bg-gradient-to-r from-red-600 to-pink-600 text-white hover:from-red-700 hover:to-pink-700 border-0 transition-all duration-300 min-h-[44px] touch-manipulation text-xs sm:text-sm"
                        >
                          <span className="truncate">Voir ma wishlist</span>
                          <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-2 flex-shrink-0" />
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Mon Profil */}
                    <Card
                      className="border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-lg active:scale-[0.98] transition-all duration-300 cursor-pointer group touch-manipulation animate-in fade-in slide-in-from-bottom-4"
                      onClick={navigateToProfile}
                    >
                      <CardHeader className="pb-2 sm:pb-3 px-3 pt-3 sm:px-4 sm:pt-4">
                        <CardTitle className="flex items-center gap-2 text-xs sm:text-sm md:text-base lg:text-lg text-gray-900 dark:text-gray-50">
                          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20 flex items-center justify-center">
                            <UserIcon className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                          </div>
                          <span>Mon Profil</span>
                        </CardTitle>
                        <CardDescription className="text-[10px] sm:text-xs md:text-sm mt-1 leading-snug">
                          Gérez vos informations personnelles
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
                        <Button
                          variant="outline"
                          className="w-full justify-between bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 border-0 transition-all duration-300 min-h-[40px] sm:min-h-[44px] touch-manipulation text-xs sm:text-sm"
                        >
                          <span className="truncate">Modifier mon profil</span>
                          <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-2 flex-shrink-0" />
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Redirections vers pages détaillées */}
                <TabsContent value="orders" className="mt-3 sm:mt-4 md:mt-6">
                  <div className="text-center py-6 sm:py-8 md:py-12">
                    <p className="text-sm sm:text-base text-muted-foreground mb-4">
                      Redirection vers Mes Commandes...
                    </p>
                  </div>
                </TabsContent>
                <TabsContent value="downloads" className="mt-3 sm:mt-4 md:mt-6">
                  <DownloadsTab />
                </TabsContent>
                <TabsContent value="courses" className="mt-3 sm:mt-4 md:mt-6">
                  <div className="text-center py-6 sm:py-8 md:py-12">
                    <p className="text-sm sm:text-base text-muted-foreground mb-4">
                      Redirection vers Mes Cours...
                    </p>
                  </div>
                </TabsContent>
                <TabsContent value="wishlist" className="mt-3 sm:mt-4 md:mt-6">
                  <FavoritesTab />
                </TabsContent>
                <TabsContent value="loyalty" className="mt-3 sm:mt-4 md:mt-6">
                  <div className="text-center py-6 sm:py-8 md:py-12">
                    <p className="text-sm sm:text-base text-muted-foreground mb-4">
                      Redirection vers Programme de Fidélité...
                    </p>
                  </div>
                </TabsContent>
                <TabsContent value="gift-cards" className="mt-3 sm:mt-4 md:mt-6">
                  <CustomerMyGiftCards />
                </TabsContent>
                <TabsContent value="returns" className="mt-3 sm:mt-4 md:mt-6">
                  <ReturnsTab />
                </TabsContent>
                <TabsContent value="profile" className="mt-3 sm:mt-4 md:mt-6">
                  <div className="text-center py-6 sm:py-8 md:py-12">
                    <p className="text-sm sm:text-base text-muted-foreground mb-4">
                      Redirection vers Mon Profil...
                    </p>
                  </div>
                </TabsContent>

                {/* Nouveaux onglets */}
                <TabsContent value="licenses" className="mt-3 sm:mt-4 md:mt-6">
                  <LicensesTab />
                </TabsContent>
                <TabsContent value="updates" className="mt-3 sm:mt-4 md:mt-6">
                  <UpdatesTab />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}






