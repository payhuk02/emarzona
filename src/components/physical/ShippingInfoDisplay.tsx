/**
 * Shipping Info Display Component
 * Date: 28 octobre 2025
 * 
 * Affichage des informations de livraison
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Truck,
  Package,
  MapPin,
  Clock,
  DollarSign,
  Weight,
  Ruler,
  CheckCircle2,
} from 'lucide-react';
import type { ShippingCalculation } from '@/hooks/physical/useShipping';

interface ShippingInfoDisplayProps {
  weight?: number;
  weightUnit?: string;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    unit?: string;
  };
  freeShipping?: boolean;
  shippingClass?: string;
}

export const ShippingInfoDisplay = ({
  weight,
  weightUnit = 'kg',
  dimensions,
  freeShipping = false,
  shippingClass,
}: ShippingInfoDisplayProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Informations de livraison
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Free Shipping Badge */}
        {freeShipping && (
          <Badge variant="default" className="gap-1 bg-green-600">
            <CheckCircle2 className="h-3 w-3" />
            Livraison gratuite
          </Badge>
        )}

        {/* Weight */}
        {weight && (
          <div className="flex items-center gap-2">
            <Weight className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Poids:</span>
            <span className="text-sm">
              {weight} {weightUnit}
            </span>
          </div>
        )}

        {/* Dimensions */}
        {dimensions && (dimensions.length || dimensions.width || dimensions.height) && (
          <div className="flex items-center gap-2">
            <Ruler className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Dimensions:</span>
            <span className="text-sm">
              {dimensions.length} × {dimensions.width} × {dimensions.height}{' '}
              {dimensions.unit}
            </span>
          </div>
        )}

        {/* Shipping Class */}
        {shippingClass && (
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Classe:</span>
            <Badge variant="outline">{shippingClass}</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Shipping Rates Display
 */
interface ShippingRatesDisplayProps {
  calculations: ShippingCalculation[];
  selectedRateId?: string;
  onSelectRate?: (calculation: ShippingCalculation) => void;
}

export const ShippingRatesDisplay = ({
  calculations,
  selectedRateId,
  onSelectRate,
}: ShippingRatesDisplayProps) => {
  if (!calculations || calculations.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Truck className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Aucune option de livraison disponible
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {calculations.map((calc) => {
        const isSelected = selectedRateId === calc.rate.id;

        return (
          <Card
            key={calc.rate.id}
            className={`cursor-pointer transition-all ${
              isSelected ? 'border-primary shadow-md' : 'hover:border-primary/50'
            }`}
            onClick={() => onSelectRate?.(calc)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold">{calc.rate.name}</h4>
                    {calc.rate.rate_type === 'free' && (
                      <Badge variant="default" className="bg-green-600">
                        Gratuit
                      </Badge>
                    )}
                  </div>

                  {calc.rate.description && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {calc.rate.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm">
                    {/* Delivery Time */}
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        {calc.estimated_delivery.min_days}-
                        {calc.estimated_delivery.max_days} jours
                      </span>
                    </div>

                    {/* Zone */}
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{calc.zone.name}</span>
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div className="text-right">
                  <div className="flex items-center gap-1 text-xl font-bold text-primary">
                    {calc.calculated_price === 0 ? (
                      <span className="text-green-600">Gratuit</span>
                    ) : (
                      <>
                        <DollarSign className="h-4 w-4" />
                        {calc.calculated_price.toLocaleString()} XOF
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

/**
 * Shipping Zone Badge
 */
interface ShippingZoneBadgeProps {
  zone: {
    name: string;
    countries: string[];
    is_active: boolean;
  };
}

export const ShippingZoneBadge = ({ zone }: ShippingZoneBadgeProps) => {
  return (
    <Badge variant={zone.is_active ? 'default' : 'secondary'} className="gap-1">
      <MapPin className="h-3 w-3" />
      {zone.name}
      {zone.countries.length > 0 && (
        <span className="text-xs opacity-75">({zone.countries.length} pays)</span>
      )}
    </Badge>
  );
};

/**
 * Shipping Summary
 */
interface ShippingSummaryProps {
  subtotal: number;
  shippingCost: number;
  shippingMethod?: string;
  estimatedDelivery?: string;
  total: number;
}

export const ShippingSummary = ({
  subtotal,
  shippingCost,
  shippingMethod,
  estimatedDelivery,
  total,
}: ShippingSummaryProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Récapitulatif</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Sous-total</span>
          <span className="font-medium">{subtotal.toLocaleString()} XOF</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Livraison</span>
          <span className="font-medium">
            {shippingCost === 0 ? (
              <span className="text-green-600">Gratuit</span>
            ) : (
              `${shippingCost.toLocaleString()} XOF`
            )}
          </span>
        </div>

        {shippingMethod && (
          <div className="text-xs text-muted-foreground">{shippingMethod}</div>
        )}

        {estimatedDelivery && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Livraison estimée: {estimatedDelivery}</span>
          </div>
        )}

        <Separator />

        <div className="flex justify-between text-lg font-bold">
          <span>Total</span>
          <span className="text-primary">{total.toLocaleString()} XOF</span>
        </div>
      </CardContent>
    </Card>
  );
};

