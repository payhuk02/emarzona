/**
 * Physical Products Analytics Dashboard Component
 * Dashboard complet avec KPIs, graphiques et tendances
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { usePhysicalProductsKPIs, usePhysicalProductsTrends, useTopPhysicalProducts } from '@/hooks/physical/usePhysicalAnalytics';
import { useStore } from '@/hooks/useStore';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, RefreshCw, AlertTriangle, BarChart3 } from '@/components/icons';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useState, useEffect } from 'react';
import { loadRecharts } from '@/lib/recharts-loader';

interface PhysicalProductsDashboardProps {
  storeId: string;
}

export const PhysicalProductsDashboard = ({ storeId }: PhysicalProductsDashboardProps) => {
  const [dateRange, setDateRange] = useState<'7' | '30' | '90'>('30');
  const dateFrom = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000);
  const dateTo = new Date();

  const { data: kpis, isLoading: kpisLoading } = usePhysicalProductsKPIs(storeId, dateFrom, dateTo);
  const { data: trends = [], isLoading: trendsLoading } = usePhysicalProductsTrends(storeId, parseInt(dateRange));
  const { data: topProducts = [], isLoading: topProductsLoading } = useTopPhysicalProducts(storeId, 10, parseInt(dateRange));

  if (kpisLoading || trendsLoading || topProductsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Dashboard Analytics Produits Physiques
          </h1>
          <p className="text-muted-foreground">
            Vue d'ensemble de vos performances produits physiques
          </p>
        </div>
        <Select value={dateRange} onValueChange={(value) => setDateRange(value as typeof dateRange)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 derniers jours</SelectItem>
            <SelectItem value="30">30 derniers jours</SelectItem>
            <SelectItem value="90">90 derniers jours</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPIs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenu Total</p>
                <p className="text-2xl font-bold mt-1">
                  {kpis?.total_revenue?.toLocaleString('fr-FR') || '0'} XOF
                </p>
                {kpis?.revenue_growth !== undefined && (
                  <div className={cn(
                    "flex items-center gap-1 mt-2 text-sm",
                    kpis.revenue_growth >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {kpis.revenue_growth >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    <span>{Math.abs(kpis.revenue_growth).toFixed(1)}%</span>
                  </div>
                )}
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Commandes</p>
                <p className="text-2xl font-bold mt-1">
                  {kpis?.total_orders || 0}
                </p>
                {kpis?.orders_growth !== undefined && (
                  <div className={cn(
                    "flex items-center gap-1 mt-2 text-sm",
                    kpis.orders_growth >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {kpis.orders_growth >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    <span>{Math.abs(kpis.orders_growth).toFixed(1)}%</span>
                  </div>
                )}
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unités Vendues</p>
                <p className="text-2xl font-bold mt-1">
                  {kpis?.total_units_sold || 0}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Panier moyen: {kpis?.average_order_value?.toLocaleString('fr-FR') || '0'} XOF
                </p>
              </div>
              <Package className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taux de Retour</p>
                <p className="text-2xl font-bold mt-1">
                  {kpis?.return_rate?.toFixed(1) || '0'}%
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {kpis?.total_returns || 0} retour{kpis?.total_returns !== 1 ? 's' : ''}
                </p>
              </div>
              <RefreshCw className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertes Stock */}
      {(kpis?.low_stock_count || kpis?.out_of_stock_count) ? (
        <Card className={cn(
          kpis?.out_of_stock_count ? 'border-red-500' : 'border-yellow-500'
        )}>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <AlertTriangle className={cn(
                "h-6 w-6",
                kpis?.out_of_stock_count ? "text-red-600" : "text-yellow-600"
              )} />
              <div className="flex-1">
                <p className="font-semibold">Alertes Stock</p>
                <p className="text-sm text-muted-foreground">
                  {kpis?.out_of_stock_count || 0} produit{kpis?.out_of_stock_count !== 1 ? 's' : ''} en rupture
                  {kpis?.low_stock_count ? ` • ${kpis.low_stock_count} produit${kpis.low_stock_count !== 1 ? 's' : ''} à faible stock` : ''}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Charts */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenus</TabsTrigger>
          <TabsTrigger value="orders">Commandes</TabsTrigger>
          <TabsTrigger value="top-products">Top Produits</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Évolution des Revenus</CardTitle>
            </CardHeader>
            <CardContent>
              <LazyRechartsWrapper>
                {(recharts) => (
                  <recharts.ResponsiveContainer width="100%" height={300}>
                    <recharts.LineChart data={trends}>
                      <recharts.CartesianGrid strokeDasharray="3 3" />
                      <recharts.XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => format(new Date(value), 'dd/MM', { locale: fr })}
                      />
                      <recharts.YAxis />
                      <recharts.Tooltip />
                      <recharts.Legend />
                      <recharts.Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        name="Revenus (XOF)"
                      />
                    </recharts.LineChart>
                  </recharts.ResponsiveContainer>
                )}
              </LazyRechartsWrapper>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Évolution des Commandes</CardTitle>
            </CardHeader>
            <CardContent>
              <LazyRechartsWrapper>
                {(recharts) => (
                  <recharts.ResponsiveContainer width="100%" height={300}>
                    <recharts.BarChart data={trends}>
                      <recharts.CartesianGrid strokeDasharray="3 3" />
                      <recharts.XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => format(new Date(value), 'dd/MM', { locale: fr })}
                      />
                      <recharts.YAxis />
                      <recharts.Tooltip />
                      <recharts.Legend />
                      <recharts.Bar dataKey="orders" fill="#3b82f6" name="Commandes" />
                      <recharts.Bar dataKey="units_sold" fill="#f59e0b" name="Unités vendues" />
                    </recharts.BarChart>
                  </recharts.ResponsiveContainer>
                )}
              </LazyRechartsWrapper>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="top-products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Produits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={product.product_id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                      {index + 1}
                    </div>
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.product_name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold">{product.product_name}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{product.total_units_sold} unités</span>
                        <span>{product.total_revenue.toLocaleString('fr-FR')} XOF</span>
                        {product.return_rate > 0 && (
                          <Badge variant="destructive">
                            {product.return_rate.toFixed(1)}% retours
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        {product.total_revenue.toLocaleString('fr-FR')} XOF
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Stock: {product.current_stock}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

