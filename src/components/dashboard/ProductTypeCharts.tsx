import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LazyLineChart,
  LazyBarChart,
  LazyResponsiveContainer,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from '@/components/charts/LazyCharts';
import { BarChart3, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  PRODUCT_TYPE_COLORS,
  PRODUCT_TYPE_LABELS,
  getAllProductTypes,
  type ProductType,
} from '@/constants/product-types';

interface ProductTypeChartsProps {
  revenueByTypeAndMonth: Array<{
    month: string;
    digital: number;
    physical: number;
    service: number;
    course: number;
    artist: number;
  }>;
  ordersByType: {
    digital: number;
    physical: number;
    service: number;
    course: number;
    artist: number;
  };
  selectedType?: 'all' | ProductType;
  className?: string;
}

export const ProductTypeCharts = React.memo<ProductTypeChartsProps>(
  ({ revenueByTypeAndMonth, ordersByType, selectedType = 'all', className }) => {
    // Filtrer les données selon le type sélectionné
    const filteredRevenueData = useMemo(() => {
      if (selectedType === 'all') {
        return revenueByTypeAndMonth;
      }
      return revenueByTypeAndMonth.map(item => ({
        month: item.month,
        [selectedType]: item[selectedType],
      }));
    }, [revenueByTypeAndMonth, selectedType]);

    // Préparer les données pour le graphique de revenus
    const revenueChartData = useMemo(() => {
      return filteredRevenueData.map(item => ({
        month: item.month,
        ...(selectedType === 'all'
          ? {
              Digitaux: item.digital,
              Physiques: item.physical,
              Services: item.service,
              Cours: item.course,
              Artistes: item.artist,
            }
          : {
              [PRODUCT_TYPE_LABELS[selectedType]]: item[selectedType],
            }),
      }));
    }, [filteredRevenueData, selectedType]);

    // Préparer les données pour le graphique de commandes
    const ordersChartData = useMemo(() => {
      const types = selectedType === 'all' ? getAllProductTypes() : [selectedType];

      return types.map(type => ({
        type: PRODUCT_TYPE_LABELS[type],
        commandes: ordersByType[type],
        couleur: PRODUCT_TYPE_COLORS[type],
      }));
    }, [ordersByType, selectedType]);

    const hasData =
      revenueByTypeAndMonth.length > 0 || Object.values(ordersByType).some(count => count > 0);

    if (!hasData) {
      return (
        <Card className={cn('border-border/50 bg-card/50 backdrop-blur-sm', className)}>
          <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 md:p-6">
            <CardTitle className="text-xs sm:text-sm md:text-base lg:text-lg flex items-center gap-1.5 sm:gap-2">
              <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
              Graphiques par Type
            </CardTitle>
            <CardDescription className="text-[10px] sm:text-[11px] md:text-xs text-muted-foreground">
              Aucune donnée disponible pour le moment
            </CardDescription>
          </CardHeader>
        </Card>
      );
    }

    return (
      <div className={cn('space-y-3 sm:space-y-4 md:gap-6', className)}>
        {/* Graphique de revenus par type */}
        {revenueChartData.length > 0 && (
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 md:p-6">
              <CardTitle className="text-xs sm:text-sm md:text-base lg:text-lg flex items-center gap-1.5 sm:gap-2">
                <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                Revenus par Type
              </CardTitle>
              <CardDescription className="text-[10px] sm:text-[11px] md:text-xs text-muted-foreground">
                Évolution des revenus par type de produit
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
              <div className="h-64 sm:h-80 md:h-96">
                <LazyResponsiveContainer width="100%" height="100%">
                  <LazyLineChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="month"
                      className="text-[10px] sm:text-xs"
                      tick={{ fill: 'currentColor' }}
                    />
                    <YAxis
                      className="text-[10px] sm:text-xs"
                      tick={{ fill: 'currentColor' }}
                      tickFormatter={value => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      formatter={(value: number) => `${value.toLocaleString()} FCFA`}
                    />
                    <Legend />
                    {selectedType === 'all' ? (
                      <>
                        <Line
                          type="monotone"
                          dataKey="Digitaux"
                          stroke={PRODUCT_TYPE_COLORS.digital}
                          strokeWidth={2}
                          dot={{ r: 4 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="Physiques"
                          stroke={PRODUCT_TYPE_COLORS.physical}
                          strokeWidth={2}
                          dot={{ r: 4 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="Services"
                          stroke={PRODUCT_TYPE_COLORS.service}
                          strokeWidth={2}
                          dot={{ r: 4 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="Cours"
                          stroke={PRODUCT_TYPE_COLORS.course}
                          strokeWidth={2}
                          dot={{ r: 4 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="Artistes"
                          stroke={PRODUCT_TYPE_COLORS.artist}
                          strokeWidth={2}
                          dot={{ r: 4 }}
                        />
                      </>
                    ) : (
                      <Line
                        type="monotone"
                        dataKey={PRODUCT_TYPE_LABELS[selectedType]}
                        stroke={PRODUCT_TYPE_COLORS[selectedType]}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    )}
                  </LazyLineChart>
                </LazyResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Graphique de commandes par type */}
        {ordersChartData.length > 0 && (
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 md:p-6">
              <CardTitle className="text-xs sm:text-sm md:text-base lg:text-lg flex items-center gap-1.5 sm:gap-2">
                <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                Commandes par Type
              </CardTitle>
              <CardDescription className="text-[10px] sm:text-[11px] md:text-xs text-muted-foreground">
                Répartition des commandes par type de produit
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
              <div className="h-64 sm:h-80 md:h-96">
                <LazyResponsiveContainer width="100%" height="100%">
                  <LazyBarChart data={ordersChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="type"
                      className="text-[10px] sm:text-xs"
                      tick={{ fill: 'currentColor' }}
                    />
                    <YAxis className="text-[10px] sm:text-xs" tick={{ fill: 'currentColor' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="commandes" radius={[8, 8, 0, 0]}>
                      {ordersChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.couleur} />
                      ))}
                    </Bar>
                  </LazyBarChart>
                </LazyResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }
);

ProductTypeCharts.displayName = 'ProductTypeCharts';






