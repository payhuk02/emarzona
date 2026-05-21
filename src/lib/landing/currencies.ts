/** Devises affichées sur le landing — logos dans public/landing/currencies/{code}.svg */
export type LandingCurrency = {
  code: string;
  name: string;
  symbol: string;
  region: 'Afrique' | 'Europe' | 'Amériques' | 'Moyen-Orient';
};

export const LANDING_CURRENCIES: LandingCurrency[] = [
  { code: 'XOF', name: 'Franc CFA (UEMOA)', symbol: 'FCFA', region: 'Afrique' },
  { code: 'XAF', name: 'Franc CFA (CEMAC)', symbol: 'FCFA', region: 'Afrique' },
  { code: 'NGN', name: 'Naira', symbol: '₦', region: 'Afrique' },
  { code: 'GHS', name: 'Cedi', symbol: '₵', region: 'Afrique' },
  { code: 'KES', name: 'Shilling kenyan', symbol: 'KSh', region: 'Afrique' },
  { code: 'ZAR', name: 'Rand', symbol: 'R', region: 'Afrique' },
  { code: 'UGX', name: 'Shilling ougandais', symbol: 'USh', region: 'Afrique' },
  { code: 'TZS', name: 'Shilling tanzanien', symbol: 'TSh', region: 'Afrique' },
  { code: 'RWF', name: 'Franc rwandais', symbol: 'FRw', region: 'Afrique' },
  { code: 'ETB', name: 'Birr', symbol: 'Br', region: 'Afrique' },
  { code: 'MAD', name: 'Dirham marocain', symbol: 'MAD', region: 'Afrique' },
  { code: 'EUR', name: 'Euro', symbol: '€', region: 'Europe' },
  { code: 'GBP', name: 'Livre sterling', symbol: '£', region: 'Europe' },
  { code: 'CHF', name: 'Franc suisse', symbol: 'CHF', region: 'Europe' },
  { code: 'USD', name: 'Dollar US', symbol: '$', region: 'Amériques' },
  { code: 'CAD', name: 'Dollar canadien', symbol: 'CA$', region: 'Amériques' },
  { code: 'AED', name: 'Dirham des EAU', symbol: 'AED', region: 'Moyen-Orient' },
];
