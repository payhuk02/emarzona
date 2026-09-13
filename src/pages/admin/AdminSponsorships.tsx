import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, formatDistanceToNow, isBefore, addHours } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Clock,
  ExternalLink,
  Megaphone,
  Search,
  Sparkles,
  Store,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  adminGrantSponsorship,
  adminPauseSponsorship,
  adminResumeSponsorship,
  cancelSponsorship,
} from '@/lib/sponsorship/marketplace-sponsorship';

type SkuRow = {
  id: string;
  slug: string;
  name: string;
  duration_days: number;
  price_cents: number;
  currency: string;
  is_active: boolean;
  sort_order: number;
};

type CampaignProduct = {
  id: string;
  name: string | null;
  slug: string | null;
  image_url: string | null;
  is_active: boolean | null;
} | null;

type CampaignStore = {
  id: string;
  name: string | null;
  slug: string | null;
} | null;

type SponsorshipRow = {
  id: string;
  store_id: string;
  product_id: string;
  source: string;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  amount_paid_cents: number | null;
  currency: string | null;
  created_at: string;
  products: CampaignProduct;
  stores: CampaignStore;
};

type ProductSearchRow = {
  id: string;
  name: string;
  store_id: string;
  is_featured: boolean | null;
  stores: { name: string | null } | null;
};

type StatusFilter = 'all' | 'active' | 'paused' | 'pending_payment' | 'expired' | 'cancelled';
type SortMode = 'newest' | 'ending_soon' | 'store';

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'active':
      return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700';
    case 'paused':
      return 'border-slate-400/40 bg-slate-500/10 text-slate-700';
    case 'pending_payment':
      return 'border-amber-500/40 bg-amber-500/10 text-amber-800';
    case 'expired':
    case 'cancelled':
      return 'border-muted bg-muted text-muted-foreground';
    default:
      return '';
  }
}

function sourceLabel(source: string): string {
  switch (source) {
    case 'admin_grant':
      return 'Admin';
    case 'paid_boost':
      return 'Boost payant';
    case 'plan_entitlement':
      return 'Slot plan';
    default:
      return source;
  }
}

function formatMoney(cents: number | null, currency: string | null): string | null {
  if (cents == null) return null;
  return `${(cents / 100).toLocaleString('fr-FR')} ${currency ?? ''}`.trim();
}

function expiryInfo(endsAt: string | null, status: string) {
  if (!endsAt) {
    return { label: 'Sans échéance', tone: 'muted' as const, endingSoon: false, ended: false };
  }
  const end = new Date(endsAt);
  const now = new Date();
  const ended = isBefore(end, now);
  const endingSoon = !ended && isBefore(end, addHours(now, 48));

  if (status === 'active' || status === 'paused') {
    if (ended) {
      return {
        label: `Expiré le ${format(end, 'dd MMM yyyy HH:mm', { locale: fr })}`,
        tone: 'danger' as const,
        endingSoon: false,
        ended: true,
      };
    }
    return {
      label: `Expire ${formatDistanceToNow(end, { addSuffix: true, locale: fr })} · ${format(end, 'dd MMM yyyy HH:mm', { locale: fr })}`,
      tone: endingSoon ? ('warn' as const) : ('ok' as const),
      endingSoon,
      ended: false,
    };
  }

  return {
    label: `Fin prévue ${format(end, 'dd MMM yyyy HH:mm', { locale: fr })}`,
    tone: 'muted' as const,
    endingSoon: false,
    ended,
  };
}

function productHref(c: SponsorshipRow): string | null {
  const storeSlug = c.stores?.slug;
  const productSlug = c.products?.slug;
  if (storeSlug && productSlug) {
    return `/stores/${encodeURIComponent(storeSlug)}/products/${encodeURIComponent(productSlug)}`;
  }
  return null;
}

