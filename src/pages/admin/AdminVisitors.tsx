/**
 * Admin — Surveillance des visiteurs de la plateforme
 */

import { useMemo, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertCircle,
  Clock,
  Eye,
  Globe2,
  Laptop,
  MapPin,
  MonitorSmartphone,
  RefreshCw,
  Smartphone,
  Tablet,
  Users,
} from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useAdminPlatformVisitors } from '@/hooks/useAdminPlatformVisitors';
import { formatDurationMs } from '@/lib/admin/admin-platform-visitors';
import { cn } from '@/lib/utils';

const PERIOD_OPTIONS = [
  { value: '7', label: '7 jours' },
  { value: '14', label: '14 jours' },
  { value: '30', label: '30 jours' },
  { value: '90', label: '90 jours' },
] as const;

function deviceIcon(device: string) {
  switch (device) {
    case 'mobile':
      return <Smartphone className="h-3.5 w-3.5" />;
    case 'tablet':
      return <Tablet className="h-3.5 w-3.5" />;
    case 'desktop':
      return <Laptop className="h-3.5 w-3.5" />;
    default:
      return <MonitorSmartphone className="h-3.5 w-3.5" />;
  }
}

function formatDateTime(iso: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function BreakdownBars({
  rows,
  maxSessions,
}: {
  rows: { label: string; secondary?: string | null; sessions: number; pageViews?: number }[];
  maxSessions: number;
}) {
  if (!rows.length) {
    return <p className="text-sm text-muted-foreground">Aucune donnée pour cette période.</p>;
  }

  return (
    <ul className="space-y-3">
      {rows.map(row => {
        const pct = maxSessions > 0 ? (row.sessions / maxSessions) * 100 : 0;
        return (
          <li key={`${row.label}-${row.secondary ?? ''}`} className="space-y-1">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate font-medium">
                {row.label}
                {row.secondary ? (
                  <span className="text-muted-foreground font-normal"> · {row.secondary}</span>
                ) : null}
              </span>
              <span className="shrink-0 text-muted-foreground tabular-nums">
                {row.sessions.toLocaleString('fr-FR')} sess.
                {typeof row.pageViews === 'number'
                  ? ` · ${row.pageViews.toLocaleString('fr-FR')} vues`
                  : ''}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary/80 transition-[width]"
                style={{ width: `${Math.max(pct, pct > 0 ? 4 : 0)}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default function AdminVisitors() {
  const [period, setPeriod] = useState('30');
  const periodDays = Number(period) || 30;
  const { data, isLoading, error, refetch, isFetching } = useAdminPlatformVisitors(periodDays);

  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const chartsRef = useScrollAnimation<HTMLDivElement>();

  const maxCountrySessions = useMemo(
    () => Math.max(...(data?.byCountry.map(r => r.sessions) ?? [0]), 1),
    [data?.byCountry]
  );
  const maxDeviceSessions = useMemo(
    () => Math.max(...(data?.byDevice.map(r => r.sessions) ?? [0]), 1),
    [data?.byDevice]
  );
  const maxTrend = useMemo(
    () => Math.max(...(data?.dailyTrend.map(d => d.sessions) ?? [0]), 1),
    [data?.dailyTrend]
  );

  return (
    <AdminLayout>
      <div className="container mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
        <div
          ref={headerRef}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        >
          <div>
            <h1 className="text-lg sm:text-2xl md:text-3xl font-bold tracking-tight">
              Visiteurs plateforme
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Provenance, appareils, temps passé et pages consultées
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[140px]" aria-label="Période">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => void refetch()}
              disabled={isFetching}
              aria-label="Actualiser"
            >
              <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
            </Button>
          </div>
        </div>

        {error && (
          <Card className="border-destructive/50">
            <CardContent className="pt-6 flex items-start gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                Impossible de charger les visiteurs : {error.message}
                <p className="text-muted-foreground text-xs mt-1">
                  Vérifiez que la migration platform_visitor_analytics est appliquée en prod.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div
          ref={statsRef}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3"
          role="region"
          aria-label="Indicateurs visiteurs"
        >
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
          ) : (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs font-medium">Sessions</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold tabular-nums">
                    {(data?.uniqueSessions ?? 0).toLocaleString('fr-FR')}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs font-medium">Pages vues</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold tabular-nums">
                    {(data?.totalPageViews ?? 0).toLocaleString('fr-FR')}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs font-medium">Temps moyen</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold tabular-nums">
                    {formatDurationMs(data?.avgSessionDurationMs ?? 0)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs font-medium">Taux de rebond</CardTitle>
                  <Globe2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold tabular-nums">
                    {(data?.bounceRate ?? 0).toLocaleString('fr-FR', {
                      maximumFractionDigits: 1,
                    })}
                    %
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs font-medium">Utilisateurs connectés</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold tabular-nums">
                    {(data?.uniqueUsers ?? 0).toLocaleString('fr-FR')}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {!isLoading && (data?.uniqueSessions ?? 0) === 0 && !error && (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              Aucune visite enregistrée sur cette période. Le tracking démarre dès qu’un utilisateur
              navigue hors des pages admin. Actualisez après quelques minutes d’activité.
            </CardContent>
          </Card>
        )}

        <div ref={chartsRef} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Provenance (pays / région)
              </CardTitle>
              <CardDescription>Sessions regroupées par pays et région</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : (
                <BreakdownBars rows={data?.byCountry ?? []} maxSessions={maxCountrySessions} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MonitorSmartphone className="h-4 w-4" />
                Appareils
              </CardTitle>
              <CardDescription>Répartition mobile / tablette / desktop</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : (
                <BreakdownBars rows={data?.byDevice ?? []} maxSessions={maxDeviceSessions} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Navigateurs</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : (
                <BreakdownBars
                  rows={data?.byBrowser ?? []}
                  maxSessions={Math.max(...(data?.byBrowser.map(r => r.sessions) ?? [0]), 1)}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Systèmes d’exploitation</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : (
                <BreakdownBars
                  rows={data?.byOs ?? []}
                  maxSessions={Math.max(...(data?.byOs.map(r => r.sessions) ?? [0]), 1)}
                />
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tendance quotidienne</CardTitle>
            <CardDescription>Sessions par jour sur la période</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-28 w-full" />
            ) : !data?.dailyTrend.length ? (
              <p className="text-sm text-muted-foreground">Pas encore de tendance.</p>
            ) : (
              <div className="flex items-end gap-1 h-28">
                {data.dailyTrend.map(day => {
                  const h = Math.max(4, (day.sessions / maxTrend) * 100);
                  return (
                    <div
                      key={day.date}
                      className="flex-1 min-w-0 flex flex-col items-center gap-1"
                      title={`${day.date}: ${day.sessions} sessions, ${day.pageViews} vues`}
                    >
                      <div className="w-full rounded-t bg-primary/70" style={{ height: `${h}%` }} />
                      <span className="text-[9px] text-muted-foreground truncate w-full text-center">
                        {day.date.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pages les plus visitées</CardTitle>
            <CardDescription>Chemins les plus consultés</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : !data?.topPages.length ? (
              <p className="text-sm text-muted-foreground">Aucune page trackée.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Page</TableHead>
                    <TableHead className="text-right">Vues</TableHead>
                    <TableHead className="text-right">Sessions</TableHead>
                    <TableHead className="text-right">Durée moy.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topPages.map(page => (
                    <TableRow key={page.pagePath}>
                      <TableCell className="font-mono text-xs max-w-[280px] truncate">
                        {page.pagePath}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {page.views.toLocaleString('fr-FR')}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {page.sessions.toLocaleString('fr-FR')}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {page.avgDurationMs > 0 ? formatDurationMs(page.avgDurationMs) : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sessions récentes</CardTitle>
            <CardDescription>Dernières sessions détectées sur la plateforme</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : !data?.recentSessions.length ? (
              <p className="text-sm text-muted-foreground">Aucune session récente.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dernière activité</TableHead>
                    <TableHead>Provenance</TableHead>
                    <TableHead>Appareil</TableHead>
                    <TableHead>Pages</TableHead>
                    <TableHead>Durée</TableHead>
                    <TableHead>Parcours</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentSessions.map(session => (
                    <TableRow key={session.sessionId}>
                      <TableCell className="whitespace-nowrap text-xs">
                        {formatDateTime(session.lastSeenAt)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{session.country}</div>
                        {session.region ? (
                          <div className="text-xs text-muted-foreground">{session.region}</div>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm">
                          {deviceIcon(session.deviceType)}
                          <span className="capitalize">{session.deviceType}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {session.browser} · {session.os}
                        </div>
                      </TableCell>
                      <TableCell className="tabular-nums">{session.pageViews}</TableCell>
                      <TableCell className="tabular-nums whitespace-nowrap">
                        {formatDurationMs(session.durationMs)}
                      </TableCell>
                      <TableCell className="text-xs max-w-[220px]">
                        <div
                          className="truncate font-mono"
                          title={session.landingPage ?? undefined}
                        >
                          {session.landingPage ?? '—'}
                        </div>
                        {session.lastPage && session.lastPage !== session.landingPage ? (
                          <div
                            className="truncate text-muted-foreground font-mono"
                            title={session.lastPage}
                          >
                            → {session.lastPage}
                          </div>
                        ) : null}
                        {session.userId ? (
                          <Badge variant="secondary" className="mt-1 text-[10px]">
                            Connecté
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="mt-1 text-[10px]">
                            Anonyme
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
