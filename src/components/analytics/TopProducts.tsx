import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Order } from "@/hooks/useOrders";
import { Package } from "lucide-react";

interface TopProductsProps {
  orders: Order[];
  loading: boolean;
}

export const TopProducts = ({ orders, loading }: TopProductsProps) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Produits populaires</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  // This is a simplified version - in production you'd query order_items
  const hasData = orders.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Produits populaires</CardTitle>
        <CardDescription>Les plus vendus</CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mb-2" />
              <p>Analyse détaillée des produits à venir</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Package className="h-12 w-12 mb-2" />
            <p>Aucune vente de produit enregistrée</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
