/**
 * Dashboard vendeur — packages / extras / brief pour prestations projet
 */

import { useState, useEffect } from 'react';
import { AppPageShell } from '@/components/layout/AppPageShell';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ServiceProjectOfferEditor } from '@/components/service/ServiceProjectOfferEditor';
import { useStore } from '@/hooks/useStore';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type ServiceOption = {
  productId: string;
  serviceProductId: string;
  name: string;
  fulfillment_mode: string;
};

export default function ServiceProjectOffersPage() {
  const { store, isLoading: storeLoading } = useStore();
  const [selectedId, setSelectedId] = useState<string>('');

  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: ['store-service-products-project-offers', store?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, service_products(id, fulfillment_mode)')
        .eq('store_id', store!.id)
        .eq('product_type', 'service')
        .order('name');

      if (error) throw error;

      return (data ?? [])
        .map(row => {
          const sp = Array.isArray(row.service_products)
            ? row.service_products[0]
            : row.service_products;
          if (!sp?.id) return null;
          return {
            productId: row.id as string,
            serviceProductId: sp.id as string,
            name: row.name as string,
            fulfillment_mode:
              (sp as { fulfillment_mode?: string }).fulfillment_mode || 'appointment',
          };
        })
        .filter((row): row is ServiceOption => Boolean(row));
    },
    enabled: Boolean(store?.id),
  });

  const projectServices = services.filter(
    s => s.fulfillment_mode === 'project' || s.fulfillment_mode === 'both'
  );

  useEffect(() => {
    if (!selectedId && projectServices[0]) {
      setSelectedId(projectServices[0].serviceProductId);
    }
  }, [projectServices, selectedId]);

  const selected = projectServices.find(s => s.serviceProductId === selectedId);

  if (storeLoading || servicesLoading) {
    return (
      <AppPageShell>
        <div className="container mx-auto p-4 space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppPageShell>
    );
  }

  if (!store) {
    return (
      <AppPageShell>
        <div className="container mx-auto p-4 text-sm text-muted-foreground">
          Boutique introuvable.
        </div>
      </AppPageShell>
    );
  }

  return (
    <AppPageShell>
      <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <div>
            <h1 className="text-xl font-semibold sm:text-2xl">Offres projet</h1>
            <p className="text-sm text-muted-foreground">
              Packages, extras et brief pour les services en mode projet
            </p>
          </div>
        </div>

        {projectServices.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun service en mode « projet » ou « les deux ». Modifiez le mode de prestation dans
            l&apos;édition du service.
          </p>
        ) : (
          <>
            <div className="space-y-2 max-w-md">
              <Label>Service</Label>
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="Choisir un service" />
                </SelectTrigger>
                <SelectContent>
                  {projectServices.map(s => (
                    <SelectItem key={s.serviceProductId} value={s.serviceProductId}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selected && (
              <ServiceProjectOfferEditor
                serviceProductId={selected.serviceProductId}
                productId={selected.productId}
                storeId={store.id}
              />
            )}
          </>
        )}
      </div>
    </AppPageShell>
  );
}
