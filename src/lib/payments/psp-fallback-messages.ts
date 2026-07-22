import type { PaymentProviderCode } from '@/types/store-payment-connection';

const PROVIDER_LABELS: Partial<Record<PaymentProviderCode, string>> = {
  stripe_connect: 'Stripe',
  paypal_commerce: 'PayPal',
  flutterwave_connect: 'Flutterwave',
  geniuspay_platform: 'MoneyFusion',
  moneyfusion: 'MoneyFusion',
};

export function buildPspFallbackUserMessage(
  fromProvider: PaymentProviderCode,
  reason?: string
): { title: string; description: string } {
  const fromLabel = PROVIDER_LABELS[fromProvider] ?? fromProvider;

  if (reason === 'provider_not_ready') {
    return {
      title: 'Changement de moyen de paiement',
      description: `${fromLabel} n'est pas disponible pour le moment. Votre paiement sera traité via MoneyFusion (mobile money).`,
    };
  }

  if (reason === 'provider_error') {
    return {
      title: 'Changement de moyen de paiement',
      description: `Le paiement via ${fromLabel} a échoué. Nous vous redirigeons vers MoneyFusion pour finaliser votre achat.`,
    };
  }

  return {
    title: 'Changement de moyen de paiement',
    description: `Votre paiement sera traité via MoneyFusion au lieu de ${fromLabel}.`,
  };
}
