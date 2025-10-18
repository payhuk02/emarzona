import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '@/lib/utils';
import { ShoppingCart, Download, Search, TrendingUp, DollarSign } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const AdminSales = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const { data: sales, isLoading } = useQuery({
    queryKey: ['admin-sales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          stores!inner(name),
          orders(order_number)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const { data: commissions } = useQuery({
    queryKey: ['admin-commissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_commissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const totalRevenue = sales?.reduce((sum, s) => sum + Number(s.amount), 0) || 0;
  const totalCommissions = commissions?.reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;

  const exportToCSV = (type: 'sales' | 'commissions') => {
    const data = type === 'sales' ? sales : commissions;
    if (!data) return;

    const csvContent = [
      type === 'sales'
        ? ['Date', 'Montant', 'Boutique', 'Commande', 'Statut'].join(',')
        : ['Date', 'Montant Total', 'Commission', 'Vendeur', 'Statut'].join(','),
      ...data.map((item: any) =>
        type === 'sales'
          ? [
              new Date(item.created_at).toLocaleDateString(),
              item.amount,
              item.store?.name || 'N/A',
              item.order?.order_number || 'N/A',
              item.status,
            ].join(',')
          : [
              new Date(item.created_at).toLocaleDateString(),
              item.total_amount,
              item.commission_amount,
              item.seller_amount,
              item.status,
            ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    toast({
      title: 'Export réussi',
      description: `Les données ont été exportées avec succès.`,
    });
  };

  const filteredSales = sales?.filter((sale: any) => {
    const storeName = sale.stores?.[0]?.name || '';
    const orderNumber = sale.orders?.[0]?.order_number || '';
    return storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           orderNumber.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="container mx-auto p-6 space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-6 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto p-6 space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Gestion des ventes
            </h1>
            <p className="text-muted-foreground mt-2">
              Suivi des ventes et commissions de la plateforme
            </p>
          </div>
          <ShoppingCart className="h-8 w-8 text-muted-foreground" />
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="hover-scale">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Revenu Total
              </CardTitle>
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {formatCurrency(totalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {sales?.length || 0} ventes
              </p>
            </CardContent>
          </Card>

          <Card className="hover-scale">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Commissions Totales
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-cyan-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyan-600">
                {formatCurrency(totalCommissions)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                10% de commission
              </p>
            </CardContent>
          </Card>

          <Card className="hover-scale">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Montant Vendeurs
              </CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(totalRevenue - totalCommissions)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Après commission
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="sales" className="space-y-4">
          <TabsList>
            <TabsTrigger value="sales">Ventes</TabsTrigger>
            <TabsTrigger value="commissions">Commissions</TabsTrigger>
          </TabsList>

          <TabsContent value="sales" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Liste des ventes</CardTitle>
                    <CardDescription>
                      Toutes les transactions effectuées
                    </CardDescription>
                  </div>
                  <Button onClick={() => exportToCSV('sales')} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Exporter CSV
                  </Button>
                </div>
                <div className="relative mt-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par boutique ou numéro de commande..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Commande</TableHead>
                      <TableHead>Boutique</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSales?.map((sale: any) => (
                      <TableRow key={sale.id}>
                        <TableCell>
                          {new Date(sale.created_at).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell className="font-medium">
                          {sale.orders?.[0]?.order_number || 'N/A'}
                        </TableCell>
                        <TableCell>{sale.stores?.[0]?.name || 'N/A'}</TableCell>
                        <TableCell className="font-bold">
                          {formatCurrency(sale.amount)}
                        </TableCell>
                        <TableCell className="text-cyan-600">
                          {formatCurrency(sale.commission_amount || 0)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={sale.status === 'completed' ? 'default' : 'secondary'}>
                            {sale.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredSales?.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    Aucune vente trouvée
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="commissions" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Commissions de la plateforme</CardTitle>
                    <CardDescription>
                      10% de commission sur chaque vente
                    </CardDescription>
                  </div>
                  <Button onClick={() => exportToCSV('commissions')} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Exporter CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Montant Total</TableHead>
                      <TableHead>Commission (10%)</TableHead>
                      <TableHead>Montant Vendeur</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commissions?.map((commission) => (
                      <TableRow key={commission.id}>
                        <TableCell>
                          {new Date(commission.created_at).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell className="font-bold">
                          {formatCurrency(commission.total_amount)}
                        </TableCell>
                        <TableCell className="font-bold text-cyan-600">
                          {formatCurrency(commission.commission_amount)}
                        </TableCell>
                        <TableCell className="text-blue-600">
                          {formatCurrency(commission.seller_amount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={commission.status === 'completed' ? 'default' : 'secondary'}>
                            {commission.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {commissions?.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    Aucune commission trouvée
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminSales;
