/**
 * Skeleton loader pour les cartes de recommandations personnalisées
 * Dimensions optimisées pour éviter CLS
 */

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const RecommendationCardSkeleton = () => {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="p-0">
        <div className="aspect-square relative overflow-hidden rounded-t-lg bg-muted">
          <Skeleton className="h-full w-full" />
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-2">
          {/* Title skeleton */}
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />

          {/* Rating and badge skeleton */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-5 w-16" />
          </div>

          {/* Price skeleton */}
          <Skeleton className="h-5 w-24" />
        </div>
      </CardContent>
    </Card>
  );
};
