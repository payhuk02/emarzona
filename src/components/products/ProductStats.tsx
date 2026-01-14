import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  DollarSign,
  Star,
  BarChart3,
  PackageCheck,
  AlertTriangle,
  PackageX,
} from 'lucide-react';
import { Product } from '@/hooks/useProducts';
import { calculateStockStatus, needsRestock } from '@/lib/stockUtils';

interface ProductStatsProps {
  products: Product[];
  filteredProducts?: Product[]; // Optionnel: pour afficher les stats des produits filtrés si nécessaire
}

const ProductStats = ({ products, filteredProducts }: ProductStatsProps) => {
  // Utiliser filteredProducts si fourni, sinon utiliser products (stats globales)
  const productsToDisplay =
    filteredProducts && filteredProducts.length > 0 ? filteredProducts : products;
  const { t } = useTranslation();
  // ✅ PHASE 8: Mémoriser tous les calculs coûteux pour éviter recalculs à chaque render
  const basicStats = useMemo(() => {
    const totalProducts = productsToDisplay.length;
    const activeProducts = productsToDisplay.filter(p => p.is_active).length;
    const inactiveProducts = totalProducts - activeProducts;

    return {
      totalProducts,
      activeProducts,
      inactiveProducts,
    };
  }, [productsToDisplay]);

  const revenueStats = useMemo(() => {
    const totalRevenue = productsToDisplay.reduce((sum, product) => sum + product.price, 0);
    const averagePrice = basicStats.totalProducts > 0 ? totalRevenue / basicStats.totalProducts : 0;

    return {
      totalRevenue,
      averagePrice,
    };
  }, [productsToDisplay, basicStats.totalProducts]);

  const ratingStats = useMemo(() => {
    const totalRating = productsToDisplay.reduce((sum, product) => sum + product.rating, 0);
    const averageRating = basicStats.totalProducts > 0 ? totalRating / basicStats.totalProducts : 0;
    const totalReviews = productsToDisplay.reduce((sum, product) => sum + product.reviews_count, 0);

    return {
      totalRating,
      averageRating,
      totalReviews,
    };
  }, [productsToDisplay, basicStats.totalProducts]);

  const categoryStats = useMemo(() => {
    const categories = productsToDisplay.reduce(
      (acc, product) => {
        if (product.category) {
          acc[product.category] = (acc[product.category] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>
    );

    const topCategory = Object.entries(categories).sort(([, a], [, b]) => b - a)[0];

    return {
      categories,
      topCategory,
    };
  }, [productsToDisplay]);

  // Statistiques de stock
  const stockStats = useMemo(() => {
    const productsWithInventory = productsToDisplay.filter(
      p => p.track_inventory !== false && p.product_type !== 'digital'
    );

    return productsWithInventory.reduce(
      (acc, product) => {
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
        if (
          needsRestock(product.stock_quantity, product.low_stock_threshold, product.track_inventory)
        ) {
          acc.needsRestock++;
        }

        return acc;
      },
      {
        in_stock: 0,
        low_stock: 0,
        out_of_stock: 0,
        totalStockValue: 0,
        needsRestock: 0,
        productsWithInventory: productsWithInventory.length,
      }
    );
  }, [productsToDisplay]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
      <Card className="group hover:shadow-md transition-all duration-300 border-border/50 hover:border-primary/20 bg-card/50 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4 lg:p-6">
          <CardTitle className="text-xs sm:text-sm lg:text-base font-medium line-clamp-2">
            {t('products.stats.totalProducts', 'Produits totaux')}
          </CardTitle>
          <Package className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-muted-foreground group-hover:text-primary transition-colors duration-200 flex-shrink-0 ml-2" />
        </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
          <div className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 sm:mb-3">
            {basicStats.totalProducts}
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <Badge
              variant="secondary"
              className="text-xs sm:text-sm animate-in zoom-in-95 duration-200"
            >
              {t('products.stats.active', '{{count}} actifs', { count: basicStats.activeProducts })}
            </Badge>
            <Badge variant="outline" className="text-xs sm:text-sm">
              {t('products.stats.inactive', '{{count}} inactifs', {
                count: basicStats.inactiveProducts,
              })}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="group hover:shadow-md transition-all duration-300 border-border/50 hover:border-primary/20 bg-card/50 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4 lg:p-6">
          <CardTitle className="text-xs sm:text-sm lg:text-base font-medium line-clamp-2">
            {t('products.stats.potentialRevenue', 'Revenus potentiels')}
          </CardTitle>
          <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-muted-foreground group-hover:text-primary transition-colors duration-200 flex-shrink-0 ml-2" />
        </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
          <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold mb-2 break-words">
            {revenueStats.totalRevenue.toLocaleString()} FCFA
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
            {t('products.stats.averagePrice', 'Prix moyen: {{price}} FCFA', {
              price: revenueStats.averagePrice.toLocaleString(),
            })}
          </p>
        </CardContent>
      </Card>

      <Card className="group hover:shadow-md transition-all duration-300 border-border/50 hover:border-primary/20 bg-card/50 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4 lg:p-6">
          <CardTitle className="text-xs sm:text-sm lg:text-base font-medium line-clamp-2">
            {t('products.stats.performance', 'Performance')}
          </CardTitle>
          <Star className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-muted-foreground group-hover:text-primary transition-colors duration-200 fill-yellow-400/50 group-hover:fill-yellow-400 flex-shrink-0 ml-2" />
        </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
          <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold mb-2">
            {ratingStats.averageRating.toFixed(1)}/5
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {t('products.stats.totalReviews', '{{count}} avis au total', {
              count: ratingStats.totalReviews,
            })}
          </p>
        </CardContent>
      </Card>

      <Card className="group hover:shadow-md transition-all duration-300 border-border/50 hover:border-primary/20 bg-card/50 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4 lg:p-6">
          <CardTitle className="text-xs sm:text-sm lg:text-base font-medium line-clamp-2">
            {t('products.stats.topCategory', 'Top catégorie')}
          </CardTitle>
          <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-muted-foreground group-hover:text-primary transition-colors duration-200 flex-shrink-0 ml-2" />
        </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
          <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold mb-2 line-clamp-1 break-words">
            {categoryStats.topCategory
              ? categoryStats.topCategory[0]
              : t('products.stats.noCategory', 'Aucune')}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {categoryStats.topCategory
              ? t('products.stats.categoryCount', '{{count}} produit', {
                  count: categoryStats.topCategory[1],
                })
              : t('products.stats.noCategoryProducts', 'Pas de catégorie')}
          </p>
        </CardContent>
      </Card>

      {/* Nouvelle carte : Statistiques de stock */}
      <Card
        className={`group hover:shadow-md transition-all duration-300 border-border/50 hover:border-primary/20 bg-card/50 backdrop-blur-sm ${stockStats.needsRestock > 0 ? 'border-orange-500/50 shadow-orange-500/10' : ''}`}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4 lg:p-6">
          <CardTitle className="text-xs sm:text-sm lg:text-base font-medium line-clamp-2">
            {t('products.stats.stockStatus', 'État des stocks')}
          </CardTitle>
          {stockStats.needsRestock > 0 ? (
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-orange-500 animate-pulse flex-shrink-0 ml-2" />
          ) : (
            <PackageCheck className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-green-500 group-hover:scale-110 transition-transform duration-200 flex-shrink-0 ml-2" />
          )}
        </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
          {stockStats.productsWithInventory > 0 ? (
            <>
              <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold">
                  {stockStats.productsWithInventory}
                </div>
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {t('products.stats.products', 'produits')}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                {stockStats.in_stock > 0 && (
                  <Badge
                    variant="outline"
                    className="text-xs sm:text-sm bg-green-500/20 text-green-400 border-green-500/30 animate-in zoom-in-95 duration-200"
                  >
                    <PackageCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                    {stockStats.in_stock}
                  </Badge>
                )}
                {stockStats.low_stock > 0 && (
                  <Badge
                    variant="outline"
                    className="text-xs sm:text-sm bg-orange-500/20 text-orange-400 border-orange-500/30 animate-in zoom-in-95 duration-200"
                  >
                    <AlertTriangle className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                    {stockStats.low_stock}
                  </Badge>
                )}
                {stockStats.out_of_stock > 0 && (
                  <Badge
                    variant="outline"
                    className="text-xs sm:text-sm bg-red-500/20 text-red-400 border-red-500/30 animate-in zoom-in-95 duration-200"
                  >
                    <PackageX className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                    {stockStats.out_of_stock}
                  </Badge>
                )}
              </div>
              {stockStats.needsRestock > 0 && (
                <p className="text-xs sm:text-sm text-orange-500 font-medium mt-2 animate-in fade-in duration-300">
                  ⚠️{' '}
                  {t('products.stats.needsRestock', '{{count}} produit à réapprovisionner', {
                    count: stockStats.needsRestock,
                  })}
                </p>
              )}
            </>
          ) : (
            <div className="text-sm sm:text-base text-muted-foreground">
              {t('products.stats.noInventory', 'Aucun produit avec inventaire')}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductStats;
