/**
 * Page My Orders - Mes Commandes client
 * Date: 26 Janvier 2025
 * 
 * Fonctionnalités:
 * - Liste toutes commandes client
 * - Filtres par statut (pending, processing, completed, cancelled)
 * - Filtres par type produit
 * - Recherche par numéro commande
 * - Détails commande (items, prix, statut)
 * - Actions (voir détails, télécharger facture)
 */

import { useState } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Search,
  Filter,
  Eye,
  Download,
  Calendar,
  DollarSign,
  ArrowLeft,
  ShoppingBag,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { useEffect } from 'react';

type OrderStatus = 'all' | 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';
type ProductType = 'all' | 'digital' | 'physical' | 'service' | 'course';

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  currency: string;
  status: string;
  payment_status: string;
  created_at: string;
  items: OrderItem[];
}

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_type: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export default function MyOrders() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus>('all');
  const [typeFilter, setTypeFilter] = useState<ProductType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  // Fetch orders
  const { data: orders, isLoading } = useQuery({
    queryKey: ['customer-orders', user?.id, statusFilter, typeFilter],
    queryFn: async (): Promise<Order[]> => {
      if (!user?.id) return [];

      let query = supabase
        .from('orders')
        .select('*')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      // Filter by status
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data: ordersData, error } = await query;

      if (error) throw error;

      // Fetch order items for each order
      const ordersWithItems = await Promise.all(
        (ordersData || []).map(async (order) => {
          let itemsQuery = supabase
            .from('order_items')
            .select('*')
            .eq('order_id', order.id);

          // Filter by product type
          if (typeFilter !== 'all') {
            itemsQuery = itemsQuery.eq('product_type', typeFilter);
          }

          const { data: items } = await itemsQuery;

          return {
            ...order,
            items: items || [],
          } as Order;
        })
      );

      // Filter by search query
      if (searchQuery.trim()) {
        return ordersWithItems.filter(
          order =>
            order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.items.some(item =>
              item.product_name.toLowerCase().includes(searchQuery.toLowerCase())
            )
        );
      }

      return ordersWithItems.filter(order => order.items.length > 0);
    },
    enabled: !!user?.id,
  });

  const getStatusBadge = (status: string, paymentStatus: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: 'En attente', variant: 'secondary' },
      processing: { label: 'En traitement', variant: 'default' },
      completed: { label: 'Terminée', variant: 'default' },
      cancelled: { label: 'Annulée', variant: 'destructive' },
      refunded: { label: 'Remboursée', variant: 'outline' },
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'secondary' as const };
    const paymentInfo = paymentStatus === 'completed' ? '✅ Payé' : '⏳ En attente';

    return (
      <div className="flex flex-col gap-1">
        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        <span className="text-xs text-muted-foreground">{paymentInfo}</span>
      </div>
    );
  };

  const getProductTypeIcon = (type: string) => {
    const icons = {
      digital: <Download className="h-4 w-4" />,
      physical: <Package className="h-4 w-4" />,
      service: <Calendar className="h-4 w-4" />,
      course: <ShoppingBag className="h-4 w-4" />,
    };
    return icons[type as keyof typeof icons] || <Package className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-96" />
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50 dark:bg-gray-900">
        <AppSidebar />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/account')}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <h1 className="text-3xl font-bold flex items-center gap-2">
                    <ShoppingBag className="h-8 w-8" />
                    Mes Commandes
                  </h1>
                </div>
                <p className="text-muted-foreground">
                  Consultez toutes vos commandes et leur statut
                </p>
              </div>
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par numéro de commande ou produit..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Status Filter */}
                  <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as OrderStatus)}>
                    <TabsList>
                      <TabsTrigger value="all">Tous</TabsTrigger>
                      <TabsTrigger value="pending">En attente</TabsTrigger>
                      <TabsTrigger value="processing">En traitement</TabsTrigger>
                      <TabsTrigger value="completed">Terminées</TabsTrigger>
                      <TabsTrigger value="cancelled">Annulées</TabsTrigger>
                    </TabsList>
                  </Tabs>

                  {/* Type Filter */}
                  <Tabs value={typeFilter} onValueChange={(v) => setTypeFilter(v as ProductType)}>
                    <TabsList>
                      <TabsTrigger value="all">Tous types</TabsTrigger>
                      <TabsTrigger value="digital">Digitaux</TabsTrigger>
                      <TabsTrigger value="physical">Physiques</TabsTrigger>
                      <TabsTrigger value="service">Services</TabsTrigger>
                      <TabsTrigger value="course">Cours</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardContent>
            </Card>

            {/* Orders List */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {orders?.length || 0} {orders?.length === 1 ? 'commande' : 'commandes'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!orders || orders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Aucune commande</h3>
                    <p className="text-muted-foreground mb-4">
                      Vous n'avez pas encore passé de commande
                    </p>
                    <Button onClick={() => navigate('/marketplace')}>
                      Découvrir la marketplace
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <Card key={order.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Commande #{order.order_number}
                              </CardTitle>
                              <CardDescription className="flex items-center gap-2 mt-1">
                                <Calendar className="h-4 w-4" />
                                {new Date(order.created_at).toLocaleDateString('fr-FR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-4">
                              {getStatusBadge(order.status, order.payment_status)}
                              <div className="text-right">
                                <p className="font-bold text-lg">
                                  {order.total_amount.toLocaleString('fr-FR')} {order.currency}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {order.items.length} {order.items.length === 1 ? 'article' : 'articles'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {/* Order Items */}
                          <div className="space-y-2 mb-4">
                            {order.items.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between p-3 border rounded-lg"
                              >
                                <div className="flex items-center gap-3">
                                  {getProductTypeIcon(item.product_type)}
                                  <div>
                                    <p className="font-medium">{item.product_name}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {item.quantity}x {item.unit_price.toLocaleString('fr-FR')} {order.currency}
                                    </p>
                                  </div>
                                </div>
                                <p className="font-semibold">
                                  {item.total_price.toLocaleString('fr-FR')} {order.currency}
                                </p>
                              </div>
                            ))}
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              onClick={() => navigate(`/orders/${order.id}`)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Voir les détails
                            </Button>
                            {order.payment_status === 'completed' && (
                              <Button
                                variant="outline"
                                onClick={() => {
                                  // TODO: Download invoice
                                  alert('Téléchargement facture (à implémenter)');
                                }}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Télécharger facture
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

