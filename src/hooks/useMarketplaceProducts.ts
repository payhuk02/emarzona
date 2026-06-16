/**
 * Hook optimisé pour charger les produits du marketplace avec React Query
 *
 * Remplace fetchProducts avec cache intelligent et prefetching.
 * Utilise des fonctions RPC Supabase pour un filtrage côté serveur optimisé.
 *
 * @hook
 * @param {MarketplaceProductsParams} params - Paramètres de chargement
 * @param {FilterState} params.filters - Filtres à appliquer
 * @param {PaginationState} params.pagination - État de pagination
 * @param {boolean} params.hasSearchQuery - Indique si une recherche est active
 * @param {boolean} params.shouldUseRPCFiltering - Utiliser le filtrage RPC côté serveur
 *
 * @returns {Object} Objet contenant les produits et l'état de chargement
 * @returns {Product[]} returns.products - Liste des produits
 * @returns {number} returns.totalCount - Nombre total de produits
 * @returns {number} returns.filteredCount - Nombre de produits après filtrage
 * @returns {boolean} returns.isLoading - État de chargement
 * @returns {Error | null} returns.error - Erreur éventuelle
 *
 * @example
 * ```tsx
 * const { products, totalCount, isLoading, error } = useMarketplaceProducts({
 *   filters: { productType: 'digital', category: 'all' },
 *   pagination: { currentPage: 1, itemsPerPage: 12 },
 *   hasSearchQuery: false,
 *   shouldUseRPCFiltering: true
 * });
 * ```
 *
 * @remarks
 * - **Performance** : Utilise React Query pour le caching intelligent
 * - **Optimisation** : Filtrage côté serveur via RPC pour grandes listes
 * - **Cache** : Mise en cache automatique avec stratégies optimisées
 * - **Prefetching** : Prefetch automatique des pages adjacentes
 * - **Fallback** : Retour vers requête standard si RPC échoue
 *
 * @see {@link fetchMarketplaceProducts} pour la fonction de chargement
 * @see {@link cacheMarketplaceProducts} pour la gestion du cache
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { Product, FilterState, PaginationState } from '@/types/marketplace';
import { cacheStrategies } from '@/lib/cache-optimization';
import {
  cacheMarketplaceProducts,
  getCachedMarketplaceProductsSync,
  MARKETPLACE_CACHE_SOFT_STALE_MS,
} from '@/lib/marketplace-cache';

interface MarketplaceProductsParams {
  filters: FilterState;
  pagination: PaginationState;
  hasSearchQuery: boolean;
  shouldUseRPCFiltering: boolean;
}

interface MarketplaceProductsResponse {
  products: Product[];
  totalCount: number;
  filteredCount: number;
}

function mapSortByForMarketplaceRpc(sortBy: string): string {
  if (sortBy === 'sales_count' || sortBy === 'popularity') return 'popular';
  if (sortBy === 'newest') return 'newest';
  if (sortBy === 'oldest') return 'oldest';
  return sortBy;
}

/** Colonne stock sur `products` (le schéma prod utilise `stock`, pas `stock_quantity`). */
const PRODUCT_STOCK_COLUMN = 'stock';

function applyInStockFilter<
  T extends {
    or: (filters: string) => T;
    gte: (col: string, val: number) => T;
    lte: (col: string, val: number) => T;
    eq: (col: string, val: number) => T;
  },
>(query: T, mode: 'in_stock' | 'low_stock' | 'out_stock'): T {
  const col = PRODUCT_STOCK_COLUMN;
  if (mode === 'in_stock') {
    return query.or(`${col}.gt.0,${col}.is.null`);
  }
  if (mode === 'low_stock') {
    return query.gte(col, 1).lte(col, 10);
  }
  return query.eq(col, 0);
}

