/**
 * Cost Optimization Dashboard Component
 * Date: 27 Janvier 2025
 * 
 * Dashboard complet pour l'analyse des coûts, marges et optimisation des prix
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProductCosts, useMarginAnalysis, usePriceOptimizationRecommendations, useCalculateProductMargin, useGeneratePriceOptimizationRecommendations, useUpdateRecommendationStatus } from '@/hooks/physical/useCostOptimization';
import { useStore } from '@/hooks/useStore';
import { TrendingUp, TrendingDown, DollarSign, Percent, Package, AlertTriangle, RefreshCw, Calculator, Target } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function CostOptimizationDashboard() {
  const { store } = useStore();
  const { data: costs, isLoading: costsLoading } = useProductCosts(store?.id);
  const { data: margins, isLoading: marginsLoading } = useMarginAnalysis(store?.id);
  const { data: recommendations, isLoading: recommendationsLoading } = usePriceOptimizationRecommendations(store?.id, {
    status: 'pending',
  });
  const calculateMargin = useCalculateProductMargin();
  const generateRecommendations = useGeneratePriceOptimizationRecommendations();
  const updateStatus = useUpdateRecommendationStatus();
  const { toast } = useToast();

  const [selectedPeriod, setSelectedPeriod] = useState<'30' | '60' | '90'>('30');

  const handleCalculateMargins = async () => {
    if (!store?.id || !costs || costs.length === 0) return;

    // Calculer marges pour tous les produits avec coûts
    for (const cost of costs) {
      try {
        await calculateMargin.mutateAsync({
          storeId: store.id,
          productId: cost.product_id,
          variantId: cost.variant_id,
        });
      } catch (error) {
        // Continuer avec les autres produits
      }
    }
  };

  const handleGenerateRecommendations = async () => {
    if (!store?.id) return;
    await generateRecommendations.mutateAsync(store.id);
  };

  const handleUpdateRecommendationStatus = async (recommendationId: string, status: string) => {
    await updateStatus.mutateAsync({
      recommendationId,
      status: status as any,
    });
  };

  // Calculer statistiques globales
  const totalCosts = costs?.reduce((sum, cost) => sum + (cost.total_cost_per_unit || 0), 0) || 0;
  const averageMargin = margins && margins.length > 0
    ? margins.reduce((sum, m) => sum + m.net_margin_percentage, 0) / margins.length
    : 0;
  const urgentRecommendations = recommendations?.filter(r => r.priority === 'urgent') || [];
  const highValueRecommendations = recommendations?.filter(r => 
    r.expected_profit_change && r.expected_profit_change > 1000
  ) || [];

  // Préparer données pour graphiques
  const marginTrendData = margins?.slice(0, 10).map(m => ({
    date: format(new Date(m.analysis_date), 'dd MMM', { locale: fr }),
    grossMargin: m.gross_margin_percentage,
    netMargin: m.net_margin_percentage,
    revenue: m.total_revenue,
  })) || [];

  if (costsLoading || marginsLoading || recommendationsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Optimisation des Coûts et Marges</h2>
          <p className="text-muted-foreground">
            Analysez vos coûts, marges et optimisez vos prix pour maximiser la rentabilité
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleCalculateMargins} variant="outline" disabled={calculateMargin.isPending}>
            <Calculator className={`mr-2 h-4 w-4 ${calculateMargin.isPending ? 'animate-spin' : ''}`} />
            Calculer marges
          </Button>
          <Button onClick={handleGenerateRecommendations} disabled={generateRecommendations.isPending}>
            <RefreshCw className={`mr-2 h-4 w-4 ${generateRecommendations.isPending ? 'animate-spin' : ''}`} />
            Générer recommandations
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Coût total moyen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {costs && costs.length > 0
                ? new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'XOF',
                  }).format(totalCosts / costs.length)
                : '0 XOF'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {costs?.length || 0} produit{costs && costs.length > 1 ? 's' : ''} avec coûts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Marge nette moyenne
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {averageMargin > 0 ? `${averageMargin.toFixed(1)}%` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              {averageMargin > 20 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : averageMargin > 0 ? (
                <TrendingDown className="h-3 w-3 text-yellow-500" />
              ) : null}
              {margins?.length || 0} analyse{margins && margins.length > 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Recommandations urgentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{urgentRecommendations.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Nécessitent attention immédiate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Opportunités élevées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{highValueRecommendations.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Impact profit &gt; 1000 XOF
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="recommendations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="recommendations">Recommandations</TabsTrigger>
          <TabsTrigger value="margins">Analyses de Marge</TabsTrigger>
          <TabsTrigger value="costs">Coûts Produits</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Recommandations */}
        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recommandations d'Optimisation de Prix</CardTitle>
              <CardDescription>
                {recommendations?.length || 0} recommandation{recommendations && recommendations.length > 1 ? 's' : ''} en attente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Prix actuel</TableHead>
                      <TableHead>Prix recommandé</TableHead>
                      <TableHead>Changement</TableHead>
                      <TableHead>Impact prévu</TableHead>
                      <TableHead>Confiance</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!recommendations || recommendations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground">
                          Aucune recommandation disponible
                        </TableCell>
                      </TableRow>
                    ) : (
                      recommendations.map((rec) => (
                        <TableRow key={rec.id}>
                          <TableCell>
                            {(rec.product as any)?.name || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              rec.recommendation_type === 'increase_price' ? 'default' :
                              rec.recommendation_type === 'decrease_price' ? 'secondary' :
                              'outline'
                            }>
                              {rec.recommendation_type === 'increase_price' ? 'Augmenter' :
                               rec.recommendation_type === 'decrease_price' ? 'Diminuer' :
                               'Maintenir'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Intl.NumberFormat('fr-FR', {
                              style: 'currency',
                              currency: 'XOF',
                            }).format(rec.current_price)}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">
                              {new Intl.NumberFormat('fr-FR', {
                                style: 'currency',
                                currency: 'XOF',
                              }).format(rec.recommended_price)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {rec.price_change_percentage > 0 ? (
                                <TrendingUp className="h-4 w-4 text-green-500" />
                              ) : rec.price_change_percentage < 0 ? (
                                <TrendingDown className="h-4 w-4 text-red-500" />
                              ) : null}
                              <span className={rec.price_change_percentage > 0 ? 'text-green-600' : rec.price_change_percentage < 0 ? 'text-red-600' : ''}>
                                {rec.price_change_percentage > 0 ? '+' : ''}{rec.price_change_percentage.toFixed(1)}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {rec.expected_profit_change ? (
                              <span className="font-medium text-green-600">
                                +{new Intl.NumberFormat('fr-FR', {
                                  style: 'currency',
                                  currency: 'XOF',
                                }).format(rec.expected_profit_change)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              rec.confidence_level >= 0.8 ? 'default' :
                              rec.confidence_level >= 0.6 ? 'secondary' :
                              'outline'
                            }>
                              {(rec.confidence_level * 100).toFixed(0)}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Select
                              value={rec.status}
                              onValueChange={(value) => handleUpdateRecommendationStatus(rec.id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">En attente</SelectItem>
                                <SelectItem value="approved">Approuvé</SelectItem>
                                <SelectItem value="implemented">Implémenté</SelectItem>
                                <SelectItem value="dismissed">Ignoré</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analyses de Marge */}
        <TabsContent value="margins" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analyses de Marge</CardTitle>
              <CardDescription>
                {margins?.length || 0} analyse{margins && margins.length > 1 ? 's' : ''} disponible{margins && margins.length > 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead>Période</TableHead>
                      <TableHead>Revenu</TableHead>
                      <TableHead>Coûts</TableHead>
                      <TableHead>Profit net</TableHead>
                      <TableHead>Marge brute</TableHead>
                      <TableHead>Marge nette</TableHead>
                      <TableHead>Profit/unité</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!margins || margins.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground">
                          Aucune analyse disponible
                        </TableCell>
                      </TableRow>
                    ) : (
                      margins.slice(0, 20).map((margin) => (
                        <TableRow key={margin.id}>
                          <TableCell>
                            {(margin.product as any)?.name || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {format(new Date(margin.analysis_period_start), 'dd MMM', { locale: fr })} - {' '}
                            {format(new Date(margin.analysis_period_end), 'dd MMM yyyy', { locale: fr })}
                          </TableCell>
                          <TableCell>
                            {new Intl.NumberFormat('fr-FR', {
                              style: 'currency',
                              currency: 'XOF',
                            }).format(margin.total_revenue)}
                          </TableCell>
                          <TableCell>
                            {new Intl.NumberFormat('fr-FR', {
                              style: 'currency',
                              currency: 'XOF',
                            }).format(margin.total_costs)}
                          </TableCell>
                          <TableCell>
                            <span className={margin.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {new Intl.NumberFormat('fr-FR', {
                                style: 'currency',
                                currency: 'XOF',
                              }).format(margin.net_profit)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              margin.gross_margin_percentage >= 50 ? 'default' :
                              margin.gross_margin_percentage >= 30 ? 'secondary' :
                              'outline'
                            }>
                              {margin.gross_margin_percentage.toFixed(1)}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              margin.net_margin_percentage >= 20 ? 'default' :
                              margin.net_margin_percentage >= 10 ? 'secondary' :
                              'destructive'
                            }>
                              {margin.net_margin_percentage.toFixed(1)}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Intl.NumberFormat('fr-FR', {
                              style: 'currency',
                              currency: 'XOF',
                            }).format(margin.profit_per_unit)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Coûts Produits */}
        <TabsContent value="costs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Coûts des Produits</CardTitle>
              <CardDescription>
                {costs?.length || 0} produit{costs && costs.length > 1 ? 's' : ''} avec coûts enregistrés
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead>COGS</TableHead>
                      <TableHead>Fabrication</TableHead>
                      <TableHead>Emballage</TableHead>
                      <TableHead>Expédition</TableHead>
                      <TableHead>Coût total</TableHead>
                      <TableHead>Date référence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!costs || costs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          Aucun coût enregistré
                        </TableCell>
                      </TableRow>
                    ) : (
                      costs.map((cost) => (
                        <TableRow key={cost.id}>
                          <TableCell>
                            {(cost.product as any)?.name || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {new Intl.NumberFormat('fr-FR', {
                              style: 'currency',
                              currency: 'XOF',
                            }).format(cost.cost_of_goods_sold)}
                          </TableCell>
                          <TableCell>
                            {new Intl.NumberFormat('fr-FR', {
                              style: 'currency',
                              currency: 'XOF',
                            }).format(cost.manufacturing_cost)}
                          </TableCell>
                          <TableCell>
                            {new Intl.NumberFormat('fr-FR', {
                              style: 'currency',
                              currency: 'XOF',
                            }).format(cost.packaging_cost)}
                          </TableCell>
                          <TableCell>
                            {new Intl.NumberFormat('fr-FR', {
                              style: 'currency',
                              currency: 'XOF',
                            }).format(cost.shipping_cost_per_unit)}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">
                              {new Intl.NumberFormat('fr-FR', {
                                style: 'currency',
                                currency: 'XOF',
                              }).format(cost.total_cost_per_unit)}
                            </span>
                          </TableCell>
                          <TableCell>
                            {format(new Date(cost.cost_basis_date), 'dd MMM yyyy', { locale: fr })}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Évolution des Marges</CardTitle>
                <CardDescription>Marge brute et nette sur les 10 dernières analyses</CardDescription>
              </CardHeader>
              <CardContent>
                {marginTrendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={marginTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="grossMargin" stroke="#8884d8" name="Marge brute (%)" />
                      <Line type="monotone" dataKey="netMargin" stroke="#82ca9d" name="Marge nette (%)" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Pas assez de données pour afficher le graphique
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenus par Période</CardTitle>
                <CardDescription>Revenus totaux sur les 10 dernières analyses</CardDescription>
              </CardHeader>
              <CardContent>
                {marginTrendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={marginTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="revenue" fill="#8884d8" name="Revenus (XOF)" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Pas assez de données pour afficher le graphique
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

