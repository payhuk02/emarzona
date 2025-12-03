/**
 * Page My Orders - Mes Commandes client
 * Date: 26 Janvier 2025
 * 
 * Fonctionnalités:
 * - Liste toutes commandes client
 * - Filtres par statut (pending, processing, completed, cancelled)
 * - Filtres par type produit
 * - Recherche par numéro commande
 * - Détails commande (items, prix, statut)
 * - Actions (voir détails, télécharger facture)
 */

import { useState, useMemo } from 'react';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Search,
  Filter,
  Eye,
  Download,
  Calendar,
  DollarSign,
  ArrowLeft,
  ShoppingBag,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Menu,
  User,
  Loader2,
} from 'lucide-react';
import { generateInvoicePDF } from '@/lib/invoice-generator';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

type OrderStatus = 'all' | 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';
type ProductType = 'all' | 'digital' | 'physical' | 'service' | 'course';

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  currency: string;
  status: string;
  payment_status: string;
  created_at: string;
  items: OrderItem[];
}

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_type: string;
  quantity: number;
  unit_price: number;
  total_price: number;
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
          <Menu className="h-6 w-6 sm:h-7 sm:w-7 text-gray-900 dark:text-gray-50" aria-hidden="true" />
        </button>
        
        {/* Titre avec Icône */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" aria-hidden="true" />
          <h1 className="text-base sm:text-lg font-bold truncate text-gray-900 dark:text-gray-50">
            Mes Commandes
          </h1>
        </div>
      </div>
    </header>
  );
}

