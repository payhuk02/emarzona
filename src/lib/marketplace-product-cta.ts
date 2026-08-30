import type { PhysicalProductPaymentOptions } from '@/types/physical-product';
import { parsePhysicalCheckoutOptions } from '@/lib/physical/physical-checkout-display';
import {
  parseServiceCheckoutOptions,
  type ServiceCheckoutPaymentOptions,
} from '@/lib/service/service-checkout-display';

export type MarketplacePaymentOptions =
  | PhysicalProductPaymentOptions
  | ServiceCheckoutPaymentOptions
  | string
  | null;

export type MarketplaceProductCTAAction =
  | 'checkout'
  | 'physical_quick_order'
  | 'service'
  | 'course';

export interface MarketplaceProductCTA {
  action: MarketplaceProductCTAAction;
  buyLabel: string;
  buyAriaVerb: string;
  showAddToCart: boolean;
  /** Afficher le badge mode de paiement sous le titre (physique) */
  showPhysicalCheckoutBadge: boolean;
}

export function getMarketplaceProductCTA(
  productType?: string | null,
  paymentOptions?: MarketplacePaymentOptions
): MarketplaceProductCTA {
  if (productType === 'physical') {
    const parsed = parsePhysicalCheckoutOptions(
      paymentOptions as PhysicalProductPaymentOptions | string | null | undefined
    );
    return {
      action: 'checkout',
      buyLabel: parsed.cta_button_label,
      buyAriaVerb: parsed.cta_button_label,
      showAddToCart: false,
      showPhysicalCheckoutBadge: true,
    };
  }

  switch (productType) {
    case 'service': {
      const parsed = parseServiceCheckoutOptions(
        paymentOptions as ServiceCheckoutPaymentOptions | string | null | undefined
      );
      return {
        action: 'service',
        buyLabel: parsed.cta_button_label,
        buyAriaVerb: parsed.cta_button_label,
        showAddToCart: false,
        showPhysicalCheckoutBadge: false,
      };
    }
    case 'course':
      return {
        action: 'course',
        buyLabel: "S'inscrire",
        buyAriaVerb: "S'inscrire au cours",
        showAddToCart: false,
        showPhysicalCheckoutBadge: false,
      };
    case 'artist':
      return {
        action: 'checkout',
        buyLabel: 'Acheter',
        buyAriaVerb: 'Acheter',
        showAddToCart: false,
        showPhysicalCheckoutBadge: false,
      };
    default:
      return {
        action: 'checkout',
        buyLabel: 'Acheter',
        buyAriaVerb: 'Acheter',
        showAddToCart: false,
        showPhysicalCheckoutBadge: false,
      };
  }
}
