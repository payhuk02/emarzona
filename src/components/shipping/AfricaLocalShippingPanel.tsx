/**
 * Configuration transporteur local Afrique — forfaits par zone (Epic 3.2.8)
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Globe, Loader2, MapPin, Truck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useStorePhysicalPlanLimits } from '@/hooks/billing/useStorePhysicalPlanLimits';

interface AfricaLocalShippingPanelProps {
  storeId: string;
}

export function AfricaLocalShippingPanel({ storeId }: AfricaLocalShippingPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: planLimits } = useStorePhysicalPlanLimits(storeId);

  const hasAccess = planLimits?.features?.['shipping.local_africa'] === true;

  const { data: africaZones = [] } = useQuery({
    queryKey: ['africa-shipping-zones', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipping_zones')
        .select('id, name, countries, is_active, zone_type')
        .eq('store_id', storeId)
        .eq('zone_type', 'local_africa');

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!storeId && hasAccess,
  });

  const seedZones = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('seed_africa_local_shipping_zones', {
        p_store_id: storeId,
      });
      if (error) throw error;
      return data as { zones_created: number; rates_created: number; success: boolean };
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['africa-shipping-zones'] });
      queryClient.invalidateQueries({ queryKey: ['shipping-zones'] });
      queryClient.invalidateQueries({ queryKey: ['shipping-rates'] });
      toast({
        title: 'Zones Afrique configurées',
        description: `${data.zones_created} zone(s) et ${data.rates_created} tarif(s) forfait créés`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Configuration impossible',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  if (!hasAccess) {
    return (
      <Alert>
        <Truck className="h-4 w-4" />
        <AlertDescription>
          Les zones forfait Afrique sont disponibles à partir du plan <strong>Professional</strong>.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-green-600" />
          Transporteur local Afrique (phase 1)
        </CardTitle>
        <CardDescription>
          Créez des zones forfait UEMOA, Afrique de l&apos;Ouest et Afrique centrale avec tarifs
          fixes et délais estimés.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {africaZones.length > 0 ? (
          <div className="space-y-2">
            {africaZones.map(zone => (
              <div
                key={zone.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{zone.name}</span>
                </div>
                <Badge variant={zone.is_active ? 'default' : 'secondary'}>
                  {zone.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Aucune zone forfait Afrique. Lancez la configuration pour créer 3 zones prêtes à
            l&apos;emploi.
          </p>
        )}

        <Button onClick={() => seedZones.mutate()} disabled={seedZones.isPending}>
          {seedZones.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Configuration...
            </>
          ) : africaZones.length > 0 ? (
            'Compléter les zones manquantes'
          ) : (
            'Configurer les zones forfait Afrique'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
