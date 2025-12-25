/**
 * Unified Analytics Dashboard
 * Date: 28 Janvier 2025
 * 
 * Dashboard analytics unifié pour tous les types de produits
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  Package,
  FileText,
  Wrench,
  GraduationCap,
  Palette,
  BarChart3,
  PieChart,
  Activity,
} from 'lucide-react';
import { useUnifiedAnalytics, type TimeRange } from '@/hooks/useUnifiedAnalytics';
import { cn } from '@/lib/utils';

const TYPE_ICONS = {
  digital: FileText,
  physical: Package,
  service: Wrench,
  course: GraduationCap,
  artist: Palette,
};

const TYPE_LABELS = {
  digital: 'Digitaux',
  physical: 'Physiques',
  service: 'Services',
  course: 'Cours',
  artist: 'Artistes',
};

export const UnifiedAnalyticsDashboard = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const { analytics, loading } = useUnifiedAnalytics(timeRange);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Unifié</h2>
          <p className="text-muted-foreground">
            Vue d'ensemble de tous vos produits et ventes
          </p>
        </div>
        <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">7 jours</SelectItem>
            <SelectItem value="30d">30 jours</SelectItem>
            <SelectItem value="90d">90 jours</SelectItem>
            <SelectItem value="1y">1 an</SelectItem>
            <SelectItem value="all">Tout</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenu Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analytics.overview.totalRevenue)}
            </div>
            <div className="flex items-center gap-2 mt-2">
              {getTrendIcon(analytics.trends.revenueTrend)}
              <span className="text-xs text-muted-foreground">
                {analytics.trends.revenueGrowth > 0 ? '+' : ''}
                {analytics.trends.revenueGrowth.toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commandes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalOrders}</div>
            <div className="flex items-center gap-2 mt-2">
              {getTrendIcon(analytics.trends.orderTrend)}
              <span className="text-xs text-muted-foreground">
                {analytics.trends.orderGrowth > 0 ? '+' : ''}
                {analytics.trends.orderGrowth.toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalCustomers}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Panier moyen: {formatCurrency(analytics.overview.averageOrderValue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Conversion</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.overview.conversionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Taux de croissance: {analytics.overview.growthRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="by-type" className="space-y-4">
        <TabsList>
          <TabsTrigger value="by-type">Par Type</TabsTrigger>
          <TabsTrigger value="top-products">Top Produits</TabsTrigger>
          <TabsTrigger value="top-customers">Top Clients</TabsTrigger>
          <TabsTrigger value="revenue">Revenus</TabsTrigger>
        </TabsList>

        {/* Par Type */}
        <TabsContent value="by-type" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {Object.entries(analytics.byProductType).map(([type, data]) => {
              const Icon = TYPE_ICONS[type as keyof typeof TYPE_ICONS];
              const label = TYPE_LABELS[type as keyof typeof TYPE_LABELS];

              return (
                <Card key={type}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{label}</CardTitle>
                    {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">{formatCurrency(data.revenue)}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {data.orders} commandes • {data.units} unités
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Prix moyen: {formatCurrency(data.averagePrice)}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Top Produits */}
        <TabsContent value="top-products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Produits</CardTitle>
              <CardDescription>Produits les plus vendus par revenu</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.topProducts.map((product, index) => {
                  const Icon = TYPE_ICONS[product.type];
                  return (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                          <span className="text-sm font-bold">{index + 1}</span>
                        </div>
                        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {product.orders} commandes • {product.units} unités
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(product.revenue)}</p>
                        <Badge variant="secondary" className="text-xs">
                          {TYPE_LABELS[product.type]}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Clients */}
        <TabsContent value="top-customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Clients</CardTitle>
              <CardDescription>Clients les plus actifs par dépenses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.topCustomers.map((customer, index) => (
                  <div
                    key={customer.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                        <span className="text-sm font-bold">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-xs text-muted-foreground">{customer.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(customer.totalSpent)}</p>
                      <p className="text-xs text-muted-foreground">
                        {customer.orders} commandes • Moy: {formatCurrency(customer.averageOrderValue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenus dans le temps */}
        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Évolution des Revenus</CardTitle>
              <CardDescription>Revenus par jour sur la période sélectionnée</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analytics.revenueOverTime.slice(-30).map((day) => (
                  <div
                    key={day.date}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <span className="text-sm">
                      {new Date(day.date).toLocaleDateString('fr-FR')}
                    </span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium">
                        {formatCurrency(day.revenue)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {day.orders} commandes
                      </span>
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

