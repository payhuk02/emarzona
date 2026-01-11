/**
 * Dashboard d'analytics prédictif pour les vendeurs
 * Affiche les prévisions de ventes, tendances et recommandations
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Package,
  Users,
  DollarSign,
  Target,
  BarChart3,
  Calendar,
  Zap,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import {
  useSalesPredictions,
  useStockPredictions,
  useCategoryTrends,
  SalesPrediction,
  StockPrediction,
  TrendAnalysis
} from '@/lib/analytics/predictive-analytics';
import { useStoreContext } from '@/contexts/StoreContext';
import { logger } from '@/lib/logger';

interface PredictiveDashboardProps {
  className?: string;
}

export const PredictiveDashboard: React.FC<PredictiveDashboardProps> = ({ className }) => {
  const { store } = useStoreContext();
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d'>('30d');

  // Récupérer les produits du store
  const [products, setProducts] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  React.useEffect(() => {
    const fetchStoreData = async () => {
      if (!store?.id) return;

      try {
        const { data: storeProducts } = await supabase
          .from('products')
          .select('id, category')
          .eq('store_id', store.id)
          .eq('is_active', true)
          .limit(50);

        if (storeProducts) {
          const productIds = storeProducts.map(p => p.id);
          const uniqueCategories = [...new Set(storeProducts.map(p => p.category).filter(Boolean))];

          setProducts(productIds);
          setCategories(uniqueCategories);
        }
      } catch (error) {
        logger.error('Error fetching store data for predictions', { error, storeId: store.id });
      }
    };

    fetchStoreData();
  }, [store?.id]);

  // Récupérer les prédictions
  const { data: salesPredictions, isLoading: salesLoading } = useSalesPredictions(products);
  const { data: stockPredictions, isLoading: stockLoading } = useStockPredictions(products);
  const { data: categoryTrends, isLoading: trendsLoading } = useCategoryTrends(categories);

  // Calculer les métriques globales
  const globalMetrics = useMemo(() => {
    if (!salesPredictions || !stockPredictions) return null;

    const totalPredictedSales = salesPredictions.reduce((sum, pred) => sum + pred.predictedSales, 0);
    const avgConfidence = salesPredictions.reduce((sum, pred) => sum + pred.confidence, 0) / salesPredictions.length;

    const stockAlerts = stockPredictions.filter(pred =>
      pred.currentStock <= pred.recommendedStock * 0.2 // Stock critique (< 20% du recommandé)
    ).length;

    const growingProducts = salesPredictions.filter(pred => pred.trend === 'increasing').length;
    const decliningProducts = salesPredictions.filter(pred => pred.trend === 'decreasing').length;

    return {
      totalPredictedSales,
      avgConfidence,
      stockAlerts,
      growingProducts,
      decliningProducts,
      totalProducts: products.length
    };
  }, [salesPredictions, stockPredictions, products.length]);

  const handleExportPredictions = () => {
    // TODO: Implémenter l'export des prédictions
    logger.info('Export predictions requested', { storeId: store?.id });
  };

  if (salesLoading || stockLoading || trendsLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header avec contrôles */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Analytics Prédictif</h2>
          <p className="text-muted-foreground">
            Prévisions intelligentes pour optimiser vos ventes et stocks
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sélecteur de période */}
          <div className="flex items-center gap-1">
            {(['7d', '30d', '90d'] as const).map((period) => (
              <Button
                key={period}
                variant={selectedTimeframe === period ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTimeframe(period)}
              >
                {period === '7d' ? '7 jours' : period === '30d' ? '30 jours' : '90 jours'}
              </Button>
            ))}
          </div>

          <Button onClick={handleExportPredictions} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Métriques globales */}
      {globalMetrics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ventes Prédites</p>
                  <p className="text-2xl font-bold">{globalMetrics.totalPredictedSales}</p>
                  <p className="text-xs text-muted-foreground">Prochains {selectedTimeframe}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Confiance Moyenne</p>
                  <p className="text-2xl font-bold">{Math.round(globalMetrics.avgConfidence * 100)}%</p>
                  <p className="text-xs text-muted-foreground">Précision des prédictions</p>
                </div>
                <Target className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Alertes Stock</p>
                  <p className="text-2xl font-bold text-red-600">{globalMetrics.stockAlerts}</p>
                  <p className="text-xs text-muted-foreground">Produits à réapprovisionner</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tendance Produits</p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-green-600">+{globalMetrics.growingProducts}</span>
                    <span className="text-lg font-bold text-red-600">-{globalMetrics.decliningProducts}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Croissance vs Déclin</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alertes importantes */}
      {globalMetrics && globalMetrics.stockAlerts > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>{globalMetrics.stockAlerts} produit(s)</strong> nécessitent une attention immédiate.
            Vérifiez les prédictions de stock ci-dessous.
          </AlertDescription>
        </Alert>
      )}

      {/* Prédictions de stock critiques */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Alertes Stock - Action Requise
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stockPredictions && stockPredictions.length > 0 ? (
            <div className="space-y-4">
              {stockPredictions
                .filter(pred => pred.currentStock <= pred.recommendedStock * 0.5) // Stock faible
                .sort((a, b) => a.currentStock / Math.max(a.predictedDemand, 1) - b.currentStock / Math.max(b.predictedDemand, 1))
                .slice(0, 5)
                .map((prediction) => (
                  <div key={prediction.productId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Produit {prediction.productId.slice(0, 8)}</span>
                        <Badge variant={prediction.confidence > 0.7 ? 'default' : 'secondary'}>
                          {Math.round(prediction.confidence * 100)}% confiance
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                        <div>
                          Stock actuel: <span className="font-medium text-foreground">{prediction.currentStock}</span>
                        </div>
                        <div>
                          Demand prédite: <span className="font-medium text-foreground">{prediction.predictedDemand}</span>
                        </div>
                        <div>
                          Recommandé: <span className="font-medium text-green-600">{prediction.recommendedStock}</span>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Réapprovisionnement conseillé avant le {prediction.restockDate.toLocaleDateString()}
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      Commander
                    </Button>
                  </div>
                ))}
              {stockPredictions.filter(pred => pred.currentStock <= pred.recommendedStock * 0.5).length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Aucun problème de stock détecté. Tous vos produits sont bien approvisionnés ! 🎉
                </p>
              )}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Aucune donnée de stock disponible
            </p>
          )}
        </CardContent>
      </Card>

      {/* Tendances par catégorie */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Tendances par Catégorie
          </CardTitle>
        </CardHeader>
        <CardContent>
          {categoryTrends && categoryTrends.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {categoryTrends
                .filter(trend => trend.trendStrength > 0.1)
                .sort((a, b) => b.trendStrength - a.trendStrength)
                .slice(0, 4)
                .map((trend) => (
                  <div key={trend.category} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium capitalize">{trend.category}</h4>
                      <div className="flex items-center gap-1">
                        {trend.predictedGrowth > 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                        <span className={cn(
                          "text-sm font-medium",
                          trend.predictedGrowth > 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {trend.predictedGrowth > 0 ? '+' : ''}{Math.round(trend.predictedGrowth)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Force de tendance</span>
                        <span className="font-medium">{Math.round(trend.trendStrength * 100)}%</span>
                      </div>

                      {trend.topProducts.length > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Top produits :</p>
                          <div className="flex flex-wrap gap-1">
                            {trend.topProducts.slice(0, 3).map((product) => (
                              <Badge key={product.productId} variant="outline" className="text-xs">
                                {product.productId.slice(0, 6)} (+{Math.round(product.predictedGrowth)})
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Aucune tendance significative détectée
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recommandations d'actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Recommandations d'Optimisation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-5 w-5 text-blue-500" />
                <h4 className="font-medium">Gestion des Stocks</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Optimisez vos niveaux de stock basés sur les prédictions de demande.
              </p>
              <Button size="sm" variant="outline" className="w-full">
                Voir les recommandations
              </Button>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <h4 className="font-medium">Focus Marketing</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Concentrez vos efforts sur les catégories en croissance.
              </p>
              <Button size="sm" variant="outline" className="w-full">
                Créer une campagne
              </Button>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-purple-500" />
                <h4 className="font-medium">Segmentation Clients</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Identifiez et ciblez vos segments clients les plus rentables.
              </p>
              <Button size="sm" variant="outline" className="w-full">
                Analyser les segments
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};