/**
 * OrderHistory - Historique des achats avec timeline visuelle
 * Date: 2025-01-27
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Package,
  Calendar,
  DollarSign,
  TrendingUp,
  ShoppingBag,
} from '@/components/icons';
import { useCustomerPhysicalOrders } from '@/hooks/physical/useCustomerPhysicalOrders';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';

export const OrderHistory = () => {
  const { data: orders, isLoading, error } = useCustomerPhysicalOrders();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Erreur lors du chargement de votre historique. Veuillez réessayer.
        </AlertDescription>
      </Alert>
    );
  }

  // Calculer les statistiques
  const totalOrders = orders?.length || 0;
  const totalSpent = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
  const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

  // Grouper par mois
  const ordersByMonth = orders?.reduce((acc, order) => {
    const monthKey = format(new Date(order.created_at), 'MMMM yyyy', { locale: fr });
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(order);
    return acc;
  }, {} as Record<string, typeof orders>);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 xs:grid-cols-2 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Commandes</CardTitle>
            <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
            <div className="text-xl sm:text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Commandes produits physiques
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Dépensé</CardTitle>
            <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
            <div className="text-xl sm:text-2xl font-bold break-words">
              {totalSpent.toLocaleString('fr-FR', {
                style: 'currency',
                currency: orders?.[0]?.currency || 'XOF',
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Sur tous vos achats
            </p>
          </CardContent>
        </Card>
        <Card className="xs:col-span-2 md:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Panier Moyen</CardTitle>
            <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
            <div className="text-xl sm:text-2xl font-bold break-words">
              {averageOrderValue.toLocaleString('fr-FR', {
                style: 'currency',
                currency: orders?.[0]?.currency || 'XOF',
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Par commande
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-4 pt-3 sm:pt-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg lg:text-xl">
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span>Historique des Achats</span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Timeline de toutes vos commandes de produits physiques
          </CardDescription>
        </CardHeader>
        <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
          {!orders || orders.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Package className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">Aucun historique</h3>
              <p className="text-sm sm:text-base text-muted-foreground px-4">
                Vous n'avez pas encore de commandes
              </p>
            </div>
          ) : (
            <div className="space-y-6 sm:space-y-8">
              {Object.entries(ordersByMonth || {}).map(([month, monthOrders]) => (
                <div key={month}>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold break-words">{month}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {monthOrders.length} commande{monthOrders.length > 1 ? 's' : ''}
                      </p>
                    </div>
                    <Badge variant="outline" className="self-start sm:self-auto whitespace-nowrap">
                      {monthOrders.reduce((sum, o) => sum + o.total_amount, 0).toLocaleString('fr-FR', {
                        style: 'currency',
                        currency: orders[0]?.currency || 'XOF',
                      })}
                    </Badge>
                  </div>
                  <div className="space-y-3 sm:space-y-3 ml-2 sm:ml-4 border-l-2 border-muted pl-3 sm:pl-4">
                    {monthOrders.map((order) => (
                      <div key={order.id} className="relative">
                        <div className="absolute -left-[9px] sm:-left-7 top-2 h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-primary border-2 border-background" />
                        <Card className="hover:shadow-md transition-shadow">
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col xs:flex-row xs:items-center gap-2 mb-2">
                                  <h4 className="text-sm sm:text-base font-medium break-words">
                                    Commande #{order.order_number}
                                  </h4>
                                  <Badge variant="outline" className="self-start xs:self-auto text-xs">
                                    {order.order_items.length} article{order.order_items.length > 1 ? 's' : ''}
                                  </Badge>
                                </div>
                                <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                                  {format(new Date(order.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                                </p>
                                <div className="space-y-1.5">
                                  {order.order_items.slice(0, 2).map((item) => (
                                    <div key={item.id} className="flex items-center gap-2 text-xs sm:text-sm">
                                      {item.product_image_url && (
                                        <img
                                          src={item.product_image_url}
                                          alt={item.product_name}
                                          className="w-5 h-5 sm:w-6 sm:h-6 rounded object-cover flex-shrink-0"
                                        />
                                      )}
                                      <span className="break-words">{item.product_name}</span>
                                      {item.variant_name && (
                                        <span className="text-muted-foreground break-words">
                                          ({item.variant_name})
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                  {order.order_items.length > 2 && (
                                    <p className="text-xs text-muted-foreground">
                                      + {order.order_items.length - 2} autre(s) article(s)
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col items-start sm:items-end gap-2 sm:gap-2 flex-shrink-0">
                                <div className="text-base sm:text-lg font-semibold whitespace-nowrap">
                                  {order.total_amount.toLocaleString('fr-FR', {
                                    style: 'currency',
                                    currency: order.currency || 'XOF',
                                  })}
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(`/orders/${order.id}`)}
                                  className="min-h-[36px] sm:min-h-[32px] touch-manipulation w-full sm:w-auto"
                                >
                                  Voir détails
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                  </div>
                  <Separator className="my-4 sm:my-6" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};




