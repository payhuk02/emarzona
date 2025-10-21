import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  TrendingUp, 
  DollarSign, 
  Star,
  Eye,
  EyeOff,
  BarChart3,
  Calendar,
  ShoppingCart
} from "lucide-react";
import { Product } from "@/hooks/useProducts";

interface ProductStatsProps {
  products: Product[];
  filteredProducts: Product[];
}

const ProductStats = ({ products, filteredProducts }: ProductStatsProps) => {
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.is_active).length;
  const inactiveProducts = totalProducts - activeProducts;
  
  const totalRevenue = products.reduce((sum, product) => sum + product.price, 0);
  const averagePrice = totalProducts > 0 ? totalRevenue / totalProducts : 0;
  
  const totalRating = products.reduce((sum, product) => sum + product.rating, 0);
  const averageRating = totalProducts > 0 ? totalRating / totalProducts : 0;
  
  const totalReviews = products.reduce((sum, product) => sum + product.reviews_count, 0);
  
  // Simuler des ventes (en attendant les vraies données)
  const totalSales = Math.floor(Math.random() * 100) + totalProducts;
  const totalViews = Math.floor(Math.random() * 1000) + totalProducts * 10;

  const categories = products.reduce((acc, product) => {
    if (product.category) {
      acc[product.category] = (acc[product.category] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const topCategory = Object.entries(categories).sort(([,a], [,b]) => b - a)[0];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Produits totaux</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalProducts}</div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="text-xs">
              {activeProducts} actifs
            </Badge>
            <Badge variant="outline" className="text-xs">
              {inactiveProducts} inactifs
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Revenus potentiels</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalRevenue.toLocaleString()} FCFA</div>
          <p className="text-xs text-muted-foreground mt-1">
            Prix moyen: {averagePrice.toLocaleString()} FCFA
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Performance</CardTitle>
          <Star className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{averageRating.toFixed(1)}/5</div>
          <p className="text-xs text-muted-foreground mt-1">
            {totalReviews} avis au total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top catégorie</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {topCategory ? topCategory[0] : "Aucune"}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {topCategory ? `${topCategory[1]} produit${topCategory[1] > 1 ? "s" : ""}` : "Pas de catégorie"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductStats;
