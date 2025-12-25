/**
 * Hook optimisé pour charger les produits du marketplace avec React Query
 * Remplace fetchProducts avec cache intelligent et prefetching
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { Product, FilterState, PaginationState } from '@/types/marketplace';
import { cacheStrategies } from '@/lib/cache-optimization';
import { centralizedQueryConfig } from '@/lib/errors/centralized-error-handling';
import {
  getCachedMarketplaceProducts,
  cacheMarketplaceProducts,
  generateCacheKey,
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

/**
 * Fonction optimisée pour charger les produits avec sélection de colonnes spécifiques
 */
async function fetchMarketplaceProducts({
  filters,
  pagination,
  hasSearchQuery,
  shouldUseRPCFiltering,
}: MarketplaceProductsParams): Promise<MarketplaceProductsResponse> {
  // Calculer les indices de pagination
  const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
  const endIndex = startIndex + pagination.itemsPerPage - 1;

  // ✅ OPTIMISATION: Utiliser les fonctions RPC pour filtrage côté serveur si activé
  if (shouldUseRPCFiltering && filters.productType !== 'all') {
    try {
      const rpcFunctionName = `filter_${filters.productType}_products`;
      const rpcParams: Record<string, unknown> = {
        p_limit: pagination.itemsPerPage,
        p_offset: startIndex,
        p_category: filters.category !== 'all' && filters.category !== 'featured' ? filters.category : null,
        p_min_price: filters.priceRange !== 'all' ? (() => {
          const [min] = filters.priceRange.split('-').map(Number);
          return min || null;
        })() : null,
        p_max_price: filters.priceRange !== 'all' ? (() => {
          const parts = filters.priceRange.split('-');
          return parts.length > 1 && parts[1] ? Number(parts[1]) : null;
        })() : null,
        p_min_rating: filters.rating !== 'all' ? Number(filters.rating) : null,
        p_sort_by: filters.sortBy || 'created_at',
        p_sort_order: filters.sortOrder || 'desc',
      };

      // Ajouter les paramètres spécifiques selon le type de produit
      if (filters.productType === 'digital') {
        rpcParams.p_digital_sub_type = filters.digitalSubType && filters.digitalSubType !== 'all' ? filters.digitalSubType : null;
        rpcParams.p_instant_delivery = filters.instantDelivery || null;
      } else if (filters.productType === 'physical') {
        rpcParams.p_stock_availability = filters.stockAvailability && filters.stockAvailability !== 'all' ? filters.stockAvailability : null;
        rpcParams.p_shipping_type = filters.shippingType && filters.shippingType !== 'all' ? filters.shippingType : null;
      } else if (filters.productType === 'service') {
        rpcParams.p_service_type = filters.serviceType && filters.serviceType !== 'all' ? filters.serviceType : null;
        rpcParams.p_location_type = filters.locationType && filters.locationType !== 'all' ? filters.locationType : null;
        rpcParams.p_calendar_available = filters.calendarAvailable || null;
      } else if (filters.productType === 'course') {
        rpcParams.p_difficulty = filters.difficulty && filters.difficulty !== 'all' ? filters.difficulty : null;
        rpcParams.p_access_type = filters.accessType && filters.accessType !== 'all' ? filters.accessType : null;
      } else if (filters.productType === 'artist') {
        rpcParams.p_artist_type = filters.artistType && filters.artistType !== 'all' ? filters.artistType : null;
        rpcParams.p_edition_type = filters.editionType && filters.editionType !== 'all' ? filters.editionType : null;
        rpcParams.p_certificate_of_authenticity = filters.certificateOfAuthenticity || null;
      }

      const { data, error } = await supabase.rpc(rpcFunctionName, rpcParams);

      if (error) {
        logger.error('Erreur RPC lors du filtrage des produits:', {
          error,
          functionName: rpcFunctionName,
          params: rpcParams,
        });
        // Fallback vers la méthode standard en cas d'erreur RPC
      } else if (data && Array.isArray(data) && data.length > 0) {
        // Transformer les données RPC en format Product
        const products = data.map((item: unknown) => {
          const product = item as Record<string, unknown>;
          return {
            ...product,
            stores: product.store_name ? {
              id: product.store_id as string,
              name: product.store_name as string,
              slug: product.store_slug as string,
              logo_url: product.store_logo_url as string | null,
              created_at: product.created_at as string,
            } : null,
          } as Product;
        });

        return {
          products,
          totalCount: products.length, // Les fonctions RPC ne retournent pas le count total, on utilise la longueur
          filteredCount: products.length,
        };
      }
    } catch (error) {
      logger.error('Erreur lors de l\'appel RPC:', error);
      // Continue avec la méthode standard en cas d'erreur
    }
  }

  // ✅ OPTIMISATION 1: Sélection de colonnes spécifiques au lieu de *
  // Sélectionner uniquement les colonnes nécessaires pour réduire la taille des données
  const baseColumns = [
    'id',
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
      query = query.or('stock.gt.0,stock.is.null');
    } else if (filters.stockAvailability === 'low_stock') {
      query = query.gte('stock', 1).lte('stock', 10);
    } else if (filters.stockAvailability === 'out_stock') {
      query = query.eq('stock', 0);
    }

    // Note: free_shipping n'existe pas dans la table products
    // Ce filtre doit être appliqué via une jointure avec physical_product_variants si nécessaire
    // Pour l'instant, on ignore ce filtre côté serveur
    // TODO: Implémenter le filtre via jointure avec physical_product_variants si nécessaire
  }

  if (filters.productType === 'artist') {
    if (filters.artworkAvailability && filters.artworkAvailability !== 'all') {
      if (filters.artworkAvailability === 'available') {
        query = query.or('stock.gt.0,stock.is.null');
      } else if (filters.artworkAvailability === 'sold_out') {
        query = query.eq('stock', 0);
      }
    }
  }

  // Appliquer le tri
  // Mapper les valeurs de tri vers les colonnes réelles
  const sortByColumn = filters.sortBy === 'sales_count' 
    ? 'reviews_count' 
    : filters.sortBy === 'created_at' 
    ? 'created_at'
    : filters.sortBy === 'price'
    ? 'price'
    : filters.sortBy === 'rating'
    ? 'rating'
    : 'created_at'; // Valeur par défaut

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
        (product: Product & { artist_products?: Array<{ certificate_of_authenticity?: boolean }> }) => {
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
    products: filteredData as Product[],
    totalCount: count || 0,
    filteredCount: filteredData.length,
  };

  // ✅ OPTIMISATION: Mettre en cache les résultats
  if (result.products.length > 0) {
    const cacheKey = generateCacheKey('products', {
      ...filters,
      page: pagination.currentPage,
      itemsPerPage: pagination.itemsPerPage,
    });
    cacheMarketplaceProducts(
      {
        ...filters,
        page: pagination.currentPage,
        itemsPerPage: pagination.itemsPerPage,
      },
      result.products
    ).catch((error) => {
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

  // Clé de cache basée sur les filtres et la pagination
  const queryKey = [
    'marketplace-products',
    stableFiltersKey,
    pagination.currentPage,
    pagination.itemsPerPage,
    hasSearchQuery,
    shouldUseRPCFiltering,
  ] as const;

  // Requête avec cache optimisé
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      // Vérifier le cache local d'abord
      const cached = await getCachedMarketplaceProducts({
        ...filters,
        page: pagination.currentPage,
        itemsPerPage: pagination.itemsPerPage,
      });

      if (cached && cached.length > 0) {
        // Retourner les données du cache avec le count estimé
        return {
          products: cached,
          totalCount: cached.length * 2, // Estimation
          filteredCount: cached.length,
        };
      }

      // Sinon, faire la requête normale
      return fetchMarketplaceProducts({
        filters,
        pagination,
        hasSearchQuery,
        shouldUseRPCFiltering,
      });
    },
    // ✅ OPTIMISATION: Cache agressif pour les produits (changent rarement)
    staleTime: cacheStrategies.products.staleTime, // 10 minutes
    gcTime: cacheStrategies.products.gcTime, // 30 minutes
    refetchOnWindowFocus: cacheStrategies.products.refetchOnWindowFocus, // false
    // ✅ OPTIMISATION: Garder les données précédentes pendant le chargement (pagination fluide)
    placeholderData: (previousData) => previousData,
    // ✅ OPTIMISATION: Partage structurel pour éviter re-renders
    structuralSharing: true,
    // ✅ OPTIMISATION: Retry intelligent
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // ✅ OPTIMISATION: Prefetching de la page suivante
  const prefetchNextPage = () => {
    if (query.data && pagination.currentPage < Math.ceil(query.data.totalCount / pagination.itemsPerPage)) {
      const nextPage = pagination.currentPage + 1;
      queryClient.prefetchQuery({
        queryKey: [
          'marketplace-products',
          filters,
          nextPage,
          pagination.itemsPerPage,
          hasSearchQuery,
          shouldUseRPCFiltering,
        ],
        queryFn: () =>
          fetchMarketplaceProducts({
            filters,
            pagination: { ...pagination, currentPage: nextPage },
            hasSearchQuery,
            shouldUseRPCFiltering,
          }),
        staleTime: cacheStrategies.products.staleTime,
      });
    }
  };

  // ✅ OPTIMISATION: Prefetching de la page précédente
  const prefetchPreviousPage = () => {
    if (query.data && pagination.currentPage > 1) {
      const prevPage = pagination.currentPage - 1;
      queryClient.prefetchQuery({
        queryKey: [
          'marketplace-products',
          filters,
          prevPage,
          pagination.itemsPerPage,
          hasSearchQuery,
          shouldUseRPCFiltering,
        ],
        queryFn: () =>
          fetchMarketplaceProducts({
            filters,
            pagination: { ...pagination, currentPage: prevPage },
            hasSearchQuery,
            shouldUseRPCFiltering,
          }),
        staleTime: cacheStrategies.products.staleTime,
      });
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

