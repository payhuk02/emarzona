/**
 * 💰 Soldes à Payer - Professional & Optimized
 * Page optimisée avec design professionnel, responsive et fonctionnalités avancées
 * Gestion complète des soldes à payer avec recherche, filtres, tri, export et actions
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DollarSign,
  Search,
  AlertCircle,
  ArrowRight,
  CreditCard,
  Clock,
  Download,
  Loader2,
  X,
  RefreshCw,
  FileText,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/hooks/useStore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function PayBalanceList() {
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

  // Fetch orders with balance to pay
  const { data: orders, isLoading, error, refetch } = useQuery({
    queryKey: ['pay-balance-orders', user?.id, store?.id],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select(`
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
        `)
        .order('created_at', { ascending: false });

      // Filter by store if store exists
      if (store?.id) {
        query = query.eq('store_id', store.id);
      } else if (user?.id) {
        query = query.eq('buyer_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filtrer les commandes avec solde restant
      return data?.filter((order: any) => {
        const percentagePaid = order.percentage_paid || 0;
        const remainingAmount = order.remaining_amount || 0;
        return remainingAmount > 0 || percentagePaid < 100;
      }) || [];
    },
    enabled: !!user?.id || !!store?.id,
  });

  // Calculer le solde restant
  const calculateBalance = useCallback((order: any) => {
    const remainingAmount = order.remaining_amount || 0;
    const totalAmount = order.total_amount || 0;
    const percentagePaid = order.percentage_paid || 0;
    
    if (remainingAmount > 0) {
      return remainingAmount;
    }
    
    // Si pas de remaining_amount, calculer basé sur percentage_paid
    if (percentagePaid < 100 && totalAmount > 0) {
      return totalAmount - (totalAmount * percentagePaid / 100);
    }
    
    return 0;
  }, []);

  // Filtrer les commandes
  const filteredOrders = useMemo(() => {
    if (!orders) return [];

    return orders.filter((order: any) => {
      // Search filter
      const searchLower = debouncedSearch.toLowerCase();
      const matchesSearch =
        order.order_number?.toLowerCase().includes(searchLower) ||
        order.order_items?.[0]?.product_name?.toLowerCase().includes(searchLower) ||
        order.customers?.name?.toLowerCase().includes(searchLower) ||
        order.customers?.email?.toLowerCase().includes(searchLower);

      // Tab filter
      const balance = calculateBalance(order);
      const matchesTab =
        activeTab === 'all' ||
        (activeTab === 'urgent' && balance > 0 && balance > order.total_amount * 0.5) ||
        (activeTab === 'recent' && new Date(order.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

      return matchesSearch && matchesTab && balance > 0;
    });
  }, [orders, debouncedSearch, activeTab, calculateBalance]);

  // Stats calculation
  const stats = useMemo(() => {
    if (!orders) return { total: 0, totalBalance: 0, averageBalance: 0, urgentCount: 0 };

    const ordersWithBalance = orders.filter((order: any) => calculateBalance(order) > 0);
    const total = ordersWithBalance.length;
    const totalBalance = ordersWithBalance.reduce((sum: number, order: any) => sum + calculateBalance(order), 0);
    const averageBalance = total > 0 ? totalBalance / total : 0;
    const urgentCount = ordersWithBalance.filter((order: any) => {
      const balance = calculateBalance(order);
      return balance > order.total_amount * 0.5;
    }).length;

    return { total, totalBalance, averageBalance, urgentCount };
  }, [orders, calculateBalance]);

  // Export to CSV
  const handleExportCSV = useCallback(async () => {
    if (!filteredOrders || filteredOrders.length === 0) {
      toast({
        title: '⚠️ Aucune donnée',
        description: 'Aucun solde à exporter.',
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
        'Email',
        'Montant Total',
        'Solde Restant',
        'Pourcentage Payé',
        'Statut',
      ];
      const rows = filteredOrders.map((order: any) => {
        const balance = calculateBalance(order);
        const percentagePaid = order.percentage_paid || 0;
        return [
          order.order_number || '',
          format(new Date(order.created_at), 'dd/MM/yyyy', { locale: fr }),
          order.customers?.name || '',
          order.customers?.email || '',
          order.total_amount || 0,
          balance,
          `${Math.round(percentagePaid)}%`,
          order.payment_status || 'pending',
        ];
      });

      const csvContent = [
        headers.join(','),
        ...rows.map((row: any[]) => row.map((cell: any) => `"${String(cell)}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `soldes-a-payer-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: '✅ Export réussi',
        description: `${filteredOrders.length} solde(s) exporté(s) en CSV.`,
      });
      logger.info('Balances exported to CSV', { count: filteredOrders.length });
    } catch (error: any) {
      logger.error('Error exporting balances to CSV', { error: error.message });
      toast({
        title: '❌ Erreur',
        description: 'Impossible d\'exporter les soldes.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  }, [filteredOrders, calculateBalance, toast]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    try {
      await refetch();
      toast({
        title: '✅ Actualisation réussie',
        description: 'La liste des soldes a été mise à jour.',
      });
      logger.info('Balances refreshed');
    } catch (error: any) {
      logger.error('Error refreshing balances', { error: error.message });
      toast({
        title: '❌ Erreur',
        description: 'Impossible d\'actualiser les soldes.',
        variant: 'destructive',
      });
    }
  }, [refetch, toast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('search-balances')?.focus();
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
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-500" />
              <p className="text-muted-foreground">Chargement des soldes...</p>
            </div>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  if (error) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <div className="flex-1 flex items-center justify-center p-4">
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
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />

        <div className="flex-1 flex flex-col">
            {/* Header */}
          <div ref={headerRef} className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 lg:p-6">
              <div>
                <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500">
                    <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400" aria-hidden="true" />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Soldes à Payer
                  </span>
                </h1>
                <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground">
                  Payez les soldes restants de vos commandes
                </p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="flex-1 sm:flex-none min-h-[44px] transition-all hover:scale-105 text-xs sm:text-sm"
                >
                  {isLoading ? (
                    <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  )}
                  <span className="hidden sm:inline">Actualiser</span>
                  <span className="sm:hidden">Rafr.</span>
                </Button>
              </div>
              </div>
            </div>

          <main className="flex-1 p-4 sm:p-6 bg-gradient-to-br from-background via-background to-purple-50/30 dark:to-purple-950/20">
            <div className="max-w-7xl mx-auto space-y-6">
            {/* Stats Cards */}
              <div ref={statsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-left-4 duration-500 delay-100">
                {/* Carte Total */}
                <Card className="group relative overflow-hidden border-2 border-purple-500/30 hover:border-purple-400/60 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20 hover:scale-[1.02] bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 dark:from-purple-900 dark:via-purple-800 dark:to-purple-900 backdrop-blur-sm">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <CardHeader className="pb-1.5 sm:pb-2 md:pb-3 p-2.5 sm:p-3 md:p-4 relative z-10">
                    <CardTitle className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-semibold text-purple-100 flex items-center gap-1 sm:gap-1.5 md:gap-2">
                      <FileText className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4 text-purple-200" />
                      Total
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10 p-2.5 sm:p-3 md:p-4 pt-0">
                    <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-white drop-shadow-lg">{stats.total}</div>
                    <p className="text-[9px] sm:text-[10px] md:text-xs text-purple-200/90 mt-0.5 sm:mt-1 font-medium">commandes</p>
                  </CardContent>
                  <div className="absolute top-2 right-2 h-2 w-2 bg-purple-300 rounded-full opacity-60 group-hover:opacity-100 transition-opacity"></div>
                </Card>

                {/* Carte Solde Total */}
                <Card className="group relative overflow-hidden border-2 border-purple-500/30 hover:border-orange-400/60 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/20 hover:scale-[1.02] bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 dark:from-purple-900 dark:via-purple-800 dark:to-purple-900 backdrop-blur-sm">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <CardHeader className="pb-1.5 sm:pb-2 md:pb-3 p-2.5 sm:p-3 md:p-4 relative z-10">
                    <CardTitle className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-semibold text-purple-100 flex items-center gap-1 sm:gap-1.5 md:gap-2">
                      <DollarSign className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4 text-orange-400 drop-shadow-lg" />
                      Solde Total
                    </CardTitle>
                </CardHeader>
                  <CardContent className="relative z-10 p-2.5 sm:p-3 md:p-4 pt-0">
                    <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-orange-400 drop-shadow-lg break-words">
                      {stats.totalBalance.toLocaleString('fr-FR')}
                    </div>
                    <p className="text-[9px] sm:text-[10px] md:text-xs text-purple-200/90 mt-0.5 sm:mt-1 font-medium">XOF</p>
                </CardContent>
                  <div className="absolute top-2 right-2 h-2 w-2 bg-orange-400 rounded-full opacity-60 group-hover:opacity-100 transition-opacity shadow-lg shadow-orange-400/50"></div>
              </Card>

                {/* Carte Moyenne */}
                <Card className="group relative overflow-hidden border-2 border-purple-500/30 hover:border-blue-400/60 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 hover:scale-[1.02] bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 dark:from-purple-900 dark:via-purple-800 dark:to-purple-900 backdrop-blur-sm">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <CardHeader className="pb-1.5 sm:pb-2 md:pb-3 p-2.5 sm:p-3 md:p-4 relative z-10">
                    <CardTitle className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-semibold text-purple-100 flex items-center gap-1 sm:gap-1.5 md:gap-2">
                      <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4 text-blue-400 drop-shadow-lg" />
                      Moyenne
                    </CardTitle>
                </CardHeader>
                  <CardContent className="relative z-10 p-2.5 sm:p-3 md:p-4 pt-0">
                    <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-blue-400 drop-shadow-lg break-words">
                      {stats.averageBalance.toLocaleString('fr-FR')}
                    </div>
                    <p className="text-[9px] sm:text-[10px] md:text-xs text-purple-200/90 mt-0.5 sm:mt-1 font-medium">XOF/commande</p>
                </CardContent>
                  <div className="absolute top-2 right-2 h-2 w-2 bg-blue-400 rounded-full opacity-60 group-hover:opacity-100 transition-opacity shadow-lg shadow-blue-400/50"></div>
              </Card>

                {/* Carte Urgent */}
                <Card className="group relative overflow-hidden border-2 border-purple-500/30 hover:border-red-400/60 transition-all duration-300 hover:shadow-2xl hover:shadow-red-500/20 hover:scale-[1.02] bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 dark:from-purple-900 dark:via-purple-800 dark:to-purple-900 backdrop-blur-sm">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <CardHeader className="pb-1.5 sm:pb-2 md:pb-3 p-2.5 sm:p-3 md:p-4 relative z-10">
                    <CardTitle className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-semibold text-purple-100 flex items-center gap-1 sm:gap-1.5 md:gap-2">
                      <AlertCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4 text-red-400 drop-shadow-lg" />
                      Urgent
                    </CardTitle>
                </CardHeader>
                  <CardContent className="relative z-10 p-2.5 sm:p-3 md:p-4 pt-0">
                    <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-red-400 drop-shadow-lg">{stats.urgentCount}</div>
                    <p className="text-[9px] sm:text-[10px] md:text-xs text-purple-200/90 mt-0.5 sm:mt-1 font-medium">commandes</p>
                  </CardContent>
                  <div className="absolute top-2 right-2 h-2 w-2 bg-red-400 rounded-full opacity-60 group-hover:opacity-100 transition-opacity shadow-lg shadow-red-400/50"></div>
                </Card>
              </div>

              {/* Search & Filters */}
              <Card ref={filtersRef} className="shadow-lg border-2 border-purple-200/50 dark:border-purple-800/50 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
                <CardContent className="p-3 sm:p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    {/* Search */}
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                      <Input
                        id="search-balances"
                        placeholder="Rechercher par numéro, produit, client..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="pl-8 sm:pl-9 pr-8 sm:pr-9 min-h-[44px] h-10 sm:h-11 text-xs sm:text-sm bg-background border-purple-200/50 dark:border-purple-800/50 focus:border-purple-500 focus:ring-purple-500/20"
                      />
                      {searchInput && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSearchInput('')}
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 sm:h-8 w-7 sm:w-8 p-0 min-h-[44px]"
                        >
                          <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                      )}
                      {/* Keyboard shortcut indicator */}
                      <div className="absolute right-2.5 sm:right-10 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:flex items-center">
                        <Badge variant="outline" className="text-[9px] sm:text-[10px] font-mono px-1 sm:px-1.5 py-0">
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
                        className="min-h-[44px] h-10 sm:h-11 text-xs sm:text-sm transition-all hover:scale-105"
                      >
                        {isExporting ? (
                          <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
                        ) : (
                          <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                        )}
                        <span className="hidden sm:inline">Export CSV</span>
                        <span className="sm:hidden">CSV</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabs - Fully Responsive */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-muted/50 backdrop-blur-sm h-auto p-1 w-full grid grid-cols-3 gap-1.5 sm:gap-2 sm:inline-flex sm:w-auto">
                  <TabsTrigger 
                    value="all" 
                    className="flex-1 sm:flex-none gap-1 sm:gap-1.5 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm min-h-[44px] font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis"
                  >
                    Tous <span className="opacity-80">({stats.total})</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="urgent" 
                    className="flex-1 sm:flex-none gap-1 sm:gap-1.5 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm min-h-[44px] font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis"
                  >
                    <span className="hidden sm:inline">Urgent</span>
                    <span className="sm:hidden">Urg.</span>
                    <span className="opacity-80">({stats.urgentCount})</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="recent" 
                    className="flex-1 sm:flex-none gap-1 sm:gap-1.5 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm min-h-[44px] font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis"
                  >
                    <span className="hidden sm:inline">Récent</span>
                    <span className="sm:hidden">Récent</span>
                    <span className="opacity-80">({filteredOrders.filter((o: any) => new Date(o.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length})</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-6">
                  <div ref={tableRef} className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
                    {filteredOrders.length === 0 ? (
                      <Card className="shadow-lg border-2 border-purple-200/50 dark:border-purple-800/50">
                        <CardContent className="py-8 sm:py-12 text-center">
                          <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                          <h3 className="text-sm sm:text-base md:text-lg font-semibold mb-1.5 sm:mb-2">Aucun solde à payer</h3>
                          <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                            Toutes vos commandes sont payées ou n'ont pas de solde restant.
                          </p>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSearchInput('');
                              setActiveTab('all');
                            }}
                            className="min-h-[44px] text-xs sm:text-sm"
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
                                <TableHead className="font-semibold text-[10px] sm:text-xs md:text-sm">N° Commande</TableHead>
                                <TableHead className="font-semibold hidden sm:table-cell text-[10px] sm:text-xs md:text-sm">Date</TableHead>
                                <TableHead className="font-semibold hidden md:table-cell text-[10px] sm:text-xs md:text-sm">Client</TableHead>
                                <TableHead className="font-semibold text-[10px] sm:text-xs md:text-sm">Montant Total</TableHead>
                                <TableHead className="font-semibold text-[10px] sm:text-xs md:text-sm">Solde Restant</TableHead>
                                <TableHead className="font-semibold text-right text-[10px] sm:text-xs md:text-sm">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                              {filteredOrders.map((order: any, index: number) => {
                        const balance = calculateBalance(order);
                                const percentagePaid = order.percentage_paid || 0;
                        return (
                                  <TableRow
                                    key={order.id}
                                    className="animate-in fade-in slide-in-from-left-4"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                  >
                            <TableCell className="font-medium text-xs sm:text-sm">
                              {order.order_number}
                            </TableCell>
                                    <TableCell className="hidden sm:table-cell text-xs sm:text-sm">
                                      {format(new Date(order.created_at), 'dd/MM/yyyy', { locale: fr })}
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell text-xs sm:text-sm">
                                      {order.customers?.name || 'N/A'}
                                    </TableCell>
                            <TableCell className="text-xs sm:text-sm">
                                      {order.total_amount.toLocaleString('fr-FR')} XOF
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm">
                                      <Badge
                                        variant="destructive"
                                        className={cn(
                                          'font-semibold text-[9px] sm:text-[10px] md:text-xs',
                                          balance > order.total_amount * 0.5 && 'bg-red-600'
                                        )}
                                      >
                                        {balance.toLocaleString('fr-FR')} XOF
                                      </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                onClick={() => navigate(`/payments/${order.id}/balance`)}
                                        className="min-h-[44px] bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-white text-xs sm:text-sm"
                              >
                                        <span className="hidden sm:inline">Payer</span>
                                        <span className="sm:hidden">$</span>
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
        </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
