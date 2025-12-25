/**
 * Carrier Shipping Options Component
 * Date: 28 Janvier 2025
 * 
 * Composant pour afficher et sélectionner les options de livraison
 * avec calcul temps réel via APIs transporteurs (DHL, FedEx, UPS)
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Truck,
  Clock,
  Package,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Zap,
} from '@/components/icons';
import { useShippingCarriers, useCalculateCarrierRates } from '@/hooks/physical/useShippingCarriers';
import { useStore } from '@/hooks/useStore';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CarrierShippingOptionsProps {
  from: {
    country: string;
    postalCode: string;
    city?: string;
  };
  to: {
    country: string;
    postalCode: string;
    city?: string;
  };
  weight: number; // en kg
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  selectedCarrierId?: string;
  selectedServiceType?: string;
  onSelect: (carrierId: string, serviceType: string, rate: any) => void;
  className?: string;
}

interface CarrierRate {
  carrierId: string;
  carrierName: string;
  displayName: string;
  rates: Array<{
    serviceType: string;
    serviceName: string;
    totalPrice: number;
    currency: string;
    estimatedDeliveryDays: number;
    estimatedDeliveryDate?: string;
  }>;
  isLoading: boolean;
  error?: string;
}

export const CarrierShippingOptions = ({
  from,
  to,
  weight,
  dimensions,
  selectedCarrierId,
  selectedServiceType,
  onSelect,
  className,
}: CarrierShippingOptionsProps) => {
  const { store } = useStore();
  const { data: carriers = [], isLoading: isLoadingCarriers } = useShippingCarriers(store?.id);
  const calculateRates = useCalculateCarrierRates();

  const [carrierRates, setCarrierRates] = useState<CarrierRate[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationErrors, setCalculationErrors] = useState<Record<string, string>>({});

  // Calculer les tarifs pour tous les transporteurs actifs
  useEffect(() => {
    if (!carriers.length || !from.postalCode || !to.postalCode) return;

    const calculateAllRates = async () => {
      setIsCalculating(true);
      setCalculationErrors({});

      const ratesPromises = carriers.map(async (carrier) => {
        try {
          const rates = await calculateRates.mutateAsync({
            carrierId: carrier.id,
            from: {
              country: from.country,
              postalCode: from.postalCode,
            },
            to: {
              country: to.country,
              postalCode: to.postalCode,
            },
            weight,
            dimensions,
          });

          return {
            carrierId: carrier.id,
            carrierName: carrier.carrier_name,
            displayName: carrier.display_name,
            rates: rates || [],
            isLoading: false,
          } as CarrierRate;
        } catch (error: any) {
          logger.error(`Error calculating rates for ${carrier.display_name}`, { error, carrierId: carrier.id });
          return {
            carrierId: carrier.id,
            carrierName: carrier.carrier_name,
            displayName: carrier.display_name,
            rates: [],
            isLoading: false,
            error: error.message || 'Erreur lors du calcul des tarifs',
          } as CarrierRate;
        }
      });

      const results = await Promise.all(ratesPromises);
      setCarrierRates(results);
      setIsCalculating(false);
    };

    calculateAllRates();
  }, [carriers, from.postalCode, to.postalCode, weight, dimensions]);

  const handleSelectRate = (carrierId: string, serviceType: string, rate: any) => {
    onSelect(carrierId, serviceType, rate);
  };

  const formatPrice = (price: number, currency: string = 'XOF') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price / 100); // Convertir centimes en unités
  };

  const formatDeliveryDate = (days: number) => {
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + days);
    return format(deliveryDate, 'EEEE d MMMM', { locale: fr });
  };

  if (isLoadingCarriers) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Options de livraison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!carriers.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Options de livraison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Aucun transporteur configuré. Veuillez configurer au moins un transporteur dans les paramètres.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const allRates = carrierRates.flatMap((carrier) =>
    carrier.rates.map((rate) => ({
      ...rate,
      carrierId: carrier.carrierId,
      carrierName: carrier.carrierName,
      displayName: carrier.displayName,
    }))
  );

  // Trier par prix (croissant)
  allRates.sort((a, b) => a.totalPrice - b.totalPrice);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Options de livraison
        </CardTitle>
        <CardDescription>
          {isCalculating ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Calcul des tarifs en cours...
            </span>
          ) : (
            `${allRates.length} option${allRates.length > 1 ? 's' : ''} disponible${allRates.length > 1 ? 's' : ''}`
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isCalculating ? (
          <div className="space-y-4">
            {carriers.map((carrier) => (
              <Skeleton key={carrier.id} className="h-24 w-full" />
            ))}
          </div>
        ) : (
          <RadioGroup
            value={selectedCarrierId && selectedServiceType ? `${selectedCarrierId}-${selectedServiceType}` : undefined}
            onValueChange={(value) => {
              const [carrierId, serviceType] = value.split('-');
              const rate = allRates.find(
                (r) => r.carrierId === carrierId && r.serviceType === serviceType
              );
              if (rate) {
                handleSelectRate(carrierId, serviceType, rate);
              }
            }}
            className="space-y-3"
          >
            {allRates.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Aucun tarif disponible pour cette destination. Veuillez vérifier l'adresse de livraison.
                </AlertDescription>
              </Alert>
            ) : (
              allRates.map((rate) => {
                const isSelected =
                  selectedCarrierId === rate.carrierId && selectedServiceType === rate.serviceType;
                const isFastest = rate.estimatedDeliveryDays <= 2;
                const isCheapest = rate === allRates[0];

                return (
                  <div key={`${rate.carrierId}-${rate.serviceType}`}>
                    <RadioGroupItem
                      value={`${rate.carrierId}-${rate.serviceType}`}
                      id={`rate-${rate.carrierId}-${rate.serviceType}`}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={`rate-${rate.carrierId}-${rate.serviceType}`}
                      className={cn(
                        'flex cursor-pointer items-center justify-between rounded-lg border-2 p-4 transition-all hover:bg-accent',
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-muted bg-card'
                      )}
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">{rate.displayName}</span>
                          <span className="text-sm text-muted-foreground">- {rate.serviceName}</span>
                          {isFastest && (
                            <Badge variant="secondary" className="gap-1">
                              <Zap className="h-3 w-3" />
                              Rapide
                            </Badge>
                          )}
                          {isCheapest && (
                            <Badge variant="secondary" className="gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Économique
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              {rate.estimatedDeliveryDays} jour{rate.estimatedDeliveryDays > 1 ? 's' : ''}
                            </span>
                            {rate.estimatedDeliveryDate && (
                              <span className="ml-1">
                                ({formatDeliveryDate(rate.estimatedDeliveryDays)})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <div className="text-lg font-bold">
                          {formatPrice(rate.totalPrice, rate.currency)}
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="ml-auto mt-1 h-5 w-5 text-primary" />
                        )}
                      </div>
                    </Label>
                  </div>
                );
              })
            )}
          </RadioGroup>
        )}

        {/* Erreurs de calcul */}
        {Object.keys(calculationErrors).length > 0 && (
          <div className="mt-4 space-y-2">
            {Object.entries(calculationErrors).map(([carrierId, error]) => {
              const carrier = carriers.find((c) => c.id === carrierId);
              return (
                <Alert key={carrierId} variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {carrier?.display_name}: {error}
                  </AlertDescription>
                </Alert>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

