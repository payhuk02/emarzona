/**
 * Page de Suivi Multi-Stores Checkout
 * Date: 31 Janvier 2025
 *
 * Interface pour suivre et gérer les paiements multi-stores
 * - Liste des commandes créées
 * - Statut de chaque paiement
 * - Redirection vers les paiements
 * - Gestion des erreurs
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ShoppingBag,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { logger } from '@/lib/logger';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface OrderInfo {
  orderId: string;
  storeId: string;
  orderNumber: string;
  checkoutUrl?: string;
  storeName?: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
}

export default function MultiStoreCheckoutTracking() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [isPageVisible, setIsPageVisible] = useState<boolean>(() =>
    typeof document !== 'undefined' ? document.visibilityState === 'visible' : true
  );

  useEffect(() => {
    const onVisibilityChange = () => setIsPageVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  // Récupérer les IDs de commande depuis l'URL
  const orderIdsParam = searchParams.get('orders');
  const orderIds = orderIdsParam ? orderIdsParam.split(',') : [];

  // Fetch orders
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['multi-store-orders', orderIds],
    queryFn: async (): Promise<OrderInfo[]> => {
      if (orderIds.length === 0) return [];

      const { data, error } = await supabase
        .from('orders')
        .select(
          `
          id,
          order_number,
          store_id,
          total_amount,
          payment_status,
          status,
          created_at,
          stores!inner (
            id,
            name
          )
        `
        )
        .in('id', orderIds);

      if (error) {
        logger.error('Error fetching orders', { error });
        throw error;
      }

      interface OrderData {
        id: string;
        store_id: string;
        order_number: string;
        total_amount: number;
        payment_status: string;
        status: string;
        created_at: string;
        stores?: { name: string };
      }
      return (data || []).map((order: OrderData) => ({
        orderId: order.id,
        storeId: order.store_id,
        orderNumber: order.order_number,
        storeName: order.stores?.name || 'Boutique inconnue',
        amount: order.total_amount,
        status:
          order.payment_status === 'completed'
            ? 'completed'
            : order.payment_status === 'failed'
              ? 'failed'
              : order.status === 'processing'
                ? 'processing'
                : 'pending',
        createdAt: order.created_at,
      }));
    },
    enabled: orderIds.length > 0,
    // Refetch auto uniquement quand l'onglet est visible (perf/batterie mobile)
    refetchInterval: isPageVisible ? 10000 : false,
  });

  // Fetch payment URLs from transactions
  const { data: paymentUrls } = useQuery({
    queryKey: ['payment-urls', orderIds],
    queryFn: async () => {
      if (orderIds.length === 0) return {};

      const { data, error } = await supabase
        .from('transactions')
        .select('order_id, checkout_url')
        .in('order_id', orderIds)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching payment URLs', { error });
        return {};
      }

      const  urls: Record<string, string> = {};
      interface TransactionData {
        order_id: string;
        checkout_url?: string;
      }
      (data || []).forEach((tx: TransactionData) => {
        if (tx.checkout_url && !urls[tx.order_id]) {
          urls[tx.order_id] = tx.checkout_url;
        }
      });

      return urls;
    },
    enabled: orderIds.length > 0,
  });

  // Combiner les données
  const ordersWithUrls = orders.map(order => ({
    ...order,
    checkoutUrl: paymentUrls?.[order.orderId],
  }));

  const handleGoToPayment = (checkoutUrl: string) => {
    if (checkoutUrl) {
      window.open(checkoutUrl, '_blank');
    } else {
      toast({
        title: 'Erreur',
        description: 'URL de paiement non disponible',
        variant: 'destructive',
      });
    }
  };

  const handleGoBack = () => {
    navigate('/cart');
  };

  const getStatusBadge = (status: OrderInfo['status']) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="default" className="bg-green-600">
            Payé
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="default" className="bg-blue-600">
            En traitement
          </Badge>
        );
      case 'failed':
        return <Badge variant="destructive">Échoué</Badge>;
      default:
        return <Badge variant="secondary">En attente</Badge>;
    }
  };

  const getStatusIcon = (status: OrderInfo['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  const completedCount = ordersWithUrls.filter(o => o.status === 'completed').length;
  const pendingCount = ordersWithUrls.filter(
    o => o.status === 'pending' || o.status === 'processing'
  ).length;
  const _failedCount = ordersWithUrls.filter(o => o.status === 'failed').length;
  const totalAmount = ordersWithUrls.reduce((sum, o) => sum + o.amount, 0);
  const paidAmount = ordersWithUrls
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + o.amount, 0);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-4 lg:p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <Button variant="ghost" onClick={handleGoBack} className="mb-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour au panier
                </Button>
                <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                  <ShoppingBag className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                  Suivi des Commandes Multi-Stores
                </h1>
                <p className="text-muted-foreground mt-2">
                  {ordersWithUrls.length} commande{ordersWithUrls.length > 1 ? 's' : ''} créée
                  {ordersWithUrls.length > 1 ? 's' : ''} pour{' '}
                  {new Set(ordersWithUrls.map(o => o.storeId)).size} boutique
                  {new Set(ordersWithUrls.map(o => o.storeId)).size > 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total</CardTitle>
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{ordersWithUrls.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Payées</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{completedCount}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">En attente</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Montant Total</CardTitle>
                  <span className="text-xs">💰</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {totalAmount.toLocaleString('fr-FR')} XOF
                  </div>
                  {paidAmount > 0 && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {paidAmount.toLocaleString('fr-FR')} XOF payé{paidAmount > 0 ? 's' : ''}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Alert */}
            {pendingCount > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {pendingCount} commande{pendingCount > 1 ? 's' : ''} en attente de paiement.
                  Cliquez sur "Payer" pour chaque commande pour finaliser votre achat.
                </AlertDescription>
              </Alert>
            )}

            {/* Orders List */}
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : ordersWithUrls.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucune commande trouvée</p>
                  <Button onClick={handleGoBack} className="mt-4">
                    Retour au panier
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {ordersWithUrls.map(order => (
                  <Card key={order.orderId}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(order.status)}
                          <div>
                            <CardTitle className="text-lg">{order.storeName}</CardTitle>
                            <CardDescription>Commande {order.orderNumber}</CardDescription>
                          </div>
                        </div>
                        {getStatusBadge(order.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground">Montant</div>
                            <div className="font-semibold">
                              {order.amount.toLocaleString('fr-FR')} XOF
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Créée le</div>
                            <div className="font-semibold">
                              {format(new Date(order.createdAt), 'dd MMM yyyy HH:mm', {
                                locale: fr,
                              })}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Statut</div>
                            <div className="font-semibold capitalize">{order.status}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Boutique</div>
                            <div className="font-semibold truncate">{order.storeName}</div>
                          </div>
                        </div>

                        {order.status !== 'completed' && order.checkoutUrl && (
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleGoToPayment(order.checkoutUrl!)}
                              className="flex-1"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Payer cette commande
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => navigate(`/account/orders/${order.orderId}`)}
                            >
                              Voir détails
                            </Button>
                          </div>
                        )}

                        {order.status === 'completed' && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              onClick={() => navigate(`/account/orders/${order.orderId}`)}
                              className="flex-1"
                            >
                              Voir la commande
                            </Button>
                          </div>
                        )}

                        {order.status === 'failed' && (
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              Le paiement de cette commande a échoué. Veuillez réessayer.
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Actions */}
            {pendingCount > 0 && (
              <Card>
                <CardContent className="py-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold mb-1">Commandes en attente</h3>
                      <p className="text-sm text-muted-foreground">
                        {pendingCount} commande{pendingCount > 1 ? 's' : ''} nécessite
                        {pendingCount > 1 ? 'nt' : ''} un paiement
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        const firstPending = ordersWithUrls.find(
                          o => o.status === 'pending' && o.checkoutUrl
                        );
                        if (firstPending?.checkoutUrl) {
                          handleGoToPayment(firstPending.checkoutUrl);
                        } else {
                          toast({
                            title: 'Aucun paiement disponible',
                            description: 'Toutes les commandes sont déjà payées ou en traitement',
                          });
                        }
                      }}
                      disabled={!ordersWithUrls.some(o => o.status === 'pending' && o.checkoutUrl)}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Payer la première commande
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}






