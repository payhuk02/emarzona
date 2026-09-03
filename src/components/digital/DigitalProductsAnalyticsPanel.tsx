/**
 * Panneau analytics produits digitaux — chunk séparé (recharts).
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LazyRechartsWrapper } from '@/components/charts/LazyRechartsWrapper';
import { TrendingUp } from 'lucide-react';

export type DigitalRevenueAnalyticsSummary = {
  total_revenue: number;
  total_orders: number;
  total_products_sold: number;
  average_order_value: number;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DigitalProductRow = any;

export type DigitalProductsAnalyticsPanelProps = {
  revenueAnalytics?: DigitalRevenueAnalyticsSummary | null;
  products: DigitalProductRow[];
};

export function DigitalProductsAnalyticsPanel({
  revenueAnalytics,
  products,
}: DigitalProductsAnalyticsPanelProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            Statistiques des Revenus (30 derniers jours)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {revenueAnalytics ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Revenus totaux</p>
                <p className="text-2xl font-bold text-green-600">
                  {revenueAnalytics.total_revenue.toLocaleString()} XOF
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Commandes</p>
                <p className="text-2xl font-bold">{revenueAnalytics.total_orders}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Produits vendus</p>
                <p className="text-2xl font-bold">{revenueAnalytics.total_products_sold}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Panier moyen</p>
                <p className="text-2xl font-bold">
                  {revenueAnalytics.average_order_value.toLocaleString()} XOF
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <Skeleton className="h-32 w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Performance par Type</CardTitle>
        </CardHeader>
        <CardContent>
          <LazyRechartsWrapper>
            {recharts => {
              const typeStats = products.reduce(
                (acc, p) => {
                  const type = p.digital_type || 'other';
                  if (!acc[type]) {
                    acc[type] = { count: 0, downloads: 0 };
                  }
                  acc[type].count += 1;
                  acc[type].downloads += p.total_downloads || p.totalDownloads || 0;
                  return acc;
                },
                {} as Record<string, { count: number; downloads: number }>
              );

              const chartData = Object.entries(typeStats).map(([type, stats]) => ({
                name: type.charAt(0).toUpperCase() + type.slice(1),
                produits: stats.count,
                téléchargements: stats.downloads,
              }));

              return (
                <recharts.ResponsiveContainer width="100%" height={300}>
                  <recharts.BarChart data={chartData}>
                    <recharts.CartesianGrid strokeDasharray="3 3" />
                    <recharts.XAxis dataKey="name" />
                    <recharts.YAxis />
                    <recharts.Tooltip />
                    <recharts.Legend />
                    <recharts.Bar dataKey="produits" fill="#8b5cf6" name="Produits" />
                    <recharts.Bar dataKey="téléchargements" fill="#ec4899" name="Téléchargements" />
                  </recharts.BarChart>
                </recharts.ResponsiveContainer>
              );
            }}
          </LazyRechartsWrapper>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Top Produits par Téléchargements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...products]
              .sort(
                (a, b) =>
                  (b.total_downloads || b.totalDownloads || 0) -
                  (a.total_downloads || a.totalDownloads || 0)
              )
              .slice(0, 5)
              .map((p, index) => {
                const product = 'product' in p ? p.product : p;
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{product?.name || 'Produit sans nom'}</p>
                        <p className="text-sm text-muted-foreground">{p.digital_type || 'other'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{p.total_downloads || p.totalDownloads || 0}</p>
                      <p className="text-xs text-muted-foreground">téléchargements</p>
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
