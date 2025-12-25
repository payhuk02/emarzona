/**
 * 💳 Gestion des Paiements - Professional & Optimized
 * Page optimisée avec design professionnel, responsive et fonctionnalités avancées
 * Gestion complète des paiements avancés (pourcentage, escrow) avec recherche, filtres, tri, export
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
// Type pour les commandes avec relations depuis Supabase
// Basé sur la structure réelle retournée par Supabase
type OrderWithRelations = {
  id: string;
  store_id: string | null;
  customer_id: string | null;
  order_number: string;
  total_amount: number;
  currency: string;
  status: string;
  payment_status: string;
  created_at: string;
  // Tous les autres champs sont optionnels car Supabase peut ne pas les retourner
  payment_method?: string | null;
  notes?: string | null;
  updated_at?: string;
  payment_type?: 'full' | 'percentage' | 'delivery_secured' | null;
  percentage_paid?: number | null;
  remaining_amount?: number | null;
  delivery_status?: string | null;
  order_items?: Array<{
    id: string;
    product_name?: string;
    quantity?: number;
    unit_price?: number;
    total_price?: number;
  }>;
  customers?: {
    name?: string;
    email?: string;
  } | null;
  // Index signature pour accepter tous les autres champs de Supabase
  [key: string]: unknown;
};
import { MainLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  CreditCard,
  Search,
  Percent,
  Shield,
  DollarSign,
  ArrowRight,
  Clock,
  CheckCircle,
  Download,
  Loader2,
  X,
  RefreshCw,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/hooks/useStore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/hooks/use-toast';

export default function PaymentManagementList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { store } = useStore();
  const { toast } = useToast();

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [activeTab, setActiveTab] = useState('all');
  const [isExporting, setIsExporting] = useState(false);

  // Animations au scroll
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const filtersRef = useScrollAnimation<HTMLDivElement>();
  const tableRef = useScrollAnimation<HTMLDivElement>();

  // Fetch orders with advanced payment options
  const {
    data: orders,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['payment-management-orders', user?.id, store?.id],
    queryFn: async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) throw new Error('Not authenticated');

      // Get user profile and store
      let storeId = store?.id;

      if (!storeId && authUser?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', authUser.id)
          .single();

        if (profile) {
          const { data: storeData } = await supabase
            .from('stores')
            .select('id')
            .eq('owner_id', profile.id)
            .maybeSingle();

          storeId = storeData?.id;
        }
      }

      let query = supabase
        .from('orders')
        .select(
          `
          *,
          customers (
            id,
            name,
            email
          ),
          order_items (
            id,
            product_name,
            quantity,
            unit_price,
            total_price
          )
        `
        )
        .order('created_at', { ascending: false });

      // Filter by store if available
      if (storeId) {
        query = query.eq('store_id', storeId);
      } else if (authUser?.id) {
        // Fallback: filter by buyer_id
        query = query.eq('buyer_id', authUser.id);
      }

      const { data, error: queryError } = await query;

      if (queryError) {
        logger.error('Error fetching payment management orders', { error: queryError.message });
        throw queryError;
      }

      // Filtrer les commandes avec paiements avancés
      const filtered =
        data?.filter(order => {
          const orderTyped = order as OrderWithRelations;
          const hasPercentagePayment =
            (orderTyped.percentage_paid || 0) > 0 && (orderTyped.percentage_paid || 0) < 100;
          const hasRemainingAmount = (orderTyped.remaining_amount || 0) > 0;
          // Also include orders with payment_status pending that might have advanced payment
          const hasAdvancedPaymentStatus =
            orderTyped.payment_status === 'pending' || orderTyped.payment_status === 'partial';
          return hasPercentagePayment || hasRemainingAmount || hasAdvancedPaymentStatus;
        }) || [];

      return filtered;
    },
    enabled: !!user?.id || !!store?.id,
  });

  // Filtrer les commandes
  const filteredOrders = useMemo(() => {
    if (!orders) return [];

    return orders.filter(order => {
      const orderTyped = order as OrderWithRelations;
      // Search filter
      const searchLower = debouncedSearch.toLowerCase();
      const matchesSearch =
        orderTyped.order_number?.toLowerCase().includes(searchLower) ||
        orderTyped.order_items?.[0]?.product_name?.toLowerCase().includes(searchLower) ||
        orderTyped.customers?.name?.toLowerCase().includes(searchLower) ||
        orderTyped.customers?.email?.toLowerCase().includes(searchLower);

      // Tab filter - simplified logic
      const hasPercentagePayment =
        (orderTyped.percentage_paid || 0) > 0 && (orderTyped.percentage_paid || 0) < 100;
      const hasRemainingAmount = (orderTyped.remaining_amount || 0) > 0;

      const matchesTab =
        activeTab === 'all' ||
        (activeTab === 'percentage' && hasPercentagePayment) ||
        (activeTab === 'escrow' &&
          (orderTyped.payment_status === 'pending' || orderTyped.payment_status === 'partial')) ||
        (activeTab === 'pending' &&
          (orderTyped.payment_status === 'pending' || hasRemainingAmount));

      return matchesSearch && matchesTab;
    });
  }, [orders, debouncedSearch, activeTab]);

  // Stats calculation
  const stats = useMemo(() => {
    if (!orders) return { total: 0, percentage: 0, escrow: 0, pending: 0 };

    const total = orders.length;
    const percentage = orders.filter(o => {
      const oTyped = o as OrderWithRelations;
      const hasPercentage =
        (oTyped.percentage_paid || 0) > 0 && (oTyped.percentage_paid || 0) < 100;
      return hasPercentage;
    }).length;
    const escrow = orders.filter(o => {
      const oTyped = o as OrderWithRelations;
      // Check if order has escrow/delivery_secured payment type
      return oTyped.payment_status === 'pending' || oTyped.payment_status === 'partial';
    }).length;
    const pending = orders.filter(o => {
      const oTyped = o as OrderWithRelations;
      return oTyped.payment_status === 'pending' || (oTyped.remaining_amount || 0) > 0;
    }).length;

    return { total, percentage, escrow, pending };
  }, [orders]);

  const getPaymentTypeBadge = (order: OrderWithRelations) => {
    const hasPercentage =
      ((order.percentage_paid as number | null | undefined) || 0) > 0 &&
      ((order.percentage_paid as number | null | undefined) || 0) < 100;
    const isEscrow = order.payment_status === 'pending' || order.payment_status === 'partial';

    if (isEscrow) {
      return (
        <Badge variant="default" className="bg-purple-600 hover:bg-purple-700">
          <Shield className="h-3 w-3 mr-1" />
          Escrow
        </Badge>
      );
    }
    if (hasPercentage) {
      return (
        <Badge variant="secondary">
          <Percent className="h-3 w-3 mr-1" />
          Pourcentage
        </Badge>
      );
    }
    return (
      <Badge variant="outline">
        <DollarSign className="h-3 w-3 mr-1" />
        Standard
      </Badge>
    );
  };

  const getStatusBadge = (order: OrderWithRelations) => {
    const hasRemaining = ((order.remaining_amount as number | null | undefined) || 0) > 0;
    const paymentStatus = order.payment_status;

    if (paymentStatus === 'completed' || !hasRemaining) {
      return (
        <Badge variant="default" className="bg-green-600 hover:bg-green-700">
          <CheckCircle className="h-3 w-3 mr-1" />
          Complété
        </Badge>
      );
    }
    if (paymentStatus === 'pending' || hasRemaining) {
      return (
        <Badge variant="secondary" className="bg-yellow-600 hover:bg-yellow-700">
          <Clock className="h-3 w-3 mr-1" />
          En attente
        </Badge>
      );
    }
    return <Badge variant="outline">{paymentStatus || 'N/A'}</Badge>;
  };

  // Export to CSV
  const handleExportCSV = useCallback(async () => {
    if (!filteredOrders || filteredOrders.length === 0) {
      toast({
        title: '⚠️ Aucune donnée',
        description: 'Aucune commande à exporter.',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);
    try {
      const headers = [
        'N° Commande',
        'Date',
        'Client',
        'Produit',
        'Type Paiement',
        'Montant',
        'Statut Escrow',
        'Date Création',
      ];
      const rows = filteredOrders.map(order => {
        const orderTyped = order as OrderWithRelations;
        return [
          orderTyped.order_number || '',
          format(new Date(orderTyped.created_at), 'dd/MM/yyyy', { locale: fr }),
          orderTyped.customers?.name || '',
          orderTyped.order_items?.[0]?.product_name || 'N/A',
          ((orderTyped.percentage_paid as number | null | undefined) || 0) > 0
            ? 'Pourcentage'
            : 'Escrow',
          orderTyped.total_amount || 0,
          orderTyped.payment_status || 'N/A',
          format(new Date(orderTyped.created_at), 'dd/MM/yyyy HH:mm', { locale: fr }),
        ];
      });

      const csvContent = [
        headers.join(','),
        ...rows.map((row: (string | number)[]) =>
          row.map((cell: string | number) => `"${String(cell)}"`).join(',')
        ),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `gestion-paiements-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: '✅ Export réussi',
        description: `${filteredOrders.length} commande(s) exportée(s) en CSV.`,
      });
      logger.info('Payment management orders exported to CSV', { count: filteredOrders.length });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error exporting orders to CSV', { error: errorMessage });
      toast({
        title: '❌ Erreur',
        description: "Impossible d'exporter les commandes.",
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  }, [filteredOrders, toast]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    try {
      await refetch();
      toast({
        title: '✅ Actualisation réussie',
        description: 'La liste des paiements a été mise à jour.',
      });
      logger.info('Payment management orders refreshed');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error refreshing orders', { error: errorMessage });
      toast({
        title: '❌ Erreur',
        description: "Impossible d'actualiser les paiements.",
        variant: 'destructive',
      });
    }
  }, [refetch, toast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('search-payments-management')?.focus();
      }
      if (e.key === 'Escape' && searchInput) {
        setSearchInput('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchInput]);

  if (isLoading) {
    return (
      <MainLayout layoutType="finance">
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-center h-[40vh]">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-500" />
              <p className="text-muted-foreground">Chargement des paiements...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout layoutType="finance">
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="max-w-md">
              <CardHeader className="text-center">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <CardTitle>Erreur de chargement</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <Button onClick={() => refetch()}>Réessayer</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout layoutType="finance">
      <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div
          ref={headerRef}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500">
              <CreditCard
                className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400"
                aria-hidden="true"
              />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Gestion des Paiements
                </span>
              </h1>
              <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground">
                Gérez les paiements en pourcentage et escrow de vos commandes
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="min-h-[44px] h-9 sm:h-10 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-xs sm:text-sm text-white"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              )}
              <span className="hidden sm:inline">Actualiser</span>
              <span className="sm:hidden">Raf.</span>
            </Button>
          </div>
        </div>
        {/* Stats Cards */}
        <div
          ref={statsRef}
          className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
        >
          {/* Carte Total */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2 p-2.5 sm:p-3 md:p-4">
              <CardTitle className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium">
                Total Commandes
              </CardTitle>
              <FileText className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-2.5 sm:p-3 md:p-4 pt-0">
              <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold">
                {stats.total}
              </div>
            </CardContent>
          </Card>

          {/* Carte Pourcentage */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2 p-2.5 sm:p-3 md:p-4">
              <CardTitle className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium">
                Paiements Pourcentage
              </CardTitle>
              <Percent className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4 text-blue-500" />
            </CardHeader>
            <CardContent className="p-2.5 sm:p-3 md:p-4 pt-0">
              <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-blue-600">
                {stats.percentage}
              </div>
            </CardContent>
          </Card>

          {/* Carte Escrow */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2 p-2.5 sm:p-3 md:p-4">
              <CardTitle className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium">
                Paiements Escrow
              </CardTitle>
              <Shield className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4 text-green-500" />
            </CardHeader>
            <CardContent className="p-2.5 sm:p-3 md:p-4 pt-0">
              <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-green-600">
                {stats.escrow}
              </div>
            </CardContent>
          </Card>

          {/* Carte En attente */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2 p-2.5 sm:p-3 md:p-4">
              <CardTitle className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium">
                En attente
              </CardTitle>
              <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4 text-orange-500" />
            </CardHeader>
            <CardContent className="p-2.5 sm:p-3 md:p-4 pt-0">
              <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-orange-600">
                {stats.pending}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filters */}
        <Card
          ref={filtersRef}
          className="shadow-lg border-2 border-purple-200/50 dark:border-purple-800/50 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200"
        >
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search-payments-management"
                  placeholder="Rechercher par numéro, produit, client..."
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  className="pl-9 pr-9 h-10 sm:h-11 bg-background border-purple-200/50 dark:border-purple-800/50 focus:border-purple-500 focus:ring-purple-500/20"
                />
                {searchInput && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchInput('')}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                {/* Keyboard shortcut indicator */}
                <div className="absolute right-2.5 sm:right-10 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:flex items-center">
                  <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
                    ⌘K
                  </Badge>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                  disabled={isExporting || !filteredOrders || filteredOrders.length === 0}
                  className="h-10 sm:h-11 transition-all hover:scale-105"
                >
                  {isExporting ? (
                    <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  )}
                  <span className="hidden sm:inline text-xs sm:text-sm">Export CSV</span>
                  <span className="sm:hidden">CSV</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs - Fully Responsive */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted/50 backdrop-blur-sm h-auto p-1 w-full grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 sm:inline-flex sm:w-auto">
            <TabsTrigger
              value="all"
              className="w-full sm:w-auto gap-1 sm:gap-1.5 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis"
            >
              Tous <span className="opacity-80">({stats.total})</span>
            </TabsTrigger>
            <TabsTrigger
              value="percentage"
              className="w-full sm:w-auto gap-1 sm:gap-1.5 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis"
            >
              <span className="hidden sm:inline">Pourcentage</span>
              <span className="sm:hidden">%</span>
              <span className="opacity-80">({stats.percentage})</span>
            </TabsTrigger>
            <TabsTrigger
              value="escrow"
              className="w-full sm:w-auto gap-1 sm:gap-1.5 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis"
            >
              <span className="hidden sm:inline">Escrow</span>
              <span className="sm:hidden">Esc.</span>
              <span className="opacity-80">({stats.escrow})</span>
            </TabsTrigger>
            <TabsTrigger
              value="pending"
              className="w-full sm:w-auto gap-1 sm:gap-1.5 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis"
            >
              <span className="hidden sm:inline">En attente</span>
              <span className="sm:hidden">Attente</span>
              <span className="opacity-80">({stats.pending})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <div
              ref={tableRef}
              className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300"
            >
              {filteredOrders.length === 0 ? (
                <Card className="shadow-lg border-2 border-purple-200/50 dark:border-purple-800/50">
                  <CardContent className="py-12 text-center">
                    <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Aucune commande</h3>
                    <p className="text-muted-foreground mb-4">
                      Aucune commande avec paiement avancé trouvée.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchInput('');
                        setActiveTab('all');
                      }}
                    >
                      Effacer les filtres
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="shadow-lg border-2 border-purple-200/50 dark:border-purple-800/50 overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="font-semibold">N° Commande</TableHead>
                          <TableHead className="font-semibold hidden sm:table-cell">Date</TableHead>
                          <TableHead className="font-semibold hidden md:table-cell">
                            Client
                          </TableHead>
                          <TableHead className="font-semibold">Produit</TableHead>
                          <TableHead className="font-semibold">Type Paiement</TableHead>
                          <TableHead className="font-semibold hidden lg:table-cell">
                            Montant
                          </TableHead>
                          <TableHead className="font-semibold">Statut</TableHead>
                          <TableHead className="font-semibold text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOrders.map((order, index: number) => {
                          const orderTyped = order as OrderWithRelations;
                          return (
                            <TableRow
                              key={orderTyped.id}
                              className="animate-in fade-in slide-in-from-left-4"
                              style={{ animationDelay: `${index * 50}ms` }}
                            >
                              <TableCell className="font-medium">
                                {orderTyped.order_number}
                              </TableCell>
                              <TableCell className="hidden sm:table-cell">
                                {format(new Date(orderTyped.created_at), 'dd/MM/yyyy', {
                                  locale: fr,
                                })}
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                {orderTyped.customers?.name || 'N/A'}
                              </TableCell>
                              <TableCell>
                                {orderTyped.order_items?.[0]?.product_name || 'N/A'}
                              </TableCell>
                              <TableCell>{getPaymentTypeBadge(orderTyped)}</TableCell>
                              <TableCell className="hidden lg:table-cell">
                                {orderTyped.total_amount?.toLocaleString('fr-FR')} XOF
                              </TableCell>
                              <TableCell>{getStatusBadge(orderTyped)}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  onClick={() => navigate(`/payments/${orderTyped.id}/manage`)}
                                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-white"
                                >
                                  <span className="hidden sm:inline">Gérer</span>
                                  <span className="sm:hidden">⚙</span>
                                  <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-1" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
