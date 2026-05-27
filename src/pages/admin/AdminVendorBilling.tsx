/**
 * Admin — Abonnements requis pour l'e-commerce "Produits physiques"
 * (Les autres systèmes restent à commission 10% par vente réussie.)
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminPermissionGate } from '@/components/admin/AdminPermissionGate';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { Package, CreditCard, Layers, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

type VendorPlan = {
  id: string;
  slug: string;
  name: string;
  trial_days?: number | null;
  monthly_price: number;
  is_active: boolean;
};

type StoreSubRow = {
  id: string;
  status: string;
  billing_cycle: string;
  mrr_amount: number;
  current_period_end: string | null;
  stores: { name: string; slug: string } | null;
  platform_vendor_plans: { name: string; slug: string } | null;
};

export default function AdminVendorBilling() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plans, setPlans] = useState<VendorPlan[]>([]);
  const [subs, setSubs] = useState<StoreSubRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [plansRes, subsRes] = await Promise.all([
        supabase
          .from('platform_vendor_plans')
          .select('id, slug, name, trial_days, monthly_price, is_active')
          .order('display_order'),
        supabase
          .from('store_platform_subscriptions')
          .select(
            `
            id, status, billing_cycle, mrr_amount, current_period_end,
            stores ( name, slug ),
            platform_vendor_plans ( name, slug )
          `
          )
          .order('created_at', { ascending: false })
          .limit(300),
      ]);

      if (plansRes.error) throw plansRes.error;
      if (subsRes.error) throw subsRes.error;

      setPlans((plansRes.data as VendorPlan[]) ?? []);
      setSubs((subsRes.data as StoreSubRow[]) ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const active = subs.filter(s => s.status === 'active' || s.status === 'trialing');
    const mrr = active.reduce((sum, s) => sum + Number(s.mrr_amount), 0);
    const byPlan = plans.map(p => ({
      plan: p.name,
      count: subs.filter(s => s.platform_vendor_plans?.slug === p.slug && s.status === 'active')
        .length,
    }));
    return { total: subs.length, active: active.length, mrr, byPlan };
  }, [subs, plans]);

  const updatePlan = async (subId: string, planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    const { error: updateError } = await supabase
      .from('store_platform_subscriptions')
      .update({
        plan_id: planId,
        mrr_amount: Number(plan.monthly_price),
        updated_at: new Date().toISOString(),
      })
      .eq('id', subId);

    if (updateError) {
      toast({ title: 'Erreur', description: updateError.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Plan mis à jour' });
    await load();
  };

  const statusBadge = (status: string) => {
    const v: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      trialing: 'secondary',
      past_due: 'destructive',
      cancelled: 'outline',
      expired: 'outline',
    };
    return <Badge variant={v[status] ?? 'outline'}>{status}</Badge>;
  };

  return (
    <AdminLayout>
      <AdminPermissionGate permissions={['payments.manage', 'settings.manage']}>
        <div className="container mx-auto p-3 sm:p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Package className="h-7 w-7 text-primary" />
              Abonnements — Produits physiques
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Seul le système e-commerce <strong>produits physiques</strong> requiert un abonnement
              (essai 30 jours). Les systèmes digital / services / cours / œuvres restent à{' '}
              <strong>commission 10%</strong> par vente.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>MRR plateforme</CardDescription>
                <CardTitle className="text-xl flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  {formatCurrency(stats.mrr)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Boutiques actives</CardDescription>
                <CardTitle className="text-2xl">{stats.active}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total souscriptions</CardDescription>
                <CardTitle className="text-2xl">{stats.total}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Plans disponibles</CardDescription>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  {plans.filter(p => p.is_active).length}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Plans plateforme</CardTitle>
              <CardDescription>
                Tarification abonnement pour activer les produits physiques
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-32" />
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Plan</TableHead>
                        <TableHead>Essai</TableHead>
                        <TableHead>Prix / mois</TableHead>
                        <TableHead>Boutiques actives</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {plans.map(p => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell>{p.trial_days ? `${p.trial_days} jours` : '—'}</TableCell>
                          <TableCell>{formatCurrency(Number(p.monthly_price))}</TableCell>
                          <TableCell>
                            {stats.byPlan.find(b => b.plan === p.name)?.count ?? 0}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Souscriptions boutiques
              </CardTitle>
              <CardDescription>300 plus récentes — changement de plan admin</CardDescription>
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
                        <TableHead>Boutique</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>MRR</TableHead>
                        <TableHead>Fin période</TableHead>
                        <TableHead>Changer plan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            Aucune souscription — appliquez la migration phase 3
                          </TableCell>
                        </TableRow>
                      ) : (
                        subs.map(row => (
                          <TableRow key={row.id}>
                            <TableCell className="font-medium">{row.stores?.name ?? '—'}</TableCell>
                            <TableCell>{row.platform_vendor_plans?.name ?? '—'}</TableCell>
                            <TableCell>{statusBadge(row.status)}</TableCell>
                            <TableCell>{formatCurrency(Number(row.mrr_amount))}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {row.current_period_end
                                ? format(new Date(row.current_period_end), 'dd MMM yyyy', {
                                    locale: fr,
                                  })
                                : '—'}
                            </TableCell>
                            <TableCell>
                              <Select
                                defaultValue={
                                  plans.find(p => p.slug === row.platform_vendor_plans?.slug)?.id
                                }
                                onValueChange={v => updatePlan(row.id, v)}
                              >
                                <SelectTrigger className="w-[140px] h-8">
                                  <SelectValue placeholder="Plan" />
                                </SelectTrigger>
                                <SelectContent>
                                  {plans.map(p => (
                                    <SelectItem key={p.id} value={p.id}>
                                      {p.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
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
      </AdminPermissionGate>
    </AdminLayout>
  );
}
