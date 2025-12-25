/**
 * Hook pour filtrer les produits par type avec cache React Query
 * Utilise les fonctions RPC optimisées pour le filtrage serveur
 * Date: 31 Janvier 2025
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { FilterState, Product } from '@/types/marketplace';

interface FilteredProductsOptions {
  filters: FilterState;
  pagination: {
    currentPage: number;
    itemsPerPage: number;
  };
  enabled?: boolean;
}

/**
 * Hook pour filtrer les produits digitaux
 */
export function useFilteredDigitalProducts(options: FilteredProductsOptions) {
  const { filters, pagination, enabled = true } = options;

  return useQuery({
    queryKey: [
      'filtered-digital-products',
      filters,
      pagination.currentPage,
      pagination.itemsPerPage,
    ],
    queryFn: async () => {
      const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
      const endIndex = startIndex + pagination.itemsPerPage - 1;

      try {
        const { data, error } = await supabase.rpc('filter_digital_products', {
          p_limit: pagination.itemsPerPage,
          p_offset: startIndex,
          p_category: filters.category !== 'all' ? filters.category : null,
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
          p_digital_sub_type:
            filters.digitalSubType && filters.digitalSubType !== 'all'
              ? filters.digitalSubType
              : null,
          p_instant_delivery: filters.instantDelivery || null,
          p_sort_by: filters.sortBy || 'created_at',
          p_sort_order: filters.sortOrder || 'desc',
        });

        if (error) {
          logger.error('Error filtering digital products:', error);
          throw error;
        }

        return (data || []) as Product[];
      } catch (error) {
        logger.error('Error in useFilteredDigitalProducts:', error);
        return [];
      }
    },
    enabled: enabled && filters.productType === 'digital',
    staleTime: 30000, // 30 secondes
    gcTime: 300000, // 5 minutes (anciennement cacheTime)
  });
}

/**
 * Hook pour filtrer les produits physiques
 */
export function useFilteredPhysicalProducts(options: FilteredProductsOptions) {
  const { filters, pagination, enabled = true } = options;

  return useQuery({
    queryKey: [
      'filtered-physical-products',
      filters,
      pagination.currentPage,
      pagination.itemsPerPage,
    ],
    queryFn: async () => {
      const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
      const endIndex = startIndex + pagination.itemsPerPage - 1;

      try {
        const { data, error } = await supabase.rpc('filter_physical_products', {
          p_limit: pagination.itemsPerPage,
          p_offset: startIndex,
          p_category: filters.category !== 'all' ? filters.category : null,
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
          p_stock_availability:
            filters.stockAvailability && filters.stockAvailability !== 'all'
              ? filters.stockAvailability
              : null,
          p_shipping_type:
            filters.shippingType && filters.shippingType !== 'all' ? filters.shippingType : null,
          p_physical_category: filters.physicalCategory || null,
          p_sort_by: filters.sortBy || 'created_at',
          p_sort_order: filters.sortOrder || 'desc',
        });

        if (error) {
          logger.error('Error filtering physical products:', error);
          throw error;
        }

        return (data || []) as Product[];
      } catch (error) {
        logger.error('Error in useFilteredPhysicalProducts:', error);
        return [];
      }
    },
    enabled: enabled && filters.productType === 'physical',
    staleTime: 30000,
    gcTime: 300000,
  });
}

/**
 * Hook pour filtrer les services
 */
export function useFilteredServiceProducts(options: FilteredProductsOptions) {
  const { filters, pagination, enabled = true } = options;

  return useQuery({
    queryKey: [
      'filtered-service-products',
      filters,
      pagination.currentPage,
      pagination.itemsPerPage,
    ],
    queryFn: async () => {
      const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
      const endIndex = startIndex + pagination.itemsPerPage - 1;

      try {
        const { data, error } = await supabase.rpc('filter_service_products', {
          p_limit: pagination.itemsPerPage,
          p_offset: startIndex,
          p_category: filters.category !== 'all' ? filters.category : null,
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
          p_service_type:
            filters.serviceType && filters.serviceType !== 'all' ? filters.serviceType : null,
          p_location_type:
            filters.locationType && filters.locationType !== 'all' ? filters.locationType : null,
          p_calendar_available: filters.calendarAvailable || null,
          p_sort_by: filters.sortBy || 'created_at',
          p_sort_order: filters.sortOrder || 'desc',
        });

        if (error) {
          logger.error('Error filtering service products:', error);
          throw error;
        }

        return (data || []) as Product[];
      } catch (error) {
        logger.error('Error in useFilteredServiceProducts:', error);
        return [];
      }
    },
    enabled: enabled && filters.productType === 'service',
    staleTime: 30000,
    gcTime: 300000,
  });
}

