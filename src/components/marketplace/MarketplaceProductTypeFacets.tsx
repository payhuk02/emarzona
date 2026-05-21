import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Package, Download, Truck, Briefcase, GraduationCap, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MarketplaceFacetBucket } from '@/types/marketplace-facets';

const TYPE_CONFIG: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; labelKey: string; fallback: string }
> = {
  all: { icon: Package, labelKey: 'marketplace.facets.allTypes', fallback: 'Tous' },
  digital: { icon: Download, labelKey: 'marketplace.facets.digital', fallback: 'Digitaux' },
  physical: { icon: Truck, labelKey: 'marketplace.facets.physical', fallback: 'Physiques' },
  service: { icon: Briefcase, labelKey: 'marketplace.facets.service', fallback: 'Services' },
  course: { icon: GraduationCap, labelKey: 'marketplace.facets.course', fallback: 'Cours' },
  artist: { icon: Palette, labelKey: 'marketplace.facets.artist', fallback: 'Artistes' },
};

const ORDER = ['all', 'digital', 'physical', 'service', 'course', 'artist'];

interface MarketplaceProductTypeFacetsProps {
  selectedType: string;
  onTypeChange: (type: string) => void;
  productTypeFacets: MarketplaceFacetBucket[];
  totalCount?: number;
  isLoading?: boolean;
}

export const MarketplaceProductTypeFacets = React.memo<MarketplaceProductTypeFacetsProps>(
  ({ selectedType, onTypeChange, productTypeFacets, totalCount, isLoading }) => {
    const { t } = useTranslation();

    const countByType = useMemo(() => {
      const map = new Map<string, number>();
      for (const b of productTypeFacets) {
        map.set(b.value, b.count);
      }
      return map;
    }, [productTypeFacets]);

    const chips = ORDER.map(type => {
      const cfg = TYPE_CONFIG[type];
      const Icon = cfg.icon;
      const count =
        type === 'all'
          ? (totalCount ?? productTypeFacets.reduce((s, b) => s + b.count, 0))
          : countByType.get(type);
      return { type, cfg, Icon, count };
    });

    return (
      <div
        className="flex flex-wrap gap-2 justify-center px-2 mb-4 sm:mb-6"
        role="group"
        aria-label={t('marketplace.facets.ariaLabel', 'Filtrer par type de produit')}
      >
        {chips.map(({ type, cfg, Icon, count }) => {
          const isActive = selectedType === type;
          const label = t(cfg.labelKey, cfg.fallback);
          const countStr =
            count != null && count > 0 && !isLoading ? ` (${count.toLocaleString('fr-FR')})` : '';

          return (
            <button
              key={type}
              type="button"
              onClick={() => onTypeChange(type)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-2 min-h-[44px] text-xs sm:text-sm font-medium transition-all touch-manipulation',
                'border focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
                isActive
                  ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                  : 'bg-slate-800/80 border-slate-600 text-slate-200 hover:bg-slate-700 hover:border-slate-500'
              )}
              aria-pressed={isActive}
              aria-label={`${label}${countStr}`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>
                {label}
                {countStr && <span className="opacity-80">{countStr}</span>}
              </span>
            </button>
          );
        })}
      </div>
    );
  }
);

MarketplaceProductTypeFacets.displayName = 'MarketplaceProductTypeFacets';
