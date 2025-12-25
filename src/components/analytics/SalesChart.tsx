import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Order } from "@/hooks/useOrders";
import { BarChart3 } from '@/components/icons';

interface SalesChartProps {
  orders: Order[];
  loading: boolean;
}

export const SalesChart = ({ orders, loading }: SalesChartProps) => {
  if (loading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Ventes par mois</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 sm:h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Group orders by month
  const salesByMonth: Record<string, number> = {};
  orders.forEach((order) => {
    const date = new Date(order.created_at);
    const monthKey = date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
    salesByMonth[monthKey] = (salesByMonth[monthKey] || 0) + Number(order.total_amount);
  });

  const months = Object.keys(salesByMonth).slice(-6);
  const hasData = months.length > 0;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Ventes par mois</CardTitle>
        <CardDescription className="text-xs sm:text-sm">Évolution du chiffre d'affaires</CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="space-y-3 sm:space-y-4">
            {months.map((month) => {
              const amount = salesByMonth[month];
              const maxAmount = Math.max(...Object.values(salesByMonth));
              const percentage = (amount / maxAmount) * 100;

              return (
                <div key={month} className="space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="font-medium">{month}</span>
                    <span className="text-muted-foreground">
                      {amount.toLocaleString()} XOF
                    </span>
                  </div>
                  <div className="w-full bg-muted/50 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-muted-foreground">
            <div className="p-4 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/5 mb-4 animate-in zoom-in duration-500 inline-block">
              <BarChart3 className="h-12 w-12 sm:h-16 sm:w-16 opacity-20" />
            </div>
            <p className="text-sm sm:text-base">Aucune donnée de vente disponible</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
