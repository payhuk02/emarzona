import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Order } from "@/hooks/useOrders";
import { Package } from '@/components/icons';

interface TopProductsProps {
  orders: Order[];
  loading: boolean;
}

export const TopProducts = ({ orders, loading }: TopProductsProps) => {
  if (loading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Produits populaires</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 sm:h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  // This is a simplified version - in production you'd query order_items
  const hasData = orders.length > 0;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Produits populaires</CardTitle>
        <CardDescription className="text-xs sm:text-sm">Les plus vendus</CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-muted-foreground">
            <div className="p-4 rounded-full bg-gradient-to-br from-orange-500/10 to-red-500/5 mb-4 animate-in zoom-in duration-500 inline-block">
              <Package className="h-12 w-12 sm:h-16 sm:w-16 opacity-20" />
            </div>
            <p className="text-sm sm:text-base">Analyse détaillée des produits à venir</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-muted-foreground">
            <div className="p-4 rounded-full bg-gradient-to-br from-orange-500/10 to-red-500/5 mb-4 animate-in zoom-in duration-500 inline-block">
              <Package className="h-12 w-12 sm:h-16 sm:w-16 opacity-20" />
            </div>
            <p className="text-sm sm:text-base">Aucune vente de produit enregistrée</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
