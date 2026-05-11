/**
 * Composant Hero Section pour le marketplace
 * Affiche le titre, la barre de recherche, et les filtres rapides
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FilterState } from '@/types/marketplace';
import { Filter, Zap, Heart, BarChart3, X, Sparkles } from 'lucide-react';
import { CategoryNavigationBar } from './CategoryNavigationBar';
import { SearchAutocomplete } from './SearchAutocomplete';
import { usePageCustomization } from '@/hooks/usePageCustomization';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

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
        className="relative py-8 sm:py-12 lg:py-16 px-3 sm:px-4 overflow-hidden"
        aria-labelledby="hero-title"
        role="banner"
      >
        <div
          className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 animate-pulse"
          aria-hidden="true"
        ></div>
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-6 sm:mb-8 lg:mb-12">
            <div className="flex items-center justify-center gap-1 sm:gap-2 mb-3 sm:mb-4">
              <Sparkles
                className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-yellow-400 animate-pulse"
                aria-hidden="true"
              />
              <h1
                id="hero-title"
                className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
              >
                {getValue('marketplace.hero.title')}
              </h1>
              <Sparkles
                className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-yellow-400 animate-pulse"
                aria-hidden="true"
              />
            </div>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-slate-300 mb-3 sm:mb-4 md:mb-6 lg:mb-8 max-w-4xl mx-auto leading-relaxed px-2">
              {getValue('marketplace.hero.subtitle')}
              <br />
              <span className="text-blue-400 font-semibold">
                {getValue('marketplace.hero.tagline')}
              </span>
            </p>
          </div>

          {/* Barre de navigation par catégories */}
          <CategoryNavigationBar
            categories={categories}
            selectedCategory={filters.category}
            onCategoryChange={category => onFilterChange({ category })}
          />

          {/* Barre de recherche avancée avec auto-complétion */}
          <div className="max-w-4xl mx-auto mb-4 sm:mb-6 px-2">
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

          {/* Filtres actifs (tags) */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 items-center justify-center mb-3 sm:mb-4 px-2">
              <span className="text-xs sm:text-sm text-slate-300 font-medium">
                {getValue('marketplace.filtersActive')}
              </span>

              {filters.category !== 'all' && (
                <Badge
                  variant="secondary"
                  className="bg-slate-700 text-white hover:bg-slate-600 transition-colors flex items-center gap-1 text-xs sm:text-sm"
                >
                  {getValue('marketplace.filterLabels.category')} {filters.category}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-red-400"
                    onClick={() => onFilterChange({ category: 'all' })}
                    aria-label={`${getValue('marketplace.filterLabels.clear')} ${filters.category}`}
                  />
                </Badge>
              )}

              {filters.productType !== 'all' && (
                <Badge
                  variant="secondary"
                  className="bg-slate-700 text-white hover:bg-slate-600 transition-colors flex items-center gap-1 text-xs sm:text-sm"
                >
                  {getValue('marketplace.filterLabels.type')} {filters.productType}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-red-400"
                    onClick={() => onFilterChange({ productType: 'all' })}
                    aria-label={`${getValue('marketplace.filterLabels.clear')} ${filters.productType}`}
                  />
                </Badge>
              )}

              {filters.priceRange !== 'all' && (
                <Badge
                  variant="secondary"
                  className="bg-slate-700 text-white hover:bg-slate-600 transition-colors flex items-center gap-1 text-xs sm:text-sm"
                >
                  {getValue('marketplace.filterLabels.priceRange')}{' '}
                  {PRICE_RANGES.find(r => r.value === filters.priceRange)?.label}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-red-400"
                    onClick={() => onFilterChange({ priceRange: 'all' })}
                    aria-label={`${getValue('marketplace.filterLabels.clear')} ${getValue('marketplace.filterLabels.priceRange')}`}
                  />
                </Badge>
              )}

              {filters.verifiedOnly && (
                <Badge
                  variant="secondary"
                  className="bg-green-700 text-white hover:bg-green-600 transition-colors flex items-center gap-1 text-xs sm:text-sm"
                >
                  ✓ {getValue('marketplace.filterLabels.verified')}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-red-400"
                    onClick={() => onFilterChange({ verifiedOnly: false })}
                    aria-label={`${getValue('marketplace.filterLabels.clear')} ${getValue('marketplace.filterLabels.verified')}`}
                  />
                </Badge>
              )}

              {filters.featuredOnly && (
                <Badge
                  variant="secondary"
                  className="bg-yellow-700 text-white hover:bg-yellow-600 transition-colors flex items-center gap-1 text-xs sm:text-sm"
                >
                  ⭐ {getValue('marketplace.filterLabels.featured')}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-red-400"
                    onClick={() => onFilterChange({ featuredOnly: false })}
                    aria-label={`${getValue('marketplace.filterLabels.clear')} ${getValue('marketplace.filterLabels.featured')}`}
                  />
                </Badge>
              )}

              {filters.tags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="bg-purple-700 text-white hover:bg-purple-600 transition-colors flex items-center gap-1 text-xs sm:text-sm"
                >
                  {getValue('marketplace.filterLabels.tag')} {tag}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-red-400"
                    onClick={() =>
                      onFilterChange({ tags: filters.tags.filter(t => t !== tag) })
                    }
                    aria-label={`${getValue('marketplace.filterLabels.clear')} ${tag}`}
                  />
                </Badge>
              ))}

              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="text-xs sm:text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 sm:h-8"
                aria-label={`${getValue('marketplace.filterLabels.clear')} ${getValue('marketplace.filterLabels.all')}`}
              >
                {getValue('marketplace.filterLabels.clear')}{' '}
                {getValue('marketplace.filterLabels.all')}
              </Button>
            </div>
          )}

          {/* Filtres rapides */}
          <div
            className="flex flex-wrap gap-2 sm:gap-3 justify-center px-2"
            role="toolbar"
            aria-label={t('marketplace.toolbar.ariaLabel')}
          >
            <Button
              variant="outline"
              onClick={onToggleFilters}
              className="bg-slate-800/80 backdrop-blur-sm border-slate-600 text-white hover:bg-slate-700 transition-all duration-300 hover:scale-105 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 text-xs sm:text-sm h-8 sm:h-10 px-2 sm:px-4"
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
                  className="ml-1 sm:ml-2 h-4 w-4 sm:h-5 sm:w-5 rounded-full p-0 flex items-center justify-center text-xs animate-pulse"
                  aria-label="Filtres actifs"
                >
                  !
                </Badge>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={onToggleAdvancedSearch}
              className="bg-slate-800/80 backdrop-blur-sm border-slate-600 text-white hover:bg-slate-700 transition-all duration-300 hover:scale-105 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 text-xs sm:text-sm h-8 sm:h-10 px-2 sm:px-4"
              aria-label="Ouvrir la recherche intelligente"
              aria-expanded={showAdvancedSearch}
            >
              <Zap className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" aria-hidden="true" />
              <span className="hidden sm:inline">Recherche intelligente</span>
              <span className="sm:hidden">Recherche</span>
            </Button>

            <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-600 text-white rounded-md px-2 sm:px-4 py-1.5 sm:py-2 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Heart className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Mes favoris</span>
              <span className="sm:hidden">Favoris</span>
              {favoritesCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 sm:ml-2 bg-red-600 text-white text-xs"
                  aria-label={`${favoritesCount} favoris`}
                >
                  {favoritesCount}
                </Badge>
              )}
            </div>

            <Button
              variant="outline"
              onClick={onToggleComparison}
              className="bg-slate-800/80 backdrop-blur-sm border-slate-600 text-white hover:bg-slate-700 transition-all duration-300 hover:scale-105 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-slate-900 text-xs sm:text-sm h-8 sm:h-10 px-2 sm:px-4"
              aria-label={`Comparer ${comparisonCount} produit${comparisonCount !== 1 ? 's' : ''}`}
              aria-expanded={false}
            >
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" aria-hidden="true" />
              <span className="hidden sm:inline">Comparer</span>
              {comparisonCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 sm:ml-2 bg-green-600 text-white text-xs animate-bounce"
                  aria-label={`${comparisonCount} produits en comparaison`}
                >
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
