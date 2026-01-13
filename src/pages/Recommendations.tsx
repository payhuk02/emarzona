/**
 * Page des Recommandations Personnelles
 * Permet aux utilisateurs de voir leurs recommandations IA personnalisées
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Heart, Star, RefreshCw, Sparkles, Target } from 'lucide-react';
import { useUserRecommendations, useTrendingRecommendations } from '@/hooks/useAIRecommendations';
import { useStoreContext } from '@/contexts/StoreContext';
import { logger } from '@/lib/logger';
import { AIProductRecommendations } from '@/components/recommendations/AIProductRecommendations';

const Recommendations = () => {
  const { selectedStoreId } = useStoreContext();
  const [refreshKey, setRefreshKey] = useState(0);

  // Récupérer les recommandations personnalisées
  const { data: userRecommendations, isLoading: userLoading, refetch: refetchUser } = useUserRecommendations({
    limit: 12,
    enabled: !!selectedStoreId
  });

  // Récupérer les tendances
  const { data: trendingRecommendations, isLoading: trendingLoading, refetch: refetchTrending } = useTrendingRecommendations({
    limit: 8,
    enabled: !!selectedStoreId
  });

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    refetchUser();
    refetchTrending();
    logger.info('Recommendations refreshed by user');
  };

  const recommendationStats = {
    total: userRecommendations?.length || 0,
    trending: trendingRecommendations?.length || 0,
    categories: new Set(userRecommendations?.map(r => r.metadata.category).filter(Boolean)).size
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-purple-500" />
            Mes Recommandations Personnelles
          </h1>
          <p className="text-muted-foreground mt-2">
            Découvrez des produits adaptés à vos goûts et à votre historique d'achat
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={userLoading || trendingLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${userLoading || trendingLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Recommandations</p>
                <p className="text-2xl font-bold">{recommendationStats.total}</p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tendances</p>
                <p className="text-2xl font-bold">{recommendationStats.trending}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Catégories</p>
                <p className="text-2xl font-bold">{recommendationStats.categories}</p>
              </div>
              <Star className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="personalized" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personalized">Personnalisées</TabsTrigger>
          <TabsTrigger value="trending">Tendances</TabsTrigger>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
        </TabsList>

        {/* Recommandations personnalisées */}
        <TabsContent value="personalized" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                Recommandations Personnalisées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Basées sur votre historique d'achat, vos préférences et votre comportement de navigation.
              </p>

              {userLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-4">
                        <div className="h-48 bg-gray-200 rounded mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : userRecommendations && userRecommendations.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {userRecommendations.slice(0, 9).map((recommendation, index) => (
                    <Card key={recommendation.productId} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="text-xs">
                            #{index + 1}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {recommendation.reason}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-medium line-clamp-2">
                            Produit recommandé #{recommendation.productId.slice(-8)}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Score: {Math.round(recommendation.score * 100)}%
                          </p>
                          {recommendation.metadata.reasonText && (
                            <p className="text-xs text-muted-foreground">
                              {recommendation.metadata.reasonText}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Aucune recommandation disponible</h3>
                  <p className="text-muted-foreground mb-4">
                    Continuez à explorer et acheter pour recevoir des recommandations personnalisées.
                  </p>
                  <Button onClick={() => window.location.href = '/marketplace'}>
                    Explorer le Marketplace
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tendances */}
        <TabsContent value="trending" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Tendances Populaires
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Les produits qui gagnent en popularité ces derniers jours.
              </p>

              {trendingLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-4">
                        <div className="h-32 bg-gray-200 rounded"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : trendingRecommendations && trendingRecommendations.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {trendingRecommendations.slice(0, 9).map((recommendation, index) => (
                    <Card key={recommendation.productId} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="text-xs">
                            🔥 #{index + 1}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Tendance
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-medium line-clamp-2">
                            Produit tendance #{recommendation.productId.slice(-8)}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Popularité: {Math.round(recommendation.score * 100)}%
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Aucune tendance disponible</h3>
                  <p className="text-muted-foreground">
                    Les tendances se mettent à jour régulièrement.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommandations Marketplace */}
        <TabsContent value="marketplace" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                Recommandations du Marketplace
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Découvrez des produits exceptionnels de notre marketplace.
              </p>

              <AIProductRecommendations
                title=""
                limit={12}
                showReasoning={true}
                layout="grid"
                className="border-none bg-transparent shadow-none p-0"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Section explicative */}
      <Card>
        <CardHeader>
          <CardTitle>Comment fonctionnent les recommandations IA ?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">Algorithmes utilisés</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  <span>Basé sur vos préférences et achats</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span>Similaire aux autres utilisateurs</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span>Produits populaires et tendances</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Conseils pour de meilleures recommandations</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>• Continuez à explorer et acheter des produits</p>
                <p>• Évaluez les produits que vous aimez</p>
                <p>• Utilisez la liste de souhaits</p>
                <p>• Les recommandations s'améliorent avec le temps</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Recommendations;