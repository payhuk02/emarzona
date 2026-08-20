/**
 * Admin Store Commerce
 * Suivi clients, commandes et paiements par boutique
 */

import { useCallback, useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminStorePicker } from '@/components/admin/AdminStorePicker';
import { Admin2FABanner } from '@/components/admin/Admin2FABanner';
import { ProtectedAction } from '@/components/admin/ProtectedAction';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MobileTableCard } from '@/components/ui/mobile-table-card';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';
import {
  STORE_COMMERCE_PAGE_SIZES,
  type StoreCommerceCustomerRow,
  type StoreCommerceCustomerTab,
  type StoreCommerceOrderTab,
  type StoreCommerceTransactionTab,
} from '@/lib/admin/admin-store-commerce-query';
import {
  DEFAULT_STORE_COMMERCE_PAGE_SIZE,
  useRefreshStoreEarnings,
  useStoreCommerceCustomers,
  useStoreCommerceOrders,
  useStoreCommerceOverview,
  useStoreCommerceTransactions,
} from '@/hooks/useAdminStoreCommerce';
import {
  Users,
  ShoppingBag,
  CreditCard,
  Wallet,
  Search,
  RefreshCw,
  CheckCircle,
  Clock,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Store,
} from 'lucide-react';

type MainSection = 'customers' | 'orders' | 'transactions';

