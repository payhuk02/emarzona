/**
 * LazyCalendar - Wrapper pour le lazy loading de react-big-calendar
 * Optimise les performances en chargeant le calendrier uniquement quand nécessaire
 */

import { lazy, Suspense, ComponentType } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

// Composant de chargement pour le calendrier
const CalendarLoadingFallback = () => (
  <Card>
    <CardContent className="p-6">
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    </CardContent>
  </Card>
);

/**
 * Export lazy de react-big-calendar
 * Utilisez ceci au lieu d'importer directement react-big-calendar
 */
export const LazyCalendar = lazy(() => 
  import('react-big-calendar').then(module => ({
    default: module.Calendar,
    dateFnsLocalizer: module.dateFnsLocalizer,
    View: module.View,
    Views: module.Views,
  }))
);

/**
 * Export lazy du CSS de react-big-calendar
 */
export const LazyCalendarCSS = lazy(() => 
  import('react-big-calendar/lib/css/react-big-calendar.css')
);

/**
 * Wrapper pour les composants utilisant react-big-calendar
 */
export function withLazyCalendar<P extends object>(
  Component: ComponentType<P>
): ComponentType<P> {
  return function LazyCalendarWrapper(props: P) {
    return (
      <Suspense fallback={<CalendarLoadingFallback />}>
        <Component {...props} />
      </Suspense>
    );
  };
}

