/**
 * Payment Management List
 * Liste des commandes nécessitant une gestion de paiement avancé
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  CreditCard,
  Search,
  Percent,
  Shield,
  DollarSign,
  ArrowRight,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function PaymentManagementList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Fetch orders with advanced payment options
  const { data: orders, isLoading } = useQuery({
    queryKey: ['payment-management-orders', user?.id],
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
            status,
            amount,
            escrow_released_at
          )
        `)
        .or(`buyer_id.eq.${user?.id},store_id.in.(select id from stores where user_id.eq.${user?.id})`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filtrer les commandes avec paiements avancés
      return data?.filter(order => {
        const hasAdvancedPayment = order.products?.payment_options?.type !== 'full';
        const hasSecuredPayment = order.secured_payments && order.secured_payments.length > 0;
        return hasAdvancedPayment || hasSecuredPayment;
      }) || [];
    },
    enabled: !!user?.id,
  });

  // Filtrer les commandes
  const filteredOrders = orders?.filter(order => {
    const matchesSearch =
      order.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.products?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'percentage' && order.products?.payment_options?.type === 'percentage') ||
      (activeTab === 'escrow' && order.products?.payment_options?.type === 'delivery_secured') ||
      (activeTab === 'pending' && order.secured_payments?.some((p: any) => p.status === 'pending'));

    return matchesSearch && matchesTab;
  });

  const getPaymentTypeBadge = (order: any) => {
    const paymentType = order.products?.payment_options?.type;
    
    if (paymentType === 'percentage') {
      return <Badge variant="secondary"><Percent className="h-3 w-3 mr-1" /> Pourcentage</Badge>;
    }
    if (paymentType === 'delivery_secured') {
      return <Badge variant="default"><Shield className="h-3 w-3 mr-1" /> Escrow</Badge>;
    }
    return <Badge variant="outline"><DollarSign className="h-3 w-3 mr-1" /> Standard</Badge>;
  };

  const getStatusBadge = (order: any) => {
    const securedPayment = order.secured_payments?.[0];
    
    if (!securedPayment) {
      return <Badge variant="outline">Aucun</Badge>;
    }

    if (securedPayment.status === 'released') {
      return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" /> Libéré</Badge>;
    }
    if (securedPayment.status === 'pending') {
      return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> En attente</Badge>;
    }
    return <Badge variant="outline">{securedPayment.status}</Badge>;
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Gestion des Paiements</h1>
                <p className="text-muted-foreground">
                  Gérez les paiements en pourcentage et escrow de vos commandes
                </p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Commandes</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{orders?.length || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Paiements Pourcentage</CardTitle>
                  <Percent className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {orders?.filter(o => o.products?.payment_options?.type === 'percentage').length || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Paiements Escrow</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {orders?.filter(o => o.products?.payment_options?.type === 'delivery_secured').length || 0}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher par numéro ou produit..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                      <TabsTrigger value="all">Tous</TabsTrigger>
                      <TabsTrigger value="percentage">Pourcentage</TabsTrigger>
                      <TabsTrigger value="escrow">Escrow</TabsTrigger>
                      <TabsTrigger value="pending">En attente</TabsTrigger>
                    </TabsList>
                  </Tabs>
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
                        <TableHead>Type Paiement</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">
                            {order.order_number}
                          </TableCell>
                          <TableCell>{order.products?.name || 'N/A'}</TableCell>
                          <TableCell>{getPaymentTypeBadge(order)}</TableCell>
                          <TableCell>{order.total_amount} FCFA</TableCell>
                          <TableCell>{getStatusBadge(order)}</TableCell>
                          <TableCell>
                            {format(new Date(order.created_at), 'PP', { locale: fr })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/payments/${order.id}/manage`)}
                            >
                              Gérer
                              <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Aucune commande</h3>
                    <p className="text-muted-foreground">
                      Aucune commande avec paiement avancé trouvée.
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

