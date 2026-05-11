/**
 * 📈 Recommandations Basées sur l'Historique - Professional & Optimized
 * Page optimisée avec design professionnel, responsive et fonctionnalités avancées
 * Supporte les 5 systèmes e-commerce : produits digitaux, physiques, services, cours, œuvres d'artiste
 */

import React, { useState, useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  History,
  RefreshCw,
  TrendingUp,
  Heart,
  Star,
  Clock,
  ShoppingBag,
  FileText,
  Package,
  Wrench,
  GraduationCap,
  Palette,
} from 'lucide-react';
import { useUserRecommendations, useTrendingRecommendations } from '@/hooks/useAIRecommendations';
import { useStoreContext } from '@/contexts/StoreContext';
import { logger } from '@/lib/logger';
import { AIProductRecommendations } from '@/components/recommendations/AIProductRecommendations';
import { useProductRecommendations } from '@/hooks/useProductRecommendations';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const HistoryBasedRecommendations = () => {
  const { selectedStoreId } = useStoreContext();
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState('personal');

  // Animations au scroll
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();

  // Utiliser les hooks de recommandations
  const {
    data: personalRecommendations,
    isLoading: loadingPersonal,
    error: errorPersonal,
    refetch: refetchPersonal,
  } = useUserRecommendations();

  const {
    data: trendingRecommendations,
    isLoading: loadingTrending,
    error: errorTrending,
    refetch: refetchTrending,
  } = useTrendingRecommendations();

  // Statistiques par catégorie
  const digitalCount = (personalRecommendations || []).filter(p => p.type === 'digital').length;
  const physicalCount = (personalRecommendations || []).filter(p => p.type === 'physical').length;
  const servicesCount = (personalRecommendations || []).filter(p => p.type === 'service').length;
  const coursesCount = (personalRecommendations || []).filter(p => p.type === 'course').length;
  const artworkCount = (personalRecommendations || []).filter(p => p.type === 'artwork').length;

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    refetchPersonal();
    refetchTrending();
    logger.info('History-based recommendations refreshed');
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
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/5 backdrop-blur-sm border border-blue-500/20 animate-in zoom-in duration-500">
                    <History
                      className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-blue-500 dark:text-blue-400"
                      aria-hidden="true"
                    />
                  </div>
                  <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    Recommandations Basées sur Votre Historique
                  </span>
                </h1>
                <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground">
                  Découvrez des produits personnalisés selon vos achats et préférences passés
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleRefresh}
                  size="sm"
                  className="min-h-[44px] h-9 sm:h-10 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-xs sm:text-sm"
                >
                  <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  <span className="hidden sm:inline">Rafraîchir</span>
                </Button>
              </div>
            </div>

            {/* Stats Cards - Style MyTemplates (Blue-Cyan Gradient) */}
            <div
              ref={statsRef}
              className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 animate-in fade-in slide-in-from-bottom-4 duration-700"
            >
              {[
                {
                  label: 'Produits Digitaux',
                  value: digitalCount,
                  icon: FileText,
                  color: 'from-blue-600 to-cyan-600',
                },
                {
                  label: 'Produits Physiques',
                  value: physicalCount,
                  icon: Package,
                  color: 'from-green-600 to-emerald-600',
                },
                {
                  label: 'Services',
                  value: servicesCount,
                  icon: Wrench,
                  color: 'from-orange-600 to-red-600',
                },
                {
                  label: 'Cours en Ligne',
                  value: coursesCount,
                  icon: GraduationCap,
                  color: 'from-purple-600 to-pink-600',
                },
                {
                  label: "Œuvres d'Artiste",
                  value: artworkCount,
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

            {/* Tabs - Style MyTemplates */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-muted/50 backdrop-blur-sm h-auto p-1 w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 sm:gap-2 sm:inline-flex sm:w-auto">
                <TabsTrigger
                  value="personal"
                  className="flex-1 sm:flex-none gap-1 sm:gap-1.5 lg:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis"
                >
                  <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                  <span className="hidden sm:inline">Toutes</span>
                  <span className="sm:hidden">Toutes</span>
                </TabsTrigger>
                <TabsTrigger
                  value="digital"
                  className="flex-1 sm:flex-none gap-1 sm:gap-1.5 lg:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis"
                >
                  <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                  <span className="hidden sm:inline">Digitaux</span>
                  <span className="sm:hidden">Digitaux</span>
                </TabsTrigger>
                <TabsTrigger
                  value="physical"
                  className="flex-1 sm:flex-none gap-1 sm:gap-1.5 lg:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis"
                >
                  <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                  <span className="hidden sm:inline">Physiques</span>
                  <span className="sm:hidden">Physiques</span>
                </TabsTrigger>
                <TabsTrigger
                  value="services"
                  className="flex-1 sm:flex-none gap-1 sm:gap-1.5 lg:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis"
                >
                  <Wrench className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                  <span className="hidden sm:inline">Services</span>
                  <span className="sm:hidden">Services</span>
                </TabsTrigger>
                <TabsTrigger
                  value="courses"
                  className="flex-1 sm:flex-none gap-1 sm:gap-1.5 lg:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis"
                >
                  <GraduationCap className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                  <span className="hidden sm:inline">Cours</span>
                  <span className="sm:hidden">Cours</span>
                </TabsTrigger>
                <TabsTrigger
                  value="artwork"
                  className="flex-1 sm:flex-none gap-1 sm:gap-1.5 lg:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis"
                >
                  <Palette className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                  <span className="hidden sm:inline">Œuvres</span>
                  <span className="sm:hidden">Œuvres</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="mt-6">
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
                  <AIProductRecommendations
                    key={`personal-${refreshKey}`}
                    recommendations={personalRecommendations || []}
                    isLoading={loadingPersonal}
                    error={errorPersonal}
                    title="Basé sur votre historique complet d'achat et de navigation"
                    emptyMessage="Nous analyserons bientôt vos préférences pour vous proposer des recommandations personnalisées."
                  />
                </div>
              </TabsContent>

              <TabsContent value="digital" className="mt-6">
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
                  <AIProductRecommendations
                    key={`digital-${refreshKey}`}
                    recommendations={(personalRecommendations || []).filter(
                      p => p.type === 'digital'
                    )}
                    isLoading={loadingPersonal}
                    error={errorPersonal}
                    title="E-books, logiciels, templates et ressources numériques"
                    emptyMessage="Découvrez bientôt des produits digitaux adaptés à vos centres d'intérêt."
                  />
                </div>
              </TabsContent>

              <TabsContent value="physical" className="mt-6">
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
                  <AIProductRecommendations
                    key={`physical-${refreshKey}`}
                    recommendations={(personalRecommendations || []).filter(
                      p => p.type === 'physical'
                    )}
                    isLoading={loadingPersonal}
                    error={errorPersonal}
                    title="Articles physiques, matériel et produits tangibles"
                    emptyMessage="Découvrez bientôt des produits physiques qui pourraient vous intéresser."
                  />
                </div>
              </TabsContent>

              <TabsContent value="services" className="mt-6">
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
                  <AIProductRecommendations
                    key={`services-${refreshKey}`}
                    recommendations={(personalRecommendations || []).filter(
                      p => p.type === 'service'
                    )}
                    isLoading={loadingPersonal}
                    error={errorPersonal}
                    title="Services professionnels, consulting et prestations"
                    emptyMessage="Découvrez bientôt des services adaptés à vos besoins."
                  />
                </div>
              </TabsContent>

              <TabsContent value="courses" className="mt-6">
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
                  <AIProductRecommendations
                    key={`courses-${refreshKey}`}
                    recommendations={(personalRecommendations || []).filter(
                      p => p.type === 'course'
                    )}
                    isLoading={loadingPersonal}
                    error={errorPersonal}
                    title="Formations, tutoriels et cours de spécialisation"
                    emptyMessage="Découvrez bientôt des cours adaptés à votre profil d'apprentissage."
                  />
                </div>
              </TabsContent>

              <TabsContent value="artwork" className="mt-6">
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
                  <AIProductRecommendations
                    key={`artwork-${refreshKey}`}
                    recommendations={(personalRecommendations || []).filter(
                      p => p.type === 'artwork'
                    )}
                    isLoading={loadingPersonal}
                    error={errorPersonal}
                    title="Peintures, sculptures, photographies et œuvres d'art originales"
                    emptyMessage="Découvrez bientôt des œuvres d'art qui pourraient vous inspirer."
                  />
                </div>
              </TabsContent>
            </Tabs>

            {/* Footer Info */}
            <div className="mt-12 p-6 bg-muted/30 rounded-lg">
              <div className="flex items-start gap-3">
                <Star className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <h3 className="font-medium mb-2">Découvrez nos 5 systèmes e-commerce</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Produits Digitaux</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Produits Physiques</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium">Services</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium">Cours en Ligne</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Palette className="h-4 w-4 text-pink-600" />
                      <span className="text-sm font-medium">Œuvres d'Artiste</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>
                      Nos recommandations IA analysent votre historique complet pour vous proposer
                      des produits pertinents dans chacune de nos catégories :
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Vos achats passés et préférences d'achat</li>
                      <li>Les produits consultés et ajoutés aux favoris</li>
                      <li>Les tendances du marché par catégorie</li>
                      <li>Les comportements similaires d'autres utilisateurs</li>
                      <li>Vos interactions avec chaque type de produit</li>
                    </ul>
                    <p className="mt-3">
                      Plus vous explorez nos différentes catégories, plus nos recommandations
                      deviennent précises et personnalisées pour chaque système e-commerce.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default React.memo(HistoryBasedRecommendations);