function PaginationBar(props: {
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  const { page, pageSize, totalCount, onPageChange, onPageSizeChange } = props;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t">
      <p className="text-sm text-muted-foreground">
        {totalCount === 0 ? 'Aucun résultat' : `${from}–${to} sur ${totalCount}`}
      </p>
      <div className="flex items-center gap-2">
        <Select value={String(pageSize)} onValueChange={v => onPageSizeChange(Number(v))}>
          <SelectTrigger className="w-[100px] min-h-[44px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STORE_COMMERCE_PAGE_SIZES.map(size => (
              <SelectItem key={size} value={String(size)}>
                {size} / page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => onPageChange(1)}>
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm px-2">
          {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="icon"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          disabled={page >= totalPages}
          onClick={() => onPageChange(totalPages)}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function AdminStoreCommerce() {
  const [storeId, setStoreId] = useState<string | null>(null);
  const [section, setSection] = useState<MainSection>('orders');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_STORE_COMMERCE_PAGE_SIZE);
  const [customerTab, setCustomerTab] = useState<StoreCommerceCustomerTab>('all');
  const [orderTab, setOrderTab] = useState<StoreCommerceOrderTab>('all');
  const [transactionTab, setTransactionTab] = useState<StoreCommerceTransactionTab>('all');

  const isMobile = useIsMobile();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, customerTab, orderTab, transactionTab, pageSize, storeId, section]);

  const {
    data: overview,
    isLoading: overviewLoading,
    refetch: refetchOverview,
  } = useStoreCommerceOverview(storeId);
  const refreshEarnings = useRefreshStoreEarnings(storeId);

  const customersQuery = useStoreCommerceCustomers({
    storeId,
    page,
    pageSize,
    tab: customerTab,
    search: debouncedSearch,
  });
  const ordersQuery = useStoreCommerceOrders({
    storeId,
    page,
    pageSize,
    tab: orderTab,
    search: debouncedSearch,
  });
  const transactionsQuery = useStoreCommerceTransactions({
    storeId,
    page,
    pageSize,
    tab: transactionTab,
    search: debouncedSearch,
  });

  const activeQuery =
    section === 'customers'
      ? customersQuery
      : section === 'transactions'
        ? transactionsQuery
        : ordersQuery;

  const verifyTransactionMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      const accessToken = session?.access_token;
      if (!accessToken) throw new Error('Session expirée. Veuillez vous reconnecter.');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/retry-failed-transactions`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ transaction_id: transactionId }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la vérification');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Vérification lancée',
        description: 'La transaction est en cours de vérification auprès du PSP.',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-store-commerce-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-store-commerce-overview'] });
      queryClient.invalidateQueries({ queryKey: ['admin-store-commerce-orders'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const handleRefreshAll = useCallback(async () => {
    if (!storeId) return;
    try {
      await refreshEarnings.mutateAsync();
      await Promise.all([
        refetchOverview(),
        customersQuery.refetch(),
        ordersQuery.refetch(),
        transactionsQuery.refetch(),
      ]);
      toast({ title: 'Données actualisées', description: 'Soldes et listes mis à jour.' });
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Actualisation impossible',
        variant: 'destructive',
      });
    }
  }, [
    storeId,
    refreshEarnings,
    refetchOverview,
    customersQuery,
    ordersQuery,
    transactionsQuery,
    toast,
  ]);

  const getPaymentBadge = useCallback((status: string | null) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return (
          <Badge variant="default">
            <CheckCircle className="h-3 w-3 mr-1" /> Payé
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" /> En attente
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" /> Échoué
          </Badge>
        );
      default:
        return <Badge variant="outline">{status ?? '—'}</Badge>;
    }
  }, []);

  const getTransactionBadge = useCallback((status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      completed: { label: 'Complétée', className: 'bg-green-100 text-green-800' },
      processing: { label: 'En traitement', className: 'bg-yellow-100 text-yellow-800' },
      pending: { label: 'En attente', className: 'bg-blue-100 text-blue-800' },
      failed: { label: 'Échouée', className: 'bg-red-100 text-red-800' },
    };
    const v = map[status] ?? { label: status, className: 'bg-gray-100 text-gray-800' };
    return <Badge className={v.className}>{v.label}</Badge>;
  }, []);

  const customerName = (row: {
    name: string | null;
    full_name: string | null;
    email: string | null;
  }) => row.full_name || row.name || row.email || '—';

  return (
    <AdminLayout>
      <div className="container mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
        <Admin2FABanner />

        <div
          ref={headerRef}
          className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-lg sm:text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
              <Store className="h-7 w-7 text-primary" aria-hidden />
              Commerce par boutique
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Suivi des clients, commandes et paiements PSP par boutique
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => void handleRefreshAll()}
            disabled={!storeId || refreshEarnings.isPending}
            className="min-h-[44px]"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${refreshEarnings.isPending ? 'animate-spin' : ''}`}
            />
            Actualiser
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Boutique</CardTitle>
            <CardDescription>Sélectionnez la boutique à auditer</CardDescription>
          </CardHeader>
          <CardContent>
            <AdminStorePicker value={storeId} onChange={setStoreId} />
          </CardContent>
        </Card>

        {storeId && (
          <>
            <div
              ref={statsRef}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4"
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    Clients
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold flex items-center gap-2">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    {overviewLoading ? '…' : (overview?.totalCustomers ?? 0)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    Commandes payées
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {overviewLoading ? '…' : (overview?.paidOrders ?? 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    / {overview?.totalOrders ?? 0} total
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    En attente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {overviewLoading ? '…' : (overview?.pendingOrders ?? 0)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    Chiffre d&apos;affaires
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">
                    {overviewLoading
                      ? '…'
                      : formatCurrency(overview?.totalRevenue ?? 0, overview?.currency ?? 'XOF')}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    Solde disponible
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-primary flex items-center gap-1">
                    <Wallet className="h-4 w-4" />
                    {overviewLoading
                      ? '…'
                      : formatCurrency(
                          overview?.availableBalance ?? 0,
                          overview?.currency ?? 'XOF'
                        )}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    Commission plateforme
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">
                    {overviewLoading
                      ? '…'
                      : formatCurrency(
                          overview?.platformCommission ?? 0,
                          overview?.currency ?? 'XOF'
                        )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <ProtectedAction
              permission="payments.manage"
              fallback={
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    Accès restreint — permission payments.manage requise
                  </CardContent>
                </Card>
              }
            >
              <Card>
                <CardHeader>
                  <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
                    <Tabs value={section} onValueChange={v => setSection(v as MainSection)}>
                      <TabsList>
                        <TabsTrigger value="customers">
                          <Users className="h-4 w-4 mr-1" /> Clients
                        </TabsTrigger>
                        <TabsTrigger value="orders">
                          <ShoppingBag className="h-4 w-4 mr-1" /> Commandes
                        </TabsTrigger>
                        <TabsTrigger value="transactions">
                          <CreditCard className="h-4 w-4 mr-1" /> Transactions PSP
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher (min. 2 car.)…"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-8 min-h-[44px]"
                      />
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <Tabs value={section}>
                    <TabsContent value="customers" className="mt-0 space-y-4">
                      <Tabs
                        value={customerTab}
                        onValueChange={v => setCustomerTab(v as StoreCommerceCustomerTab)}
                      >
                        <TabsList>
                          <TabsTrigger value="all">Tous</TabsTrigger>
                          <TabsTrigger value="active">Avec commandes</TabsTrigger>
                          <TabsTrigger value="new">Nouveaux (30j)</TabsTrigger>
                        </TabsList>
                      </Tabs>

                      {customersQuery.isLoading && !customersQuery.data ? (
                        <div className="py-8 text-center text-muted-foreground">Chargement…</div>
                      ) : (customersQuery.data?.rows.length ?? 0) === 0 ? (
                        <div className="py-8 text-center text-muted-foreground">Aucun client</div>
                      ) : isMobile ? (
                        <MobileTableCard
                          data={(customersQuery.data?.rows ?? []) as Record<string, unknown>[]}
                          columns={[
                            {
                              key: 'name',
                              label: 'Client',
                              priority: 'high',
                              render: (_, row) => customerName(row as StoreCommerceCustomerRow),
                            },
                            { key: 'email', label: 'Email', priority: 'high' },
                            { key: 'phone', label: 'Téléphone', priority: 'medium' },
                            {
                              key: 'total_orders',
                              label: 'Commandes',
                              priority: 'medium',
                              render: v => String(v ?? 0),
                            },
                            {
                              key: 'total_spent',
                              label: 'Total dépensé',
                              priority: 'high',
                              render: v =>
                                formatCurrency(Number(v ?? 0), overview?.currency ?? 'XOF'),
                            },
                            {
                              key: 'created_at',
                              label: 'Inscrit le',
                              priority: 'low',
                              render: v =>
                                v
                                  ? format(new Date(String(v)), 'dd MMM yyyy', { locale: fr })
                                  : '—',
                            },
                          ]}
                        />
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Client</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Téléphone</TableHead>
                              <TableHead>Commandes</TableHead>
                              <TableHead>Total dépensé</TableHead>
                              <TableHead>Inscrit le</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(customersQuery.data?.rows ?? []).map(row => (
                              <TableRow key={row.id}>
                                <TableCell className="font-medium">{customerName(row)}</TableCell>
                                <TableCell>{row.email ?? '—'}</TableCell>
                                <TableCell>{row.phone ?? '—'}</TableCell>
                                <TableCell>{row.total_orders ?? 0}</TableCell>
                                <TableCell>
                                  {formatCurrency(
                                    row.total_spent ?? 0,
                                    overview?.currency ?? 'XOF'
                                  )}
                                </TableCell>
                                <TableCell>
                                  {format(new Date(row.created_at), 'dd MMM yyyy HH:mm', {
                                    locale: fr,
                                  })}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </TabsContent>

                    <TabsContent value="orders" className="mt-0 space-y-4">
                      <Tabs
                        value={orderTab}
                        onValueChange={v => setOrderTab(v as StoreCommerceOrderTab)}
                      >
                        <TabsList>
                          <TabsTrigger value="all">Toutes</TabsTrigger>
                          <TabsTrigger value="paid">Payées</TabsTrigger>
                          <TabsTrigger value="pending">En attente</TabsTrigger>
                          <TabsTrigger value="failed">Échouées</TabsTrigger>
                        </TabsList>
                      </Tabs>

                      {ordersQuery.isLoading && !ordersQuery.data ? (
                        <div className="py-8 text-center text-muted-foreground">Chargement…</div>
                      ) : (ordersQuery.data?.rows.length ?? 0) === 0 ? (
                        <div className="py-8 text-center text-muted-foreground">
                          Aucune commande
                        </div>
                      ) : isMobile ? (
                        <MobileTableCard
                          data={(ordersQuery.data?.rows ?? []) as Record<string, unknown>[]}
                          columns={[
                            {
                              key: 'order_number',
                              label: 'N° commande',
                              priority: 'high',
                              className: 'font-mono',
                            },
                            {
                              key: 'payment_status',
                              label: 'Paiement',
                              priority: 'high',
                              render: v => getPaymentBadge(v ? String(v) : null),
                            },
                            {
                              key: 'total_amount',
                              label: 'Montant',
                              priority: 'high',
                              render: (v, row) =>
                                formatCurrency(
                                  Number(v ?? 0),
                                  (row as { currency?: string }).currency ?? 'XOF'
                                ),
                            },
                            {
                              key: 'customer_email',
                              label: 'Client',
                              priority: 'medium',
                              render: (_, row) => {
                                const r = row as {
                                  customers?: {
                                    full_name?: string | null;
                                    name?: string | null;
                                  } | null;
                                  customer_email?: string | null;
                                };
                                return (
                                  r.customers?.full_name ||
                                  r.customers?.name ||
                                  r.customer_email ||
                                  '—'
                                );
                              },
                            },
                            {
                              key: 'created_at',
                              label: 'Date',
                              priority: 'low',
                              render: v =>
                                format(new Date(String(v)), 'dd MMM yyyy HH:mm', { locale: fr }),
                            },
                          ]}
                        />
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>N° commande</TableHead>
                              <TableHead>Client</TableHead>
                              <TableHead>Montant</TableHead>
                              <TableHead>Paiement</TableHead>
                              <TableHead>Statut</TableHead>
                              <TableHead>Payé le</TableHead>
                              <TableHead>Créée le</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(ordersQuery.data?.rows ?? []).map(row => (
                              <TableRow key={row.id}>
                                <TableCell className="font-mono text-sm">
                                  {row.order_number}
                                </TableCell>
                                <TableCell>
                                  {row.customers?.full_name ||
                                    row.customers?.name ||
                                    row.customer_email ||
                                    '—'}
                                </TableCell>
                                <TableCell>
                                  {formatCurrency(row.total_amount, row.currency ?? 'XOF')}
                                </TableCell>
                                <TableCell>{getPaymentBadge(row.payment_status)}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">{row.status ?? '—'}</Badge>
                                </TableCell>
                                <TableCell>
                                  {row.paid_at
                                    ? format(new Date(row.paid_at), 'dd MMM yyyy HH:mm', {
                                        locale: fr,
                                      })
                                    : '—'}
                                </TableCell>
                                <TableCell>
                                  {format(new Date(row.created_at), 'dd MMM yyyy HH:mm', {
                                    locale: fr,
                                  })}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </TabsContent>

                    <TabsContent value="transactions" className="mt-0 space-y-4">
                      <Tabs
                        value={transactionTab}
                        onValueChange={v => setTransactionTab(v as StoreCommerceTransactionTab)}
                      >
                        <TabsList>
                          <TabsTrigger value="all">Toutes</TabsTrigger>
                          <TabsTrigger value="completed">Complétées</TabsTrigger>
                          <TabsTrigger value="pending">En attente</TabsTrigger>
                          <TabsTrigger value="failed">Échouées</TabsTrigger>
                        </TabsList>
                      </Tabs>

                      {transactionsQuery.isLoading && !transactionsQuery.data ? (
                        <div className="py-8 text-center text-muted-foreground">Chargement…</div>
                      ) : (transactionsQuery.data?.rows.length ?? 0) === 0 ? (
                        <div className="py-8 text-center text-muted-foreground">
                          Aucune transaction
                        </div>
                      ) : isMobile ? (
                        <MobileTableCard
                          data={(transactionsQuery.data?.rows ?? []) as Record<string, unknown>[]}
                          columns={[
                            {
                              key: 'order',
                              label: 'Commande',
                              priority: 'high',
                              render: v =>
                                (v as { order_number?: string } | null)?.order_number ?? '—',
                            },
                            {
                              key: 'status',
                              label: 'Statut',
                              priority: 'high',
                              render: v => getTransactionBadge(String(v)),
                            },
                            {
                              key: 'amount',
                              label: 'Montant',
                              priority: 'high',
                              render: (v, row) =>
                                formatCurrency(
                                  Number(v ?? 0),
                                  (row as { currency?: string }).currency ?? 'XOF'
                                ),
                            },
                            { key: 'payment_provider', label: 'PSP', priority: 'medium' },
                            { key: 'payment_id', label: 'ID PSP', priority: 'low' },
                          ]}
                          actions={row => {
                            const status = String(row.status ?? '');
                            if (!['pending', 'processing'].includes(status)) return null;
                            return (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => verifyTransactionMutation.mutate(String(row.id))}
                                disabled={verifyTransactionMutation.isPending}
                              >
                                Vérifier
                              </Button>
                            );
                          }}
                        />
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Commande</TableHead>
                              <TableHead>Client</TableHead>
                              <TableHead>Montant</TableHead>
                              <TableHead>PSP</TableHead>
                              <TableHead>ID PSP</TableHead>
                              <TableHead>Statut</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(transactionsQuery.data?.rows ?? []).map(row => (
                              <TableRow key={row.id}>
                                <TableCell className="font-mono text-sm">
                                  {row.order?.order_number ?? '—'}
                                </TableCell>
                                <TableCell>{row.customer_email ?? '—'}</TableCell>
                                <TableCell>
                                  {formatCurrency(row.amount ?? 0, row.currency ?? 'XOF')}
                                </TableCell>
                                <TableCell>{row.payment_provider}</TableCell>
                                <TableCell className="font-mono text-xs max-w-[140px] truncate">
                                  {row.payment_id ?? '—'}
                                </TableCell>
                                <TableCell>{getTransactionBadge(row.status)}</TableCell>
                                <TableCell>
                                  {format(new Date(row.created_at), 'dd MMM yyyy HH:mm', {
                                    locale: fr,
                                  })}
                                </TableCell>
                                <TableCell className="text-right">
                                  {['pending', 'processing'].includes(row.status) && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => verifyTransactionMutation.mutate(row.id)}
                                      disabled={verifyTransactionMutation.isPending}
                                    >
                                      {verifyTransactionMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        'Vérifier'
                                      )}
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </TabsContent>
                  </Tabs>

                  <PaginationBar
                    page={page}
                    pageSize={pageSize}
                    totalCount={activeQuery.data?.totalCount ?? 0}
                    onPageChange={setPage}
                    onPageSizeChange={setPageSize}
                  />
                </CardContent>
              </Card>
            </ProtectedAction>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
