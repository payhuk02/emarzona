/**
 * Epic 5.3 — Page status publique (/status)
 */
import { Activity, CheckCircle2, AlertTriangle, XCircle, Wrench } from 'lucide-react';
import { usePlatformStatus, type PlatformServiceStatus } from '@/hooks/platform/usePlatformStatus';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { EmarzonaInText } from '@/components/brand/EmarzonaInText';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const STATUS_META: Record<
  PlatformServiceStatus,
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  operational: {
    label: 'Opérationnel',
    icon: CheckCircle2,
    className: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/30',
  },
  degraded: {
    label: 'Dégradé',
    icon: AlertTriangle,
    className: 'text-amber-600 bg-amber-500/10 border-amber-500/30',
  },
  outage: {
    label: 'Incident',
    icon: XCircle,
    className: 'text-red-600 bg-red-500/10 border-red-500/30',
  },
  maintenance: {
    label: 'Maintenance',
    icon: Wrench,
    className: 'text-blue-600 bg-blue-500/10 border-blue-500/30',
  },
};

function StatusBadge({ status }: { status: PlatformServiceStatus }) {
  const meta = STATUS_META[status] ?? STATUS_META.operational;
  const Icon = meta.icon;
  return (
    <Badge variant="outline" className={cn('gap-1.5 font-medium', meta.className)}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {meta.label}
    </Badge>
  );
}

export default function StatusPage() {
  const { data, isLoading, isError } = usePlatformStatus(120_000);
  const overall = data?.overall ?? 'operational';
  const overallMeta = STATUS_META[overall];
  const OverallIcon = overallMeta.icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
        <div className="mb-8 flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-3">
            <Activity className="h-6 w-6 text-primary" aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              <EmarzonaInText>Statut Emarzona</EmarzonaInText>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Disponibilité plateforme et incidents en cours
            </p>
          </div>
        </div>

        {isLoading ? (
          <Skeleton className="h-32 w-full rounded-xl" />
        ) : isError ? (
          <Card className="border-destructive/30">
            <CardContent className="py-8 text-center text-muted-foreground">
              Impossible de charger le statut. Réessayez plus tard.
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="mb-6 border-border/60 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium text-muted-foreground">
                  État global
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <OverallIcon
                    className={cn('h-8 w-8', overallMeta.className.split(' ')[0])}
                    aria-hidden
                  />
                  <div>
                    <p className="text-xl font-semibold">{overallMeta.label}</p>
                    <p className="text-xs text-muted-foreground">
                      SLA 30 jours : {Number(data?.uptime_30d ?? 99.9).toFixed(2)}%
                    </p>
                  </div>
                </div>
                <StatusBadge status={overall} />
              </CardContent>
            </Card>

            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Services
            </h2>
            <div className="space-y-2 mb-8">
              {(data?.services ?? []).length === 0 ? (
                <Card>
                  <CardContent className="py-6 text-sm text-muted-foreground text-center">
                    Aucune sonde enregistrée — le cron platform-health alimentera cette page.
                  </CardContent>
                </Card>
              ) : (
                data?.services.map(service => (
                  <Card key={service.service_key} className="border-border/50">
                    <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                      <div>
                        <p className="font-medium">{service.service_label}</p>
                        {service.latency_ms != null && (
                          <p className="text-xs text-muted-foreground">
                            Latence {service.latency_ms} ms
                          </p>
                        )}
                        {service.message && (
                          <p className="text-xs text-amber-600 mt-0.5">{service.message}</p>
                        )}
                      </div>
                      <StatusBadge status={service.status} />
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {(data?.incidents?.length ?? 0) > 0 && (
              <>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  Incidents actifs
                </h2>
                <div className="space-y-3">
                  {data?.incidents.map(incident => (
                    <Card key={incident.id} className="border-amber-500/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{incident.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm text-muted-foreground">
                        <p>
                          {incident.status} · {incident.severity}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Dernière mise à jour :{' '}
          {data?.generated_at ? new Date(data.generated_at).toLocaleString('fr-FR') : '—'}
        </p>
      </div>
    </div>
  );
}
