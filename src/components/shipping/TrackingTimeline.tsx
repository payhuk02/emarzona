/**
 * Tracking Timeline Component
 * Date: 28 octobre 2025
 *
 * Timeline visuelle pour le suivi FedEx
 */

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CheckCircle,
  Circle,
  MapPin,
  Package,
  Truck,
  Home,
} from 'lucide-react';
import { useFedexTracking } from '@/hooks/shipping/useFedexShipping';

interface TrackingTimelineProps {
  trackingNumber: string;
}

const eventIcons: Record<string, any> = {
  LABEL_CREATED: Package,
  PICKED_UP: Package,
  IN_TRANSIT: Truck,
  OUT_FOR_DELIVERY: Truck,
  DELIVERED: Home,
};

export function TrackingTimeline({ trackingNumber }: TrackingTimelineProps) {
  const { data: tracking, isLoading } = useFedexTracking(trackingNumber);

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!tracking || !tracking.events || tracking.events.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>Aucune information de suivi disponible</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <h4 className="font-semibold mb-4 flex items-center gap-2">
        <Truck className="h-5 w-5" />
        Suivi détaillé
      </h4>

      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-border" />

        {/* Events */}
        <div className="space-y-6">
          {tracking.events.map((event, index) => {
            const Icon = eventIcons[event.status] || Circle;
            const isLatest = index === 0;
            const isCompleted = event.status === 'DELIVERED';

            return (
              <div key={index} className="relative pl-12">
                {/* Icon */}
                <div
                  className={`absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isLatest
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>

                {/* Content */}
                <div
                  className={`p-4 rounded-lg ${
                    isLatest
                      ? 'bg-primary/5 border-2 border-primary'
                      : 'bg-muted/30 border border-border'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h5
                        className={`font-semibold ${
                          isLatest ? 'text-primary' : ''
                        }`}
                      >
                        {event.description}
                      </h5>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(
                          new Date(event.timestamp),
                          'EEEE dd MMMM yyyy à HH:mm',
                          { locale: fr }
                        )}
                      </p>
                    </div>
                    {isLatest && (
                      <span className="px-2 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                        Actuel
                      </span>
                    )}
                  </div>

                  {event.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {event.location.city}
                        {event.location.state && `, ${event.location.state}`}
                        {event.location.country && `, ${event.location.country}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      {tracking.status === 'DELIVERED' && tracking.actual_delivery && (
        <div className="mt-6 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            <div>
              <p className="font-semibold text-green-900 dark:text-green-100">
                Colis livré avec succès
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                Livré le{' '}
                {format(new Date(tracking.actual_delivery), 'dd MMMM yyyy à HH:mm', {
                  locale: fr,
                })}
              </p>
            </div>
          </div>
        </div>
      )}

      {tracking.estimated_delivery && tracking.status !== 'DELIVERED' && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center gap-3">
            <Truck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="font-semibold text-blue-900 dark:text-blue-100">
                Livraison estimée
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {format(new Date(tracking.estimated_delivery), 'dd MMMM yyyy', {
                  locale: fr,
                })}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

