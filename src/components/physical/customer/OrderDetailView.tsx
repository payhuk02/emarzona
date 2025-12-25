/**
 * OrderDetailView - Vue détaillée d'une commande
 * Date: 2025-01-27
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Package,
  MapPin,
  CreditCard,
  Calendar,
  Truck,
} from 'lucide-react';

interface OrderDetailViewProps {
  orderId: string;
}

export const OrderDetailView = ({ orderId }: OrderDetailViewProps) => {
  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(
            *,
            products(
              name,
              image_url,
              product_type
            )
          ),
          customers(
            name,
            email,
            phone
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Erreur lors du chargement de la commande. Veuillez réessayer.
        </AlertDescription>
      </Alert>
    );
  }

  const physicalItems = (order.order_items || []).filter(
    (item: any) => item.products?.product_type === 'physical'
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      processing: 'default',
      confirmed: 'default',
      shipped: 'default',
      delivered: 'outline',
      completed: 'outline',
      cancelled: 'destructive',
    };

    const labels: Record<string, string> = {
      pending: 'En attente',
      processing: 'En traitement',
      confirmed: 'Confirmée',
      shipped: 'Expédiée',
      delivered: 'Livrée',
      completed: 'Terminée',
      cancelled: 'Annulée',
    };

    return (
      <Badge variant={variants[status] || 'default'}>
        {labels[status] || status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Informations générales */}
      <Card>
        <CardHeader>
          <CardTitle>Informations de la commande</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Numéro de commande</p>
              <p className="font-medium">{order.order_number || order.id.slice(0, 8)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-medium">
                {format(new Date(order.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Statut</p>
              <div className="mt-1">{getStatusBadge(order.status)}</div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Paiement</p>
              <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'}>
                {order.payment_status === 'paid' ? 'Payée' : 'En attente'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Articles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Articles ({physicalItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {physicalItems.map((item: any, index: number) => (
              <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                {item.products?.image_url && (
                  <img
                    src={item.products.image_url}
                    alt={item.products.name}
                    className="w-20 h-20 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <h4 className="font-semibold">{item.products?.name || 'Produit inconnu'}</h4>
                  <div className="text-sm text-muted-foreground mt-2 space-y-1">
                    <p>Quantité: {item.quantity}</p>
                    <p>
                      Prix unitaire:{' '}
                      {item.unit_price?.toLocaleString('fr-FR', {
                        style: 'currency',
                        currency: order.currency || 'XOF',
                      })}
                    </p>
                    <p>
                      Total:{' '}
                      {(item.quantity * (item.unit_price || 0)).toLocaleString('fr-FR', {
                        style: 'currency',
                        currency: order.currency || 'XOF',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Separator className="my-4" />
          <div className="flex justify-between items-center">
            <span className="font-semibold">Total</span>
            <span className="text-xl font-bold">
              {order.total_amount?.toLocaleString('fr-FR', {
                style: 'currency',
                currency: order.currency || 'XOF',
              })}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Informations client */}
      {order.customers && (
        <Card>
          <CardHeader>
            <CardTitle>Informations client</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>
              <span className="text-muted-foreground">Nom: </span>
              {(order.customers as any).name || 'Non renseigné'}
            </p>
            <p>
              <span className="text-muted-foreground">Email: </span>
              {(order.customers as any).email}
            </p>
            {(order.customers as any).phone && (
              <p>
                <span className="text-muted-foreground">Téléphone: </span>
                {(order.customers as any).phone}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

