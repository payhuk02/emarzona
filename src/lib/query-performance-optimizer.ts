/**
 * Optimiseur de Performance pour Requêtes Lourdes
 * Date: 1 Février 2025
 * 
 * Identifie et optimise les requêtes lourdes avec :
 * - Analyse de performance
 * - Suggestions d'optimisation
 * - Cache intelligent
 * - Requêtes batch
 * - Pagination optimisée
 */

import { logger } from './logger';
import { cacheStrategies } from './cache-optimization';

/**
 * Métriques de performance d'une requête
 */
export interface QueryMetrics {
  queryKey: string[];
  duration: number;
  dataSize: number;
  cacheHit: boolean;
  timestamp: number;
}

/**
 * Analyseur de performance des requêtes
 */
export class QueryPerformanceAnalyzer {
  private metrics: Map<string, QueryMetrics[]> = new Map();
  private slowQueries: Set<string> = new Set();

  /**
   * Enregistre les métriques d'une requête
   */
  recordQuery(
    queryKey: string[],
    duration: number,
    dataSize: number,
    cacheHit: boolean = false
  ): void {
    const key = JSON.stringify(queryKey);
    const metrics: QueryMetrics = {
      queryKey,
      duration,
      dataSize,
      cacheHit,
      timestamp: Date.now(),
    };

    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }

    const queryMetrics = this.metrics.get(key)!;
    queryMetrics.push(metrics);

    // Garder seulement les 100 dernières métriques
    if (queryMetrics.length > 100) {
      queryMetrics.shift();
    }

    // Identifier les requêtes lentes (> 1 seconde)
    if (duration > 1000 && !cacheHit) {
      this.slowQueries.add(key);
      logger.warn('Slow query detected', {
        queryKey,
        duration,
        dataSize,
      });
    }
  }

  /**
   * Obtient les statistiques d'une requête
   */
  getQueryStats(queryKey: string[]): {
    avgDuration: number;
    maxDuration: number;
    minDuration: number;
    totalCalls: number;
    cacheHitRate: number;
    avgDataSize: number;
  } | null {
    const key = JSON.stringify(queryKey);
    const metrics = this.metrics.get(key);

    if (!metrics || metrics.length === 0) {
      return null;
    }

    const durations = metrics.map(m => m.duration);
    const cacheHits = metrics.filter(m => m.cacheHit).length;
    const dataSizes = metrics.map(m => m.dataSize);

    return {
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      maxDuration: Math.max(...durations),
      minDuration: Math.min(...durations),
      totalCalls: metrics.length,
      cacheHitRate: cacheHits / metrics.length,
      avgDataSize: dataSizes.reduce((a, b) => a + b, 0) / dataSizes.length,
    };
  }

  /**
   * Obtient les requêtes les plus lentes
   */
  getSlowQueries(limit: number = 10): Array<{
    queryKey: string[];
    stats: ReturnType<typeof this.getQueryStats>;
  }> {
    const slowQueriesArray = Array.from(this.slowQueries)
      .map(key => {
        const queryKey = JSON.parse(key);
        return {
          queryKey,
          stats: this.getQueryStats(queryKey),
        };
      })
      .filter(item => item.stats !== null)
      .sort((a, b) => (b.stats?.avgDuration || 0) - (a.stats?.avgDuration || 0))
      .slice(0, limit);

    return slowQueriesArray as Array<{
      queryKey: string[];
      stats: NonNullable<ReturnType<typeof this.getQueryStats>>;
    }>;
  }

  /**
   * Génère des suggestions d'optimisation
   */
  generateOptimizationSuggestions(queryKey: string[]): string[] {
    const stats = this.getQueryStats(queryKey);
    if (!stats) return [];

    const suggestions: string[] = [];

    // Suggestion de cache si la requête est lente et appelée fréquemment
    if (stats.avgDuration > 500 && stats.totalCalls > 10) {
      suggestions.push('Considérer un cache plus agressif pour cette requête');
    }

    // Suggestion de pagination si les données sont volumineuses
    if (stats.avgDataSize > 100000) { // 100KB
      suggestions.push('Implémenter la pagination pour réduire la taille des données');
    }

    // Suggestion d'index si la requête est très lente
    if (stats.avgDuration > 2000) {
      suggestions.push('Vérifier les index de base de données pour cette requête');
    }

    // Suggestion de cache si le taux de cache hit est faible
    if (stats.cacheHitRate < 0.3 && stats.totalCalls > 5) {
      suggestions.push('Augmenter le staleTime pour améliorer le cache hit rate');
    }

    return suggestions;
  }
}

