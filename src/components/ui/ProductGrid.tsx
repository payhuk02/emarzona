import React, { useRef } from 'react';
import { cn } from '@/lib/utils';

interface ProductGridProps {
  children: React.ReactNode;
  className?: string;
}

const ProductGridComponent = ({ children, className }: ProductGridProps) => {
  const gridRef = useRef<HTMLDivElement>(null);

  // store-product-grid : colonnes via CSS variables (thème boutique)
  const isCustomGrid = className?.includes('store-product-grid');

  // Aligné sur Marketplace / VirtualizedProductGrid (pas de padding products-grid-*)
  const marketplaceGridClass =
    'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 w-full max-w-full';

  return (
    <div
      ref={gridRef}
      role="region"
      aria-label="Grille de produits"
      className={cn(
        isCustomGrid ? 'grid gap-4 sm:gap-5 lg:gap-6 w-full max-w-full' : marketplaceGridClass,
        className
      )}
    >
      {children}
    </div>
  );
};

// Optimisation avec React.memo pour éviter les re-renders inutiles
export const ProductGrid = React.memo(ProductGridComponent);
ProductGrid.displayName = 'ProductGrid';

// Composant pour les cartes produits - affichage statique et professionnel
interface LazyProductCardProps {
  children: React.ReactNode;
  priority?: boolean;
  className?: string;
}

export const LazyProductCard = ({ children, className }: LazyProductCardProps) => {
  // Affichage statique et professionnel - pas de lazy loading, pas de skeletons
  return <div className={className}>{children}</div>;
};
