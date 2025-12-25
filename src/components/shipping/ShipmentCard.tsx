/**
 * Shipment Card Component
 * Date: 28 octobre 2025
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { AutomaticTrackingButton } from './AutomaticTrackingButton';
import type { Shipment } from '@/hooks/shipping/useFedexShipping';

interface ShipmentCardProps {
  shipment: Shipment;
  onRefresh?: () => void;
}

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

const getStatusConfig = (status: string, t: ReturnType<typeof useTranslation>['t']) => {
  const configs: Record<string, { labelKey: string; color: string; variant: BadgeVariant }> = {
    pending: { labelKey: 'shipping.status.pending', color: 'bg-gray-500', variant: 'secondary' },
    label_created: { labelKey: 'shipping.status.labelCreated', color: 'bg-blue-500', variant: 'default' },
    picked_up: { labelKey: 'shipping.status.pickedUp', color: 'bg-purple-500', variant: 'default' },
    in_transit: { labelKey: 'shipping.status.inTransit', color: 'bg-indigo-500', variant: 'default' },
    out_for_delivery: { labelKey: 'shipping.status.outForDelivery', color: 'bg-yellow-500', variant: 'default' },
    delivered: { labelKey: 'shipping.status.delivered', color: 'bg-green-500', variant: 'default' },
    failed: { labelKey: 'shipping.status.failed', color: 'bg-red-500', variant: 'destructive' },
    returned: { labelKey: 'shipping.status.returned', color: 'bg-orange-500', variant: 'destructive' },
    cancelled: { labelKey: 'shipping.status.cancelled', color: 'bg-gray-500', variant: 'destructive' },
  };

  const config = configs[status] || configs.pending;
  return {
    ...config,
    label: t(config.labelKey, { defaultValue: config.labelKey.split('.').pop() || '' }),
  };
};

const ShipmentCardComponent = ({ shipment, onRefresh }: ShipmentCardProps) => {
  const { t } = useTranslation();
  const [showTimeline, setShowTimeline] = useState(false);
  const printLabel = usePrintLabel();
  const cancelShipment = useCancelShipment();

  const status = getStatusConfig(shipment.status, t);

  const handlePrintLabel = async () => {
    if (shipment.labels && shipment.labels.length > 0) {
      await printLabel.mutateAsync(shipment.labels[0].id);
    }
  };

  const handleCancel = async () => {
    if (confirm(t('shipping.cancelShipmentConfirm', 'Êtes-vous sûr de vouloir annuler cette expédition ?'))) {
      await cancelShipment.mutateAsync(shipment.id);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow" style={{ willChange: 'transform' }}>
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
                  {t('orders.orderNumber', 'Commande')} #{shipment.order?.order_number || t('common.notAvailable', 'N/A')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {shipment.service_type || 'FedEx Ground'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <AutomaticTrackingButton shipmentId={shipment.id} />
              {shipment.tracking_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(shipment.tracking_url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {t('shipping.track', 'Suivre')}
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
                  {t('shipping.label', 'Étiquette')}
                </Button>
              )}
              {onRefresh && (
                <Button variant="ghost" size="sm" onClick={onRefresh} aria-label="Actualiser les informations d'expédition">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <p className="text-xs text-muted-foreground mb-1">{t('shipping.origin', 'Origine')}</p>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">
                    {shipment.ship_from?.name || t('common.notAvailable', 'N/A')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {shipment.ship_from?.city}, {shipment.ship_from?.country}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1">{t('shipping.destination', 'Destination')}</p>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-green-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">
                    {shipment.ship_to?.name || t('common.notAvailable', 'N/A')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {shipment.ship_to?.city}, {shipment.ship_to?.country}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1">{t('shipping.estimatedDelivery', 'Livraison estimée')}</p>
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-purple-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">
                    {shipment.estimated_delivery
                      ? format(new Date(shipment.estimated_delivery), 'dd MMM yyyy', {
                          locale: fr,
                        })
                      : t('common.notAvailable', 'N/A')}
                  </p>
                  {shipment.actual_delivery && (
                    <p className="text-xs text-green-600">
                      {t('shipping.deliveredOn', 'Livré le')}{' '}
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
            <span>{t('shipping.weight', 'Poids')}: {shipment.weight_value} kg</span>
            <span>•</span>
            <span>
              {t('shipping.cost', 'Coût')}: {shipment.shipping_cost?.toLocaleString()} {shipment.currency}
            </span>
            <span>•</span>
            <span>
              {t('shipping.createdOn', 'Créé le')}{' '}
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
              {showTimeline ? t('common.hide', 'Masquer') : t('common.view', 'Voir')} {t('shipping.detailedTracking', 'le suivi détaillé')}
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
                {t('shipping.cancelShipment', 'Annuler l\'expédition')}
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
};

// Optimisation avec React.memo pour éviter les re-renders inutiles
export const ShipmentCard = React.memo(ShipmentCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.shipment.id === nextProps.shipment.id &&
    prevProps.shipment.status === nextProps.shipment.status &&
    prevProps.shipment.tracking_number === nextProps.shipment.tracking_number &&
    prevProps.onRefresh === nextProps.onRefresh
  );
});

ShipmentCard.displayName = 'ShipmentCard';

