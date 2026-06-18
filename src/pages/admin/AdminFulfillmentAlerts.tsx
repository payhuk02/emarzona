/**
 * Panneau admin — Alertes fulfillment post-paiement (SLA 5 min)
 */

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  PackageCheck,
  RefreshCw,
  Search,
  XCircle,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
  useFulfillmentAlertStats,
  useFulfillmentAlerts,
  useFulfillmentSlaScan,
  useResolveFulfillmentAlert,
  type FulfillmentAlertRow,
} from '@/hooks/admin/useFulfillmentAlerts';
import {
  getFulfillmentIssueLabel,
  FULFILLMENT_SEVERITY_LABELS,
} from '@/lib/fulfillment/issue-labels';
import { cn } from '@/lib/utils';

function SeverityBadge({ severity }: { severity: string }) {
  const variant =
    severity === 'critical' ? 'destructive' : severity === 'warning' ? 'secondary' : 'outline';

  return (
    <Badge variant={variant} className="text-xs">
      {FULFILLMENT_SEVERITY_LABELS[severity] ?? severity}
    </Badge>
  );
}

export default function AdminFulfillmentAlerts() {
  const { toast } = useToast();
  const [tab, setTab] = useState<'open' | 'all'>('open');
  const [search, setSearch] = useState('');

  const includeResolved = tab === 'all';
  const {
    data: alerts,
    isLoading,
    isError,
    refetch: refetchAlerts,
    isFetching: fetchingAlerts,
  } = useFulfillmentAlerts({ includeResolved });

  const {
    data: slaScan,
    refetch: refetchScan,
    isFetching: fetchingScan,
  } = useFulfillmentSlaScan(5);

  const resolveAlert = useResolveFulfillmentAlert();
  const stats = useFulfillmentAlertStats(alerts);

  const filteredAlerts = useMemo(() => {
    if (!alerts) return [];
    const q = search.trim().toLowerCase();
    if (!q) return alerts;

    return alerts.filter(alert => {
      const orderNumber = alert.order?.order_number?.toLowerCase() ?? '';
      const issue = getFulfillmentIssueLabel(alert.issue_type).toLowerCase();
      const issueRaw = alert.issue_type.toLowerCase();
      return orderNumber.includes(q) || issue.includes(q) || issueRaw.includes(q);
    });
  }, [alerts, search]);

  const handleRefresh = async () => {
    await Promise.all([refetchAlerts(), refetchScan()]);
    toast({ title: 'Actualisé', description: 'Alertes et scan SLA mis à jour.' });
  };

  const handleResolve = async (alert: FulfillmentAlertRow) => {
    try {
      await resolveAlert.mutateAsync(alert.id);
      toast({
        title: 'Alerte résolue',
        description: `Commande ${alert.order?.order_number ?? alert.order_id}`,
      });
    } catch {
      toast({
        title: 'Erreur',
        description: "Impossible de marquer l'alerte comme résolue.",
        variant: 'destructive',
      });
    }
  };

  const isRefreshing = fetchingAlerts || fetchingScan;

  return (
    <AdminLayout>
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <PackageCheck className="h-4 w-4" aria-hidden />
              <span className="text-xs font-medium uppercase tracking-wide">Monitoring P0</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Alertes fulfillment</h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Commandes payées dont le fulfillment (licences, stock, inscriptions, edge) dépasse le
              SLA de 5 minutes.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleRefresh()}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')} />
            Actualiser
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Scan SLA live (&gt; 5 min)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  'text-2xl font-bold',
                  (slaScan?.stale_count ?? 0) > 0 ? 'text-red-600' : 'text-emerald-600'
                )}
              >
                {slaScan?.stale_count ?? '—'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">commandes en retard</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Alertes ouvertes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.openTotal}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Critiques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.openCritical}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Avertissements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{stats.openWarning}</div>
            </CardContent>
          </Card>
        </div>

        {slaScan && slaScan.stale_count > 0 && (
          <Card className="border-amber-500/40 bg-amber-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Commandes en retard de fulfillment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {slaScan.orders.slice(0, 8).map(order => (
                <div
                  key={order.order_id}
                  className="flex flex-wrap items-center gap-2 text-sm border-b border-border/50 pb-2 last:border-0"
                >
                  <span className="font-medium">
                    {order.order_number ?? order.order_id.slice(0, 8)}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {(order.issues ?? []).map(issue => (
                      <Badge key={issue} variant="outline" className="text-[10px]">
                        {getFulfillmentIssueLabel(issue)}
                      </Badge>
                    ))}
                  </div>
                  <Button variant="link" size="sm" className="h-auto p-0 ml-auto" asChild>
                    <Link to="/admin/orders">Voir commandes</Link>
                  </Button>
                </div>
              ))}
              {slaScan.stale_count > 8 && (
                <p className="text-xs text-muted-foreground">
                  + {slaScan.stale_count - 8} autre(s) commande(s)
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <CardTitle className="text-base">Historique des alertes</CardTitle>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher commande ou type..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-8 w-full sm:w-64"
                  />
                </div>
                <Tabs value={tab} onValueChange={v => setTab(v as 'open' | 'all')}>
                  <TabsList>
                    <TabsTrigger value="open">Ouvertes</TabsTrigger>
                    <TabsTrigger value="all">Toutes</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : isError ? (
              <div className="text-center py-10 text-muted-foreground">
                <XCircle className="h-10 w-10 mx-auto mb-3 text-destructive" />
                <p>Impossible de charger les alertes.</p>
                <p className="text-xs mt-1">
                  Vérifiez que la migration E49 est appliquée et que vous êtes admin plateforme.
                </p>
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-emerald-600" />
                <p>Aucune alerte {tab === 'open' ? 'ouverte' : ''}.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Commande</TableHead>
                      <TableHead>Problème</TableHead>
                      <TableHead>Sévérité</TableHead>
                      <TableHead className="hidden md:table-cell">Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAlerts.map(alert => (
                      <TableRow key={alert.id}>
                        <TableCell className="text-xs whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {format(new Date(alert.created_at), 'PPp', { locale: fr })}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-sm">
                          {alert.order?.order_number ?? (
                            <span className="font-mono text-xs">{alert.order_id.slice(0, 8)}…</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {getFulfillmentIssueLabel(alert.issue_type)}
                        </TableCell>
                        <TableCell>
                          <SeverityBadge severity={alert.severity} />
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {alert.resolved_at ? (
                            <Badge
                              variant="outline"
                              className="text-emerald-700 border-emerald-500/40"
                            >
                              Résolue
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Ouverte</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" asChild>
                              <Link to="/admin/orders">Commande</Link>
                            </Button>
                            {!alert.resolved_at && (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={resolveAlert.isPending}
                                onClick={() => void handleResolve(alert)}
                              >
                                Résoudre
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
