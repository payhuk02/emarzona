/**
 * Page: StoreAffiliates
 * Description: Dashboard des affiliés pour un vendeur
 * Date: 25/10/2025
 */

import { useState } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStore } from '@/hooks/useStore';
import { useAffiliateLinks } from '@/hooks/useAffiliateLinks';
import { useAffiliateCommissions, usePendingCommissions } from '@/hooks/useAffiliateCommissions';
import { useStoreAffiliateProducts } from '@/hooks/useProductAffiliateSettings';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  MousePointerClick,
  ShoppingCart,
  Link as LinkIcon,
  Search,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Ban
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';

const StoreAffiliates = () => {
  const { store, loading: storeLoading } = useStore();
  const { products, loading: productsLoading } = useStoreAffiliateProducts(store?.id);
  const { links, loading: linksLoading } = useAffiliateLinks(undefined, { store_id: store?.id });
  const { commissions, stats, loading: commissionsLoading } = useAffiliateCommissions({ store_id: store?.id });
  const { pending, loading: pendingLoading } = usePendingCommissions(store?.id);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  if (storeLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 p-6">
            <Skeleton className="h-12 w-64 mb-6" />
            <div className="grid gap-6 md:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (!store) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 p-6">
            <Card>
              <CardContent className="pt-6">
                <p>Aucune boutique trouvée</p>
              </CardContent>
            </Card>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  const filteredCommissions = commissions.filter((c) => {
    const matchesSearch = searchTerm === '' || 
      c.affiliate?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.order?.order_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Regrouper les affiliés par performance
  const affiliatePerformance = links.reduce((acc, link) => {
    const affiliateId = link.affiliate_id;
    if (!acc[affiliateId]) {
      acc[affiliateId] = {
        affiliate: link.affiliate,
        total_clicks: 0,
        total_sales: 0,
        total_revenue: 0,
        total_commission: 0,
        links_count: 0,
      };
    }
    acc[affiliateId].total_clicks += link.total_clicks;
    acc[affiliateId].total_sales += link.total_sales;
    acc[affiliateId].total_revenue += link.total_revenue;
    acc[affiliateId].total_commission += link.total_commission;
    acc[affiliateId].links_count += 1;
    return acc;
  }, {} as Record<string, any>);

  const topAffiliates = Object.values(affiliatePerformance)
    .sort((a: any, b: any) => b.total_revenue - a.total_revenue)
    .slice(0, 10);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold">Programme d'affiliation</h1>
            <p className="text-muted-foreground mt-2">
              Gérez vos affiliés et suivez leurs performances
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-4">
            <Card className="hover-scale">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Produits avec affiliation
                </CardTitle>
                <ShoppingCart className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {productsLoading ? '...' : products.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Produits disponibles
                </p>
              </CardContent>
            </Card>

            <Card className="hover-scale">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Affiliés actifs
                </CardTitle>
                <Users className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">
                  {linksLoading ? '...' : Object.keys(affiliatePerformance).length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Créant du contenu
                </p>
              </CardContent>
            </Card>

            <Card className="hover-scale">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Ventes générées
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {commissionsLoading ? '...' : stats?.total_sales || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Via affiliation
                </p>
              </CardContent>
            </Card>

            <Card className="hover-scale">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Commissions versées
                </CardTitle>
                <DollarSign className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {commissionsLoading ? '...' : formatCurrency(stats?.total_commission_paid || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total payé
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs Content */}
          <Tabs defaultValue="affiliates" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="affiliates">Top Affiliés</TabsTrigger>
              <TabsTrigger value="products">Produits</TabsTrigger>
              <TabsTrigger value="commissions">
                Commissions
                {pending.length > 0 && (
                  <Badge variant="destructive" className="ml-2">{pending.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="links">Liens actifs</TabsTrigger>
            </TabsList>

            {/* Top Affiliés */}
            <TabsContent value="affiliates" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Meilleurs affiliés</CardTitle>
                  <CardDescription>
                    Classement par chiffre d'affaires généré
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {topAffiliates.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>Aucun affilié actif pour le moment</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Affilié</TableHead>
                          <TableHead className="text-right">Clics</TableHead>
                          <TableHead className="text-right">Ventes</TableHead>
                          <TableHead className="text-right">CA généré</TableHead>
                          <TableHead className="text-right">Commissions</TableHead>
                          <TableHead className="text-right">Conversion</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topAffiliates.map((aff: any, index) => {
                          const conversionRate = aff.total_clicks > 0 
                            ? ((aff.total_sales / aff.total_clicks) * 100).toFixed(1) 
                            : '0';
                          
                          return (
                            <TableRow key={index}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                                    {index + 1}
                                  </div>
                                  <div>
                                    <p className="font-medium">{aff.affiliate?.display_name || 'N/A'}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {aff.links_count} {aff.links_count > 1 ? 'liens' : 'lien'}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">{aff.total_clicks}</TableCell>
                              <TableCell className="text-right font-semibold">{aff.total_sales}</TableCell>
                              <TableCell className="text-right font-bold text-primary">
                                {formatCurrency(aff.total_revenue)}
                              </TableCell>
                              <TableCell className="text-right text-orange-600 font-semibold">
                                {formatCurrency(aff.total_commission)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge variant={parseFloat(conversionRate) > 2 ? 'default' : 'outline'}>
                                  {conversionRate}%
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Produits */}
            <TabsContent value="products" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Produits avec affiliation</CardTitle>
                  <CardDescription>
                    Liste de vos produits disponibles pour l'affiliation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {productsLoading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-20" />
                      ))}
                    </div>
                  ) : products.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>Aucun produit avec affiliation activée</p>
                      <p className="text-sm mt-2">
                        Activez l'affiliation depuis la page de modification de produit
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {products.map((product) => (
                        <Card key={product.id} className="overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                {product.product?.image_url && (
                                  <img
                                    src={product.product.image_url}
                                    alt={product.product.name}
                                    className="w-16 h-16 object-cover rounded"
                                  />
                                )}
                                <div>
                                  <h4 className="font-semibold">{product.product?.name}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    Commission : {product.commission_rate}% • Cookie : {product.cookie_duration_days} jours
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge variant="outline" className="mb-2">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Actif
                                </Badge>
                                <p className="text-sm font-semibold">{formatCurrency(product.product?.price || 0)}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Commissions */}
            <TabsContent value="commissions" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Commissions d'affiliation</CardTitle>
                      <CardDescription>
                        Historique des commissions versées à vos affiliés
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Rechercher..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 w-64"
                        />
                      </div>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les statuts</SelectItem>
                          <SelectItem value="pending">En attente</SelectItem>
                          <SelectItem value="approved">Approuvé</SelectItem>
                          <SelectItem value="paid">Payé</SelectItem>
                          <SelectItem value="rejected">Rejeté</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {commissionsLoading ? (
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-16" />
                      ))}
                    </div>
                  ) : filteredCommissions.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>Aucune commission trouvée</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Affilié</TableHead>
                          <TableHead>Produit</TableHead>
                          <TableHead>Commande</TableHead>
                          <TableHead className="text-right">Montant vente</TableHead>
                          <TableHead className="text-right">Commission</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead className="text-right">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCommissions.map((commission) => (
                          <TableRow key={commission.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{commission.affiliate?.display_name || 'N/A'}</p>
                                <p className="text-xs text-muted-foreground">{commission.affiliate?.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>{commission.product?.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{commission.order?.order_number}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatCurrency(commission.order_total)}
                            </TableCell>
                            <TableCell className="text-right font-bold text-orange-600">
                              {formatCurrency(commission.commission_amount)}
                            </TableCell>
                            <TableCell>
                              {commission.status === 'pending' && (
                                <Badge variant="outline" className="gap-1">
                                  <Clock className="h-3 w-3" />
                                  En attente
                                </Badge>
                              )}
                              {commission.status === 'approved' && (
                                <Badge variant="secondary" className="gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Approuvé
                                </Badge>
                              )}
                              {commission.status === 'paid' && (
                                <Badge className="gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Payé
                                </Badge>
                              )}
                              {commission.status === 'rejected' && (
                                <Badge variant="destructive" className="gap-1">
                                  <Ban className="h-3 w-3" />
                                  Rejeté
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right text-sm text-muted-foreground">
                              {new Date(commission.created_at).toLocaleDateString('fr-FR')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Liens actifs */}
            <TabsContent value="links" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Liens d'affiliation actifs</CardTitle>
                  <CardDescription>
                    Tous les liens créés par les affiliés pour vos produits
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {linksLoading ? (
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-20" />
                      ))}
                    </div>
                  ) : links.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <LinkIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>Aucun lien d'affiliation créé</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Affilié</TableHead>
                          <TableHead>Produit</TableHead>
                          <TableHead className="text-right">Clics</TableHead>
                          <TableHead className="text-right">Ventes</TableHead>
                          <TableHead className="text-right">CA</TableHead>
                          <TableHead className="text-right">Commission</TableHead>
                          <TableHead>Statut</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {links.map((link) => (
                          <TableRow key={link.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{link.affiliate?.display_name || 'N/A'}</p>
                                <p className="text-xs text-muted-foreground">{link.affiliate?.affiliate_code}</p>
                              </div>
                            </TableCell>
                            <TableCell>{link.product?.name}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <MousePointerClick className="h-3 w-3" />
                                {link.total_clicks}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-semibold">{link.total_sales}</TableCell>
                            <TableCell className="text-right">{formatCurrency(link.total_revenue)}</TableCell>
                            <TableCell className="text-right font-semibold text-orange-600">
                              {formatCurrency(link.total_commission)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={link.status === 'active' ? 'default' : 'secondary'}>
                                {link.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default StoreAffiliates;

