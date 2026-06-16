/**
 * CACHE_MONITORING_DASHBOARD — Santé cache multi-couches.
 */

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  getCacheMetricsSummary,
  getRecentCacheMetrics,
  resetCacheMetrics,
  type CacheMetricsSummary,
  type CacheMetricPoint,
} from '@/lib/redis/metrics';
import { supabase } from '@/integrations/supabase/client';
import { Activity, Database, Globe, HardDrive, RefreshCw, Server, Zap } from 'lucide-react';

interface EdgeHealth {
  status: string;
  layers?: {
    redis?: { status: string; latencyMs?: number | null };
    cdn?: { status: string; provider?: string };
  };
  invalidationSecretConfigured?: boolean;
  buildId?: string;
}

export function CacheMonitoringDashboard() {
  const [summary, setSummary] = useState<CacheMetricsSummary>(getCacheMetricsSummary());
  const [recent, setRecent] = useState<CacheMetricPoint[]>(getRecentCacheMetrics(30));
  const [edgeHealth, setEdgeHealth] = useState<EdgeHealth | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setSummary(getCacheMetricsSummary());
    setRecent(getRecentCacheMetrics(30));

    try {
      const res = await fetch('/api/cache/health');
      if (res.ok) setEdgeHealth(await res.json());
    } catch {
      setEdgeHealth({ status: 'unreachable' });
    }
  }, []);

  useEffect(() => {
    refresh();
    if (!autoRefresh) return;
    const interval = setInterval(refresh, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, refresh]);

  const handleWarmCache = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('cache-warm', { body: {} });
      if (error) throw error;
      await refresh();
    } finally {
      setLoading(false);
    }
  };

  const hitRatePercent = Math.round(summary.hitRate * 100);

  const layerStatus = (status?: string) => {
    if (status === 'healthy' || status === 'ok' || status === 'edge') return 'default';
    if (status === 'degraded' || status === 'unconfigured') return 'secondary';
    return 'destructive';
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Cache Health</h2>
          <p className="text-sm text-muted-foreground">
            Hit rate, Redis, CDN edge, invalidations — temps réel
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setAutoRefresh(!autoRefresh)}>
            {autoRefresh ? 'Auto ON' : 'Auto OFF'}
          </Button>
          <Button variant="outline" size="sm" onClick={refresh}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Rafraîchir
          </Button>
          <Button variant="outline" size="sm" onClick={() => resetCacheMetrics()}>
            Reset métriques
          </Button>
          <Button size="sm" onClick={handleWarmCache} disabled={loading}>
            <Zap className="h-4 w-4 mr-1" />
            Warm cache
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Hit Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hitRatePercent}%</div>
            <Progress value={hitRatePercent} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {summary.hits} hits / {summary.misses} misses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4" />
              Redis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={layerStatus(edgeHealth?.layers?.redis?.status)}>
              {edgeHealth?.layers?.redis?.status ?? 'unknown'}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              Latence: {edgeHealth?.layers?.redis?.latencyMs ?? '—'}ms
            </p>
            <p className="text-xs text-muted-foreground">
              Fallback local: {summary.fallbackCount} ops
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Globe className="h-4 w-4" />
              CDN / Edge
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={layerStatus(edgeHealth?.layers?.cdn?.status)}>
              {edgeHealth?.layers?.cdn?.provider ?? 'Cloudflare + Vercel'}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              Build: {edgeHealth?.buildId ?? '—'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Server className="h-4 w-4" />
              Latence moy.
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.avgLatencyMs.toFixed(1)}ms</div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.operations} opérations trackées
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              Couches de cache
            </CardTitle>
            <CardDescription>Browser → CDN → Edge → Redis → Supabase</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                name: 'Browser (localStorage/IDB)',
                status: 'actif',
                desc: 'SWR 90s soft / 10min hard',
              },
              { name: 'Service Worker', status: 'actif', desc: 'Images SWR, assets immutable' },
              { name: 'React Query', status: 'actif', desc: 'staleTime 5min, gcTime 10min' },
              {
                name: 'Vercel Edge Middleware',
                status: edgeHealth?.status ?? '—',
                desc: 'SEO bots + CSP',
              },
              {
                name: 'Upstash Redis',
                status: edgeHealth?.layers?.redis?.status ?? '—',
                desc: 'SEO meta, rate limit',
              },
              {
                name: 'Cloudflare CDN',
                status: 'config dashboard',
                desc: 'Cache Reserve, Brotli, HTTP/3',
              },
            ].map(layer => (
              <div key={layer.name} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">{layer.name}</span>
                  <p className="text-xs text-muted-foreground">{layer.desc}</p>
                </div>
                <Badge variant="outline">{layer.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Opérations récentes</CardTitle>
            <CardDescription>Top invalidations et accès cache</CardDescription>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune métrique client encore.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {recent
                  .slice()
                  .reverse()
                  .map((m, i) => (
                    <div
                      key={`${m.timestamp}-${i}`}
                      className="flex items-center justify-between text-xs border-b pb-1"
                    >
                      <span className="font-mono">
                        {m.operation} · {m.layer}
                      </span>
                      <span className="text-muted-foreground">
                        {m.durationMs != null ? `${m.durationMs}ms` : '—'}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default CacheMonitoringDashboard;
