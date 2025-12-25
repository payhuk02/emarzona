/**
 * ProductCardSkeleton - Skeleton loader pour ProductCardDashboard
 * Dimensions fixes pour éviter CLS (Cumulative Layout Shift)
 */

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const ProductCardSkeleton = () => {
  return (
    <Card 
      className="shadow-sm flex flex-col min-h-[400px] md:min-h-[500px] lg:min-h-[600px]"
      style={{ willChange: 'auto' }}
    >
      {/* Image skeleton avec dimensions fixes */}
      <CardHeader className="p-0 relative overflow-hidden rounded-t-lg flex-[0.6] min-h-[240px] md:min-h-[300px] lg:min-h-[360px]">
        <div 
          className="h-full w-full rounded-t-lg overflow-hidden bg-muted relative"
          style={{ aspectRatio: '4/3' }}
        >
          <Skeleton className="h-full w-full" />
        </div>
      </CardHeader>
      
      {/* Content skeleton */}
      <CardContent className="p-2.5 sm:p-3 lg:p-4 space-y-2 sm:space-y-2.5 lg:space-y-3 flex-[0.4] flex flex-col">
        {/* Title skeleton */}
        <div className="space-y-1.5 sm:space-y-2">
          <Skeleton className="h-4 sm:h-5 lg:h-6 w-3/4" />
          <Skeleton className="h-3 sm:h-4 lg:h-4 w-1/2" />
        </div>

        {/* Price skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 sm:h-6 lg:h-7 w-24 sm:w-32" />
          <Skeleton className="h-4 w-16" />
        </div>

        {/* Badges skeleton */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-16" />
        </div>

        {/* Metadata skeleton */}
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>

        {/* Actions skeleton */}
        <div className="flex gap-1.5 sm:gap-2 pt-1.5 sm:pt-2">
          <Skeleton className="h-11 sm:h-10 flex-1 min-h-[44px]" />
          <Skeleton className="h-11 sm:h-10 w-11 sm:w-10 min-h-[44px] min-w-[44px]" />
        </div>
      </CardContent>
    </Card>
  );
};