/**
 * Hook pour filtrer les cours
 */
export function useFilteredCourseProducts(options: FilteredProductsOptions) {
  const { filters, pagination, enabled = true } = options;

  return useQuery({
    queryKey: [
      'filtered-course-products',
      filters,
      pagination.currentPage,
      pagination.itemsPerPage,
    ],
    queryFn: async () => {
      const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
      const endIndex = startIndex + pagination.itemsPerPage - 1;

      try {
        const { data, error } = await supabase.rpc('filter_course_products', {
          p_limit: pagination.itemsPerPage,
          p_offset: startIndex,
          p_category: filters.category !== 'all' ? filters.category : null,
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
          p_difficulty:
            filters.difficulty && filters.difficulty !== 'all' ? filters.difficulty : null,
          p_access_type:
            filters.accessType && filters.accessType !== 'all' ? filters.accessType : null,
          p_course_duration:
            filters.courseDuration && filters.courseDuration !== 'all'
              ? filters.courseDuration
              : null,
          p_sort_by: filters.sortBy || 'created_at',
          p_sort_order: filters.sortOrder || 'desc',
        });

        if (error) {
          logger.error('Error filtering course products:', error);
          throw error;
        }

        return (data || []) as Product[];
      } catch (error) {
        logger.error('Error in useFilteredCourseProducts:', error);
        return [];
      }
    },
    enabled: enabled && filters.productType === 'course',
    staleTime: 30000,
    gcTime: 300000,
  });
}

/**
 * Hook pour filtrer les œuvres d'artistes
 */
export function useFilteredArtistProducts(options: FilteredProductsOptions) {
  const { filters, pagination, enabled = true } = options;

  return useQuery({
    queryKey: [
      'filtered-artist-products',
      filters,
      pagination.currentPage,
      pagination.itemsPerPage,
    ],
    queryFn: async () => {
      const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
      const endIndex = startIndex + pagination.itemsPerPage - 1;

      try {
        const { data, error } = await supabase.rpc('filter_artist_products', {
          p_limit: pagination.itemsPerPage,
          p_offset: startIndex,
          p_category: filters.category !== 'all' ? filters.category : null,
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
          p_artist_type:
            filters.artistType && filters.artistType !== 'all' ? filters.artistType : null,
          p_edition_type:
            filters.editionType && filters.editionType !== 'all' ? filters.editionType : null,
          p_certificate_of_authenticity: filters.certificateOfAuthenticity || null,
          p_artwork_availability:
            filters.artworkAvailability && filters.artworkAvailability !== 'all'
              ? filters.artworkAvailability
              : null,
          p_sort_by: filters.sortBy || 'created_at',
          p_sort_order: filters.sortOrder || 'desc',
        });

        if (error) {
          logger.error('Error filtering artist products:', error);
          throw error;
        }

        return (data || []) as Product[];
      } catch (error) {
        logger.error('Error in useFilteredArtistProducts:', error);
        return [];
      }
    },
    enabled: enabled && filters.productType === 'artist',
    staleTime: 30000,
    gcTime: 300000,
  });
}

/**
 * Hook unifié qui sélectionne automatiquement le bon hook selon le type
 */
export function useFilteredProducts(options: FilteredProductsOptions) {
  const digital = useFilteredDigitalProducts(options);
  const physical = useFilteredPhysicalProducts(options);
  const service = useFilteredServiceProducts(options);
  const course = useFilteredCourseProducts(options);
  const artist = useFilteredArtistProducts(options);

  // Retourner le hook actif selon le type de produit
  switch (options.filters.productType) {
    case 'digital':
      return digital;
    case 'physical':
      return physical;
    case 'service':
      return service;
    case 'course':
      return course;
    case 'artist':
      return artist;
    default:
      return { data: [], isLoading: false, isError: false, error: null };
  }
}
