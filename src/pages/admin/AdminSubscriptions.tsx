/**
 * Admin — Vue plateforme des abonnements récurrents (boutiques / clients)
 */

import { useCallback, useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentAdminPermissions } from '@/hooks/useCurrentAdminPermissions';
import { Repeat, AlertCircle, TrendingUp, Users, PauseCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';

type SubRow = {
  id: string;
  name: string;
  status: string;
  amount: number;
  currency: string | null;
  billing_cycle: string;
  next_billing_date: string | null;
  created_at: string;
  stores: { name: string } | null;
};

type Stats = {
  total: number;
  active: number;
  paused: number;
  cancelled: number;
  mrrEstimate: number;
};

function estimateMrr(amount: number, cycle: string): number {
  switch (cycle) {
    case 'weekly':
      return amount * 4.33;
    case 'monthly':
      return amount;
    case 'quarterly':
      return amount / 3;
    case 'yearly':
      return amount / 12;
    default:
      return amount;
  }
}

export default function AdminSubscriptions() {
  const { can, loading: permLoading } = useCurrentAdminPermissions();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<SubRow[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    active: 0,
    paused: 0,
    cancelled: 0,
    mrrEstimate: 0,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('subscriptions')
        .select(
          `
          id, name, status, amount, currency, billing_cycle, next_billing_date, created_at,
          stores ( name )
        `
        )
        .order('created_at', { ascending: false })
        .limit(200);

      if (fetchError) throw fetchError;

      const list = (data as SubRow[]) || [];
      setRows(list);

      const active = list.filter(s => s.status === 'active');
      setStats({
        total: list.length,
        active: active.length,
        paused: list.filter(s => s.status === 'paused').length,
        cancelled: list.filter(s => s.status === 'cancelled' || s.status === 'expired').length,
        mrrEstimate: active.reduce(
          (sum, s) => sum + estimateMrr(Number(s.amount), s.billing_cycle),
          0
        ),
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!permLoading && (can('payments.manage') || can('analytics.view'))) {
      load();
    } else if (!permLoading) {
      setLoading(false);
    }
  }, [permLoading, can, load]);

  const statusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      paused: 'secondary',
      cancelled: 'destructive',
      expired: 'outline',
      past_due: 'destructive',
    };
    return <Badge variant={variants[status] ?? 'outline'}>{status}</Badge>;
  };

  if (!permLoading && !can('payments.manage') && !can('analytics.view')) {
    return (
      <AdminLayout>
        <div className="container mx-auto p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Permission payments.manage ou analytics.view requise.
            </AlertDescription>
          </Alert>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto p-3 sm:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Repeat className="h-7 w-7 text-primary" />
            Abonnements plateforme
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Abonnements récurrents clients ↔ boutiques (hors facturation SaaS Emarzona vendeurs).
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Actifs</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                {stats.active}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>MRR estimé (XOF)</CardDescription>
              <CardTitle className="text-lg">{formatCurrency(stats.mrrEstimate)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>En pause</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <PauseCircle className="h-5 w-5" />
                {stats.paused}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Annulés / expirés</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <XCircle className="h-5 w-5 text-muted-foreground" />
                {stats.cancelled}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Derniers abonnements
            </CardTitle>
            <CardDescription>Échantillon des 200 plus récents</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {loading ? (
              <Skeleton className="h-64" />
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Abonnement</TableHead>
                      <TableHead>Boutique</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Cycle</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Prochaine facturation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Aucun abonnement
                        </TableCell>
                      </TableRow>
                    ) : (
                      rows.map(row => (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium">{row.name}</TableCell>
                          <TableCell>{row.stores?.name ?? '—'}</TableCell>
                          <TableCell>
                            {formatCurrency(Number(row.amount))} {row.currency ?? 'XOF'}
                          </TableCell>
                          <TableCell className="capitalize">{row.billing_cycle}</TableCell>
                          <TableCell>{statusBadge(row.status)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {row.next_billing_date
                              ? format(new Date(row.next_billing_date), 'dd MMM yyyy', {
                                  locale: fr,
                                })
                              : '—'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
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
