import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, ShoppingBag, ArrowRight, Loader2 } from 'lucide-react';
import { OneClickUpsell } from '@/components/upsell/OneClickUpsell';
import { supabase } from '@/integrations/supabase/client';
import { verifyTransactionStatus } from '@/lib/payment-service';
import { logger } from '@/lib/logger';

type ConfirmationState = 'loading' | 'confirmed' | 'pending' | 'failed';

function mapUrlProviderToPaymentProvider(
  provider: string | null
): 'moneroo' | 'stripe_connect' | 'paypal_commerce' | undefined {
  if (!provider) return undefined;
  if (provider === 'stripe' || provider === 'stripe_connect') return 'stripe_connect';
  if (provider === 'paypal' || provider === 'paypal_commerce') return 'paypal_commerce';
  if (provider === 'moneroo' || provider === 'moneroo_platform') return 'moneroo';
  return undefined;
}

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showUpsell, setShowUpsell] = useState(false);
  const [purchasedProductId, setPurchasedProductId] = useState<string | null>(null);
  const [purchasedProductType, setPurchasedProductType] = useState<string>('digital');
  const [confirmationState, setConfirmationState] = useState<ConfirmationState>('loading');

  const orderId = searchParams.get('order_id');
  const transactionId = searchParams.get('transaction_id');
  const providerParam = searchParams.get('provider');
  const sessionId = searchParams.get('session_id');

  const loadOrderInfo = async (id: string) => {
    try {
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_id, product_type')
        .eq('order_id', id)
        .limit(1)
        .single();

      if (orderItems) {
        setPurchasedProductId(orderItems.product_id);
        setPurchasedProductType(orderItems.product_type || 'digital');
      }
    } catch (error) {
      logger.error('Error loading order info', { error });
    }
  };

  useEffect(() => {
    if (providerParam === 'stripe' && sessionId) {
      logger.log('Stripe checkout return', { sessionId, orderId, transactionId });
    }
    if (providerParam === 'paypal') {
      logger.log('PayPal checkout return', {
        token: searchParams.get('token'),
        orderId,
        transactionId,
      });
    }

    let cancelled = false;

    const confirmPayment = async () => {
      try {
        if (transactionId) {
          const mappedProvider = mapUrlProviderToPaymentProvider(providerParam);
          await verifyTransactionStatus(transactionId, mappedProvider);
        }

        if (orderId) {
          for (let attempt = 0; attempt < 15; attempt++) {
            if (cancelled) return;

            const { data: order } = await supabase
              .from('orders')
              .select('payment_status, status')
              .eq('id', orderId)
              .maybeSingle();

            if (order?.payment_status === 'paid') {
              setConfirmationState('confirmed');
              await loadOrderInfo(orderId);
              return;
            }

            if (order?.payment_status === 'failed') {
              setConfirmationState('failed');
              return;
            }

            await new Promise(r => setTimeout(r, 2000));
          }

          setConfirmationState('pending');
          await loadOrderInfo(orderId);
          return;
        }

        setConfirmationState('confirmed');
      } catch (error) {
        logger.error('Payment success confirmation error', { error, orderId, transactionId });
        setConfirmationState('pending');
        if (orderId) {
          await loadOrderInfo(orderId);
        }
      }
    };

    void confirmPayment();

    return () => {
      cancelled = true;
    };
  }, [orderId, transactionId, providerParam, sessionId, searchParams]);

  useEffect(() => {
    if (confirmationState !== 'confirmed' || !purchasedProductId) return;

    const timer = setTimeout(() => setShowUpsell(true), 2000);
    return () => clearTimeout(timer);
  }, [confirmationState, purchasedProductId]);

  const title =
    confirmationState === 'confirmed'
      ? 'Paiement réussi ! 🎉'
      : confirmationState === 'pending'
        ? 'Paiement en cours de confirmation'
        : confirmationState === 'failed'
          ? 'Paiement non confirmé'
          : 'Vérification du paiement…';

  const description =
    confirmationState === 'confirmed'
      ? 'Merci pour votre achat ! Votre paiement a été confirmé.'
      : confirmationState === 'pending'
        ? 'Votre banque ou PSP finalise encore le paiement. Consultez vos commandes dans quelques instants.'
        : confirmationState === 'failed'
          ? "Le paiement n'a pas abouti. Vous pouvez réessayer depuis vos commandes."
          : 'Nous vérifions le statut auprès du prestataire de paiement…';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="max-w-2xl w-full">
        <CardContent className="p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              {confirmationState === 'loading' ? (
                <Loader2 className="h-12 w-12 text-green-600 animate-spin" />
              ) : (
                <CheckCircle
                  className={`h-12 w-12 ${confirmationState === 'failed' ? 'text-amber-600' : 'text-green-600'}`}
                />
              )}
            </div>
          </div>

          <div>
            <h1
              className={`text-3xl font-bold mb-2 ${confirmationState === 'failed' ? 'text-amber-600' : 'text-green-600'}`}
            >
              {title}
            </h1>
            <p className="text-lg text-muted-foreground">{description}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('/account/downloads')}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Mes Téléchargements
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/account/orders')}
              className="flex items-center gap-2"
            >
              <ShoppingBag className="h-4 w-4" />
              Mes Commandes
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/marketplace')}
              className="flex items-center gap-2"
            >
              Continuer les achats
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {purchasedProductId && confirmationState === 'confirmed' && (
        <OneClickUpsell
          purchasedProductId={purchasedProductId}
          purchasedProductType={purchasedProductType}
          isOpen={showUpsell}
          onClose={() => setShowUpsell(false)}
        />
      )}
    </div>
  );
};

export default PaymentSuccess;
