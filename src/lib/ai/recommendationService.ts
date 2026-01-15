/**
 * Service de Recommandation IA
 * Gère la logique de génération de recommandations de produits basée sur les paramètres configurables.
 * Date: Janvier 2026
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { ChatSessionContext } from './chatbot'; // Utilise le contexte de session du chatbot

// Interfaces pour les paramètres de recommandation (copiées/adaptées de AISettingsPage.tsx)
export interface RecommendationSettings {
  algorithms: {
    collaborative: boolean;
    contentBased: boolean;
    trending: boolean;
    behavioral: boolean;
    crossType: boolean;
  };
  weights: {
    collaborative: number;
    contentBased: number;
    trending: number;
    behavioral: number;
    crossType: number;
  };
  similarity: {
    categoryWeight: number;
    tagsWeight: number;
    priceWeight: number;
    typeWeight: number;
    priceTolerance: number;
  };
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
  limits: {
    maxRecommendationsPerPage: number;
    minConfidenceThreshold: number;
    cacheExpiryMinutes: number;
    enablePersonalization: boolean;
  };
  fallbacks: {
    fallbackToTrending: boolean;
    fallbackToPopular: boolean;
    fallbackToCategory: boolean;
    fallbackToStore: boolean;
  };
}

// Interface pour un produit recommandé
export interface RecommendedProduct {
  id: string;
  name: string;
  category: string;
  type: string; // digital, physical, service, course, artist
  score: number; // Score de pertinence calculé
  reason: string; // Pourquoi ce produit est recommandé
}

// Valeurs par défaut (à synchroniser avec AISettingsPage.tsx si nécessaire)
const defaultRecommendationSettings: RecommendationSettings = {
  algorithms: {
    collaborative: true,
    contentBased: true,
    trending: true,
    behavioral: true,
    crossType: false,
  },
  weights: {
    collaborative: 25,
    contentBased: 30,
    trending: 20,
    behavioral: 20,
    crossType: 5,
  },
  similarity: {
    categoryWeight: 30,
    tagsWeight: 25,
    priceWeight: 20,
    typeWeight: 25,
    priceTolerance: 20,
  },
  productTypes: {
    digital: { enabled: true, maxRecommendations: 6, similarityThreshold: 0.3 },
    physical: { enabled: true, maxRecommendations: 6, similarityThreshold: 0.3 },
    service: { enabled: true, maxRecommendations: 4, similarityThreshold: 0.4 },
    course: { enabled: true, maxRecommendations: 4, similarityThreshold: 0.4 },
    artist: { enabled: true, maxRecommendations: 3, similarityThreshold: 0.5 },
  },
  limits: {
    maxRecommendationsPerPage: 8,
    minConfidenceThreshold: 0.3,
    cacheExpiryMinutes: 30,
    enablePersonalization: true,
  },
  fallbacks: {
    fallbackToTrending: true,
    fallbackToPopular: true,
    fallbackToCategory: true,
    fallbackToStore: false,
  },
};

class RecommendationService {
  private settings: RecommendationSettings = defaultRecommendationSettings;

  constructor() {
    this.loadSettings();
  }

  // Charge les paramètres depuis la base de données
  private async loadSettings() {
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('ai_recommendation_settings')
        .eq('id', '00000000-0000-0000-0000-000000000001') // ID des paramètres globaux
        .maybeSingle();

      if (error) throw error;

      if (data?.ai_recommendation_settings) {
        const loadedSettings = data.ai_recommendation_settings as RecommendationSettings;
        // Validation basique des données chargées
        if (loadedSettings && typeof loadedSettings === 'object') {
          this.settings = { ...defaultRecommendationSettings, ...loadedSettings };
          logger.info('Recommendation settings loaded successfully.');
        } else {
          logger.warn('Invalid recommendation settings format, using defaults.');
        }
      }
    } catch (error) {
      logger.error('Error loading recommendation settings', { error });
      logger.warn('Using default recommendation settings due to load error.');
    }
  }

  // Méthode principale pour obtenir les recommandations
  public async getRecommendations(
    userId: string | undefined,
    sessionContext: ChatSessionContext,
    currentProductId?: string // Si la recommandation est pour un produit spécifique
  ): Promise<RecommendedProduct[]> {
    await this.loadSettings(); // S'assurer que les derniers paramètres sont chargés

    let recommendations: RecommendedProduct[] = [];
    const enabledAlgorithms = Object.entries(this.settings.algorithms).filter(([, enabled]) => enabled);

    // 1. Exécuter les algorithmes actifs et pondérer leurs résultats
    for (const [algoName] of enabledAlgorithms) {
      const weight = this.settings.weights[algoName as keyof typeof this.settings.weights] || 0;
      let algoResults: RecommendedProduct[] = [];

      switch (algoName) {
        case 'collaborative':
          algoResults = await this.getCollaborativeRecommendations(userId, sessionContext);
          break;
        case 'contentBased':
          algoResults = await this.getContentBasedRecommendations(currentProductId, sessionContext);
          break;
        case 'trending':
          algoResults = await this.getTrendingRecommendations();
          break;
        case 'behavioral':
          algoResults = await this.getBehavioralRecommendations(userId, sessionContext);
          break;
        case 'crossType':
          algoResults = await this.getCrossTypeRecommendations(currentProductId, sessionContext);
          break;
      }

      // Appliquer le poids (simplifié pour l'exemple)
      recommendations.push(...algoResults.map(p => ({ ...p, score: p.score * (weight / 100) })));
    }

    // 2. Agréger et dédupliquer les résultats
    const aggregatedRecommendations = this.aggregateAndDedup(recommendations);

    // 3. Appliquer les seuils de confiance et les limites par type de produit
    let finalRecommendations: RecommendedProduct[] = [];
    for (const rec of aggregatedRecommendations) {
      const productTypeConfig = this.settings.productTypes[rec.type as keyof typeof this.settings.productTypes];
      if (productTypeConfig?.enabled && rec.score >= (productTypeConfig?.similarityThreshold || this.settings.limits.minConfidenceThreshold)) {
        finalRecommendations.push(rec);
      }
    }

    // Trier par score et appliquer la limite générale
    finalRecommendations = finalRecommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, this.settings.limits.maxRecommendationsPerPage);

    // 4. Appliquer les règles de fallback si pas assez de recommandations
    if (finalRecommendations.length < this.settings.limits.maxRecommendationsPerPage && Object.values(this.settings.fallbacks).some(Boolean)) {
      const fallbackRecs = await this.applyFallbacks(userId, sessionContext, currentProductId, finalRecommendations);
      finalRecommendations.push(...fallbackRecs);
      // Dédupliquer à nouveau après fallback et re-limiter
      finalRecommendations = this.aggregateAndDedup(finalRecommendations)
        .sort((a, b) => b.score - a.score)
        .slice(0, this.settings.limits.maxRecommendationsPerPage);
    }

    return finalRecommendations;
  }

  // --- Implémentations des algorithmes (simulées pour l'instant) ---

  private async getCollaborativeRecommendations(userId: string | undefined, sessionContext: ChatSessionContext): Promise<RecommendedProduct[]> {
    if (!userId || !this.settings.limits.enablePersonalization) return [];
    // Logique complexe pour trouver des utilisateurs similaires et leurs préférences
    logger.debug('Fetching collaborative recommendations for user', { userId });
    // Simulation: retourne des produits aléatoires pour l'instant
    return this.getPopularProducts(3, 0.7, 'collaborative', 'Basé sur les utilisateurs similaires');
  }

  private async getContentBasedRecommendations(currentProductId: string | undefined, sessionContext: ChatSessionContext): Promise<RecommendedProduct[]> {
    if (!currentProductId) return [];
    // Logique pour trouver des produits similaires en fonction des attributs (catégorie, tags, prix, type)
    logger.debug('Fetching content-based recommendations for product', { currentProductId });
    // Simulation
    return this.getPopularProducts(3, 0.6, 'contentBased', 'Basé sur le contenu du produit');
  }

  private async getTrendingRecommendations(): Promise<RecommendedProduct[]> {
    // Logique pour identifier les produits actuellement en tendance
    logger.debug('Fetching trending recommendations');
    // Simulation
    return this.getPopularProducts(3, 0.8, 'trending', 'Produits tendance');
  }

  private async getBehavioralRecommendations(userId: string | undefined, sessionContext: ChatSessionContext): Promise<RecommendedProduct[]> {
    if (!userId || !this.settings.limits.enablePersonalization) return [];
    // Logique basée sur l'historique de navigation/achat de l'utilisateur (sessionContext.browsingHistory, cartItems, etc.)
    logger.debug('Fetching behavioral recommendations for user', { userId, history: sessionContext.browsingHistory });
    // Simulation
    return this.getPopularProducts(3, 0.75, 'behavioral', 'Basé sur le comportement de l\'utilisateur');
  }

  private async getCrossTypeRecommendations(currentProductId: string | undefined, sessionContext: ChatSessionContext): Promise<RecommendedProduct[]> {
    if (!currentProductId) return [];
    // Logique pour recommander des produits d'autres types basés sur le produit actuel ou le contexte
    logger.debug('Fetching cross-type recommendations for product', { currentProductId });
    // Simulation
    return this.getPopularProducts(2, 0.65, 'crossType', 'Recommandation cross-type');
  }

  // --- Fonctions de Fallback ---

  private async applyFallbacks(userId: string | undefined, sessionContext: ChatSessionContext, currentProductId: string | undefined, existingRecs: RecommendedProduct[]): Promise<RecommendedProduct[]> {
    let fallbackRecommendations: RecommendedProduct[] = [];
    const needed = this.settings.limits.maxRecommendationsPerPage - existingRecs.length;
    if (needed <= 0) return [];

    // Ordre des fallbacks: Tendances → Populaires → Catégorie → Boutique
    if (this.settings.fallbacks.fallbackToTrending) {
      const trending = await this.getTrendingRecommendations();
      fallbackRecommendations.push(...trending.slice(0, needed));
      if (fallbackRecommendations.length >= needed) return fallbackRecommendations;
    }

    if (this.settings.fallbacks.fallbackToPopular) {
      const popular = await this.getPopularProducts(needed, 0.5, 'fallback_popular', 'Fallback: produits populaires');
      fallbackRecommendations.push(...popular.slice(0, needed - fallbackRecommendations.length));
      if (fallbackRecommendations.length >= needed) return fallbackRecommendations;
    }

    if (this.settings.fallbacks.fallbackToCategory && currentProductId) {
      const categoryRecs = await this.getCategoryRecommendations(currentProductId, needed - fallbackRecommendations.length, 0.4);
      fallbackRecommendations.push(...categoryRecs);
      if (fallbackRecommendations.length >= needed) return fallbackRecommendations;
    }

    if (this.settings.fallbacks.fallbackToStore && currentProductId) {
      const storeRecs = await this.getStoreRecommendations(currentProductId, needed - fallbackRecommendations.length, 0.3);
      fallbackRecommendations.push(...storeRecs);
    }

    return fallbackRecommendations;
  }

  // Fonctions utilitaires pour les fallbacks (simulées)
  private async getPopularProducts(limit: number, score: number, reasonTag: string, reasonText: string): Promise<RecommendedProduct[]> {
    const { data: products } = await supabase
      .from('products')
      .select('id, name, category, type')
      .order('view_count', { ascending: false }) // Supposons un champ view_count pour la popularité
      .limit(limit);

    return (products || []).map(p => ({ ...p, score, reason: reasonText }));
  }

  private async getCategoryRecommendations(currentProductId: string, limit: number, score: number): Promise<RecommendedProduct[]> {
    // Récupérer la catégorie du produit actuel
    const { data: currentProduct } = await supabase
      .from('products')
      .select('category')
      .eq('id', currentProductId)
      .single();

    if (!currentProduct?.category) return [];

    const { data: products } = await supabase
      .from('products')
      .select('id, name, category, type')
      .eq('category', currentProduct.category)
      .neq('id', currentProductId) // Exclure le produit actuel
      .order('created_at', { ascending: false }) // Ou un autre critère de tri
      .limit(limit);

    return (products || []).map(p => ({ ...p, score, reason: `Produit similaire dans la catégorie ${currentProduct.category}` }));
  }

  private async getStoreRecommendations(currentProductId: string, limit: number, score: number): Promise<RecommendedProduct[]> {
    // Récupérer l'ID de la boutique du produit actuel
    const { data: currentProduct } = await supabase
      .from('products')
      .select('store_id')
      .eq('id', currentProductId)
      .single();

    if (!currentProduct?.store_id) return [];

    const { data: products } = await supabase
      .from('products')
      .select('id, name, category, type')
      .eq('store_id', currentProduct.store_id)
      .neq('id', currentProductId) // Exclure le produit actuel
      .order('created_at', { ascending: false }) // Ou un autre critère de tri
      .limit(limit);

    return (products || []).map(p => ({ ...p, score, reason: `Autres produits de la même boutique` }));
  }

  // --- Fonctions utilitaires ---

  private aggregateAndDedup(recommendations: RecommendedProduct[]): RecommendedProduct[] {
    const deduped: Record<string, RecommendedProduct> = {};
    for (const rec of recommendations) {
      if (!deduped[rec.id] || deduped[rec.id].score < rec.score) {
        deduped[rec.id] = rec; // Garder la recommandation avec le score le plus élevé
      }
    }
    return Object.values(deduped);
  }

  // Permet de mettre à jour les paramètres si nécessaire depuis l'extérieur (par exemple, après une sauvegarde via l'UI Admin)
  public updateSettings(newSettings: RecommendationSettings) {
    this.settings = { ...this.settings, ...newSettings };
    logger.info('Recommendation settings updated programmatically.');
  }
}

export const recommendationService = new RecommendationService();
