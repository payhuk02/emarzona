/**
 * Admin Transaction Reconciliation
 * Page de réconciliation et vérification manuelle des transactions
 */

import { useState, useCallback, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileTableCard } from '@/components/ui/mobile-table-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  RefreshCw,
  Search,
  Clock,
  DollarSign,
  Download,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import {
  ADMIN_TRANSACTION_PAGE_SIZES,
  AdminTransactionRow,
} from '@/lib/admin/admin-transactions-reconciliation-query';
import {
  DEFAULT_ADMIN_TRANSACTION_PAGE_SIZE,
  useAdminTransactionStats,
  useAdminTransactionsList,
  type AdminTransactionTab,
} from '@/hooks/useAdminTransactionReconciliation';

type Transaction = AdminTransactionRow;

// MobileTableCard attend un Record<string, unknown> (index signature).
// On intersecte pour conserver le typage strict de Transaction.
type TransactionRowData = Transaction & Record<string, unknown>;

export default function AdminTransactionReconciliation() {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeTab, setActiveTab] = useState<AdminTransactionTab>('pending');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_ADMIN_TRANSACTION_PAGE_SIZE);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isPageVisible, setIsPageVisible] = useState<boolean>(() =>
    typeof document !== 'undefined' ? document.visibilityState === 'visible' : true
  );

  // Animations au scroll
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const tableRef = useScrollAnimation<HTMLDivElement>();

  useEffect(() => {
    const onVisibilityChange = () => {
      setIsPageVisible(document.visibilityState === 'visible');
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, activeTab, pageSize]);

  const {
    data: pageData,
    isLoading,
    refetch,
    isFetching,
  } = useAdminTransactionsList({
    page,
    pageSize,
    tab: activeTab,
    search: debouncedSearch,
    refetchInterval: isPageVisible ? 30000 : false,
  });

  const { data: stats } = useAdminTransactionStats();

  const transactions = pageData?.rows ?? [];
  const totalCount = pageData?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);

  // Mutation pour vérifier une transaction
  const verifyTransactionMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      // Appeler l'Edge Function retry-failed-transactions pour cette transaction spécifique
      // IMPORTANT SÉCURITÉ: utiliser le JWT utilisateur (et pas une clé "anon") pour permettre
      // à l'Edge Function de vérifier l'identité + autorisation (admin) côté serveur.
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      const accessToken = session?.access_token;
      if (!accessToken) {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }

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
        title: '✅ Vérification lancée',
        description: 'La transaction est en cours de vérification',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-transactions-reconciliation'] });
      queryClient.invalidateQueries({ queryKey: ['admin-transactions-stats'] });
      setTimeout(() => refetch(), 2000);
    },
    onError: (error: Error) => {
      toast({
        title: '❌ Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Export CSV (page courante)
  const handleExport = useCallback(() => {
    if (transactions.length === 0) {
      toast({
        title: 'Aucune donnée',
        description: 'Aucune transaction à exporter',
        variant: 'destructive',
      });
      return;
    }

    const headers = [
      'ID',
      'Order ID',
      'Order Number',
      'Amount',
      'Currency',
      'Status',
      'Payment Provider',
      'GeniusPay Transaction ID',
      'Created At',
      'Updated At',
    ];

    const rows = transactions.map(t => [
      t.id,
      t.order_id || '',
      t.order?.order_number || '',
      t.amount ?? 0,
      t.currency,
      t.status,
      t.payment_provider,
      t.geniuspay_transaction_id || '',
      t.created_at,
      t.updated_at,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: '✅ Export réussi',
      description: `${transactions.length} transactions exportées (page courante)`,
    });
  }, [transactions, toast]);

  const getStatusBadge = useCallback((status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      completed: { label: 'Complétée', className: 'bg-green-100 text-green-800' },
      processing: { label: 'En traitement', className: 'bg-yellow-100 text-yellow-800' },
      pending: { label: 'En attente', className: 'bg-blue-100 text-blue-800' },
      failed: { label: 'Échouée', className: 'bg-red-100 text-red-800' },
      cancelled: { label: 'Annulée', className: 'bg-gray-100 text-gray-800' },
    };

    const variant = variants[status] || { label: status, className: 'bg-gray-100 text-gray-800' };

    return <Badge className={variant.className}>{variant.label}</Badge>;
  }, []);

  const getAgeColor = useCallback((createdAt: string) => {
    const age = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60); // En heures
    if (age > 48) return 'text-red-600 font-semibold';
    if (age > 24) return 'text-orange-600 font-semibold';
    return 'text-gray-600';
  }, []);

  useEffect(() => {
    if (!isLoading) {
      logger.info(`Admin Transaction Reconciliation: ${totalCount} transactions (${activeTab})`);
    }
  }, [isLoading, totalCount, activeTab]);

  return (
    <AdminLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div
          ref={headerRef}
          role="banner"
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4"
        >
          <div>
            <h1 className="text-lg sm:text-2xl md:text-3xl font-bold tracking-tight">
              Réconciliation des Transactions
            </h1>
            <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground">
              Vérification et réconciliation manuelle des transactions
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            <Button variant="outline" onClick={handleExport} disabled={transactions.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Exporter CSV
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div
            ref={statsRef}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4"
            role="region"
            aria-label="Statistiques"
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold">{stats.totalCount}</div>
                <p className="text-xs text-muted-foreground">transactions</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Montant Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold">
                  {stats.totalAmount.toLocaleString('fr-FR')} XOF
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">En Attente</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold">{stats.processingCount}</div>
                <p className="text-xs text-muted-foreground">processing</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Anciennes</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold">{stats.oldPendingCount}</div>
                <p className="text-xs text-muted-foreground">&gt; 24h</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={value => setActiveTab(value as AdminTransactionTab)}>
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap [-webkit-overflow-scrolling:touch]">
            <TabsTrigger value="pending">En Attente</TabsTrigger>
            <TabsTrigger value="old">Anciennes (&gt; 24h)</TabsTrigger>
            <TabsTrigger value="failed">Échouées</TabsTrigger>
            <TabsTrigger value="all">Toutes</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {/* Search */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par ID, order number, email..."
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Table */}
            <Card ref={tableRef}>
              <CardHeader>
                <CardTitle>Transactions</CardTitle>
                <CardDescription>
                  {totalCount} transaction(s) — page {page}/{totalPages}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : transactions.length === 0 ? (
                  <Alert>
                    <AlertDescription>Aucune transaction trouvée</AlertDescription>
                  </Alert>
                ) : isMobile ? (
                  <MobileTableCard
                    data={transactions as unknown as TransactionRowData[]}
                    columns={[
                      {
                        key: 'id',
                        header: 'ID',
                        priority: 'high',
                        render: value => (
                          <span className="font-mono text-xs">
                            {String(value).substring(0, 8)}...
                          </span>
                        ),
                      },
                      {
                        key: 'order',
                        header: 'Commande',
                        priority: 'high',
                        render: (_value, row) => {
                          const t = row as unknown as Transaction;
                          return (
                            <div className="space-y-1">
                              <div className="font-medium">
                                {t.order?.order_number ||
                                  (t.order_id ? t.order_id.substring(0, 8) : '') ||
                                  'N/A'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {t.order?.customer_email || ''}
                              </div>
                            </div>
                          );
                        },
                      },
                      {
                        key: 'amount',
                        header: 'Montant',
                        priority: 'high',
                        render: (value, row) => {
                          const t = row as unknown as Transaction;
                          return (
                            <div className="font-semibold">
                              {Number(value || 0).toLocaleString('fr-FR')} {t.currency}
                            </div>
                          );
                        },
                        className: 'font-semibold',
                      },
                      {
                        key: 'status',
                        header: 'Statut',
                        priority: 'high',
                        render: value => getStatusBadge(String(value)),
                      },
                      {
                        key: 'payment_provider',
                        header: 'Provider',
                        priority: 'medium',
                        render: value => <Badge variant="outline">{String(value)}</Badge>,
                      },
                      {
                        key: 'created_at',
                        header: 'Créée le',
                        priority: 'medium',
                        render: (value, _row) => (
                          <div>
                            <div className={`text-xs ${getAgeColor(String(value))}`}>
                              {format(new Date(String(value)), 'dd MMM yyyy HH:mm', {
                                locale: fr,
                              })}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {Math.round(
                                (Date.now() - new Date(String(value)).getTime()) / (1000 * 60 * 60)
                              )}
                              h
                            </div>
                          </div>
                        ),
                      },
                    ]}
                    actions={row => (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => verifyTransactionMutation.mutate(String(row.id))}
                        disabled={verifyTransactionMutation.isPending}
                        className="min-h-[44px]"
                      >
                        {verifyTransactionMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Vérifier
                          </>
                        )}
                      </Button>
                    )}
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Order</TableHead>
                          <TableHead>Montant</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Provider</TableHead>
                          <TableHead>Créée le</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map(transaction => (
                          <TableRow key={transaction.id}>
                            <TableCell className="font-mono text-xs">
                              {transaction.id.substring(0, 8)}...
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-medium">
                                  {transaction.order?.order_number ||
                                    transaction.order_id?.substring(0, 8) ||
                                    'N/A'}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {transaction.order?.customer_email || ''}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-semibold">
                                {Number(transaction.amount ?? 0).toLocaleString('fr-FR')}{' '}
                                {transaction.currency}
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{transaction.payment_provider}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className={`text-xs ${getAgeColor(transaction.created_at)}`}>
                                {format(new Date(transaction.created_at), 'dd MMM yyyy HH:mm', {
                                  locale: fr,
                                })}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {Math.round(
                                  (Date.now() - new Date(transaction.created_at).getTime()) /
                                    (1000 * 60 * 60)
                                )}
                                h
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => verifyTransactionMutation.mutate(transaction.id)}
                                disabled={verifyTransactionMutation.isPending}
                              >
                                {verifyTransactionMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <RefreshCw className="h-4 w-4 mr-1" />
                                    Vérifier
                                  </>
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {totalCount > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t mt-4">
                    <p className="text-sm text-muted-foreground">
                      {from}–{to} sur {totalCount} transactions
                    </p>
                    <div className="flex items-center gap-2">
                      <Select
                        value={pageSize.toString()}
                        onValueChange={value => {
                          setPageSize(Number(value));
                          setPage(1);
                        }}
                      >
                        <SelectTrigger className="w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ADMIN_TRANSACTION_PAGE_SIZES.map(size => (
                            <SelectItem key={size} value={size.toString()}>
                              {size} / page
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={page <= 1}
                        onClick={() => setPage(1)}
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={page <= 1}
                        onClick={() => setPage(page - 1)}
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
                        onClick={() => setPage(page + 1)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={page >= totalPages}
                        onClick={() => setPage(totalPages)}
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
