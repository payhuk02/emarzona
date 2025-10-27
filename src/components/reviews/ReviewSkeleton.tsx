/**
 * Skeletons précis pour les reviews
 * Date : 27 octobre 2025
 */

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Skeleton pour une carte de review individuelle
 */
export const ReviewCardSkeleton = () => (
  <Card className="p-6">
    <CardContent className="p-0 space-y-4">
      {/* Header avec avatar et nom */}
      <div className="flex items-start gap-4">
        <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <div className="flex items-center gap-2">
            {/* Stars skeleton */}
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-4 w-4 rounded" />
              ))}
            </div>
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-4/5" />
      </div>

      {/* Media preview */}
      <div className="flex gap-2">
        <Skeleton className="h-20 w-20 rounded-lg" />
        <Skeleton className="h-20 w-20 rounded-lg" />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
      </div>
    </CardContent>
  </Card>
);

/**
 * Skeleton pour les statistiques de reviews
 */
export const ReviewStatsSkele ton = () => (
  <Card className="p-6">
    <CardContent className="p-0 space-y-6">
      {/* Average rating */}
      <div className="text-center space-y-2">
        <Skeleton className="h-12 w-24 mx-auto" />
        <div className="flex justify-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-6 w-6" />
          ))}
        </div>
        <Skeleton className="h-4 w-32 mx-auto" />
      </div>

      {/* Rating distribution */}
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-2 flex-1" />
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

/**
 * Skeleton pour la liste de reviews
 */
export const ReviewsListSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-4">
    {[...Array(count)].map((_, i) => (
      <ReviewCardSkeleton key={i} />
    ))}
  </div>
);

/**
 * Skeleton pour le formulaire de review
 */
export const ReviewFormSkeleton = () => (
  <div className="space-y-6">
    {/* Rating */}
    <div className="space-y-2">
      <Skeleton className="h-4 w-32" />
      <div className="flex gap-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-8 w-8" />
        ))}
      </div>
    </div>

    {/* Title */}
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-full" />
    </div>

    {/* Content */}
    <div className="space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-32 w-full" />
    </div>

    {/* Media upload */}
    <div className="space-y-2">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-24 w-full" />
    </div>

    {/* Actions */}
    <div className="flex gap-3">
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-10 w-32" />
    </div>
  </div>
);

/**
 * Skeleton pour le résumé complet de reviews
 */
export const ProductReviewsSummarySkeleton = () => (
  <div className="space-y-6">
    {/* Header */}
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-32" />
    </div>

    {/* Layout */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Stats */}
      <div className="lg:col-span-1">
        <ReviewStatsSkeleton />
      </div>

      {/* List */}
      <div className="lg:col-span-2">
        <ReviewsListSkeleton />
      </div>
    </div>
  </div>
);

