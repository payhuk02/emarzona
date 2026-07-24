/**
 * Funnel Analysis — parcours réel aligné sur analytics_events (view/click/conversion)
 * + commandes payées éligibles.
 */

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { TrendingDown, Users, MousePointerClick, CheckCircle, ShoppingCart } from 'lucide-react';
import type { TimeRange } from '@/hooks/useUnifiedAnalytics';
import { isOrderEligibleForRevenue } from '@/lib/orders/order-revenue-eligibility';

interface FunnelStep {
  name: string;
  count: number;
  percentage: number;
  dropoff: number;
  icon: React.ComponentType<{ className?: string }>;
}

function rangeStart(timeRange: TimeRange): Date {
  const now = Date.now();
  const map: Record<TimeRange, number> = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '1y': 365,
    all: 3650,
  };
  return new Date(now - map[timeRange] * 24 * 60 * 60 * 1000);
}

interface FunnelAnalysisProps {
  storeId: string;
  timeRange?: TimeRange;
}

export const FunnelAnalysis = ({ storeId, timeRange = '30d' }: FunnelAnalysisProps) => {
  const start = rangeStart(timeRange);

  const {
    data: funnelData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['funnel-analysis', storeId, timeRange],
    enabled: Boolean(storeId),
    queryFn: async () => {
      const [{ data: events, error: eventsError }, { data: orders, error: ordersError }] =
        await Promise.all([
          supabase
            .from('analytics_events')
            .select('event_type')
            .eq('store_id', storeId)
            .in('event_type', ['view', 'click', 'conversion'])
            .gte('created_at', start.toISOString()),
          supabase
            .from('orders')
            .select('status, payment_status')
            .eq('store_id', storeId)
            .gte('created_at', start.toISOString()),
        ]);

      if (eventsError) throw eventsError;
      if (ordersError) throw ordersError;

      const views = events?.filter(e => e.event_type === 'view').length ?? 0;
      const clicks = events?.filter(e => e.event_type === 'click').length ?? 0;
      const conversions = events?.filter(e => e.event_type === 'conversion').length ?? 0;
      const purchases =
        orders?.filter(o => isOrderEligibleForRevenue(o.status, o.payment_status)).length ?? 0;

      const steps: FunnelStep[] = [
        { name: 'Vues', count: views, percentage: 100, dropoff: 0, icon: Users },
        {
          name: 'Clics',
          count: clicks,
          percentage: 0,
          dropoff: 0,
          icon: MousePointerClick,
        },
        {
          name: 'Conversions tracking',
          count: conversions,
          percentage: 0,
          dropoff: 0,
          icon: CheckCircle,
        },
        {
          name: 'Achats payés',
          count: purchases,
          percentage: 0,
          dropoff: 0,
          icon: ShoppingCart,
        },
      ];

      const first = steps[0].count;
      steps.forEach((step, index) => {
        if (index === 0) return;
        step.percentage = first > 0 ? (step.count / first) * 100 : 0;
        const previous = steps[index - 1];
        step.dropoff =
          previous.count > 0 ? ((previous.count - step.count) / previous.count) * 100 : 0;
      });

      return steps;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analyse du Funnel</CardTitle>
          <CardDescription>Chargement...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analyse du Funnel</CardTitle>
          <CardDescription className="text-destructive">
            Impossible de charger le funnel
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analyse du Funnel</CardTitle>
        <CardDescription>
          Parcours boutique (vues → clics → conversions → achats payés)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {(funnelData ?? []).map(step => {
          const Icon = step.icon;
          return (
            <div key={step.name} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="font-medium truncate">{step.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 text-muted-foreground">
                  <span className="font-semibold text-foreground">{step.count}</span>
                  <span className="text-xs">{step.percentage.toFixed(0)}%</span>
                  {step.dropoff > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-xs text-rose-600">
                      <TrendingDown className="h-3 w-3" />
                      {step.dropoff.toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${Math.min(100, Math.max(0, step.percentage))}%` }}
                />
              </div>
            </div>
          );
        })}
        {(funnelData ?? []).every(s => s.count === 0) && (
          <p className="text-sm text-muted-foreground text-center pt-2">
            Aucun événement tracking sur cette période. Les vues produit alimentent ce funnel.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