/**
 * Instance globale de l'analyseur
 */
export const queryPerformanceAnalyzer = new QueryPerformanceAnalyzer();

/**
 * Wrapper pour mesurer les performances d'une requête
 */
export async function measureQueryPerformance<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options: { cacheHit?: boolean } = {}
): Promise<T> {
  const startTime = performance.now();
  let dataSize = 0;

  try {
    const result = await queryFn();
    
    // Estimer la taille des données
    try {
      dataSize = new Blob([JSON.stringify(result)]).size;
    } catch {
      dataSize = 0;
    }

    const duration = performance.now() - startTime;

    queryPerformanceAnalyzer.recordQuery(
      queryKey,
      duration,
      dataSize,
      options.cacheHit || false
    );

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    
    queryPerformanceAnalyzer.recordQuery(
      queryKey,
      duration,
      0,
      false
    );

    throw error;
  }
}

/**
 * Optimise une requête avec pagination
 */
export function createPaginatedQuery<T>(
  baseQueryFn: (page: number, pageSize: number) => Promise<{ data: T[]; total: number }>,
  pageSize: number = 20
) {
  return async (page: number = 1) => {
    return measureQueryPerformance(
      ['paginated-query', page.toString(), pageSize.toString()],
      () => baseQueryFn(page, pageSize)
    );
  };
}

/**
 * Optimise une requête avec sélection de colonnes spécifiques
 */
export function optimizeSelectColumns(
  table: string,
  columns: string[],
  includeRelations: Record<string, string[]> = {}
): string {
  let select = columns.join(', ');

  // Ajouter les relations si nécessaire
  Object.entries(includeRelations).forEach(([relation, relationColumns]) => {
    select += `, ${relation} (${relationColumns.join(', ')})`;
  });

  return select;
}

/**
 * Suggestions d'optimisation pour requêtes fréquentes
 */
export const queryOptimizationSuggestions: Record<string, string[]> = {
  'digitalProducts': [
    'Utiliser pagination côté serveur',
    'Sélectionner uniquement les colonnes nécessaires',
    'Ajouter cache avec staleTime: 10 minutes',
    'Utiliser index sur store_id et is_active',
  ],
  'orders': [
    'Utiliser pagination',
    'Filtrer par date pour réduire les résultats',
    'Cache court (2 minutes) car données changeantes',
    'Index sur store_id, status, created_at',
  ],
  'products': [
    'Cache agressif (10 minutes)',
    'Sélectionner uniquement les colonnes nécessaires',
    'Index sur store_id, product_type, is_active',
    'Utiliser views matérialisées pour requêtes complexes',
  ],
  'auctions': [
    'Cache moyen (5 minutes)',
    'Filtrer par status et date',
    'Index sur status, end_date, store_id',
    'Pagination pour listes longues',
  ],
};

/**
 * Applique les optimisations suggérées à une requête
 */
export function applyQueryOptimizations(
  queryKey: string[],
  queryFn: () => Promise<any>,
  options: {
    useCache?: boolean;
    cacheStrategy?: keyof typeof cacheStrategies;
    pagination?: { page: number; pageSize: number };
  } = {}
): () => Promise<any> {
  const suggestions = queryOptimizationSuggestions[queryKey[0] as string] || [];

  // Logger les suggestions
  if (suggestions.length > 0 && import.meta.env.DEV) {
    logger.info('Query optimization suggestions', {
      queryKey,
      suggestions,
    });
  }

  // Wrapper avec mesure de performance
  return async () => {
    return measureQueryPerformance(queryKey, queryFn, {
      cacheHit: options.useCache || false,
    });
  };
}

