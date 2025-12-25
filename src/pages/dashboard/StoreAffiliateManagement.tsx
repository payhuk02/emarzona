/**
 * Page: StoreAffiliateManagement
 * Description: Page complète pour gérer les affiliés d'un store
 * Date: 31 Janvier 2025
 */
import { useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { StoreAffiliateDashboard } from '@/components/affiliate/StoreAffiliateDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TrendingUp,
  Users,
  DollarSign,
  Link as LinkIcon,
  ShoppingCart,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  Eye,
  Filter,
} from 'lucide-react';
import { useStoreAffiliates } from '@/hooks/useStoreAffiliates';
import { useStore } from '@/hooks/useStore';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { PaginationControls } from '@/components/affiliate/PaginationControls';
import { useState, useEffect } from 'react';

export default function StoreAffiliateManagement() {
  const { store, loading: storeLoading } = useStore();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [commissionStatusFilter, setCommissionStatusFilter] = useState<string>('all');
  
  // États de pagination
  const [linksPage, setLinksPage] = useState(1);
  const [linksPageSize, setLinksPageSize] = useState(20);
  const [commissionsPage, setCommissionsPage] = useState(1);
  const [commissionsPageSize, setCommissionsPageSize] = useState(20);

  // ⚠️ IMPORTANT: Tous les hooks doivent être appelés AVANT les retours conditionnels
  // pour respecter les règles des Hooks React
  const {
    links,
    linksPagination,
    linksLoading,
    commissions,
    commissionsPagination,
    commissionsLoading,
    approveCommission,
    rejectCommission,
    isLoading,
  } = useStoreAffiliates(store?.id || '', {
    links: { page: linksPage, pageSize: linksPageSize },
    commissions: { page: commissionsPage, pageSize: commissionsPageSize },
  });

  // Synchroniser les états de pagination avec les hooks
  // Ces hooks doivent être appelés AVANT les early returns
  useEffect(() => {
    if (linksPagination) {
      setLinksPage(linksPagination.page);
    }
  }, [linksPagination?.page]);

  useEffect(() => {
    if (commissionsPagination) {
      setCommissionsPage(commissionsPagination.page);
    }
  }, [commissionsPagination?.page]);

  if (storeLoading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <div className="flex-1 p-6">
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </SidebarProvider>
    );
  }

  if (!store) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <div className="flex-1 p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Vous devez avoir un store pour gérer les affiliés. Créez un store d'abord.
            </AlertDescription>
          </Alert>
        </div>
      </SidebarProvider>
    );
  }

  // Filtrer les commissions (filtrage côté client pour le statut)
  const filteredCommissions = commissions.filter((commission) => {
    return commissionStatusFilter === 'all' || commission.status === commissionStatusFilter;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof CheckCircle; label: string }> = {
      pending: { variant: 'outline', icon: Clock, label: 'En attente' },
      approved: { variant: 'default', icon: CheckCircle, label: 'Approuvée' },
      rejected: { variant: 'destructive', icon: XCircle, label: 'Rejetée' },
      paid: { variant: 'default', icon: CheckCircle, label: 'Payée' },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center">
            <SidebarTrigger />
            <div className="mr-4 hidden md:flex">
              <h1 className="text-lg font-semibold">Gestion des Affiliés</h1>
            </div>
          </div>
        </header>
        <main className="flex-1 container p-6 space-y-6 animate-fade-in">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent flex items-center gap-3">
              <TrendingUp className="h-8 w-8" />
              Gestion des Affiliés
            </h1>
            <p className="text-muted-foreground mt-2">
              Gérez les affiliés, les liens et les commissions de votre store
            </p>
          </div>

          {/* Onglets */}
          <Tabs defaultValue="affiliates" className="space-y-6">
            <TabsList>
              <TabsTrigger value="affiliates">
                <Users className="h-4 w-4 mr-2" />
                Affiliés
              </TabsTrigger>
              <TabsTrigger value="links">
                <LinkIcon className="h-4 w-4 mr-2" />
                Liens d'Affiliation
              </TabsTrigger>
              <TabsTrigger value="commissions">
                <DollarSign className="h-4 w-4 mr-2" />
                Commissions
              </TabsTrigger>
            </TabsList>

            {/* Onglet Affiliés */}
            <TabsContent value="affiliates" className="space-y-6">
              <StoreAffiliateDashboard storeId={store.id} />
            </TabsContent>

            {/* Onglet Liens */}
            <TabsContent value="links" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Liens d'Affiliation</CardTitle>
                  <CardDescription>
                    Liens d'affiliation créés par vos affiliés
                    {linksPagination && linksPagination.total > 0 && (
                      <span className="ml-2">
                        ({linksPagination.total} lien{linksPagination.total > 1 ? 's' : ''})
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {linksLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ) : links.length === 0 ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Aucun lien d'affiliation trouvé.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Produit</TableHead>
                            <TableHead>Affilié</TableHead>
                            <TableHead>Lien</TableHead>
                            <TableHead>Clics</TableHead>
                            <TableHead>Ventes</TableHead>
                            <TableHead>Revenus</TableHead>
                            <TableHead>Commissions</TableHead>
                            <TableHead>Statut</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {links.map((link) => (
                            <TableRow key={link.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {link.product?.image_url && (
                                    <img
                                      src={link.product.image_url}
                                      alt={link.product.name}
                                      className="h-10 w-10 rounded object-cover"
                                    />
                                  )}
                                  <div>
                                    <p className="font-medium">{link.product?.name || 'N/A'}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {link.product?.price?.toLocaleString('fr-FR')} XOF
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <p className="text-sm">{link.affiliate?.display_name || link.affiliate?.email || 'N/A'}</p>
                              </TableCell>
                              <TableCell>
                                <code className="text-xs bg-muted px-2 py-1 rounded break-all">
                                  {link.full_url}
                                </code>
                              </TableCell>
                              <TableCell>{link.total_clicks}</TableCell>
                              <TableCell>{link.total_sales}</TableCell>
                              <TableCell className="font-mono">
                                {link.total_revenue.toLocaleString('fr-FR')} XOF
                              </TableCell>
                              <TableCell className="font-mono">
                                {link.total_commission.toLocaleString('fr-FR')} XOF
                              </TableCell>
                              <TableCell>
                                <Badge variant={link.status === 'active' ? 'default' : 'secondary'}>
                                  {link.status === 'active' ? 'Actif' : 'Pausé'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      
                      {/* Pagination pour les liens */}
                      {linksPagination && linksPagination.totalPages > 1 && (
                        <div className="mt-6 pt-4 border-t px-6 pb-6">
                          <PaginationControls
                            {...linksPagination}
                            onPageChange={(page) => {
                              setLinksPage(page);
                            }}
                            onPageSizeChange={(size) => {
                              setLinksPageSize(size);
                              setLinksPage(1);
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Commissions */}
            <TabsContent value="commissions" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Commissions</CardTitle>
                      <CardDescription>
                        Gérer les commissions de vos affiliés
                        {commissionsPagination && commissionsPagination.total > 0 && (
                          <span className="ml-2">
                            ({commissionsPagination.total} commission{commissionsPagination.total > 1 ? 's' : ''})
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <Select value={commissionStatusFilter} onValueChange={setCommissionStatusFilter}>
                      <SelectTrigger className="w-40">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="approved">Approuvées</SelectItem>
                        <SelectItem value="rejected">Rejetées</SelectItem>
                        <SelectItem value="paid">Payées</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  {linksLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ) : filteredCommissions.length === 0 ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Aucune commission trouvée avec les filtres sélectionnés.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Produit</TableHead>
                            <TableHead>Affilié</TableHead>
                            <TableHead>Commande</TableHead>
                            <TableHead>Montant Commande</TableHead>
                            <TableHead>Taux</TableHead>
                            <TableHead>Commission</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredCommissions.map((commission) => (
                            <TableRow key={commission.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {commission.product?.image_url && (
                                    <img
                                      src={commission.product.image_url}
                                      alt={commission.product.name}
                                      className="h-10 w-10 rounded object-cover"
                                    />
                                  )}
                                  <p className="font-medium">{commission.product?.name || 'N/A'}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <p className="text-sm">{commission.affiliate?.display_name || commission.affiliate?.email || 'N/A'}</p>
                              </TableCell>
                              <TableCell>
                                <code className="text-xs bg-muted px-2 py-1 rounded">
                                  {commission.order?.order_number || 'N/A'}
                                </code>
                              </TableCell>
                              <TableCell className="font-mono">
                                {commission.order_total.toLocaleString('fr-FR')} XOF
                              </TableCell>
                              <TableCell>
                                {commission.commission_rate}%
                              </TableCell>
                              <TableCell className="font-mono font-bold">
                                {commission.commission_amount.toLocaleString('fr-FR')} XOF
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(commission.status)}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {format(new Date(commission.created_at), 'dd MMM yyyy', { locale: fr })}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {commission.status === 'pending' && (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => approveCommission.mutate(commission.id)}
                                        disabled={approveCommission.isPending}
                                      >
                                        {approveCommission.isPending ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          'Approuver'
                                        )}
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => rejectCommission.mutate(commission.id)}
                                        disabled={rejectCommission.isPending}
                                      >
                                        Rejeter
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </SidebarProvider>
  );
}







