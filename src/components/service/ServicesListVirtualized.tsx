/**
 * Services List - Virtualized Version
 * Optimisé pour grandes listes avec @tanstack/react-virtual
 * Date: 2025-01-28
 */

import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Eye, Edit, Clock, MapPin, Video, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import ServiceCard, { ServicesGrid } from './ServiceCard';
import type { ServiceProduct } from '@/hooks/service';
import type { Product } from '@/types/product';

interface ServicesListVirtualizedProps {
  services: (ServiceProduct & { product?: Product })[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
  className?: string;
  itemHeight?: number;
  containerHeight?: string;
}

export const ServicesListVirtualized = ({
  services,
  onEdit,
  onDelete,
  showActions = true,
  className,
  itemHeight = 300,
  containerHeight = '600px',
}: ServicesListVirtualizedProps) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: services.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan: 5, // Nombre d'éléments à précharger en dehors de la zone visible
  });

  const items = virtualizer.getVirtualItems();

  if (services.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Aucun service disponible</h3>
          <p className="text-muted-foreground">
            Créez votre premier service pour commencer à recevoir des réservations
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
            const service = services[virtualItem.index];

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
                  <ServiceCard
                    service={service}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    showActions={showActions}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Statistiques de performance */}
      <div className="mt-2 text-xs text-muted-foreground text-center">
        Affichage de {items.length} sur {services.length} services
      </div>
    </div>
  );
};
