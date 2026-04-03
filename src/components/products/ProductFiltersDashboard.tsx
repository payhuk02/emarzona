import { Search, SlidersHorizontal, Filter, X, BarChart3 } from 'lucide-react';
import { Command } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import React, { useState, RefObject, useMemo, useCallback } from 'react';

interface ProductFiltersDashboardProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchInputRef?: RefObject<HTMLInputElement>;
  category: string;
  onCategoryChange: (value: string) => void;
  productType: string;
  onProductTypeChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  stockStatus?: string;
  onStockStatusChange?: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  categories: string[];
  productTypes: string[];
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  totalProducts?: number;
  activeProducts?: number;
}

const ProductFiltersDashboardComponent = ({
  searchQuery,
  onSearchChange,
  searchInputRef,
  category,
  onCategoryChange,
  productType,
  onProductTypeChange,
  status,
  onStatusChange,
  stockStatus = 'all',
  onStockStatusChange,
  sortBy,
  onSortByChange,
  categories,
  productTypes,
  viewMode = 'grid',
  onViewModeChange,
  totalProducts = 0,
  activeProducts = 0,
}: ProductFiltersDashboardProps) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Mémoriser les calculs coûteux
  const hasFilters = useMemo(
    () =>
      category !== 'all' ||
      productType !== 'all' ||
      status !== 'all' ||
      stockStatus !== 'all' ||
      searchQuery,
    [category, productType, status, stockStatus, searchQuery]
  );

  const clearFilters = useCallback(() => {
    onCategoryChange('all');
    onProductTypeChange('all');
    onStatusChange('all');
    onStockStatusChange?.('all');
    onSearchChange('');
  }, [onCategoryChange, onProductTypeChange, onStatusChange, onStockStatusChange, onSearchChange]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (category !== 'all') count++;
    if (productType !== 'all') count++;
    if (status !== 'all') count++;
    if (stockStatus !== 'all') count++;
    if (searchQuery) count++;
    return count;
  }, [category, productType, status, stockStatus, searchQuery]);

  const sortOptions = useMemo(
    () => [
      { value: 'recent', label: 'Plus récents' },
      { value: 'oldest', label: 'Plus anciens' },
      { value: 'name-asc', label: 'Nom (A-Z)' },
      { value: 'name-desc', label: 'Nom (Z-A)' },
      { value: 'price-asc', label: 'Prix croissant' },
      { value: 'price-desc', label: 'Prix décroissant' },
      { value: 'popular', label: 'Plus populaires' },
      { value: 'rating', label: 'Meilleures notes' },
    ],
    []
  );

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-5">
      {/* Statistiques rapides avec design amélioré */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 lg:gap-4 p-3 sm:p-4 lg:p-5 bg-card/30 rounded-lg border border-border/30 backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
            <span className="text-sm sm:text-base font-medium text-foreground">
              {totalProducts} produit{totalProducts > 1 ? 's' : ''} total
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-green-500 animate-pulse flex-shrink-0"></div>
            <span className="text-sm sm:text-base text-muted-foreground">
              {activeProducts} actif{activeProducts > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Barre de recherche et filtres avec design amélioré */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground z-10" />
          <Input
            ref={searchInputRef}
            type="search"
            placeholder="Rechercher un produit..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="pl-10 sm:pl-11 pr-9 sm:pr-10 h-11 sm:h-12 bg-background/50 border-border/50 focus:bg-background focus:border-primary/50 transition-all duration-200 text-sm sm:text-base touch-manipulation"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSearchChange('')}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 sm:h-10 sm:w-10 p-0 hover:bg-accent/50 transition-all duration-200 touch-manipulation"
              style={{ willChange: 'transform' }}
              aria-label="Effacer la recherche"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          )}
        </div>

        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="relative h-11 sm:h-12 w-full sm:w-auto hover:bg-accent/50 transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation"
              style={{ willChange: 'transform' }}
            >
              <SlidersHorizontal className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
              <span className="text-sm sm:text-base">Filtres</span>
              {hasFilters && (
                <Badge
                  variant="secondary"
                  className="ml-2 h-5 w-5 sm:h-6 sm:w-6 rounded-full p-0 flex items-center justify-center text-xs font-semibold animate-in zoom-in-95 duration-200 flex-shrink-0"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[calc(100vw-2rem)] sm:w-80 max-w-[calc(100vw-2rem)] sm:max-w-none p-4 sm:p-6"
            align="end"
            sideOffset={8}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filtres
                </h4>
                {hasFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
                    Réinitialiser
                  </Button>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Statut</Label>
                  <Select value={status} onValueChange={onStatusChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les statuts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="active">Actifs uniquement</SelectItem>
                      <SelectItem value="inactive">Inactifs uniquement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Catégorie</Label>
                  <Select value={category} onValueChange={onCategoryChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Toutes les catégories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les catégories</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Type de produit</Label>
                  <Select value={productType} onValueChange={onProductTypeChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      {productTypes.map(type => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {onStockStatusChange && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">État du stock</Label>
                    <Select value={stockStatus} onValueChange={onStockStatusChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tous les stocks" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les stocks</SelectItem>
                        <SelectItem value="in_stock">En stock</SelectItem>
                        <SelectItem value="low_stock">Stock faible</SelectItem>
                        <SelectItem value="out_of_stock">Rupture de stock</SelectItem>
                        <SelectItem value="needs_restock">Nécessite réapprovisionnement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {hasFilters && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Filtres actifs</Label>
                    <div className="flex flex-wrap gap-2">
                      {searchQuery && (
                        <Badge variant="secondary" className="text-xs">
                          Recherche: {searchQuery}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onSearchChange('')}
                            className="ml-1 h-4 w-4 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      )}
                      {category !== 'all' && (
                        <Badge variant="secondary" className="text-xs">
                          Catégorie: {category}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onCategoryChange('all')}
                            className="ml-1 h-4 w-4 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      )}
                      {productType !== 'all' && (
                        <Badge variant="secondary" className="text-xs">
                          Type: {productType}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onProductTypeChange('all')}
                            className="ml-1 h-4 w-4 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      )}
                      {status !== 'all' && (
                        <Badge variant="secondary" className="text-xs">
                          Statut: {status === 'active' ? 'Actifs' : 'Inactifs'}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onStatusChange('all')}
                            className="ml-1 h-4 w-4 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      )}
                      {stockStatus !== 'all' && onStockStatusChange && (
                        <Badge variant="secondary" className="text-xs">
                          Stock:{' '}
                          {stockStatus === 'in_stock'
                            ? 'En stock'
                            : stockStatus === 'low_stock'
                              ? 'Faible'
                              : stockStatus === 'out_of_stock'
                                ? 'Rupture'
                                : 'Réappro.'}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onStockStatusChange('all')}
                            className="ml-1 h-4 w-4 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <Select value={sortBy} onValueChange={onSortByChange}>
          <SelectTrigger className="w-full sm:w-[140px] lg:w-[180px] h-11 sm:h-12 bg-background/50 border-border/50 focus:border-primary/50 transition-all duration-200 text-sm sm:text-base touch-manipulation">
            <SelectValue placeholder="Trier par" />
          </SelectTrigger>
          <SelectContent mobileVariant="sheet" className="w-[calc(100vw-2rem)] sm:w-auto">
            {sortOptions.map(option => (
              <SelectItem key={option.value} value={option.value} className="text-sm sm:text-base">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

// Optimisation avec React.memo pour éviter les re-renders inutiles
const ProductFiltersDashboard = React.memo(
  ProductFiltersDashboardComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.searchQuery === nextProps.searchQuery &&
      prevProps.category === nextProps.category &&
      prevProps.productType === nextProps.productType &&
      prevProps.status === nextProps.status &&
      prevProps.stockStatus === nextProps.stockStatus &&
      prevProps.sortBy === nextProps.sortBy &&
      prevProps.viewMode === nextProps.viewMode &&
      prevProps.totalProducts === nextProps.totalProducts &&
      prevProps.activeProducts === nextProps.activeProducts &&
      prevProps.categories.length === nextProps.categories.length &&
      prevProps.productTypes.length === nextProps.productTypes.length &&
      prevProps.onSearchChange === nextProps.onSearchChange &&
      prevProps.onCategoryChange === nextProps.onCategoryChange &&
      prevProps.onProductTypeChange === nextProps.onProductTypeChange &&
      prevProps.onStatusChange === nextProps.onStatusChange &&
      prevProps.onStockStatusChange === nextProps.onStockStatusChange &&
      prevProps.onSortByChange === nextProps.onSortByChange &&
      prevProps.onViewModeChange === nextProps.onViewModeChange
    );
  }
);

ProductFiltersDashboard.displayName = 'ProductFiltersDashboard';

export default ProductFiltersDashboard;
