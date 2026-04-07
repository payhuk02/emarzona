/**
 * Hook pour gérer l'état et la logique des filtres du marketplace
 * Centralise toute la logique de filtrage pour améliorer la maintenabilité
 */

import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FilterState } from '@/types/marketplace';
import { logger } from '@/lib/logger';

const DEFAULT_FILTERS: FilterState = {
  search: '',
  category: 'all',
  productType: 'all',
  licensingType: 'all',
  priceRange: 'all',
  rating: 'all',
  sortBy: 'created_at',
  sortOrder: 'desc',
  viewMode: 'grid',
  tags: [],
  verifiedOnly: false,
  featuredOnly: false,
  inStock: true,
};

/**
 * Hook pour gérer les filtres du marketplace
 * 
 * @returns Objet contenant les filtres, les fonctions de mise à jour, et les constantes
 */
export function useMarketplaceFilters() {
  const { t } = useTranslation();

  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  // Constantes pour les filtres (traduites)
  const PRICE_RANGES = useMemo(
    () => [
      { value: 'all', label: t('marketplace.priceRanges.all') },
      { value: '0-5000', label: t('marketplace.priceRanges.0-5000') },
      { value: '5000-15000', label: t('marketplace.priceRanges.5000-15000') },
      { value: '15000-50000', label: t('marketplace.priceRanges.15000-50000') },
      { value: '50000-100000', label: t('marketplace.priceRanges.50000-100000') },
      { value: '100000+', label: t('marketplace.priceRanges.100000+') },
    ],
    [t]
  );

  const SORT_OPTIONS = useMemo(
    () => [
      { value: 'created_at', label: t('marketplace.sort.newest'), icon: 'Clock' },
      { value: 'price', label: t('marketplace.sort.price'), icon: 'DollarSign' },
      { value: 'rating', label: t('marketplace.sort.rating'), icon: 'Star' },
      { value: 'sales_count', label: t('marketplace.sort.sales'), icon: 'TrendingUp' },
      { value: 'name', label: t('marketplace.sort.name'), icon: 'Eye' },
      { value: 'popularity', label: t('marketplace.sort.popularity'), icon: 'Zap' },
    ],
    [t]
  );

  const PRODUCT_TAGS = useMemo(
    () => [
      t('marketplace.tags.new'),
      t('marketplace.tags.popular'),
      t('marketplace.tags.sale'),
      t('marketplace.tags.recommended'),
      t('marketplace.tags.trending'),
      t('marketplace.tags.premium'),
      t('marketplace.tags.fastShipping'),
      t('marketplace.tags.support'),
      t('marketplace.tags.warranty'),
      t('marketplace.tags.training'),
      t('marketplace.tags.updates'),
      t('marketplace.tags.community'),
    ],
    [t]
  );

  /**
   * Met à jour un ou plusieurs filtres
   * Réinitialise automatiquement la pagination à la page 1
   */
  const updateFilter = useCallback((newFilters: Partial<FilterState>) => {
    setFilters(prev => {
      const updated = { ...prev, ...newFilters };
      logger.debug('[useMarketplaceFilters] Filter updated:', { newFilters, updated });
      return updated;
    });
  }, []);

  /**
   * Réinitialise tous les filtres à leurs valeurs par défaut
   */
  const clearFilters = useCallback(() => {
    logger.debug('[useMarketplaceFilters] Clearing all filters');
    setFilters({
      ...DEFAULT_FILTERS,
      // Réinitialiser tous les filtres spécifiques
      digitalSubType: undefined,
      instantDelivery: false,
      stockAvailability: undefined,
      shippingType: undefined,
      physicalCategory: undefined,
      serviceType: undefined,
      locationType: undefined,
      calendarAvailable: false,
      difficulty: undefined,
      accessType: undefined,
      courseDuration: undefined,
      artistType: undefined,
      editionType: undefined,
      certificateOfAuthenticity: false,
      artworkAvailability: undefined,
    });
  }, []);

  /**
   * Vérifie si des filtres sont actifs (différents des valeurs par défaut)
   */
  const hasActiveFilters = useMemo(() => {
    return (
      filters.category !== 'all' ||
      filters.productType !== 'all' ||
      filters.licensingType !== 'all' ||
      filters.priceRange !== 'all' ||
      filters.rating !== 'all' ||
      filters.tags.length > 0 ||
      filters.verifiedOnly ||
      filters.featuredOnly ||
      filters.search !== ''
    );
  }, [filters]);

  return {
    filters,
    setFilters,
    updateFilter,
    clearFilters,
    hasActiveFilters,
    PRICE_RANGES,
    SORT_OPTIONS,
    PRODUCT_TAGS,
  };
}
