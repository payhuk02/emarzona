/**
 * Admin — Frais checkout acheteur (2% + 100 FCFA)
 * Distinct de la commission vendeur 10% sur ventes réussies.
 */
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, RefreshCw, Percent, Wallet, ShoppingCart, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/lib/product-helpers';

type CheckoutFeeRow = {
  order_id: string;
  order_number: string | null;
  store_id: string;
  store_name: string | null;
  currency: string;
  payment_status: string;
  status: string;
  total_amount: number;
  subtotal: number;
  checkout_fee_amount: number;
  fee_rule: string;
  created_at: string;
};

type FeesSummary = {
  total_fees: number;
  order_count: number;
  currency_breakdown: Array<{ currency: string; fees: number; orders: number }>;
  from: string;
  to: string;
};

export default function AdminCheckoutFees() {
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().slice(0, 10));

  const fromIso = useMemo(() => new Date(`${fromDate}T00:00:00.000Z`).toISOString(), [fromDate]);
  const toIso = useMemo(() => new Date(`${toDate}T23:59:59.999Z`).toISOString(), [toDate]);

  const summaryQuery = useQuery({
    queryKey: ['admin-checkout-fees-summary', fromIso, toIso],
    queryFn: async (): Promise<FeesSummary> => {
      const { data, error } = await supabase.rpc(
        // @ts-expect-error RPC added in S1 migration — types not regenerated yet
        'admin_checkout_fees_summary',
        {
          p_from: fromIso,
          p_to: toIso,
        }
      );
      if (error) throw error;
      return data as FeesSummary;
    },
  });

  const listQuery = useQuery({
    queryKey: ['admin-checkout-fees-list', fromIso, toIso],
    queryFn: async (): Promise<CheckoutFeeRow[]> => {
      // View admin_checkout_platform_fees (migration S1) — pas encore dans les types générés
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('admin_checkout_platform_fees')
        .select('*')
        .gte('created_at', fromIso)
        .lte('created_at', toIso)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []) as CheckoutFeeRow[];
    },
  });

  const summary = summaryQuery.data;
  const rows = listQuery.data || [];
  const loading = summaryQuery.isLoading || listQuery.isLoading;
  const primaryCurrency = summary?.currency_breakdown?.[0]?.currency || 'XOF';

  return (
    <AdminLayout>
      <div className="space-y-6 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Frais checkout (2% + 100)</h1>
            <p className="text-muted-foreground text-sm mt-1 max-w-2xl">
              Encaissements acheteur au checkout (2% + 100 FCFA), séparés de la commission
              plateforme vendeur (10% sur ventes digitales / services / cours / œuvres réussies).
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void summaryQuery.refetch();
              void listQuery.refetch();
            }}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Actualiser
          </Button>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Deux flux de revenus plateforme</AlertTitle>
          <AlertDescription className="text-sm space-y-1">
            <p>
              <strong>Frais checkout</strong> : payés par l’acheteur (inclus dans le Total) —
              affichés ici.
            </p>
            <p>
              <strong>Commission 10%</strong> : prélevée sur le revenu vendeur des ventes réussies
              (digital / service / cours / artiste) — visible dans Revenus / wallet boutique.
            </p>
          </AlertDescription>
        </Alert>

        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground" htmlFor="fees-from">
              Du
            </label>
            <Input
              id="fees-from"
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="w-[160px]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground" htmlFor="fees-to">
              Au
            </label>
            <Input
              id="fees-to"
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="w-[160px]"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Wallet className="h-4 w-4" /> Total frais checkout
              </CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {formatPrice(Number(summary?.total_fees) || 0, primaryCurrency)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" /> Commandes payées
              </CardDescription>
              <CardTitle className="text-2xl tabular-nums">{summary?.order_count ?? 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Percent className="h-4 w-4" /> Règle
              </CardDescription>
              <CardTitle className="text-lg">2% + 100 FCFA</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground">
                Commission vendeur 10% gérée à part (earnings).
              </p>
            </CardContent>
          </Card>
        </div>

        {(summary?.currency_breakdown?.length ?? 0) > 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Par devise</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {summary?.currency_breakdown?.map(row => (
                <Badge key={row.currency} variant="secondary" className="tabular-nums">
                  {row.currency}: {formatPrice(Number(row.fees) || 0, row.currency)} ({row.orders}{' '}
                  cmd)
                </Badge>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Détail des encaissements</CardTitle>
            <CardDescription>200 dernières commandes payées avec frais checkout</CardDescription>
          </CardHeader>
          <CardContent>
            {listQuery.isError && (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>Erreur de chargement</AlertTitle>
                <AlertDescription>
                  {(listQuery.error as Error)?.message || 'Impossible de charger les frais'}
                </AlertDescription>
              </Alert>
            )}
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Commande</TableHead>
                    <TableHead>Boutique</TableHead>
                    <TableHead className="text-right">Sous-total</TableHead>
                    <TableHead className="text-right">Frais 2%+100</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                        Chargement…
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading && rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Aucun frais checkout sur la période
                      </TableCell>
                    </TableRow>
                  )}
                  {rows.map(row => (
                    <TableRow key={row.order_id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {format(new Date(row.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {row.order_number || row.order_id}
                      </TableCell>
                      <TableCell className="text-sm">{row.store_name || '—'}</TableCell>
                      <TableCell className="text-right tabular-nums text-sm">
                        {formatPrice(Number(row.subtotal) || 0, row.currency)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm font-medium text-emerald-700 dark:text-emerald-400">
                        {formatPrice(Number(row.checkout_fee_amount) || 0, row.currency)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">
                        {formatPrice(Number(row.total_amount) || 0, row.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
