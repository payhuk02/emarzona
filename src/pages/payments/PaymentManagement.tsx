/**
 * Payment Management Page - Advanced Payments
 * Date: 28 octobre 2025
 *
 * Gestion paiements avancés: pourcentage, escrow/delivery_secured
 * Features: Release payments, confirm delivery, partial payments tracking
 */

import React, { useState, useMemo } from 'react';
import { AppPageShell } from '@/components/layout/AppPageShell';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { LucideIcon } from 'lucide-react';
import {
  CreditCard,
  Percent,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  Calendar,
  ArrowLeft,
  Unlock,
  Lock,
  Loader2,
  TrendingUp,
  Package,
  User,
  Store,
} from 'lucide-react';
import { useAdvancedPayments } from '@/hooks/useAdvancedPayments';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/hooks/useStore';
import { useStoreContext } from '@/contexts/StoreContext';
import {
  advancedPaymentFromOrder,
  isSyntheticOrderPaymentId,
  orderIdFromSyntheticPaymentId,
  type PaymentManagementOrder,
} from '@/lib/payments/payment-management-orders';
import { releaseOrderSecuredPayment } from '@/lib/payments/release-order-secured-payment';
import { approveServiceProjectDelivery } from '@/lib/payments/service-order-milestone-flow';
import { format } from 'date-fns';
import { logger } from '@/lib/logger';
import { fr } from 'date-fns/locale';
import type { AdvancedPayment } from '@/types/advanced-features';
import { useServiceOrderMilestones } from '@/hooks/service/useServiceOrderMilestones';
import { ServiceProjectMilestoneTimeline } from '@/components/service/ServiceProjectMilestoneTimeline';
import { ServiceProjectOrderSummary } from '@/components/service/ServiceProjectOrderSummary';
import { parseServiceProjectOrderMetadata } from '@/lib/service/service-project-order-summary';
import { computeServiceProjectMilestoneAmounts } from '@/lib/service/service-project-milestones';
import { orderHasProjectMilestones } from '@/lib/payments/service-order-milestone-flow';

