/**
 * useProductsOptimized Hook
 * Date: 28 Janvier 2025
 *
 * Hook optimisé pour les produits avec pagination serveur et gestion d'erreurs améliorée
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { shouldRetryError, getRetryDelay } from '@/lib/error-handling';
import type { Product } from './useProducts';

export interface ProductsPaginationOptions {
  page?: number;
  itemsPerPage?: number;
  sortBy?:
    | 'recent'
    | 'oldest'
    | 'name-asc'
    | 'name-desc'
    | 'price-asc'
    | 'price-desc'
    | 'popular'
    | 'rating';
  sortOrder?: 'asc' | 'desc';
  searchQuery?: string;
  category?: string;
  productType?: string;
  status?: 'all' | 'active' | 'inactive';
  stockStatus?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock' | 'needs_restock';
  priceRange?: [number, number];
}

export interface ProductsPaginationResponse {
  data: Product[];
  total: number;
  page: number;
  itemsPerPage: number;
  totalPages: number;
}

/**
 * Hook optimisé pour récupérer les produits avec pagination serveur
 * 
 * Utilise React Query pour le caching et la pagination côté serveur.
 * Optimisé pour les performances avec sélection de colonnes spécifiques.
 * 
 * @hook
 * @param {string | null} [storeId] - ID de la boutique
 * @param {ProductsPaginationOptions} [options] - Options de pagination et filtrage
 * @param {number} [options.page=1] - Numéro de page
 * @param {number} [options.itemsPerPage=12] - Nombre d'éléments par page
 * @param {string} [options.sortBy='recent'] - Critère de tri
 * @param {string} [options.sortOrder='desc'] - Ordre de tri
 * @param {string} [options.searchQuery=''] - Requête de recherche
 * @param {string} [options.category='all'] - Catégorie à filtrer
 * @param {string} [options.productType='all'] - Type de produit à filtrer
 * @param {string} [options.status='all'] - Statut (active/inactive)
 * @param {string} [options.stockStatus='all'] - Statut de stock
 * @param {[number, number]} [options.priceRange=[0, 1000000]] - Plage de prix
 * 
 * @returns {Object} Objet contenant les produits et l'état de pagination
 * @returns {Product[]} returns.products - Liste des produits
 * @returns {number} returns.total - Nombre total de produits
 * @returns {number} returns.page - Page actuelle
 * @returns {number} returns.itemsPerPage - Éléments par page
 * @returns {number} returns.totalPages - Nombre total de pages
 * @returns {boolean} returns.isLoading - État de chargement
 * @returns {Error | null} returns.error - Erreur éventuelle
 * @returns {Function} returns.refetch - Fonction pour rafraîchir les données
 * 
 * @example
 * ```tsx
 * const { products, total, isLoading, refetch } = useProductsOptimized(storeId, {
 *   page: 1,
 *   itemsPerPage: 24,
 *   sortBy: 'popular',
 *   category: 'digital',
 *   productType: 'digital'
 * });
 * ```
 * 
 * @remarks
 * - **Performance** : Pagination côté serveur pour réduire la charge
 * - **Caching** : Mise en cache automatique par React Query
 * - **Optimisation** : Sélection de colonnes spécifiques uniquement
 * - **Retry** : Retry automatique en cas d'erreur réseau
 * - **Gestion d'erreurs** : Gestion robuste avec fallback
 * 
 * @see {@link useQuery} pour la gestion du cache React Query
 */
