/**
 * Opérateurs Mobile Money par pays
 * Liste des opérateurs disponibles selon le pays
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
  | 'other';

export interface MobileMoneyOperatorInfo {
  value: MobileMoneyOperator;
  label: string;
  description?: string;
}

/**
 * Opérateurs disponibles par pays (code ISO)
 */
export const MOBILE_MONEY_OPERATORS_BY_COUNTRY: Record<string, MobileMoneyOperatorInfo[]> = {
  // Burkina Faso
  'BF': [
    { value: 'orange_money', label: 'Orange Money' },
    { value: 'moov_money', label: 'Moov Money' },
    { value: 'wave', label: 'Wave' },
    { value: 'other', label: 'Autre' },
  ],
  
  // Côte d'Ivoire
  'CI': [
    { value: 'orange_money', label: 'Orange Money' },
    { value: 'mtn_mobile_money', label: 'MTN Mobile Money' },
    { value: 'moov_money', label: 'Moov Money' },
    { value: 'wave', label: 'Wave' },
    { value: 'other', label: 'Autre' },
  ],
  
  // Sénégal
  'SN': [
    { value: 'orange_money', label: 'Orange Money' },
    { value: 'free_money', label: 'Free Money' },
    { value: 'wave', label: 'Wave' },
    { value: 'other', label: 'Autre' },
  ],
  
  // Mali
  'ML': [
    { value: 'orange_money', label: 'Orange Money' },
    { value: 'moov_money', label: 'Moov Money' },
    { value: 'wave', label: 'Wave' },
    { value: 'other', label: 'Autre' },
  ],
  
  // Bénin
  'BJ': [
    { value: 'orange_money', label: 'Orange Money' },
    { value: 'moov_money', label: 'Moov Money' },
    { value: 'mtn_mobile_money', label: 'MTN Mobile Money' },
    { value: 'other', label: 'Autre' },
  ],
  
  // Togo
  'TG': [
    { value: 'orange_money', label: 'Orange Money' },
    { value: 'moov_money', label: 'Moov Money' },
    { value: 'other', label: 'Autre' },
  ],
  
  // Guinée
  'GN': [
    { value: 'orange_money', label: 'Orange Money' },
    { value: 'mtn_mobile_money', label: 'MTN Mobile Money' },
    { value: 'other', label: 'Autre' },
  ],
  
  // Niger
  'NE': [
    { value: 'orange_money', label: 'Orange Money' },
    { value: 'moov_money', label: 'Moov Money' },
    { value: 'other', label: 'Autre' },
  ],
  
  // Cameroun
  'CM': [
    { value: 'orange_money', label: 'Orange Money' },
    { value: 'mtn_mobile_money', label: 'MTN Mobile Money' },
    { value: 'other', label: 'Autre' },
  ],
  
  // Gabon
  'GA': [
    { value: 'orange_money', label: 'Orange Money' },
    { value: 'moov_money', label: 'Moov Money' },
    { value: 'other', label: 'Autre' },
  ],
  
  // Congo (RDC)
  'CD': [
    { value: 'orange_money', label: 'Orange Money' },
    { value: 'mtn_mobile_money', label: 'MTN Mobile Money' },
    { value: 'airtel_money', label: 'Airtel Money' },
    { value: 'other', label: 'Autre' },
  ],
  
  // Congo-Brazzaville
  'CG': [
    { value: 'orange_money', label: 'Orange Money' },
    { value: 'mtn_mobile_money', label: 'MTN Mobile Money' },
    { value: 'other', label: 'Autre' },
  ],
  
  // Tchad
  'TD': [
    { value: 'orange_money', label: 'Orange Money' },
    { value: 'other', label: 'Autre' },
  ],
  
  // Centrafrique
  'CF': [
    { value: 'orange_money', label: 'Orange Money' },
    { value: 'other', label: 'Autre' },
  ],
  
  // Kenya (M-Pesa)
  'KE': [
    { value: 'm_pesa', label: 'M-Pesa' },
    { value: 'airtel_money', label: 'Airtel Money' },
    { value: 'other', label: 'Autre' },
  ],
  
  // Tanzanie
  'TZ': [
    { value: 'm_pesa', label: 'M-Pesa' },
    { value: 'airtel_money', label: 'Airtel Money' },
    { value: 'other', label: 'Autre' },
  ],
  
  // Zimbabwe (EcoCash)
  'ZW': [
    { value: 'ecocash', label: 'EcoCash' },
    { value: 'other', label: 'Autre' },
  ],
};

/**
 * Opérateurs par défaut (si le pays n'est pas dans la liste)
 */
export const DEFAULT_MOBILE_MONEY_OPERATORS: MobileMoneyOperatorInfo[] = [
  { value: 'orange_money', label: 'Orange Money' },
  { value: 'mtn_mobile_money', label: 'MTN Mobile Money' },
  { value: 'moov_money', label: 'Moov Money' },
  { value: 'wave', label: 'Wave' },
  { value: 'other', label: 'Autre' },
];

/**
 * Obtenir les opérateurs disponibles pour un pays
 */
export const getMobileMoneyOperatorsForCountry = (countryCode: string): MobileMoneyOperatorInfo[] => {
  return MOBILE_MONEY_OPERATORS_BY_COUNTRY[countryCode] || DEFAULT_MOBILE_MONEY_OPERATORS;
};

/**
 * Obtenir le premier opérateur par défaut pour un pays
 */
export const getDefaultOperatorForCountry = (countryCode: string): MobileMoneyOperator => {
  const operators = getMobileMoneyOperatorsForCountry(countryCode);
  return operators[0]?.value || 'orange_money';
};