function mapStockToProductFields<T extends Record<string, unknown>>(product: T): Product {
  const stock =
    product.stock != null
      ? Number(product.stock)
      : product.stock_quantity != null
        ? Number(product.stock_quantity)
        : null;
  return { ...product, stock_quantity: stock } as Product;
}

export function buildMarketplaceProductsQueryKey(
  stableFiltersKey: string,
  page: number,
  itemsPerPage: number,
  hasSearchQuery: boolean,
  shouldUseRPCFiltering: boolean
) {
  return [
    'marketplace-products',
    stableFiltersKey,
    page,
    itemsPerPage,
    hasSearchQuery,
    shouldUseRPCFiltering,
  ] as const;
}

/**
 * Fonction optimisée pour charger les produits avec sélection de colonnes spécifiques
 */
export async function fetchMarketplaceProducts({
  filters,
  pagination,
  hasSearchQuery,
  shouldUseRPCFiltering,
}: MarketplaceProductsParams): Promise<MarketplaceProductsResponse> {
  // Calculer les indices de pagination
  const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
  const endIndex = startIndex + pagination.itemsPerPage - 1;

  // 🚀 NOUVELLE OPTIMISATION: Utiliser la fonction RPC unifiée get_marketplace_products_filtered
  // Au lieu de fonctions spécifiques par type, une seule fonction optimisée
  if (shouldUseRPCFiltering) {
    try {
      logger.info('🔄 [useMarketplaceProducts] Utilisation de la fonction RPC optimisée');

      const { data, error } = await supabase.rpc('get_marketplace_products_filtered', {
        p_limit: pagination.itemsPerPage,
        p_offset: startIndex,
        p_category:
          filters.category !== 'all' && filters.category !== 'featured' ? filters.category : null,
        p_product_type: filters.productType !== 'all' ? filters.productType : null,
        p_min_price:
          filters.priceRange !== 'all'
            ? (() => {
                const [min] = filters.priceRange.split('-').map(Number);
                return min || null;
              })()
            : null,
        p_max_price:
          filters.priceRange !== 'all'
            ? (() => {
                const parts = filters.priceRange.split('-');
                return parts.length > 1 && parts[1] ? Number(parts[1]) : null;
              })()
            : null,
        p_min_rating: filters.rating !== 'all' ? Number(filters.rating) : null,
        p_sort_by: mapSortByForMarketplaceRpc(filters.sortBy || 'created_at'),
        p_sort_order: filters.sortOrder || 'desc',
        p_search_query: hasSearchQuery && filters.search ? filters.search : null,
        p_featured_only: filters.category === 'featured' || filters.featuredOnly === true,
      });

      if (error) {
        // PGRST202 = fonction RPC absente (migrations non appliquées) — fallback silencieux
        if (error.code !== 'PGRST202') {
          logger.error('❌ Erreur RPC marketplace:', error);
        }
        // Fallback vers la méthode standard
      } else if (data && Array.isArray(data)) {
        const firstItem = data[0] as Record<string, unknown> | undefined;
        const totalCount = firstItem?.total_count != null ? Number(firstItem.total_count) : 0;

        // Transformer les données RPC en format Product
        const products = data.map((item: unknown) => {
          const product = item as Record<string, unknown>;
          return {
            id: product.id as string,
            store_id: product.store_id as string,
            name: product.name as string,
            slug: product.slug as string,
            description: product.description as string,
            short_description: product.short_description as string,
            image_url: product.image_url as string,
            price: Number(product.price),
            promotional_price: product.promotional_price ? Number(product.promotional_price) : null,
            currency: product.currency as string,
            rating: product.rating ? Number(product.rating) : null,
            reviews_count: product.reviews_count ? Number(product.reviews_count) : 0,
            category: product.category as string,
            product_type: product.product_type as string,
            licensing_type: product.licensing_type as string,
            license_terms: product.license_terms as string,
            is_featured: product.is_featured as boolean,
            payment_options: (product.payment_options as Product['payment_options']) ?? null,
            created_at: product.created_at as string,
            updated_at: product.updated_at as string,
            tags: product.tags as string[],
            stores: product.store_name
              ? {
                  id: product.store_id as string,
                  name: product.store_name as string,
                  slug: product.store_slug as string,
                  logo_url: product.store_logo_url as string | null,
                  created_at: product.created_at as string,
                }
              : null,
            product_affiliate_settings: product.commission_rate
              ? {
                  commission_rate: Number(product.commission_rate),
                  affiliate_enabled: product.affiliate_enabled as boolean,
                }
              : null,
          } as Product;
        });

        logger.info(
          `✅ [useMarketplaceProducts] ${products.length} produits chargés via RPC (${totalCount} total)`
        );

        const rpcResult = {
          products,
          totalCount,
          filteredCount: totalCount,
        };

        if (rpcResult.products.length > 0) {
          cacheMarketplaceProducts(
            {
              ...filters,
              page: pagination.currentPage,
              itemsPerPage: pagination.itemsPerPage,
            },
            { products: rpcResult.products, totalCount: rpcResult.totalCount }
          ).catch(err => logger.warn('Failed to cache marketplace RPC products:', err));
        }

        return rpcResult;
      }
    } catch (error) {
      logger.error("❌ Erreur lors de l'appel RPC marketplace:", error);
      // Continue avec la méthode standard
    }
  }

  // Fallback vers la méthode standard si RPC échoue ou non activée

  // ✅ OPTIMISATION 1: Sélection de colonnes spécifiques au lieu de *
  // Sélectionner uniquement les colonnes nécessaires pour réduire la taille des données
  const baseColumns = [
    'id',
    'store_id',
    'name',
    'slug',
    'description',
    'short_description',
    'image_url',
    'price',
    'promotional_price',
    'currency',
    'rating',
    'reviews_count',
    'category',
    'product_type',
    'licensing_type',
    'license_terms',
    'is_featured',
    'payment_options',
    'created_at',
    'updated_at',
    'tags',
  ].join(',');

  // Construire la requête avec les jointures nécessaires selon le type
  let selectQuery = `${baseColumns},stores!inner(id,name,slug,logo_url,created_at),product_affiliate_settings!left(commission_rate,affiliate_enabled)`;

  // Ajouter les jointures selon le type de produit et les filtres
  if (filters.productType === 'digital' && filters.digitalSubType) {
    selectQuery += `,digital_products!left(digital_type,license_type)`;
  }

  if (filters.productType === 'service' && (filters.serviceType || filters.locationType)) {
    selectQuery += `,service_products!left(service_type,location_type,calendar_available)`;
  }

  if (filters.productType === 'course' && (filters.difficulty || filters.accessType)) {
    selectQuery += `,courses!left(difficulty,access_type,total_duration)`;
  }

  if (
    filters.productType === 'artist' &&
    (filters.artistType || filters.editionType || filters.certificateOfAuthenticity)
  ) {
    selectQuery += `,artist_products!left(artist_type,artwork_edition_type,certificate_of_authenticity)`;
  }

  let query = supabase
    .from('products')
    .select(selectQuery, { count: 'exact' }) // Obtenir le count total
    .eq('is_active', true)
    .eq('is_draft', false); // Seulement les produits publiés

  // Appliquer les filtres côté serveur
  if (filters.category !== 'all' && filters.category !== 'featured') {
    query = query.eq('category', filters.category);
  }

  // Filtre pour les produits en vedette
  if (filters.category === 'featured') {
    query = query.eq('is_featured', true);
  }

  if (filters.productType !== 'all') {
    query = query.eq('product_type', filters.productType);
  }

  if (filters.priceRange !== 'all') {
    const [min, max] = filters.priceRange.split('-').map(Number);
    if (max) {
      query = query.gte('price', min).lte('price', max);
    } else {
      query = query.gte('price', min);
    }
  }

  if (filters.licensingType && filters.licensingType !== 'all') {
    query = query.eq('licensing_type', filters.licensingType);
  }

  if (filters.rating !== 'all') {
    query = query.gte('rating', Number(filters.rating));
  }

  // Filtres spécifiques par type de produit
  if (filters.productType === 'physical') {
    if (filters.stockAvailability === 'in_stock') {
      query = applyInStockFilter(query, 'in_stock');
    } else if (filters.stockAvailability === 'low_stock') {
      query = applyInStockFilter(query, 'low_stock');
    } else if (filters.stockAvailability === 'out_stock') {
      query = applyInStockFilter(query, 'out_stock');
    }

    // Note: free_shipping n'existe pas dans la table products
    // Ce filtre doit être appliqué via une jointure avec physical_product_variants si nécessaire
    // Pour l'instant, on ignore ce filtre côté serveur
    // TODO: Implémenter le filtre via jointure avec physical_product_variants si nécessaire
  }

  if (filters.productType === 'artist') {
    if (filters.artworkAvailability && filters.artworkAvailability !== 'all') {
      if (filters.artworkAvailability === 'available') {
        query = applyInStockFilter(query, 'in_stock');
      } else if (filters.artworkAvailability === 'sold_out') {
        query = applyInStockFilter(query, 'out_stock');
      }
    }
  }

  if (filters.inStock) {
    // Produits digitaux/services : stock=0 est normal ; filtrer surtout le physique
    if (filters.productType === 'physical') {
      query = applyInStockFilter(query, 'in_stock');
    } else if (filters.productType === 'all') {
      query = query.or(
        `${PRODUCT_STOCK_COLUMN}.gt.0,${PRODUCT_STOCK_COLUMN}.is.null,product_type.in.(digital,service,course,artist),product_type.is.null`
      );
    } else {
      // digital, service, course, artist : pas de filtre stock strict
    }
  }

  // Appliquer le tri
  const sortByColumn =
    filters.sortBy === 'sales_count' || filters.sortBy === 'popularity'
      ? 'created_at'
      : filters.sortBy === 'created_at' ||
          filters.sortBy === 'newest' ||
          filters.sortBy === 'oldest'
        ? 'created_at'
        : filters.sortBy === 'price'
          ? 'price'
          : filters.sortBy === 'rating'
            ? 'rating'
            : filters.sortBy === 'name'
              ? 'name'
              : 'created_at';

  query = query.order(sortByColumn, { ascending: filters.sortOrder === 'asc' });

  // Appliquer la pagination côté serveur
  query = query.range(startIndex, endIndex);

  const { data, error, count } = await query;

  if (error) {
    logger.error('Erreur Supabase lors du chargement des produits:', {
      error,
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      selectQuery,
    });
    throw new Error(`Erreur Supabase: ${error.message || 'Erreur inconnue'}`);
  }

  // Ne charger les produits que si pas de recherche active
  if (hasSearchQuery) {
    return {
      products: [],
      totalCount: 0,
      filteredCount: 0,
    };
  }

  // Appliquer les filtres côté client pour les relations
  let filteredData = (data || []) as unknown as Product[];

  if (filters.productType === 'digital' && filters.digitalSubType) {
    filteredData = filteredData.filter(
      (product: Product & { digital_products?: Array<{ digital_type?: string }> }) => {
        const digitalProduct = product.digital_products?.[0];
        return digitalProduct?.digital_type === filters.digitalSubType;
      }
    );
  }

  if (filters.productType === 'service') {
    if (filters.serviceType) {
      filteredData = filteredData.filter(
        (product: Product & { service_products?: Array<{ service_type?: string }> }) => {
          const serviceProduct = product.service_products?.[0];
          return serviceProduct?.service_type === filters.serviceType;
        }
      );
    }
    if (filters.locationType && filters.locationType !== 'all') {
      filteredData = filteredData.filter(
        (product: Product & { service_products?: Array<{ location_type?: string }> }) => {
          const serviceProduct = product.service_products?.[0];
          return serviceProduct?.location_type === filters.locationType;
        }
      );
    }
    if (filters.calendarAvailable) {
      filteredData = filteredData.filter(
        (product: Product & { service_products?: Array<{ calendar_available?: boolean }> }) => {
          const serviceProduct = product.service_products?.[0];
          return serviceProduct?.calendar_available === true;
        }
      );
    }
  }

  if (filters.productType === 'course') {
    if (filters.difficulty && filters.difficulty !== 'all') {
      filteredData = filteredData.filter(
        (product: Product & { courses?: Array<{ difficulty?: string }> }) => {
          const course = product.courses?.[0];
          return course?.difficulty === filters.difficulty;
        }
      );
    }
    if (filters.accessType && filters.accessType !== 'all') {
      filteredData = filteredData.filter(
        (product: Product & { courses?: Array<{ access_type?: string }> }) => {
          const course = product.courses?.[0];
          return course?.access_type === filters.accessType;
        }
      );
    }
    if (filters.courseDuration && filters.courseDuration !== 'all') {
      filteredData = filteredData.filter(
        (product: Product & { courses?: Array<{ total_duration?: number }> }) => {
          const course = product.courses?.[0];
          const duration = course?.total_duration || 0;
          if (filters.courseDuration === '<1h') return duration < 60;
          if (filters.courseDuration === '1-5h') return duration >= 60 && duration <= 300;
          if (filters.courseDuration === '5-10h') return duration >= 300 && duration <= 600;
          if (filters.courseDuration === '10h+') return duration > 600;
          return true;
        }
      );
    }
  }

  if (filters.productType === 'artist') {
    if (filters.artistType) {
      filteredData = filteredData.filter(
        (product: Product & { artist_products?: Array<{ artist_type?: string }> }) => {
          const artistProduct = product.artist_products?.[0];
          return artistProduct?.artist_type === filters.artistType;
        }
      );
    }
    if (filters.editionType && filters.editionType !== 'all') {
      filteredData = filteredData.filter(
        (product: Product & { artist_products?: Array<{ artwork_edition_type?: string }> }) => {
          const artistProduct = product.artist_products?.[0];
          return artistProduct?.artwork_edition_type === filters.editionType;
        }
      );
    }
    if (filters.certificateOfAuthenticity) {
      filteredData = filteredData.filter(
        (
          product: Product & { artist_products?: Array<{ certificate_of_authenticity?: boolean }> }
        ) => {
          const artistProduct = product.artist_products?.[0];
          return artistProduct?.certificate_of_authenticity === true;
        }
      );
    }
  }

  logger.info(
    `${filteredData.length} produits chargés après filtrage (page ${pagination.currentPage}/${Math.ceil((count || 0) / pagination.itemsPerPage)})`
  );

  const result = {
    products: filteredData.map(p => mapStockToProductFields(p as Record<string, unknown>)),
    totalCount: count || 0,
    filteredCount: filteredData.length,
  };

  // ✅ OPTIMISATION: Mettre en cache les résultats
  if (result.products.length > 0) {
    cacheMarketplaceProducts(
      {
        ...filters,
        page: pagination.currentPage,
        itemsPerPage: pagination.itemsPerPage,
      },
      { products: result.products, totalCount: result.totalCount }
    ).catch(error => {
      logger.warn('Failed to cache marketplace products:', error);
    });
  }

  return result;
}

