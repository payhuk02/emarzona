/**
 * OptimizedProductList Component
 * Date: 28 Janvier 2025
 * 
 * Liste de produits optimisée avec React.memo, virtual scrolling et lazy loading
 * Améliore les performances pour les grandes listes
 */

import React, { useMemo, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import type { UnifiedProduct } from '@/types/unified-product';

interface OptimizedProductListProps<T extends UnifiedProduct> {
  products: T[];
  renderProduct: (product: T, index: number) => React.ReactNode;
  containerRef?: React.RefObject<HTMLDivElement>;
  estimateSize?: number;
  overscan?: number;
  className?: string;
  emptyMessage?: string;
  loading?: boolean;
  loadingCount?: number;
}

/**
 * Composant de liste optimisé avec virtual scrolling
 */
export function OptimizedProductList<T extends UnifiedProduct>({
  products,
  renderProduct,
  containerRef,
  estimateSize = 300,
  overscan = 5,
  className,
  emptyMessage = 'Aucun produit trouvé',
  loading = false,
  loadingCount = 6,
}: OptimizedProductListProps<T>) {
  const parentRef = React.useRef<HTMLDivElement>(null);
  const finalContainerRef = containerRef || parentRef;

  // Virtualizer pour le virtual scrolling
  const virtualizer = useVirtualizer({
    count: products.length,
    getScrollElement: () => finalContainerRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  // Mémoriser les produits pour éviter les re-renders
  const memoizedProducts = useMemo(() => products, [products]);

  // Render optimisé avec React.memo
  const ProductItem = React.memo<{ product: T; index: number }>(
    ({ product, index }) => {
      return <>{renderProduct(product, index)}</>;
    },
    (prevProps, nextProps) => {
      return (
        prevProps.product.id === nextProps.product.id &&
        prevProps.product.updated_at === nextProps.product.updated_at
      );
    }
  );

  ProductItem.displayName = 'ProductItem';

  if (loading) {
    return (
      <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4', className)}>
        {Array.from({ length: loadingCount }).map((_, i) => (
          <Skeleton key={i} className="h-64 w-full" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  // Pour les petites listes, pas besoin de virtual scrolling
  if (products.length < 20) {
    return (
      <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4', className)}>
        {memoizedProducts.map((product, index) => (
          <ProductItem key={product.id} product={product} index={index} />
        ))}
      </div>
    );
  }

  // Virtual scrolling pour les grandes listes
  const items = virtualizer.getVirtualItems();

  return (
    <div
      ref={finalContainerRef}
      className={cn('h-full overflow-auto', className)}
      role="list"
      aria-label="Liste de produits"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            transform: `translateY(${items[0]?.start ?? 0}px)`,
          }}
        >
          {items.map((virtualItem) => {
            const product = memoizedProducts[virtualItem.index];
            return (
              <div
                key={virtualItem.key}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                style={{
                  minHeight: `${virtualItem.size}px`,
                }}
              >
                <ProductItem product={product} index={virtualItem.index} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

