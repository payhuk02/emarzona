/**
 * Page d'analytics prédictif pour les vendeurs
 * Interface complète pour analyser les prévisions et tendances
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PredictiveDashboard } from '@/components/analytics/PredictiveDashboard';
import { RecommendationAnalytics } from '@/components/analytics/RecommendationAnalytics';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, BarChart3, Target, Users, Package } from 'lucide-react';
import { useStoreContext } from '@/contexts/StoreContext';

const PredictiveAnalyticsPage = () => {
  const { store } = useStoreContext();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Analytics Prédictif IA</h1>
            <p className="text-muted-foreground">
              Découvrez l'avenir de vos ventes avec notre intelligence artificielle avancée
            </p>
          </div>
        </div>

        {/* Fonctionnalités clés */}
        <div className="flex flex-wrap gap-2 mt-4">
          <Badge variant="secondary" className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Prédictions de ventes
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Package className="h-3 w-3" />
            Optimisation des stocks
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            Analyse comportementale
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Target className="h-3 w-3" />
            Recommandations IA
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <BarChart3 className="h-3 w-3" />
            Tendances par catégorie
          </Badge>
        </div>
      </div>

      {/* Onglets principaux */}
      <Tabs defaultValue="predictions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="predictions" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Prédictions & Tendances
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Recommandations IA
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Insights Avancés
          </TabsTrigger>
        </TabsList>

        <TabsContent value="predictions" className="space-y-6">
          <PredictiveDashboard />
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <RecommendationAnalytics storeId={store?.id} />
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Insights sur les clients */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Insights Clients
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Clients à haut potentiel</span>
                    <Badge>Premium</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    24 clients identifiés comme ayant un potentiel de valeur vie client supérieur à 500€
                  </p>
                  <div className="mt-3 flex justify-between text-xs text-muted-foreground">
                    <span>Taux de conversion: 78%</span>
                    <span>Revenus moyens: 320€</span>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Risque de désabonnement</span>
                    <Badge variant="destructive">Élevé</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    12 clients n'ont pas acheté depuis plus de 60 jours
                  </p>
                  <div className="mt-3 flex justify-between text-xs text-muted-foreground">
                    <span>Risque moyen: 65%</span>
                    <span>Action recommandée: Campagne de réactivation</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Insights sur les produits */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Insights Produits
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Étoiles montantes</span>
                    <Badge className="bg-green-500">+45%</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    8 produits montrent une croissance significative ces 30 derniers jours
                  </p>
                  <div className="mt-3 flex justify-between text-xs text-muted-foreground">
                    <span>Croissance moyenne: 35%</span>
                    <span>Top catégorie: Électronique</span>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Produits à risque</span>
                    <Badge variant="destructive">-28%</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    3 produits montrent un déclin des ventes nécessitant une attention
                  </p>
                  <div className="mt-3 flex justify-between text-xs text-muted-foreground">
                    <span>Déclin moyen: 22%</span>
                    <span>Action: Révision prix/positionnement</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommandations stratégiques */}
          <Card>
            <CardHeader>
              <CardTitle>Recommandations Stratégiques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-blue-500 rounded-full">
                      <TrendingUp className="h-4 w-4 text-white" />
                    </div>
                    <h4 className="font-medium">Croissance Produits</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Augmentez les stocks et le marketing pour vos produits en croissance (+35% en moyenne).
                  </p>
                  <div className="text-xs text-blue-600 font-medium">
                    Impact potentiel: +€2,450/mois
                  </div>
                </div>

                <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-green-500 rounded-full">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                    <h4 className="font-medium">Rétention Clients</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Lancez une campagne de réactivation pour vos 12 clients à risque de désabonnement.
                  </p>
                  <div className="text-xs text-green-600 font-medium">
                    Taux de succès estimé: 34%
                  </div>
                </div>

                <div className="p-4 border rounded-lg bg-purple-50 dark:bg-purple-950/20">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-purple-500 rounded-full">
                      <Target className="h-4 w-4 text-white" />
                    </div>
                    <h4 className="font-medium">Optimisation Stocks</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Réduisez vos coûts de stockage en optimisant les niveaux de réapprovisionnement.
                  </p>
                  <div className="text-xs text-purple-600 font-medium">
                    Économies potentielles: €890/mois
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PredictiveAnalyticsPage;