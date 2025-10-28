/**
 * Pay Balance Page
 * Date: 28 octobre 2025
 * 
 * Page pour payer le solde restant d'une commande (paiement partiel)
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Calendar,
  Package,
  DollarSign,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function PayBalance() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch order data
  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customers (
            name,
            email,
            phone
          ),
          order_items (
            id,
            product_name,
            quantity,
            unit_price,
            total_price
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
  });

  // Mutation pour initier le paiement Moneroo
  const payBalanceMutation = useMutation({
    mutationFn: async () => {
      // TODO: Implement Moneroo payment initiation
      const paymentData = {
        amount: order?.remaining_amount,
        order_id: orderId,
        description: `Solde commande #${order?.order_number}`,
        customer_email: order?.customers?.email || order?.customer_email,
        return_url: `${window.location.origin}/payments/success?order_id=${orderId}`,
        cancel_url: `${window.location.origin}/payments/cancel?order_id=${orderId}`,
        metadata: {
          order_id: orderId,
          payment_type: 'balance',
          initial_amount: order?.total_amount,
          percentage_paid: order?.percentage_paid,
          remaining_amount: order?.remaining_amount,
        },
      };

      // Call Moneroo API (placeholder)
      const response = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) throw new Error('Payment initiation failed');

      return await response.json();
    },
    onSuccess: (data) => {
      if (data.payment_url) {
        window.location.href = data.payment_url;
      }
    },
    onError: (error: any) => {
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible d\'initier le paiement',
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1 p-8">
            <Skeleton className="h-96 w-full max-w-2xl mx-auto" />
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (error || !order) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1 p-8">
            <Alert variant="destructive" className="max-w-2xl mx-auto">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Commande introuvable ou erreur de chargement
              </AlertDescription>
            </Alert>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  const percentagePaid = order.percentage_paid || 0;
  const remainingAmount = order.remaining_amount || 0;
  const totalAmount = order.total_amount || 0;
  const percentageRate = totalAmount > 0 ? Math.round((percentagePaid / totalAmount) * 100) : 0;

  // Check if payment is needed
  if (remainingAmount <= 0) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1 p-8">
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-12 w-12 text-green-500" />
                  <div>
                    <CardTitle>Paiement Complet</CardTitle>
                    <CardDescription>
                      Cette commande a été entièrement payée
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button onClick={() => navigate('/orders')} className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour aux commandes
                </Button>
              </CardContent>
            </Card>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-2xl mx-auto">
            {/* Back Button */}
            <Button
              variant="ghost"
              className="mb-6"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-3">
                  <CreditCard className="h-8 w-8" />
                  Payer le solde
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Commande #{order.order_number}
                  <span className="mx-2">•</span>
                  <Calendar className="h-4 w-4" />
                  {format(new Date(order.created_at), 'dd MMM yyyy', { locale: fr })}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Payment Status */}
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Vous avez payé un acompte de {percentageRate}%. Le solde restant doit être payé pour finaliser votre commande.
                  </AlertDescription>
                </Alert>

                {/* Payment Breakdown */}
                <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg border border-blue-200 dark:border-blue-800 space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Détails du paiement
                  </h3>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Montant total</span>
                      <span className="font-semibold">
                        {totalAmount.toLocaleString()} {order.currency}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-green-700 dark:text-green-400">
                        Acompte payé ({percentageRate}%)
                      </span>
                      <span className="font-bold text-green-700 dark:text-green-400">
                        -{percentagePaid.toLocaleString()} {order.currency}
                      </span>
                    </div>

                    <Separator />

                    <div className="flex justify-between items-center pt-2">
                      <span className="text-lg font-medium">Solde à payer</span>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                          {remainingAmount.toLocaleString()} {order.currency}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {100 - percentageRate}% du total
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="font-semibold mb-3">Articles de la commande</h3>
                  <div className="space-y-2">
                    {order.order_items?.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex justify-between p-3 bg-muted/50 rounded"
                      >
                        <div>
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-sm text-muted-foreground">
                            Quantité: {item.quantity}
                          </p>
                        </div>
                        <p className="font-semibold">
                          {item.total_price.toLocaleString()} {order.currency}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Customer Info */}
                {order.customers && (
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h3 className="font-semibold mb-2 text-sm text-muted-foreground">
                      Informations client
                    </h3>
                    <p className="font-medium">{order.customers.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.customers.email}
                    </p>
                  </div>
                )}

                {/* Pay Button */}
                <Button
                  onClick={() => payBalanceMutation.mutate()}
                  className="w-full"
                  size="lg"
                  disabled={payBalanceMutation.isPending}
                >
                  {payBalanceMutation.isPending ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Traitement...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5 mr-2" />
                      Payer {remainingAmount.toLocaleString()} {order.currency}
                    </>
                  )}
                </Button>

                {/* Security Notice */}
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Paiement sécurisé via Moneroo. Vos informations de paiement sont protégées et chiffrées.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

