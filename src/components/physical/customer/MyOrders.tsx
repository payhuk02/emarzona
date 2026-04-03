/**
 * MyOrders - Liste des commandes produits physiques du client
 * Date: 2025-01-27
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Package,
  Truck,
  Calendar,
  Eye,
  RotateCcw,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { useCustomerPhysicalOrders } from '@/hooks/physical/useCustomerPhysicalOrders';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';

export const MyOrders = () => {
  const { data: orders, isLoading, error } = useCustomerPhysicalOrders();
  const navigate = useNavigate();

  const getStatusBadge = (status: string, paymentStatus: string) => {
    if (paymentStatus !== 'paid') {
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" />
          En attente de paiement
        </Badge>
      );
    }

    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            En attente
          </Badge>
        );
      case 'confirmed':
        return (
          <Badge variant="default" className="gap-1 bg-blue-500">
            <CheckCircle2 className="h-3 w-3" />
            Confirmée
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="default" className="gap-1 bg-yellow-500">
            <Package className="h-3 w-3" />
            En traitement
          </Badge>
        );
      case 'shipped':
        return (
          <Badge variant="default" className="gap-1 bg-purple-500">
            <Truck className="h-3 w-3" />
            Expédiée
          </Badge>
        );
      case 'delivered':
        return (
          <Badge variant="default" className="gap-1 bg-green-500">
            <CheckCircle2 className="h-3 w-3" />
            Livrée
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Annulée
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  interface Shipment {
    status: string;
    tracking_number?: string;
    carrier?: string;
    estimated_delivery?: string;
  }

  const getShipmentStatus = (shipments: Shipment[] | null | undefined) => {
    if (!shipments || shipments.length === 0) {
      return { text: 'Non expédié', icon: Package, variant: 'secondary' as const };
    }

    const latestShipment = shipments[shipments.length - 1];
    switch (latestShipment.status) {
      case 'label_created':
        return { text: 'Étiquette créée', icon: Package, variant: 'default' as const };
      case 'picked_up':
      case 'in_transit':
        return { text: 'En transit', icon: Truck, variant: 'default' as const };
      case 'out_for_delivery':
        return { text: 'En livraison', icon: Truck, variant: 'default' as const };
      case 'delivered':
        return { text: 'Livré', icon: CheckCircle2, variant: 'default' as const };
      default:
        return { text: latestShipment.status, icon: Package, variant: 'secondary' as const };
    }
  };

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
          Erreur lors du chargement de vos commandes. Veuillez réessayer.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg lg:text-xl">
          <Package className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
          <span>Mes Commandes Produits Physiques</span>
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Suivez toutes vos commandes de produits physiques
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {!orders || orders.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <Package className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-semibold mb-2">Aucune commande</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 px-4">
              Vous n'avez pas encore de commandes de produits physiques
            </p>
            <Button 
              onClick={() => navigate('/marketplace?productType=physical')}
              className="min-h-[44px] px-6 touch-manipulation"
              size="lg"
            >
              Parcourir les produits
            </Button>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {orders.map((order) => {
              const shipmentStatus = getShipmentStatus(order.shipments || []);
              const ShipmentIcon = shipmentStatus.icon;

              return (
                <Card key={order.id} className="overflow-hidden">
                  <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-4 pt-3 sm:pt-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base sm:text-lg mb-1 sm:mb-2 break-words">
                          Commande #{order.order_number}
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                          <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-4">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                              <span className="whitespace-nowrap">
                                {format(new Date(order.created_at), 'dd/MM/yyyy', { locale: fr })}
                              </span>
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Package className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                              <span className="whitespace-nowrap">
                                {order.order_items.length} article{order.order_items.length > 1 ? 's' : ''}
                              </span>
                            </span>
                          </div>
                        </CardDescription>
                      </div>
                      <div className="flex flex-col items-start sm:items-end gap-2 flex-shrink-0">
                        {getStatusBadge(order.status, order.payment_status)}
                        <div className="text-base sm:text-lg font-semibold whitespace-nowrap">
                          {order.total_amount.toLocaleString('fr-FR', {
                            style: 'currency',
                            currency: order.currency || 'XOF',
                          })}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 px-3 sm:px-4 pb-3 sm:pb-4">
                    {/* Items */}
                    <div className="mb-3 sm:mb-4">
                      <div className="space-y-2 sm:space-y-3">
                        {order.order_items.slice(0, 3).map((item) => (
                          <div key={item.id} className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm">
                            {item.product_image_url && (
                              <img
                                src={item.product_image_url}
                                alt={item.product_name}
                                className="w-10 h-10 sm:w-12 sm:h-12 rounded object-cover flex-shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium break-words">{item.product_name}</div>
                              {item.variant_name && (
                                <div className="text-xs text-muted-foreground mt-0.5 break-words">
                                  {item.variant_name}
                                </div>
                              )}
                              <div className="text-xs text-muted-foreground mt-1">
                                Quantité: {item.quantity} × {item.price.toLocaleString('fr-FR', {
                                  style: 'currency',
                                  currency: order.currency || 'XOF',
                                })}
                              </div>
                            </div>
                          </div>
                        ))}
                        {order.order_items.length > 3 && (
                          <div className="text-xs sm:text-sm text-muted-foreground text-center pt-1">
                            + {order.order_items.length - 3} autre(s) article(s)
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Shipment Info */}
                    {order.shipments && order.shipments.length > 0 && (
                      <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-muted rounded-lg">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                          <div className="flex items-center gap-2">
                            <ShipmentIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span className="text-xs sm:text-sm font-medium">{shipmentStatus.text}</span>
                          </div>
                          {order.shipments[0].tracking_number && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (order.shipments?.[0]?.tracking_url) {
                                  window.open(order.shipments[0].tracking_url, '_blank');
                                }
                              }}
                              className="min-h-[36px] sm:min-h-[40px] touch-manipulation w-full sm:w-auto"
                            >
                              <Truck className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1.5 sm:mr-2" />
                              Suivre
                            </Button>
                          )}
                        </div>
                        {order.shipments[0].estimated_delivery && (
                          <div className="text-xs text-muted-foreground mt-2">
                            Livraison estimée: {format(new Date(order.shipments[0].estimated_delivery), 'dd/MM/yyyy', { locale: fr })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2 pt-3 sm:pt-4 border-t">
                      <div className="flex items-center gap-2 flex-wrap">
                        {order.returns && order.returns.length > 0 && (
                          <Badge variant="outline" className="gap-1 text-xs">
                            <RotateCcw className="h-3 w-3" />
                            {order.returns.length} retour{order.returns.length > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/orders/${order.id}`)}
                          className="min-h-[40px] sm:min-h-[36px] touch-manipulation flex-1 xs:flex-initial"
                        >
                          <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                          Voir les détails
                        </Button>
                        {order.status === 'delivered' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/returns/new?order_id=${order.id}`)}
                            className="min-h-[40px] sm:min-h-[36px] touch-manipulation flex-1 xs:flex-initial"
                          >
                            <RotateCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                            Demander un retour
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};






