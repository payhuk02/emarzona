/**
 * VirtualizedList - Liste verticale avec virtual scrolling
 * Optimisé pour grandes listes (20+ éléments)
 * Utilise @tanstack/react-virtual pour améliorer les performances
 * 
 * Date: 30 Janvier 2025
 */

import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface VirtualizedListProps {
  /**
   * Nombre total d'éléments à afficher
   */
  count: number;
  /**
   * Fonction de rendu pour chaque élément
   */
  renderItem: (index: number) => React.ReactNode;
  /**
   * Hauteur estimée d'un élément (en pixels)
   * @default 100 (mobile), 120 (desktop)
   */
  estimateSize?: number;
  /**
   * Nombre d'éléments à précharger en dehors du viewport
   * @default 3 (mobile), 5 (desktop)
   */
  overscan?: number;
  /**
   * Classe CSS pour le conteneur
   */
  className?: string;
  /**
   * Classe CSS pour chaque item
   */
  itemClassName?: string;
  /**
   * Message à afficher si la liste est vide
   */
  emptyMessage?: string;
  /**
   * État de chargement
   */
  loading?: boolean;
  /**
   * Nombre de skeletons à afficher pendant le chargement
   */
  loadingCount?: number;
  /**
   * Seuil minimum pour activer le virtual scrolling
   * @default 20
   */
  threshold?: number;
  /**
   * Ref du conteneur parent (optionnel)
   */
  containerRef?: React.RefObject<HTMLDivElement>;
}

/**
 * Composant de liste virtualisée
 * Active automatiquement le virtual scrolling pour les listes de 20+ éléments
 */
export const VirtualizedList: React.FC<VirtualizedListProps> = ({
  count,
  renderItem,
  estimateSize,
  overscan,
  className,
  itemClassName,
  emptyMessage = 'Aucun élément trouvé',
  loading = false,
  loadingCount = 6,
  threshold = 20,
  containerRef: externalContainerRef,
}) => {
  const isMobile = useIsMobile();
  const internalContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = externalContainerRef || internalContainerRef;

  // Calculer les valeurs par défaut selon le device
  const defaultEstimateSize = estimateSize ?? (isMobile ? 100 : 120);
  const defaultOverscan = overscan ?? (isMobile ? 3 : 5);

  // Virtualizer pour le virtual scrolling
  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => containerRef.current,
    estimateSize: () => defaultEstimateSize,
    overscan: defaultOverscan,
    // Mesure dynamique pour s'adapter aux différentes tailles d'éléments
    measureElement: (element) => element?.getBoundingClientRect().height ?? defaultEstimateSize,
  });

  // État de chargement
  if (loading) {
    return (
      <div className={cn('space-y-3 sm:space-y-4', className)}>
        {Array.from({ length: loadingCount }).map((_, i) => (
          <Skeleton key={i} className="h-[100px] sm:h-[120px] w-full rounded-lg" />
        ))}
      </div>
    );
  }

  // Liste vide
  if (count === 0) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  // Pour les petites listes, pas besoin de virtual scrolling
  if (count < threshold) {
    return (
      <div className={cn('space-y-3 sm:space-y-4', className)}>
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className={itemClassName}>
            {renderItem(index)}
          </div>
        ))}
      </div>
    );
  }

  // Virtual scrolling pour les grandes listes
  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      ref={containerRef}
      className={cn(
        'w-full overflow-auto',
        // Scroll optimisé pour mobile
        isMobile && 'overscroll-contain touch-pan-y -webkit-overflow-scrolling-touch',
        className
      )}
      role="list"
      aria-label="Liste d'éléments"
      style={{
        // Hauteur maximale pour permettre le scroll
        maxHeight: isMobile ? 'calc(100vh - 200px)' : 'calc(100vh - 300px)',
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualItem) => (
          <div
            key={virtualItem.key}
            data-index={virtualItem.index}
            ref={virtualizer.measureElement}
            className={itemClassName}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
              minHeight: `${virtualItem.size}px`,
            }}
          >
            {renderItem(virtualItem.index)}
          </div>
        ))}
      </div>
    </div>
  );
};

VirtualizedList.displayName = 'VirtualizedList';

