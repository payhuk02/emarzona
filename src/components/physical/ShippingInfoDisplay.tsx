import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Truck, 
  Package, 
  MapPin, 
  Calendar,
  Clock,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  PackageCheck,
  PackageX,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// ============================================================================
// TYPES
// ============================================================================

export type ShippingStatus = 
  | 'pending' 
  | 'processing' 
  | 'shipped' 
  | 'in_transit' 
  | 'out_for_delivery'
  | 'delivered' 
  | 'failed'
  | 'returned';

export interface ShippingInfo {
  status: ShippingStatus;
  trackingNumber?: string;
  carrier?: string;
  shippingMethod?: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  shippingCost?: number;
  currency?: string;
  weight?: number;
  weightUnit?: string;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: string;
  };
  originAddress?: {
    city: string;
    country: string;
  };
  destinationAddress?: {
    street?: string;
    city: string;
    postalCode?: string;
    country: string;
  };
  trackingUrl?: string;
  notes?: string;
}

export interface ShippingInfoDisplayProps {
  shipping: ShippingInfo;
  variant?: 'default' | 'compact' | 'detailed';
  showTracking?: boolean;
  showTimeline?: boolean;
  className?: string;
}

// ============================================================================
// UTILS
// ============================================================================

function getStatusConfig(status: ShippingStatus) {
  const configs = {
    pending: {
      label: 'En attente',
      color: 'text-gray-600 bg-gray-50 border-gray-200',
      icon: Clock,
      badgeVariant: 'secondary' as const,
    },
    processing: {
      label: 'En préparation',
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      icon: Package,
      badgeVariant: 'default' as const,
    },
    shipped: {
      label: 'Expédié',
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      icon: Truck,
      badgeVariant: 'default' as const,
    },
    in_transit: {
      label: 'En transit',
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      icon: Truck,
      badgeVariant: 'default' as const,
    },
    out_for_delivery: {
      label: 'En cours de livraison',
      color: 'text-orange-600 bg-orange-50 border-orange-200',
      icon: PackageCheck,
      badgeVariant: 'default' as const,
    },
    delivered: {
      label: 'Livré',
      color: 'text-green-600 bg-green-50 border-green-200',
      icon: CheckCircle2,
      badgeVariant: 'default' as const,
    },
    failed: {
      label: 'Échec de livraison',
      color: 'text-red-600 bg-red-50 border-red-200',
      icon: AlertCircle,
      badgeVariant: 'destructive' as const,
    },
    returned: {
      label: 'Retourné',
      color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      icon: PackageX,
      badgeVariant: 'secondary' as const,
    },
  };

  return configs[status];
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ShippingInfoDisplay({
  shipping,
  variant = 'default',
  showTracking = true,
  showTimeline = false,
  className,
}: ShippingInfoDisplayProps) {
  const config = getStatusConfig(shipping.status);
  const Icon = config.icon;

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className={cn('inline-flex items-center gap-2', className)}>
        <Badge variant={config.badgeVariant} className="gap-1">
          <Icon className="h-3 w-3" />
          {config.label}
        </Badge>
        {shipping.trackingNumber && (
          <span className="text-xs text-muted-foreground font-mono">
            {shipping.trackingNumber}
          </span>
        )}
      </div>
    );
  }

  // Detailed variant
  if (variant === 'detailed') {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Informations d'expédition</CardTitle>
            <Badge variant={config.badgeVariant} className="gap-1">
              <Icon className="h-3 w-3" />
              {config.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tracking & Carrier */}
          {(shipping.trackingNumber || shipping.carrier) && (
            <div className="space-y-2">
              {shipping.trackingNumber && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Numéro de suivi</span>
                  <span className="text-sm font-mono font-medium">
                    {shipping.trackingNumber}
                  </span>
                </div>
              )}
              {shipping.carrier && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Transporteur</span>
                  <span className="text-sm font-medium">{shipping.carrier}</span>
                </div>
              )}
              {shipping.shippingMethod && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Méthode</span>
                  <span className="text-sm font-medium">{shipping.shippingMethod}</span>
                </div>
              )}
            </div>
          )}

          <Separator />

          {/* Delivery Dates */}
          <div className="space-y-2">
            {shipping.estimatedDelivery && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Livraison estimée</p>
                  <p className="text-sm font-medium">
                    {format(new Date(shipping.estimatedDelivery), 'PPP', { locale: fr })}
                  </p>
                </div>
              </div>
            )}
            {shipping.actualDelivery && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Livré le</p>
                  <p className="text-sm font-medium text-green-600">
                    {format(new Date(shipping.actualDelivery), 'PPP', { locale: fr })}
                  </p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Package Details */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Détails du colis</h4>
            {shipping.weight && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Poids</span>
                <span className="font-medium">
                  {shipping.weight} {shipping.weightUnit || 'kg'}
                </span>
              </div>
            )}
            {shipping.dimensions && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Dimensions</span>
                <span className="font-medium">
                  {shipping.dimensions.length} × {shipping.dimensions.width} × {shipping.dimensions.height} {shipping.dimensions.unit}
                </span>
              </div>
            )}
            {shipping.shippingCost !== undefined && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Frais d'expédition</span>
                <span className="font-medium">
                  {shipping.shippingCost} {shipping.currency || 'XOF'}
                </span>
              </div>
            )}
          </div>

          {/* Addresses */}
          {(shipping.originAddress || shipping.destinationAddress) && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Adresses</h4>
                {shipping.originAddress && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Origine</p>
                      <p className="text-sm">
                        {shipping.originAddress.city}, {shipping.originAddress.country}
                      </p>
                    </div>
                  </div>
                )}
                {shipping.destinationAddress && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Destination</p>
                      <p className="text-sm">
                        {shipping.destinationAddress.street && `${shipping.destinationAddress.street}, `}
                        {shipping.destinationAddress.city}
                        {shipping.destinationAddress.postalCode && ` ${shipping.destinationAddress.postalCode}`}
                        <br />
                        {shipping.destinationAddress.country}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Tracking Button */}
          {showTracking && shipping.trackingUrl && (
            <>
              <Separator />
              <Button 
                variant="outline" 
                className="w-full gap-2"
                onClick={() => window.open(shipping.trackingUrl, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
                Suivre le colis
              </Button>
            </>
          )}

          {/* Notes */}
          {shipping.notes && (
            <>
              <Separator />
              <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
                <p className="font-semibold mb-1">Note :</p>
                <p>{shipping.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <div className={cn('space-y-3', className)}>
      {/* Status Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn('h-5 w-5', config.iconColor)} />
          <div>
            <p className="text-sm font-semibold">{config.label}</p>
            {shipping.carrier && (
              <p className="text-xs text-muted-foreground">{shipping.carrier}</p>
            )}
          </div>
        </div>
        {shipping.trackingNumber && showTracking && shipping.trackingUrl && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => window.open(shipping.trackingUrl, '_blank')}
            className="gap-1"
          >
            <ExternalLink className="h-3 w-3" />
            Suivre
          </Button>
        )}
      </div>

      {/* Tracking Number */}
      {shipping.trackingNumber && (
        <div className="flex items-center gap-2 text-sm">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Suivi :</span>
          <span className="font-mono font-medium">{shipping.trackingNumber}</span>
        </div>
      )}

      {/* Delivery Estimate */}
      {shipping.estimatedDelivery && !shipping.actualDelivery && (
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Livraison estimée :</span>
          <span className="font-medium">
            {format(new Date(shipping.estimatedDelivery), 'PPP', { locale: fr })}
          </span>
        </div>
      )}

      {/* Actual Delivery */}
      {shipping.actualDelivery && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          <span>Livré le</span>
          <span className="font-medium">
            {format(new Date(shipping.actualDelivery), 'PPP', { locale: fr })}
          </span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// VARIANT SHORTCUTS
// ============================================================================

export function CompactShippingInfo(props: Omit<ShippingInfoDisplayProps, 'variant'>) {
  return <ShippingInfoDisplay {...props} variant="compact" />;
}

export function DetailedShippingInfo(props: Omit<ShippingInfoDisplayProps, 'variant'>) {
  return <ShippingInfoDisplay {...props} variant="detailed" />;
}

// ============================================================================
// SHIPPING STATUS BADGE
// ============================================================================

export interface ShippingStatusBadgeProps {
  status: ShippingStatus;
  className?: string;
}

export function ShippingStatusBadge({ status, className }: ShippingStatusBadgeProps) {
  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge variant={config.badgeVariant} className={cn('gap-1', className)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
