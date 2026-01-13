/**
 * Page d'administration - Paramètres des Recommandations IA
 * Permet de configurer tous les aspects du système de recommandations
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Settings,
  Brain,
  Target,
  BarChart3,
  Save,
  RotateCcw,
  Info,
  AlertTriangle,
  CheckCircle,
  Zap,
  Users,
  Package,
  ShoppingCart,
  TrendingUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface RecommendationSettings {
  // Algorithmes actifs
  algorithms: {
    collaborative: boolean;
    contentBased: boolean;
    trending: boolean;
    behavioral: boolean;
    crossType: boolean;
  };

  // Poids des algorithmes (0-100)
  weights: {
    collaborative: number;
    contentBased: number;
    trending: number;
    behavioral: number;
    crossType: number;
  };

  // Paramètres de similarité
  similarity: {
    categoryWeight: number;    // Poids de la catégorie (0-100)
    tagsWeight: number;        // Poids des tags (0-100)
    priceWeight: number;       // Poids du prix (0-100)
    typeWeight: number;        // Poids du type de produit (0-100)
    priceTolerance: number;    // Tolérance prix (±%)
  };

  // Paramètres par type de produit
  productTypes: {
    digital: {
      enabled: boolean;
      maxRecommendations: number;
      similarityThreshold: number;
    };
    physical: {
      enabled: boolean;
      maxRecommendations: number;
      similarityThreshold: number;
    };
    service: {
      enabled: boolean;
      maxRecommendations: number;
      similarityThreshold: number;
    };
    course: {
      enabled: boolean;
      maxRecommendations: number;
      similarityThreshold: number;
    };
    artist: {
      enabled: boolean;
      maxRecommendations: number;
      similarityThreshold: number;
    };
  };

  // Limitations générales
  limits: {
    maxRecommendationsPerPage: number;
    minConfidenceThreshold: number;
    cacheExpiryMinutes: number;
    enablePersonalization: boolean;
  };

  // Règles de fallback
  fallbacks: {
    fallbackToTrending: boolean;
    fallbackToPopular: boolean;
    fallbackToCategory: boolean;
    fallbackToStore: boolean;
  };
}

const defaultSettings: RecommendationSettings = {
  algorithms: {
    collaborative: true,
    contentBased: true,
    trending: true,
    behavioral: true,
    crossType: false
  },
  weights: {
    collaborative: 25,
    contentBased: 30,
    trending: 20,
    behavioral: 20,
    crossType: 5
  },
  similarity: {
    categoryWeight: 30,
    tagsWeight: 25,
    priceWeight: 20,
    typeWeight: 25,
    priceTolerance: 20
  },
  productTypes: {
    digital: { enabled: true, maxRecommendations: 6, similarityThreshold: 0.3 },
    physical: { enabled: true, maxRecommendations: 6, similarityThreshold: 0.3 },
    service: { enabled: true, maxRecommendations: 4, similarityThreshold: 0.4 },
    course: { enabled: true, maxRecommendations: 4, similarityThreshold: 0.4 },
    artist: { enabled: true, maxRecommendations: 3, similarityThreshold: 0.5 }
  },
  limits: {
    maxRecommendationsPerPage: 8,
    minConfidenceThreshold: 0.3,
    cacheExpiryMinutes: 30,
    enablePersonalization: true
  },
  fallbacks: {
    fallbackToTrending: true,
    fallbackToPopular: true,
    fallbackToCategory: true,
    fallbackToStore: false
  }
};

const AISettingsPage = () => {
  const [settings, setSettings] = useState<RecommendationSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  // Charger les paramètres
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('platform_settings')
        .select('ai_recommendation_settings')
        .single();

      if (error) throw error;

      if (data?.ai_recommendation_settings) {
        try {
          const loadedSettings = data.ai_recommendation_settings as RecommendationSettings;
          setSettings(loadedSettings);
        } catch (e) {
          logger.warn('Failed to parse AI recommendation settings', { data: data.ai_recommendation_settings });
        }
      }
    } catch (error) {
      logger.error('Error loading AI settings', { error });
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les paramètres des recommandations IA.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Sauvegarder les paramètres
  const saveSettings = async () => {
    try {
      setIsSaving(true);

      const { error } = await supabase
        .from('platform_settings')
        .update({
          ai_recommendation_settings: settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', '00000000-0000-0000-0000-000000000001');

      if (error) throw error;

      setHasChanges(false);
      toast({
        title: 'Paramètres sauvegardés',
        description: 'Les paramètres des recommandations IA ont été mis à jour avec succès.',
      });

      logger.info('AI recommendation settings saved', { settings });
    } catch (error) {
      logger.error('Error saving AI settings', { error });
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder les paramètres.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Réinitialiser aux valeurs par défaut
  const resetToDefaults = () => {
    setSettings(defaultSettings);
    setHasChanges(true);
    toast({
      title: 'Paramètres réinitialisés',
      description: 'Les paramètres ont été remis aux valeurs par défaut.',
    });
  };

  // Mettre à jour un paramètre
  const updateSetting = (path: string, value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      const keys = path.split('.');
      let current: any = newSettings;

      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }


  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Brain className="h-8 w-8 text-purple-500" />
            Paramètres des Recommandations IA
          </h1>
          <p className="text-muted-foreground mt-2">
            Configurez les algorithmes, poids et règles de vos recommandations personnalisées
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={resetToDefaults}
            disabled={isSaving}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Réinitialiser
          </Button>
          <Button
            onClick={saveSettings}
            disabled={isSaving || !hasChanges}
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </div>

      {/* Alert pour les changements non sauvegardés */}
      {hasChanges && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Modifications en attente</AlertTitle>
          <AlertDescription>
            Vous avez des modifications non sauvegardées. Cliquez sur "Sauvegarder" pour les appliquer.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="algorithms" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="algorithms">Algorithmes</TabsTrigger>
          <TabsTrigger value="similarity">Similarité</TabsTrigger>
          <TabsTrigger value="product-types">Types Produits</TabsTrigger>
          <TabsTrigger value="limits">Limitations</TabsTrigger>
          <TabsTrigger value="fallbacks">Fallbacks</TabsTrigger>
        </TabsList>

        {/* Onglet Algorithmes */}
        <TabsContent value="algorithms" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Algorithmes de Recommandation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Algorithmes actifs */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Algorithmes actifs</h3>
                  <div className="space-y-3">
                    {Object.entries(settings.algorithms).map(([key, enabled]) => (
                      <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium capitalize">
                            {key === 'collaborative' && 'Collaboratif'}
                            {key === 'contentBased' && 'Basé sur le contenu'}
                            {key === 'trending' && 'Tendances'}
                            {key === 'behavioral' && 'Comportemental'}
                            {key === 'crossType' && 'Cross-type'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {key === 'collaborative' && 'Recommande des produits populaires auprès d\'utilisateurs similaires'}
                            {key === 'contentBased' && 'Recommande des produits similaires au produit actuel'}
                            {key === 'trending' && 'Recommande les produits tendance'}
                            {key === 'behavioral' && 'Basé sur l\'historique de navigation'}
                            {key === 'crossType' && 'Recommande des produits d\'autres types'}
                          </div>
                        </div>
                        <Switch
                          checked={enabled}
                          onCheckedChange={(checked) => updateSetting(`algorithms.${key}`, checked)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Poids des algorithmes */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Poids des algorithmes</h3>
                  <div className="space-y-4">
                    {Object.entries(settings.weights).map(([key, weight]) => (
                      <div key={key} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-medium capitalize">
                            {key === 'collaborative' && 'Collaboratif'}
                            {key === 'contentBased' && 'Basé sur le contenu'}
                            {key === 'trending' && 'Tendances'}
                            {key === 'behavioral' && 'Comportemental'}
                            {key === 'crossType' && 'Cross-type'}
                          </label>
                          <Badge variant="outline">{weight}%</Badge>
                        </div>
                        <Slider
                          value={[weight]}
                          onValueChange={([value]) => updateSetting(`weights.${key}`, value)}
                          max={100}
                          min={0}
                          step={5}
                          className="w-full"
                        />
                      </div>
                    ))}
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Total des poids</AlertTitle>
                    <AlertDescription>
                      La somme des poids devrait idéalement être de 100%.
                      Actuellement: {Object.values(settings.weights).reduce((a, b) => a + b, 0)}%
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Similarité */}
        <TabsContent value="similarity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Paramètres de Similarité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Poids des critères */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Poids des critères de similarité</h3>
                  <div className="space-y-4">
                    {Object.entries(settings.similarity).filter(([key]) => key.includes('Weight')).map(([key, weight]) => (
                      <div key={key} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-medium">
                            {key === 'categoryWeight' && 'Catégorie'}
                            {key === 'tagsWeight' && 'Tags'}
                            {key === 'priceWeight' && 'Prix'}
                            {key === 'typeWeight' && 'Type de produit'}
                          </label>
                          <Badge variant="outline">{weight}%</Badge>
                        </div>
                        <Slider
                          value={[weight]}
                          onValueChange={([value]) => updateSetting(`similarity.${key}`, value)}
                          max={100}
                          min={0}
                          step={5}
                          className="w-full"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tolérances */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Tolérances et seuils</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium">Tolérance prix</label>
                        <Badge variant="outline">±{settings.similarity.priceTolerance}%</Badge>
                      </div>
                      <Slider
                        value={[settings.similarity.priceTolerance]}
                        onValueChange={([value]) => updateSetting('similarity.priceTolerance', value)}
                        max={100}
                        min={5}
                        step={5}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        Pourcentage de variation acceptable pour considérer deux prix similaires
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Calcul de similarité</AlertTitle>
                <AlertDescription>
                  Score = (Catégorie × {settings.similarity.categoryWeight}% + Tags × {settings.similarity.tagsWeight}% + Prix × {settings.similarity.priceWeight}% + Type × {settings.similarity.typeWeight}%) / 100
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Types de Produits */}
        <TabsContent value="product-types" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Configuration par Type de Produit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(settings.productTypes).map(([type, config]) => (
                  <Card key={type} className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium capitalize flex items-center gap-2">
                          {type === 'digital' && <><Package className="h-4 w-4" /> Digital</>}
                          {type === 'physical' && <><ShoppingCart className="h-4 w-4" /> Physique</>}
                          {type === 'service' && <><Users className="h-4 w-4" /> Service</>}
                          {type === 'course' && <><BarChart3 className="h-4 w-4" /> Cours</>}
                          {type === 'artist' && <><Target className="h-4 w-4" /> Œuvre</>}
                        </h4>
                        <Switch
                          checked={config.enabled}
                          onCheckedChange={(checked) => updateSetting(`productTypes.${type}.enabled`, checked)}
                        />
                      </div>

                      {config.enabled && (
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>Max recommandations</span>
                              <span>{config.maxRecommendations}</span>
                            </div>
                            <Slider
                              value={[config.maxRecommendations]}
                              onValueChange={([value]) => updateSetting(`productTypes.${type}.maxRecommendations`, value)}
                              max={12}
                              min={1}
                              step={1}
                              className="w-full"
                            />
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>Seuil similarité</span>
                              <span>{config.similarityThreshold}</span>
                            </div>
                            <Slider
                              value={[config.similarityThreshold]}
                              onValueChange={([value]) => updateSetting(`productTypes.${type}.similarityThreshold`, value)}
                              max={1}
                              min={0}
                              step={0.1}
                              className="w-full"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Limitations */}
        <TabsContent value="limits" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Limitations et Performances
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Limitations générales</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium">Max recommandations par page</label>
                        <Badge variant="outline">{settings.limits.maxRecommendationsPerPage}</Badge>
                      </div>
                      <Slider
                        value={[settings.limits.maxRecommendationsPerPage]}
                        onValueChange={([value]) => updateSetting('limits.maxRecommendationsPerPage', value)}
                        max={20}
                        min={1}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium">Seuil de confiance minimum</label>
                        <Badge variant="outline">{settings.limits.minConfidenceThreshold}</Badge>
                      </div>
                      <Slider
                        value={[settings.limits.minConfidenceThreshold]}
                        onValueChange={([value]) => updateSetting('limits.minConfidenceThreshold', value)}
                        max={1}
                        min={0}
                        step={0.1}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Cache et performance</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium">Expiration cache (minutes)</label>
                        <Badge variant="outline">{settings.limits.cacheExpiryMinutes}</Badge>
                      </div>
                      <Slider
                        value={[settings.limits.cacheExpiryMinutes]}
                        onValueChange={([value]) => updateSetting('limits.cacheExpiryMinutes', value)}
                        max={120}
                        min={5}
                        step={5}
                        className="w-full"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Personnalisation activée</div>
                        <div className="text-sm text-muted-foreground">
                          Utilise les données utilisateur pour des recommandations personnalisées
                        </div>
                      </div>
                      <Switch
                        checked={settings.limits.enablePersonalization}
                        onCheckedChange={(checked) => updateSetting('limits.enablePersonalization', checked)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Fallbacks */}
        <TabsContent value="fallbacks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Règles de Fallback
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Ces règles définissent ce qui se passe quand il n'y a pas assez de recommandations
                  pertinentes pour un utilisateur ou produit spécifique.
                </p>

                <div className="grid gap-4 md:grid-cols-2">
                  {Object.entries(settings.fallbacks).map(([key, enabled]) => (
                    <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">
                          {key === 'fallbackToTrending' && 'Fallback vers tendances'}
                          {key === 'fallbackToPopular' && 'Fallback vers populaires'}
                          {key === 'fallbackToCategory' && 'Fallback vers catégorie'}
                          {key === 'fallbackToStore' && 'Fallback vers boutique'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {key === 'fallbackToTrending' && 'Affiche les produits tendance si pas de recommandations personnalisées'}
                          {key === 'fallbackToPopular' && 'Affiche les produits les plus populaires'}
                          {key === 'fallbackToCategory' && 'Affiche des produits de la même catégorie'}
                          {key === 'fallbackToStore' && 'Affiche d\'autres produits de la même boutique'}
                        </div>
                      </div>
                      <Switch
                        checked={enabled}
                        onCheckedChange={(checked) => updateSetting(`fallbacks.${key}`, checked)}
                      />
                    </div>
                  ))}
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Ordre des fallbacks</AlertTitle>
                  <AlertDescription>
                    1. Tendances → 2. Populaires → 3. Catégorie → 4. Boutique
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Résumé des paramètres */}
      <Card>
        <CardHeader>
          <CardTitle>Résumé des paramètres actifs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <h4 className="font-medium mb-2">Algorithmes actifs</h4>
              <div className="flex flex-wrap gap-1">
                {Object.entries(settings.algorithms).filter(([, enabled]) => enabled).map(([key]) => (
                  <Badge key={key} variant="secondary" className="capitalize">
                    {key === 'collaborative' && 'Collaboratif'}
                    {key === 'contentBased' && 'Contenu'}
                    {key === 'trending' && 'Tendance'}
                    {key === 'behavioral' && 'Comportement'}
                    {key === 'crossType' && 'Cross-type'}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Types de produits actifs</h4>
              <div className="flex flex-wrap gap-1">
                {Object.entries(settings.productTypes).filter(([, config]) => config.enabled).map(([type]) => (
                  <Badge key={type} variant="outline" className="capitalize">
                    {type}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Limitations</h4>
              <div className="text-sm space-y-1">
                <div>Max par page: {settings.limits.maxRecommendationsPerPage}</div>
                <div>Confiance min: {settings.limits.minConfidenceThreshold}</div>
                <div>Cache: {settings.limits.cacheExpiryMinutes}min</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AISettingsPage;