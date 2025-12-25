/**
 * Graphique de performance des entrepôts
 * Date: 28 Janvier 2025
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { WarehousePerformance } from '@/hooks/physical/usePhysicalAnalytics';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LazyRechartsWrapper } from '@/components/charts/LazyRechartsWrapper';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface WarehousePerformanceChartProps {
  warehousePerformance: WarehousePerformance[];
  periodType: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export function WarehousePerformanceChart({ warehousePerformance, periodType }: WarehousePerformanceChartProps) {
  // Get warehouse names
  const warehouseIds = [...new Set(warehousePerformance.map((w) => w.warehouse_id))];
  
  const { data: warehouses } = useQuery({
    queryKey: ['warehouses-names', warehouseIds],
    queryFn: async () => {
      if (warehouseIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('warehouses')
        .select('id, name')
        .in('id', warehouseIds);

      if (error) throw error;
      return data || [];
    },
    enabled: warehouseIds.length > 0,
  });

  // Aggregate data by warehouse
  const warehouseData = warehousePerformance.reduce((acc: any[], item) => {
    const warehouse = warehouses?.find((w) => w.id === item.warehouse_id);
    const warehouseName = warehouse?.name || `Entrepôt ${item.warehouse_id.slice(0, 8)}`;

    const existing = acc.find((a) => a.warehouseId === item.warehouse_id);
    if (existing) {
      existing.revenue += item.total_revenue || 0;
      existing.orders += item.total_orders_fulfilled || 0;
      existing.costs += item.total_costs || 0;
      existing.profit += item.net_profit || 0;
      existing.efficiency += item.orders_per_hour || 0;
    } else {
      acc.push({
        warehouseId: item.warehouse_id,
        warehouseName,
        revenue: item.total_revenue || 0,
        orders: item.total_orders_fulfilled || 0,
        costs: item.total_costs || 0,
        profit: item.net_profit || 0,
        efficiency: item.orders_per_hour || 0,
        margin: item.profit_margin || 0,
      });
    }
    return acc;
  }, []);

  // Time series data
  const timeSeriesData = warehousePerformance
    .map((item) => {
      const warehouse = warehouses?.find((w) => w.id === item.warehouse_id);
      return {
        period: format(new Date(item.period_start), periodType === 'daily' ? 'dd MMM' : periodType === 'weekly' ? 'w' : periodType === 'monthly' ? 'MMM' : 'yyyy', { locale: fr }),
        warehouse: warehouse?.name || 'Entrepôt',
        revenue: item.total_revenue || 0,
        profit: item.net_profit || 0,
        orders: item.total_orders_fulfilled || 0,
      };
    })
    .sort((a, b) => a.period.localeCompare(b.period));

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Performance par Entrepôt</CardTitle>
          <CardDescription>Revenus, coûts et profit par entrepôt</CardDescription>
        </CardHeader>
        <CardContent>
          <LazyRechartsWrapper>
            {(recharts) => (
              <recharts.ResponsiveContainer width="100%" height={300}>
                <recharts.BarChart data={warehouseData}>
                  <recharts.CartesianGrid strokeDasharray="3 3" />
                  <recharts.XAxis dataKey="warehouseName" />
                  <recharts.YAxis />
                  <recharts.Tooltip
                    formatter={(value: number, name: string) => {
                      if (name === 'revenue' || name === 'costs' || name === 'profit') {
                        return [
                          new Intl.NumberFormat('fr-FR', {
                            style: 'currency',
                            currency: 'XOF',
                            minimumFractionDigits: 0,
                          }).format(value),
                          name === 'revenue' ? 'Revenus' : name === 'costs' ? 'Coûts' : 'Profit',
                        ];
                      }
                      return [value, name];
                    }}
                  />
                  <recharts.Legend />
                  <recharts.Bar dataKey="revenue" fill="#8884d8" name="Revenus" />
                  <recharts.Bar dataKey="costs" fill="#ffc658" name="Coûts" />
                  <recharts.Bar dataKey="profit" fill="#82ca9d" name="Profit" />
                </recharts.BarChart>
              </recharts.ResponsiveContainer>
            )}
          </LazyRechartsWrapper>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Évolution Temporelle</CardTitle>
          <CardDescription>Revenus et profit dans le temps</CardDescription>
        </CardHeader>
        <CardContent>
          <LazyRechartsWrapper>
            {(recharts) => (
              <recharts.ResponsiveContainer width="100%" height={300}>
                <recharts.LineChart data={timeSeriesData}>
                  <recharts.CartesianGrid strokeDasharray="3 3" />
                  <recharts.XAxis dataKey="period" />
                  <recharts.YAxis />
                  <recharts.Tooltip
                    formatter={(value: number, name: string) => {
                      if (name === 'revenue' || name === 'profit') {
                        return [
                          new Intl.NumberFormat('fr-FR', {
                            style: 'currency',
                            currency: 'XOF',
                            minimumFractionDigits: 0,
                          }).format(value),
                          name === 'revenue' ? 'Revenus' : 'Profit',
                        ];
                      }
                      return [value, name];
                    }}
                  />
                  <recharts.Legend />
                  <recharts.Line type="monotone" dataKey="revenue" stroke="#8884d8" name="Revenus" strokeWidth={2} />
                  <recharts.Line type="monotone" dataKey="profit" stroke="#82ca9d" name="Profit" strokeWidth={2} />
                </recharts.LineChart>
              </recharts.ResponsiveContainer>
            )}
          </LazyRechartsWrapper>
        </CardContent>
      </Card>
    </div>
  );
}



