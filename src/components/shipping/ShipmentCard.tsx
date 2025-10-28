/**
 * Shipment Card Component
 * Date: 28 octobre 2025
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  MapPin,
  Calendar,
  ExternalLink,
  Printer,
  RefreshCw,
  Eye,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { TrackingTimeline } from './TrackingTimeline';
import { usePrintLabel, useCancelShipment } from '@/hooks/shipping/useFedexShipping';

interface ShipmentCardProps {
  shipment: any;
  onRefresh?: () => void;
}

const statusConfig: Record<string, { label: string; color: string; variant: any }> = {
  pending: { label: 'En attente', color: 'bg-gray-500', variant: 'secondary' },
  label_created: { label: 'Étiquette créée', color: 'bg-blue-500', variant: 'default' },
  picked_up: { label: 'Ramassé', color: 'bg-purple-500', variant: 'default' },
  in_transit: { label: 'En transit', color: 'bg-indigo-500', variant: 'default' },
  out_for_delivery: { label: 'En livraison', color: 'bg-yellow-500', variant: 'default' },
  delivered: { label: 'Livré', color: 'bg-green-500', variant: 'default' },
  failed: { label: 'Échec', color: 'bg-red-500', variant: 'destructive' },
  returned: { label: 'Retourné', color: 'bg-orange-500', variant: 'destructive' },
  cancelled: { label: 'Annulé', color: 'bg-gray-500', variant: 'destructive' },
};

export function ShipmentCard({ shipment, onRefresh }: ShipmentCardProps) {
  const [showTimeline, setShowTimeline] = useState(false);
  const printLabel = usePrintLabel();
  const cancelShipment = useCancelShipment();

  const status = statusConfig[shipment.status] || statusConfig.pending;

  const handlePrintLabel = async () => {
    if (shipment.labels && shipment.labels.length > 0) {
      await printLabel.mutateAsync(shipment.labels[0].id);
    }
  };

  const handleCancel = async () => {
    if (confirm('Êtes-vous sûr de vouloir annuler cette expédition ?')) {
      await cancelShipment.mutateAsync(shipment.id);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg ${status.color} bg-opacity-10`}>
                <Package className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg">
                    {shipment.tracking_number}
                  </h3>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Commande #{shipment.order?.order_number || 'N/A'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {shipment.service_type || 'FedEx Ground'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {shipment.tracking_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(shipment.tracking_url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Suivre
                </Button>
              )}
              {shipment.labels && shipment.labels.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrintLabel}
                  disabled={printLabel.isPending}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Étiquette
                </Button>
              )}
              {onRefresh && (
                <Button variant="ghost" size="sm" onClick={onRefresh}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Origine</p>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">
                    {shipment.ship_from?.name || 'N/A'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {shipment.ship_from?.city}, {shipment.ship_from?.country}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1">Destination</p>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-green-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">
                    {shipment.ship_to?.name || 'N/A'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {shipment.ship_to?.city}, {shipment.ship_to?.country}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1">Livraison estimée</p>
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-purple-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">
                    {shipment.estimated_delivery
                      ? format(new Date(shipment.estimated_delivery), 'dd MMM yyyy', {
                          locale: fr,
                        })
                      : 'N/A'}
                  </p>
                  {shipment.actual_delivery && (
                    <p className="text-xs text-green-600">
                      Livré le{' '}
                      {format(new Date(shipment.actual_delivery), 'dd MMM yyyy', {
                        locale: fr,
                      })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Weight & Cost */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground border-t pt-4">
            <span>Poids: {shipment.weight_value} kg</span>
            <span>•</span>
            <span>
              Coût: {shipment.shipping_cost?.toLocaleString()} {shipment.currency}
            </span>
            <span>•</span>
            <span>
              Créé le{' '}
              {format(new Date(shipment.created_at), 'dd MMM yyyy à HH:mm', {
                locale: fr,
              })}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between border-t pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTimeline(!showTimeline)}
            >
              <Eye className="h-4 w-4 mr-2" />
              {showTimeline ? 'Masquer' : 'Voir'} le suivi détaillé
            </Button>

            {!['delivered', 'cancelled'].includes(shipment.status) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={cancelShipment.isPending}
                className="text-red-600 hover:text-red-700"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Annuler l'expédition
              </Button>
            )}
          </div>

          {/* Timeline */}
          {showTimeline && (
            <div className="border-t pt-4">
              <TrackingTimeline trackingNumber={shipment.tracking_number} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

