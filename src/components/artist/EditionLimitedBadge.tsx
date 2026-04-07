/**
 * Composant pour afficher le badge d'édition limitée avec tracking des ventes
 * Date: 3 Février 2025
 */

import { Award, TrendingUp } from 'lucide-react';
import { useEditionTracking } from '@/hooks/artist/useEditionTracking';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface EditionLimitedBadgeProps {
  productId: string;
  editionNumber: number;
  totalEditions: number;
  className?: string;
  showProgress?: boolean;
}

export const EditionLimitedBadge = ({
  productId,
  editionNumber,
  totalEditions,
  className,
  showProgress = true,
}: EditionLimitedBadgeProps) => {
  const { data: tracking, isLoading } = useEditionTracking(productId);

  if (isLoading) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 mb-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800',
          className
        )}
      >
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-32" />
      </div>
    );
  }

  const soldCount = tracking?.sold_count || 0;
  const availableCount = tracking?.available_count ?? totalEditions;
  const soldPercentage = tracking?.sold_percentage || 0;

  return (
    <div
      className={cn(
        'space-y-2 mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Award className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
        <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
          Édition limitée {editionNumber}/{totalEditions}
        </span>
        {soldCount > 0 && (
          <div className="flex items-center gap-1 ml-auto">
            <TrendingUp className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
            <span className="text-xs font-semibold text-yellow-700 dark:text-yellow-300">
              {soldCount}/{totalEditions} vendus
            </span>
          </div>
        )}
      </div>

      {showProgress && soldCount > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-yellow-700 dark:text-yellow-300">
            <span>
              {availableCount} disponible{availableCount > 1 ? 's' : ''}
            </span>
            <span>
              {soldPercentage}% vendu{soldPercentage > 1 ? 's' : ''}
            </span>
          </div>
          <Progress value={soldPercentage} className="h-1.5 bg-yellow-100 dark:bg-yellow-900/30" />
        </div>
      )}
    </div>
  );
};







