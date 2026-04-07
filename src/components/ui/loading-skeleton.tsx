/**
 * Composants de skeleton pour les états de chargement
 * Optimisés avec React.memo pour éviter les re-renders inutiles
 */

import { memo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const LoadingSkeleton = memo(() => {
  return (
    <div className="w-full space-y-4 p-4">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
});

LoadingSkeleton.displayName = 'LoadingSkeleton';

export const CardSkeleton = memo(() => {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
});

CardSkeleton.displayName = 'CardSkeleton';

export const TableSkeleton = memo(({ rows = 5 }: { rows?: number }) => {
  return (
    <div className="w-full space-y-2">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
});

TableSkeleton.displayName = 'TableSkeleton';






