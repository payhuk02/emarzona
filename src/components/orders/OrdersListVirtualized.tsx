/**
 * Orders List - Virtualized Version
 * Optimisé pour grandes listes avec @tanstack/react-virtual
 * Date: 2025-01-28
 */

import React, { useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Eye, Edit, Calendar, CreditCard, User, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OrderCard } from './OrderCard';
import type { Order } from '@/hooks/useOrders';

interface OrdersListVirtualizedProps {
  orders: Order[];
  onUpdate: () => void;
  storeId: string;
  className?: string;
  itemHeight?: number;
  containerHeight?: string;
}

const OrdersListVirtualizedComponent = ({
  orders,
  onUpdate,
  storeId,
  className,
  itemHeight = 200,
  containerHeight = '600px',
}: OrdersListVirtualizedProps) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: orders.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan: 5, // Nombre d'éléments à précharger en dehors de la zone visible
  });

  const items = virtualizer.getVirtualItems();

  if (orders.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Aucune commande</h3>
          <p className="text-muted-foreground">
            Les commandes apparaîtront ici une fois créées
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      <div
        ref={parentRef}
        className="overflow-auto scrollbar-hide"
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
            const order = orders[virtualItem.index];
            
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
                  <OrderCard
                    order={order}
                    onUpdate={onUpdate}
                    storeId={storeId}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Statistiques de performance */}
      <div className="mt-2 text-xs text-muted-foreground text-center">
        Affichage de {items.length} sur {orders.length} commandes
      </div>
    </div>
  );
};

// Optimisation avec React.memo pour éviter les re-renders inutiles
export const OrdersListVirtualized = React.memo(OrdersListVirtualizedComponent, (prevProps, nextProps) => {
  return (
    prevProps.orders.length === nextProps.orders.length &&
    prevProps.storeId === nextProps.storeId &&
    prevProps.onUpdate === nextProps.onUpdate &&
    prevProps.className === nextProps.className &&
    prevProps.itemHeight === nextProps.itemHeight &&
    prevProps.containerHeight === nextProps.containerHeight &&
    // Comparaison superficielle des orders (comparer les IDs)
    prevProps.orders.every((order, index) => 
      order.id === nextProps.orders[index]?.id &&
      order.status === nextProps.orders[index]?.status
    )
  );
});

OrdersListVirtualized.displayName = 'OrdersListVirtualized';

