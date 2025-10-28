/**
 * Physical Product Card Component
 * Date: 28 octobre 2025
 * 
 * Card professionnelle pour produits physiques
 */

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Package,
  Edit,
  Trash2,
  MoreVertical,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Truck,
  Layers,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '@/hooks/physical/useInventory';
import type { PhysicalProduct } from '@/hooks/physical/usePhysicalProducts';

interface PhysicalProductCardProps {
  product: PhysicalProduct & { product?: any };
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const PhysicalProductCard = ({
  product,
  onEdit,
  onDelete,
}: PhysicalProductCardProps) => {
  const navigate = useNavigate();
  const { data: inventory } = useInventory(product.id);

  const getStockStatus = () => {
    // Get stock level from inventory data
    const stockLevel = inventory?.reduce((total, inv) => total + (inv.quantity_available || 0), 0) || 0;
    const lowStockThreshold = inventory?.[0]?.low_stock_threshold || 10;

    if (stockLevel === 0) {
      return { label: 'Rupture', variant: 'destructive' as const, icon: AlertTriangle };
    } else if (stockLevel < lowStockThreshold) {
      return { label: `Stock faible (${stockLevel})`, variant: 'secondary' as const, icon: AlertTriangle };
    } else {
      return { label: `En stock (${stockLevel})`, variant: 'default' as const, icon: CheckCircle2 };
    }
  };

  const stockStatus = getStockStatus();
  const StockIcon = stockStatus.icon;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Product Image */}
      <div className="relative aspect-square bg-muted">
        {product.product?.image_url ? (
          <img
            src={product.product.image_url}
            alt={product.product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-16 w-16 text-muted-foreground" />
          </div>
        )}

        {/* Stock Badge */}
        <div className="absolute top-2 left-2">
          <Badge variant={stockStatus.variant} className="gap-1">
            <StockIcon className="h-3 w-3" />
            {stockStatus.label}
          </Badge>
        </div>

        {/* Actions Menu */}
        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(product.id)}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete?.(product.id)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Product Info */}
      <CardHeader className="pb-3">
        <div className="space-y-2">
          <h3 className="font-semibold text-lg line-clamp-2">
            {product.product?.name || 'Produit sans nom'}
          </h3>
          
          <div className="flex items-center gap-2 flex-wrap">
            {product.has_variants && (
              <Badge variant="outline" className="gap-1">
                <Layers className="h-3 w-3" />
                Variantes
              </Badge>
            )}
            {product.requires_shipping && (
              <Badge variant="outline" className="gap-1">
                <Truck className="h-3 w-3" />
                Livraison
              </Badge>
            )}
            {product.sku && (
              <Badge variant="secondary" className="font-mono text-xs">
                {product.sku}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="space-y-3">
          {/* Price */}
          <div>
            <p className="text-2xl font-bold text-primary">
              {product.product?.price?.toLocaleString() || 0} XOF
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Ventes</p>
              <p className="font-semibold">{product.total_quantity_sold || 0}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Revenus</p>
              <p className="font-semibold">
                {(product.total_revenue || 0).toLocaleString()} XOF
              </p>
            </div>
          </div>

          {/* Shipping Info */}
          {product.requires_shipping && (
            <div className="text-xs text-muted-foreground">
              <p>
                Poids: {product.weight} {product.weight_unit}
              </p>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-3">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate(`/dashboard/products/${product.product_id}/edit`)}
        >
          <Edit className="h-4 w-4 mr-2" />
          Gérer le produit
        </Button>
      </CardFooter>
    </Card>
  );
};

/**
 * Grid of Physical Product Cards
 */
interface PhysicalProductsGridProps {
  products: (PhysicalProduct & { product?: any })[];
  loading?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const PhysicalProductsGrid = ({
  products,
  loading,
  onEdit,
  onDelete,
}: PhysicalProductsGridProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="overflow-hidden">
            <div className="aspect-square bg-muted animate-pulse" />
            <CardContent className="p-4 space-y-3">
              <div className="h-6 bg-muted rounded animate-pulse" />
              <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
              <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Aucun produit physique</h3>
          <p className="text-muted-foreground">
            Créez votre premier produit physique pour commencer
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <PhysicalProductCard
          key={product.id}
          product={product}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

/**
 * Skeleton for loading state
 */
export const PhysicalProductCardSkeleton = () => (
  <Card className="overflow-hidden">
    <div className="aspect-square bg-muted animate-pulse" />
    <CardHeader className="pb-3">
      <div className="space-y-2">
        <div className="h-6 bg-muted rounded animate-pulse" />
        <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
      </div>
    </CardHeader>
    <CardContent className="pb-3 space-y-3">
      <div className="h-8 bg-muted rounded w-1/2 animate-pulse" />
      <div className="grid grid-cols-2 gap-2">
        <div className="h-10 bg-muted rounded animate-pulse" />
        <div className="h-10 bg-muted rounded animate-pulse" />
      </div>
    </CardContent>
    <CardFooter>
      <div className="h-10 bg-muted rounded w-full animate-pulse" />
    </CardFooter>
  </Card>
);

