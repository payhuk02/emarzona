import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Package, Wrench, GraduationCap, Palette, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ProductTypeFilter = 'all' | 'digital' | 'physical' | 'service' | 'course' | 'artist';

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

const TYPE_CONFIG = {
  all: {
    label: 'Tous',
    icon: null,
    color: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20',
    hoverColor: 'hover:bg-gray-500/20',
  },
  digital: {
    label: 'Digitaux',
    icon: FileText,
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    hoverColor: 'hover:bg-blue-500/20',
  },
  physical: {
    label: 'Physiques',
    icon: Package,
    color: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
    hoverColor: 'hover:bg-green-500/20',
  },
  service: {
    label: 'Services',
    icon: Wrench,
    color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    hoverColor: 'hover:bg-purple-500/20',
  },
  course: {
    label: 'Cours',
    icon: GraduationCap,
    color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
    hoverColor: 'hover:bg-orange-500/20',
  },
  artist: {
    label: 'Artistes',
    icon: Palette,
    color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
    hoverColor: 'hover:bg-pink-500/20',
  },
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
        {(Object.keys(TYPE_CONFIG) as ProductTypeFilter[]).map(type => {
          const config = TYPE_CONFIG[type];
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
                isSelected ? config.color : `${config.color} ${config.hoverColor} border`
              )}
            >
              {Icon && <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
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
