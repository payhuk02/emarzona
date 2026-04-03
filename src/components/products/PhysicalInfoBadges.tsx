/**
 * Physical Info Badges - Composants pour afficher les informations spécifiques aux produits physiques
 * Date: 2 Février 2025
 *
 * Badges pour:
 * - Guide des tailles (size chart)
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Ruler } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

/**
 * Badge Guide des tailles
 */
export function PhysicalSizeChartBadge({
  sizeChartId,
  sizeChartName,
  productSlug,
  storeSlug,
  size = 'sm',
  className,
}: {
  sizeChartId?: string | null;
  sizeChartName?: string | null;
  productSlug?: string;
  storeSlug?: string;
  size?: 'sm' | 'md';
  className?: string;
}) {
  if (!sizeChartId) return null;

  const sizeClasses = {
    sm: 'text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5',
    md: 'text-xs sm:text-sm px-2 sm:px-3 py-1',
  };

  const iconSizes = {
    sm: 'h-2.5 w-2.5 sm:h-3 sm:w-3',
    md: 'h-3 w-3 sm:h-4 sm:w-4',
  };

  // Lien vers le guide des tailles (sera sur la page produit détaillée)
  const sizeChartUrl = storeSlug
    ? `/stores/${storeSlug}/products/${productSlug}#size-chart`
    : productSlug
      ? `/products/${productSlug}#size-chart`
      : '#size-chart';

  return (
    <Badge
      variant="outline"
      className={cn(
        'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors',
        sizeClasses[size],
        className
      )}
      title={sizeChartName || 'Guide des tailles disponible'}
      asChild
    >
      <Link to={sizeChartUrl} onClick={e => e.stopPropagation()}>
        <Ruler className={cn(iconSizes[size], 'mr-0.5 sm:mr-1')} />
        <span className="hidden sm:inline">Guide des tailles</span>
        <span className="sm:hidden">Tailles</span>
      </Link>
    </Badge>
  );
}







