/**
 * Composant d'analytics pour les recommandations IA
 * Affiche les métriques de performance des recommandations
 */

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Target, Eye, MousePointer, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

interface RecommendationAnalyticsProps {
  userId?: string;
  storeId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  className?: string;
}

export const RecommendationAnalytics: React.FC<RecommendationAnalyticsProps> = ({
  userId,
  storeId,
  dateRange,
  className
}) => {
  // Récupérer les statistiques de recommandations
  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['recommendation-analytics', userId, storeId, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('recommendation_analytics')
        .select(`
          *,
          recommended_product:products!recommendation_analytics_recommended_product_id_fkey(
            id, name, category, store_id
          )
        `);

      // Filtres
      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (storeId) {
        query = query.eq('recommended_product.store_id', storeId);
      }

      if (dateRange) {
        query = query
          .gte('date', dateRange.start.toISOString().split('T')[0])
          .lte('date', dateRange.end.toISOString().split('T')[0]);
      }

      const { data, error } = await query.limit(1000);

      if (error) {
        logger.error('Error fetching recommendation analytics', { error });
        throw error;
      }

      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Calculer les métriques
  const metrics = useMemo(() => {
    if (!analytics) return null;

    const totalClicks = analytics.filter(a => a.clicked).length;
    const totalPurchases = analytics.filter(a => a.purchased).length;
    const totalViews = analytics.length;

    const clickRate = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;
    const purchaseRate = totalClicks > 0 ? (totalPurchases / totalClicks) * 100 : 0;
    const conversionRate = totalViews > 0 ? (totalPurchases / totalViews) * 100 : 0;

    // Statistiques par raison
    const reasonStats = analytics.reduce((acc, item) => {
      if (!acc[item.reason]) {
        acc[item.reason] = {
          views: 0,
          clicks: 0,
          purchases: 0,
          clickRate: 0,
          purchaseRate: 0,
          conversionRate: 0
        };
      }

      acc[item.reason].views++;
      if (item.clicked) acc[item.reason].clicks++;
      if (item.purchased) acc[item.reason].purchases++;

      return acc;
    }, {} as Record<string, { views: number; clicks: number; purchases: number; clickRate: number; purchaseRate: number; conversionRate: number }>);

    // Calculer les taux pour chaque raison
    Object.keys(reasonStats).forEach(reason => {
      const stats = reasonStats[reason];
      stats.clickRate = (stats.clicks / stats.views) * 100;
      stats.purchaseRate = stats.clicks > 0 ? (stats.purchases / stats.clicks) * 100 : 0;
      stats.conversionRate = (stats.purchases / stats.views) * 100;
    });

    return {
      totalViews,
      totalClicks,
      totalPurchases,
      clickRate,
      purchaseRate,
      conversionRate,
      reasonStats
    };
  }, [analytics]);

  if (isLoading) {
    return (
      <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            Erreur lors du chargement des analytics de recommandations
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatRate = (rate: number) => `${rate.toFixed(1)}%`;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Métriques principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Vues</p>
                <p className="text-2xl font-bold">{metrics.totalViews}</p>
              </div>
              <Eye className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taux de clic</p>
                <p className="text-2xl font-bold">{formatRate(metrics.clickRate)}</p>
              </div>
              <MousePointer className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taux d'achat</p>
                <p className="text-2xl font-bold">{formatRate(metrics.purchaseRate)}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conversion</p>
                <p className="text-2xl font-bold">{formatRate(metrics.conversionRate)}</p>
              </div>
              <Target className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistiques par type de recommandation */}
      <Card>
        <CardHeader>
          <CardTitle>Performance par type de recommandation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(metrics.reasonStats).map(([reason, stats]: [string, { views: number; clicks: number; purchases: number; clickRate: number; purchaseRate: number; conversionRate: number }]) => (
              <div key={reason} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="capitalize">
                      {reason}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {stats.views} vues
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Clics: </span>
                      <span className="font-medium">{stats.clicks}</span>
                      <span className="text-muted-foreground ml-1">
                        ({formatRate(stats.clickRate)})
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Achats: </span>
                      <span className="font-medium">{stats.purchases}</span>
                      <span className="text-muted-foreground ml-1">
                        ({formatRate(stats.purchaseRate)})
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Conversion: </span>
                      <span className="font-medium">{formatRate(stats.conversionRate)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {stats.conversionRate > metrics.conversionRate ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : stats.conversionRate < metrics.conversionRate ? (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};