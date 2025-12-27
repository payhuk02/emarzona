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
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Search,
  Eye,
  Download,
  Calendar,
  DollarSign,
  ShoppingBag,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Loader2,
  Palette,
} from 'lucide-react';
import { generateInvoicePDF } from '@/lib/invoice-generator';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

type OrderStatus = 'all' | 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';
type ProductType = 'all' | 'digital' | 'physical' | 'service' | 'course' | 'artist';

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

export default function MyOrders() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<{
    id: string;
    email?: string;
    user_metadata?: { full_name?: string };
  } | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus>('all');
  const [typeFilter, setTypeFilter] = useState<ProductType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [generatingInvoice, setGeneratingInvoice] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
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
    } catch (_error) {
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
  const { data: allOrders, isLoading } = useQuery({
    queryKey: ['customer-orders', user?.id, statusFilter, typeFilter],
    queryFn: async (): Promise<Order[]> => {
      if (!user?.id) return [];

      let  query= supabase
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
        (ordersData || []).map(async order => {
          let  itemsQuery= supabase.from('order_items').select('*').eq('order_id', order.id);

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

      return ordersWithItems.filter(order => order.items.length > 0);
    },
    enabled: !!user?.id,
  });

  // Filter by search query (client-side filtering for better UX)
  const orders = useMemo(() => {
    if (!allOrders) return [];

    if (!searchQuery.trim()) {
      return allOrders;
    }

    const query = searchQuery.toLowerCase();
    return allOrders.filter(
      order =>
        order.order_number.toLowerCase().includes(query) ||
        order.items.some(item => item.product_name.toLowerCase().includes(query))
    );
  }, [allOrders, searchQuery]);

  const stats = useMemo(() => {
    // Use allOrders for stats (filtered by status/type, but not by search)
    const ordersForStats = allOrders || [];
    const totalOrders = ordersForStats.length;
    const pendingOrders = ordersForStats.filter(order => order.status === 'pending').length;
    const processingOrders = ordersForStats.filter(order => order.status === 'processing').length;
    const completedOrders = ordersForStats.filter(order => order.status === 'completed').length;
    const totalAmount = ordersForStats.reduce((sum, order) => sum + (order.total_amount || 0), 0);

    return {
      totalOrders,
      pendingOrders,
      processingOrders,
      completedOrders,
      totalAmount,
    };
  }, [allOrders]);

  const displayCurrency = useMemo(() => allOrders?.[0]?.currency ?? 'XOF', [allOrders]);

  const statsCards = useMemo(
    () => [
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
    ],
    [
      displayCurrency,
      stats.completedOrders,
      stats.pendingOrders,
      stats.processingOrders,
      stats.totalAmount,
      stats.totalOrders,
    ]
  );

  const getStatusBadge = (status: string, paymentStatus: string) => {
    const  statusMap: Record<
      string,
      { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
    > = {
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
      artist: <Palette className="h-4 w-4" />,
    };
    return icons[type as keyof typeof icons] || <Package className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <MainLayout layoutType="account">
        <div className="container mx-auto p-6 space-y-6">
          <div className="hidden lg:block space-y-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-5 w-80" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout layoutType="account">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div
          ref={headerRef}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4"
          role="banner"
        >
          <div>
            <h1
              className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2"
              id="my-orders-title"
            >
              <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/5 backdrop-blur-sm border border-blue-500/20 animate-in zoom-in duration-500">
                <ShoppingBag
                  className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-blue-500 dark:text-blue-400"
                  aria-hidden="true"
                />
              </div>
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Mes Commandes
              </span>
            </h1>
            <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground">
              Consultez toutes vos commandes et leur statut
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div
          ref={statsRef}
          className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-5 animate-in fade-in slide-in-from-bottom-4 duration-700"
          role="region"
          aria-label="Statistiques des commandes"
        >
          {statsCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.label}
                className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2 p-2.5 sm:p-3 md:p-4">
                  <CardTitle className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium">
                    {stat.label}
                  </CardTitle>
                  <Icon
                    className={`h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4 ${stat.iconColor}`}
                    aria-hidden="true"
                  />
                </CardHeader>
                <CardContent className="p-2.5 sm:p-3 md:p-4 pt-0">
                  <div
                    className={`text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold ${stat.gradient.includes('from-') ? `bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent` : ''}`}
                  >
                    {stat.value}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recherche */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par numéro de commande ou produit..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-8 min-h-[44px] text-xs sm:text-sm"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-2.5 h-5 w-5 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                      aria-label="Effacer la recherche"
                    >
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Filtres */}
        <div className="space-y-3 sm:space-y-4">
          {/* Filtre Statut */}
          <Card>
            <CardHeader>
              <Tabs value={statusFilter} onValueChange={v => setStatusFilter(v as OrderStatus)}>
                <TabsList className="bg-muted/50 backdrop-blur-sm h-auto p-1 gap-1.5 sm:gap-2">
                  <TabsTrigger
                    value="all"
                    className="min-h-[44px] text-[10px] xs:text-xs sm:text-sm px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white transition-all duration-300"
                  >
                    Tous
                  </TabsTrigger>
                  <TabsTrigger
                    value="pending"
                    className="min-h-[44px] text-[10px] xs:text-xs sm:text-sm px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white transition-all duration-300"
                  >
                    En attente
                  </TabsTrigger>
                  <TabsTrigger
                    value="processing"
                    className="min-h-[44px] text-[10px] xs:text-xs sm:text-sm px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white transition-all duration-300"
                  >
                    En traitement
                  </TabsTrigger>
                  <TabsTrigger
                    value="completed"
                    className="min-h-[44px] text-[10px] xs:text-xs sm:text-sm px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white transition-all duration-300"
                  >
                    Terminées
                  </TabsTrigger>
                  <TabsTrigger
                    value="cancelled"
                    className="min-h-[44px] text-[10px] xs:text-xs sm:text-sm px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white transition-all duration-300"
                  >
                    Annulées
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
          </Card>

          {/* Filtre Type */}
          <Card>
            <CardHeader>
              <Tabs value={typeFilter} onValueChange={v => setTypeFilter(v as ProductType)}>
                <TabsList className="bg-muted/50 backdrop-blur-sm h-auto p-1 gap-1.5 sm:gap-2">
                  <TabsTrigger
                    value="all"
                    className="min-h-[44px] text-[10px] xs:text-xs sm:text-sm px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white transition-all duration-300"
                  >
                    Tous types
                  </TabsTrigger>
                  <TabsTrigger
                    value="digital"
                    className="min-h-[44px] text-[10px] xs:text-xs sm:text-sm px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white transition-all duration-300"
                  >
                    Digitaux
                  </TabsTrigger>
                  <TabsTrigger
                    value="physical"
                    className="min-h-[44px] text-[10px] xs:text-xs sm:text-sm px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white transition-all duration-300"
                  >
                    Physiques
                  </TabsTrigger>
                  <TabsTrigger
                    value="service"
                    className="min-h-[44px] text-[10px] xs:text-xs sm:text-sm px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white transition-all duration-300"
                  >
                    Services
                  </TabsTrigger>
                  <TabsTrigger
                    value="course"
                    className="min-h-[44px] text-[10px] xs:text-xs sm:text-sm px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white transition-all duration-300"
                  >
                    Cours
                  </TabsTrigger>
                  <TabsTrigger
                    value="artist"
                    className="min-h-[44px] text-[10px] xs:text-xs sm:text-sm px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white transition-all duration-300"
                  >
                    Oeuvre d'artiste
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
          </Card>
        </div>

        {/* Résumé */}
        <div>
          <p className="text-sm sm:text-base lg:text-lg font-semibold">
            <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              {orders?.length || 0}
            </span>{' '}
            {orders?.length === 1 ? 'commande' : 'commandes'}
          </p>
        </div>

        {/* Liste des Commandes */}
        {!orders || orders.length === 0 ? (
          <Card>
            <CardContent className="pt-8 sm:pt-12 pb-8 sm:pb-12 px-4 sm:px-6">
              <div className="text-center space-y-4">
                <div className="h-16 w-16 sm:h-20 sm:w-20 mx-auto rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-500/30 flex items-center justify-center">
                  <Package className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg sm:text-xl font-semibold">Aucune commande</h3>
                  <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
                    Vous n'avez pas encore passé de commande
                  </p>
                </div>
                <Button
                  onClick={() => navigate('/marketplace')}
                  className="mt-4 min-h-[44px] bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 border-0 transition-all duration-300 hover:scale-105 text-xs sm:text-sm px-6 sm:px-8"
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
                className="hover:shadow-lg transition-all duration-300"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-6 pt-4 sm:pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
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
                    {order.items.map(item => (
                      <div
                        key={item.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 p-2.5 sm:p-3 border border-border/50 rounded-lg bg-muted/40 dark:bg-muted/30"
                      >
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                          <div className="flex-shrink-0 text-primary">
                            {getProductTypeIcon(item.product_type)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm sm:text-base truncate">
                              {item.product_name}
                            </p>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              {item.quantity}x {item.unit_price.toLocaleString('fr-FR')}{' '}
                              {order.currency}
                            </p>
                          </div>
                        </div>
                        <p className="font-semibold text-sm sm:text-base flex-shrink-0 sm:text-right">
                          {item.total_price.toLocaleString('fr-FR')} {order.currency}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedOrder(order);
                        setIsDetailDialogOpen(true);
                      }}
                      className="flex-1 sm:flex-none min-h-[44px] text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 border-0 transition-all duration-300 hover:scale-105"
                    >
                      <Eye className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
                      <span className="truncate">Voir les détails</span>
                    </Button>
                    {order.payment_status === 'completed' && (
                      <Button
                        variant="outline"
                        onClick={() => handleDownloadInvoice(order)}
                        disabled={generatingInvoice === order.id}
                        className="flex-1 sm:flex-none min-h-[44px] text-xs sm:text-sm bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 border-0 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
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

        {/* Dialog Détails Commande */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Détails de la commande {selectedOrder?.order_number}
              </DialogTitle>
              <DialogDescription>
                {selectedOrder && (
                  <span>
                    {new Date(selectedOrder.created_at).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>

            {selectedOrder && (
              <div className="space-y-4">
                {/* Statut et Paiement */}
                <div className="flex items-center justify-between">
                  <div>{getStatusBadge(selectedOrder.status, selectedOrder.payment_status)}</div>
                  <div className="text-right">
                    <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      {selectedOrder.total_amount.toLocaleString('fr-FR')} {selectedOrder.currency}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Articles */}
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Articles ({selectedOrder.items.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedOrder.items.map(item => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex-shrink-0 text-primary">
                            {getProductTypeIcon(item.product_type)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{item.product_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.quantity}x {item.unit_price.toLocaleString('fr-FR')}{' '}
                              {selectedOrder.currency}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-semibold">
                            {item.total_price.toLocaleString('fr-FR')} {selectedOrder.currency}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Total */}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    {selectedOrder.total_amount.toLocaleString('fr-FR')} {selectedOrder.currency}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4">
                  {selectedOrder.payment_status === 'completed' && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleDownloadInvoice(selectedOrder);
                        setIsDetailDialogOpen(false);
                      }}
                      disabled={generatingInvoice === selectedOrder.id}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 border-0"
                    >
                      {generatingInvoice === selectedOrder.id ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      Télécharger facture
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => setIsDetailDialogOpen(false)}
                    className="flex-1"
                  >
                    Fermer
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}






