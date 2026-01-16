/**
 * 🔥 Tendances Produits IA - Professional & Optimized
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TrendingUp,
  Flame,
  Clock,
  Calendar,
  BarChart3,
  Zap,
  GraduationCap,
  Palette,
  FileText,
  Package,
  Wrench,
} from 'lucide-react';
import { useTrendingRecommendations } from '@/hooks/useAIRecommendations';
import { useStoreContext } from '@/contexts/StoreContext';
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const Trending = () => {
  const { selectedStoreId } = useStoreContext();
  const [timeRange, setTimeRange] = useState('7d');
  const [activeTab, setActiveTab] = useState('all');

  // Animations au scroll
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const filtersRef = useScrollAnimation<HTMLDivElement>();

  const { data: trendingData, isLoading } = useTrendingRecommendations({
    limit: 20,
    enabled: !!selectedStoreId,
  });

  const timeRanges = [
    { value: '24h', label: '24 heures', icon: Clock },
    { value: '7d', label: '7 jours', icon: Calendar },
    { value: '30d', label: '30 jours', icon: BarChart3 },
  ];

  const trendingCategories = [
    { id: 'all', label: 'Tous les produits', icon: Flame },
    { id: 'digital', label: 'Produits digitaux', icon: FileText },
    { id: 'physical', label: 'Produits physiques', icon: Package },
    { id: 'services', label: 'Services', icon: Wrench },
    { id: 'courses', label: 'Cours en ligne', icon: GraduationCap },
    { id: 'artwork', label: "Œuvres d'artiste", icon: Palette },
  ];

  const getTrendingLevel = (score: number) => {
    if (score >= 80) return { level: '🔥 Viral', color: 'text-red-500', bg: 'bg-red-50' };
    if (score >= 60)
      return { level: '📈 Très populaire', color: 'text-orange-500', bg: 'bg-orange-50' };
    if (score >= 40) return { level: '📊 En hausse', color: 'text-blue-500', bg: 'bg-blue-50' };
    return { level: '📈 Émergent', color: 'text-green-500', bg: 'bg-green-50' };
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
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-orange-500/10 to-red-500/5 backdrop-blur-sm border border-orange-500/20 animate-in zoom-in duration-500">
                    <TrendingUp
                      className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-orange-500 dark:text-orange-400"
                      aria-hidden="true"
                    />
                  </div>
                  <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    Tendances Produits IA
                  </span>
                </h1>
                <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground">
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

            {/* Stats Cards - 5 systèmes e-commerce avec gradients */}
            <div
              ref={filtersRef}
              className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 animate-in fade-in slide-in-from-bottom-4 duration-700"
            >
              {[
                {
                  label: 'Produits Digitaux',
                  value: trendingData?.filter(t => t.type === 'digital').length || 0,
                  icon: FileText,
                  color: 'from-blue-600 to-cyan-600',
                },
                {
                  label: 'Produits Physiques',
                  value: trendingData?.filter(t => t.type === 'physical').length || 0,
                  icon: Package,
                  color: 'from-green-600 to-emerald-600',
                },
                {
                  label: 'Services',
                  value: trendingData?.filter(t => t.type === 'service').length || 0,
                  icon: Wrench,
                  color: 'from-orange-600 to-red-600',
                },
                {
                  label: 'Cours en Ligne',
                  value: trendingData?.filter(t => t.type === 'course').length || 0,
                  icon: GraduationCap,
                  color: 'from-purple-600 to-pink-600',
                },
                {
                  label: "Œuvres d'Artiste",
                  value: trendingData?.filter(t => t.type === 'artwork').length || 0,
                  icon: Palette,
                  color: 'from-pink-600 to-rose-600',
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

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
                {trendingCategories.map(category => {
                  const IconComponent = category.icon;
                  return (
                    <TabsTrigger
                      key={category.id}
                      value={category.id}
                      className="flex items-center gap-2"
                    >
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
                      Les produits qui gagnent le plus en popularité sur notre plateforme, toutes
                      nos 5 catégories e-commerce confondues : produits digitaux, physiques,
                      services, cours en ligne et œuvres d'artiste.
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
                            <Card
                              key={trend.productId}
                              className="overflow-hidden hover:shadow-lg transition-shadow"
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <Badge variant="secondary" className="text-xs">
                                    #{index + 1}
                                  </Badge>
                                  <Badge
                                    className={`${trendingInfo.color} ${trendingInfo.bg} border-0`}
                                  >
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
                        <Button onClick={() => window.location.reload()}>Actualiser</Button>
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
                      <FileText className="h-5 w-5 text-blue-600" />
                      Tendances Produits Digitaux
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Les produits digitaux (e-books, templates, logiciels, ressources) qui gagnent
                      en popularité. Téléchargeables instantanément après achat.
                    </p>

                    <div className="text-center py-8">
                      <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">
                        Filtrage par catégorie en développement
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Produits physiques */}
              <TabsContent value="physical" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-green-600" />
                      Tendances Produits Physiques
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Les produits physiques (articles, matériel, objets) qui font le buzz sur notre
                      marketplace. Livraison garantie et sécurisée.
                    </p>

                    <div className="text-center py-8">
                      <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">
                        Filtrage par catégorie en développement
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Services */}
              <TabsContent value="services" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wrench className="h-5 w-5 text-orange-600" />
                      Tendances Services
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Les services professionnels (consulting, prestations, expertises) qui attirent
                      le plus de demandes. Qualité garantie par nos vendeurs certifiés.
                    </p>

                    <div className="text-center py-8">
                      <Wrench className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">Filtrage par domaine en développement</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Cours en ligne */}
              <TabsContent value="courses" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-purple-600" />
                      Tendances Cours en Ligne
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Les formations et cours en ligne qui attirent le plus d'inscriptions
                      actuellement.
                    </p>

                    <div className="text-center py-8">
                      <GraduationCap className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">Filtrage par domaine en développement</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Œuvres d'artiste */}
              <TabsContent value="artwork" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="h-5 w-5 text-pink-600" />
                      Tendances Œuvres d'Artiste
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Les œuvres d'art originales qui captivent l'attention des collectionneurs.
                    </p>

                    <div className="text-center py-8">
                      <Palette className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">
                        Filtrage par style artistique en développement
                      </p>
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
                <div className="mb-4">
                  <p className="text-muted-foreground">
                    Nos algorithmes analysent en temps réel les 5 systèmes e-commerce de la
                    plateforme :<strong className="text-foreground"> produits digitaux</strong>,
                    <strong className="text-foreground"> produits physiques</strong>,
                    <strong className="text-foreground"> services</strong>,
                    <strong className="text-foreground"> cours en ligne</strong> et
                    <strong className="text-foreground"> œuvres d'artiste</strong>.
                  </p>
                </div>

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
                    Nos algorithmes analysent en temps réel le comportement des utilisateurs pour
                    identifier les véritables tendances émergentes, pas seulement les produits
                    populaires.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Trending;
