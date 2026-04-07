/**
 * Physical Product Card Component
 * Date: 28 octobre 2025
 *
 * Card professionnelle pour produits physiques
 * Optimisé avec React.memo et LazyImage pour performance mobile
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
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
import { LazyImage } from '@/components/ui/LazyImage';
import { getImageAttributesForPreset } from '@/lib/image-transform';
import { PriceStockAlertButton } from '@/components/marketplace/PriceStockAlertButton';
import { supabase } from '@/integrations/supabase/client';

interface PhysicalProductCardProps {
  product: PhysicalProduct & { product?: Product };
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const PhysicalProductCardComponent = ({ product, onEdit, onDelete }: PhysicalProductCardProps) => {
  const navigate = useNavigate();
  const { data: inventory } = useInventory(product.id);
  const [_userId, setUserId] = useState<string | null>(null);

  // Récupérer l'utilisateur pour les alertes
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    fetchUser();
  }, []);

  // ✅ PHASE 5: Mémoriser le calcul du stock pour éviter recalculs à chaque render
  const stockLevel = useMemo(() => {
    return inventory?.reduce((total, inv) => total + (inv.quantity_available || 0), 0) || 0;
  }, [inventory]);

  // ✅ PHASE 5: Mémoriser le statut du stock pour éviter recalculs à chaque render
  const stockStatus = useMemo(() => {
    const lowStockThreshold = inventory?.[0]?.low_stock_threshold || 10;

    if (stockLevel === 0) {
      return { label: 'Rupture', variant: 'destructive' as const, icon: AlertTriangle };
    } else if (stockLevel < lowStockThreshold) {
      return {
        label: `Stock faible (${stockLevel})`,
        variant: 'secondary' as const,
        icon: AlertTriangle,
      };
    } else {
      return { label: `En stock (${stockLevel})`, variant: 'default' as const, icon: CheckCircle2 };
    }
  }, [stockLevel, inventory]);
  const StockIcon = stockStatus.icon;

  // Optimiser l'image avec LazyImage et presets
  const imageAttrs = product.product?.image_url
    ? getImageAttributesForPreset(product.product.image_url, 'productImage')
    : null;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Product Image */}
      <div className="relative aspect-square bg-muted">
        {product.product?.image_url && imageAttrs ? (
          <LazyImage
            {...imageAttrs}
            alt={product.product.name}
            placeholder="none"
            className="w-full h-full object-cover"
            format="webp"
            quality={85}
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
          <StableDropdownMenu
            triggerContent={<MoreVertical className="h-4 w-4" />}
            triggerProps={{
              variant: 'secondary' as const,
              size: 'icon' as const,
              className: 'h-8 w-8 sm:h-8 sm:w-8 min-h-[44px] min-w-[44px] touch-manipulation',
              'aria-label': `Actions pour ${product.name || product.id}`,
            }}
          >
            <SelectItem value="edit" onSelect={() => onEdit?.(product.id)}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </SelectItem>
            <SelectItem
              value="delete"
              onSelect={() => onDelete?.(product.id)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </SelectItem>
          </StableDropdownMenu>
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

            {/* Badge taux d'affiliation */}
            {(() => {
              if (!product.product?.product_affiliate_settings) return null;

              // Gérer le cas où Supabase retourne un objet ou un tableau
              const affiliateSettings = Array.isArray(product.product.product_affiliate_settings)
                ? product.product.product_affiliate_settings[0]
                : product.product.product_affiliate_settings;

              return affiliateSettings?.affiliate_enabled &&
                affiliateSettings?.commission_rate > 0 ? (
                <Badge
                  variant="secondary"
                  className="text-xs bg-gradient-to-r from-orange-500 to-pink-500 text-white border-0"
                  title={`Taux de commission d'affiliation: ${affiliateSettings.commission_rate}%`}
                >
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {affiliateSettings.commission_rate}% commission
                </Badge>
              ) : null;
            })()}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="space-y-3">
          {/* Price */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-baseline gap-1.5 sm:gap-2 min-w-0 flex-1">
              <p className="text-sm sm:text-base md:text-lg lg:text-2xl font-bold text-primary whitespace-nowrap">
                {product.product?.price?.toLocaleString() || 0} {product.product?.currency || 'XOF'}
              </p>
            </div>
            {product.product?.id && (
              <PriceStockAlertButton
                productId={product.product.id}
                productName={product.product.name}
                currentPrice={product.product.price || 0}
                currency={product.product.currency || 'XOF'}
                productType="physical"
                stockQuantity={stockLevel}
                variant="outline"
                size="sm"
                className="flex-shrink-0"
              />
            )}
          </div>

          {/* Stats */}
          {!product.product?.hide_purchase_count && (
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Ventes</p>
                <p className="font-semibold">{product.total_quantity_sold || 0}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Revenus</p>
                <p className="font-semibold">{(product.total_revenue || 0).toLocaleString()} XOF</p>
              </div>
            </div>
          )}

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
          onSelect={() => navigate(`/dashboard/products/${product.product_id}/edit`)}
        >
          <Edit className="h-4 w-4 mr-2" />
          Gérer le produit
        </Button>
      </CardFooter>
    </Card>
  );
};

// Optimisation avec React.memo pour éviter les re-renders inutiles
export const PhysicalProductCard = React.memo(
  PhysicalProductCardComponent,
  (prevProps, nextProps) => {
    // Comparaison personnalisée pour éviter re-renders inutiles
    return (
      prevProps.product.id === nextProps.product.id &&
      prevProps.product.product_id === nextProps.product.product_id &&
      prevProps.product.product?.price === nextProps.product.product?.price &&
      prevProps.product.product?.image_url === nextProps.product.product?.image_url &&
      prevProps.product.product?.name === nextProps.product.product?.name &&
      prevProps.product.total_quantity_sold === nextProps.product.total_quantity_sold &&
      prevProps.product.total_revenue === nextProps.product.total_revenue &&
      prevProps.onEdit === nextProps.onEdit &&
      prevProps.onDelete === nextProps.onDelete
    );
  }
);

PhysicalProductCard.displayName = 'PhysicalProductCard';

/**
 * Grid of Physical Product Cards
 */
interface PhysicalProductsGridProps {
  products: (PhysicalProduct & { product?: Product })[];
  loading?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

// ✅ PHASE 6: Optimiser PhysicalProductsGrid avec React.memo pour éviter re-renders inutiles
const PhysicalProductsGridComponent = ({
  products,
  loading,
  onEdit,
  onDelete,
}: PhysicalProductsGridProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
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
      {products.map(product => (
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

export const PhysicalProductsGrid = React.memo(
  PhysicalProductsGridComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.loading === nextProps.loading &&
      prevProps.products?.length === nextProps.products?.length &&
      prevProps.onEdit === nextProps.onEdit &&
      prevProps.onDelete === nextProps.onDelete
    );
  }
);

PhysicalProductsGrid.displayName = 'PhysicalProductsGrid';

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
