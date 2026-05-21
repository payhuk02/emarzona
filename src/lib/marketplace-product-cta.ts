export type MarketplaceProductCTAAction = 'checkout' | 'service' | 'course';

export interface MarketplaceProductCTA {
  action: MarketplaceProductCTAAction;
  buyLabel: string;
  buyAriaVerb: string;
  showAddToCart: boolean;
}

export function getMarketplaceProductCTA(productType?: string | null): MarketplaceProductCTA {
  switch (productType) {
    case 'service':
      return {
        action: 'service',
        buyLabel: 'Réserver',
        buyAriaVerb: 'Réserver',
        showAddToCart: false,
      };
    case 'course':
      return {
        action: 'course',
        buyLabel: "S'inscrire",
        buyAriaVerb: "S'inscrire au cours",
        showAddToCart: false,
      };
    default:
      return {
        action: 'checkout',
        buyLabel: 'Acheter',
        buyAriaVerb: 'Acheter',
        showAddToCart: true,
      };
  }
}
