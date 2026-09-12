import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Megaphone, Sparkles, CreditCard, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchStoreProductsForSponsor } from '@/lib/sponsorship/marketplace-sponsorship';

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

function productOptionLabel(p: {
  name: string;
  is_active: boolean;
  is_featured: boolean | null;
  is_draft: boolean | null;
}): string {
  const tags: string[] = [];
  if (p.is_featured) tags.push('sponsorisé');
  if (p.is_draft) tags.push('brouillon');
  else if (!p.is_active) tags.push('inactif');
  return tags.length ? `${p.name} (${tags.join(', ')})` : p.name;
}

export default function SponsorshipsPage() {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const success = searchParams.get('success') === '1';
  const sponsorshipIdFromQuery = searchParams.get('sponsorship_id') ?? '';
  const productIdFromQuery = searchParams.get('productId') ?? '';
  const viewCampaigns = searchParams.get('view') === 'campaigns';
  const { selectedStore, loading: storeLoading } = useStoreContext();
  const storeId = selectedStore?.id;
  const { data: sponsorships = [], isLoading } = useStoreSponsorships();
  const { data: skus = [] } = useSponsorshipSkus();
  const { data: quota = 0 } = usePlanSponsorQuota();
  const createPlan = useCreatePlanSponsorship();
  const checkoutPaid = useCheckoutPaidSponsorship();
  const cancelMut = useCancelSponsorship();

  const [productId, setProductId] = useState(productIdFromQuery);
  const [skuSlug, setSkuSlug] = useState('boost_7d');

  const paidCampaign = useMemo(() => {
    if (!sponsorshipIdFromQuery) return null;
    return sponsorships.find(s => s.id === sponsorshipIdFromQuery) ?? null;
  }, [sponsorships, sponsorshipIdFromQuery]);

  const paymentActivationStatus = useMemo(() => {
    if (!success) return null;
    if (paidCampaign?.status === 'active') return 'active' as const;
    if (paidCampaign?.status === 'pending_payment') return 'pending' as const;
    if (paidCampaign) return 'other' as const;
    return 'pending' as const;
  }, [success, paidCampaign]);

  useEffect(() => {
    if (!success || !storeId) return;
    if (paidCampaign?.status === 'active') return;

    let ticks = 0;
    const id = window.setInterval(() => {
      ticks += 1;
      void queryClient.invalidateQueries({ queryKey: ['marketplace-sponsorships', storeId] });
      if (ticks >= 20) window.clearInterval(id);
    }, 2500);

    return () => window.clearInterval(id);
  }, [success, storeId, paidCampaign?.status, queryClient]);

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

  const {
    data: products = [],
    isLoading: productsLoading,
    isError: productsError,
    error: productsQueryError,
  } = useQuery({
    queryKey: ['store-products-for-sponsor', storeId],
    enabled: Boolean(storeId),
    queryFn: () => fetchStoreProductsForSponsor(storeId!),
  });

  const activeProducts = useMemo(
    () => products.filter(p => p.is_active && !p.is_draft),
    [products]
  );

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
  const productSelectValue = productId || undefined;
  const productPlaceholder = storeLoading
    ? 'Chargement de la boutique…'
    : !storeId
      ? 'Boutique non chargée'
      : productsLoading
        ? 'Chargement des produits…'
        : productsError
          ? 'Erreur de chargement'
          : products.length === 0
            ? 'Aucun produit dans cette boutique'
            : 'Choisir un produit';

  const productSelectDisabled =
    storeLoading || !storeId || productsLoading || products.length === 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-primary/10 p-3">
          <Megaphone className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Boost Emarzona</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Boostez vos produits dans le feed Marketplace et les Recommandations IA (badge
            Sponsorisé + priorité de classement). Semaine 500 FCFA · Mois 1000 FCFA.
          </p>
          <div className="mt-2 flex flex-wrap gap-3 text-sm">
            <Link
              to="/dashboard/sponsorships/analytics"
              className="text-primary underline-offset-2 hover:underline"
            >
              Analytics Boost
            </Link>
            <Link
              to="/dashboard/sponsorships/campaigns"
              className="text-primary underline-offset-2 hover:underline"
            >
              Campagnes
            </Link>
          </div>
        </div>
      </div>

      {success ? (
        <Card
          className={
            paymentActivationStatus === 'active'
              ? 'border-emerald-500/30 bg-emerald-500/5'
              : 'border-amber-500/30 bg-amber-500/5'
          }
        >
          <CardContent className="flex items-start gap-3 py-4 text-sm">
            {paymentActivationStatus === 'active' ? (
              <p className="text-emerald-800 dark:text-emerald-200">
                Paiement confirmé — votre campagne est active et le produit est sponsorisé sur le
                marketplace.
              </p>
            ) : (
              <p className="flex items-start gap-2 text-amber-900 dark:text-amber-100">
                <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" aria-hidden />
                <span>
                  Paiement en cours de confirmation… la campagne passera en actif dès validation du
                  paiement (quelques secondes).
                </span>
              </p>
            )}
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
              <Select
                value={productSelectValue}
                onValueChange={setProductId}
                disabled={productSelectDisabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder={productPlaceholder} />
                </SelectTrigger>
                <SelectContent position="popper" className="z-[1100]" mobileVariant="default">
                  {activeProducts.length > 0 ? (
                    activeProducts.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {productOptionLabel(p)}
                      </SelectItem>
                    ))
                  ) : products.length > 0 ? (
                    products.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {productOptionLabel(p)}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="__none__" disabled>
                      Aucun produit disponible
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {productsError ? (
                <p className="text-xs text-destructive">
                  Impossible de charger les produits
                  {productsQueryError instanceof Error ? ` : ${productsQueryError.message}` : '.'}
                </p>
              ) : null}
              {!productsLoading && !productsError && products.length === 0 && storeId ? (
                <p className="text-xs text-muted-foreground">
                  Créez un produit actif puis revenez ici.{' '}
                  <Link
                    to="/dashboard/products"
                    className="text-primary underline-offset-2 hover:underline"
                  >
                    Voir mes produits
                  </Link>
                </p>
              ) : null}
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
              <Select
                value={productSelectValue}
                onValueChange={setProductId}
                disabled={productSelectDisabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder={productPlaceholder} />
                </SelectTrigger>
                <SelectContent position="popper" className="z-[1100]" mobileVariant="default">
                  {(activeProducts.length > 0 ? activeProducts : products).map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {productOptionLabel(p)}
                    </SelectItem>
                  ))}
                  {products.length === 0 ? (
                    <SelectItem value="__none__" disabled>
                      Aucun produit disponible
                    </SelectItem>
                  ) : null}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Offre</Label>
              <Select value={selectedSku?.slug ?? skuSlug} onValueChange={setSkuSlug}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" className="z-[1100]" mobileVariant="default">
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
          <CardTitle className="text-base">Campagnes récentes</CardTitle>
          <CardDescription>
            <Link
              to="/dashboard/sponsorships/campaigns"
              className="text-primary underline-offset-2 hover:underline"
            >
              Voir toutes les campagnes
            </Link>
            {' · '}
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
              {sponsorships.slice(0, 5).map(s => (
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
