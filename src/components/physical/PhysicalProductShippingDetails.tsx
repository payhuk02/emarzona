import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { Globe, MapPin, Truck, Plane, Package } from 'lucide-react';
import type { ShippingZone, ShippingRate } from '@/hooks/physical/useShipping';

interface ZoneWithRates extends ShippingZone {
  rates: ShippingRate[];
}

interface PhysicalProductShippingDetailsProps {
  storeId: string;
  countryOfOrigin?: string | null;
  currency?: string;
}

export function PhysicalProductShippingDetails({
  storeId,
  countryOfOrigin,
  currency = 'XOF',
}: PhysicalProductShippingDetailsProps) {
  const { data: zones, isLoading } = useQuery({
    queryKey: ['public-shipping-info', storeId],
    queryFn: async () => {
      // Fetch zones and their rates
      const { data, error } = await supabase
        .from('shipping_zones')
        .select(
          `
          *,
          rates:shipping_rates (*)
        `
        )
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (error) throw error;

      // Filtrer les rates inactifs
      const activeZones = (data as ZoneWithRates[])
        .map(zone => ({
          ...zone,
          rates: zone.rates.filter(rate => rate.is_active).sort((a, b) => b.priority - a.priority),
        }))
        .filter(zone => zone.rates.length > 0);

      return activeZones;
    },
    enabled: !!storeId,
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6 space-y-4">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!zones || zones.length === 0) {
    return null; // Si aucune livraison n'est configurée, on ne montre rien (ou on pourrait montrer un fallback)
  }

  return (
    <Card className="border shadow-sm overflow-hidden">
      <CardHeader className="bg-muted/30 pb-4 border-b">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded-full">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-lg">Livraison & Expédition</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Origine du produit */}
        <div className="flex items-start gap-3">
          <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium">Lieu d'expédition</p>
            <p className="text-sm text-muted-foreground">
              {countryOfOrigin
                ? `Expédié depuis : ${countryOfOrigin}`
                : 'Expédié par le vendeur local'}
            </p>
          </div>
        </div>

        {/* Zones et Tarifs */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-medium">Zones desservies</h4>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-2">
            {zones.map(zone => (
              <AccordionItem
                key={zone.id}
                value={zone.id}
                className="border rounded-lg bg-card px-4"
              >
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex flex-col items-start text-left">
                    <span className="font-medium text-sm">{zone.name}</span>
                    <span className="text-xs text-muted-foreground font-normal mt-0.5">
                      {zone.countries.length > 0
                        ? zone.countries.length <= 3
                          ? zone.countries.join(', ')
                          : `${zone.countries.length} pays inclus`
                        : 'Monde entier'}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-3">
                  <div className="space-y-3 mt-2">
                    {zone.rates.map(rate => (
                      <div
                        key={rate.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-muted/40 rounded-md border border-border/50"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {rate.estimated_days_max && rate.estimated_days_max <= 3 ? (
                              <Plane className="h-4 w-4 text-blue-500" />
                            ) : (
                              <Truck className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="font-medium text-sm">{rate.name}</span>
                            {rate.rate_type === 'free' && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] uppercase h-5 bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400"
                              >
                                Gratuit
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {rate.estimated_days_min && rate.estimated_days_max
                              ? `${rate.estimated_days_min} à ${rate.estimated_days_max} jours ouvrés`
                              : rate.description || 'Délai standard'}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="font-semibold text-sm">
                            {rate.rate_type === 'free'
                              ? 'Offert'
                              : `${rate.base_price.toLocaleString('fr-FR')} ${currency}`}
                          </span>
                          {rate.rate_type === 'weight_based' && rate.price_per_kg && (
                            <p className="text-[10px] text-muted-foreground">
                              + {rate.price_per_kg.toLocaleString('fr-FR')}
                              {currency}/kg
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </CardContent>
    </Card>
  );
}
