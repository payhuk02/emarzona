/**
 * Digital Product Recommendations Component
 * Date: 27 Janvier 2025
 * 
 * Système de recommandations intelligentes pour produits digitaux
 * Basé sur : catégories similaires, tags, achats précédents, popularité
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sparkles,
  TrendingUp,
  Users,
  Package,
  Star,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DigitalProductCard } from './DigitalProductCard';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';

interface RecommendationsProps {
  productId: string;
  category?: string;
  tags?: string[];
  limit?: number;
  variant?: 'horizontal' | 'grid' | 'compact';
  title?: string;
  showTitle?: boolean;
}

/**
 * Hook pour obtenir les recommandations
 */
const useProductRecommendations = (
  productId: string,
  category?: string,
  tags?: string[],
  limit: number = 6
) => {
  return useQuery({
    queryKey: ['digitalProductRecommendations', productId, category, tags, limit],
    queryFn: async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        interface ProductWithStore {
          id: string;
          name: string;
          slug?: string;
          description?: string;
          price: number;
          currency: string;
          image_url?: string;
          category?: string;
          tags?: string[];
          sales_count?: number;
          average_rating?: number;
          total_reviews?: number;
          total_downloads?: number;
          digital_type?: string;
          stores: {
            id: string;
            name: string;
            slug: string;
          };
          recommendationScore?: number;
        }
        // 1. Recommandations basées sur la catégorie
        let  categoryRecommendations: ProductWithStore[] = [];
        if (category) {
          const { data: categoryProducts } = await supabase
            .from('products')
            .select(`
              *,
              stores!inner (
                id,
                name,
                slug
              )
            `)
            .eq('product_type', 'digital')
            .eq('is_active', true)
            .eq('is_draft', false)
            .eq('category', category)
            .neq('id', productId)
            .order('sales_count', { ascending: false })
            .limit(limit);

          categoryRecommendations = categoryProducts || [];
        }

        // 2. Recommandations basées sur les tags
        let  tagRecommendations: ProductWithStore[] = [];
        if (tags && tags.length > 0) {
          // Rechercher produits avec tags similaires
          const { data: tagProducts } = await supabase
            .from('products')
            .select(`
              *,
              stores!inner (
                id,
                name,
                slug
              )
            `)
            .eq('product_type', 'digital')
            .eq('is_active', true)
            .eq('is_draft', false)
            .neq('id', productId)
            .limit(100);

          if (tagProducts) {
            // Filtrer ceux qui ont des tags en commun
            tagRecommendations = tagProducts
              .filter((p) => {
                const productTags = p.tags || [];
                return tags.some((tag) => productTags.includes(tag));
              })
              .sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0))
              .slice(0, limit);
          }
        }

        // 3. Recommandations basées sur les achats précédents (si utilisateur connecté)
        let  purchaseBasedRecommendations: ProductWithStore[] = [];
        if (user) {
          // Récupérer les produits achetés par l'utilisateur
          const { data: purchasedProducts } = await supabase
            .from('order_items')
            .select(`
              product_id,
              orders!inner (
                customer_id,
                customers!inner (
                  email
                )
              )
            `)
            .eq('orders.customers.email', user.email)
            .eq('orders.payment_status', 'paid')
            .eq('orders.status', 'completed');

          if (purchasedProducts && purchasedProducts.length > 0) {
            const purchasedIds = purchasedProducts.map((p) => p.product_id);
            
            // Obtenir les catégories des produits achetés
            const { data: purchasedCategories } = await supabase
              .from('products')
              .select('category')
              .in('id', purchasedIds)
              .not('category', 'is', null);

            const categories = Array.from(
              new Set(purchasedCategories?.map((p) => p.category).filter(Boolean))
            ) as string[];

            if (categories.length > 0) {
              const { data: similarProducts } = await supabase
                .from('products')
                .select(`
                  *,
                  stores!inner (
                    id,
                    name,
                    slug
                  )
                `)
                .eq('product_type', 'digital')
                .eq('is_active', true)
                .eq('is_draft', false)
                .neq('id', productId)
                .in('category', categories)
                .not('id', 'in', `(${purchasedIds.join(',')})`)
                .order('sales_count', { ascending: false })
                .limit(limit);

              purchaseBasedRecommendations = similarProducts || [];
            }
          }
        }

        // 4. Recommandations populaires (fallback)
        const { data: popularProducts } = await supabase
          .from('products')
          .select(`
            *,
            stores!inner (
              id,
              name,
              slug
            )
          `)
          .eq('product_type', 'digital')
          .eq('is_active', true)
          .eq('is_draft', false)
          .neq('id', productId)
          .order('sales_count', { ascending: false })
          .order('average_rating', { ascending: false })
          .limit(limit);

        // Combiner et dédupliquer
        const allRecommendations = [
          ...categoryRecommendations,
          ...tagRecommendations,
          ...purchaseBasedRecommendations,
          ...(popularProducts || []),
        ];

        // Dédupliquer par ID
        const uniqueRecommendations = Array.from(
          new Map(allRecommendations.map((p) => [p.id, p])).values()
        );

        // Trier par score de recommandation
        const scored = uniqueRecommendations.map((product) => {
          let  score= 0;

          // Score basé sur la catégorie
          if (category && product.category === category) score += 10;

          // Score basé sur les tags
          if (tags && product.tags) {
            const commonTags = tags.filter((tag) => product.tags.includes(tag));
            score += commonTags.length * 5;
          }

          // Score basé sur la popularité
          score += (product.sales_count || 0) * 0.1;
          score += (product.average_rating || 0) * 2;

          return { ...product, recommendationScore: score };
        });

        // Trier par score et retourner les meilleurs
        return scored
          .sort((a, b) => b.recommendationScore - a.recommendationScore)
          .slice(0, limit);
      } catch ( _error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('Error fetching product recommendations', { error });
        return [];
      }
    },
    enabled: !!productId,
  });
};

