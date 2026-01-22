import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PRODUCT_TYPE_CONFIG, getAllProductTypes, type ProductType } from '@/constants/product-types';

export type ProductTypeFilter = 'all' | ProductType;

interface ProductTypeQuickFiltersProps {
  selectedType: ProductTypeFilter;
  onTypeChange: (type: ProductTypeFilter) => void;
  stats?: {
    productsByType: {
      digital: number;
      physical: number;
      service: number;
      course: number;
      artist: number;
    };
  };
  className?: string;
}

// Configuration spéciale pour le filtre "all"
const ALL_FILTER_CONFIG = {
  label: 'Tous',
  icon: null,
  color: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20',
  hoverColor: 'hover:bg-gray-500/20',
} as const;

export const ProductTypeQuickFilters = React.memo<ProductTypeQuickFiltersProps>(
  ({ selectedType, onTypeChange, stats, className }) => {
    const getTypeCount = (type: ProductTypeFilter): number => {
      if (!stats || !stats.productsByType) {
        return 0;
      }
      if (type === 'all') {
        return Object.values(stats.productsByType).reduce((sum, count) => sum + (count || 0), 0);
      }
      return stats.productsByType[type] || 0;
    };

    return (
      <div className={cn('flex items-center gap-2 flex-wrap', className)}>
        {/* Bouton "Tous" */}
        <Button
          key="all"
          variant={selectedType === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onTypeChange('all')}
          className={cn(
            'h-8 sm:h-9 text-[10px] sm:text-xs md:text-sm gap-1.5 sm:gap-2 min-h-[36px] transition-all',
            selectedType === 'all'
              ? ALL_FILTER_CONFIG.color
              : `${ALL_FILTER_CONFIG.color} ${ALL_FILTER_CONFIG.hoverColor} border`
          )}
        >
          <span>{ALL_FILTER_CONFIG.label}</span>
          {getTypeCount('all') > 0 && (
            <Badge
              variant={selectedType === 'all' ? 'secondary' : 'outline'}
              className="ml-1 text-[9px] sm:text-[10px] px-1.5 py-0 h-4 sm:h-5"
            >
              {getTypeCount('all')}
            </Badge>
          )}
        </Button>

        {/* Boutons pour chaque type de produit */}
        {getAllProductTypes().map(type => {
          const config = PRODUCT_TYPE_CONFIG[type];
          const Icon = config.icon;
          const isSelected = selectedType === type;
          const count = getTypeCount(type);

          return (
            <Button
              key={type}
              variant={isSelected ? 'default' : 'outline'}
              size="sm"
              onClick={() => onTypeChange(type)}
              className={cn(
                'h-8 sm:h-9 text-[10px] sm:text-xs md:text-sm gap-1.5 sm:gap-2 min-h-[36px] transition-all',
                isSelected
                  ? `${config.bgColor} ${config.textColor} ${config.borderColor || ''}`
                  : `${config.bgColor} ${config.textColor} ${config.hoverColor || ''} ${config.borderColor || ''} border`
              )}
            >
              <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span>{config.label}</span>
              {count > 0 && (
                <Badge
                  variant={isSelected ? 'secondary' : 'outline'}
                  className="ml-1 text-[9px] sm:text-[10px] px-1.5 py-0 h-4 sm:h-5"
                >
                  {count}
                </Badge>
              )}
            </Button>
          );
        })}
        {selectedType !== 'all' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onTypeChange('all')}
            className="h-8 sm:h-9 text-[10px] sm:text-xs md:text-sm min-h-[36px] gap-1"
            title="Réinitialiser les filtres"
          >
            <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span className="hidden sm:inline">Réinitialiser</span>
          </Button>
        )}
      </div>
    );
  }
);

ProductTypeQuickFilters.displayName = 'ProductTypeQuickFilters';






