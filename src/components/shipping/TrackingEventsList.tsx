/**
 * Composant pour Afficher la Liste des Événements de Tracking
 * Date: 31 Janvier 2025
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { TrackingStatusBadge } from './TrackingStatusBadge';
import { MapPin, Clock } from 'lucide-react';

interface TrackingEventsListProps {
  shipmentId: string;
}

export function TrackingEventsList({ shipmentId }: TrackingEventsListProps) {
  const { data: events, isLoading } = useQuery({
    queryKey: ['tracking-events', shipmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipping_tracking_events')
        .select('*')
        .eq('shipment_id', shipmentId)
        .order('event_timestamp', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!shipmentId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historique de tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!events || events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historique de tracking</CardTitle>
          <CardDescription>Aucun événement de tracking disponible</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historique de tracking</CardTitle>
        <CardDescription>{events.length} événement(s) enregistré(s)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events.map((event, index) => (
            <div
              key={event.id}
              className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <TrackingStatusBadge 
                    status={event.event_type as any} 
                    showIcon={false}
                  />
                  {event.location && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {event.location.city && `${event.location.city}, `}
                      {event.location.country}
                    </div>
                  )}
                </div>
                <p className="text-sm text-foreground mb-1">{event.description}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {format(new Date(event.event_timestamp), 'PPpp', { locale: fr })}
                </div>
                {event.event_code && (
                  <Badge variant="outline" className="mt-2 text-xs">
                    Code: {event.event_code}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}







