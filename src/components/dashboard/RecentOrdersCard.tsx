import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { formatFcfa } from '@/lib/format-currency';
import { PRODUCT_TYPE_CONFIG, type ProductType } from '@/constants/product-types';

function customerInitials(name?: string | null): string {
  if (!name?.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
  created_at: string;
  customers: { name: string } | null;
  product_types?: string[];
}

interface RecentOrdersCardProps {
  orders: Order[];
  variant?: 'default' | 'premium';
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: 'En attente', className: 'dashboard-status-badge--pending' },
  confirmed: { label: 'Confirmée', className: 'dashboard-status-badge--processing' },
  processing: { label: 'En cours', className: 'dashboard-status-badge--processing' },
  shipped: { label: 'Expédiée', className: 'dashboard-status-badge--shipped' },
  delivered: { label: 'Livrée', className: 'dashboard-status-badge--delivered' },
  completed: { label: 'Livrée', className: 'dashboard-status-badge--completed' },
  cancelled: { label: 'Annulée', className: 'dashboard-status-badge--cancelled' },
};

const RecentOrdersCardComponent = ({ orders, variant = 'default' }: RecentOrdersCardProps) => {
  const navigate = useNavigate();
  const isPremium = variant === 'premium';

  const getStatusBadge = (status: string) => {
    if (isPremium) {
      const config = STATUS_LABELS[status] ?? STATUS_LABELS.pending;
      return <span className={cn('dashboard-status-badge', config.className)}>{config.label}</span>;
    }
    const legacy = {
      pending: { label: 'En attente', variant: 'secondary' as const },
      confirmed: { label: 'Confirmée', variant: 'default' as const },
      processing: { label: 'En cours', variant: 'default' as const },
      shipped: { label: 'Expédiée', variant: 'default' as const },
      delivered: { label: 'Livrée', variant: 'default' as const },
      cancelled: { label: 'Annulée', variant: 'destructive' as const },
    };
    const config = legacy[status as keyof typeof legacy] || legacy.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const shellClass = isPremium
    ? 'dashboard-premium-panel h-full flex flex-col'
    : 'dashboard-inner-card border-border/50 shadow-none';

  if (orders.length === 0) {
    if (isPremium) {
      return (
        <div className={shellClass}>
          <h2 className="dashboard-premium-panel-title">Commandes récentes</h2>
          <p className="dashboard-premium-panel-subtitle mt-1">Vos dernières commandes</p>
          <p className="text-sm text-muted-foreground py-8 text-center flex-1">
            Aucune commande pour le moment
          </p>
        </div>
      );
    }
    return (
      <Card className={shellClass}>
        <CardHeader className="pb-3 p-4 sm:p-5 md:p-6">
          <CardTitle className="dashboard-text-responsive">Commandes récentes</CardTitle>
          <CardDescription className="dashboard-text-responsive-small mt-1">
            Vos dernières commandes apparaîtront ici
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 md:p-6 pt-0">
          <p className="text-sm text-muted-foreground text-center py-6">
            Aucune commande pour le moment
          </p>
        </CardContent>
      </Card>
    );
  }

  const Wrap = isPremium ? 'div' : Card;
  const HeaderWrap = isPremium ? 'div' : CardHeader;
  const ContentWrap = isPremium ? 'div' : CardContent;

  return (
    <Wrap className={shellClass}>
      <HeaderWrap className={cn(!isPremium && 'pb-3 p-4 sm:p-5 md:p-6', isPremium && 'mb-5')}>
        <div className="flex items-center justify-between gap-3">
          <div>
            {isPremium ? (
              <>
                <h2 className="dashboard-premium-panel-title">Commandes récentes</h2>
                <p className="dashboard-premium-panel-subtitle">Les 5 dernières commandes</p>
              </>
            ) : (
              <>
                <CardTitle className="dashboard-text-responsive">Commandes récentes</CardTitle>
                <CardDescription className="dashboard-text-responsive-small mt-1">
                  Les 5 dernières commandes
                </CardDescription>
              </>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard/orders')}
            className="gap-1 text-sm shrink-0"
          >
            Voir tout
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </HeaderWrap>
      <ContentWrap className={cn(!isPremium && 'p-3 sm:p-4 md:p-6 pt-0', isPremium && 'flex-1')}>
        <div className={isPremium ? 'space-y-0' : 'space-y-4'}>
          {orders.map(order => (
            <div
              key={order.id}
              className={cn(
                'cursor-pointer transition-colors touch-manipulation',
                isPremium
                  ? 'dashboard-order-row hover:bg-muted/30'
                  : 'flex items-center justify-between p-2 sm:p-3 md:p-4 rounded-lg border hover:bg-muted/50 min-h-[50px] sm:min-h-[60px]'
              )}
              onClick={() => navigate('/dashboard/orders')}
            >
              {isPremium ? (
                <>
                  <div className="dashboard-order-avatar" aria-hidden>
                    {customerInitials(order.customers?.name)}
                  </div>
                  <div className="flex-1 min-w-0 w-full sm:w-auto">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm sm:text-base font-semibold">{order.order_number}</p>
                      {getStatusBadge(order.status)}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 line-clamp-1">
                      {order.customers?.name || 'Client'} •{' '}
                      {format(new Date(order.created_at), 'dd MMM yyyy', { locale: fr })}
                    </p>
                    <p className="text-sm font-bold tabular-nums mt-1 sm:hidden">
                      {formatFcfa(order.total_amount)}
                    </p>
                  </div>
                  <p className="hidden sm:block text-sm sm:text-base font-bold tabular-nums shrink-0">
                    {formatFcfa(order.total_amount)}
                  </p>
                </>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <p className="text-sm font-medium break-words">{order.order_number}</p>
                      {getStatusBadge(order.status)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {order.customers?.name || 'Client inconnu'} •{' '}
                      {format(new Date(order.created_at), 'dd MMM yyyy', { locale: fr })}
                    </p>
                    {order.product_types && order.product_types.length > 0 && (
                      <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap mt-1 sm:mt-1.5">
                        {order.product_types.slice(0, 3).map(type => {
                          const productType = type as ProductType;
                          const config = PRODUCT_TYPE_CONFIG[productType];
                          if (!config) return null;
                          const Icon = config.icon;
                          return (
                            <Badge
                              key={type}
                              variant="outline"
                              className={cn(
                                'text-[8px] sm:text-[9px] md:text-[10px] px-1.5 sm:px-2 py-0.5 flex items-center gap-1',
                                config.bgColor,
                                config.textColor,
                                config.borderColor
                              )}
                            >
                              <Icon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                              <span>{config.label}</span>
                            </Badge>
                          );
                        })}
                        {order.product_types.length > 3 && (
                          <Badge
                            variant="outline"
                            className="text-[8px] sm:text-[9px] md:text-[10px] px-1.5 sm:px-2 py-0.5"
                          >
                            +{order.product_types.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-sm font-semibold">{formatFcfa(order.total_amount)}</p>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </ContentWrap>
    </Wrap>
  );
};

// Optimisation avec React.memo pour éviter les re-renders inutiles
export const RecentOrdersCard = React.memo(RecentOrdersCardComponent, (prevProps, nextProps) => {
  if (prevProps.orders.length !== nextProps.orders.length) return false;

  return prevProps.orders.every((order, index) => {
    const nextOrder = nextProps.orders[index];
    return (
      order.id === nextOrder.id &&
      order.order_number === nextOrder.order_number &&
      order.status === nextOrder.status &&
      order.total_amount === nextOrder.total_amount &&
      order.created_at === nextOrder.created_at &&
      order.customers?.name === nextOrder.customers?.name
    );
  });
});

RecentOrdersCard.displayName = 'RecentOrdersCard';
