import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Order } from "@/hooks/useOrders";
import { BarChart3 } from "lucide-react";

interface SalesChartProps {
  orders: Order[];
  loading: boolean;
}

export const SalesChart = ({ orders, loading }: SalesChartProps) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ventes par mois</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
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
    <Card>
      <CardHeader>
        <CardTitle>Ventes par mois</CardTitle>
        <CardDescription>Évolution du chiffre d'affaires</CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="space-y-4">
            {months.map((month) => {
              const amount = salesByMonth[month];
              const maxAmount = Math.max(...Object.values(salesByMonth));
              const percentage = (amount / maxAmount) * 100;

              return (
                <div key={month} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{month}</span>
                    <span className="text-muted-foreground">
                      {amount.toLocaleString()} XOF
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mb-2" />
            <p>Aucune donnée de vente disponible</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
