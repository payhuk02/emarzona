/**
 * Vue d'ensemble des ventes
 * Date: 28 Janvier 2025
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useProductAnalytics } from '@/hooks/physical/usePhysicalAnalytics';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LazyRechartsWrapper } from '@/components/charts/LazyRechartsWrapper';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SalesOverviewProps {
  storeId: string;
  periodType: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate: string;
}

export function SalesOverview({ storeId, periodType, startDate, endDate }: SalesOverviewProps) {
  // Get all physical products for this store
  const { data: products } = useQuery({
    queryKey: ['store-physical-products', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('physical_products')
        .select('id, product:products!inner(id, name, store_id)')
        .eq('product.store_id', storeId)
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: !!storeId,
  });

  // Get analytics for all products
  const productIds = products?.map((p) => p.id) || [];
  
  const { data: analyticsData } = useQuery({
    queryKey: ['sales-overview', storeId, periodType, startDate, endDate],
    queryFn: async () => {
      if (productIds.length === 0) return [];

      const { data, error } = await supabase
        .from('physical_product_analytics')
        .select('*')
        .in('physical_product_id', productIds)
        .eq('period_type', periodType)
        .gte('period_start', startDate)
        .lte('period_end', endDate)
        .order('period_start', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: productIds.length > 0,
  });

  // Aggregate data by period
  const chartData = analyticsData?.reduce((acc: any[], item: any) => {
    const periodKey = format(new Date(item.period_start), periodType === 'daily' ? 'dd MMM' : periodType === 'weekly' ? 'w' : periodType === 'monthly' ? 'MMM' : 'yyyy', { locale: fr });
    
    const existing = acc.find((a) => a.period === periodKey);
    if (existing) {
      existing.revenue += item.revenue || 0;
      existing.units += item.units_sold || 0;
      existing.profit += item.gross_profit || 0;
    } else {
      acc.push({
        period: periodKey,
        revenue: item.revenue || 0,
        units: item.units_sold || 0,
        profit: item.gross_profit || 0,
      });
    }
    return acc;
  }, []) || [];

  // Top products
  const topProducts = analyticsData?.reduce((acc: any[], item: any) => {
    const product = products?.find((p) => p.id === item.physical_product_id);
    if (!product) return acc;

    const existing = acc.find((a) => a.productId === item.physical_product_id);
    if (existing) {
      existing.revenue += item.revenue || 0;
      existing.units += item.units_sold || 0;
    } else {
      acc.push({
        productId: item.physical_product_id,
        productName: (product as any).product?.name || 'Produit inconnu',
        revenue: item.revenue || 0,
        units: item.units_sold || 0,
      });
    }
    return acc;
  }, [])
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5) || [];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Évolution des Ventes</CardTitle>
          <CardDescription>Revenus et unités vendues par période</CardDescription>
        </CardHeader>
        <CardContent>
          <LazyRechartsWrapper>
            {(recharts) => (
              <recharts.ResponsiveContainer width="100%" height={300}>
                <recharts.LineChart data={chartData}>
                  <recharts.CartesianGrid strokeDasharray="3 3" />
                  <recharts.XAxis dataKey="period" />
                  <recharts.YAxis yAxisId="left" />
                  <recharts.YAxis yAxisId="right" orientation="right" />
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
                      return [value, name === 'units' ? 'Unités' : name];
                    }}
                  />
                  <recharts.Legend />
                  <recharts.Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#8884d8"
                    name="Revenus"
                    strokeWidth={2}
                  />
                  <recharts.Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="units"
                    stroke="#82ca9d"
                    name="Unités"
                    strokeWidth={2}
                  />
                </recharts.LineChart>
              </recharts.ResponsiveContainer>
            )}
          </LazyRechartsWrapper>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top 5 Produits</CardTitle>
          <CardDescription>Produits les plus vendus par revenus</CardDescription>
        </CardHeader>
        <CardContent>
          <LazyRechartsWrapper>
            {(recharts) => (
              <recharts.ResponsiveContainer width="100%" height={300}>
                <recharts.BarChart data={topProducts} layout="vertical">
                  <recharts.CartesianGrid strokeDasharray="3 3" />
                  <recharts.XAxis type="number" />
                  <recharts.YAxis dataKey="productName" type="category" width={120} />
                  <recharts.Tooltip
                    formatter={(value: number) =>
                      new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'XOF',
                        minimumFractionDigits: 0,
                      }).format(value)
                    }
                  />
                  <recharts.Bar dataKey="revenue" fill="#8884d8" name="Revenus" />
                </recharts.BarChart>
              </recharts.ResponsiveContainer>
            )}
          </LazyRechartsWrapper>
        </CardContent>
      </Card>
    </div>
  );
}



