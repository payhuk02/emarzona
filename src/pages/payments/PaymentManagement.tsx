/**
 * Payment Management Page - Advanced Payments
 * Date: 28 octobre 2025
 * 
 * Gestion paiements avancés: pourcentage, escrow/delivery_secured
 * Features: Release payments, confirm delivery, partial payments tracking
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Store
} from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { useAdvancedPayments } from '@/hooks/useAdvancedPayments';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CountdownTimer } from '@/components/ui/countdown-timer';
import { useQueryClient } from '@tanstack/react-query';

export default function PaymentManagement() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    payments,
    loading,
    stats,
    releasePayment,
    openDispute,
  } = useAdvancedPayments();

  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [showReleaseDialog, setShowReleaseDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter payments for this order if orderId is provided
  const orderPayments = orderId 
    ? payments.filter(p => p.order_id === orderId)
    : payments;

  // Separate payments by type
  const partialPayments = orderPayments.filter(p => p.payment_type === 'percentage');
  const securedPayments = orderPayments.filter(p => p.payment_type === 'delivery_secured');

  /**
   * Handle release secured payment
   */
  const handleReleasePayment = async () => {
    if (!selectedPayment) return;

    try {
      setIsProcessing(true);
      await releasePayment(selectedPayment.id, 'delivery_confirmed');
      
      toast({
        title: '✅ Paiement relâché',
        description: 'Le paiement a été transféré au vendeur',
      });

      setShowReleaseDialog(false);
      setSelectedPayment(null);
    } catch (error: any) {
      console.error('Release payment error:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de relâcher le paiement',
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
      
      // Call release payment with customer confirmation
      await releasePayment(selectedPayment.id, 'customer_confirmed');

      toast({
        title: '✅ Livraison confirmée',
        description: 'Le paiement sera transféré au vendeur',
      });

      setShowConfirmDialog(false);
      setSelectedPayment(null);
    } catch (error: any) {
      console.error('Confirm delivery error:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de confirmer la livraison',
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

  /**
   * Get payment status badge
   */
  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
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

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <main className="flex-1 overflow-x-hidden">
            <div className="container mx-auto p-6">
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-muted-foreground">Chargement des paiements...</p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <main className="flex-1 overflow-x-hidden">
          <div className="container mx-auto p-6 max-w-7xl">
            {/* Header */}
            <div className="mb-6">
              <Button
                variant="ghost"
                onClick={() => navigate(-1)}
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
                    Paiements avancés, escrow et paiements partiels
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
                  <p className="text-xs text-muted-foreground">
                    Tous types confondus
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Montants Retenus</CardTitle>
                  <Lock className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">
                    {stats?.totalHeld || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    XOF en escrow
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Paiements Partiels</CardTitle>
                  <Percent className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{partialPayments.length}</div>
                  <p className="text-xs text-muted-foreground">
                    En pourcentage
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Paiements Sécurisés</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{securedPayments.length}</div>
                  <p className="text-xs text-muted-foreground">
                    À la livraison
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Tabs for Payment Types */}
            <Tabs defaultValue="secured" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="secured" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Paiements Sécurisés ({securedPayments.length})
                </TabsTrigger>
                <TabsTrigger value="partial" className="flex items-center gap-2">
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
                  securedPayments.map((payment) => (
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
                                <span className="font-medium">{payment.payment_method || 'Moneroo'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Date paiement</span>
                                <span className="font-medium">
                                  {format(new Date(payment.created_at), 'dd MMM yyyy', { locale: fr })}
                                </span>
                              </div>
                              {payment.held_until && (
                                <>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Retenu jusqu'à</span>
                                    <span className="font-medium text-destructive">
                                      {format(new Date(payment.held_until), 'dd MMM yyyy', { locale: fr })}
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
                                        queryClient.invalidateQueries({ queryKey: ['advanced-payments'] });
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
                            {payment.status === 'held' && (
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
                                    onClick={() => navigate(`/disputes/create?orderId=${payment.order_id}`)}
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
                                      Le {format(new Date(payment.released_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
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
                  partialPayments.map((payment) => {
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
                                <p className="text-sm text-orange-700 dark:text-orange-300 mb-1">Restant</p>
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
                                    <span className="font-medium">{payment.payment_method || 'Moneroo'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm">Date</span>
                                    <span className="font-medium">
                                      {format(new Date(payment.created_at), 'dd MMM yyyy', { locale: fr })}
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
                                  <Button className="w-full mt-3">
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
                  <DialogDescription>
                    Confirmer le transfert du paiement au vendeur
                  </DialogDescription>
                </DialogHeader>

                {selectedPayment && (
                  <div className="space-y-4">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Vous êtes sur le point de relâcher <strong>{formatCurrency(selectedPayment.held_amount || selectedPayment.amount)}</strong>.
                        Cette action est irréversible.
                      </AlertDescription>
                    </Alert>

                    <div className="p-4 rounded-lg bg-muted">
                      <p className="text-sm font-medium mb-2">Détails du paiement</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Montant</span>
                          <span className="font-medium">{formatCurrency(selectedPayment.held_amount || selectedPayment.amount)}</span>
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
                  <Button variant="outline" onClick={() => setShowReleaseDialog(false)} disabled={isProcessing}>
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
                  <DialogDescription>
                    Confirmez que vous avez bien reçu la commande
                  </DialogDescription>
                </DialogHeader>

                {selectedPayment && (
                  <div className="space-y-4">
                    <Alert className="bg-green-50 dark:bg-green-950 border-green-200">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-900 dark:text-green-100">
                        En confirmant la livraison, le paiement de <strong>{formatCurrency(selectedPayment.held_amount || selectedPayment.amount)}</strong> sera transféré au vendeur.
                      </AlertDescription>
                    </Alert>

                    <div className="p-4 rounded-lg bg-muted">
                      <p className="text-sm text-muted-foreground mb-2">
                        ⚠️ Vérifiez que vous avez bien reçu votre commande et qu'elle correspond à ce qui était attendu avant de confirmer.
                      </p>
                    </div>
                  </div>
                )}

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={isProcessing}>
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
        </main>
      </div>
    </SidebarProvider>
  );
}

