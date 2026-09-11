import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Megaphone, Sparkles } from 'lucide-react';
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
};

type ProductSearchRow = {
  id: string;
  name: string;
  store_id: string;
  is_featured: boolean | null;
  stores: { name: string | null } | null;
};

export default function AdminSponsorships() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
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
      let q = supabase
        .from('marketplace_sponsorships')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
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
      toast({ title: 'Campagne annulée' });
    },
    onError: (e: Error) =>
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' }),
  });

  const expireNow = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('expire_marketplace_sponsorships');
      if (error) throw error;
      return data as number;
    },
    onSuccess: count => {
      void qc.invalidateQueries({ queryKey: ['admin-sponsorships'] });
      toast({ title: 'Expiration exécutée', description: `${count} campagne(s) expirée(s).` });
    },
  });

  const stats = useMemo(() => {
    const active = campaigns.filter(c => c.status === 'active').length;
    const pending = campaigns.filter(c => c.status === 'pending_payment').length;
    return { active, pending, total: campaigns.length };
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
              Sponsoriser un produit, gérer le catalogue SKU et les campagnes.
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => expireNow.mutate()} disabled={expireNow.isPending}>
          Forcer expiration
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Actives (échantillon)</CardDescription>
            <CardTitle>{stats.active}</CardTitle>
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
            </p>
          ) : null}
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Campagnes</CardTitle>
            <CardDescription>100 plus récentes</CardDescription>
          </div>
          <select
            className="rounded-md border bg-background px-2 py-1.5 text-sm"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">Tous</option>
            <option value="active">active</option>
            <option value="pending_payment">pending_payment</option>
            <option value="expired">expired</option>
            <option value="cancelled">cancelled</option>
          </select>
        </CardHeader>
        <CardContent>
          {campaignsLoading ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : campaigns.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune campagne.</p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {campaigns.map(c => (
                <li
                  key={c.id}
                  className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1 text-sm">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{c.status}</Badge>
                      <Badge variant="secondary">{c.source}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      store {c.store_id.slice(0, 8)}… · product {c.product_id.slice(0, 8)}…
                      {c.amount_paid_cents != null
                        ? ` · ${(c.amount_paid_cents / 100).toLocaleString()} ${c.currency ?? ''}`
                        : ''}
                    </p>
                  </div>
                  {(c.status === 'active' || c.status === 'pending_payment') && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={cancelMut.isPending}
                      onClick={() => cancelMut.mutate(c.id)}
                    >
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
