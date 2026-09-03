export interface Currency {
  code: string;
  name: string;
  symbol: string;
  locale: string;
  flag: string;
}

export const CURRENCIES: Currency[] = [
  // Devises africaines
  { code: 'XOF', name: 'Franc CFA (BCEAO)', symbol: 'FCFA', locale: 'fr-BF', flag: '🇧🇫' },
  { code: 'XAF', name: 'Franc CFA (BEAC)', symbol: 'FCFA', locale: 'fr-CM', flag: '🇨🇲' },
  { code: 'NGN', name: 'Naira nigérian', symbol: '₦', locale: 'en-NG', flag: '🇳🇬' },
  { code: 'GHS', name: 'Cedi ghanéen', symbol: 'GH₵', locale: 'en-GH', flag: '🇬🇭' },
  { code: 'KES', name: 'Shilling kenyan', symbol: 'KSh', locale: 'en-KE', flag: '🇰🇪' },
  { code: 'ZAR', name: 'Rand sud-africain', symbol: 'R', locale: 'en-ZA', flag: '🇿🇦' },
  { code: 'MAD', name: 'Dirham marocain', symbol: 'DH', locale: 'ar-MA', flag: '🇲🇦' },
  { code: 'TND', name: 'Dinar tunisien', symbol: 'DT', locale: 'ar-TN', flag: '🇹🇳' },
  { code: 'EGP', name: 'Livre égyptienne', symbol: 'E£', locale: 'ar-EG', flag: '🇪🇬' },
  { code: 'UGX', name: 'Shilling ougandais', symbol: 'USh', locale: 'en-UG', flag: '🇺🇬' },
  { code: 'TZS', name: 'Shilling tanzanien', symbol: 'TSh', locale: 'en-TZ', flag: '🇹🇿' },
  { code: 'RWF', name: 'Franc rwandais', symbol: 'FRw', locale: 'rw-RW', flag: '🇷🇼' },

  // Devises internationales
  { code: 'EUR', name: 'Euro', symbol: '€', locale: 'fr-FR', flag: '🇪🇺' },
  { code: 'USD', name: 'Dollar américain', symbol: '$', locale: 'en-US', flag: '🇺🇸' },
  { code: 'GBP', name: 'Livre sterling', symbol: '£', locale: 'en-GB', flag: '🇬🇧' },
  { code: 'CAD', name: 'Dollar canadien', symbol: 'CA$', locale: 'en-CA', flag: '🇨🇦' },
  { code: 'CHF', name: 'Franc suisse', symbol: 'CHF', locale: 'fr-CH', flag: '🇨🇭' },
  { code: 'JPY', name: 'Yen japonais', symbol: '¥', locale: 'ja-JP', flag: '🇯🇵' },
  { code: 'CNY', name: 'Yuan chinois', symbol: '¥', locale: 'zh-CN', flag: '🇨🇳' },
];

export const getCurrencyByCode = (code: string): Currency | undefined => {
  return CURRENCIES.find(c => c.code === code);
};

export const formatCurrency = (amount: number, currencyCode: string = 'XOF'): string => {
  const currency = getCurrencyByCode(currencyCode);

  if (!currency) {
    return `${amount.toLocaleString()} ${currencyCode}`;
  }

  try {
    return new Intl.NumberFormat(currency.locale, {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch (error) {
    // Fallback si la devise n'est pas supportée par Intl
    return `${currency.symbol}${amount.toLocaleString()}`;
  }
};

export const getCurrencySymbol = (currencyCode: string): string => {
  const currency = getCurrencyByCode(currencyCode);
  return currency?.symbol || currencyCode;
};
