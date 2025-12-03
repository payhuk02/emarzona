/**
 * 💳👥 Paiements & Clients - Vue Unifiée
 * Page unifiée combinant tous les paiements (réussi, échoué, en attente) et toutes les références de clients
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CreditCard,
  Users,
  Search,
  Download,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  TrendingUp,
  User,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  Eye,
  Loader2,
  Filter,
} from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { usePayments, Payment } from '@/hooks/usePayments';
import { useCustomers, Customer } from '@/hooks/useCustomers';
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function PaymentsCustomers() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { store, loading: storeLoading } = useStore();
  
  // Fetch data
  const { payments, loading: paymentsLoading, refetch: refetchPayments } = usePayments(store?.id);
  const { data: customersResult, isLoading: customersLoading, refetch: refetchCustomers } = useCustomers(store?.id, {
    page: 1,
    pageSize: 1000, // Récupérer tous les clients
  });
  const customers = customersResult?.data || [];

  // State management
  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'customers'>('overview');
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [viewPaymentDialogOpen, setViewPaymentDialogOpen] = useState(false);
  const [viewCustomerDialogOpen, setViewCustomerDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Animations
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const contentRef = useScrollAnimation<HTMLDivElement>();

  // Filter payments
  const filteredPayments = useMemo(() => {
    if (!payments) return [];

    return payments.filter((payment) => {
      const searchLower = debouncedSearch.toLowerCase();
      const matchesSearch =
        payment.transaction_id?.toLowerCase().includes(searchLower) ||
        payment.customers?.name?.toLowerCase().includes(searchLower) ||
        payment.customers?.email?.toLowerCase().includes(searchLower) ||
        payment.orders?.order_number?.toLowerCase().includes(searchLower) ||
        payment.payment_method?.toLowerCase().includes(searchLower);

      const matchesStatus =
        paymentStatusFilter === 'all' ||
        payment.status === paymentStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [payments, debouncedSearch, paymentStatusFilter]);

  // Filter customers
  const filteredCustomers = useMemo(() => {
    if (!customers) return [];

    return customers.filter((customer) => {
      const searchLower = debouncedSearch.toLowerCase();
      return (
        customer.name?.toLowerCase().includes(searchLower) ||
        customer.email?.toLowerCase().includes(searchLower) ||
        customer.phone?.toLowerCase().includes(searchLower)
      );
    });
  }, [customers, debouncedSearch]);

  // Stats calculation
  const stats = useMemo(() => {
    if (!payments || !customers) {
      return {
        totalPayments: 0,
        completedPayments: 0,
        pendingPayments: 0,
        failedPayments: 0,
        totalRevenue: 0,
        totalCustomers: 0,
        activeCustomers: 0,
        totalOrders: 0,
      };
    }

    const totalPayments = payments.length;
    const completedPayments = payments.filter((p) => p.status === 'completed').length;
    const pendingPayments = payments.filter((p) => p.status === 'pending' || p.status === 'processing').length;
    const failedPayments = payments.filter((p) => p.status === 'failed').length;
    const totalRevenue = payments
      .filter((p) => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);

    const totalCustomers = customers.length;
    const activeCustomers = customers.filter((c) => (c.total_orders || 0) > 0).length;
    const totalOrders = customers.reduce((sum, c) => sum + (c.total_orders || 0), 0);

    return {
      totalPayments,
      completedPayments,
      pendingPayments,
      failedPayments,
      totalRevenue,
      totalCustomers,
      activeCustomers,
      totalOrders,
    };
  }, [payments, customers]);

  // Get customer payments
  const getCustomerPayments = useCallback((customerId: string) => {
    if (!payments) return [];
    return payments.filter((p) => p.customer_id === customerId);
  }, [payments]);

  // Export to CSV
  const handleExportCSV = useCallback(async (type: 'payments' | 'customers' | 'all') => {
    setIsExporting(true);
    try {
      let csvContent = '';
      let filename = '';

      if (type === 'payments' || type === 'all') {
        const paymentHeaders = [
          'ID',
          'Transaction ID',
          'Méthode',
          'Montant',
          'Devise',
          'Statut',
          'Client',
          'Email Client',
          'Commande',
          'Date création',
        ];
        const paymentRows = filteredPayments.map((payment) => [
          payment.id,
          payment.transaction_id || '',
          payment.payment_method || '',
          payment.amount || 0,
          payment.currency || '',
          payment.status || '',
          payment.customers?.name || '',
          payment.customers?.email || '',
          payment.orders?.order_number || '',
          format(new Date(payment.created_at), 'dd/MM/yyyy HH:mm', { locale: fr }),
        ]);

        csvContent += [
          paymentHeaders.join(','),
          ...paymentRows.map((row) => row.map((cell) => `"${String(cell)}"`).join(',')),
        ].join('\n');

        if (type === 'all') csvContent += '\n\n';
        filename = type === 'all' ? 'paiements-et-clients' : 'paiements';
      }

      if (type === 'customers' || type === 'all') {
        const customerHeaders = [
          'ID',
          'Nom',
          'Email',
          'Téléphone',
          'Ville',
          'Pays',
          'Total Commandes',
          'Total Dépensé',
          'Date création',
        ];
        const customerRows = filteredCustomers.map((customer) => [
          customer.id,
          customer.name || '',
          customer.email || '',
          customer.phone || '',
          customer.city || '',
          customer.country || '',
          customer.total_orders || 0,
          customer.total_spent || 0,
          format(new Date(customer.created_at), 'dd/MM/yyyy HH:mm', { locale: fr }),
        ]);

        if (type === 'all') {
          csvContent += [
            customerHeaders.join(','),
            ...customerRows.map((row) => row.map((cell) => `"${String(cell)}"`).join(',')),
          ].join('\n');
        } else {
          csvContent = [
            customerHeaders.join(','),
            ...customerRows.map((row) => row.map((cell) => `"${String(cell)}"`).join(',')),
          ].join('\n');
        }

        if (filename === '') filename = 'clients';
        if (type === 'all') filename = 'paiements-et-clients';
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: '✅ Export réussi',
        description: `Données exportées en CSV`,
      });
    } catch (error: any) {
      logger.error('Error exporting to CSV', { error });
      toast({
        title: '❌ Erreur',
        description: 'Impossible d\'exporter les données',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  }, [filteredPayments, filteredCustomers, toast]);

  // Get status badge
  const getStatusBadge = useCallback((status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      completed: { label: 'Complété', className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
      processing: { label: 'En traitement', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' },
      pending: { label: 'En attente', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' },
      failed: { label: 'Échoué', className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' },
      refunded: { label: 'Remboursé', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400' },
    };

    const variant = variants[status] || { label: status, className: 'bg-gray-100 text-gray-800' };

    return (
      <Badge className={variant.className}>
        {variant.label}
      </Badge>
    );
  }, []);

  // Handle view payment
  const handleViewPayment = useCallback((payment: Payment) => {
    setSelectedPayment(payment);
    setViewPaymentDialogOpen(true);
  }, []);

  // Handle view customer
  const handleViewCustomer = useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
    setViewCustomerDialogOpen(true);
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    try {
      await Promise.all([refetchPayments(), refetchCustomers()]);
      toast({
        title: '✅ Actualisation réussie',
        description: 'Les données ont été mises à jour',
      });
    } catch (error: any) {
      toast({
        title: '❌ Erreur',
        description: 'Impossible d\'actualiser les données',
        variant: 'destructive',
      });
    }
  }, [refetchPayments, refetchCustomers, toast]);

  useEffect(() => {
    if (!storeLoading && store) {
      logger.info('PaymentsCustomers page loaded', { storeId: store.id });
    }
  }, [storeLoading, store]);

  if (storeLoading || (paymentsLoading && customersLoading)) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-500" />
              <p className="text-muted-foreground">Chargement des données...</p>
            </div>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  if (!store) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <div className="flex-1 flex items-center justify-center p-4">
            <Card className="max-w-md">
              <CardHeader className="text-center">
                <CardTitle>Aucune boutique sélectionnée</CardTitle>
                <CardDescription>
                  Veuillez sélectionner une boutique pour voir les paiements et clients.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button onClick={() => navigate('/dashboard/store')}>
                  Créer une boutique
                </Button>
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
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div ref={headerRef} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-lg sm:text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5">
                    <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Paiements & Clients
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Vue unifiée de tous les paiements et références clients
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={paymentsLoading || customersLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${(paymentsLoading || customersLoading) ? 'animate-spin' : ''}`} />
                  Actualiser
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleExportCSV('all')}
                  disabled={isExporting}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exporter
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div ref={statsRef} className="grid gap-4 md:grid-cols-4 lg:grid-cols-5">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total Paiements</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold">{stats.totalPayments}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Réussis</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold text-green-600">{stats.completedPayments}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">En Attente</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold text-yellow-600">{stats.pendingPayments}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Échoués</CardTitle>
                  <XCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold text-red-600">{stats.failedPayments}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Revenus</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold">
                    {stats.totalRevenue.toLocaleString('fr-FR')} XOF
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Customer Stats */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total Clients</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold">{stats.totalCustomers}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Clients Actifs</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold">{stats.activeCustomers}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total Commandes</CardTitle>
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold">{stats.totalOrders}</div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                <TabsTrigger value="payments">Paiements ({filteredPayments.length})</TabsTrigger>
                <TabsTrigger value="customers">Clients ({filteredCustomers.length})</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Recent Payments */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base sm:text-lg">Paiements Récents</CardTitle>
                      <CardDescription>Les 10 derniers paiements</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {paymentsLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin" />
                          </div>
                        ) : payments && payments.length > 0 ? (
                          payments.slice(0, 10).map((payment) => (
                            <div
                              key={payment.id}
                              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                              onClick={() => handleViewPayment(payment)}
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">
                                    {payment.customers?.name || 'Client inconnu'}
                                  </span>
                                  {getStatusBadge(payment.status)}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {payment.amount.toLocaleString('fr-FR')} {payment.currency} • {format(new Date(payment.created_at), 'dd MMM yyyy', { locale: fr })}
                                </div>
                              </div>
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">Aucun paiement</p>
                        )}
                      </div>
                      {payments && payments.length > 10 && (
                        <Button
                          variant="outline"
                          className="w-full mt-4"
                          onClick={() => setActiveTab('payments')}
                        >
                          Voir tous les paiements
                        </Button>
                      )}
                    </CardContent>
                  </Card>

                  {/* Active Customers */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base sm:text-lg">Clients Actifs</CardTitle>
                      <CardDescription>Clients avec commandes récentes</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {customersLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin" />
                          </div>
                        ) : customers && customers.length > 0 ? (
                          customers
                            .filter((c) => (c.total_orders || 0) > 0)
                            .sort((a, b) => (b.total_orders || 0) - (a.total_orders || 0))
                            .slice(0, 10)
                            .map((customer) => (
                              <div
                                key={customer.id}
                                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                                onClick={() => handleViewCustomer(customer)}
                              >
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{customer.name}</div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {customer.total_orders || 0} commande(s) • {(Number(customer.total_spent) || 0).toLocaleString('fr-FR')} XOF
                                  </div>
                                </div>
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              </div>
                            ))
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">Aucun client actif</p>
                        )}
                      </div>
                      {customers && customers.filter((c) => (c.total_orders || 0) > 0).length > 10 && (
                        <Button
                          variant="outline"
                          className="w-full mt-4"
                          onClick={() => setActiveTab('customers')}
                        >
                          Voir tous les clients
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Payments Tab */}
              <TabsContent value="payments" className="space-y-4">
                {/* Filters */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Rechercher par transaction, client, commande..."
                          value={searchInput}
                          onChange={(e) => setSearchInput(e.target.value)}
                          className="pl-8"
                        />
                      </div>
                      <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                          <Filter className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Statut" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les statuts</SelectItem>
                          <SelectItem value="completed">Complétés</SelectItem>
                          <SelectItem value="pending">En attente</SelectItem>
                          <SelectItem value="processing">En traitement</SelectItem>
                          <SelectItem value="failed">Échoués</SelectItem>
                          <SelectItem value="refunded">Remboursés</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        onClick={() => handleExportCSV('payments')}
                        disabled={isExporting}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Exporter
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Payments Table */}
                <Card ref={contentRef}>
                  <CardHeader>
                    <CardTitle>Paiements</CardTitle>
                    <CardDescription>
                      {filteredPayments.length} paiement(s) trouvé(s)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {paymentsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    ) : filteredPayments.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">Aucun paiement trouvé</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Transaction ID</TableHead>
                              <TableHead>Client</TableHead>
                              <TableHead>Montant</TableHead>
                              <TableHead>Statut</TableHead>
                              <TableHead>Méthode</TableHead>
                              <TableHead>Commande</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredPayments.map((payment) => (
                              <TableRow key={payment.id}>
                                <TableCell className="font-mono text-xs">
                                  {payment.transaction_id?.substring(0, 12) || payment.id.substring(0, 8)}...
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <div className="font-medium text-sm">
                                      {payment.customers?.name || 'N/A'}
                                    </div>
                                    {payment.customers?.email && (
                                      <div className="text-xs text-muted-foreground">
                                        {payment.customers.email}
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="font-semibold">
                                    {payment.amount.toLocaleString('fr-FR')} {payment.currency}
                                  </div>
                                </TableCell>
                                <TableCell>{getStatusBadge(payment.status)}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">{payment.payment_method}</Badge>
                                </TableCell>
                                <TableCell className="text-xs">
                                  {payment.orders?.order_number || 'N/A'}
                                </TableCell>
                                <TableCell className="text-xs">
                                  {format(new Date(payment.created_at), 'dd MMM yyyy', { locale: fr })}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleViewPayment(payment)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Customers Tab */}
              <TabsContent value="customers" className="space-y-4">
                {/* Filters */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Rechercher par nom, email, téléphone..."
                          value={searchInput}
                          onChange={(e) => setSearchInput(e.target.value)}
                          className="pl-8"
                        />
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => handleExportCSV('customers')}
                        disabled={isExporting}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Exporter
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Customers Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Clients</CardTitle>
                    <CardDescription>
                      {filteredCustomers.length} client(s) trouvé(s)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {customersLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    ) : filteredCustomers.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">Aucun client trouvé</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Nom</TableHead>
                              <TableHead>Contact</TableHead>
                              <TableHead>Localisation</TableHead>
                              <TableHead>Commandes</TableHead>
                              <TableHead>Total Dépensé</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredCustomers.map((customer) => {
                              const customerPayments = getCustomerPayments(customer.id);
                              const completedPayments = customerPayments.filter((p) => p.status === 'completed').length;
                              const pendingPayments = customerPayments.filter((p) => p.status === 'pending' || p.status === 'processing').length;
                              const failedPayments = customerPayments.filter((p) => p.status === 'failed').length;

                              return (
                                <TableRow key={customer.id}>
                                  <TableCell>
                                    <div className="font-medium">{customer.name}</div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="space-y-1">
                                      {customer.email && (
                                        <div className="flex items-center gap-1 text-xs">
                                          <Mail className="h-3 w-3" />
                                          {customer.email}
                                        </div>
                                      )}
                                      {customer.phone && (
                                        <div className="flex items-center gap-1 text-xs">
                                          <Phone className="h-3 w-3" />
                                          {customer.phone}
                                        </div>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {(customer.city || customer.country) && (
                                      <div className="flex items-center gap-1 text-xs">
                                        <MapPin className="h-3 w-3" />
                                        {customer.city && customer.country
                                          ? `${customer.city}, ${customer.country}`
                                          : customer.city || customer.country}
                                      </div>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div className="space-y-1">
                                      <div className="font-medium">{customer.total_orders || 0}</div>
                                      {customerPayments.length > 0 && (
                                        <div className="text-xs text-muted-foreground">
                                          {completedPayments} ✓ {pendingPayments} ⏳ {failedPayments} ✗
                                        </div>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="font-semibold">
                                      {(Number(customer.total_spent) || 0).toLocaleString('fr-FR')} XOF
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-xs">
                                    {format(new Date(customer.created_at), 'dd MMM yyyy', { locale: fr })}
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleViewCustomer(customer)}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* View Payment Dialog */}
            <Dialog open={viewPaymentDialogOpen} onOpenChange={setViewPaymentDialogOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Détails du Paiement</DialogTitle>
                  <DialogDescription>
                    Informations complètes sur le paiement
                  </DialogDescription>
                </DialogHeader>
                {selectedPayment && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Transaction ID</label>
                        <p className="font-mono text-sm">{selectedPayment.transaction_id || selectedPayment.id}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Statut</label>
                        <div className="mt-1">{getStatusBadge(selectedPayment.status)}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Montant</label>
                        <p className="text-lg font-semibold">
                          {selectedPayment.amount.toLocaleString('fr-FR')} {selectedPayment.currency}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Méthode</label>
                        <p>{selectedPayment.payment_method}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Client</label>
                        <p>{selectedPayment.customers?.name || 'N/A'}</p>
                        {selectedPayment.customers?.email && (
                          <p className="text-sm text-muted-foreground">{selectedPayment.customers.email}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Commande</label>
                        <p>{selectedPayment.orders?.order_number || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Date de création</label>
                        <p>{format(new Date(selectedPayment.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Dernière mise à jour</label>
                        <p>{format(new Date(selectedPayment.updated_at), 'dd MMM yyyy HH:mm', { locale: fr })}</p>
                      </div>
                    </div>
                    {selectedPayment.notes && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Notes</label>
                        <p className="text-sm">{selectedPayment.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* View Customer Dialog */}
            <Dialog open={viewCustomerDialogOpen} onOpenChange={setViewCustomerDialogOpen}>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Détails du Client</DialogTitle>
                  <DialogDescription>
                    Informations complètes et historique des paiements
                  </DialogDescription>
                </DialogHeader>
                {selectedCustomer && (
                  <div className="space-y-6">
                    {/* Customer Info */}
                    <div>
                      <h3 className="font-semibold mb-3">Informations</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Nom</label>
                          <p className="font-medium">{selectedCustomer.name}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Email</label>
                          <p>{selectedCustomer.email || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Téléphone</label>
                          <p>{selectedCustomer.phone || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Localisation</label>
                          <p>
                            {selectedCustomer.city && selectedCustomer.country
                              ? `${selectedCustomer.city}, ${selectedCustomer.country}`
                              : selectedCustomer.city || selectedCustomer.country || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Total Commandes</label>
                          <p className="font-semibold">{selectedCustomer.total_orders || 0}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Total Dépensé</label>
                          <p className="font-semibold">
                            {(Number(selectedCustomer.total_spent) || 0).toLocaleString('fr-FR')} XOF
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Customer Payments */}
                    {(() => {
                      const customerPayments = getCustomerPayments(selectedCustomer.id);
                      if (customerPayments.length === 0) return null;

                      return (
                        <div>
                          <h3 className="font-semibold mb-3">Historique des Paiements ({customerPayments.length})</h3>
                          <div className="space-y-2 max-h-96 overflow-y-auto">
                            {customerPayments.map((payment) => (
                              <div
                                key={payment.id}
                                className="flex items-center justify-between p-3 border rounded-lg"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">
                                      {payment.amount.toLocaleString('fr-FR')} {payment.currency}
                                    </span>
                                    {getStatusBadge(payment.status)}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {payment.payment_method} • {format(new Date(payment.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                                    {payment.orders?.order_number && ` • Commande: ${payment.orders.order_number}`}
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setViewCustomerDialogOpen(false);
                                    setSelectedPayment(payment);
                                    setViewPaymentDialogOpen(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

