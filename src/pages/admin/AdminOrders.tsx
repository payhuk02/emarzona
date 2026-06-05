import { useState, useCallback, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
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
import {
  BoxIcon,
  TrendingUp,
  DollarSign,
  Package,
  Search,
  XCircle,
  Clock,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { Admin2FABanner } from '@/components/admin/Admin2FABanner';
import { ProtectedAction } from '@/components/admin/ProtectedAction';
import { useAdminActions } from '@/hooks/useAdminActions';
import { useAdminMFA } from '@/hooks/useAdminMFA';
import { useIsMobile } from '@/hooks/use-mobile';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';
import {
  ADMIN_ORDER_PAGE_SIZES,
  DEFAULT_ADMIN_ORDER_PAGE_SIZE,
  type AdminOrderTab,
} from '@/lib/admin/admin-orders-query';
import { useAdminOrderStats, useAdminOrdersList } from '@/hooks/useAdminOrders';

export default function AdminOrders() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeTab, setActiveTab] = useState<AdminOrderTab>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_ADMIN_ORDER_PAGE_SIZE);
  const isMobile = useIsMobile();
  const { cancelOrder } = useAdminActions();
  const { isAAL2 } = useAdminMFA();
  const queryClient = useQueryClient();

  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, activeTab, pageSize]);

  const { data: stats, isLoading: statsLoading } = useAdminOrderStats();
  const { data: pageData, isLoading: listLoading } = useAdminOrdersList({
    page,
    pageSize,
    tab: activeTab,
    search: debouncedSearch,
  });

  const orders = pageData?.rows ?? [];
  const totalCount = pageData?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);
  const isLoading = statsLoading || listLoading;

  const getStatusBadge = useCallback((status: string | null) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return (
          <Badge variant="default">
            <CheckCircle className="h-3 w-3 mr-1" />
            Terminée
          </Badge>
        );
      case 'processing':
      case 'confirmed':
        return (
          <Badge variant="secondary">
            <TrendingUp className="h-3 w-3 mr-1" />
            En cours
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Annulée
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            En attente
          </Badge>
        );
      default:
        return <Badge variant="outline">{status ?? '—'}</Badge>;
    }
  }, []);

  const getPaymentBadge = useCallback((status: string | null) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return <Badge variant="default">Payé</Badge>;
      case 'pending':
        return <Badge variant="secondary">En attente</Badge>;
      case 'failed':
        return <Badge variant="destructive">Échoué</Badge>;
      default:
        return <Badge variant="outline">{status ?? '—'}</Badge>;
    }
  }, []);

  const invalidateOrders = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-orders-stats'] }),
    ]);
  };

  const handleCancel = async (orderId: string) => {
    if (!isAAL2) return;
    const ok = await cancelOrder(orderId);
    if (ok) await invalidateOrders();
  };

  if (isLoading && !pageData) {
    return (
      <AdminLayout>
        <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        <Admin2FABanner />

        <div
          ref={headerRef}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4"
          role="banner"
        >
          <div>
            <h1
              className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2"
              id="admin-orders-title"
            >
              <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20">
                <BoxIcon className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" aria-hidden="true" />
              </div>
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Gestion Commandes Globales
              </span>
            </h1>
            <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground">
              Vue administrateur de toutes les commandes de la plateforme
            </p>
          </div>
        </div>

        <div
          ref={statsRef}
          className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4"
          role="region"
          aria-label="Statistiques des commandes"
        >
          {[
            { label: 'Total commandes', value: stats?.total ?? 0, icon: Package },
            { label: 'Paiement en attente', value: stats?.pending ?? 0, icon: Clock },
            { label: 'En traitement', value: stats?.processing ?? 0, icon: TrendingUp },
            {
              label: 'Revenu payé',
              value: formatCurrency(stats?.totalRevenue ?? 0),
              icon: DollarSign,
            },
          ].map(stat => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <CardHeader className="pb-2 p-3 sm:p-4">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {stat.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0">
                  <div className="text-lg sm:text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <ProtectedAction
          permission="orders.manage"
          fallback={
            <Card>
              <CardHeader>
                <CardTitle>Liste des commandes</CardTitle>
                <CardDescription>Accès restreint</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center py-12 text-muted-foreground">
                  Vous n&apos;avez pas la permission de gérer les commandes.
                </p>
              </CardContent>
            </Card>
          }
        >
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par n° commande (min. 2 caractères)..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9 min-h-[44px]"
                  />
                </div>
                <Tabs value={activeTab} onValueChange={v => setActiveTab(v as AdminOrderTab)}>
                  <TabsList className="flex-wrap h-auto">
                    <TabsTrigger value="all">Toutes</TabsTrigger>
                    <TabsTrigger value="pending">Paiement</TabsTrigger>
                    <TabsTrigger value="processing">Traitement</TabsTrigger>
                    <TabsTrigger value="completed">Terminées</TabsTrigger>
                    <TabsTrigger value="cancelled">Annulées</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              {listLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground" role="status">
                  <BoxIcon className="h-12 w-12 mx-auto mb-4 opacity-50" aria-hidden="true" />
                  <p>Aucune commande trouvée</p>
                </div>
              ) : isMobile ? (
                <MobileTableCard
                  data={orders}
                  columns={[
                    {
                      key: 'order_number',
                      label: 'N° commande',
                      priority: 'high',
                      className: 'font-medium',
                    },
                    {
                      key: 'customers',
                      label: 'Client',
                      priority: 'high',
                      render: v => v?.full_name || v?.name || v?.email || 'Client inconnu',
                    },
                    {
                      key: 'stores',
                      label: 'Boutique',
                      priority: 'medium',
                      render: v => v?.name ?? '—',
                    },
                    {
                      key: 'total_amount',
                      label: 'Montant',
                      priority: 'high',
                      render: (v, row) => formatCurrency(Number(v), row.currency ?? 'XOF'),
                    },
                    {
                      key: 'status',
                      label: 'Statut',
                      priority: 'high',
                      render: v => getStatusBadge(v),
                    },
                    {
                      key: 'payment_status',
                      label: 'Paiement',
                      priority: 'high',
                      render: v => getPaymentBadge(v),
                    },
                    {
                      key: 'created_at',
                      label: 'Date',
                      priority: 'low',
                      render: v => (v ? format(new Date(v), 'PP', { locale: fr }) : '—'),
                    },
                  ]}
                  actions={row =>
                    row.status !== 'cancelled' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!isAAL2}
                        onClick={() => handleCancel(row.id)}
                      >
                        Annuler
                      </Button>
                    ) : null
                  }
                />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>N° commande</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Boutique</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Paiement</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map(order => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.order_number}</TableCell>
                          <TableCell>
                            {order.customers?.full_name ||
                              order.customers?.name ||
                              order.customers?.email ||
                              '—'}
                          </TableCell>
                          <TableCell>{order.stores?.name ?? '—'}</TableCell>
                          <TableCell>
                            {formatCurrency(order.total_amount, order.currency ?? 'XOF')}
                          </TableCell>
                          <TableCell>{getStatusBadge(order.status)}</TableCell>
                          <TableCell>{getPaymentBadge(order.payment_status)}</TableCell>
                          <TableCell>
                            {order.created_at
                              ? format(new Date(order.created_at), 'PP', { locale: fr })
                              : '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            {order.status !== 'cancelled' && (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={!isAAL2}
                                onClick={() => handleCancel(order.id)}
                              >
                                Annuler
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {totalCount > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    {from}–{to} sur {totalCount} commandes
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
                        {ADMIN_ORDER_PAGE_SIZES.map(size => (
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
        </ProtectedAction>
      </div>
    </AdminLayout>
  );
}
