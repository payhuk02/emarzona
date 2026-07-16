export function getPaymentProviderLabel(provider: string | null | undefined): string {
  switch (provider) {
    case 'stripe_connect':
      return 'Stripe';
    case 'paypal_commerce':
      return 'PayPal';
    case 'geniuspay_platform':
    case 'geniuspay':
      return 'GeniusPay';
    case 'flutterwave_connect':
      return 'Flutterwave';
    default:
      return provider ?? 'Inconnu';
  }
}
