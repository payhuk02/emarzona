/**
 * Estimation livraison sur fiche produit physique (Epic 3.2.4)
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Truck, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeliveryEstimate {
  estimated_days_min: number;
  estimated_days_max: number;
  source: 'store_rates' | 'default';
}

interface PhysicalProductDeliveryEstimateProps {
  productId: string;
  className?: string;
}

export function PhysicalProductDeliveryEstimate({
  productId,
  className,
}: PhysicalProductDeliveryEstimateProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['product-delivery-estimate', productId],
    queryFn: async (): Promise<DeliveryEstimate> => {
      const { data: rpcData, error } = await supabase.rpc('get_product_delivery_estimate', {
        p_product_id: productId,
      });

      if (error) throw error;

      const payload = rpcData as DeliveryEstimate | null;
      return (
        payload ?? {
          estimated_days_min: 3,
          estimated_days_max: 7,
          source: 'default',
        }
      );
    },
    enabled: !!productId,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return <Skeleton className={cn('h-20 w-full', className)} />;
  }

  if (!data) return null;

  const label =
    data.estimated_days_min === data.estimated_days_max
      ? `${data.estimated_days_min} jour${data.estimated_days_min > 1 ? 's' : ''}`
      : `${data.estimated_days_min} à ${data.estimated_days_max} jours`;

  return (
    <Card className={cn('border-dashed', className)}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-primary/10 p-2">
            <Truck className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">Livraison estimée</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{label} ouvrés après expédition</span>
            </div>
            {data.source === 'default' && (
              <p className="text-xs text-muted-foreground">
                Estimation standard — le délai exact dépend de votre zone.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
