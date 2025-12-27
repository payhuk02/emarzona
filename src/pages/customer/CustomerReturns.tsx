/**
 * Page de Gestion des Retours Client
 * Date: 31 Janvier 2025
 *
 * Interface complète pour que les clients puissent :
 * - Demander des retours
 * - Suivre leurs retours
 * - Voir l'historique
 * - Télécharger les étiquettes de retour
 */

import { useState, useMemo } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Package,
  PackageX,
  RefreshCw,
  FileText,
  Download,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Truck,
  CreditCard,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import type { ProductReturn } from '@/hooks/physical/useReturns';

export default function CustomerReturns() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [selectedTab, setSelectedTab] = useState<'requests' | 'history'>('requests');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState<string>('');
  const [returnDetails, setReturnDetails] = useState<string>('');
  const [returnType, setReturnType] = useState<'refund' | 'exchange' | 'store_credit'>('refund');

  // Fetch user orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['customer-orders-for-returns', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('orders')
        .select(
          `
          *,
          order_items (
            id,
            product_id,
            product_name,
            product_type,
            quantity,
            unit_price,
            total_price,
            products (
              id,
              name,
              image_url
            )
          )
        `
        )
        .eq('customer_id', user.id)
        .eq('status', 'delivered')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        logger.error('Error fetching orders', { error });
        throw error;
      }

      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch user returns
  const { data: returns = [], isLoading: returnsLoading } = useQuery({
    queryKey: ['customer-returns', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('product_returns')
        .select(
          `
          *,
          order_items (
            id,
            product_name,
            product_image_url,
            quantity,
            unit_price
          ),
          orders (
            id,
            order_number,
            created_at
          )
        `
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching returns', { error });
        throw error;
      }

      return data || [];
    },
    enabled: !!user?.id,
  });

  // Create return mutation
  const createReturn = useMutation({
    mutationFn: async (data: {
      order_id: string;
      order_item_id: string;
      return_reason: string;
      return_reason_details?: string;
      return_type: 'refund' | 'exchange' | 'store_credit';
      quantity: number;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Generate return number
      const returnNumber = `RMA-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const { data: returnData, error } = await supabase
        .from('product_returns')
        .insert({
          order_id: data.order_id,
          order_item_id: data.order_item_id,
          user_id: user.id,
          return_number: returnNumber,
          return_reason: data.return_reason,
          return_reason_details: data.return_reason_details,
          return_type: data.return_type,
          quantity: data.quantity,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating return', { error });
        throw error;
      }

      return returnData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-returns'] });
      setIsCreateDialogOpen(false);
      setSelectedOrder(null);
      setReturnReason('');
      setReturnDetails('');
      toast({
        title: '✅ Demande de retour créée',
        description: 'Votre demande de retour a été soumise avec succès',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: '❌ Erreur',
        description: errorMessage || 'Impossible de créer la demande de retour',
        variant: 'destructive',
      });
    },
  });

  // Get status badge
  const getStatusBadge = (status: string) => {
    type IconComponent = React.ComponentType<{ className?: string }>;
    const  statusConfig: Record<
      string,
      {
        label: string;
        variant: 'default' | 'secondary' | 'destructive' | 'outline';
        icon: IconComponent;
      }
    > = {
      pending: { label: 'En attente', variant: 'secondary', icon: Clock },
      approved: { label: 'Approuvé', variant: 'default', icon: CheckCircle2 },
      rejected: { label: 'Rejeté', variant: 'destructive', icon: XCircle },
      return_shipped: { label: 'Expédié', variant: 'default', icon: Truck },
      return_received: { label: 'Reçu', variant: 'default', icon: Package },
      inspecting: { label: 'En inspection', variant: 'secondary', icon: AlertCircle },
      refund_processing: { label: 'Remboursement en cours', variant: 'default', icon: RefreshCw },
      refunded: { label: 'Remboursé', variant: 'default', icon: CreditCard },
      store_credit_issued: { label: 'Crédit émis', variant: 'default', icon: CheckCircle2 },
      exchange_processing: { label: 'Échange en cours', variant: 'default', icon: RefreshCw },
      exchanged: { label: 'Échangé', variant: 'default', icon: CheckCircle2 },
      cancelled: { label: 'Annulé', variant: 'destructive', icon: XCircle },
    };

    const config = statusConfig[status] || {
      label: status,
      variant: 'secondary' as const,
      icon: AlertCircle,
    };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // Get return reason label
  const getReturnReasonLabel = (reason: string) => {
    const  labels: Record<string, string> = {
      defective: 'Produit défectueux',
      wrong_item: 'Mauvais article',
      not_as_described: 'Ne correspond pas à la description',
      damaged: 'Article endommagé',
      size_issue: 'Problème de taille',
      color_issue: 'Problème de couleur',
      changed_mind: "Changement d'avis",
      duplicate: 'Commande en double',
      other: 'Autre',
    };
    return labels[reason] || reason;
  };

  // Animations
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();

  // Stats
  const stats = useMemo(() => {
    return {
      total: returns.length,
      pending: returns.filter((r: ProductReturn) => r.status === 'pending').length,
      approved: returns.filter((r: ProductReturn) => r.status === 'approved').length,
      refunded: returns.filter((r: ProductReturn) => r.status === 'refunded').length,
    };
  }, [returns]);

  // Filter orders that can be returned (delivered within return window)
  type OrderWithDelivery = {
    delivered_at?: string;
    created_at: string;
  };
  const returnableOrders = useMemo(() => {
    return orders.filter((order: OrderWithDelivery) => {
      // Check if order was delivered within last 30 days (default return window)
      const deliveredDate = new Date(order.delivered_at || order.created_at);
      const daysSinceDelivery = (Date.now() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceDelivery <= 30;
    });
  }, [orders]);

  if (ordersLoading || returnsLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-4 lg:p-6 space-y-6">
              <Skeleton className="h-12 w-full" />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
              <Skeleton className="h-96 w-full" />
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Header */}
            <div
              ref={headerRef}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
            >
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2 mb-1 sm:mb-2">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/5 backdrop-blur-sm border border-blue-500/20">
                    <PackageX className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
                  </div>
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Mes Retours
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Gérez vos demandes de retour et suivez leur statut
                </p>
              </div>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau retour
              </Button>
            </div>

            {/* Stats */}
            <div
              ref={statsRef}
              className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total</CardTitle>
                  <PackageX className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">En attente</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold text-yellow-600">
                    {stats.pending}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Approuvés</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold text-green-600">
                    {stats.approved}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Remboursés</CardTitle>
                  <CreditCard className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold text-blue-600">
                    {stats.refunded}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs
              value={selectedTab}
              onValueChange={v => setSelectedTab(v as 'requests' | 'history')}
            >
              <TabsList>
                <TabsTrigger value="requests">
                  <PackageX className="h-4 w-4 mr-2" />
                  Mes retours ({returns.length})
                </TabsTrigger>
                <TabsTrigger value="history">
                  <FileText className="h-4 w-4 mr-2" />
                  Historique
                </TabsTrigger>
              </TabsList>

              <TabsContent value="requests" className="space-y-4">
                {returns.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <PackageX className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">Aucun retour pour le moment</p>
                      <Button onClick={() => setIsCreateDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Demander un retour
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {returns.map((returnItem: ProductReturn) => (
                      <Card key={returnItem.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">
                                Retour {returnItem.return_number}
                              </CardTitle>
                              <CardDescription>
                                Commande {returnItem.orders?.order_number || 'N/A'} -{' '}
                                {format(new Date(returnItem.created_at), 'dd MMM yyyy', {
                                  locale: fr,
                                })}
                              </CardDescription>
                            </div>
                            {getStatusBadge(returnItem.status)}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label className="text-muted-foreground">Produit</Label>
                                <p className="font-medium">
                                  {returnItem.order_items?.product_name || 'N/A'}
                                </p>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">Raison</Label>
                                <p className="font-medium">
                                  {getReturnReasonLabel(returnItem.return_reason)}
                                </p>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">Quantité</Label>
                                <p className="font-medium">{returnItem.quantity}</p>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">Type</Label>
                                <p className="font-medium capitalize">{returnItem.return_type}</p>
                              </div>
                            </div>

                            {returnItem.return_tracking_number && (
                              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                                <Truck className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <Label className="text-muted-foreground">Numéro de suivi</Label>
                                  <p className="font-medium">{returnItem.return_tracking_number}</p>
                                </div>
                              </div>
                            )}

                            {returnItem.refund_amount && (
                              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                                <CreditCard className="h-4 w-4 text-green-600" />
                                <div>
                                  <Label className="text-muted-foreground">Montant remboursé</Label>
                                  <p className="font-medium text-green-600">
                                    {Number(returnItem.refund_amount).toLocaleString('fr-FR')} XOF
                                  </p>
                                </div>
                              </div>
                            )}

                            {returnItem.return_reason_details && (
                              <div>
                                <Label className="text-muted-foreground">Détails</Label>
                                <p className="text-sm">{returnItem.return_reason_details}</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Historique complet</CardTitle>
                    <CardDescription>Tous vos retours passés</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {returns.map((returnItem: ProductReturn) => (
                        <div
                          key={returnItem.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{returnItem.return_number}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(returnItem.created_at), 'dd MMM yyyy', {
                                locale: fr,
                              })}
                            </p>
                          </div>
                          {getStatusBadge(returnItem.status)}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Create Return Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Demander un retour</DialogTitle>
                  <DialogDescription>
                    Sélectionnez une commande et remplissez les informations nécessaires
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="order">Commande</Label>
                    <Select value={selectedOrder || ''} onValueChange={setSelectedOrder}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une commande" />
                      </SelectTrigger>
                      <SelectContent>
                        {returnableOrders.map(order => {
                          type OrderWithItems = {
                            id: string;
                            order_number: string;
                            created_at: string;
                            delivered_at?: string;
                            order_items?: Array<{ product_id: string; product_name?: string }>;
                          };
                          const orderTyped = order as OrderWithItems;
                          return (
                            <SelectItem key={orderTyped.id} value={orderTyped.id}>
                              {orderTyped.order_number} -{' '}
                              {format(new Date(orderTyped.created_at), 'dd MMM yyyy', {
                                locale: fr,
                              })}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedOrder && (
                    <>
                      <div>
                        <Label htmlFor="reason">Raison du retour</Label>
                        <Select value={returnReason} onValueChange={setReturnReason}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une raison" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="defective">Produit défectueux</SelectItem>
                            <SelectItem value="wrong_item">Mauvais article</SelectItem>
                            <SelectItem value="not_as_described">
                              Ne correspond pas à la description
                            </SelectItem>
                            <SelectItem value="damaged">Article endommagé</SelectItem>
                            <SelectItem value="size_issue">Problème de taille</SelectItem>
                            <SelectItem value="color_issue">Problème de couleur</SelectItem>
                            <SelectItem value="changed_mind">Changement d'avis</SelectItem>
                            <SelectItem value="duplicate">Commande en double</SelectItem>
                            <SelectItem value="other">Autre</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="type">Type de retour</Label>
                        <Select
                          value={returnType}
                          onValueChange={v =>
                            setReturnType(v as 'refund' | 'exchange' | 'store_credit')
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="refund">Remboursement</SelectItem>
                            <SelectItem value="exchange">Échange</SelectItem>
                            <SelectItem value="store_credit">Crédit boutique</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="details">Détails supplémentaires</Label>
                        <Textarea
                          id="details"
                          value={returnDetails}
                          onChange={e => setReturnDetails(e.target.value)}
                          placeholder="Décrivez le problème en détail..."
                          rows={4}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setIsCreateDialogOpen(false)}
                          className="flex-1"
                        >
                          Annuler
                        </Button>
                        <Button
                          onClick={() => {
                            type OrderWithItems = {
                              id: string;
                              order_number: string;
                              created_at: string;
                              delivered_at?: string;
                              order_items?: Array<{ product_id: string; product_name?: string }>;
                            };
                            const order = returnableOrders.find(
                              (o: OrderWithItems) => o.id === selectedOrder
                            );
                            if (!order || !order.order_items || order.order_items.length === 0) {
                              toast({
                                title: 'Erreur',
                                description: 'Commande invalide',
                                variant: 'destructive',
                              });
                              return;
                            }

                            createReturn.mutate({
                              order_id: selectedOrder!,
                              order_item_id: order.order_items[0].id,
                              return_reason: returnReason,
                              return_reason_details: returnDetails || undefined,
                              return_type: returnType,
                              quantity: order.order_items[0].quantity || 1,
                            });
                          }}
                          disabled={!returnReason || createReturn.isPending}
                          className="flex-1"
                        >
                          {createReturn.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Envoi...
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-2" />
                              Créer la demande
                            </>
                          )}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}






