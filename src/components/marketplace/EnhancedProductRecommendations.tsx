/**
 * Composant Amélioré de Recommandations ML
 * Date: 1 Février 2025
 * 
 * Affiche différents types de recommandations avec scoring et raisons
 */

import React, { useMemo } from 'react';
import { useProductRecommendations, useFrequentlyBoughtTogether, useCollaborativeRecommendations, useViewBasedRecommendations, ProductRecommendation, FrequentlyBoughtTogether } from '@/hooks/useProductRecommendations';
import ProductCardModern from './ProductCardModern';
import { ProductGrid } from '@/components/ui/ProductGrid';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, ShoppingBag, TrendingUp, Users, Eye, BarChart3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface EnhancedProductRecommendationsProps {
  productId: string;
  productCategory?: string | null;
  limit?: number;
  showAllTypes?: boolean;
  className?: string;
}

/**
 * Composant amélioré pour afficher les recommandations ML
 */
export const EnhancedProductRecommendations: React.FC<EnhancedProductRecommendationsProps> = ({
  productId,
  limit = 6,
  showAllTypes = false,
  className = "",
}) => {
  const { user } = useAuth();
  
  const { data: similarProducts, isLoading: similarLoading } = useProductRecommendations(productId, limit);
  const { data: frequentlyBought, isLoading: fbtLoading } = useFrequentlyBoughtTogether(productId, 4);
  const { data: collaborative, isLoading: collaborativeLoading } = useCollaborativeRecommendations(user?.id || null, limit);
  const { data: viewBased, isLoading: viewLoading } = useViewBasedRecommendations(productId, limit);

  // Transformer les recommandations en format ProductCardModern
  const transformRecommendations = (recs: ProductRecommendation[] | FrequentlyBoughtTogether[]) => {
    return recs.map((rec) => ({
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
  };

  const similarProductsList = useMemo(() => transformRecommendations(similarProducts || []), [similarProducts]);
  const frequentlyBoughtList = useMemo(() => transformRecommendations(frequentlyBought || []), [frequentlyBought]);
  const collaborativeList = useMemo(() => transformRecommendations(collaborative || []), [collaborative]);
  const viewBasedList = useMemo(() => transformRecommendations(viewBased || []), [viewBased]);

  const getRecommendationBadge = (type: string) => {
    const badges: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      similar: { label: 'Similaire', variant: 'default' },
      category: { label: 'Même catégorie', variant: 'secondary' },
      tags: { label: 'Tags similaires', variant: 'outline' },
      popular: { label: 'Populaire', variant: 'default' },
      purchase_history: { label: 'Basé sur vos achats', variant: 'default' },
      collaborative: { label: 'Recommandé par des utilisateurs similaires', variant: 'default' },
      view_based: { label: 'Souvent consulté ensemble', variant: 'secondary' },
    };

    return badges[type] || { label: type, variant: 'outline' };
  };

  if (showAllTypes) {
    return (
      <div className={className}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-500" />
              Recommandations Intelligentes
            </CardTitle>
            <CardDescription>
              Découvrez des produits qui pourraient vous intéresser
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="similar" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="similar">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Similaires
                </TabsTrigger>
                <TabsTrigger value="frequently">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Achetés ensemble
                </TabsTrigger>
                {user && (
                  <TabsTrigger value="collaborative">
                    <Users className="h-4 w-4 mr-2" />
                    Pour vous
                  </TabsTrigger>
                )}
                <TabsTrigger value="viewed">
                  <Eye className="h-4 w-4 mr-2" />
                  Consultés ensemble
                </TabsTrigger>
              </TabsList>

              <TabsContent value="similar" className="mt-4">
                {similarLoading ? (
                  <ProductGrid>
                    {Array.from({ length: limit }).map((_, i) => (
                      <Skeleton key={i} className="h-96 w-full" />
                    ))}
                  </ProductGrid>
                ) : similarProductsList.length > 0 ? (
                  <>
                    <div className="mb-4 flex items-center gap-2 flex-wrap">
                      {similarProducts?.map((rec, idx) => {
                        const badge = getRecommendationBadge(rec.recommendation_type);
                        return (
                          <Badge key={idx} variant={badge.variant} className="text-xs">
                            {badge.label}
                          </Badge>
                        );
                      })}
                    </div>
                    <ProductGrid>
                      {similarProductsList.map((product) => (
                        <ProductCardModern key={product.id} product={product} />
                      ))}
                    </ProductGrid>
                  </>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Aucune recommandation similaire disponible
                  </p>
                )}
              </TabsContent>

              <TabsContent value="frequently" className="mt-4">
                {fbtLoading ? (
                  <ProductGrid>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-96 w-full" />
                    ))}
                  </ProductGrid>
                ) : frequentlyBoughtList.length > 0 ? (
                  <>
                    <div className="mb-4 text-sm text-muted-foreground">
                      Ces produits sont souvent achetés avec ce produit
                    </div>
                    <ProductGrid>
                      {frequentlyBoughtList.map((product, idx) => {
                        const fbtItem = frequentlyBought?.[idx];
                        return (
                          <div key={product.id} className="relative">
                            <ProductCardModern product={product} />
                            {fbtItem && 'times_bought_together' in fbtItem && (
                              <Badge className="absolute top-2 right-2 bg-green-500">
                                {fbtItem.times_bought_together}x ensemble
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </ProductGrid>
                  </>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Aucun produit fréquemment acheté ensemble
                  </p>
                )}
              </TabsContent>

              {user && (
                <TabsContent value="collaborative" className="mt-4">
                  {collaborativeLoading ? (
                    <ProductGrid>
                      {Array.from({ length: limit }).map((_, i) => (
                        <Skeleton key={i} className="h-96 w-full" />
                      ))}
                    </ProductGrid>
                  ) : collaborativeList.length > 0 ? (
                    <>
                      <div className="mb-4 text-sm text-muted-foreground">
                        Recommandations personnalisées basées sur les utilisateurs similaires
                      </div>
                      <ProductGrid>
                        {collaborativeList.map((product) => (
                          <ProductCardModern key={product.id} product={product} />
                        ))}
                      </ProductGrid>
                    </>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      Connectez-vous pour voir des recommandations personnalisées
                    </p>
                  )}
                </TabsContent>
              )}

              <TabsContent value="viewed" className="mt-4">
                {viewLoading ? (
                  <ProductGrid>
                    {Array.from({ length: limit }).map((_, i) => (
                      <Skeleton key={i} className="h-96 w-full" />
                    ))}
                  </ProductGrid>
                ) : viewBasedList.length > 0 ? (
                  <>
                    <div className="mb-4 text-sm text-muted-foreground">
                      Produits souvent consultés avec ce produit
                    </div>
                    <ProductGrid>
                      {viewBasedList.map((product) => (
                        <ProductCardModern key={product.id} product={product} />
                      ))}
                    </ProductGrid>
                  </>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Aucune recommandation basée sur les vues
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Vue simple (par défaut)
  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            Produits similaires
          </CardTitle>
        </CardHeader>
        <CardContent>
          {similarLoading ? (
            <ProductGrid>
              {Array.from({ length: limit }).map((_, i) => (
                <Skeleton key={i} className="h-96 w-full" />
              ))}
            </ProductGrid>
          ) : similarProductsList.length > 0 ? (
            <>
              {frequentlyBought && frequentlyBought.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" />
                    Fréquemment achetés ensemble
                  </h3>
                  <ProductGrid>
                    {frequentlyBoughtList.slice(0, 4).map((product, idx) => {
                      const fbtItem = frequentlyBought[idx];
                      return (
                        <div key={product.id} className="relative">
                          <ProductCardModern product={product} />
                          {fbtItem && 'times_bought_together' in fbtItem && (
                            <Badge className="absolute top-2 right-2 bg-green-500">
                              {fbtItem.times_bought_together}x
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </ProductGrid>
                </div>
              )}
              
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Vous pourriez aussi aimer
              </h3>
              <ProductGrid>
                {similarProductsList.map((product) => (
                  <ProductCardModern key={product.id} product={product} />
                ))}
              </ProductGrid>
            </>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Aucune recommandation disponible
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedProductRecommendations;

