import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Megaphone, Sparkles, CreditCard, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useCancelSponsorship,
  useCheckoutPaidSponsorship,
  useCreatePlanSponsorship,
  usePlanSponsorQuota,
  useSponsorshipSkus,
  useStoreSponsorships,
} from '@/hooks/useMarketplaceSponsorships';
import { useStoreContext } from '@/contexts/StoreContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

function statusBadge(status: string) {
  const map: Record<string, string> = {
    active: 'bg-emerald-500/15 text-emerald-700',
    pending_payment: 'bg-amber-500/15 text-amber-700',
    expired: 'bg-muted text-muted-foreground',
    cancelled: 'bg-muted text-muted-foreground',
    rejected: 'bg-destructive/15 text-destructive',
  };
  return map[status] ?? 'bg-muted text-muted-foreground';
}

export default function SponsorshipsPage() {
  const [searchParams] = useSearchParams();
  const success = searchParams.get('success') === '1';
  const productIdFromQuery = searchParams.get('productId') ?? '';
  const viewCampaigns = searchParams.get('view') === 'campaigns';
  const { currentStore } = useStoreContext();
  const { data: sponsorships = [], isLoading } = useStoreSponsorships();
  const { data: skus = [] } = useSponsorshipSkus();
  const { data: quota = 0 } = usePlanSponsorQuota();
  const createPlan = useCreatePlanSponsorship();
  const checkoutPaid = useCheckoutPaidSponsorship();
  const cancelMut = useCancelSponsorship();

  const [productId, setProductId] = useState(productIdFromQuery);
  const [skuSlug, setSkuSlug] = useState('boost_7d');

  useEffect(() => {
    if (productIdFromQuery) {
      setProductId(productIdFromQuery);
    }
  }, [productIdFromQuery]);

  useEffect(() => {
    if (!viewCampaigns) return;
    const el = document.getElementById('sponsorship-campaigns');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [viewCampaigns]);

  const { data: products = [] } = useQuery({
    queryKey: ['store-products-for-sponsor', currentStore?.id],
    enabled: Boolean(currentStore?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, is_featured, sponsored_until')
        .eq('store_id', currentStore!.id)
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data ?? [];
    },
  });

  const activeEntitlementCount = useMemo(
    () =>
      sponsorships.filter(
        s =>
          s.source === 'plan_entitlement' &&
          s.status === 'active' &&
          s.ends_at &&
          new Date(s.ends_at) > new Date()
      ).length,
    [sponsorships]
  );

  const selectedSku = skus.find(s => s.slug === skuSlug) ?? skus[0];

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-primary/10 p-3">
          <Megaphone className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sponsorisation Marketplace</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Boostez vos produits dans le feed Marketplace et les Recommandations IA (badge
            Sponsorisé + priorité de classement). Semaine 500 FCFA · Mois 1000 FCFA.
          </p>
        </div>
      </div>

      {success ? (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="py-4 text-sm text-emerald-800 dark:text-emerald-200">
            Paiement reçu — votre campagne sera activée sous peu.
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4" />
              Quota plan
            </CardTitle>
            <CardDescription>
              Inclus dans Physical Professional+ : {activeEntitlementCount} / {quota} slots actifs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Produit</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un produit" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                      {p.is_featured ? ' (actif)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              disabled={!productId || quota < 1 || createPlan.isPending}
              onClick={() => createPlan.mutate(productId)}
              className="w-full"
            >
              Utiliser un slot plan (30 jours)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-4 w-4" />
              Boost payant
            </CardTitle>
            <CardDescription>
              Semaine 500 FCFA · Mois 1000 FCFA — toutes les verticales.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Produit</Label>
              <Input
                placeholder="Coller l’ID produit ou sélectionner à gauche"
                value={productId}
                onChange={e => setProductId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Offre</Label>
              <Select value={selectedSku?.slug ?? skuSlug} onValueChange={setSkuSlug}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {skus.map(sku => (
                    <SelectItem key={sku.id} value={sku.slug}>
                      {sku.name} — {(sku.price_cents / 100).toLocaleString()} {sku.currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              disabled={!productId || !selectedSku || checkoutPaid.isPending}
              onClick={() => selectedSku && checkoutPaid.mutate({ productId, sku: selectedSku })}
              className="w-full"
            >
              Payer et booster
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card id="sponsorship-campaigns">
        <CardHeader>
          <CardTitle className="text-base">Campagnes</CardTitle>
          <CardDescription>
            <Link
              to="/dashboard/products"
              className="text-primary underline-offset-2 hover:underline"
            >
              Gérer les produits
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : sponsorships.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune campagne pour l’instant.</p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {sponsorships.map(s => (
                <li
                  key={s.id}
                  className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={statusBadge(s.status)}>{s.status}</Badge>
                      <Badge variant="outline">{s.source}</Badge>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      Produit {s.product_id.slice(0, 8)}…
                      {s.starts_at && s.ends_at
                        ? ` · ${new Date(s.starts_at).toLocaleDateString()} → ${new Date(s.ends_at).toLocaleDateString()}`
                        : ''}
                    </p>
                  </div>
                  {(s.status === 'active' || s.status === 'pending_payment') && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={cancelMut.isPending}
                      onClick={() => cancelMut.mutate(s.id)}
                    >
                      <XCircle className="mr-1.5 h-3.5 w-3.5" />
                      Annuler
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
