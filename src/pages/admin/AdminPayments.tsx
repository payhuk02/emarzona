/**
 * Admin Payments Dashboard
 * Vue globale des paiements de la plateforme (pagination serveur)
 */

import { useState, useCallback, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MobileTableCard } from '@/components/ui/mobile-table-card';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useIsMobile } from '@/hooks/use-mobile';
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
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ProtectedAction } from '@/components/admin/ProtectedAction';
import { Admin2FABanner } from '@/components/admin/Admin2FABanner';
import {
  ADMIN_PAYMENT_PAGE_SIZES,
  DEFAULT_ADMIN_PAYMENT_PAGE_SIZE,
  type AdminPaymentTab,
} from '@/lib/admin/admin-payments-query';
import { useAdminPaymentStats, useAdminPaymentsList } from '@/hooks/useAdminPayments';

export default function AdminPayments() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeTab, setActiveTab] = useState<AdminPaymentTab>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_ADMIN_PAYMENT_PAGE_SIZE);
  const isMobile = useIsMobile();

  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const tableRef = useScrollAnimation<HTMLDivElement>();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, activeTab, pageSize]);

  const { data: stats, isLoading: statsLoading } = useAdminPaymentStats();
  const { data: pageData, isLoading: listLoading } = useAdminPaymentsList({
    page,
    pageSize,
    tab: activeTab,
    search: debouncedSearch,
  });

  const payments = pageData?.rows ?? [];
  const totalCount = pageData?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);
  const isLoading = statsLoading || listLoading;

  const getStatusBadge = useCallback((status: string | null) => {
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
        return <Badge>{status ?? '—'}</Badge>;
    }
  }, []);

  return (
    <AdminLayout>
      <div className="container mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
        <Admin2FABanner />
        <div
          ref={headerRef}
          role="banner"
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4"
        >
          <div>
            <h1
              className="text-lg sm:text-2xl md:text-3xl font-bold tracking-tight"
              id="admin-payments-title"
            >
              Paiements
            </h1>
            <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground">
              Vue d&apos;ensemble de tous les paiements de la plateforme
            </p>
          </div>
        </div>

        <div
          ref={statsRef}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4"
          role="region"
          aria-label="Statistiques des paiements"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] sm:text-xs md:text-sm font-medium">
                Montant payé (plateforme)
              </CardTitle>
              <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-base sm:text-xl md:text-2xl font-bold">
                {(stats?.totalAmount ?? 0).toLocaleString()} FCFA
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] sm:text-xs md:text-sm font-medium">Payés</CardTitle>
              <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-base sm:text-xl md:text-2xl font-bold text-green-600">
                {stats?.completed ?? 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En attente</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats?.pending ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] sm:text-xs md:text-sm font-medium">
                Échoués
              </CardTitle>
              <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-base sm:text-xl md:text-2xl font-bold text-red-600">
                {stats?.failed ?? 0}
              </div>
            </CardContent>
          </Card>
        </div>

        <ProtectedAction
          permission="payments.manage"
          fallback={
            <Card>
              <CardHeader>
                <CardTitle>Liste des paiements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">Accès restreint</div>
              </CardContent>
            </Card>
          }
        >
          <Card ref={tableRef}>
            <CardHeader>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par n° commande (min. 2 car.)..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-8 min-h-[44px]"
                    />
                  </div>
                </div>
                <Tabs value={activeTab} onValueChange={v => setActiveTab(v as AdminPaymentTab)}>
                  <TabsList>
                    <TabsTrigger value="all">Tous</TabsTrigger>
                    <TabsTrigger value="completed">Payés</TabsTrigger>
                    <TabsTrigger value="pending">En attente</TabsTrigger>
                    <TabsTrigger value="failed">Échoués</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>

            <CardContent>
              {isLoading && !pageData ? (
                <div className="text-center py-8">Chargement...</div>
              ) : payments.length > 0 ? (
                isMobile ? (
                  <MobileTableCard
                    data={payments}
                    columns={[
                      {
                        key: 'order_number',
                        label: 'N° Commande',
                        priority: 'high',
                        className: 'font-medium',
                      },
                      {
                        key: 'customers',
                        label: 'Client',
                        priority: 'high',
                        render: value => (
                          <div>
                            <div className="font-medium">
                              {value?.full_name || value?.name || 'N/A'}
                            </div>
                            <div className="text-sm text-muted-foreground">{value?.email}</div>
                          </div>
                        ),
                      },
                      {
                        key: 'stores',
                        label: 'Boutique',
                        priority: 'medium',
                        render: value => value?.name || 'N/A',
                      },
                      {
                        key: 'total_amount',
                        label: 'Montant',
                        priority: 'high',
                        render: value => `${Number(value ?? 0).toLocaleString()} FCFA`,
                      },
                      {
                        key: 'payment_status',
                        label: 'Statut',
                        priority: 'high',
                        render: value => getStatusBadge(value),
                      },
                      {
                        key: 'created_at',
                        label: 'Date',
                        priority: 'low',
                        render: value => format(new Date(value), 'PP', { locale: fr }),
                      },
                    ]}
                  />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>N° Commande</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Boutique</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map(payment => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">{payment.order_number}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {payment.customers?.full_name || payment.customers?.name || 'N/A'}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {payment.customers?.email}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{payment.stores?.name || 'N/A'}</TableCell>
                          <TableCell>
                            {payment.total_amount?.toLocaleString()} {payment.currency ?? 'FCFA'}
                          </TableCell>
                          <TableCell>{getStatusBadge(payment.payment_status)}</TableCell>
                          <TableCell>
                            {format(new Date(payment.created_at), 'PP', { locale: fr })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )
              ) : (
                <div className="text-center py-12">
                  <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucun paiement</h3>
                  <p className="text-muted-foreground">Aucun paiement trouvé.</p>
                </div>
              )}

              {totalCount > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    {from}–{to} sur {totalCount} paiements
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
                        {ADMIN_PAYMENT_PAGE_SIZES.map(size => (
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
