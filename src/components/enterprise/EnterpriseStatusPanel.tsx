/**
 * Epic 5.3 — Widget SLA Enterprise (dashboard équipe)
 */
import { ExternalLink, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePlatformStatus } from '@/hooks/platform/usePlatformStatus';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export function EnterpriseStatusPanel() {
  const { data, isLoading } = usePlatformStatus(120_000);

  if (isLoading) {
    return <Skeleton className="h-40 w-full rounded-xl" />;
  }

  const overall = data?.overall ?? 'operational';
  const label =
    overall === 'operational'
      ? 'Opérationnel'
      : overall === 'degraded'
        ? 'Performance dégradée'
        : overall === 'maintenance'
          ? 'Maintenance planifiée'
          : 'Incident en cours';

  const variant =
    overall === 'operational' ? 'default' : overall === 'outage' ? 'destructive' : 'secondary';

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" aria-hidden />
          <CardTitle className="text-lg">SLA plateforme Enterprise</CardTitle>
        </div>
        <CardDescription>
          Disponibilité Emarzona pour vos intégrations SSO, API et webhooks
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant={variant}>{label}</Badge>
          <span className="text-sm text-muted-foreground">
            Uptime 30j : <strong>{Number(data?.uptime_30d ?? 99.9).toFixed(2)}%</strong>
          </span>
        </div>
        <ul className="text-sm space-y-1.5">
          {(data?.services ?? []).slice(0, 4).map(s => (
            <li key={s.service_key} className="flex justify-between gap-2">
              <span className="text-muted-foreground">{s.service_label}</span>
              <span className="font-medium capitalize">{s.status}</span>
            </li>
          ))}
        </ul>
        <Button variant="outline" size="sm" asChild>
          <Link to="/status" target="_blank" rel="noopener noreferrer">
            Page status publique
            <ExternalLink className="ml-2 h-3.5 w-3.5" aria-hidden />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
