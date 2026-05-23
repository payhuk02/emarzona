import React, { useMemo } from 'react';
import '@/styles/landing-premium.css';
import '@/styles/marketplace-premium.css';
import { useSameStoreProducts } from '@/hooks/useSameStoreProducts';
import { ProductGrid } from '@/components/ui/ProductGrid';
import UnifiedProductCard from '@/components/products/UnifiedProductCard';
import { transformToUnifiedProduct } from '@/lib/product-transform';
import { Skeleton } from '@/components/ui/skeleton';
import { Store } from '@/components/icons';
import { cn } from '@/lib/utils';

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

  /** Même conteneur que MarketplaceProductsSection (max-w-7xl, pleine largeur utile) */
  const catalogOuterClass = 'w-screen max-w-[100vw] relative left-1/2 -translate-x-1/2';
  const catalogInnerClass = 'w-full mx-auto max-w-7xl px-3 sm:px-4 lg:px-8';
  const cardsBandClass = 'landing-premium marketplace-premium mp-product-cards-band';

  const sectionTitleClass = cn(
    'flex items-center gap-2 font-semibold',
    withCard ? 'text-lg sm:text-xl text-foreground mb-4 sm:mb-6' : 'text-lg text-foreground'
  );

  const renderSection = (content: React.ReactNode) => (
    <section
      className={cn('mp-same-store-products', className)}
      aria-labelledby="same-store-products-heading"
    >
      <div className={catalogOuterClass}>
        <div className={catalogInnerClass}>
          <h2 id="same-store-products-heading" className={sectionTitleClass}>
            <Store className={cn('h-5 w-5', withCard && 'text-purple-500')} aria-hidden />
            {sectionTitle}
          </h2>
          {content}
        </div>
      </div>
    </section>
  );

  const loadingGrid = (
    <div className={cardsBandClass}>
      <ProductGrid>
        {Array.from({ length: limit }).map((_, index) => (
          <Skeleton
            key={index}
            className="h-[400px] sm:h-[450px] w-full min-w-0 rounded-xl bg-[#132a4a]/40"
          />
        ))}
      </ProductGrid>
    </div>
  );

  if (isLoading) {
    return renderSection(loadingGrid);
  }

  if (!products.length) {
    return null;
  }

  const grid = (
    <div className={cardsBandClass}>
      <ProductGrid>
        {products.map(product => (
          <UnifiedProductCard
            key={product.id}
            product={product}
            variant="marketplace"
            showAffiliate={true}
            showActions={true}
            className="w-full min-w-0"
          />
        ))}
      </ProductGrid>
    </div>
  );

  return renderSection(grid);
};

SameStoreProductsSection.displayName = 'SameStoreProductsSection';
