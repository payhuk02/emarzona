/**
 * Opérateurs Mobile Money proposés aux vendeurs pour un retrait MoneyFusion.
 * Uniquement les couples pays/opérateur mappés dans moneyfusion-withdraw-mode
 * (doc payout + catalogue live). Les autres pays : virement / carte.
 * `ecocash` reste dans le type pour les méthodes de paiement déjà enregistrées.
 */

export type MobileMoneyOperator =
  | 'orange_money'
  | 'mtn_mobile_money'
  | 'moov_money'
  | 'wave'
  | 'free_money'
  | 'm_pesa'
  | 'airtel_money'
  | 'ecocash'
  | 't_money'
  | 'amana'
  | 'zamani_cash'
  | 'nita'
  | 'other';

export interface MobileMoneyOperatorInfo {
  value: MobileMoneyOperator;
  label: string;
  description?: string;
}

const OM: MobileMoneyOperatorInfo = { value: 'orange_money', label: 'Orange Money' };
const MTN: MobileMoneyOperatorInfo = { value: 'mtn_mobile_money', label: 'MTN Mobile Money' };
const MOOV: MobileMoneyOperatorInfo = { value: 'moov_money', label: 'Moov Money' };
const WAVE: MobileMoneyOperatorInfo = { value: 'wave', label: 'Wave' };
const FREE: MobileMoneyOperatorInfo = { value: 'free_money', label: 'Free Money' };
const MPESA: MobileMoneyOperatorInfo = { value: 'm_pesa', label: 'M-Pesa' };
const AIRTEL: MobileMoneyOperatorInfo = { value: 'airtel_money', label: 'Airtel Money' };
const TMONEY: MobileMoneyOperatorInfo = { value: 't_money', label: 'T-Money' };
const AMANA: MobileMoneyOperatorInfo = { value: 'amana', label: 'Amana' };
const ZAMANI: MobileMoneyOperatorInfo = { value: 'zamani_cash', label: 'Zamani Cash' };
const NITA: MobileMoneyOperatorInfo = { value: 'nita', label: 'Nita' };
const OTHER: MobileMoneyOperatorInfo = { value: 'other', label: 'Autre' };

const withOther = (ops: MobileMoneyOperatorInfo[]): MobileMoneyOperatorInfo[] => [...ops, OTHER];

/**
 * Catalogue UI = fallback offline MoneyFusion (voir moneyfusion-withdraw-mode.ts).
 */
export const MOBILE_MONEY_OPERATORS_BY_COUNTRY: Record<string, MobileMoneyOperatorInfo[]> = {
  BF: withOther([OM, MOOV]),
  CI: withOther([OM, MTN, MOOV, WAVE]),
  SN: withOther([OM, FREE, WAVE]),
  ML: withOther([OM]),
  BJ: withOther([MTN, MOOV]),
  TG: withOther([TMONEY, MOOV]),
  NE: withOther([AIRTEL, MTN, MOOV, AMANA, ZAMANI, NITA]),
  GN: withOther([OM, MTN]),
  GW: withOther([MTN]),
  GM: withOther([OM]),
  SL: withOther([OM]),
  GH: withOther([MTN, AIRTEL]),
  CM: withOther([OM, MTN]),
  GA: withOther([AIRTEL, MOOV]),
  CG: withOther([MTN]),
  CD: withOther([MPESA, AIRTEL]),
  TD: withOther([AIRTEL, MOOV]),
  CF: withOther([OM]),
  KE: withOther([MPESA]),
  TZ: withOther([MPESA, AIRTEL]),
  UG: withOther([MTN]),
  RW: withOther([MTN]),
};

export const DEFAULT_MOBILE_MONEY_OPERATORS: MobileMoneyOperatorInfo[] = [];

export const getMobileMoneyOperatorsForCountry = (
  countryCode: string
): MobileMoneyOperatorInfo[] => {
  const code = (countryCode || '').trim().toUpperCase();
  return MOBILE_MONEY_OPERATORS_BY_COUNTRY[code] || DEFAULT_MOBILE_MONEY_OPERATORS;
};

export const countryHasMobileMoney = (countryCode: string): boolean => {
  return getMobileMoneyOperatorsForCountry(countryCode).some(op => op.value !== 'other');
};

export const getDefaultOperatorForCountry = (countryCode: string): MobileMoneyOperator => {
  const operators = getMobileMoneyOperatorsForCountry(countryCode);
  return operators.find(op => op.value !== 'other')?.value || operators[0]?.value || 'other';
};

export const isOperatorAvailableInCountry = (countryCode: string, operator: string): boolean => {
  return getMobileMoneyOperatorsForCountry(countryCode).some(op => op.value === operator);
};
