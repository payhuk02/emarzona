import { Link } from 'react-router-dom';
import { ListOrdered, Megaphone, XCircle, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCancelSponsorship, useStoreSponsorships } from '@/hooks/useMarketplaceSponsorships';

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

export default function SponsorshipCampaignsPage() {
  const { data: sponsorships = [], isLoading } = useStoreSponsorships();
  const cancelMut = useCancelSponsorship();

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-3">
            <ListOrdered className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Campagnes Boost</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Suivez et gérez vos campagnes actives, en attente ou expirées.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/dashboard/sponsorships/analytics">
              <BarChart3 className="mr-1.5 h-3.5 w-3.5" />
              Analytics
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/dashboard/sponsorships">
              <Megaphone className="mr-1.5 h-3.5 w-3.5" />
              Nouveau boost
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Toutes les campagnes</CardTitle>
          <CardDescription>
            Les produits sponsorisés actifs sont classés en priorité dans le feed Marketplace
            (jusqu’à 3 slots, 1 par boutique).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : sponsorships.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune campagne pour l’instant.{' '}
              <Link
                to="/dashboard/sponsorships"
                className="text-primary underline-offset-2 hover:underline"
              >
                Créer un Boost Emarzona
              </Link>
            </p>
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
