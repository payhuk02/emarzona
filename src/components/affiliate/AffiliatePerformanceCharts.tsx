/**
 * Component: AffiliatePerformanceCharts
 * Description: Composant de graphiques pour les statistiques d'affiliation
 * Date: 28 Janvier 2025
 */

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LazyRechartsWrapper } from '@/components/charts/LazyRechartsWrapper';
import { TrendingUp, BarChart3, PieChart, Activity, MousePointerClick, ShoppingCart, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format, subDays, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface AffiliateChartDataPoint {
  date: string;
  clicks?: number;
  sales?: number;
  revenue?: number;
  commission?: number;
  conversion_rate?: number;
}

export interface AffiliatePerformanceChartsProps {
  clicksData?: AffiliateChartDataPoint[];
  salesData?: AffiliateChartDataPoint[];
  commissionsData?: AffiliateChartDataPoint[];
  period?: '7d' | '30d' | '90d' | '1y';
  onPeriodChange?: (period: '7d' | '30d' | '90d' | '1y') => void;
  loading?: boolean;
}

export const AffiliatePerformanceCharts = ({
  clicksData = [],
  salesData = [],
  commissionsData = [],
  period = '30d',
  onPeriodChange,
  loading = false,
}: AffiliatePerformanceChartsProps) => {
  
  // Préparer les données pour les graphiques
  const chartData = useMemo(() => {
    const daysCount = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
    const startDate = startOfDay(subDays(new Date(), daysCount - 1));
    
    // Créer un tableau de dates
    const dates: string[] = [];
    for (let i = 0; i < daysCount; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      dates.push(format(date, 'yyyy-MM-dd'));
    }
    
    // Fusionner les données par date
    return dates.map(date => {
      const clicks = clicksData.find(d => d.date === date);
      const sales = salesData.find(d => d.date === date);
      const commissions = commissionsData.find(d => d.date === date);
      
      return {
        date: format(new Date(date), 'dd MMM', { locale: fr }),
        fullDate: date,
        clicks: clicks?.clicks || 0,
        sales: sales?.sales || 0,
        revenue: sales?.revenue || 0,
        commission: commissions?.commission || 0,
        conversion_rate: clicks?.clicks 
          ? ((sales?.sales || 0) / clicks.clicks * 100) 
          : 0,
      };
    });
  }, [clicksData, salesData, commissionsData, period]);

  // Calculer les totaux pour les indicateurs
  const totals = useMemo(() => {
    return {
      totalClicks: chartData.reduce((sum, d) => sum + d.clicks, 0),
      totalSales: chartData.reduce((sum, d) => sum + d.sales, 0),
      totalRevenue: chartData.reduce((sum, d) => sum + d.revenue, 0),
      totalCommission: chartData.reduce((sum, d) => sum + d.commission, 0),
      avgConversionRate: chartData.length > 0
        ? chartData.reduce((sum, d) => sum + d.conversion_rate, 0) / chartData.length
        : 0,
    };
  }, [chartData]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map(i => (
          <Card key={i}>
            <CardHeader>
              <CardTitle className="h-6 w-32 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-[300px] bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sélecteur de période */}
      {onPeriodChange && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Performances</h3>
          <Select value={period} onValueChange={onPeriodChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 derniers jours</SelectItem>
              <SelectItem value="30d">30 derniers jours</SelectItem>
              <SelectItem value="90d">90 derniers jours</SelectItem>
              <SelectItem value="1y">1 an</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Indicateurs résumés */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Clics</p>
                <p className="text-2xl font-bold">{totals.totalClicks.toLocaleString()}</p>
              </div>
              <MousePointerClick className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Ventes</p>
                <p className="text-2xl font-bold">{totals.totalSales.toLocaleString()}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taux Conversion</p>
                <p className="text-2xl font-bold">{totals.avgConversionRate.toFixed(2)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Commission</p>
                <p className="text-2xl font-bold">{formatCurrency(totals.totalCommission)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <Tabs defaultValue="clicks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="clicks">
            <MousePointerClick className="h-4 w-4 mr-2" />
            Clics
          </TabsTrigger>
          <TabsTrigger value="sales">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Ventes
          </TabsTrigger>
          <TabsTrigger value="commissions">
            <DollarSign className="h-4 w-4 mr-2" />
            Commissions
          </TabsTrigger>
          <TabsTrigger value="conversion">
            <TrendingUp className="h-4 w-4 mr-2" />
            Conversion
          </TabsTrigger>
        </TabsList>

        {/* Graphique des clics */}
        <TabsContent value="clicks">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Évolution des Clics
              </CardTitle>
              <CardDescription>
                Nombre de clics sur vos liens d'affiliation sur la période sélectionnée
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LazyRechartsWrapper>
                {(recharts) => (
                  <recharts.ResponsiveContainer width="100%" height={300}>
                    <recharts.LineChart data={chartData}>
                      <recharts.CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                      <recharts.XAxis 
                        dataKey="date" 
                        stroke="#9ca3af"
                        fontSize={12}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <recharts.YAxis 
                        stroke="#9ca3af"
                        fontSize={12}
                      />
                      <recharts.Tooltip 
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#f9fafb'
                        }}
                        formatter={(value: number) => [value.toLocaleString(), 'Clics']}
                      />
                      <recharts.Line 
                        type="monotone" 
                        dataKey="clicks" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Clics"
                      />
                    </recharts.LineChart>
                  </recharts.ResponsiveContainer>
                )}
              </LazyRechartsWrapper>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Graphique des ventes */}
        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Évolution des Ventes
              </CardTitle>
              <CardDescription>
                Nombre de ventes générées et revenus sur la période
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LazyRechartsWrapper>
                {(recharts) => (
                  <recharts.ResponsiveContainer width="100%" height={300}>
                    <recharts.BarChart data={chartData}>
                      <recharts.CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                      <recharts.XAxis 
                        dataKey="date" 
                        stroke="#9ca3af"
                        fontSize={12}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <recharts.YAxis 
                        stroke="#9ca3af"
                        fontSize={12}
                      />
                      <recharts.Tooltip 
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#f9fafb'
                        }}
                        formatter={(value: number, name: string) => [
                          name === 'revenue' ? formatCurrency(value) : value.toLocaleString(),
                          name === 'sales' ? 'Ventes' : 'Revenus'
                        ]}
                      />
                      <recharts.Legend />
                      <recharts.Bar dataKey="sales" fill="#10b981" name="Nombre de ventes" />
                      <recharts.Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#f59e0b" 
                        strokeWidth={2}
                        yAxisId={1}
                        name="Revenus (XOF)"
                      />
                      <recharts.YAxis yAxisId={1} orientation="right" stroke="#9ca3af" />
                    </recharts.BarChart>
                  </recharts.ResponsiveContainer>
                )}
              </LazyRechartsWrapper>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Graphique des commissions */}
        <TabsContent value="commissions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Évolution des Commissions
              </CardTitle>
              <CardDescription>
                Montant des commissions gagnées sur la période
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LazyRechartsWrapper>
                {(recharts) => (
                  <recharts.ResponsiveContainer width="100%" height={300}>
                    <recharts.AreaChart data={chartData}>
                      <recharts.CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                      <recharts.XAxis 
                        dataKey="date" 
                        stroke="#9ca3af"
                        fontSize={12}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <recharts.YAxis 
                        stroke="#9ca3af"
                        fontSize={12}
                        tickFormatter={(value) => formatCurrency(value)}
                      />
                      <recharts.Tooltip 
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#f9fafb'
                        }}
                        formatter={(value: number) => [formatCurrency(value), 'Commission']}
                      />
                      <recharts.Area 
                        type="monotone" 
                        dataKey="commission" 
                        stroke="#f59e0b" 
                        fill="#f59e0b"
                        fillOpacity={0.3}
                        name="Commission"
                      />
                    </recharts.AreaChart>
                  </recharts.ResponsiveContainer>
                )}
              </LazyRechartsWrapper>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Graphique du taux de conversion */}
        <TabsContent value="conversion">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Taux de Conversion
              </CardTitle>
              <CardDescription>
                Pourcentage de clics qui se sont convertis en ventes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LazyRechartsWrapper>
                {(recharts) => (
                  <recharts.ResponsiveContainer width="100%" height={300}>
                    <recharts.LineChart data={chartData}>
                      <recharts.CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                      <recharts.XAxis 
                        dataKey="date" 
                        stroke="#9ca3af"
                        fontSize={12}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <recharts.YAxis 
                        stroke="#9ca3af"
                        fontSize={12}
                        tickFormatter={(value) => `${value.toFixed(1)}%`}
                      />
                      <recharts.Tooltip 
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#f9fafb'
                        }}
                        formatter={(value: number) => [`${value.toFixed(2)}%`, 'Taux de conversion']}
                      />
                      <recharts.Line 
                        type="monotone" 
                        dataKey="conversion_rate" 
                        stroke="#8b5cf6" 
                        strokeWidth={2}
                        dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Taux de conversion (%)"
                      />
                    </recharts.LineChart>
                  </recharts.ResponsiveContainer>
                )}
              </LazyRechartsWrapper>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};


