/**
 * Admin Payments Dashboard
 * Vue globale des paiements de la plateforme
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
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
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ProtectedAction } from '@/components/admin/ProtectedAction';
import { Admin2FABanner } from '@/components/admin/Admin2FABanner';
import { RequireAAL2 } from '@/components/admin/RequireAAL2';

export default function AdminPayments() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Animations au scroll
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const tableRef = useScrollAnimation<HTMLDivElement>();

  // Fetch all payments
  const { data: payments, isLoading } = useQuery({
    queryKey: ['admin-payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          products(name),
          stores(name),
          profiles!orders_buyer_id_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    },
  });

  // Stats optimisés avec useMemo
  const totalAmount = useMemo(() => 
    payments?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0,
    [payments]
  );
  const successfulPayments = useMemo(() => 
    payments?.filter(p => p.payment_status === 'completed').length || 0,
    [payments]
  );
  const pendingPayments = useMemo(() => 
    payments?.filter(p => p.payment_status === 'pending').length || 0,
    [payments]
  );
  const failedPayments = useMemo(() => 
    payments?.filter(p => p.payment_status === 'failed').length || 0,
    [payments]
  );

  useEffect(() => {
    if (!isLoading && payments) {
      logger.info(`Admin Payments: ${payments.length} paiements chargés`);
    }
  }, [isLoading, payments]);

  const getStatusBadge = useCallback((status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" /> Payé</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> En attente</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Échoué</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  }, []);

  const filteredPayments = useMemo(() => payments?.filter(payment => {
    const matchesSearch =
      payment.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.products?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'completed' && payment.payment_status === 'completed') ||
      (activeTab === 'pending' && payment.payment_status === 'pending') ||
      (activeTab === 'failed' && payment.payment_status === 'failed');

    return matchesSearch && matchesTab;
  }) || [], [payments, searchQuery, activeTab]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <RequireAAL2>
          <div className="container mx-auto p-6 space-y-6">
            <Admin2FABanner />
            {/* Header */}
            <div ref={headerRef} role="banner">
              <h1 className="text-3xl font-bold tracking-tight" id="admin-payments-title">Paiements</h1>
              <p className="text-muted-foreground">
                Vue d'ensemble de tous les paiements de la plateforme
              </p>
            </div>

            {/* Stats Cards */}
            <div ref={statsRef} className="grid gap-4 md:grid-cols-4" role="region" aria-label="Statistiques des paiements">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Montant Total</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalAmount.toLocaleString()} FCFA</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Payés</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{successfulPayments}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">En Attente</CardTitle>
                  <Clock className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{pendingPayments}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Échoués</CardTitle>
                  <XCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{failedPayments}</div>
                </CardContent>
              </Card>
            </div>

            {/* Filters & Table */}
            <ProtectedAction permission="payments.manage" fallback={
              <Card>
                <CardHeader>
                  <CardTitle>Liste des Paiements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">Accès restreint</div>
                </CardContent>
              </Card>
            }>
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                      <TabsTrigger value="all">Tous</TabsTrigger>
                      <TabsTrigger value="completed">Payés</TabsTrigger>
                      <TabsTrigger value="pending">En attente</TabsTrigger>
                      <TabsTrigger value="failed">Échoués</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>

              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">Chargement...</div>
                ) : filteredPayments && filteredPayments.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>N° Commande</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Produit</TableHead>
                        <TableHead>Boutique</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">{payment.order_number}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{payment.profiles?.full_name || 'N/A'}</div>
                              <div className="text-sm text-muted-foreground">
                                {payment.profiles?.email}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{payment.products?.name || 'N/A'}</TableCell>
                          <TableCell>{payment.stores?.name || 'N/A'}</TableCell>
                          <TableCell>{payment.total_amount?.toLocaleString()} FCFA</TableCell>
                          <TableCell>{getStatusBadge(payment.payment_status)}</TableCell>
                          <TableCell>
                            {format(new Date(payment.created_at), 'PP', { locale: fr })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Aucun paiement</h3>
                    <p className="text-muted-foreground">Aucun paiement trouvé.</p>
                  </div>
                )}
              </CardContent>
            </Card>
            </ProtectedAction>
          </div>
          </RequireAAL2>
        </main>
      </div>
    </SidebarProvider>
  );
}

