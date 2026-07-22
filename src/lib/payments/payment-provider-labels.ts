export function getPaymentProviderLabel(provider: string | null | undefined): string {
  switch (provider) {
    case 'stripe_connect':
      return 'Stripe';
    case 'paypal_commerce':
      return 'PayPal';
    case 'geniuspay_platform':
    case 'geniuspay':
      // Legacy label — GeniusPay retiré, afficher MoneyFusion pour l'historique
      return 'MoneyFusion';
    case 'moneyfusion':
      return 'MoneyFusion';
    case 'flutterwave_connect':
      return 'Flutterwave';
    default:
      return provider ?? 'Inconnu';
  }
}
