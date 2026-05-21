import type { LandingCountryRegionKey } from '@/lib/landing/countries';

/** Devises affichées sur le landing — logos dans public/landing/currencies/{code}.svg */
export type LandingCurrency = {
  code: string;
  symbol: string;
  regionKey: LandingCountryRegionKey;
};

export const LANDING_CURRENCIES: LandingCurrency[] = [
  { code: 'XOF', symbol: 'FCFA', regionKey: 'africa' },
  { code: 'XAF', symbol: 'FCFA', regionKey: 'africa' },
  { code: 'NGN', symbol: '₦', regionKey: 'africa' },
  { code: 'GHS', symbol: '₵', regionKey: 'africa' },
  { code: 'KES', symbol: 'KSh', regionKey: 'africa' },
  { code: 'ZAR', symbol: 'R', regionKey: 'africa' },
  { code: 'UGX', symbol: 'USh', regionKey: 'africa' },
  { code: 'TZS', symbol: 'TSh', regionKey: 'africa' },
  { code: 'RWF', symbol: 'FRw', regionKey: 'africa' },
  { code: 'ETB', symbol: 'Br', regionKey: 'africa' },
  { code: 'MAD', symbol: 'MAD', regionKey: 'africa' },
  { code: 'EUR', symbol: '€', regionKey: 'europe' },
  { code: 'GBP', symbol: '£', regionKey: 'europe' },
  { code: 'CHF', symbol: 'CHF', regionKey: 'europe' },
  { code: 'USD', symbol: '$', regionKey: 'americas' },
  { code: 'CAD', symbol: 'CA$', regionKey: 'americas' },
  { code: 'AED', symbol: 'AED', regionKey: 'middleEast' },
];