export default function AdminSponsorships() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [campaignSearch, setCampaignSearch] = useState('');
  const [endingSoonOnly, setEndingSoonOnly] = useState(false);
  const [productQuery, setProductQuery] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [skuSlug, setSkuSlug] = useState('boost_7d');

  const { data: skus = [], isLoading: skusLoading } = useQuery({
    queryKey: ['admin-sponsorship-skus'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplace_sponsorship_products')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return (data ?? []) as SkuRow[];
    },
  });

  const activeSkus = useMemo(() => skus.filter(s => s.is_active), [skus]);
  const selectedSku = activeSkus.find(s => s.slug === skuSlug) ?? activeSkus[0];

  const { data: productMatches = [], isFetching: searchingProducts } = useQuery({
    queryKey: ['admin-sponsor-product-search', productQuery],
    enabled: productQuery.trim().length >= 2,
    queryFn: async () => {
      const q = productQuery.trim();
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(q);

      let request = supabase
        .from('products')
        .select('id, name, store_id, is_featured, stores:store_id(name)')
        .eq('is_active', true)
        .limit(15);

      request = isUuid ? request.eq('id', q) : request.ilike('name', `%${q}%`);

      const { data, error } = await request;
      if (error) throw error;
      return (data ?? []) as ProductSearchRow[];
    },
  });

  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ['admin-sponsorships', statusFilter],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let q = (supabase as any)
        .from('marketplace_sponsorships')
        .select(
          `
          id, store_id, product_id, source, status, starts_at, ends_at,
          amount_paid_cents, currency, created_at,
          products:product_id(id, name, slug, image_url, is_active),
          stores:store_id(id, name, slug)
        `
        )
        .order('created_at', { ascending: false })
        .limit(200);
      if (statusFilter !== 'all') q = q.eq('status', statusFilter);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as SponsorshipRow[];
    },
  });

  const updateSku = useMutation({
    mutationFn: async (sku: Partial<SkuRow> & { id: string }) => {
      const { error } = await supabase
        .from('marketplace_sponsorship_products')
        .update({
          name: sku.name,
          price_cents: sku.price_cents,
          duration_days: sku.duration_days,
          is_active: sku.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sku.id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-sponsorship-skus'] });
      toast({ title: 'SKU mis à jour' });
    },
    onError: (e: Error) =>
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' }),
  });

  const grantMut = useMutation({
    mutationFn: async () => {
      if (!selectedProductId) throw new Error('Sélectionnez un produit');
      if (!selectedSku) throw new Error('Sélectionnez une offre');
      return adminGrantSponsorship(selectedProductId, selectedSku.slug);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-sponsorships'] });
      void qc.invalidateQueries({ queryKey: ['landing-sponsored-products'] });
      toast({
        title: 'Produit sponsorisé',
        description: 'Campagne admin activée immédiatement (sans paiement).',
      });
      setSelectedProductId('');
      setProductQuery('');
    },
    onError: (e: Error) =>
      toast({ title: 'Impossible de sponsoriser', description: e.message, variant: 'destructive' }),
  });

  const cancelMut = useMutation({
    mutationFn: (id: string) => cancelSponsorship(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-sponsorships'] });
      void qc.invalidateQueries({ queryKey: ['landing-sponsored-products'] });
      toast({ title: 'Campagne annulée', description: 'Elle n’apparaît plus en sponsorisé.' });
    },
    onError: (e: Error) =>
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' }),
  });

  const pauseMut = useMutation({
    mutationFn: (id: string) => adminPauseSponsorship(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-sponsorships'] });
      void qc.invalidateQueries({ queryKey: ['landing-sponsored-products'] });
      toast({
        title: 'Campagne désactivée',
        description: 'Produit retiré de l’affichage sponsorisé (réversible).',
      });
    },
    onError: (e: Error) =>
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' }),
  });

  const resumeMut = useMutation({
    mutationFn: (id: string) => adminResumeSponsorship(id),
    onSuccess: row => {
      void qc.invalidateQueries({ queryKey: ['admin-sponsorships'] });
      void qc.invalidateQueries({ queryKey: ['landing-sponsored-products'] });
      if (row.status === 'expired') {
        toast({
          title: 'Fenêtre expirée',
          description: 'La campagne a été marquée expirée (ends_at dépassé).',
        });
        return;
      }
      toast({ title: 'Campagne réactivée' });
    },
    onError: (e: Error) =>
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' }),
  });

  const expireNow = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('admin_expire_marketplace_sponsorships');
      if (error) throw error;
      return data as number;
    },
    onSuccess: count => {
      void qc.invalidateQueries({ queryKey: ['admin-sponsorships'] });
      void qc.invalidateQueries({ queryKey: ['landing-sponsored-products'] });
      toast({ title: 'Expiration exécutée', description: `${count} campagne(s) expirée(s).` });
    },
    onError: (e: Error) =>
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' }),
  });

  const enriched = useMemo(() => {
    const q = campaignSearch.trim().toLowerCase();
    let rows = campaigns.map(c => ({
      ...c,
      expiry: expiryInfo(c.ends_at, c.status),
      href: productHref(c),
      productName: c.products?.name?.trim() || `Produit ${c.product_id.slice(0, 8)}…`,
      storeName: c.stores?.name?.trim() || `Boutique ${c.store_id.slice(0, 8)}…`,
    }));

    if (q) {
      rows = rows.filter(
        r =>
          r.productName.toLowerCase().includes(q) ||
          r.storeName.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q) ||
          r.product_id.toLowerCase().includes(q) ||
          r.store_id.toLowerCase().includes(q)
      );
    }

    if (endingSoonOnly) {
      rows = rows.filter(
        r => r.expiry.endingSoon && (r.status === 'active' || r.status === 'paused')
      );
    }

    rows = [...rows].sort((a, b) => {
      if (sortMode === 'ending_soon') {
        const ae = a.ends_at ? new Date(a.ends_at).getTime() : Number.POSITIVE_INFINITY;
        const be = b.ends_at ? new Date(b.ends_at).getTime() : Number.POSITIVE_INFINITY;
        return ae - be;
      }
      if (sortMode === 'store') {
        return a.storeName.localeCompare(b.storeName, 'fr');
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return rows;
  }, [campaigns, campaignSearch, endingSoonOnly, sortMode]);

  const stats = useMemo(() => {
    const active = campaigns.filter(c => c.status === 'active').length;
    const pending = campaigns.filter(c => c.status === 'pending_payment').length;
    const paused = campaigns.filter(c => c.status === 'paused').length;
    const endingSoon = campaigns.filter(c => {
      if (c.status !== 'active' && c.status !== 'paused') return false;
      return expiryInfo(c.ends_at, c.status).endingSoon;
    }).length;
    return { active, pending, paused, endingSoon, total: campaigns.length };
  }, [campaigns]);

  const selectedProduct =
    productMatches.find(p => p.id === selectedProductId) ??
    (selectedProductId
      ? ({
          id: selectedProductId,
          name: selectedProductId,
          store_id: '',
          is_featured: null,
          stores: null,
        } as ProductSearchRow)
      : null);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-3">
            <Megaphone className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Sponsorisations Marketplace</h1>
            <p className="text-sm text-muted-foreground">
              Produits sponsorisés, boutiques, échéances et catalogue SKU.
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => expireNow.mutate()} disabled={expireNow.isPending}>
          Forcer expiration
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Actives</CardDescription>
            <CardTitle>{stats.active}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Expirent &lt; 48 h</CardDescription>
            <CardTitle className={stats.endingSoon > 0 ? 'text-amber-600' : undefined}>
              {stats.endingSoon}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Désactivées</CardDescription>
            <CardTitle>{stats.paused}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>En attente paiement</CardDescription>
            <CardTitle>{stats.pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total chargé</CardDescription>
            <CardTitle>{stats.total}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4" />
            Sponsoriser un produit
          </CardTitle>
          <CardDescription>
            Attribution admin immédiate (sans paiement). 7 jours ou 30 jours selon l’offre.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-sponsor-product">Produit (nom ou ID)</Label>
            <Input
              id="admin-sponsor-product"
              placeholder="Rechercher un produit…"
              value={productQuery}
              onChange={e => {
                setProductQuery(e.target.value);
                setSelectedProductId('');
              }}
            />
            {searchingProducts ? (
              <p className="text-xs text-muted-foreground">Recherche…</p>
            ) : productQuery.trim().length >= 2 && productMatches.length === 0 ? (
              <p className="text-xs text-muted-foreground">Aucun produit trouvé.</p>
            ) : null}
            {productMatches.length > 0 ? (
              <ul className="max-h-48 divide-y overflow-y-auto rounded-lg border">
                {productMatches.map(p => (
                  <li key={p.id}>
                    <button
                      type="button"
                      className={`flex w-full flex-col gap-0.5 px-3 py-2 text-left text-sm hover:bg-accent/60 ${
                        selectedProductId === p.id ? 'bg-primary/5 text-primary' : ''
                      }`}
                      onClick={() => {
                        setSelectedProductId(p.id);
                        setProductQuery(p.name);
                      }}
                    >
                      <span className="font-medium">
                        {p.name}
                        {p.is_featured ? ' · déjà sponsorisé' : ''}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {p.stores?.name ?? 'Boutique'} · {p.id.slice(0, 8)}…
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="space-y-2">
              <Label>Offre</Label>
              <Select
                value={selectedSku?.slug ?? skuSlug}
                onValueChange={setSkuSlug}
                disabled={activeSkus.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une offre" />
                </SelectTrigger>
                <SelectContent>
                  {activeSkus.map(sku => (
                    <SelectItem key={sku.id} value={sku.slug}>
                      {sku.name} — {(sku.price_cents / 100).toLocaleString()} {sku.currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              disabled={!selectedProductId || !selectedSku || grantMut.isPending}
              onClick={() => grantMut.mutate()}
            >
              {grantMut.isPending ? 'Activation…' : 'Sponsoriser maintenant'}
            </Button>
          </div>

          {selectedProduct ? (
            <p className="text-xs text-muted-foreground">
              Produit sélectionné :{' '}
              <span className="font-medium text-foreground">{selectedProduct.name}</span>
              {selectedProduct.stores?.name ? (
                <>
                  {' '}
                  · boutique{' '}
                  <span className="font-medium text-foreground">{selectedProduct.stores.name}</span>
                </>
              ) : null}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-base">Campagnes & produits sponsorisés</CardTitle>
              <CardDescription>
                Jusqu’à 200 campagnes — produit, boutique, échéance et actions.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                className="rounded-md border bg-background px-2 py-1.5 text-sm"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as StatusFilter)}
              >
                <option value="all">Tous statuts</option>
                <option value="active">active</option>
                <option value="paused">paused</option>
                <option value="pending_payment">pending_payment</option>
                <option value="expired">expired</option>
                <option value="cancelled">cancelled</option>
              </select>
              <select
                className="rounded-md border bg-background px-2 py-1.5 text-sm"
                value={sortMode}
                onChange={e => setSortMode(e.target.value as SortMode)}
              >
                <option value="newest">Plus récentes</option>
                <option value="ending_soon">Expire bientôt</option>
                <option value="store">Par boutique</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Filtrer par produit, boutique ou ID…"
                value={campaignSearch}
                onChange={e => setCampaignSearch(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Switch checked={endingSoonOnly} onCheckedChange={setEndingSoonOnly} />
              Expirent &lt; 48 h
            </label>
          </div>
        </CardHeader>
        <CardContent>
          {campaignsLoading ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : enriched.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune campagne pour ces filtres.</p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {enriched.map(c => (
                <li
                  key={c.id}
                  className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="flex min-w-0 flex-1 gap-3">
                    {c.products?.image_url ? (
                      <img
                        src={c.products.image_url}
                        alt=""
                        className="h-14 w-14 shrink-0 rounded-md border object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border bg-muted text-xs text-muted-foreground">
                        N/A
                      </div>
                    )}
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium leading-tight">{c.productName}</p>
                        {c.href ? (
                          <Link
                            to={c.href}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            Voir <ExternalLink className="h-3 w-3" />
                          </Link>
                        ) : null}
                      </div>
                      <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        <Store className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        <span className="font-medium text-foreground">{c.storeName}</span>
                        {c.stores?.slug ? (
                          <span className="text-muted-foreground">· /{c.stores.slug}</span>
                        ) : null}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant="outline" className={statusBadgeClass(c.status)}>
                          {c.status}
                        </Badge>
                        <Badge variant="secondary">{sourceLabel(c.source)}</Badge>
                        {c.expiry.endingSoon ? (
                          <Badge className="bg-amber-500 text-white hover:bg-amber-500">
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            Expire bientôt
                          </Badge>
                        ) : null}
                        {c.products?.is_active === false ? (
                          <Badge variant="destructive">Produit inactif</Badge>
                        ) : null}
                      </div>
                      <p
                        className={`flex flex-wrap items-center gap-1.5 text-xs ${
                          c.expiry.tone === 'warn'
                            ? 'text-amber-700 dark:text-amber-300'
                            : c.expiry.tone === 'danger'
                              ? 'text-destructive'
                              : 'text-muted-foreground'
                        }`}
                      >
                        <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        {c.expiry.label}
                        {c.starts_at ? (
                          <span className="text-muted-foreground">
                            · début {format(new Date(c.starts_at), 'dd MMM yyyy', { locale: fr })}
                          </span>
                        ) : null}
                        {formatMoney(c.amount_paid_cents, c.currency) ? (
                          <span>· {formatMoney(c.amount_paid_cents, c.currency)}</span>
                        ) : null}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    {c.status === 'active' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={pauseMut.isPending}
                        onClick={() => pauseMut.mutate(c.id)}
                      >
                        Désactiver
                      </Button>
                    )}
                    {c.status === 'paused' && (
                      <Button
                        size="sm"
                        variant="default"
                        disabled={resumeMut.isPending}
                        onClick={() => resumeMut.mutate(c.id)}
                      >
                        Réactiver
                      </Button>
                    )}
                    {(c.status === 'active' ||
                      c.status === 'pending_payment' ||
                      c.status === 'paused') && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={cancelMut.isPending}
                        onClick={() => cancelMut.mutate(c.id)}
                      >
                        Annuler
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Catalogue SKU</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {skusLoading ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : (
            skus.map(sku => (
              <div
                key={sku.id}
                className="grid gap-3 rounded-lg border p-3 md:grid-cols-[1fr_100px_100px_80px_auto] md:items-end"
              >
                <div className="space-y-1">
                  <Label>Nom ({sku.slug})</Label>
                  <Input
                    defaultValue={sku.name}
                    onBlur={e => {
                      if (e.target.value !== sku.name) {
                        updateSku.mutate({ id: sku.id, name: e.target.value });
                      }
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Jours</Label>
                  <Input
                    type="number"
                    defaultValue={sku.duration_days}
                    onBlur={e => {
                      const v = Number(e.target.value);
                      if (v && v !== sku.duration_days) {
                        updateSku.mutate({ id: sku.id, duration_days: v });
                      }
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Prix (centimes)</Label>
                  <Input
                    type="number"
                    defaultValue={sku.price_cents}
                    onBlur={e => {
                      const v = Number(e.target.value);
                      if (!Number.isNaN(v) && v !== sku.price_cents) {
                        updateSku.mutate({ id: sku.id, price_cents: v });
                      }
                    }}
                  />
                </div>
                <div className="flex items-center gap-2 pb-2">
                  <Switch
                    checked={sku.is_active}
                    onCheckedChange={checked =>
                      updateSku.mutate({ id: sku.id, is_active: checked })
                    }
                  />
                  <span className="text-xs text-muted-foreground">Actif</span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
