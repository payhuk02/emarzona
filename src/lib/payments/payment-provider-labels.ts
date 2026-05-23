export function getPaymentProviderLabel(provider: string | null | undefined): string {
  switch (provider) {
    case 'stripe_connect':
      return 'Stripe';
    case 'paypal_commerce':
      return 'PayPal';
    case 'moneroo_platform':
    case 'moneroo':
      return 'Moneroo';
    case 'flutterwave_connect':
      return 'Flutterwave';
    default:
      return provider ?? 'Inconnu';
  }
}
