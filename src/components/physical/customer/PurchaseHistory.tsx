/**
 * PurchaseHistory - Historique des achats avec timeline visuelle
 * Date: 2025-01-27
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  History,
  Calendar,
  DollarSign,
  Package,
  Search,
  Filter,
} from '@/components/icons';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useState } from 'react';

interface OrderItemWithProduct {
  id: string;
  quantity: number;
  price: number;
  products?: {
    name?: string;
    image_url?: string | null;
    product_type?: string;
  } | null;
}

interface OrderWithItems {
  id: string;
  order_number?: string | null;
  status: string;
  total_amount?: number | null;
  currency?: string | null;
  created_at: string;
  order_items?: OrderItemWithProduct[] | null;
}

export const PurchaseHistory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Récupérer l'historique des achats
  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['customerPurchaseHistory', statusFilter, dateFilter],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('email', user.email)
        .single();

      if (!customer) throw new Error('Client non trouvé');

      let query = supabase
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
          )
        `)
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false });

      // Filtrer par type de produit (physique uniquement)
      // Note: Ce filtre sera appliqué côté client pour l'instant
      // car on ne peut pas filtrer directement dans la requête nested

      // Filtrer par statut
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      // Filtrer par date
      if (dateFilter !== 'all') {
        const now = new Date();
        let startDate: Date;

        switch (dateFilter) {
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case 'year':
            startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = new Date(0);
        }

        query = query.gte('created_at', startDate.toISOString());
      }

      const { data: ordersData, error: ordersError } = await query.limit(50);

      if (ordersError) throw ordersError;

      // Filtrer pour ne garder que les produits physiques
      const physicalOrders = (ordersData || []).filter((order) => {
        const items = order.order_items || [];
        return items.some(
          (item: OrderItemWithProduct) => item.products?.product_type === 'physical'
        );
      });

      return physicalOrders;
    },
  });

  // Filtrer par terme de recherche
  const filteredOrders = orders?.filter((order) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      order.order_number?.toLowerCase().includes(searchLower) ||
      order.order_items?.some((item: OrderItemWithProduct) =>
        item.products?.name?.toLowerCase().includes(searchLower)
      )
    );
  });

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
          Erreur lors du chargement de l'historique. Veuillez réessayer.
        </AlertDescription>
      </Alert>
    );
  }

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

  // Calculer les statistiques
  const stats = {
    total: filteredOrders?.length || 0,
    totalSpent: filteredOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0,
    averageOrder: filteredOrders
      ? (stats.totalSpent / (filteredOrders.length || 1))
      : 0,
  };

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Commandes totales</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {stats.totalSpent.toLocaleString('fr-FR', {
                style: 'currency',
                currency: 'XOF',
              })}
            </div>
            <div className="text-sm text-muted-foreground">Total dépensé</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {stats.averageOrder.toLocaleString('fr-FR', {
                style: 'currency',
                currency: 'XOF',
              })}
            </div>
            <div className="text-sm text-muted-foreground">Panier moyen</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historique des Achats
          </CardTitle>
          <CardDescription>
            Consultez toutes vos commandes de produits physiques
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par numéro de commande ou produit..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="processing">En traitement</SelectItem>
                  <SelectItem value="shipped">Expédiée</SelectItem>
                  <SelectItem value="delivered">Livrée</SelectItem>
                  <SelectItem value="completed">Terminée</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full sm:w-[150px] min-h-[44px] h-11">
                  <SelectValue placeholder="Période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les périodes</SelectItem>
                  <SelectItem value="week">7 derniers jours</SelectItem>
                  <SelectItem value="month">30 derniers jours</SelectItem>
                  <SelectItem value="year">12 derniers mois</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Timeline des commandes */}
          {!filteredOrders || filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune commande</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                  ? 'Aucune commande ne correspond à vos critères'
                  : "Vous n'avez pas encore passé de commande"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const physicalItems = (order.order_items || []).filter(
                  (item: OrderItemWithProduct) => item.products?.product_type === 'physical'
                );

                return (
                  <Card key={order.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">
                                  Commande {order.order_number || order.id.slice(0, 8)}
                                </span>
                                {getStatusBadge(order.status)}
                              </div>
                              <div className="text-sm text-muted-foreground flex items-center gap-4 mt-1">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(order.created_at), 'dd MMMM yyyy', {
                                    locale: fr,
                                  })}
                                </span>
                                <span className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  {order.total_amount?.toLocaleString('fr-FR', {
                                    style: 'currency',
                                    currency: order.currency || 'XOF',
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Produits */}
                          <div className="mt-3 space-y-2">
                            {physicalItems.map((item: OrderItemWithProduct, index: number) => (
                              <div
                                key={index}
                                className="flex items-center gap-3 p-2 bg-muted rounded-lg"
                              >
                                {item.products?.image_url && (
                                  <img
                                    src={item.products.image_url}
                                    alt={item.products.name}
                                    className="w-12 h-12 object-cover rounded"
                                  />
                                )}
                                <div className="flex-1">
                                  <p className="text-sm font-medium">
                                    {item.products?.name || 'Produit inconnu'}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Quantité: {item.quantity} ×{' '}
                                    {item.unit_price?.toLocaleString('fr-FR', {
                                      style: 'currency',
                                      currency: order.currency || 'XOF',
                                    })}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
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
    </div>
  );
};