export const useProductsOptimized = (
  storeId?: string | null,
  options?: ProductsPaginationOptions
): {
  products: Product[];
  total: number;
  page: number;
  itemsPerPage: number;
  totalPages: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
} => {
  const {
    page = 1,
    itemsPerPage = 12,
    sortBy = 'recent',
    sortOrder = 'desc',
    searchQuery = '',
    category = 'all',
    productType = 'all',
    status = 'all',
    stockStatus = 'all',
    priceRange = [0, 1000000],
  } = options || {};

  const query = useQuery<ProductsPaginationResponse>({
    queryKey: [
      'products-optimized',
      storeId,
      page,
      itemsPerPage,
      sortBy,
      sortOrder,
      searchQuery,
      category,
      productType,
      status,
      stockStatus,
      priceRange,
    ],
    queryFn: async () => {
      if (!storeId) {
        return {
          data: [],
          total: 0,
          page,
          itemsPerPage,
          totalPages: 0,
        };
      }

      try {
        // 🚀 NOUVELLE OPTIMISATION: Utiliser la fonction RPC unifiée get_products_management
        // Au lieu de construire des requêtes complexes côté client
        logger.info(`🔄 [useProductsOptimized] Utilisation de la fonction RPC optimisée pour store ${storeId}`);

        const { data: rpcData, error: rpcError } = await supabase.rpc('get_products_management', {
          p_store_id: storeId,
          p_page: page,
          p_items_per_page: itemsPerPage,
          p_sort_by: sortBy,
          p_sort_order: sortOrder,
          p_search_query: searchQuery,
          p_category: category,
          p_product_type: productType,
          p_status: status,
          p_stock_status: stockStatus,
          p_price_range_min: priceRange[0] > 0 ? priceRange[0] : null,
          p_price_range_max: priceRange[1] < 1000000 ? priceRange[1] : null,
        });

        if (rpcError) {
          logger.error('❌ Erreur RPC products:', rpcError);
          throw rpcError;
        }

        if (rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
          const firstItem = rpcData[0] as Record<string, unknown>;
          const totalCount = firstItem.total_count ? Number(firstItem.total_count) : rpcData.length;

          // Transformer les données RPC en format Product
          const products = rpcData.map((item: unknown) => {
            const product = item as Record<string, unknown>;
            return {
              id: product.id as string,
              name: product.name as string,
              slug: product.slug as string,
              description: product.description as string,
              short_description: product.short_description as string,
              image_url: product.image_url as string,
              price: Number(product.price),
              promotional_price: product.promotional_price ? Number(product.promotional_price) : null,
              currency: product.currency as string,
              category: product.category as string,
              product_type: product.product_type as string,
              licensing_type: product.licensing_type as string,
              license_terms: product.license_terms as string,
              is_active: product.is_active as boolean,
              is_featured: product.is_featured as boolean,
              rating: product.rating ? Number(product.rating) : null,
              reviews_count: product.reviews_count ? Number(product.reviews_count) : 0,
              purchases_count: product.purchases_count ? Number(product.purchases_count) : 0,
              stock_quantity: product.stock_quantity ? Number(product.stock_quantity) : null,
              created_at: product.created_at as string,
              updated_at: product.updated_at as string,
              tags: product.tags as string[],
              // Métriques calculées
              effective_price: Number(product.effective_price),
              sales_last_30_days: product.sales_last_30_days ? Number(product.sales_last_30_days) : 0,
              revenue_last_30_days: product.revenue_last_30_days ? Number(product.revenue_last_30_days) : 0,
              stock_status: product.stock_status as string,
              // Relations
              product_affiliate_settings: product.commission_rate ? {
                commission_rate: Number(product.commission_rate),
                affiliate_enabled: product.affiliate_enabled as boolean,
              } : null,
            } as Product & {
              effective_price: number;
              sales_last_30_days: number;
              revenue_last_30_days: number;
              stock_status: string;
            };
          });

          const totalPages = Math.ceil(totalCount / itemsPerPage);

          logger.info(`✅ [useProductsOptimized] ${products.length} produits chargés (${totalCount} total, ${totalPages} pages)`);

          return {
            data: products,
            total: totalCount,
            page,
            itemsPerPage,
            totalPages,
          };
        }

        // Retourner des données vides si rien trouvé
        return {
          data: [],
          total: 0,
          page,
          itemsPerPage,
          totalPages: 0,
        };

        // Appliquer les filtres
        if (searchQuery.trim()) {
          queryBuilder = queryBuilder.or(
            `name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,slug.ilike.%${searchQuery}%`
          );
        }

        if (category !== 'all') {
          queryBuilder = queryBuilder.eq('category', category);
        }

        if (productType !== 'all') {
          queryBuilder = queryBuilder.eq('product_type', productType);
        }

        if (status === 'active') {
          queryBuilder = queryBuilder.eq('is_active', true);
        } else if (status === 'inactive') {
          queryBuilder = queryBuilder.eq('is_active', false);
        }

        // Filtre prix (doit être fait côté serveur si possible)
        if (priceRange[0] > 0 || priceRange[1] < 1000000) {
          queryBuilder = queryBuilder.gte('price', priceRange[0]).lte('price', priceRange[1]);
        }

        // Appliquer le tri
        switch (sortBy) {
          case 'recent':
            queryBuilder = queryBuilder.order('created_at', { ascending: sortOrder === 'asc' });
            break;
          case 'oldest':
            queryBuilder = queryBuilder.order('created_at', { ascending: sortOrder === 'asc' });
            break;
          case 'name-asc':
          case 'name-desc':
            queryBuilder = queryBuilder.order('name', { ascending: sortBy === 'name-asc' });
            break;
          case 'price-asc':
          case 'price-desc':
            queryBuilder = queryBuilder.order('price', { ascending: sortBy === 'price-asc' });
            break;
          case 'popular':
            queryBuilder = queryBuilder.order('reviews_count', { ascending: false });
            break;
          case 'rating':
            queryBuilder = queryBuilder.order('rating', { ascending: false });
            break;
          default:
            queryBuilder = queryBuilder.order('created_at', { ascending: false });
        }

        // Appliquer pagination côté serveur
        queryBuilder = queryBuilder.range(startIndex, endIndex);

        const { data, error, count } = await queryBuilder;

        if (error) {
          logger.error('Erreur lors de la récupération des produits', {
            error: error.message,
            code: error.code,
            storeId,
          });
          throw error;
        }

        // Filtrer par stockStatus côté client (trop complexe pour SQL)
        let filteredData = (data || []) as Product[];
        if (stockStatus !== 'all') {
          filteredData = filteredData.filter(product => {
            if (product.track_inventory === false || product.product_type === 'digital') {
              return stockStatus === 'in_stock';
            }

            const quantity = product.stock_quantity || 0;
            const threshold = product.low_stock_threshold || 0;

            switch (stockStatus) {
              case 'in_stock':
                return quantity > threshold;
              case 'low_stock':
                return quantity > 0 && quantity <= threshold;
              case 'out_of_stock':
                return quantity === 0;
              case 'needs_restock':
                return quantity <= threshold;
              default:
                return true;
            }
          });
        }

        const total = count || 0;
        const totalPages = Math.ceil(total / itemsPerPage);

        return {
          data: filteredData,
          total,
          page,
          itemsPerPage,
          totalPages,
        };
      } catch (_error: unknown) {
        logger.error('Erreur dans useProductsOptimized', {
          error: _error instanceof Error ? _error.message : String(_error),
          storeId,
          page,
          itemsPerPage,
        });
        throw _error;
      }
    },
    enabled: !!storeId,
    retry: (failureCount, error) => shouldRetryError(error, failureCount),
    retryDelay: attemptIndex => getRetryDelay(attemptIndex),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    products: query.data?.data || [],
    total: query.data?.total || 0,
    page: query.data?.page || page,
    itemsPerPage: query.data?.itemsPerPage || itemsPerPage,
    totalPages: query.data?.totalPages || 0,
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
};
