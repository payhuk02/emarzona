/**
 * Pay Balance List
 * Liste des soldes à payer pour les commandes
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DollarSign,
  Search,
  AlertCircle,
  ArrowRight,
  CreditCard,
  Clock,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function PayBalanceList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch orders with balance to pay
  const { data: orders, isLoading } = useQuery({
    queryKey: ['pay-balance-orders', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          products (
            id,
            name,
            payment_options
          ),
          secured_payments (
            id,
            amount,
            status
          )
        `)
        .eq('buyer_id', user?.id)
        .eq('payment_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filtrer les commandes avec solde restant
      return data?.filter(order => {
        if (order.products?.payment_options?.type === 'percentage') {
          const paymentOptions = order.products.payment_options;
          const initialPercentage = paymentOptions.initial_percentage || 50;
          const remainingPercentage = 100 - initialPercentage;
          return remainingPercentage > 0;
        }
        return order.payment_status === 'pending';
      }) || [];
    },
    enabled: !!user?.id,
  });

  // Calculer le solde restant
  const calculateBalance = (order: any) => {
    if (order.products?.payment_options?.type === 'percentage') {
      const paymentOptions = order.products.payment_options;
      const initialPercentage = paymentOptions.initial_percentage || 50;
      const remainingPercentage = 100 - initialPercentage;
      return (order.total_amount * remainingPercentage) / 100;
    }
    return order.total_amount;
  };

  // Filtrer les commandes
  const filteredOrders = orders?.filter(order => {
    return (
      order.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.products?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Calcul du solde total
  const totalBalance = filteredOrders?.reduce((sum, order) => sum + calculateBalance(order), 0) || 0;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Soldes à Payer</h1>
                <p className="text-muted-foreground">
                  Payez les soldes restants de vos commandes
                </p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Solde Total</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalBalance.toLocaleString()} FCFA</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Commandes en Attente</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{orders?.length || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Moyenne par Commande</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {orders?.length ? Math.round(totalBalance / orders.length).toLocaleString() : 0} FCFA
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search */}
            <Card>
              <CardHeader>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par numéro ou produit..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </CardHeader>

              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Chargement...
                  </div>
                ) : filteredOrders && filteredOrders.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>N° Commande</TableHead>
                        <TableHead>Produit</TableHead>
                        <TableHead>Montant Total</TableHead>
                        <TableHead>Solde Restant</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((order) => {
                        const balance = calculateBalance(order);
                        return (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">
                              {order.order_number}
                            </TableCell>
                            <TableCell>{order.products?.name || 'N/A'}</TableCell>
                            <TableCell>{order.total_amount.toLocaleString()} FCFA</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Badge variant="destructive">
                                  {balance.toLocaleString()} FCFA
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              {format(new Date(order.created_at), 'PP', { locale: fr })}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => navigate(`/payments/${order.id}/balance`)}
                              >
                                Payer
                                <ArrowRight className="h-4 w-4 ml-1" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Aucun solde à payer</h3>
                    <p className="text-muted-foreground">
                      Toutes vos commandes sont payées ou n'ont pas de solde restant.
                    </p>
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