/**
 * Hook optimisé pour charger les produits du marketplace avec React Query
 */
export function useMarketplaceProducts({
  filters,
  pagination,
  hasSearchQuery,
  shouldUseRPCFiltering,
}: MarketplaceProductsParams) {
  const queryClient = useQueryClient();

  // ✅ OPTIMISATION: Créer une clé de cache stable basée sur les valeurs des filtres
  // Au lieu d'utiliser l'objet filters directement (qui change de référence)
  const stableFiltersKey = useMemo(
    () =>
      JSON.stringify({
        category: filters.category,
        productType: filters.productType,
        licensingType: filters.licensingType,
        priceRange: filters.priceRange,
        rating: filters.rating,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        tags: filters.tags?.sort().join(','),
        verifiedOnly: filters.verifiedOnly,
        featuredOnly: filters.featuredOnly,
        inStock: filters.inStock,
      }),
    [
      filters.category,
      filters.productType,
      filters.licensingType,
      filters.priceRange,
      filters.rating,
      filters.sortBy,
      filters.sortOrder,
      filters.tags,
      filters.verifiedOnly,
      filters.featuredOnly,
      filters.inStock,
    ]
  );

  const queryKey = buildMarketplaceProductsQueryKey(
    stableFiltersKey,
    pagination.currentPage,
    pagination.itemsPerPage,
    hasSearchQuery,
    shouldUseRPCFiltering
  );

  const cacheFilterParams = useMemo(
    () => ({
      ...filters,
      page: pagination.currentPage,
      itemsPerPage: pagination.itemsPerPage,
    }),
    [filters, pagination.currentPage, pagination.itemsPerPage]
  );

  const cachedBootstrap = useMemo(
    () => (hasSearchQuery ? null : getCachedMarketplaceProductsSync(cacheFilterParams)),
    [cacheFilterParams, hasSearchQuery]
  );

  const initialQueryData = cachedBootstrap
    ? {
        products: cachedBootstrap.data.products,
        totalCount: cachedBootstrap.data.totalCount,
        filteredCount: cachedBootstrap.data.products.length,
      }
    : undefined;

  // SWR : cache local pour le 1er paint, refetch RPC si données > 90s
  const query = useQuery({
    queryKey,
    queryFn: () =>
      fetchMarketplaceProducts({
        filters,
        pagination,
        hasSearchQuery,
        shouldUseRPCFiltering,
      }),
    enabled: !hasSearchQuery,
    initialData: initialQueryData,
    initialDataUpdatedAt: cachedBootstrap?.fetchedAt,
    staleTime: MARKETPLACE_CACHE_SOFT_STALE_MS,
    gcTime: cacheStrategies.products.gcTime,
    refetchOnWindowFocus: cacheStrategies.products.refetchOnWindowFocus,
    // ✅ OPTIMISATION: Garder les données précédentes pendant le chargement (pagination fluide)
    placeholderData: previousData => previousData,
    // ✅ OPTIMISATION: Partage structurel pour éviter re-renders
    structuralSharing: true,
    // ✅ OPTIMISATION: Retry intelligent
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // ✅ OPTIMISATION: Prefetching de la page suivante
  const prefetchPage = (page: number) => {
    queryClient.prefetchQuery({
      queryKey: buildMarketplaceProductsQueryKey(
        stableFiltersKey,
        page,
        pagination.itemsPerPage,
        hasSearchQuery,
        shouldUseRPCFiltering
      ),
      queryFn: () =>
        fetchMarketplaceProducts({
          filters,
          pagination: { ...pagination, currentPage: page },
          hasSearchQuery,
          shouldUseRPCFiltering,
        }),
      staleTime: MARKETPLACE_CACHE_SOFT_STALE_MS,
    });
  };

  const prefetchNextPage = () => {
    if (
      query.data &&
      pagination.currentPage < Math.ceil(query.data.totalCount / pagination.itemsPerPage)
    ) {
      prefetchPage(pagination.currentPage + 1);
    }
  };

  const prefetchPreviousPage = () => {
    if (query.data && pagination.currentPage > 1) {
      prefetchPage(pagination.currentPage - 1);
    }
  };

  return {
    products: query.data?.products || [],
    totalCount: query.data?.totalCount || 0,
    filteredCount: query.data?.filteredCount || 0,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
    prefetchNextPage,
    prefetchPreviousPage,
  };
}
