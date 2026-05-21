/**
 * Composant Hero Section pour le marketplace
 * Affiche le titre, la barre de recherche, et les filtres rapides
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FilterState } from '@/types/marketplace';
import { Filter, Zap, Heart, BarChart3, X } from 'lucide-react';
import { CategoryNavigationBar } from './CategoryNavigationBar';
import { MarketplaceProductTypeFacets } from './MarketplaceProductTypeFacets';
import { SearchAutocomplete } from './SearchAutocomplete';
import type { MarketplaceFacetBucket } from '@/types/marketplace-facets';
import { usePageCustomization } from '@/hooks/usePageCustomization';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { cn } from '@/lib/utils';

interface MarketplaceHeroSectionProps {
  filters: FilterState;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSearch: (query: string) => void;
  onFilterChange: (filters: Partial<FilterState>) => void;
  onClearFilters: () => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  showAdvancedSearch: boolean;
  onToggleAdvancedSearch: () => void;
  onToggleComparison: () => void;
  categories: string[];
  productTypeFacets?: MarketplaceFacetBucket[];
  facetsTotal?: number;
  facetsLoading?: boolean;
  favoritesCount: number;
  comparisonCount: number;
  PRICE_RANGES: Array<{ value: string; label: string }>;
  getValue: (key: string) => string;
}

/**
 * Section Hero du marketplace avec recherche et filtres rapides
 */