/**
 * Composant de recommandations
 */
export const DigitalProductRecommendations = ({
  productId,
  category,
  tags,
  limit = 6,
  variant = 'grid',
  title = 'Produits similaires',
  showTitle = true,
}: RecommendationsProps) => {
  const navigate = useNavigate();
  const { data: recommendations, isLoading } = useProductRecommendations(
    productId,
    category,
    tags,
    limit
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {showTitle && (
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold">{title}</h2>
          </div>
        )}
        <div
          className={cn(
            variant === 'horizontal' && 'flex gap-4 overflow-x-auto',
            variant === 'grid' && 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
            variant === 'compact' && 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4'
          )}
        >
          {Array.from({ length: limit }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <Skeleton className="h-48 w-full" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {showTitle && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold">{title}</h2>
            <Badge variant="secondary">{recommendations.length}</Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/digital/search')}
          >
            Voir plus
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}

      <div
        className={cn(
          variant === 'horizontal' && 'flex gap-4 overflow-x-auto pb-4',
          variant === 'grid' && 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
          variant === 'compact' && 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4'
        )}
      >
        {recommendations.map((product: ProductWithStore) => (
          <DigitalProductCard
            key={product.id}
            product={{
              id: product.id,
              name: product.name,
              slug: product.slug || product.id,
              description: product.description,
              price: product.price,
              currency: product.currency,
              image_url: product.image_url,
              digital_type: product.digital_type || 'other',
              license_type: 'single',
              total_downloads: product.total_downloads || 0,
              average_rating: product.average_rating || 0,
              total_reviews: product.total_reviews || 0,
            }}
            variant={variant === 'compact' ? 'compact' : 'default'}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Recommandations basées sur "Achetés ensemble"
 */
export const BoughtTogetherRecommendations = ({
  productId,
  limit = 4,
}: {
  productId: string;
  limit?: number;
}) => {
  const navigate = useNavigate();
  const { data: recommendations, isLoading } = useQuery({
    queryKey: ['boughtTogether', productId],
    queryFn: async () => {
      try {
        // Récupérer les commandes qui contiennent ce produit
        const { data: ordersWithProduct } = await supabase
          .from('order_items')
          .select('order_id')
          .eq('product_id', productId)
          .limit(100);

        if (!ordersWithProduct || ordersWithProduct.length === 0) return [];

        const orderIds = ordersWithProduct.map((o) => o.order_id);

        // Récupérer les autres produits dans ces commandes
        const { data: otherProducts } = await supabase
          .from('order_items')
          .select('product_id')
          .in('order_id', orderIds)
          .neq('product_id', productId)
          .eq('product_type', 'digital');

        if (!otherProducts || otherProducts.length === 0) return [];

        // Compter les occurrences
        const productCounts = otherProducts.reduce((acc, item) => {
          acc[item.product_id] = (acc[item.product_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Trier par fréquence
        const sortedProductIds = Object.entries(productCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, limit)
          .map(([id]) => id);

        // Récupérer les détails des produits
        const { data: products } = await supabase
          .from('products')
          .select(`
            *,
            stores!inner (
              id,
              name,
              slug
            )
          `)
          .in('id', sortedProductIds)
          .eq('product_type', 'digital')
          .eq('is_active', true);

        return products || [];
      } catch ( _error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('Error fetching bought together recommendations', { error });
        return [];
      }
    },
    enabled: !!productId,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Package className="h-5 w-5" />
          Achetés ensemble
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <Skeleton className="h-32 w-full" />
              <CardContent className="p-3">
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Package className="h-5 w-5" />
        Achetés ensemble
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {recommendations.map((product: ProductWithStore) => (
          <Card
            key={product.id}
            className="group hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate(`/digital/${product.id}`)}
          >
            <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>
            <CardContent className="p-3">
              <h4 className="font-medium text-sm line-clamp-2 mb-2">{product.name}</h4>
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm">
                  {product.price.toLocaleString()} {product.currency}
                </span>
                {product.average_rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs">{product.average_rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

/**
 * Recommandations "Vous pourriez aimer"
 */
export const YouMightLikeRecommendations = ({
  limit = 6,
}: {
  limit?: number;
}) => {
  const navigate = useNavigate();
  const { data: recommendations, isLoading } = useQuery({
    queryKey: ['youMightLike'],
    queryFn: async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          // Si non connecté, retourner les plus populaires
          const { data: popular } = await supabase
            .from('products')
            .select(`
              *,
              stores!inner (
                id,
                name,
                slug
              )
            `)
            .eq('product_type', 'digital')
            .eq('is_active', true)
            .eq('is_draft', false)
            .order('sales_count', { ascending: false })
            .order('average_rating', { ascending: false })
            .limit(limit);

          return popular || [];
        }

        // Si connecté, recommandations basées sur l'historique
        const { data: purchasedCategories } = await supabase
          .from('order_items')
          .select(`
            product_id,
            orders!inner (
              customers!inner (
                email
              )
            )
          `)
          .eq('orders.customers.email', user.email)
          .eq('orders.payment_status', 'paid')
          .eq('orders.status', 'completed');

        if (purchasedCategories && purchasedCategories.length > 0) {
          const productIds = purchasedCategories.map((p) => p.product_id);
          const { data: categories } = await supabase
            .from('products')
            .select('category')
            .in('id', productIds)
            .not('category', 'is', null);

          const uniqueCategories = Array.from(
            new Set(categories?.map((c) => c.category).filter(Boolean))
          ) as string[];

          if (uniqueCategories.length > 0) {
            const { data: similar } = await supabase
              .from('products')
              .select(`
                *,
                stores!inner (
                  id,
                  name,
                  slug
                )
              `)
              .eq('product_type', 'digital')
              .eq('is_active', true)
              .eq('is_draft', false)
              .in('category', uniqueCategories)
              .not('id', 'in', `(${productIds.join(',')})`)
              .order('sales_count', { ascending: false })
              .limit(limit);

            return similar || [];
          }
        }

        // Fallback: produits populaires
        const { data: popular } = await supabase
          .from('products')
          .select(`
            *,
            stores!inner (
              id,
              name,
              slug
            )
          `)
          .eq('product_type', 'digital')
          .eq('is_active', true)
          .eq('is_draft', false)
          .order('sales_count', { ascending: false })
          .limit(limit);

        return popular || [];
      } catch ( _error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('Error fetching you might like', { error });
        return [];
      }
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: limit }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <Skeleton className="h-48 w-full" />
            <CardContent className="p-4 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <TrendingUp className="h-6 w-6 text-primary" />
        Vous pourriez aimer
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map((product: ProductWithStore) => (
          <DigitalProductCard
            key={product.id}
            product={{
              id: product.id,
              name: product.name,
              slug: product.slug || product.id,
              description: product.description,
              price: product.price,
              currency: product.currency,
              image_url: product.image_url,
              digital_type: product.digital_type || 'other',
              license_type: 'single',
              total_downloads: product.total_downloads || 0,
              average_rating: product.average_rating || 0,
              total_reviews: product.total_reviews || 0,
            }}
          />
        ))}
      </div>
    </div>
  );
};







