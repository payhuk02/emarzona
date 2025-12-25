/**
 * Dashboard d'Analytics Inventaire
 * Date: 3 Février 2025
 *
 * Affiche les prévisions de demande et optimisations de stock
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Target,
  DollarSign,
  Package,
  RefreshCw,
  Download,
} from 'lucide-react';
import {
  useStoreStockOptimization,
  useApplyStockOptimization,
} from '@/hooks/physical/useStockOptimization';
import { useStoreDemandForecasts } from '@/hooks/physical/useDemandForecasting';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface InventoryAnalyticsDashboardProps {
  storeId: string;
  className?: string;
}

export function InventoryAnalyticsDashboard({
  storeId,
  className,
}: InventoryAnalyticsDashboardProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'forecasts' | 'optimizations' | 'urgent'>(
    'overview'
  );

  const { data: optimizationReport, isLoading: isLoadingOptimization } =
    useStoreStockOptimization(storeId);
  const { data: forecasts, isLoading: isLoadingForecasts } = useStoreDemandForecasts(storeId);
  const applyOptimization = useApplyStockOptimization();

  type StockOptimization = NonNullable<typeof optimizationReport>['optimizations'][number];
  const handleApplyOptimization = async (optimization: StockOptimization | undefined) => {
    if (!optimization) return;

    try {
      await applyOptimization.mutateAsync({
        productId: optimization.product_id,
        variantId: optimization.variant_id,
        optimization,
      });

      toast({
        title: '✅ Optimisation appliquée',
        description: `Les paramètres de réapprovisionnement ont été mis à jour pour ${optimization.product_name}`,
      });
    } catch (error) {
      toast({
        title: '❌ Erreur',
        description: "Impossible d'appliquer l'optimisation",
        variant: 'destructive',
      });
    }
  };

  if (isLoadingOptimization || isLoadingForecasts) {
    return (
      <div className={cn('space-y-4', className)}>
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Inventaire</h2>
          <p className="text-muted-foreground">
            Prévisions de demande et optimisations automatiques
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {optimizationReport && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Produits Optimaux</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {optimizationReport.optimal_count}
              </div>
              <p className="text-xs text-muted-foreground">
                sur {optimizationReport.total_products} produits
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Actions Urgentes</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {optimizationReport.critical_count}
              </div>
              <p className="text-xs text-muted-foreground">Produits en rupture critique</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valeur Stock</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {optimizationReport.total_stock_value.toLocaleString('fr-FR', {
                  style: 'currency',
                  currency: 'XOF',
                  minimumFractionDigits: 0,
                })}
              </div>
              <p className="text-xs text-muted-foreground">Valeur totale de l'inventaire</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Économies Potentielles</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {optimizationReport.potential_savings.toLocaleString('fr-FR', {
                  style: 'currency',
                  currency: 'XOF',
                  minimumFractionDigits: 0,
                })}
              </div>
              <p className="text-xs text-muted-foreground">Si optimisations appliquées</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="forecasts">Prévisions</TabsTrigger>
          <TabsTrigger value="optimizations">Optimisations</TabsTrigger>
          <TabsTrigger value="urgent">
            Urgent ({optimizationReport?.urgent_actions.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Urgent Actions Alert */}
          {optimizationReport && optimizationReport.urgent_actions.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Actions Urgentes Requises</AlertTitle>
              <AlertDescription>
                {optimizationReport.urgent_actions.length} produit(s) nécessitent une attention
                immédiate. Consultez l'onglet "Urgent" pour plus de détails.
              </AlertDescription>
            </Alert>
          )}

          {/* Stock Status Distribution */}
          {optimizationReport && (
            <Card>
              <CardHeader>
                <CardTitle>Répartition des Statuts de Stock</CardTitle>
                <CardDescription>
                  Distribution des produits par statut d'optimisation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>Optimal</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-32 bg-muted rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{
                            width: `${(optimizationReport.optimal_count / optimizationReport.total_products) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">
                        {optimizationReport.optimal_count}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-orange-600" />
                      <span>Surstock</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-32 bg-muted rounded-full h-2">
                        <div
                          className="bg-orange-600 h-2 rounded-full"
                          style={{
                            width: `${(optimizationReport.overstock_count / optimizationReport.total_products) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">
                        {optimizationReport.overstock_count}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-yellow-600" />
                      <span>Sous-stock</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-32 bg-muted rounded-full h-2">
                        <div
                          className="bg-yellow-600 h-2 rounded-full"
                          style={{
                            width: `${(optimizationReport.understock_count / optimizationReport.total_products) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">
                        {optimizationReport.understock_count}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span>Critique</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-32 bg-muted rounded-full h-2">
                        <div
                          className="bg-red-600 h-2 rounded-full"
                          style={{
                            width: `${(optimizationReport.critical_count / optimizationReport.total_products) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">
                        {optimizationReport.critical_count}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Products by Potential Savings */}
          {optimizationReport && optimizationReport.optimizations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top 10 - Économies Potentielles</CardTitle>
                <CardDescription>
                  Produits avec le plus grand potentiel d'optimisation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Économies</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {optimizationReport.optimizations.slice(0, 10).map(opt => (
                      <TableRow key={opt.product_id}>
                        <TableCell className="font-medium">{opt.product_name}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              opt.stock_status === 'optimal'
                                ? 'default'
                                : opt.stock_status === 'critical'
                                  ? 'destructive'
                                  : 'secondary'
                            }
                          >
                            {opt.stock_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {opt.potential_savings.toLocaleString('fr-FR', {
                            style: 'currency',
                            currency: 'XOF',
                            minimumFractionDigits: 0,
                          })}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApplyOptimization(opt)}
                            disabled={applyOptimization.isPending}
                          >
                            Appliquer
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Forecasts Tab */}
        <TabsContent value="forecasts" className="space-y-4">
          {forecasts && forecasts.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Prévisions de Demande</CardTitle>
                <CardDescription>Prévisions basées sur l'historique des ventes</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead>Ventes/jour</TableHead>
                      <TableHead>Prévision 30j</TableHead>
                      <TableHead>Jours restants</TableHead>
                      <TableHead>Confiance</TableHead>
                      <TableHead>Risque</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {forecasts.map(forecast => (
                      <TableRow key={forecast.product_id}>
                        <TableCell className="font-medium">{forecast.product_name}</TableCell>
                        <TableCell>{forecast.average_daily_sales.toFixed(1)}</TableCell>
                        <TableCell>{forecast.forecasted_quantity_30d.toFixed(0)}</TableCell>
                        <TableCell>{forecast.days_of_inventory.toFixed(0)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              forecast.confidence_level === 'high'
                                ? 'default'
                                : forecast.confidence_level === 'medium'
                                  ? 'secondary'
                                  : 'outline'
                            }
                          >
                            {forecast.confidence_level}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              forecast.stockout_risk === 'high'
                                ? 'destructive'
                                : forecast.stockout_risk === 'medium'
                                  ? 'secondary'
                                  : 'default'
                            }
                          >
                            {forecast.stockout_risk}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Aucune prévision disponible. Les prévisions nécessitent un historique de ventes.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Optimizations Tab */}
        <TabsContent value="optimizations" className="space-y-4">
          {optimizationReport && optimizationReport.optimizations.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Toutes les Optimisations</CardTitle>
                <CardDescription>
                  Recommandations pour optimiser les niveaux de stock
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead>Stock Actuel</TableHead>
                      <TableHead>Recommandé</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Priorité</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {optimizationReport.optimizations.map(opt => (
                      <TableRow key={opt.product_id}>
                        <TableCell className="font-medium">{opt.product_name}</TableCell>
                        <TableCell>{opt.current_stock}</TableCell>
                        <TableCell>{opt.recommended_stock_level}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{opt.recommended_action}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              opt.action_priority === 'high'
                                ? 'destructive'
                                : opt.action_priority === 'medium'
                                  ? 'secondary'
                                  : 'default'
                            }
                          >
                            {opt.action_priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApplyOptimization(opt)}
                            disabled={applyOptimization.isPending}
                          >
                            Appliquer
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Aucune optimisation disponible.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Urgent Tab */}
        <TabsContent value="urgent" className="space-y-4">
          {optimizationReport && optimizationReport.urgent_actions.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Actions Urgentes</CardTitle>
                <CardDescription>Produits nécessitant une attention immédiate</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead>Stock Actuel</TableHead>
                      <TableHead>Point de Réappro.</TableHead>
                      <TableHead>Quantité Recommandée</TableHead>
                      <TableHead>Date Recommandée</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {optimizationReport.urgent_actions.map(opt => (
                      <TableRow key={opt.product_id}>
                        <TableCell className="font-medium">{opt.product_name}</TableCell>
                        <TableCell>
                          <span
                            className={cn('font-bold', opt.current_stock === 0 && 'text-red-600')}
                          >
                            {opt.current_stock}
                          </span>
                        </TableCell>
                        <TableCell>{opt.recommended_reorder_point}</TableCell>
                        <TableCell>{opt.recommended_reorder_quantity}</TableCell>
                        <TableCell>
                          {opt.forecast?.recommended_reorder_date
                            ? format(
                                new Date(opt.forecast.recommended_reorder_date),
                                'dd MMM yyyy',
                                { locale: fr }
                              )
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleApplyOptimization(opt)}
                            disabled={applyOptimization.isPending}
                          >
                            Appliquer
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-600" />
                <p className="text-lg font-medium">Aucune action urgente</p>
                <p className="text-sm text-muted-foreground">
                  Tous vos produits ont des niveaux de stock optimaux
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