export default function MyOrders() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus>('all');
  const [typeFilter, setTypeFilter] = useState<ProductType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [generatingInvoice, setGeneratingInvoice] = useState<string | null>(null);
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  // Fonction pour générer et télécharger la facture
  const handleDownloadInvoice = async (order: Order) => {
    setGeneratingInvoice(order.id);
    try {
      await generateInvoicePDF({
        orderNumber: order.order_number,
        orderDate: order.created_at,
        customerName: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Client',
        customerEmail: user?.email || '',
        storeName: 'Emarzona Store',
        items: order.items.map(item => ({
          name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
        })),
        subtotal: order.total_amount,
        total: order.total_amount,
        currency: order.currency,
        paymentStatus: order.payment_status,
      });
      toast({
        title: '✅ Facture téléchargée',
        description: `La facture ${order.order_number} a été générée avec succès.`,
      });
    } catch (error) {
      toast({
        title: '❌ Erreur',
        description: 'Impossible de générer la facture. Veuillez réessayer.',
        variant: 'destructive',
      });
    } finally {
      setGeneratingInvoice(null);
    }
  };

  // Fetch orders
  const { data: orders, isLoading } = useQuery({
    queryKey: ['customer-orders', user?.id, statusFilter, typeFilter],
    queryFn: async (): Promise<Order[]> => {
      if (!user?.id) return [];

      let query = supabase
        .from('orders')
        .select('*')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      // Filter by status
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data: ordersData, error } = await query;

      if (error) throw error;

      // Fetch order items for each order
      const ordersWithItems = await Promise.all(
        (ordersData || []).map(async (order) => {
          let itemsQuery = supabase
            .from('order_items')
            .select('*')
            .eq('order_id', order.id);

          // Filter by product type
          if (typeFilter !== 'all') {
            itemsQuery = itemsQuery.eq('product_type', typeFilter);
          }

          const { data: items } = await itemsQuery;

          return {
            ...order,
            items: items || [],
          } as Order;
        })
      );

      // Filter by search query
      if (searchQuery.trim()) {
        return ordersWithItems.filter(
          order =>
            order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.items.some(item =>
              item.product_name.toLowerCase().includes(searchQuery.toLowerCase())
            )
        );
      }

      return ordersWithItems.filter(order => order.items.length > 0);
    },
    enabled: !!user?.id,
  });

  const stats = useMemo(() => {
    const totalOrders = orders?.length ?? 0;
    const pendingOrders = orders?.filter(order => order.status === 'pending').length ?? 0;
    const processingOrders = orders?.filter(order => order.status === 'processing').length ?? 0;
    const completedOrders = orders?.filter(order => order.status === 'completed').length ?? 0;
    const totalAmount = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) ?? 0;

    return {
      totalOrders,
      pendingOrders,
      processingOrders,
      completedOrders,
      totalAmount,
    };
  }, [orders]);

  const displayCurrency = useMemo(() => orders?.[0]?.currency ?? 'XOF', [orders]);

  const statsCards = useMemo(() => [
    {
      label: 'Total commandes',
      value: stats.totalOrders.toString(),
      description: 'Toutes vos commandes',
      icon: ShoppingBag,
      gradient: 'from-blue-600 to-cyan-600',
      iconGradient: 'from-blue-500/10 to-cyan-500/5',
      iconBorder: 'border-blue-500/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'En attente',
      value: stats.pendingOrders.toString(),
      description: 'En attente de traitement',
      icon: Clock,
      gradient: 'from-amber-500 to-orange-500',
      iconGradient: 'from-amber-500/10 to-orange-500/5',
      iconBorder: 'border-amber-500/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      label: 'En traitement',
      value: stats.processingOrders.toString(),
      description: 'Commandes en cours',
      icon: AlertCircle,
      gradient: 'from-purple-600 to-pink-600',
      iconGradient: 'from-purple-500/10 to-pink-500/5',
      iconBorder: 'border-purple-500/20',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      label: 'Terminées',
      value: stats.completedOrders.toString(),
      description: 'Livrées et payées',
      icon: CheckCircle,
      gradient: 'from-green-600 to-emerald-600',
      iconGradient: 'from-green-500/10 to-emerald-500/5',
      iconBorder: 'border-green-500/20',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    {
      label: 'Total dépensé',
      value: new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: displayCurrency,
        maximumFractionDigits: 0,
      }).format(stats.totalAmount),
      description: 'Montant cumulé',
      icon: DollarSign,
      gradient: 'from-indigo-600 to-blue-600',
      iconGradient: 'from-indigo-500/10 to-blue-500/5',
      iconBorder: 'border-indigo-500/20',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
    },
  ], [displayCurrency, stats.completedOrders, stats.pendingOrders, stats.processingOrders, stats.totalAmount, stats.totalOrders]);

  const getStatusBadge = (status: string, paymentStatus: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: 'En attente', variant: 'secondary' },
      processing: { label: 'En traitement', variant: 'default' },
      completed: { label: 'Terminée', variant: 'default' },
      cancelled: { label: 'Annulée', variant: 'destructive' },
      refunded: { label: 'Remboursée', variant: 'outline' },
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'secondary' as const };
    const paymentInfo = paymentStatus === 'completed' ? '✅ Payé' : '⏳ En attente';

    return (
      <div className="flex flex-col gap-1">
        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        <span className="text-xs text-muted-foreground">{paymentInfo}</span>
      </div>
    );
  };

  const getProductTypeIcon = (type: string) => {
    const icons = {
      digital: <Download className="h-4 w-4" />,
      physical: <Package className="h-4 w-4" />,
      service: <Calendar className="h-4 w-4" />,
      course: <ShoppingBag className="h-4 w-4" />,
    };
    return icons[type as keyof typeof icons] || <Package className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gray-50 dark:bg-gray-900">
          <AppSidebar />
          <main className="flex-1 flex flex-col min-w-0">
            {/* Mobile Header - Loading State */}
            <header className="sticky top-0 z-50 border-b bg-white dark:bg-gray-900 shadow-sm lg:hidden">
              <div className="flex h-14 sm:h-16 items-center gap-2 sm:gap-3 px-3 sm:px-4">
                <div className="h-10 w-10 sm:h-11 sm:w-11 min-h-[44px] min-w-[44px] rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse border border-gray-300 dark:border-gray-600" />
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <div className="h-5 w-5 sm:h-6 sm:w-6 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                  <Skeleton className="h-5 w-32 sm:w-40" />
                </div>
              </div>
            </header>
            <div className="flex-1 p-2.5 sm:p-3 md:p-4 lg:p-6 xl:p-8 overflow-x-hidden">
              <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4 md:space-y-6">
                {/* Header - Desktop seulement */}
                <div className="hidden lg:block space-y-2">
                  <Skeleton className="h-10 w-64" />
                  <Skeleton className="h-5 w-80" />
                </div>
                <Skeleton className="h-96" />
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background overflow-x-hidden">
        <AppSidebar />
        <main className="flex-1 flex flex-col min-w-0">
          {/* Mobile Header avec Hamburger et Icône */}
          <MobileHeader />
          
          {/* Contenu principal */}
          <div className="flex-1 p-2.5 sm:p-3 md:p-4 lg:p-6 xl:p-8 overflow-x-hidden">
            <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4 md:space-y-6">
              {/* Header - Desktop seulement */}
              <div ref={headerRef} className="hidden lg:block space-y-2 animate-in fade-in slide-in-from-top-4">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/account')}
                    className="touch-manipulation min-h-[44px] min-w-[44px] h-11 w-11"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-500/20 flex items-center justify-center">
                    <ShoppingBag className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    Mes Commandes
                  </h1>
                </div>
                <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-gray-600 dark:text-gray-400">
                  Consultez toutes vos commandes et leur statut
                </p>
              </div>

              {/* Stats */}
              <div
                ref={statsRef}
                className="grid gap-2.5 sm:gap-3.5 lg:gap-4 grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 animate-in fade-in slide-in-from-bottom-4 duration-700"
              >
                {statsCards.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <Card
                      key={stat.label}
                      className="border border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                      style={{ animationDelay: `${index * 70}ms` }}
                    >
                      <CardHeader className="pb-2 sm:pb-3 p-2.5 sm:p-3 lg:p-4">
                        <CardTitle className="text-[10px] xs:text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                          <div className={`h-6 w-6 rounded-lg bg-gradient-to-br ${stat.iconGradient} border ${stat.iconBorder} flex items-center justify-center`}>
                            <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${stat.iconColor}`} />
                          </div>
                          {stat.label}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-2.5 sm:p-3 lg:p-4 pt-0 space-y-1 sm:space-y-1.5">
                        <div className={`text-base sm:text-lg md:text-xl lg:text-2xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                          {stat.value}
                        </div>
                        <p className="text-[10px] xs:text-xs sm:text-sm text-muted-foreground">
                          {stat.description}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Recherche */}
              <Card className="border border-border/50 bg-gradient-to-br from-card/60 via-card/40 to-card/20 dark:from-gray-900/70 dark:via-gray-900/60 dark:to-gray-900/50 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
                <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground z-10" />
                    <Input
                      placeholder="Rechercher par numéro de commande ou produit..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 sm:pl-10 min-h-[44px] h-11 sm:h-12 lg:h-12 text-xs sm:text-sm lg:text-base touch-manipulation"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                        aria-label="Effacer la recherche"
                      >
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Filtres - Scroll horizontal sur mobile */}
              <div className="space-y-3 sm:space-y-4">
                {/* Filtre Statut */}
                <div className="relative w-full">
                  {/* Indicateur de scroll à gauche (mobile uniquement) */}
                  <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-900 pointer-events-none z-10 lg:hidden" aria-hidden="true"></div>
                  
                  {/* Indicateur de scroll à droite (mobile uniquement) */}
                  <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-50 to-transparent dark:from-gray-900 pointer-events-none z-10 lg:hidden" aria-hidden="true"></div>
                  
                  <div 
                    className="overflow-x-auto overflow-y-hidden -mx-2.5 sm:-mx-3 md:mx-0 px-2.5 sm:px-3 md:px-0 scrollbar-hide scroll-smooth"
                    style={{
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none',
                      WebkitOverflowScrolling: 'touch',
                    }}
                  >
                    <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as OrderStatus)}>
                      <TabsList className="inline-flex min-w-max sm:w-auto sm:min-w-0 flex-nowrap sm:flex-wrap gap-1.5 sm:gap-2 p-1.5 sm:p-2 h-auto touch-manipulation bg-muted/60 backdrop-blur-sm rounded-lg border border-border/50 shadow-sm">
                        <TabsTrigger 
                          value="all" 
                          className="text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 whitespace-nowrap min-h-[44px] touch-manipulation font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-200 flex-shrink-0"
                        >
                          Tous
                        </TabsTrigger>
                        <TabsTrigger 
                          value="pending" 
                          className="text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 whitespace-nowrap min-h-[44px] touch-manipulation font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-200 flex-shrink-0"
                        >
                          En attente
                        </TabsTrigger>
                        <TabsTrigger 
                          value="processing" 
                          className="text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 whitespace-nowrap min-h-[44px] touch-manipulation font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-200 flex-shrink-0"
                        >
                          En traitement
                        </TabsTrigger>
                        <TabsTrigger 
                          value="completed" 
                          className="text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 whitespace-nowrap min-h-[44px] touch-manipulation font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-200 flex-shrink-0"
                        >
                          Terminées
                        </TabsTrigger>
                        <TabsTrigger 
                          value="cancelled" 
                          className="text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 whitespace-nowrap min-h-[44px] touch-manipulation font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-200 flex-shrink-0"
                        >
                          Annulées
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </div>

                {/* Filtre Type */}
                <div className="relative w-full">
                  {/* Indicateur de scroll à gauche (mobile uniquement) */}
                  <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-900 pointer-events-none z-10 lg:hidden" aria-hidden="true"></div>
                  
                  {/* Indicateur de scroll à droite (mobile uniquement) */}
                  <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-50 to-transparent dark:from-gray-900 pointer-events-none z-10 lg:hidden" aria-hidden="true"></div>
                  
                  <div 
                    className="overflow-x-auto overflow-y-hidden -mx-2.5 sm:-mx-3 md:mx-0 px-2.5 sm:px-3 md:px-0 scrollbar-hide scroll-smooth"
                    style={{
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none',
                      WebkitOverflowScrolling: 'touch',
                    }}
                  >
                    <Tabs value={typeFilter} onValueChange={(v) => setTypeFilter(v as ProductType)}>
                      <TabsList className="inline-flex min-w-max sm:w-auto sm:min-w-0 flex-nowrap sm:flex-wrap gap-1.5 sm:gap-2 p-1.5 sm:p-2 h-auto touch-manipulation bg-muted/60 backdrop-blur-sm rounded-lg border border-border/50 shadow-sm">
                        <TabsTrigger 
                          value="all" 
                          className="text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 whitespace-nowrap min-h-[44px] touch-manipulation font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-200 flex-shrink-0"
                        >
                          Tous types
                        </TabsTrigger>
                        <TabsTrigger 
                          value="digital" 
                          className="text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 whitespace-nowrap min-h-[44px] touch-manipulation font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-200 flex-shrink-0"
                        >
                          Digitaux
                        </TabsTrigger>
                        <TabsTrigger 
                          value="physical" 
                          className="text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 whitespace-nowrap min-h-[44px] touch-manipulation font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-200 flex-shrink-0"
                        >
                          Physiques
                        </TabsTrigger>
                        <TabsTrigger 
                          value="service" 
                          className="text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 whitespace-nowrap min-h-[44px] touch-manipulation font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-200 flex-shrink-0"
                        >
                          Services
                        </TabsTrigger>
                        <TabsTrigger 
                          value="course" 
                          className="text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 whitespace-nowrap min-h-[44px] touch-manipulation font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-200 flex-shrink-0"
                        >
                          Cours
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </div>
              </div>

              {/* Résumé */}
              <div className="px-2.5 sm:px-0">
                <p className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 dark:text-gray-50">
                  <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    {orders?.length || 0}
                  </span> {orders?.length === 1 ? 'commande' : 'commandes'}
                </p>
              </div>

              {/* Liste des Commandes */}
              {!orders || orders.length === 0 ? (
              <Card className="border border-border/50 bg-gradient-to-br from-card/60 via-card/40 to-card/20 dark:from-gray-900/70 dark:via-gray-900/60 dark:to-gray-900/50 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
                <CardContent className="pt-8 sm:pt-12 pb-8 sm:pb-12 px-4 sm:px-6">
                    <div className="text-center space-y-4">
                      <div className="h-16 w-16 sm:h-20 sm:w-20 mx-auto rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-500/30 flex items-center justify-center">
                        <Package className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-50">
                          Aucune commande
                        </h3>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                          Vous n'avez pas encore passé de commande
                        </p>
                      </div>
                      <Button 
                        onClick={() => navigate('/marketplace')}
                        className="mt-4 min-h-[44px] touch-manipulation bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 border-0 transition-all duration-300 hover:scale-105 text-xs sm:text-sm px-6 sm:px-8"
                        size="lg"
                      >
                        Découvrir la marketplace
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {orders.map((order, index) => (
                    <Card
                      key={order.id}
                      className="border border-border/50 bg-gradient-to-br from-card/60 via-card/40 to-card/20 dark:from-gray-900/70 dark:via-gray-900/60 dark:to-gray-900/50 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-6 pt-4 sm:pt-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-gray-900 dark:text-gray-50">
                              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-500/20 flex items-center justify-center">
                                <Package className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                              </div>
                              <span className="truncate">Commande #{order.order_number}</span>
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-1.5 sm:mt-2 text-xs sm:text-sm">
                              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                              <span className="truncate">
                                {new Date(order.created_at).toLocaleDateString('fr-FR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </CardDescription>
                          </div>
                          <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-shrink-0">
                            <div className="flex-shrink-0">
                              {getStatusBadge(order.status, order.payment_status)}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="font-bold text-base sm:text-lg bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                {order.total_amount.toLocaleString('fr-FR')} {order.currency}
                              </p>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                {order.items.length} {order.items.length === 1 ? 'article' : 'articles'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
                        {/* Order Items */}
                        <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                          {order.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 p-2.5 sm:p-3 border border-border/50 rounded-lg bg-muted/40 dark:bg-muted/30"
                            >
                              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                <div className="flex-shrink-0 text-primary">
                                  {getProductTypeIcon(item.product_type)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-50 truncate">
                                    {item.product_name}
                                  </p>
                                  <p className="text-xs sm:text-sm text-muted-foreground">
                                    {item.quantity}x {item.unit_price.toLocaleString('fr-FR')} {order.currency}
                                  </p>
                                </div>
                              </div>
                              <p className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-50 flex-shrink-0 sm:text-right">
                                {item.total_price.toLocaleString('fr-FR')} {order.currency}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                          <Button
                            variant="outline"
                            onClick={() => navigate(`/orders/${order.id}`)}
                            className="flex-1 sm:flex-none min-h-[44px] touch-manipulation text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 border-0 transition-all duration-300 hover:scale-105"
                          >
                            <Eye className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
                            <span className="truncate">Voir les détails</span>
                          </Button>
                          {order.payment_status === 'completed' && (
                            <Button
                              variant="outline"
                              onClick={() => handleDownloadInvoice(order)}
                              disabled={generatingInvoice === order.id}
                              className="flex-1 sm:flex-none min-h-[44px] touch-manipulation text-xs sm:text-sm bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 border-0 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {generatingInvoice === order.id ? (
                                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
                              )}
                              <span className="truncate">
                                {generatingInvoice === order.id ? 'Génération...' : 'Télécharger facture'}
                              </span>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

