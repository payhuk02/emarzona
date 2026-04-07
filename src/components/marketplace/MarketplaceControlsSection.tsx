/**
 * Composant pour les contrôles de tri et de vue du marketplace
 * Affiche les options de tri, le mode d'affichage, et les statistiques
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FilterState } from '@/types/marketplace';
import { SortAsc, SortDesc, Grid3X3, List } from 'lucide-react';

interface MarketplaceControlsSectionProps {
  filters: FilterState;
  totalItems: number;
  displayedItems: number;
  hasSearchQuery: boolean;
  onFilterChange: (filters: Partial<FilterState>) => void;
  SORT_OPTIONS: Array<{ value: string; label: string; icon: string }>;
}

/**
 * Section des contrôles (tri, vue, statistiques) du marketplace
 */
export const MarketplaceControlsSection = React.memo<MarketplaceControlsSectionProps>(
  ({
    filters,
    totalItems,
    displayedItems,
    hasSearchQuery,
    onFilterChange,
    SORT_OPTIONS,
  }) => {
    const { t } = useTranslation();

    return (
      <section className="py-4 sm:py-6 px-3 sm:px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                Tous les produits
              </h2>
              <Badge
                variant="secondary"
                className="bg-slate-700 text-slate-300 text-xs sm:text-sm"
              >
                {totalItems} produit{totalItems !== 1 ? 's' : ''}
              </Badge>
              {hasSearchQuery && (
                <Badge variant="secondary" className="bg-blue-600 text-white text-xs sm:text-sm">
                  {displayedItems} résultat{displayedItems !== 1 ? 's' : ''} affiché
                  {displayedItems !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
              {/* Tri */}
              <div className="flex items-center gap-2">
                <label className="text-xs sm:text-sm text-slate-300 hidden sm:block">
                  {t('marketplace.sorting.label')}
                </label>
                <select
                  value={filters.sortBy}
                  onChange={e => onFilterChange({ sortBy: e.target.value })}
                  className="flex-1 sm:flex-initial px-3 py-2 min-h-[44px] h-11 sm:h-10 bg-slate-700 border-slate-600 text-white rounded-md text-base sm:text-sm focus:border-blue-500 focus:ring-blue-500 touch-manipulation cursor-pointer"
                >
                  {SORT_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onFilterChange({ sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })
                  }
                  className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 transition-all duration-300 h-9 sm:h-10 w-9 sm:w-10 p-0"
                  aria-label={
                    filters.sortOrder === 'asc'
                      ? t('marketplace.sorting.ascending')
                      : t('marketplace.sorting.descending')
                  }
                >
                  {filters.sortOrder === 'asc' ? (
                    <SortAsc className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  ) : (
                    <SortDesc className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  )}
                </Button>
              </div>

              {/* Mode de vue */}
              <div className="flex items-center gap-1">
                <Button
                  variant={filters.viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onFilterChange({ viewMode: 'grid' })}
                  className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 transition-all duration-300 h-9 sm:h-10 w-9 sm:w-10 p-0"
                  aria-label={t('marketplace.viewMode.grid')}
                >
                  <Grid3X3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
                <Button
                  variant={filters.viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onFilterChange({ viewMode: 'list' })}
                  className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 transition-all duration-300 h-9 sm:h-10 w-9 sm:w-10 p-0"
                  aria-label={t('marketplace.viewMode.list')}
                >
                  <List className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }
);

MarketplaceControlsSection.displayName = 'MarketplaceControlsSection';