export const MarketplaceHeroSection = React.memo<MarketplaceHeroSectionProps>(
  ({
    filters,
    searchInput,
    onSearchInputChange,
    onSearch,
    onFilterChange,
    onClearFilters,
    showFilters,
    onToggleFilters,
    showAdvancedSearch,
    onToggleAdvancedSearch,
    onToggleComparison,
    categories,
    productTypeFacets = [],
    facetsTotal,
    facetsLoading,
    favoritesCount,
    comparisonCount,
    PRICE_RANGES,
    getValue,
  }) => {
    const { t } = useTranslation();
    const heroRef = useScrollAnimation<HTMLDivElement>();

    const hasActiveFilters =
      filters.category !== 'all' ||
      filters.productType !== 'all' ||
      filters.priceRange !== 'all' ||
      filters.tags.length > 0 ||
      filters.verifiedOnly ||
      filters.featuredOnly;

    return (
      <section
        ref={heroRef}
        className="mp-hero relative px-3 sm:px-4 overflow-hidden"
        aria-labelledby="hero-title"
        role="banner"
      >
        <div className="mp-hero__inner container mx-auto max-w-7xl lg:px-8 relative z-10">
          <div className="text-center mb-6 sm:mb-8 lg:mb-10 pt-2">
            <p className="lp-eyebrow mb-4 mx-auto">Marketplace</p>
            <h1
              id="hero-title"
              className="mp-hero__title text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-[3.25rem]"
            >
              {getValue('marketplace.hero.title')}
            </h1>
            <p className="mp-hero__subtitle text-sm sm:text-base lg:text-lg mt-4 max-w-3xl mx-auto leading-relaxed px-2">
              {getValue('marketplace.hero.subtitle')}
              <br />
              <span className="mp-hero__tagline">{getValue('marketplace.hero.tagline')}</span>
            </p>
          </div>

          <CategoryNavigationBar
            categories={categories}
            selectedCategory={filters.category}
            onCategoryChange={category => onFilterChange({ category })}
            theme="premium"
          />

          <MarketplaceProductTypeFacets
            selectedType={filters.productType}
            onTypeChange={productType => onFilterChange({ productType })}
            productTypeFacets={productTypeFacets}
            totalCount={facetsTotal}
            isLoading={facetsLoading}
          />

          <div className="max-w-4xl mx-auto mb-4 sm:mb-6 px-2 mp-search-wrap">
            <SearchAutocomplete
              value={searchInput}
              onChange={onSearchInputChange}
              onSearch={onSearch}
              placeholder={
                getValue('marketplace.searchPlaceholder') || 'Rechercher des produits...'
              }
              className="w-full"
              showSuggestions={true}
            />
          </div>

          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 items-center justify-center mb-3 sm:mb-4 px-2">
              <span className="text-xs sm:text-sm mp-hero__subtitle font-medium">
                {getValue('marketplace.filtersActive')}
              </span>

              {filters.category !== 'all' && (
                <Badge className="mp-badge-filter flex items-center gap-1 text-xs sm:text-sm">
                  {getValue('marketplace.filterLabels.category')} {filters.category}
                  <X
                    className="h-3 w-3 cursor-pointer opacity-70 hover:opacity-100"
                    onClick={() => onFilterChange({ category: 'all' })}
                    aria-label={`${getValue('marketplace.filterLabels.clear')} ${filters.category}`}
                  />
                </Badge>
              )}

              {filters.productType !== 'all' && (
                <Badge className="mp-badge-filter flex items-center gap-1 text-xs sm:text-sm">
                  {getValue('marketplace.filterLabels.type')} {filters.productType}
                  <X
                    className="h-3 w-3 cursor-pointer opacity-70 hover:opacity-100"
                    onClick={() => onFilterChange({ productType: 'all' })}
                    aria-label={`${getValue('marketplace.filterLabels.clear')} ${filters.productType}`}
                  />
                </Badge>
              )}

              {filters.priceRange !== 'all' && (
                <Badge className="mp-badge-filter flex items-center gap-1 text-xs sm:text-sm">
                  {getValue('marketplace.filterLabels.priceRange')}{' '}
                  {PRICE_RANGES.find(r => r.value === filters.priceRange)?.label}
                  <X
                    className="h-3 w-3 cursor-pointer opacity-70 hover:opacity-100"
                    onClick={() => onFilterChange({ priceRange: 'all' })}
                    aria-label={`${getValue('marketplace.filterLabels.clear')} ${getValue('marketplace.filterLabels.priceRange')}`}
                  />
                </Badge>
              )}

              {filters.verifiedOnly && (
                <Badge className="mp-badge-filter flex items-center gap-1 text-xs sm:text-sm">
                  ✓ {getValue('marketplace.filterLabels.verified')}
                  <X
                    className="h-3 w-3 cursor-pointer opacity-70 hover:opacity-100"
                    onClick={() => onFilterChange({ verifiedOnly: false })}
                    aria-label={`${getValue('marketplace.filterLabels.clear')} ${getValue('marketplace.filterLabels.verified')}`}
                  />
                </Badge>
              )}

              {filters.featuredOnly && (
                <Badge className="mp-badge-filter flex items-center gap-1 text-xs sm:text-sm">
                  ⭐ {getValue('marketplace.filterLabels.featured')}
                  <X
                    className="h-3 w-3 cursor-pointer opacity-70 hover:opacity-100"
                    onClick={() => onFilterChange({ featuredOnly: false })}
                    aria-label={`${getValue('marketplace.filterLabels.clear')} ${getValue('marketplace.filterLabels.featured')}`}
                  />
                </Badge>
              )}

              {filters.tags.map((tag, index) => (
                <Badge
                  key={index}
                  className="mp-badge-filter flex items-center gap-1 text-xs sm:text-sm"
                >
                  {getValue('marketplace.filterLabels.tag')} {tag}
                  <X
                    className="h-3 w-3 cursor-pointer opacity-70 hover:opacity-100"
                    onClick={() => onFilterChange({ tags: filters.tags.filter(t => t !== tag) })}
                    aria-label={`${getValue('marketplace.filterLabels.clear')} ${tag}`}
                  />
                </Badge>
              ))}

              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="text-xs sm:text-sm text-red-300 hover:text-red-200 hover:bg-red-500/10 h-7 sm:h-8 rounded-full"
                aria-label={`${getValue('marketplace.filterLabels.clear')} ${getValue('marketplace.filterLabels.all')}`}
              >
                {getValue('marketplace.filterLabels.clear')}{' '}
                {getValue('marketplace.filterLabels.all')}
              </Button>
            </div>
          )}

          <div
            className="flex flex-wrap gap-2 sm:gap-3 justify-center px-2"
            role="toolbar"
            aria-label={t('marketplace.toolbar.ariaLabel')}
          >
            <Button
              variant="outline"
              onClick={onToggleFilters}
              className={cn('mp-btn-toolbar text-xs sm:text-sm h-8 sm:h-10 px-3 sm:px-4')}
              aria-label={`${showFilters ? t('common.hide') : t('common.show')} ${t('marketplace.filters.advanced')}`}
              aria-expanded={showFilters}
              aria-controls="advanced-filters"
            >
              <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" aria-hidden="true" />
              <span className="hidden sm:inline">{t('marketplace.filters.advanced')}</span>
              <span className="sm:hidden">Filtres</span>
              {hasActiveFilters && (
                <Badge
                  variant="destructive"
                  className="ml-1 sm:ml-2 h-4 w-4 sm:h-5 sm:w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  aria-label="Filtres actifs"
                >
                  !
                </Badge>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={onToggleAdvancedSearch}
              className="mp-btn-toolbar text-xs sm:text-sm h-8 sm:h-10 px-3 sm:px-4"
              aria-label="Ouvrir la recherche intelligente"
              aria-expanded={showAdvancedSearch}
            >
              <Zap className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" aria-hidden="true" />
              <span className="hidden sm:inline">Recherche intelligente</span>
              <span className="sm:hidden">Recherche</span>
            </Button>

            <div className="mp-btn-toolbar px-3 sm:px-4 py-1.5 sm:py-2 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm min-h-[44px] sm:min-h-0">
              <Heart className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Mes favoris</span>
              <span className="sm:hidden">Favoris</span>
              {favoritesCount > 0 && (
                <Badge className="ml-1 sm:ml-2 bg-red-600 text-white text-xs rounded-full">
                  {favoritesCount}
                </Badge>
              )}
            </div>

            <Button
              variant="outline"
              onClick={onToggleComparison}
              className="mp-btn-toolbar text-xs sm:text-sm h-8 sm:h-10 px-3 sm:px-4"
              aria-label={`Comparer ${comparisonCount} produit${comparisonCount !== 1 ? 's' : ''}`}
              aria-expanded={false}
            >
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" aria-hidden="true" />
              <span className="hidden sm:inline">Comparer</span>
              {comparisonCount > 0 && (
                <Badge className="ml-1 sm:ml-2 bg-green-600 text-white text-xs rounded-full">
                  {comparisonCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </section>
    );
  }
);

MarketplaceHeroSection.displayName = 'MarketplaceHeroSection';
