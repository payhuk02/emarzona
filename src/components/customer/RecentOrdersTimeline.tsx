/**
 * Epic 3.6.2 — Dernières commandes actives avec timeline (portail client)
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, ArrowRight } from 'lucide-react';
import { buildOrderTimeline } from '@/lib/customer/order-timeline';
import { OrderTimeline } from '@/components/customer/OrderTimeline';

interface RecentOrder {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  created_at: string;
  items: { product_type: string }[];
}

interface RecentOrdersTimelineProps {
  userId: string;
  onViewAll?: () => void;
  limit?: number;
}

export function RecentOrdersTimeline({ userId, onViewAll, limit = 3 }: RecentOrdersTimelineProps) {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['customer-recent-orders-timeline', userId, limit],
    queryFn: async (): Promise<RecentOrder[]> => {
      const { data: orderRows, error } = await supabase
        .from('orders')
        .select('id, order_number, status, payment_status, created_at')
        .eq('customer_id', userId)
        .not('status', 'eq', 'completed')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      if (!orderRows?.length) return [];

      const orderIds = orderRows.map(o => o.id);
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('order_id, product_type')
        .in('order_id', orderIds);

      if (itemsError) throw itemsError;

      return orderRows.map(order => ({
        ...order,
        items: (items ?? []).filter(i => i.order_id === order.id),
      }));
    },
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!orders?.length) {
    return null;
  }

  return (
    <Card className="border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Package className="h-5 w-5 text-primary shrink-0" aria-hidden />
          Commandes en cours
        </CardTitle>
        <CardDescription>Suivi unifié — tous types de produits</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {orders.map(order => (
          <div key={order.id} className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{order.order_number}</p>
            <OrderTimeline
              steps={buildOrderTimeline({
                orderStatus: order.status,
                paymentStatus: order.payment_status,
                productTypes: order.items.map(i => i.product_type),
                createdAt: order.created_at,
              })}
            />
          </div>
        ))}
        {onViewAll && (
          <Button variant="outline" className="w-full justify-between" onClick={onViewAll}>
            Voir toutes mes commandes
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
