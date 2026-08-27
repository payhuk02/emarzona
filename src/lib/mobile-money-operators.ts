/**
 * Opérateurs / portefeuilles Mobile Money réellement présents par pays (ISO 3166-1 alpha-2).
 * Aligné sur le catalogue MoneyFusion payout (CI, BF, BJ, TG, SN, ML, NE, CD, CG, CM, GA, GN, …)
 * et sur les opérateurs nationaux majeurs ailleurs.
 * Les pays sans Mobile Money usuel retournent une liste vide — pas de fallback Afrique de l’Ouest.
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
const ECO: MobileMoneyOperatorInfo = { value: 'ecocash', label: 'EcoCash' };
const TMONEY: MobileMoneyOperatorInfo = { value: 't_money', label: 'T-Money' };
const AMANA: MobileMoneyOperatorInfo = { value: 'amana', label: 'Amana' };
const ZAMANI: MobileMoneyOperatorInfo = { value: 'zamani_cash', label: 'Zamani Cash' };
const NITA: MobileMoneyOperatorInfo = { value: 'nita', label: 'Nita' };
const OTHER: MobileMoneyOperatorInfo = { value: 'other', label: 'Autre' };

const withOther = (ops: MobileMoneyOperatorInfo[]): MobileMoneyOperatorInfo[] => [...ops, OTHER];

export const MOBILE_MONEY_OPERATORS_BY_COUNTRY: Record<string, MobileMoneyOperatorInfo[]> = {
  // UEMOA / MoneyFusion
  BF: withOther([OM, MOOV, WAVE]),
  CI: withOther([OM, MTN, MOOV, WAVE]),
  SN: withOther([OM, FREE, WAVE]),
  ML: withOther([OM, MOOV, WAVE]),
  BJ: withOther([MTN, MOOV]),
  TG: withOther([TMONEY, MOOV]),
  NE: withOther([AIRTEL, MOOV, AMANA, ZAMANI, NITA]),
  // Afrique de l’Ouest / Centre
  GN: withOther([OM, MTN]),
  GW: withOther([OM, MTN]),
  GM: withOther([WAVE]),
  SL: withOther([OM]),
  LR: withOther([OM, MTN]),
  GH: withOther([MTN, AIRTEL, WAVE]),
  NG: withOther([MTN, AIRTEL]),
  CM: withOther([OM, MTN]),
  GA: withOther([MOOV, AIRTEL]),
  CG: withOther([MTN, AIRTEL]),
  CD: withOther([MPESA, AIRTEL, OM]),
  TD: withOther([AIRTEL, MOOV, OM]),
  CF: withOther([OM]),
  GQ: withOther([MTN]),
  // Afrique de l’Est / Australe
  KE: withOther([MPESA, AIRTEL]),
  TZ: withOther([MPESA, AIRTEL]),
  UG: withOther([MTN, AIRTEL]),
  RW: withOther([MTN, AIRTEL]),
  BI: withOther([ECO]),
  MW: withOther([AIRTEL]),
  ZM: withOther([MTN, AIRTEL]),
  MZ: withOther([MPESA]),
  MG: withOther([OM, AIRTEL]),
  ZW: withOther([ECO]),
  LS: withOther([ECO]),
  ZA: withOther([MTN]),
  // Maghreb
  MA: withOther([OM]),
  TN: withOther([OM]),
  DZ: withOther([OM]),
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
