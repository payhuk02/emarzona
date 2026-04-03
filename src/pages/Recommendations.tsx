/**
 * 📊 Recommandations IA Personnelles - Professional & Optimized
 * Page optimisée avec design professionnel, responsive et fonctionnalités avancées
 * Supporte les 5 systèmes e-commerce : produits digitaux, physiques, services, cours, œuvres d'artiste
 */

import React, { useState } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Heart, Star, RefreshCw, Sparkles, Target, Users, Package } from 'lucide-react';
import { useUserRecommendations, useTrendingRecommendations } from '@/hooks/useAIRecommendations';
import { useStoreContext } from '@/contexts/StoreContext';
import { logger } from '@/lib/logger';
import { AIProductRecommendations } from '@/components/recommendations/AIProductRecommendations';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const Recommendations = () => {
  const { selectedStoreId } = useStoreContext();
  const [refreshKey, setRefreshKey] = useState(0);

  // Animations au scroll
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();

  // Récupérer les recommandations personnalisées
  const {
    data: userRecommendations,
    isLoading: userLoading,
    refetch: refetchUser,
  } = useUserRecommendations({
    limit: 12,
    enabled: !!selectedStoreId,
  });

  // Récupérer les tendances
  const {
    data: trendingRecommendations,
    isLoading: trendingLoading,
    refetch: refetchTrending,
  } = useTrendingRecommendations({
    limit: 8,
    enabled: !!selectedStoreId,
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
    categories: new Set(userRecommendations?.map(r => r.metadata.category).filter(Boolean)).size,
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Header avec animation - Style MyTemplates */}
            <div
              ref={headerRef}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
            >
              <div>
                <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500">
                    <Sparkles
                      className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400"
                      aria-hidden="true"
                    />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Recommandations IA Personnelles
                  </span>
                </h1>
                <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground">
                  Découvrez des produits adaptés à vos goûts et à votre historique d'achat
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleRefresh}
                  variant="outline"
                  size="sm"
                  disabled={userLoading || trendingLoading}
                  className="min-h-[44px] h-9 sm:h-10 text-xs sm:text-sm transition-all hover:scale-105"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 ${userLoading || trendingLoading ? 'animate-spin' : ''}`}
                  />
                  <span className="hidden sm:inline">Actualiser</span>
                  <span className="sm:hidden">Refresh</span>
                </Button>
              </div>
            </div>

            {/* Stats Cards - Style MyTemplates (Purple-Pink Gradient) */}
            <div
              ref={statsRef}
              className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-700"
            >
              {[
                {
                  label: 'Recommandations',
                  value: recommendationStats.total,
                  icon: Target,
                  color: 'from-purple-600 to-pink-600',
                },
                {
                  label: 'Tendances',
                  value: recommendationStats.trending,
                  icon: TrendingUp,
                  color: 'from-blue-600 to-cyan-600',
                },
                {
                  label: 'Catégories',
                  value: recommendationStats.categories,
                  icon: Star,
                  color: 'from-green-600 to-emerald-600',
                },
              ].map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card
                    key={stat.label}
                    className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <CardHeader className="pb-1.5 sm:pb-2 md:pb-3 p-2.5 sm:p-3 md:p-4">
                      <CardTitle className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium text-muted-foreground flex items-center gap-1 sm:gap-1.5 md:gap-2">
                        <Icon className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4" />
                        {stat.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-2.5 sm:p-3 md:p-4 pt-0">
                      <div
                        className={`text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent break-words`}
                      >
                        {stat.value}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
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
                      Basées sur votre historique d'achat, vos préférences et votre comportement de
                      navigation.
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
                          <Card
                            key={recommendation.productId}
                            className="overflow-hidden hover:shadow-lg transition-shadow"
                          >
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
                        <h3 className="text-lg font-medium mb-2">
                          Aucune recommandation disponible
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          Continuez à explorer et acheter pour recevoir des recommandations
                          personnalisées.
                        </p>
                        <Button onClick={() => (window.location.href = '/marketplace')}>
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
                          <Card
                            key={recommendation.productId}
                            className="overflow-hidden hover:shadow-lg transition-shadow"
                          >
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
                    <h4 className="font-medium mb-2">
                      Conseils pour de meilleures recommandations
                    </h4>
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
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Recommendations;
