/**
 * Dashboard vendeur — produits complémentaires service (Phase 4).
 */

import { AppPageShell } from '@/components/layout/AppPageShell';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { ServiceProductAddonsManager } from '@/components/service/ServiceProductAddonsManager';
import { useStore } from '@/hooks/useStore';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function ServiceAddonsPage() {
  const { store, isLoading: storeLoading } = useStore();

  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: ['store-service-products-for-addons', store?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, service_products(id)')
        .eq('store_id', store!.id)
        .eq('product_type', 'service')
        .eq('is_active', true)
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
          };
        })
        .filter((row): row is { productId: string; serviceProductId: string; name: string } =>
          Boolean(row)
        );
    },
    enabled: Boolean(store?.id),
  });

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
          <h1 className="text-xl font-semibold sm:text-2xl">Compléments service</h1>
        </div>
        <ServiceProductAddonsManager storeId={store.id} services={services} />
      </div>
    </AppPageShell>
  );
}
