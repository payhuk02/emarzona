/**
 * Vue de traçabilité complète d'un numéro de série
 * Date: 28 Janvier 2025
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// Timeline component not available, using custom layout instead
import { Badge } from '@/components/ui/badge';
import { useSerialTraceability, useSerialNumber } from '@/hooks/physical/useSerialTracking';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { RefreshCw, Package, Truck, User, AlertCircle } from '@/components/icons';

interface SerialTraceabilityViewProps {
  serialNumberId: string;
}

export function SerialTraceabilityView({ serialNumberId }: SerialTraceabilityViewProps) {
  const { data: serial } = useSerialNumber(serialNumberId);
  const { data: traceability, isLoading } = useSerialTraceability(serialNumberId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'manufactured':
        return <Package className="h-4 w-4" />;
      case 'sold':
      case 'shipped':
      case 'delivered':
        return <Truck className="h-4 w-4" />;
      case 'warranty_claim':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'manufactured':
        return 'bg-blue-500';
      case 'sold':
        return 'bg-green-500';
      case 'delivered':
        return 'bg-purple-500';
      case 'warranty_claim':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {serial && (
        <Card>
          <CardHeader>
            <CardTitle>Informations du Numéro de Série</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-sm text-muted-foreground">Numéro de Série</div>
                <div className="font-mono font-bold text-lg">{serial.serial_number}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Statut Actuel</div>
                <div className="font-medium">{serial.status}</div>
              </div>
              {serial.imei && (
                <div>
                  <div className="text-sm text-muted-foreground">IMEI</div>
                  <div className="font-mono">{serial.imei}</div>
                </div>
              )}
              {serial.warranty_end_date && (
                <div>
                  <div className="text-sm text-muted-foreground">Garantie jusqu'au</div>
                  <div>{format(new Date(serial.warranty_end_date), 'dd MMM yyyy', { locale: fr })}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Historique de Traçabilité</CardTitle>
        </CardHeader>
        <CardContent>
          {!traceability || traceability.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucun historique disponible</p>
            </div>
          ) : (
            <div className="space-y-4">
              {traceability.map((event, index) => (
                <div key={index} className="flex gap-4 pb-4 border-b last:border-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${getEventColor(event.event_type)}`}>
                    {getEventIcon(event.event_type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-medium capitalize">{event.event_type.replace('_', ' ')}</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(event.event_date), 'dd MMM yyyy HH:mm', { locale: fr })}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">{event.description}</div>
                    {event.location && (
                      <div className="text-xs text-muted-foreground">📍 {event.location}</div>
                    )}
                    {event.customer_name && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {event.customer_name}
                      </div>
                    )}
                    {event.order_number && (
                      <div className="text-xs text-muted-foreground">Commande: {event.order_number}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

