import React, { useMemo } from 'react';
import { useProductRecommendations, useFrequentlyBoughtTogether, useUserProductRecommendations, ProductRecommendation, FrequentlyBoughtTogether } from '@/hooks/useProductRecommendations';
import ProductCardModern from './ProductCardModern';
import { ProductGrid } from '@/components/ui/ProductGrid';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, ShoppingBag, TrendingUp } from '@/components/icons';

interface ProductRecommendationsProps {
  productId: string;
  productCategory?: string | null;
  limit?: number;
  showFrequentlyBoughtTogether?: boolean;
  title?: string;
  className?: string;
}

/**
 * Composant pour afficher les recommandations de produits similaires
 */
const ProductRecommendationsComponent: React.FC<ProductRecommendationsProps> = ({
  productId,
  limit = 6,
  title = "Produits similaires",
  className = "",
}) => {
  const { data: recommendations, isLoading, error } = useProductRecommendations(
    productId,
    limit,
    true
  );

  // Transformer les recommandations en format ProductCardModern
  const products = useMemo(() => {
    if (!recommendations) return [];

    return recommendations.map((rec: ProductRecommendation) => ({
      id: rec.product_id,
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
    }));
  }, [recommendations]);

  if (error) {
    return null; // Ne pas afficher d'erreur, simplement ne pas afficher la section
  }

  if (isLoading) {
    return (
      <div className={className}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-500" />
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
    return null; // Ne pas afficher si aucune recommandation
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProductGrid>
            {products.map((product) => (
              <ProductCardModern
                key={product.id}
                product={product}
                storeSlug={product.stores?.slug || 'default'}
              />
            ))}
          </ProductGrid>
        </CardContent>
      </Card>
    </div>
  );
}

ProductRecommendationsComponent.displayName = 'ProductRecommendationsComponent';

// Optimisation avec React.memo pour éviter les re-renders inutiles
export const ProductRecommendations = React.memo(ProductRecommendationsComponent, (prevProps, nextProps) => {
  return (
    prevProps.productId === nextProps.productId &&
    prevProps.limit === nextProps.limit &&
    prevProps.title === nextProps.title &&
    prevProps.className === nextProps.className
  );
});

ProductRecommendations.displayName = 'ProductRecommendations';

/**
 * Composant pour afficher les produits fréquemment achetés ensemble
 */
const FrequentlyBoughtTogetherComponent: React.FC<ProductRecommendationsProps> = ({
  productId,
  limit = 4,
  className = "",
}) => {
  const { data: recommendations, isLoading, error } = useFrequentlyBoughtTogether(
    productId,
    limit,
    true
  );

  // Transformer les recommandations en format ProductCardModern
  const products = useMemo(() => {
    if (!recommendations) return [];

    return recommendations.map((rec: FrequentlyBoughtTogether) => ({
      id: rec.product_id,
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
    }));
  }, [recommendations]);

  if (error) {
    return null;
  }

  if (isLoading) {
    return (
      <div className={className}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-purple-500" />
              Achetés ensemble
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-purple-500" />
            Achetés ensemble
            {recommendations && recommendations.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({recommendations[0].times_bought_together} clients ont acheté ces produits ensemble)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProductGrid>
            {products.map((product) => (
              <ProductCardModern
                key={product.id}
                product={product}
                storeSlug={product.stores?.slug || 'default'}
              />
            ))}
          </ProductGrid>
        </CardContent>
      </Card>
    </div>
  );
}

FrequentlyBoughtTogetherComponent.displayName = 'FrequentlyBoughtTogetherComponent';

// Optimisation avec React.memo pour éviter les re-renders inutiles
export const FrequentlyBoughtTogether = React.memo(FrequentlyBoughtTogetherComponent, (prevProps, nextProps) => {
  return (
    prevProps.productId === nextProps.productId &&
    prevProps.limit === nextProps.limit &&
    prevProps.className === nextProps.className
  );
});

FrequentlyBoughtTogether.displayName = 'FrequentlyBoughtTogether';

interface PersonalizedRecommendationsProps {
  userId: string | null;
  limit?: number;
  className?: string;
}

/**
 * Composant pour afficher les recommandations personnalisées pour l'utilisateur
 */
const PersonalizedRecommendationsComponent: React.FC<PersonalizedRecommendationsProps> = ({
  userId,
  limit = 6,
  className = "",
}) => {
  const { data: recommendations, isLoading, error } = useUserProductRecommendations(
    userId,
    limit,
    !!userId
  );

  // Transformer les recommandations en format ProductCardModern
  const products = useMemo(() => {
    if (!recommendations) return [];

    return recommendations.map((rec: ProductRecommendation) => ({
      id: rec.product_id,
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
    }));
  }, [recommendations]);

  // Ne pas afficher si pas d'userId, mais ignorer les erreurs (fonction peut ne pas exister)
  if (!userId) {
    return null;
  }
  
  // Si erreur, ne pas afficher mais ne pas bloquer le reste de la page
  if (error) {
    return null;
  }

  if (isLoading) {
    return (
      <div className={className}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Recommandé pour vous
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProductGrid>
            {products.map((product) => (
              <ProductCardModern
                key={product.id}
                product={product}
                storeSlug={product.stores?.slug || 'default'}
              />
            ))}
          </ProductGrid>
        </CardContent>
      </Card>
    </div>
  );
}

PersonalizedRecommendationsComponent.displayName = 'PersonalizedRecommendationsComponent';

// Optimisation avec React.memo pour éviter les re-renders inutiles
export const PersonalizedRecommendations = React.memo(PersonalizedRecommendationsComponent, (prevProps, nextProps) => {
  return (
    prevProps.userId === nextProps.userId &&
    prevProps.limit === nextProps.limit &&
    prevProps.className === nextProps.className
  );
});

PersonalizedRecommendations.displayName = 'PersonalizedRecommendations';

