/**
 * PhysicalProductStats - Statistiques personnelles produits physiques
 * Date: 2025-01-27
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Package,
  DollarSign,
  ShoppingCart,
  TrendingUp,
} from '@/components/icons';

export const PhysicalProductStats = () => {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['customerPhysicalStats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('email', user.email)
        .single();

      if (!customer) throw new Error('Client non trouvé');

      // Récupérer les commandes avec produits physiques
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('order_id, products(product_type)')
        .eq('products.product_type', 'physical');

      const orderIds = orderItems?.map((item) => item.order_id) || [];

      if (orderIds.length === 0) {
        return {
          totalOrders: 0,
          totalSpent: 0,
          averageOrder: 0,
          totalItems: 0,
        };
      }

      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('total_amount, status, order_items(quantity)')
        .eq('customer_id', customer.id)
        .in('id', orderIds);

      if (ordersError) throw ordersError;

      const completedOrders = orders?.filter((o) => o.status === 'completed' || o.status === 'delivered') || [];
      const totalSpent = completedOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const totalItems = completedOrders.reduce((sum, o) => {
        const items = o.order_items || [];
        return sum + items.reduce((itemSum: number, item: any) => itemSum + (item.quantity || 0), 0);
      }, 0);

      return {
        totalOrders: orders?.length || 0,
        totalSpent,
        averageOrder: completedOrders.length > 0 ? totalSpent / completedOrders.length : 0,
        totalItems,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Erreur lors du chargement des statistiques. Veuillez réessayer.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Commandes totales</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
          <p className="text-xs text-muted-foreground">Produits physiques</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total dépensé</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {(stats?.totalSpent || 0).toLocaleString('fr-FR', {
              style: 'currency',
              currency: 'XOF',
            })}
          </div>
          <p className="text-xs text-muted-foreground">Toutes commandes</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Panier moyen</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {(stats?.averageOrder || 0).toLocaleString('fr-FR', {
              style: 'currency',
              currency: 'XOF',
            })}
          </div>
          <p className="text-xs text-muted-foreground">Par commande</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Articles achetés</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalItems || 0}</div>
          <p className="text-xs text-muted-foreground">Total produits</p>
        </CardContent>
      </Card>
    </div>
  );
};

