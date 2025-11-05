/**
 * Physical Product Analytics Dashboard
 * Date: 28 octobre 2025
 * 
 * Dashboard analytics professionnel pour produits physiques
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ShoppingCart,
  TrendingUp,
  Users,
  DollarSign,
  Package,
  Truck,
  AlertTriangle,
  BarChart3,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';
import { usePhysicalProduct } from '@/hooks/physical/usePhysicalProducts';

interface PhysicalAnalyticsDashboardProps {
  productId: string;
}

export const PhysicalAnalyticsDashboard = ({
  productId,
}: PhysicalAnalyticsDashboardProps) => {
  // Get product data
  const { data: product, isLoading: isLoadingProduct } = usePhysicalProduct(productId);

  // Get orders for this product (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const startDate = thirtyDaysAgo.toISOString().split('T')[0];

  const { data: orders, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['product-orders', productId, startDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          *,
          order:orders(
            id,
            order_number,
            status,
            total_amount,
            created_at,
            shipping_status
          )
        `)
        .eq('product_id', productId)
        .gte('order.created_at', startDate);

      if (error) throw error;
      return data || [];
    },
    enabled: !!productId,
  });

  // Calculate stats
  const stats = useMemo(() => {
    const orderItems = orders || [];
    
    // Get unique orders
    const uniqueOrders = new Map();
    orderItems.forEach(item => {
      if (item.order && !uniqueOrders.has(item.order.id)) {
        uniqueOrders.set(item.order.id, item.order);
      }
    });
    
    const ordersList = Array.from(uniqueOrders.values());
    
    // Calculate metrics
    const totalSales = orderItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const revenue = ordersList
      .filter(o => o.status === 'completed' || o.status === 'shipped')
      .reduce((sum, o) => sum + (o.total_amount || 0), 0);
    
    const completedOrders = ordersList.filter(o => 
      o.status === 'completed' || o.status === 'shipped'
    );
    const averageOrderValue = completedOrders.length > 0
      ? revenue / completedOrders.length
      : 0;

    const shippedOrders = ordersList.filter(o => 
      o.shipping_status === 'shipped' || o.shipping_status === 'delivered'
    ).length;
    
    const pendingOrders = ordersList.filter(o => 
      o.status === 'pending' || o.status === 'processing'
    ).length;

    // Stock level
    const stockLevel = product?.total_quantity || 0;
    const lowStockThreshold = product?.low_stock_threshold || 10;
    const lowStockItems = stockLevel <= lowStockThreshold ? 1 : 0;

    // Conversion rate (simplified - would need view data)
    const conversionRate = 0; // TODO: Calculate from product views

    return {
      totalSales,
      revenue,
      averageOrderValue,
      stockLevel,
      lowStockItems,
      shippedOrders,
      pendingOrders,
      conversionRate,
    };
  }, [orders, product]);

  const isLoading = isLoadingProduct || isLoadingOrders;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="space-y-0 pb-2">
                <Skeleton className="h-4 w-24 mb-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventes Totales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSales}</div>
            <p className="text-xs text-muted-foreground">
              Unités vendues (30 derniers jours)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats.revenue).toLocaleString()} XOF</div>
            <p className="text-xs text-muted-foreground">
              Panier moyen: {Math.round(stats.averageOrderValue).toLocaleString()} XOF
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.stockLevel} unités</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {stats.lowStockItems > 0 && (
                <>
                  <AlertTriangle className="h-3 w-3 text-yellow-600" />
                  Stock faible - Réapprovisionnement recommandé
                </>
              )}
              {stats.lowStockItems === 0 && stats.stockLevel > 0 && 'Stock optimal'}
              {stats.stockLevel === 0 && 'Rupture de stock'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expéditions</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.shippedOrders}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingOrders} en attente d'expédition
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Performance du Produit</CardTitle>
          <CardDescription>Statistiques clés pour optimiser vos ventes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Taux de conversion</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">{stats.conversionRate}%</span>
                <Badge variant="outline">Objectif: 3%</Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Clients uniques</span>
              </div>
              <span className="text-sm font-bold">0</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Retours produit</span>
              </div>
              <span className="text-sm font-bold">0</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Coming Soon */}
      <Card>
        <CardHeader>
          <CardTitle>Analytics Avancés</CardTitle>
          <CardDescription>Graphiques et statistiques détaillées (en développement)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Fonctionnalité en cours de développement</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Les graphiques de ventes, tendances d'inventaire et analytics détaillés seront bientôt disponibles.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

