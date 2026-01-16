/**
 * Page des Recommandations Basées sur l'Historique
 * Affiche les recommandations personnalisées basées sur l'historique d'achat et de navigation
 * Supporte les 5 systèmes e-commerce : produits digitaux, physiques, services, cours en ligne, œuvres d'artiste
 */

import React, { useState, useEffect } from 'react';
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

const HistoryBasedRecommendations = () => {
  const { selectedStoreId } = useStoreContext();
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState('personal');

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
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <History className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Recommandations Basées sur Votre Historique
            </h1>
            <p className="text-muted-foreground mt-1">
              Découvrez des produits personnalisés selon vos achats et préférences passés
            </p>
          </div>
        </div>

        {/* Stats Cards - 5 systèmes e-commerce */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Produits Digitaux</p>
                  <p className="text-2xl font-bold text-blue-600">{digitalCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Produits Physiques</p>
                  <p className="text-2xl font-bold text-green-600">{physicalCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Wrench className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium">Services</p>
                  <p className="text-2xl font-bold text-orange-600">{servicesCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <GraduationCap className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium">Cours en Ligne</p>
                  <p className="text-2xl font-bold text-purple-600">{coursesCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Palette className="h-5 w-5 text-pink-600" />
                <div>
                  <p className="text-sm font-medium">Œuvres d'Artiste</p>
                  <p className="text-2xl font-bold text-pink-600">{artworkCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Refresh Button */}
        <div className="flex justify-end">
          <Button onClick={handleRefresh} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Content Tabs - 5 systèmes e-commerce */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="personal" className="flex items-center gap-2 text-xs">
            <Heart className="h-3 w-3" />
            Tout
          </TabsTrigger>
          <TabsTrigger value="digital" className="flex items-center gap-2 text-xs">
            <FileText className="h-3 w-3" />
            Digitaux
          </TabsTrigger>
          <TabsTrigger value="physical" className="flex items-center gap-2 text-xs">
            <Package className="h-3 w-3" />
            Physiques
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-2 text-xs">
            <Wrench className="h-3 w-3" />
            Services
          </TabsTrigger>
          <TabsTrigger value="courses" className="flex items-center gap-2 text-xs">
            <GraduationCap className="h-3 w-3" />
            Cours
          </TabsTrigger>
          <TabsTrigger value="artwork" className="flex items-center gap-2 text-xs">
            <Palette className="h-3 w-3" />
            Œuvres
          </TabsTrigger>
        </TabsList>

        {/* Tout - Recommandations Personnalisées */}
        <TabsContent value="personal" className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="h-5 w-5 text-amber-500" />
            <h2 className="text-xl font-semibold">Toutes vos Recommandations Personnalisées</h2>
          </div>

          <AIProductRecommendations
            key={`personal-${refreshKey}`}
            recommendations={personalRecommendations || []}
            isLoading={loadingPersonal}
            error={errorPersonal}
            title="Basé sur votre historique complet d'achat et de navigation"
            emptyMessage="Nous analyserons bientôt vos préférences pour vous proposer des recommandations personnalisées."
          />
        </TabsContent>

        {/* Produits Digitaux */}
        <TabsContent value="digital" className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Produits Digitaux Recommandés</h2>
            <Badge variant="secondary" className="ml-auto">
              Téléchargeables
            </Badge>
          </div>

          <AIProductRecommendations
            key={`digital-${refreshKey}`}
            recommendations={(personalRecommendations || []).filter(p => p.type === 'digital')}
            isLoading={loadingPersonal}
            error={errorPersonal}
            title="E-books, logiciels, templates et ressources numériques"
            emptyMessage="Découvrez bientôt des produits digitaux adaptés à vos centres d'intérêt."
          />
        </TabsContent>

        {/* Produits Physiques */}
        <TabsContent value="physical" className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <Package className="h-5 w-5 text-green-600" />
            <h2 className="text-xl font-semibold">Produits Physiques Recommandés</h2>
            <Badge variant="secondary" className="ml-auto">
              Livraison
            </Badge>
          </div>

          <AIProductRecommendations
            key={`physical-${refreshKey}`}
            recommendations={(personalRecommendations || []).filter(p => p.type === 'physical')}
            isLoading={loadingPersonal}
            error={errorPersonal}
            title="Articles physiques, matériel et produits tangibles"
            emptyMessage="Découvrez bientôt des produits physiques qui pourraient vous intéresser."
          />
        </TabsContent>

        {/* Services */}
        <TabsContent value="services" className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <Wrench className="h-5 w-5 text-orange-600" />
            <h2 className="text-xl font-semibold">Services Recommandés</h2>
            <Badge variant="secondary" className="ml-auto">
              Prestations
            </Badge>
          </div>

          <AIProductRecommendations
            key={`services-${refreshKey}`}
            recommendations={(personalRecommendations || []).filter(p => p.type === 'service')}
            isLoading={loadingPersonal}
            error={errorPersonal}
            title="Services professionnels, consulting et prestations"
            emptyMessage="Découvrez bientôt des services adaptés à vos besoins."
          />
        </TabsContent>

        {/* Cours en Ligne */}
        <TabsContent value="courses" className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <GraduationCap className="h-5 w-5 text-purple-600" />
            <h2 className="text-xl font-semibold">Cours en Ligne Recommandés</h2>
            <Badge variant="secondary" className="ml-auto">
              Formation
            </Badge>
          </div>

          <AIProductRecommendations
            key={`courses-${refreshKey}`}
            recommendations={(personalRecommendations || []).filter(p => p.type === 'course')}
            isLoading={loadingPersonal}
            error={errorPersonal}
            title="Formations, tutoriels et cours de spécialisation"
            emptyMessage="Découvrez bientôt des cours adaptés à votre profil d'apprentissage."
          />
        </TabsContent>

        {/* Œuvres d'Artiste */}
        <TabsContent value="artwork" className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <Palette className="h-5 w-5 text-pink-600" />
            <h2 className="text-xl font-semibold">Œuvres d'Artiste Recommandées</h2>
            <Badge variant="secondary" className="ml-auto">
              Art Original
            </Badge>
          </div>

          <AIProductRecommendations
            key={`artwork-${refreshKey}`}
            recommendations={(personalRecommendations || []).filter(p => p.type === 'artwork')}
            isLoading={loadingPersonal}
            error={errorPersonal}
            title="Peintures, sculptures, photographies et œuvres d'art originales"
            emptyMessage="Découvrez bientôt des œuvres d'art qui pourraient vous inspirer."
          />
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
                Nos recommandations IA analysent votre historique complet pour vous proposer des
                produits pertinents dans chacune de nos catégories :
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Vos achats passés et préférences d'achat</li>
                <li>Les produits consultés et ajoutés aux favoris</li>
                <li>Les tendances du marché par catégorie</li>
                <li>Les comportements similaires d'autres utilisateurs</li>
                <li>Vos interactions avec chaque type de produit</li>
              </ul>
              <p className="mt-3">
                Plus vous explorez nos différentes catégories, plus nos recommandations deviennent
                précises et personnalisées pour chaque système e-commerce.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(HistoryBasedRecommendations);
