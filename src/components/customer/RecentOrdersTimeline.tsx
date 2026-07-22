/**
 * Epic 3.6.2 — Dernières commandes actives avec timeline (portail client)
 */

import { useTranslation } from 'react-i18next';
import { useCustomerHubSummary } from '@/hooks/customer/useCustomerHubSummary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/LoadingState';
import { Package, ArrowRight } from 'lucide-react';
import { buildOrderTimeline } from '@/lib/customer/order-timeline';
import { OrderTimeline } from '@/components/customer/OrderTimeline';

interface RecentOrdersTimelineProps {
  userId: string;
  email?: string | null;
  onViewAll?: () => void;
  limit?: number;
}

export function RecentOrdersTimeline({
  userId,
  email,
  onViewAll,
  limit = 3,
}: RecentOrdersTimelineProps) {
  const { i18n, t } = useTranslation();
  const { data: hub, isLoading } = useCustomerHubSummary(userId, limit, true, email);

  const orders = hub?.recentOrders;

  if (isLoading) {
    return (
      <Card className="border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
        <CardContent className="pt-6">
          <LoadingState variant="skeleton" skeletonCount={2} skeletonHeight="h-24" />
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
          {t('customer.hub.activeTimeline', 'Commandes en cours')}
        </CardTitle>
        <CardDescription>
          {t('customer.hub.timelineSubtitle', 'Suivi unifié — tous types de produits')}
        </CardDescription>
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
                locale: i18n.language,
              })}
            />
          </div>
        ))}
        {onViewAll && (
          <Button variant="outline" className="w-full justify-between" onClick={onViewAll}>
            {t('customer.hub.viewAllOrders', 'Voir toutes mes commandes')}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
