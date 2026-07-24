import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, ShoppingBag, ArrowRight, Loader2, LogIn } from 'lucide-react';
import { OneClickUpsell } from '@/components/upsell/OneClickUpsell';
import { supabase } from '@/integrations/supabase/client';
import { verifyTransactionStatus } from '@/lib/payment-service';
import { logger } from '@/lib/logger';
import { resolveCourseLearnUrl } from '@/lib/courses/course-learn-redirect';
import { useAuth } from '@/contexts/AuthContext';
import { safeRedirect } from '@/lib/url-validator';
import { requestGuestCustomerAccess } from '@/lib/checkout/guest-customer-access';
import { resolveCustomerPortalPath } from '@/lib/checkout/guest-payment-return';

type ConfirmationState = 'loading' | 'confirmed' | 'pending' | 'failed';
type GuestAccessState = 'idle' | 'loading' | 'redirecting' | 'failed';

function mapUrlProviderToPaymentProvider(
  provider: string | null
): 'moneyfusion' | 'geniuspay' | 'stripe_connect' | 'paypal_commerce' | undefined {
  if (!provider) return undefined;
  if (provider === 'stripe' || provider === 'stripe_connect') return 'stripe_connect';
  if (provider === 'paypal' || provider === 'paypal_commerce') return 'paypal_commerce';
  if (provider === 'moneyfusion' || provider === 'geniuspay' || provider === 'geniuspay_platform') {
    return 'moneyfusion';
  }
  return undefined;
}

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showUpsell, setShowUpsell] = useState(false);
  const [purchasedProductId, setPurchasedProductId] = useState<string | null>(null);
  const [purchasedProductType, setPurchasedProductType] = useState<string>('digital');
  const [purchasedProductSlug, setPurchasedProductSlug] = useState<string | null>(null);
  const [confirmationState, setConfirmationState] = useState<ConfirmationState>('loading');
  const [guestAccessState, setGuestAccessState] = useState<GuestAccessState>('idle');
  const [guestAccessError, setGuestAccessError] = useState<string | null>(null);

  const orderId = searchParams.get('order_id');
  const transactionId = searchParams.get('transaction_id');
  const providerParam = searchParams.get('provider');
  const sessionId = searchParams.get('session_id');
  const isGuestReturn = searchParams.get('guest') === '1';
  const guestEmail = searchParams.get('email');
  const productTypeParam = searchParams.get('product_type');

  const portalPath = resolveCustomerPortalPath(
    purchasedProductType || productTypeParam || 'digital'
  );

  const loadOrderInfo = async (id: string) => {
    try {
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_id, product_type, products(slug)')
        .eq('order_id', id)
        .limit(1)
        .single();

      if (orderItems) {
        setPurchasedProductId(orderItems.product_id);
        setPurchasedProductType(orderItems.product_type || 'digital');
        const productRow = orderItems.products as { slug?: string } | null;
        if (productRow?.slug) {
          setPurchasedProductSlug(productRow.slug);
        } else if (orderItems.product_type === 'course') {
          const { data: product } = await supabase
            .from('products')
            .select('slug')
            .eq('id', orderItems.product_id)
            .maybeSingle();
          setPurchasedProductSlug(product?.slug ?? null);
        }
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
        let txId = transactionId;

        // Retour MoneyFusion parfois sans transaction_id dans l'URL → lookup
        if (!txId && orderId) {
          const { data: pendingTx } = await supabase
            .from('transactions')
            .select('id')
            .eq('order_id', orderId)
            .in('status', ['processing', 'pending'])
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          txId = pendingTx?.id ?? null;
        }

        if (txId) {
          const mappedProvider = mapUrlProviderToPaymentProvider(providerParam);
          await verifyTransactionStatus(txId, mappedProvider);
        }

        if (orderId) {
          for (let attempt = 0; attempt < 15; attempt++) {
            if (cancelled) return;

            const { data: order } = await supabase
              .from('orders')
              .select('payment_status, status')
              .eq('id', orderId)
              .maybeSingle();

            if (!order) {
              setConfirmationState('pending');
              return;
            }

            if (order.payment_status === 'paid') {
              setConfirmationState('confirmed');
              await loadOrderInfo(orderId);
              return;
            }

            if (order.payment_status === 'failed') {
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
    if (confirmationState !== 'confirmed' || !user) return;
    if (purchasedProductType !== 'course') return;

    const learnUrl = resolveCourseLearnUrl({
      slug: purchasedProductSlug,
      productId: purchasedProductId,
    });
    if (learnUrl === '/account/courses' && !purchasedProductSlug && !purchasedProductId) {
      return;
    }

    const timer = setTimeout(() => {
      navigate(learnUrl);
    }, 1200);
    return () => clearTimeout(timer);
  }, [
    confirmationState,
    user,
    purchasedProductType,
    purchasedProductSlug,
    purchasedProductId,
    navigate,
  ]);

  useEffect(() => {
    if (confirmationState !== 'confirmed' || !purchasedProductId) return;

    const timer = setTimeout(() => setShowUpsell(true), 2000);
    return () => clearTimeout(timer);
  }, [confirmationState, purchasedProductId]);

  useEffect(() => {
    if (user || !isGuestReturn || confirmationState !== 'confirmed' || !orderId || !guestEmail) {
      return;
    }

    let cancelled = false;

    const openGuestPortal = async () => {
      setGuestAccessState('loading');
      setGuestAccessError(null);

      const result = await requestGuestCustomerAccess(orderId, guestEmail);
      if (cancelled) return;

      if (result.success && result.actionLink) {
        setGuestAccessState('redirecting');
        safeRedirect(result.actionLink, () => {
          setGuestAccessState('failed');
          setGuestAccessError(
            'Impossible d’ouvrir votre espace client. Utilisez le bouton ci-dessous.'
          );
        });
        return;
      }

      setGuestAccessState('failed');
      setGuestAccessError(
        result.error ||
          'Connectez-vous avec le même email que lors de l’achat pour accéder à votre espace.'
      );
    };

    void openGuestPortal();

    return () => {
      cancelled = true;
    };
  }, [user, isGuestReturn, confirmationState, orderId, guestEmail]);

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
      ? isGuestReturn && !user && guestAccessState === 'redirecting'
        ? 'Ouverture sécurisée de votre espace client…'
        : isGuestReturn && !user && guestAccessState === 'loading'
          ? 'Préparation de votre accès client…'
          : 'Merci pour votre achat ! Votre paiement a été confirmé.'
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
              {confirmationState === 'loading' || guestAccessState === 'loading' ? (
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
            {guestAccessError && (
              <p className="text-sm text-amber-700 dark:text-amber-400 mt-3">{guestAccessError}</p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
            {confirmationState === 'confirmed' && purchasedProductType === 'course' && user && (
              <Button
                onClick={() =>
                  navigate(
                    resolveCourseLearnUrl({
                      slug: purchasedProductSlug,
                      productId: purchasedProductId,
                    })
                  )
                }
                className="flex items-center gap-2"
              >
                Accéder au cours
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
            {user ? (
              <>
                {purchasedProductType === 'digital' && (
                  <Button
                    onClick={() => navigate('/account/digital')}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Mes achats digitaux
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => navigate(portalPath)}
                  className="flex items-center gap-2"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Mon espace client
                </Button>
              </>
            ) : (
              <>
                {guestAccessState === 'failed' && guestEmail && (
                  <Button asChild className="flex items-center gap-2">
                    <Link
                      to={`/login?email=${encodeURIComponent(guestEmail)}&redirect=${encodeURIComponent(portalPath)}`}
                    >
                      <LogIn className="h-4 w-4" />
                      Se connecter ({guestEmail})
                    </Link>
                  </Button>
                )}
                <Button asChild variant="outline">
                  <Link to="/register">Créer un compte</Link>
                </Button>
              </>
            )}
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

      {purchasedProductId && confirmationState === 'confirmed' && user && (
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
