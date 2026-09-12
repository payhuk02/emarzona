import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Eye, MousePointerClick, Percent, Megaphone } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useStoreSponsorships } from '@/hooks/useMarketplaceSponsorships';
import { useStoreContext } from '@/contexts/StoreContext';
import { fetchSponsorshipEventStats } from '@/lib/sponsorship/marketplace-sponsorship';

export default function SponsorshipAnalyticsPage() {
  const { selectedStore } = useStoreContext();
  const { data: sponsorships = [], isLoading: loadingCampaigns } = useStoreSponsorships();
  const sponsorshipIds = useMemo(() => sponsorships.map(s => s.id), [sponsorships]);

  const { data: eventRows = [], isLoading: loadingEvents } = useQuery({
    queryKey: ['marketplace-sponsorship-events', selectedStore?.id, sponsorshipIds],
    enabled: Boolean(selectedStore?.id) && sponsorshipIds.length > 0,
    queryFn: () => fetchSponsorshipEventStats(sponsorshipIds),
  });

  const bySponsorship = useMemo(() => {
    const map = new Map<string, { impressions: number; clicks: number; purchases: number }>();
    for (const id of sponsorshipIds) {
      map.set(id, { impressions: 0, clicks: 0, purchases: 0 });
    }
    for (const row of eventRows) {
      const bucket = map.get(row.sponsorship_id);
      if (!bucket) continue;
      if (row.event_type === 'impression') bucket.impressions += 1;
      else if (row.event_type === 'click') bucket.clicks += 1;
      else if (row.event_type === 'purchase') bucket.purchases += 1;
    }
    return map;
  }, [eventRows, sponsorshipIds]);

  const totals = useMemo(() => {
    let impressions = 0;
    let clicks = 0;
    let purchases = 0;
    for (const v of bySponsorship.values()) {
      impressions += v.impressions;
      clicks += v.clicks;
      purchases += v.purchases;
    }
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    return { impressions, clicks, purchases, ctr };
  }, [bySponsorship]);

  const isLoading = loadingCampaigns || loadingEvents;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-3">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Analytics Boost</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Impressions, clics et CTR de vos campagnes Boost Emarzona sur le marketplace.
            </p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/dashboard/sponsorships">
            <Megaphone className="mr-1.5 h-3.5 w-3.5" />
            Créer un boost
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              Impressions
            </CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {isLoading ? '…' : totals.impressions.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <MousePointerClick className="h-3.5 w-3.5" />
              Clics
            </CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {isLoading ? '…' : totals.clicks.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <Percent className="h-3.5 w-3.5" />
              CTR
            </CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {isLoading ? '…' : `${totals.ctr.toFixed(1)} %`}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Achats attribués</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {isLoading ? '…' : totals.purchases.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Performance par campagne</CardTitle>
          <CardDescription>
            <Link
              to="/dashboard/sponsorships/campaigns"
              className="text-primary underline-offset-2 hover:underline"
            >
              Voir toutes les campagnes
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : sponsorships.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune campagne —{' '}
              <Link
                to="/dashboard/sponsorships"
                className="text-primary underline-offset-2 hover:underline"
              >
                lancer un Boost Emarzona
              </Link>
              .
            </p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {sponsorships.map(s => {
                const stats = bySponsorship.get(s.id) ?? {
                  impressions: 0,
                  clicks: 0,
                  purchases: 0,
                };
                const ctr = stats.impressions > 0 ? (stats.clicks / stats.impressions) * 100 : 0;
                return (
                  <li
                    key={s.id}
                    className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{s.status}</Badge>
                        <span className="truncate text-sm">
                          Produit {s.product_id.slice(0, 8)}…
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {stats.impressions} imp. · {stats.clicks} clics · CTR {ctr.toFixed(1)} % ·{' '}
                        {stats.purchases} achats
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
