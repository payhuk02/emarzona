import React, { useMemo } from 'react';
import { useSameStoreProducts } from '@/hooks/useSameStoreProducts';
import { ProductGrid } from '@/components/ui/ProductGrid';
import UnifiedProductCard from '@/components/products/UnifiedProductCard';
import { transformToUnifiedProduct } from '@/lib/product-transform';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Store } from '@/components/icons';

export interface SameStoreProductsSectionProps {
  productId: string;
  storeId?: string;
  storeName?: string;
  limit?: number;
  className?: string;
  /** Enveloppe Card + en-tête (page produit générique). Sinon titre simple (pages détail typées). */
  withCard?: boolean;
}

/**
 * Autres produits de la même boutique — cartes alignées sur le Marketplace (UnifiedProductCard).
 */
export const SameStoreProductsSection: React.FC<SameStoreProductsSectionProps> = ({
  productId,
  storeId,
  storeName,
  limit = 4,
  className = '',
  withCard = false,
}) => {
  const {
    data: recommendations,
    isLoading,
    error,
  } = useSameStoreProducts(productId, storeId, limit);

  const resolvedStoreName = storeName ?? recommendations?.[0]?.stores?.name;
  const sectionTitle = resolvedStoreName
    ? `Autres produits de ${resolvedStoreName}`
    : 'De la même boutique';

  const products = useMemo(() => {
    if (!recommendations) return [];

    return recommendations.map(rec =>
      transformToUnifiedProduct({
        id: rec.id,
        name: rec.name,
        slug: rec.slug,
        image_url: rec.image_url ?? undefined,
        price: rec.price,
        promotional_price: rec.promotional_price ?? undefined,
        currency: rec.currency ?? undefined,
        category: rec.category ?? undefined,
        product_type: rec.product_type as 'digital' | 'physical' | 'service' | 'course' | 'artist',
        store_id: rec.store_id,
        stores: rec.stores,
        created_at: (rec as { created_at?: string }).created_at ?? new Date().toISOString(),
      })
    );
  }, [recommendations]);

  if (error) {
    return null;
  }

  const loadingGrid = (
    <ProductGrid>
      {Array.from({ length: limit }).map((_, index) => (
        <Skeleton key={index} className="h-96 w-full" />
      ))}
    </ProductGrid>
  );

  if (isLoading) {
    if (withCard) {
      return (
        <div className={className}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5 text-purple-500" />
                {sectionTitle}
              </CardTitle>
            </CardHeader>
            <CardContent>{loadingGrid}</CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className={`space-y-4 ${className}`}>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Store className="h-5 w-5" />
          {sectionTitle}
        </h3>
        {loadingGrid}
      </div>
    );
  }

  if (!products.length) {
    return null;
  }

  const grid = (
    <ProductGrid>
      {products.map(product => (
        <UnifiedProductCard
          key={product.id}
          product={product}
          variant="marketplace"
          showAffiliate={true}
          showActions={true}
        />
      ))}
    </ProductGrid>
  );

  if (withCard) {
    return (
      <div className={className}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-purple-500" />
              {sectionTitle}
            </CardTitle>
          </CardHeader>
          <CardContent>{grid}</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Store className="h-5 w-5" />
        {sectionTitle}
      </h3>
      {grid}
    </div>
  );
};

SameStoreProductsSection.displayName = 'SameStoreProductsSection';
