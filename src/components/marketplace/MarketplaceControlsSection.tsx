/**
 * Composant pour les contrôles de tri et de vue du marketplace
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FilterState } from '@/types/marketplace';
import { SortAsc, SortDesc, Grid3X3, List } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MarketplaceControlsSectionProps {
  filters: FilterState;
  totalItems: number;
  displayedItems: number;
  hasSearchQuery: boolean;
  onFilterChange: (filters: Partial<FilterState>) => void;
  SORT_OPTIONS: Array<{ value: string; label: string; icon: string }>;
}

export const MarketplaceControlsSection = React.memo<MarketplaceControlsSectionProps>(
  ({ filters, totalItems, displayedItems, hasSearchQuery, onFilterChange, SORT_OPTIONS }) => {
    const { t } = useTranslation();

    return (
      <section className="mp-catalog py-4 sm:py-6 px-3 sm:px-4">
        <div className="container mx-auto max-w-7xl lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <h2 className="mp-controls__title">Tous les produits</h2>
              <Badge className="mp-badge-count text-xs sm:text-sm">
                {totalItems} produit{totalItems !== 1 ? 's' : ''}
              </Badge>
              {hasSearchQuery && (
                <Badge className="mp-badge-count mp-badge-count--accent text-xs sm:text-sm">
                  {displayedItems} résultat{displayedItems !== 1 ? 's' : ''} affiché
                  {displayedItems !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <label className="text-xs sm:text-sm text-[var(--lp-text-muted)] hidden sm:block">
                  {t('marketplace.sorting.label')}
                </label>
                <select
                  value={filters.sortBy}
                  onChange={e => onFilterChange({ sortBy: e.target.value })}
                  className="mp-select flex-1 sm:flex-initial px-3 py-2 min-h-[44px] h-11 sm:h-10 text-base sm:text-sm touch-manipulation cursor-pointer"
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
                  className="mp-chip min-h-[44px] sm:min-h-0 h-11 sm:h-9 px-3"
                  aria-label={t('marketplace.sorting.toggleOrder')}
                >
                  {filters.sortOrder === 'asc' ? (
                    <SortAsc className="h-4 w-4" />
                  ) : (
                    <SortDesc className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="flex items-center gap-1 rounded-full border border-[var(--lp-border-light)] p-1 bg-[var(--lp-surface-elevated)]">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onFilterChange({ viewMode: 'grid' })}
                  className={cn(
                    'rounded-full h-9 px-3',
                    filters.viewMode === 'grid' && 'mp-chip--active'
                  )}
                  aria-label={t('marketplace.view.grid')}
                  aria-pressed={filters.viewMode === 'grid'}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onFilterChange({ viewMode: 'list' })}
                  className={cn(
                    'rounded-full h-9 px-3',
                    filters.viewMode === 'list' && 'mp-chip--active'
                  )}
                  aria-label={t('marketplace.view.list')}
                  aria-pressed={filters.viewMode === 'list'}
                >
                  <List className="h-4 w-4" />
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