export default function PaymentManagement() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { store } = useStore();
  const { selectedStoreId, selectedStore } = useStoreContext();

  const storeId = store?.id ?? selectedStore?.id ?? selectedStoreId ?? undefined;

  const { data: order, isLoading: orderLoading } = useQuery({
    queryKey: ['payment-management-order', orderId, storeId],
    enabled: !!orderId,
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select(
          `
          *,
          customers ( id, name, email ),
          order_items ( id, product_name, product_type, quantity, unit_price, total_price, item_metadata )
        `
        )
        .eq('id', orderId!);

      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) throw error;
      return data as PaymentManagementOrder | null;
    },
  });

  const effectiveStoreId = storeId ?? order?.store_id ?? undefined;

  const { payments, loading, stats, releasePayment } = useAdvancedPayments(effectiveStoreId);
  const { data: orderMilestones = [] } = useServiceOrderMilestones(orderId);

  const orderMetadata =
    order?.metadata && typeof order.metadata === 'object' && !Array.isArray(order.metadata)
      ? (order.metadata as Record<string, unknown>)
      : {};
  const hasProjectMilestones =
    orderMilestones.length > 0 || orderHasProjectMilestones(orderMetadata);
  const milestoneBalanceDue =
    hasProjectMilestones &&
    orderMilestones.some(
      row => row.trigger_type === 'delivery_approved' && row.status === 'awaiting_payment'
    );

  const milestoneTimeline = useMemo(() => {
    if (!hasProjectMilestones || orderMilestones.length === 0) return null;
    const total = Number(order?.total_amount) || 0;
    return computeServiceProjectMilestoneAmounts(
      total,
      orderMilestones.map(row => ({
        id: row.id,
        label: row.label,
        percentage: Number(row.percentage),
        trigger: row.trigger_type === 'delivery_approved' ? 'delivery_approved' : 'order_placed',
      }))
    );
  }, [hasProjectMilestones, orderMilestones, order?.total_amount]);

  const projectOrderItem = useMemo(() => {
    const items = order?.order_items ?? [];
    return items.find(
      item =>
        item.product_type === 'service' &&
        parseServiceProjectOrderMetadata((item as { item_metadata?: unknown }).item_metadata) !=
          null
    );
  }, [order?.order_items]);

  const [selectedPayment, setSelectedPayment] = useState<AdvancedPayment | null>(null);
  const [showReleaseDialog, setShowReleaseDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const orderPayments = useMemo(() => {
    const fromPayments = orderId ? payments.filter(p => p.order_id === orderId) : payments;
    if (orderId && fromPayments.length === 0 && order) {
      return [advancedPaymentFromOrder(order)];
    }
    return fromPayments;
  }, [payments, orderId, order]);

  const partialPayments = orderPayments.filter(p => p.payment_type === 'percentage');
  const securedPayments = orderPayments.filter(
    p => p.payment_type === 'delivery_secured' || p.is_held
  );

  const releaseSelectedPayment = async (releasedBy: string) => {
    if (!selectedPayment) return;

    if (isSyntheticOrderPaymentId(selectedPayment.id)) {
      await releaseOrderSecuredPayment(orderIdFromSyntheticPaymentId(selectedPayment.id));
      await queryClient.invalidateQueries({ queryKey: ['payment-management-orders'] });
      await queryClient.invalidateQueries({ queryKey: ['payment-management-order', orderId] });
      await queryClient.invalidateQueries({ queryKey: ['service-order-milestones', orderId] });
      await queryClient.invalidateQueries({ queryKey: ['advanced-payments'] });
      return;
    }

    if (hasProjectMilestones && orderId) {
      await approveServiceProjectDelivery(orderId);
    }

    const result = await releasePayment(selectedPayment.id, releasedBy);
    if (!result.success) {
      throw new Error(result.error || 'Impossible de libérer le paiement');
    }

    await queryClient.invalidateQueries({ queryKey: ['service-order-milestones', orderId] });
    await queryClient.invalidateQueries({ queryKey: ['payment-management-order', orderId] });
  };

  /**
   * Handle release secured payment
   */
  const handleReleasePayment = async () => {
    if (!selectedPayment) return;

    try {
      setIsProcessing(true);
      await releaseSelectedPayment('delivery_confirmed');

      toast({
        title: '✅ Paiement relâché',
        description: 'Le paiement a été transféré au vendeur',
      });

      setShowReleaseDialog(false);
      setSelectedPayment(null);
    } catch (_error: unknown) {
      const errorMessage = _error instanceof Error ? _error.message : String(_error);
      logger.error('Release payment error', { error: _error, paymentId: selectedPayment.id });
      toast({
        title: 'Erreur',
        description: errorMessage || 'Impossible de relâcher le paiement',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handle confirm delivery (customer)
   */
  const handleConfirmDelivery = async () => {
    if (!selectedPayment) return;

    try {
      setIsProcessing(true);
      await releaseSelectedPayment('customer_confirmed');

      await queryClient.invalidateQueries({ queryKey: ['service-order-milestones', orderId] });
      await queryClient.invalidateQueries({ queryKey: ['payment-management-order', orderId] });

      toast({
        title: '✅ Livraison confirmée',
        description: 'Le paiement sera transféré au vendeur',
      });

      setShowConfirmDialog(false);
      setSelectedPayment(null);
    } catch (_error: unknown) {
      const errorMessage = _error instanceof Error ? _error.message : String(_error);
      logger.error('Confirm delivery error', { error: _error, paymentId: selectedPayment.id });
      toast({
        title: 'Erreur',
        description: errorMessage || 'Impossible de confirmer la livraison',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Format currency
   */
  const formatCurrency = (amount: number, currency: string = 'XOF') => {
    return `${amount.toLocaleString()} ${currency}`;
  };

  const canManageEscrow = (payment: AdvancedPayment) =>
    payment.status === 'held' ||
    (payment.payment_type === 'delivery_secured' &&
      payment.status !== 'completed' &&
      payment.status !== 'released');

  /**
   * Get payment status badge
   */
  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      {
        variant: 'default' | 'secondary' | 'destructive' | 'outline';
        icon: LucideIcon;
        label: string;
      }
    > = {
      pending: { variant: 'secondary', icon: Clock, label: 'En attente' },
      completed: { variant: 'default', icon: CheckCircle, label: 'Complété' },
      held: { variant: 'destructive', icon: Lock, label: 'Retenu' },
      released: { variant: 'default', icon: Unlock, label: 'Relâché' },
      failed: { variant: 'destructive', icon: XCircle, label: 'Échoué' },
      disputed: { variant: 'destructive', icon: AlertCircle, label: 'Litige' },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading || orderLoading) {
    return (
      <AppPageShell mainClassName="overflow-x-hidden">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Chargement des paiements...</p>
            </div>
          </div>
        </div>
      </AppPageShell>
    );
  }

  if (orderId && !order) {
    return (
      <AppPageShell mainClassName="overflow-x-hidden">
        <div className="container mx-auto p-6 max-w-lg">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard/payment-management')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <Card>
            <CardContent className="pt-6 text-center space-y-3">
              <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">Commande introuvable ou accès refusé.</p>
            </CardContent>
          </Card>
        </div>
      </AppPageShell>
    );
  }

  return (
    <AppPageShell mainClassName="overflow-x-hidden">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard/payment-management')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <CreditCard className="h-8 w-8 text-primary" />
                Gestion Paiements
              </h1>
              <p className="text-muted-foreground mt-1">
                {order?.order_number
                  ? `Commande ${order.order_number}`
                  : 'Paiements avancés, escrow et paiements partiels'}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Paiements</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orderPayments.length}</div>
              <p className="text-xs text-muted-foreground">Tous types confondus</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Montants Retenus</CardTitle>
              <Lock className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats?.totalHeld || 0}</div>
              <p className="text-xs text-muted-foreground">XOF en escrow</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paiements Partiels</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{partialPayments.length}</div>
              <p className="text-xs text-muted-foreground">En pourcentage</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paiements Sécurisés</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{securedPayments.length}</div>
              <p className="text-xs text-muted-foreground">À la livraison</p>
            </CardContent>
          </Card>
        </div>

        {projectOrderItem && (
          <ServiceProjectOrderSummary
            className="mb-6"
            currency={order?.currency || 'XOF'}
            itemMetadata={(projectOrderItem as { item_metadata?: unknown }).item_metadata}
          />
        )}

        {hasProjectMilestones && milestoneTimeline && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-yellow-600" />
                Jalons de paiement projet
              </CardTitle>
              <CardDescription>
                Paiement sécurisé en plusieurs étapes pour cette commande service
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ServiceProjectMilestoneTimeline
                milestones={milestoneTimeline}
                currency={order?.currency || 'XOF'}
                milestoneStatuses={orderMilestones.map(row => ({
                  id: row.id,
                  sort_order: row.sort_order,
                  status: row.status,
                }))}
              />
              {Number(order?.remaining_amount) > 0 &&
                (!hasProjectMilestones || milestoneBalanceDue) && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <span>
                        Solde jalon à payer :{' '}
                        <strong>
                          {formatCurrency(
                            Number(order?.remaining_amount),
                            order?.currency || 'XOF'
                          )}
                        </strong>
                      </span>
                      {orderId && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/payments/${orderId}/balance`)}
                        >
                          Payer le solde
                        </Button>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
            </CardContent>
          </Card>
        )}

        {/* Tabs for Payment Types */}
        <Tabs defaultValue="secured" className="space-y-6">
          <TabsList className="w-full overflow-x-auto flex-nowrap justify-start">
            <TabsTrigger value="secured" className="flex items-center gap-2 min-h-[44px] shrink-0">
              <Shield className="h-4 w-4" />
              Paiements Sécurisés ({securedPayments.length})
            </TabsTrigger>
            <TabsTrigger value="partial" className="flex items-center gap-2 min-h-[44px] shrink-0">
              <Percent className="h-4 w-4" />
              Paiements Partiels ({partialPayments.length})
            </TabsTrigger>
          </TabsList>

          {/* Secured Payments Tab */}
          <TabsContent value="secured" className="space-y-4">
            {securedPayments.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center min-h-[300px]">
                  <div className="text-center">
                    <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">Aucun paiement sécurisé</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              securedPayments.map(payment => (
                <Card key={payment.id} className="overflow-hidden">
                  <CardHeader className="bg-muted/50">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Shield className="h-5 w-5 text-primary" />
                          Paiement Escrow
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Retenu jusqu'à confirmation de livraison
                        </CardDescription>
                      </div>
                      {getStatusBadge(payment.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Left: Payment Details */}
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Montant Retenu</p>
                          <p className="text-3xl font-bold text-primary">
                            {formatCurrency(payment.held_amount || payment.amount)}
                          </p>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Méthode</span>
                            <span className="font-medium">
                              {payment.payment_method || 'GeniusPay'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Date paiement</span>
                            <span className="font-medium">
                              {format(new Date(payment.created_at), 'dd MMM yyyy', {
                                locale: fr,
                              })}
                            </span>
                          </div>
                          {payment.held_until && (
                            <>
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">
                                  Retenu jusqu'à
                                </span>
                                <span className="font-medium text-destructive">
                                  {format(new Date(payment.held_until), 'dd MMM yyyy', {
                                    locale: fr,
                                  })}
                                </span>
                              </div>

                              {/* Countdown Timer */}
                              <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                <p className="text-xs font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                                  Libération automatique dans :
                                </p>
                                <CountdownTimer
                                  targetDate={payment.held_until}
                                  onComplete={() => {
                                    toast({
                                      title: '🎉 Paiement libéré automatiquement',
                                      description: 'Les fonds ont été transférés au vendeur',
                                    });
                                    // Refresh payments data
                                    queryClient.invalidateQueries({
                                      queryKey: ['advanced-payments'],
                                    });
                                  }}
                                  showIcon={true}
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="space-y-4">
                        {canManageEscrow(payment) && (
                          <>
                            <Alert>
                              <Clock className="h-4 w-4" />
                              <AlertDescription>
                                Le paiement est retenu en attente de confirmation de livraison
                              </AlertDescription>
                            </Alert>

                            <div className="space-y-2">
                              <Button
                                className="w-full"
                                onClick={() => {
                                  setSelectedPayment(payment);
                                  setShowConfirmDialog(true);
                                }}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Confirmer la livraison
                              </Button>

                              <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => {
                                  setSelectedPayment(payment);
                                  setShowReleaseDialog(true);
                                }}
                              >
                                <Unlock className="h-4 w-4 mr-2" />
                                Relâcher le paiement
                              </Button>

                              <Button
                                variant="destructive"
                                className="w-full"
                                onClick={() =>
                                  navigate(`/disputes/create?orderId=${payment.order_id}`)
                                }
                              >
                                <AlertCircle className="h-4 w-4 mr-2" />
                                Ouvrir un litige
                              </Button>
                            </div>
                          </>
                        )}

                        {payment.status === 'released' && (
                          <Alert className="bg-green-50 dark:bg-green-950 border-green-200">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-900 dark:text-green-100">
                              Paiement relâché et transféré au vendeur
                              {payment.released_at && (
                                <span className="block text-sm mt-1">
                                  Le{' '}
                                  {format(new Date(payment.released_at), 'dd MMM yyyy à HH:mm', {
                                    locale: fr,
                                  })}
                                </span>
                              )}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Partial Payments Tab */}
          <TabsContent value="partial" className="space-y-4">
            {partialPayments.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center min-h-[300px]">
                  <div className="text-center">
                    <Percent className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">Aucun paiement partiel</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              partialPayments.map(payment => {
                const percentagePaid = payment.percentage_paid || 0;
                const remainingAmount = payment.remaining_amount || 0;
                const totalAmount = payment.total_amount || 0;
                const progressPercentage = (percentagePaid / totalAmount) * 100;

                return (
                  <Card key={payment.id} className="overflow-hidden">
                    <CardHeader className="bg-muted/50">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Percent className="h-5 w-5 text-primary" />
                            Paiement Partiel
                          </CardTitle>
                          <CardDescription className="mt-1">
                            Paiement en plusieurs fois
                          </CardDescription>
                        </div>
                        {getStatusBadge(payment.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-6">
                        {/* Progress Bar */}
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium">Progression</span>
                            <span className="text-sm text-muted-foreground">
                              {Math.round(progressPercentage)}%
                            </span>
                          </div>
                          <Progress value={progressPercentage} className="h-3" />
                        </div>

                        {/* Amounts */}
                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200">
                            <p className="text-sm text-green-700 dark:text-green-300 mb-1">Payé</p>
                            <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                              {formatCurrency(percentagePaid)}
                            </p>
                          </div>

                          <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-950 border border-orange-200">
                            <p className="text-sm text-orange-700 dark:text-orange-300 mb-1">
                              Restant
                            </p>
                            <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                              {formatCurrency(remainingAmount)}
                            </p>
                          </div>

                          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200">
                            <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">Total</p>
                            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                              {formatCurrency(totalAmount)}
                            </p>
                          </div>
                        </div>

                        <Separator />

                        {/* Details */}
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground mb-2">Informations</p>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm">Méthode</span>
                                <span className="font-medium">
                                  {payment.payment_method || 'GeniusPay'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm">Date</span>
                                <span className="font-medium">
                                  {format(new Date(payment.created_at), 'dd MMM yyyy', {
                                    locale: fr,
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>

                          {remainingAmount > 0 && (
                            <div>
                              <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                  Il reste {formatCurrency(remainingAmount)} à payer
                                </AlertDescription>
                              </Alert>
                              <Button
                                className="w-full mt-3"
                                onClick={() => orderId && navigate(`/payments/${orderId}/balance`)}
                              >
                                <CreditCard className="h-4 w-4 mr-2" />
                                Payer le solde
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>

        {/* Release Payment Dialog */}
        <Dialog open={showReleaseDialog} onOpenChange={setShowReleaseDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Unlock className="h-5 w-5 text-primary" />
                Relâcher le Paiement
              </DialogTitle>
              <DialogDescription>Confirmer le transfert du paiement au vendeur</DialogDescription>
            </DialogHeader>

            {selectedPayment && (
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Vous êtes sur le point de relâcher{' '}
                    <strong>
                      {formatCurrency(selectedPayment.held_amount || selectedPayment.amount)}
                    </strong>
                    . Cette action est irréversible.
                  </AlertDescription>
                </Alert>

                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm font-medium mb-2">Détails du paiement</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Montant</span>
                      <span className="font-medium">
                        {formatCurrency(selectedPayment.held_amount || selectedPayment.amount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status actuel</span>
                      {getStatusBadge(selectedPayment.status)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowReleaseDialog(false)}
                disabled={isProcessing}
              >
                Annuler
              </Button>
              <Button onClick={handleReleasePayment} disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Traitement...
                  </>
                ) : (
                  <>
                    <Unlock className="h-4 w-4 mr-2" />
                    Confirmer
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirm Delivery Dialog */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Confirmer la Livraison
              </DialogTitle>
              <DialogDescription>Confirmez que vous avez bien reçu la commande</DialogDescription>
            </DialogHeader>

            {selectedPayment && (
              <div className="space-y-4">
                <Alert className="bg-green-50 dark:bg-green-950 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-900 dark:text-green-100">
                    {hasProjectMilestones ? (
                      <>
                        En confirmant la livraison, le jalon de démarrage (
                        <strong>
                          {formatCurrency(
                            selectedPayment.held_amount || selectedPayment.amount,
                            selectedPayment.currency
                          )}
                        </strong>
                        ) sera libéré au vendeur. Le solde restant devra être payé ensuite.
                      </>
                    ) : (
                      <>
                        En confirmant la livraison, le paiement de{' '}
                        <strong>
                          {formatCurrency(
                            selectedPayment.held_amount || selectedPayment.amount,
                            selectedPayment.currency
                          )}
                        </strong>{' '}
                        sera transféré au vendeur.
                      </>
                    )}
                  </AlertDescription>
                </Alert>

                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground mb-2">
                    ⚠️ Vérifiez que vous avez bien reçu votre commande et qu'elle correspond à ce
                    qui était attendu avant de confirmer.
                  </p>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
                disabled={isProcessing}
              >
                Annuler
              </Button>
              <Button onClick={handleConfirmDelivery} disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Confirmation...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirmer la livraison
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppPageShell>
  );
}
