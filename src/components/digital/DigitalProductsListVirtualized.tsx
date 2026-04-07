/**
 * Digital Products List - Virtualized Version
 * Optimisé pour grandes listes avec @tanstack/react-virtual
 * Date: 2025-01-27
 */

import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Eye, Edit, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DigitalProductItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  digital_type?: string;
  total_downloads?: number;
  totalDownloads?: number;
  status?: string;
  is_active?: boolean;
  slug?: string;
}

interface DigitalProductsListVirtualizedProps {
  products: DigitalProductItem[];
  onView?: (productId: string) => void;
  onEdit?: (productId: string) => void;
  className?: string;
  itemHeight?: number;
  containerHeight?: string;
}

const DigitalProductsListVirtualizedComponent = ({
  products,
  onView,
  onEdit,
  className,
  itemHeight = 200,
  containerHeight = '600px',
}: DigitalProductsListVirtualizedProps) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: products.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan: 5, // Nombre d'éléments à précharger en dehors de la zone visible
  });

  const items = virtualizer.getVirtualItems();

  return (
    <div className={cn('w-full', className)}>
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ height: containerHeight }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {items.map((virtualItem) => {
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
                <Card className="group hover:shadow-md transition-all duration-300 border-border/50 hover:border-primary/30 bg-card/50 backdrop-blur-sm m-2">
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <div className="relative w-full sm:w-32 lg:w-40 h-40 sm:h-full min-h-[160px] overflow-hidden rounded-t-lg sm:rounded-l-lg sm:rounded-tr-none bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name || 'Produit digital'}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-12 w-12 text-white/70" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2 line-clamp-2">
                            {product.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-3">
                            {product.digital_type && (
                              <Badge variant="secondary">{product.digital_type}</Badge>
                            )}
                            <Badge variant="outline">
                              <Download className="h-3 w-3 mr-1" />
                              {product.total_downloads || product.totalDownloads || 0} téléchargements
                            </Badge>
                            <Badge variant="outline" className="font-semibold">
                              {product.price?.toLocaleString() || 0} XOF
                            </Badge>
                          </div>
                          {product.description && (
                            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-2 sm:mb-3">
                              {product.description}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {onView && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onView(product.id)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              <span className="hidden sm:inline">Voir</span>
                            </Button>
                          )}
                          {onEdit && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onEdit(product.id)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              <span className="hidden sm:inline">Modifier</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
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
export const DigitalProductsListVirtualized = React.memo(DigitalProductsListVirtualizedComponent, (prevProps, nextProps) => {
  return (
    prevProps.products.length === nextProps.products.length &&
    prevProps.onView === nextProps.onView &&
    prevProps.onEdit === nextProps.onEdit &&
    prevProps.className === nextProps.className &&
    prevProps.itemHeight === nextProps.itemHeight &&
    prevProps.containerHeight === nextProps.containerHeight &&
    // Comparaison superficielle des products (comparer les IDs)
    prevProps.products.every((product, index) => 
      product.id === nextProps.products[index]?.id &&
      product.is_active === nextProps.products[index]?.is_active &&
      product.price === nextProps.products[index]?.price
    )
  );
});

DigitalProductsListVirtualized.displayName = 'DigitalProductsListVirtualized';







