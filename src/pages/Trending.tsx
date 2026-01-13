/**
 * Page des Tendances Produits
 * Montre les produits qui gagnent en popularité
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, Flame, Clock, Calendar, BarChart3, Zap } from 'lucide-react';
import { useTrendingRecommendations } from '@/hooks/useAIRecommendations';
import { useStoreContext } from '@/contexts/StoreContext';
import { logger } from '@/lib/logger';

const Trending = () => {
  const { selectedStoreId } = useStoreContext();
  const [timeRange, setTimeRange] = useState('7d');
  const [activeTab, setActiveTab] = useState('all');

  const { data: trendingData, isLoading } = useTrendingRecommendations({
    limit: 20,
    enabled: !!selectedStoreId
  });

  const timeRanges = [
    { value: '24h', label: '24 heures', icon: Clock },
    { value: '7d', label: '7 jours', icon: Calendar },
    { value: '30d', label: '30 jours', icon: BarChart3 }
  ];

  const trendingCategories = [
    { id: 'all', label: 'Tous les produits', icon: Flame },
    { id: 'digital', label: 'Produits digitaux', icon: Zap },
    { id: 'physical', label: 'Produits physiques', icon: BarChart3 },
    { id: 'services', label: 'Services', icon: TrendingUp }
  ];

  const getTrendingLevel = (score: number) => {
    if (score >= 80) return { level: '🔥 Viral', color: 'text-red-500', bg: 'bg-red-50' };
    if (score >= 60) return { level: '📈 Très populaire', color: 'text-orange-500', bg: 'bg-orange-50' };
    if (score >= 40) return { level: '📊 En hausse', color: 'text-blue-500', bg: 'bg-blue-50' };
    return { level: '📈 Émergent', color: 'text-green-500', bg: 'bg-green-50' };
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-orange-500" />
            Tendances Produits
          </h1>
          <p className="text-muted-foreground mt-2">
            Découvrez les produits qui gagnent en popularité et font parler d'eux
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeRanges.map(range => {
                const IconComponent = range.icon;
                return (
                  <SelectItem key={range.value} value={range.value}>
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-4 w-4" />
                      {range.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats des tendances */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Produits tendance</p>
                <p className="text-2xl font-bold">{trendingData?.length || 0}</p>
              </div>
              <Flame className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Croissance max</p>
                <p className="text-2xl font-bold">
                  {trendingData?.length ? Math.max(...trendingData.map(t => t.score)) * 100 : 0}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Période</p>
                <p className="text-2xl font-bold">{timeRanges.find(r => r.value === timeRange)?.label}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Mise à jour</p>
                <p className="text-2xl font-bold">Auto</p>
              </div>
              <Zap className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          {trendingCategories.map(category => {
            const IconComponent = category.icon;
            return (
              <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2">
                <IconComponent className="h-4 w-4" />
                {category.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Tous les produits */}
        <TabsContent value="all" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-red-500" />
                Toutes les Tendances
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                Les produits qui gagnent le plus en popularité sur notre plateforme,
                toutes catégories confondues.
              </p>

              {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-4">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-6 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : trendingData && trendingData.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {trendingData.slice(0, 12).map((trend, index) => {
                    const trendingInfo = getTrendingLevel(trend.score);
                    return (
                      <Card key={trend.productId} className="overflow-hidden hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <Badge variant="secondary" className="text-xs">
                              #{index + 1}
                            </Badge>
                            <Badge className={`${trendingInfo.color} ${trendingInfo.bg} border-0`}>
                              {trendingInfo.level}
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            <h4 className="font-medium line-clamp-2">
                              Produit tendance #{trend.productId.slice(-8)}
                            </h4>

                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-green-500" />
                              <span className="text-sm font-medium">
                                {Math.round(trend.score * 100)}% de croissance
                              </span>
                            </div>

                            <p className="text-xs text-muted-foreground">
                              Score de tendance calculé par IA
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Aucune tendance disponible</h3>
                  <p className="text-muted-foreground mb-4">
                    Les tendances se mettent à jour en temps réel. Revenez plus tard !
                  </p>
                  <Button onClick={() => window.location.reload()}>
                    Actualiser
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Produits digitaux */}
        <TabsContent value="digital" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-500" />
                Tendances Digitales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Les produits digitaux (templates, ebooks, logiciels) qui gagnent en popularité.
              </p>

              <div className="text-center py-8">
                <Zap className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Filtrage par type en développement</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Produits physiques */}
        <TabsContent value="physical" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-500" />
                Tendances Physiques
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Les produits physiques qui font le buzz sur notre marketplace.
              </p>

              <div className="text-center py-8">
                <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Filtrage par type en développement</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Services */}
        <TabsContent value="services" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-500" />
                Tendances Services
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Les services qui attirent le plus de demandes actuellement.
              </p>

              <div className="text-center py-8">
                <TrendingUp className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Filtrage par type en développement</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Explication des tendances */}
      <Card>
        <CardHeader>
          <CardTitle>Comment calculons-nous les tendances ?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-3">Métriques analysées</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Nombre de vues récentes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Ajouts au panier</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Achats effectués</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Taux de conversion</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Périodes de calcul</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>24h : Tendances ultra-récentes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span>7j : Tendances hebdomadaires</span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-green-500" />
                  <span>30j : Tendances mensuelles</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              🤖 Intelligence Artificielle
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Nos algorithmes analysent en temps réel le comportement des utilisateurs pour identifier
              les véritables tendances émergentes, pas seulement les produits populaires.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Trending;