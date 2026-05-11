/**
 * Skeleton de chargement pour le Dashboard
 * Affiche une structure visuelle pendant le chargement des données
 */

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/** Skeleton pour les 4 cartes de statistiques */
export const StatsSkeleton = () => (
  <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <Card key={i} className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-1.5 sm:pb-2 md:pb-3 p-2.5 sm:p-3 md:p-4">
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-3 w-3 sm:h-4 sm:w-4 rounded" />
            <Skeleton className="h-3 sm:h-4 w-16 sm:w-20" />
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
          <Skeleton className="h-5 sm:h-7 w-20 sm:w-28 mb-2" />
          <Skeleton className="h-3 w-24 mb-2" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </CardContent>
      </Card>
    ))}
  </div>
);

/** Skeleton pour les actions rapides */
export const QuickActionsSkeleton = () => (
  <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
    <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 md:p-6">
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-5 w-32" />
      </div>
    </CardHeader>
    <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="border-border/50 bg-card/50">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-start gap-2">
                <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </CardContent>
  </Card>
);

/** Skeleton pour les graphiques */
export const ChartsSkeleton = () => (
  <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2">
    <Skeleton className="h-[300px] w-full rounded-lg" />
    <Skeleton className="h-[300px] w-full rounded-lg" />
  </div>
);

/** Skeleton complet du dashboard (store en cours de chargement) */
export const DashboardFullSkeleton = () => (
  <div className="space-y-4 sm:space-y-6">
    {/* Header skeleton */}
    <div className="flex items-center justify-between">
      <div>
        <Skeleton className="h-7 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-9 rounded-md" />
      </div>
    </div>
    <StatsSkeleton />
    <QuickActionsSkeleton />
    <ChartsSkeleton />
  </div>
);
