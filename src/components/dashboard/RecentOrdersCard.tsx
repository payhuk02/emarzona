import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowRight, FileText, Truck, Wrench, GraduationCap, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
  created_at: string;
  customers: { name: string } | null;
  product_types?: string[];
}

const TYPE_CONFIG = {
  digital: {
    label: 'Digital',
    icon: FileText,
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  },
  physical: {
    label: 'Physique',
    icon: Truck,
    color: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  },
  service: {
    label: 'Service',
    icon: Wrench,
    color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  },
  course: {
    label: 'Cours',
    icon: GraduationCap,
    color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
  },
  artist: {
    label: 'Artiste',
    icon: Palette,
    color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
  },
} as const;

interface RecentOrdersCardProps {
  orders: Order[];
}

const RecentOrdersCardComponent = ({ orders }: RecentOrdersCardProps) => {
  const navigate = useNavigate();

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'En attente', variant: 'secondary' as const },
      confirmed: { label: 'Confirmée', variant: 'default' as const },
      processing: { label: 'En cours', variant: 'default' as const },
      shipped: { label: 'Expédiée', variant: 'default' as const },
      delivered: { label: 'Livrée', variant: 'default' as const },
      cancelled: { label: 'Annulée', variant: 'destructive' as const },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (orders.length === 0) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-soft">
        <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 md:p-6">
          <CardTitle className="text-xs sm:text-sm md:text-base lg:text-lg">
            Commandes récentes
          </CardTitle>
          <CardDescription className="text-[10px] sm:text-[11px] md:text-xs text-muted-foreground">
            Vos dernières commandes apparaîtront ici
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
          <div className="text-center py-4 sm:py-6">
            <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">
              Aucune commande pour le moment
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-soft">
      <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xs sm:text-sm md:text-base lg:text-lg">
              Commandes récentes
            </CardTitle>
            <CardDescription className="text-[10px] sm:text-[11px] md:text-xs text-muted-foreground">
              Les 5 dernières commandes
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard/orders')}
            className="gap-1 h-8 sm:h-9 text-[10px] sm:text-xs"
          >
            Voir tout
            <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
        <div className="space-y-4">
          {orders.map(order => (
            <div
              key={order.id}
              className="flex items-center justify-between p-2 sm:p-3 md:p-4 rounded-lg border hover:bg-muted/50 transition-colors touch-manipulation min-h-[50px] sm:min-h-[60px] cursor-pointer"
              style={{ willChange: 'transform' }}
              onClick={() => navigate('/dashboard/orders')}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <p className="text-[10px] sm:text-xs md:text-sm font-medium break-words">
                    {order.order_number}
                  </p>
                  {getStatusBadge(order.status)}
                </div>
                <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground mt-0.5 sm:mt-1 line-clamp-1">
                  {order.customers?.name || 'Client inconnu'} •{' '}
                  {format(new Date(order.created_at), 'dd MMM yyyy', { locale: fr })}
                </p>
                {order.product_types && order.product_types.length > 0 && (
                  <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap mt-1 sm:mt-1.5">
                    {order.product_types.slice(0, 3).map(type => {
                      const config = TYPE_CONFIG[type as keyof typeof TYPE_CONFIG];
                      if (!config) return null;
                      const Icon = config.icon;
                      return (
                        <Badge
                          key={type}
                          variant="outline"
                          className={cn(
                            'text-[8px] sm:text-[9px] md:text-[10px] px-1.5 sm:px-2 py-0.5 flex items-center gap-1',
                            config.color
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
                <p className="text-[10px] sm:text-xs md:text-sm font-semibold">
                  {order.total_amount.toLocaleString()} FCFA
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
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






