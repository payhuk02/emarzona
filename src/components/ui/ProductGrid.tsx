import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface ProductGridProps {
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
  skeletonCount?: number;
}

export const ProductGrid = ({ 
  children, 
  className, 
  loading = false, 
  skeletonCount = 12 
}: ProductGridProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  // Intersection Observer pour le lazy loading de la grille
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '100px',
        threshold: 0.1
      }
    );

    if (gridRef.current) {
      observer.observe(gridRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Skeleton de chargement optimisé
  const SkeletonCard = () => (
    <div className="product-card product-card-mobile sm:product-card-tablet lg:product-card-desktop">
      <div className="product-card-container">
        <div className="product-banner bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 animate-pulse">
          <div className="w-full h-full flex items-center justify-center">
            <div className="h-16 w-16 text-slate-400">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div className="product-card-content">
        <div className="flex-1">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-2"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-3 w-3/4"></div>
          <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-4 w-1/2"></div>
        </div>
        <div className="product-actions">
          <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div 
        ref={gridRef}
        className={cn(
          "products-grid-mobile sm:products-grid-tablet lg:products-grid-desktop xl:products-grid-wide",
          "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-7 lg:gap-8",
          className
        )}
      >
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    );
  }

  return (
    <div 
      ref={gridRef}
      className={cn(
        "products-grid-mobile sm:products-grid-tablet lg:products-grid-desktop xl:products-grid-wide",
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-7 lg:gap-8",
        className
      )}
    >
      {isVisible ? children : (
        // Placeholder pendant le lazy loading
        Array.from({ length: Math.min(skeletonCount, 6) }).map((_, index) => (
          <SkeletonCard key={index} />
        ))
      )}
    </div>
  );
};

// Composant pour les cartes produits avec lazy loading individuel
interface LazyProductCardProps {
  children: React.ReactNode;
  priority?: boolean;
  className?: string;
}

export const LazyProductCard = ({ 
  children, 
  priority = false, 
  className 
}: LazyProductCardProps) => {
  const [isVisible, setIsVisible] = useState(priority);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.1
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  return (
    <div ref={cardRef} className={className}>
      {isVisible ? children : (
        <div className="product-card product-card-mobile sm:product-card-tablet lg:product-card-desktop">
          <div className="product-card-container">
            <div className="product-banner bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 animate-pulse">
              <div className="w-full h-full flex items-center justify-center">
                <div className="h-16 w-16 text-slate-400">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <div className="product-card-content">
            <div className="flex-1">
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-2"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-3 w-3/4"></div>
              <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-4 w-1/2"></div>
            </div>
            <div className="product-actions">
              <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
