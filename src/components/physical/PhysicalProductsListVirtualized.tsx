/**
 * Physical Products List - Virtualized Version
 * Optimisé pour grandes listes avec @tanstack/react-virtual
 * Date: 2025-01-28
 */

import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Eye, Edit, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PhysicalProductCard } from './PhysicalProductCard';
import type { PhysicalProduct } from '@/hooks/physical/usePhysicalProducts';

interface PhysicalProductsListVirtualizedProps {
  products: (PhysicalProduct & { product?: unknown })[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
  itemHeight?: number;
  containerHeight?: string;
}

const PhysicalProductsListVirtualizedComponent = ({
  products,
  onEdit,
  onDelete,
  className,
  itemHeight = 300,
  containerHeight = '600px',
}: PhysicalProductsListVirtualizedProps) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: products.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan: 5, // Nombre d'éléments à précharger en dehors de la zone visible
  });

  const items = virtualizer.getVirtualItems();

  if (products.length === 0) {
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
    <div className={cn('w-full', className)}>
      <div
        ref={parentRef}
        className="overflow-auto scrollbar-hide overscroll-contain [-webkit-overflow-scrolling:touch]"
        style={{ height: containerHeight }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {items.map(virtualItem => {
            const product = products[virtualItem.index];

            return (
              <div
                key={virtualItem.key}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <div className="p-2">
                  <PhysicalProductCard product={product} onEdit={onEdit} onDelete={onDelete} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Statistiques de performance */}
      <div className="mt-2 text-xs text-muted-foreground text-center">
        Affichage de {items.length} sur {products.length} produits
      </div>
    </div>
  );
};

// Optimisation avec React.memo pour éviter les re-renders inutiles
export const PhysicalProductsListVirtualized = React.memo(
  PhysicalProductsListVirtualizedComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.products.length === nextProps.products.length &&
      prevProps.onEdit === nextProps.onEdit &&
      prevProps.onDelete === nextProps.onDelete &&
      prevProps.className === nextProps.className &&
      prevProps.itemHeight === nextProps.itemHeight &&
      prevProps.containerHeight === nextProps.containerHeight &&
      // Comparaison superficielle des products (comparer les IDs)
      prevProps.products.every(
        (product, index) =>
          product.id === nextProps.products[index]?.id &&
          product.is_active === nextProps.products[index]?.is_active
      )
    );
  }
);

PhysicalProductsListVirtualized.displayName = 'PhysicalProductsListVirtualized';






