import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { detectSubdomain } from '@/lib/subdomain-detector';

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
  const [guestPassword, setGuestPassword] = useState('');

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

  const navigateToPlatform = (path: string) => {
    const info = detectSubdomain();
    if (info.isStoreDomain || info.isCustomDomain) {
      window.location.href = `https://www.emarzona.com${path}`;
    } else {
      navigate(path);
    }
  };

  const loadOrderInfo = async (id: string) => {
    try {
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_id, product_type, products(slug)')
        .eq('order_id', id)
        .limit(1)
        .maybeSingle();

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
        const mappedProvider = mapUrlProviderToPaymentProvider(providerParam);

        // Retour MoneyFusion parfois sans transaction_id dans l'URL → lookup
        if (!txId && orderId) {
          const { data: pendingTx } = await supabase
            .from('transactions')
            .select('id')
            .eq('order_id', orderId)
            .in('status', ['processing', 'pending', 'completed'])
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          txId = pendingTx?.id ?? null;
        }

        // Invité / RLS : forcer verify Edge par order_id (service role)
        if (orderId && (!txId || isGuestReturn)) {
          try {
            const { moneyfusionClient } = await import('@/lib/moneyfusion-client');
            const byOrder = (await moneyfusionClient.verifyPaymentByOrder(orderId)) as {
              status?: string;
              completed?: boolean;
              alreadyCompleted?: boolean;
              transactionId?: string;
            } | null;
            const edgeStatus = String(byOrder?.status || '').toLowerCase();
            if (
              edgeStatus === 'completed' ||
              byOrder?.completed === true ||
              byOrder?.alreadyCompleted === true
            ) {
              setConfirmationState('confirmed');
              await loadOrderInfo(orderId);
              return;
            }
            if (byOrder?.transactionId) {
              txId = byOrder.transactionId;
            }
          } catch (err) {
            logger.warn('Guest/order verify via Edge failed', { err, orderId });
          }
        }

        let verifyResult: { status?: string } | null = null;
        if (txId) {
          verifyResult = (await verifyTransactionStatus(txId, mappedProvider)) as {
            status?: string;
          } | null;
          if (verifyResult?.status === 'completed') {
            setConfirmationState('confirmed');
            if (orderId) await loadOrderInfo(orderId);
            return;
          }
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

            // Re-vérifier via Edge (order ou transaction) pendant le polling
            if (attempt > 0 && attempt % 2 === 0) {
              try {
                const { moneyfusionClient } = await import('@/lib/moneyfusion-client');
                const again = txId
                  ? ((await moneyfusionClient.verifyPaymentByTransaction(txId)) as {
                      status?: string;
                      completed?: boolean;
                      alreadyCompleted?: boolean;
                    } | null)
                  : ((await moneyfusionClient.verifyPaymentByOrder(orderId)) as {
                      status?: string;
                      completed?: boolean;
                      alreadyCompleted?: boolean;
                    } | null);
                const st = String(again?.status || '').toLowerCase();
                if (
                  st === 'completed' ||
                  again?.completed === true ||
                  again?.alreadyCompleted === true
                ) {
                  setConfirmationState('confirmed');
                  await loadOrderInfo(orderId);
                  return;
                }
              } catch {
                /* keep polling */
              }
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
      navigateToPlatform(learnUrl);
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

  const handleCreateGuestAccount = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!orderId || !guestEmail) return;

    if (guestPassword.length < 6) {
      setGuestAccessError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setGuestAccessState('loading');
    setGuestAccessError(null);

    const result = await requestGuestCustomerAccess(orderId, guestEmail, guestPassword);

    if (result.success && result.actionLink) {
      setGuestAccessState('redirecting');
      safeRedirect(result.actionLink, () => {
        setGuestAccessState('failed');
        setGuestAccessError('Impossible d’ouvrir votre espace client.');
      });
    } else {
      setGuestAccessState('failed');
      setGuestAccessError(
        result.error ||
          'Impossible de configurer votre compte. Connectez-vous avec le même email que lors de l’achat.'
      );
    }
  };

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
        ? 'Connexion à votre espace client en cours…'
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
          </div>

          {confirmationState === 'confirmed' &&
            isGuestReturn &&
            !user &&
            guestAccessState !== 'redirecting' && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border shadow-sm text-left max-w-md mx-auto w-full">
                <h3 className="text-lg font-semibold mb-2">Créez votre mot de passe</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Pour accéder à vos achats plus tard, veuillez définir un mot de passe pour le
                  compte associé à <strong>{guestEmail}</strong>.
                </p>
                <form onSubmit={handleCreateGuestAccount} className="space-y-4">
                  <div>
                    <Input
                      type="password"
                      placeholder="Mot de passe (min 6 caractères)"
                      value={guestPassword}
                      onChange={e => setGuestPassword(e.target.value)}
                      required
                      minLength={6}
                      disabled={guestAccessState === 'loading'}
                    />
                  </div>
                  {guestAccessError && (
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                      {guestAccessError}
                    </p>
                  )}
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={guestAccessState === 'loading' || guestPassword.length < 6}
                  >
                    {guestAccessState === 'loading' && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Créer mon compte et accéder
                  </Button>
                </form>
              </div>
            )}

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
                    onClick={() => navigateToPlatform('/account/digital')}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Mes achats digitaux
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => navigateToPlatform(portalPath)}
                  className="flex items-center gap-2"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Mon espace client
                </Button>
              </>
            ) : null}
            <Button
              variant="outline"
              onClick={() => {
                const info = detectSubdomain();
                if (info.isStoreDomain || info.isCustomDomain) {
                  navigate('/');
                } else {
                  navigate('/marketplace');
                }
              }}
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
