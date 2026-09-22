import React, { useMemo } from 'react';
import {
  useProductRecommendations,
  useUserProductRecommendations,
  ProductRecommendation,
} from '@/hooks/useProductRecommendations';
import UnifiedProductCard from '@/components/products/UnifiedProductCard';
import { transformToUnifiedProduct } from '@/lib/product-transform';
import { SameStoreProductsSection } from './SameStoreProductsSection';
import { ProductGrid } from '@/components/ui/ProductGrid';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, TrendingUp } from '@/components/icons';

interface ProductRecommendationsProps {
  productId: string;
  productCategory?: string | null;
  limit?: number;
  showFrequentlyBoughtTogether?: boolean;
  title?: string;
  className?: string;
}

function mapRecommendationToProduct(rec: ProductRecommendation) {
  return transformToUnifiedProduct({
    id: rec.product_id,
    store_id: rec.store_id,
    name: rec.product_name,
    slug: rec.product_slug,
    image_url: rec.image_url,
    price: rec.price,
    promotional_price: rec.promotional_price,
    currency: rec.currency,
    category: rec.category,
    product_type: rec.product_type,
    rating: rec.rating,
    reviews_count: rec.reviews_count,
    purchases_count: rec.purchases_count,
    stores: {
      id: rec.store_id,
      name: rec.store_name,
      slug: rec.store_slug,
      logo_url: null,
    },
    created_at: new Date().toISOString(),
  } as Parameters<typeof transformToUnifiedProduct>[0]);
}

/**
 * Composant pour afficher les recommandations de produits similaires
 */
const ProductRecommendationsComponent: React.FC<ProductRecommendationsProps> = ({
  productId,
  limit = 6,
  title = 'Produits similaires',
  className = '',
}) => {
  const {
    data: recommendations,
    isLoading,
    error,
  } = useProductRecommendations(productId, limit, true);

  const products = useMemo(() => {
    if (!recommendations) return [];
    return recommendations.map(mapRecommendationToProduct);
  }, [recommendations]);

  if (error) {
    return null;
  }

  if (isLoading) {
    return (
      <div className={className}>
        <Card className="border-[var(--lp-border-light)] bg-[var(--lp-surface-elevated)] shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[var(--lp-blue)]" />
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProductGrid>
              {Array.from({ length: limit }).map((_, index) => (
                <Skeleton key={index} className="h-96 w-full" />
              ))}
            </ProductGrid>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <Card className="border-[var(--lp-border-light)] bg-[var(--lp-surface-elevated)] shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[var(--lp-blue)]" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProductGrid>
            {products.map(product => (
              <UnifiedProductCard
                key={product.id}
                product={product}
                variant="marketplace"
                showAffiliate
                showActions
                className="h-full"
              />
            ))}
          </ProductGrid>
        </CardContent>
      </Card>
    </div>
  );
};

ProductRecommendationsComponent.displayName = 'ProductRecommendationsComponent';

export const ProductRecommendations = React.memo(
  ProductRecommendationsComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.productId === nextProps.productId &&
      prevProps.limit === nextProps.limit &&
      prevProps.title === nextProps.title &&
      prevProps.className === nextProps.className
    );
  }
);

ProductRecommendations.displayName = 'ProductRecommendations';

interface SameStoreProductsProps extends ProductRecommendationsProps {
  storeId?: string;
  storeName?: string;
}

const FrequentlyBoughtTogetherComponent: React.FC<SameStoreProductsProps> = props => (
  <SameStoreProductsSection {...props} withCard />
);

FrequentlyBoughtTogetherComponent.displayName = 'FrequentlyBoughtTogetherComponent';

export const FrequentlyBoughtTogether = React.memo(
  FrequentlyBoughtTogetherComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.productId === nextProps.productId &&
      prevProps.storeId === nextProps.storeId &&
      prevProps.storeName === nextProps.storeName &&
      prevProps.limit === nextProps.limit &&
      prevProps.className === nextProps.className
    );
  }
);

FrequentlyBoughtTogether.displayName = 'FrequentlyBoughtTogether';

interface PersonalizedRecommendationsProps {
  userId: string | null;
  limit?: number;
  className?: string;
}

const PersonalizedRecommendationsComponent: React.FC<PersonalizedRecommendationsProps> = ({
  userId,
  limit = 6,
  className = '',
}) => {
  const {
    data: recommendations,
    isLoading,
    error,
  } = useUserProductRecommendations(userId, limit, !!userId);

  const products = useMemo(() => {
    if (!recommendations) return [];
    return recommendations.map(mapRecommendationToProduct);
  }, [recommendations]);

  if (!userId) {
    return null;
  }

  if (error) {
    return null;
  }

  if (isLoading) {
    return (
      <div className={className}>
        <Card className="border-[var(--lp-border-light)] bg-[var(--lp-surface-elevated)] shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[var(--lp-blue)]" />
              Recommandé pour vous
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProductGrid>
              {Array.from({ length: limit }).map((_, index) => (
                <Skeleton key={index} className="h-96 w-full" />
              ))}
            </ProductGrid>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <Card className="border-[var(--lp-border-light)] bg-[var(--lp-surface-elevated)] shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[var(--lp-blue)]" />
            Recommandé pour vous
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProductGrid>
            {products.map(product => (
              <UnifiedProductCard
                key={product.id}
                product={product}
                variant="marketplace"
                showAffiliate
                showActions
                className="h-full"
              />
            ))}
          </ProductGrid>
        </CardContent>
      </Card>
    </div>
  );
};

PersonalizedRecommendationsComponent.displayName = 'PersonalizedRecommendationsComponent';

export const PersonalizedRecommendations = React.memo(
  PersonalizedRecommendationsComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.userId === nextProps.userId &&
      prevProps.limit === nextProps.limit &&
      prevProps.className === nextProps.className
    );
  }
);

PersonalizedRecommendations.displayName = 'PersonalizedRecommendations';
