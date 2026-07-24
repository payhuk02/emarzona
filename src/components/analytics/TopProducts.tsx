import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Package } from '@/components/icons';
import type { ProductType } from '@/hooks/useUnifiedAnalytics';

type TopProductRow = {
  id: string;
  name: string;
  type: ProductType | string;
  revenue: number;
  orders: number;
  units: number;
};

interface TopProductsProps {
  products: TopProductRow[];
  loading: boolean;
}

const formatFcfa = (amount: number) => `${Math.round(amount).toLocaleString('fr-FR')} FCFA`;

export const TopProducts = ({ products, loading }: TopProductsProps) => {
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

  const hasData = products.length > 0;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Produits populaires</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Top ventes sur la période sélectionnée
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ul className="space-y-3">
            {products.slice(0, 8).map((product, index) => (
              <li
                key={product.id}
                className="flex items-center justify-between gap-3 border-b border-border/40 pb-2 last:border-0"
              >
                <div className="min-w-0 flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground w-5">
                    {index + 1}.
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {product.units} u. · {product.orders} cmd · {product.type}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-semibold shrink-0">{formatFcfa(product.revenue)}</p>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-muted-foreground">
            <div className="p-4 rounded-full bg-muted mb-4">
              <Package className="h-12 w-12 sm:h-16 sm:w-16 opacity-40" />
            </div>
            <p className="text-sm sm:text-base">Aucune vente de produit sur cette période</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
