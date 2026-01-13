/**
 * Page de Découvertes Personnalisées
 * Permet aux utilisateurs de découvrir de nouveaux produits de manière intelligente
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Compass, Shuffle, Star, Package, Users } from 'lucide-react';
import { AIProductRecommendations } from '@/components/recommendations/AIProductRecommendations';
import { useStoreContext } from '@/contexts/StoreContext';
import { logger } from '@/lib/logger';

const Discover = () => {
  const { selectedStoreId } = useStoreContext();
  const [activeTab, setActiveTab] = useState('cross-type');

  const discoveryCategories = [
    {
      id: 'cross-type',
      title: 'Découvertes Multi-types',
      description: 'Explorez différents types de produits pour élargir vos horizons',
      icon: Compass,
      color: 'text-blue-500'
    },
    {
      id: 'similar-users',
      title: 'Comme vos semblables',
      description: 'Ce que les utilisateurs avec des goûts similaires ont aimé',
      icon: Users,
      color: 'text-green-500'
    },
    {
      id: 'random-curated',
      title: 'Sélection Curatée',
      description: 'Une sélection aléatoire mais de qualité des meilleurs produits',
      icon: Sparkles,
      color: 'text-purple-500'
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Compass className="h-8 w-8 text-blue-500" />
            Découvertes Personnalisées
          </h1>
          <p className="text-muted-foreground mt-2">
            Explorez de nouveaux produits et laissez-vous surprendre par nos recommandations intelligentes
          </p>
        </div>
      </div>

      {/* Stats de découverte */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nouveaux produits</p>
                <p className="text-2xl font-bold">1,247</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Vendeurs actifs</p>
                <p className="text-2xl font-bold">89</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Catégories</p>
                <p className="text-2xl font-bold">24</p>
              </div>
              <Star className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Découvertes IA</p>
                <p className="text-2xl font-bold">∞</p>
              </div>
              <Sparkles className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          {discoveryCategories.map(category => {
            const IconComponent = category.icon;
            return (
              <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2">
                <IconComponent className="h-4 w-4" />
                {category.title}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Découvertes multi-types */}
        <TabsContent value="cross-type" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Compass className="h-5 w-5 text-blue-500" />
                Découvertes Multi-types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Explorez différents types de produits : digital, physique, services, cours et œuvres d'art.
                Laissez-vous surprendre par des découvertes inattendues !
              </p>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
                {[
                  { type: 'Digital', icon: '💻', description: 'Templates, ebooks, logiciels' },
                  { type: 'Physique', icon: '📦', description: 'Produits tangibles, vêtements' },
                  { type: 'Services', icon: '🛠️', description: 'Prestations, formations' },
                  { type: 'Cours', icon: '📚', description: 'Formations en ligne' },
                  { type: 'Art', icon: '🎨', description: 'Œuvres d\'artistes' }
                ].map((item) => (
                  <Card key={item.type} className="text-center p-4">
                    <div className="text-2xl mb-2">{item.icon}</div>
                    <h4 className="font-medium text-sm">{item.type}</h4>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </Card>
                ))}
              </div>

              <AIProductRecommendations
                title=""
                limit={16}
                showReasoning={true}
                layout="grid"
                className="border-none bg-transparent shadow-none p-0"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comme vos semblables */}
        <TabsContent value="similar-users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-500" />
                Comme vos semblables
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Découvrez ce que les utilisateurs ayant des goûts similaires aux vôtres ont apprécié.
                L'intelligence artificielle analyse les patterns d'achat pour vous proposer des découvertes pertinentes.
              </p>

              <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg mb-6">
                <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
                  🤝 Comment ça marche ?
                </h4>
                <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                  <li>• Analyse de votre historique d'achat</li>
                  <li>• Recherche d'utilisateurs avec des patterns similaires</li>
                  <li>• Proposition des produits qu'ils ont aimés</li>
                  <li>• Apprentissage continu de vos préférences</li>
                </ul>
              </div>

              <AIProductRecommendations
                userId={selectedStoreId}
                title=""
                limit={12}
                showReasoning={true}
                layout="grid"
                className="border-none bg-transparent shadow-none p-0"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sélection curatée */}
        <TabsContent value="random-curated" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                Sélection Curatée Aléatoire
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Laissez le hasard vous guider ! Une sélection aléatoire mais intelligente des meilleurs produits
                de notre plateforme, choisie par nos algorithmes de qualité.
              </p>

              <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg mb-6">
                <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">
                  🎲 Pourquoi aléatoire ?
                </h4>
                <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-1">
                  <li>• Sortez de votre zone de confort</li>
                  <li>• Découvrez des produits inattendus</li>
                  <li>• Tous les produits sont de qualité vérifiée</li>
                  <li>• L'aléatoire est pondéré par les notes et avis</li>
                </ul>
              </div>

              <div className="text-center py-12">
                <Shuffle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Fonctionnalité en développement</h3>
                <p className="text-muted-foreground mb-4">
                  Cette fonctionnalité de découverte aléatoire intelligente arrive bientôt !
                </p>
                <Button onClick={() => window.location.href = '/marketplace'}>
                  Explorer le Marketplace en attendant
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Call to action */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
        <CardContent className="p-8 text-center">
          <Sparkles className="h-12 w-12 text-purple-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Continuez votre exploration</h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Plus vous explorez, achetez et interagissez avec les produits, plus nos recommandations
            deviennent précises et personnalisées. Laissez-vous guider par l'IA !
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => window.location.href = '/marketplace'} size="lg">
              Explorer le Marketplace
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/recommendations'} size="lg">
              Mes Recommandations
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Discover;