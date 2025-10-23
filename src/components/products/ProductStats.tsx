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
  ShoppingCart,
  PackageCheck,
  AlertTriangle,
  PackageX
} from "lucide-react";
import { Product } from "@/hooks/useProducts";
import { calculateStockStatus, needsRestock } from "@/lib/stockUtils";

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

  // Statistiques de stock
  const productsWithInventory = products.filter(p => 
    p.track_inventory !== false && p.product_type !== 'digital'
  );
  
  const stockStats = productsWithInventory.reduce((acc, product) => {
    const status = calculateStockStatus(
      product.stock_quantity,
      product.low_stock_threshold,
      product.track_inventory ?? true
    );
    
    acc[status] = (acc[status] || 0) + 1;
    
    // Calculer la valeur du stock
    const quantity = product.stock_quantity || 0;
    acc.totalStockValue += product.price * quantity;
    
    // Compter les produits nécessitant un réapprovisionnement
    if (needsRestock(product.stock_quantity, product.low_stock_threshold, product.track_inventory)) {
      acc.needsRestock++;
    }
    
    return acc;
  }, {
    in_stock: 0,
    low_stock: 0,
    out_of_stock: 0,
    totalStockValue: 0,
    needsRestock: 0,
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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

      {/* Nouvelle carte : Statistiques de stock */}
      <Card className={stockStats.needsRestock > 0 ? "border-orange-500/50" : ""}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">État des stocks</CardTitle>
          {stockStats.needsRestock > 0 ? (
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          ) : (
            <PackageCheck className="h-4 w-4 text-green-500" />
          )}
        </CardHeader>
        <CardContent>
          {productsWithInventory.length > 0 ? (
            <>
              <div className="flex items-center gap-2 mb-2">
                <div className="text-2xl font-bold">{productsWithInventory.length}</div>
                <span className="text-sm text-muted-foreground">produits</span>
              </div>
              <div className="flex flex-wrap items-center gap-1">
                {stockStats.in_stock > 0 && (
                  <Badge variant="outline" className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                    <PackageCheck className="h-3 w-3 mr-1" />
                    {stockStats.in_stock}
                  </Badge>
                )}
                {stockStats.low_stock > 0 && (
                  <Badge variant="outline" className="text-xs bg-orange-500/20 text-orange-400 border-orange-500/30">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {stockStats.low_stock}
                  </Badge>
                )}
                {stockStats.out_of_stock > 0 && (
                  <Badge variant="outline" className="text-xs bg-red-500/20 text-red-400 border-red-500/30">
                    <PackageX className="h-3 w-3 mr-1" />
                    {stockStats.out_of_stock}
                  </Badge>
                )}
              </div>
              {stockStats.needsRestock > 0 && (
                <p className="text-xs text-orange-500 font-medium mt-2">
                  ⚠️ {stockStats.needsRestock} produit{stockStats.needsRestock > 1 ? "s" : ""} à réapprovisionner
                </p>
              )}
            </>
          ) : (
            <div className="text-sm text-muted-foreground">
              Aucun produit avec inventaire
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductStats;
