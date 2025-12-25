/**
 * Hook React pour gérer la conversion de devises
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Currency,
  convertCurrency,
  formatCurrency,
  getCurrencySymbol,
  isSupportedCurrency,
  getSupportedCurrencies,
  getExchangeRate,
} from '@/lib/currency-converter';

export interface UseCurrencyOptions {
  defaultCurrency?: Currency;
  initialAmount?: number;
}

export interface UseCurrencyReturn {
  amount: number;
  currency: Currency;
  setAmount: (amount: number) => void;
  setCurrency: (currency: Currency) => void;
  convert: (to: Currency) => number;
  format: (amount?: number, currency?: Currency) => string;
  getSymbol: (currency?: Currency) => string;
  supportedCurrencies: Currency[];
  exchangeRate: (to: Currency) => number;
}

/**
 * Hook pour gérer la conversion et le formatage de devises
 */
export function useCurrency(options: UseCurrencyOptions = {}): UseCurrencyReturn {
  const { defaultCurrency = 'XOF', initialAmount = 0 } = options;

  const [amount, setAmount] = useState<number>(initialAmount);
  const [currency, setCurrency] = useState<Currency>(defaultCurrency);

  const convert = useCallback(
    (to: Currency): number => {
      return convertCurrency(amount, currency, to);
    },
    [amount, currency]
  );

  const format = useCallback(
    (amountToFormat?: number, currencyToFormat?: Currency): string => {
      const amt = amountToFormat ?? amount;
      const curr = currencyToFormat ?? currency;
      return formatCurrency(amt, curr);
    },
    [amount, currency]
  );

  const getSymbol = useCallback(
    (currencyToGet?: Currency): string => {
      return getCurrencySymbol(currencyToGet ?? currency);
    },
    [currency]
  );

  const exchangeRate = useCallback(
    (to: Currency): number => {
      return getExchangeRate(currency, to);
    },
    [currency]
  );

  return {
    amount,
    currency,
    setAmount,
    setCurrency,
    convert,
    format,
    getSymbol,
    supportedCurrencies: getSupportedCurrencies(),
    exchangeRate,
  };
}

/**
 * Hook pour récupérer la devise de l'utilisateur depuis les préférences
 */
export function useUserCurrency(): Currency {
  const [currency, setCurrency] = useState<Currency>('XOF');

  useEffect(() => {
    // Récupérer la devise depuis les préférences utilisateur ou localStorage
    const savedCurrency = localStorage.getItem('user_currency');
    if (savedCurrency && isSupportedCurrency(savedCurrency)) {
      setCurrency(savedCurrency);
    } else {
      // Détecter la devise depuis la locale du navigateur
      const locale = navigator.language || 'fr-FR';
      if (locale.includes('fr') || locale.includes('SN') || locale.includes('BF')) {
        setCurrency('XOF');
      } else if (locale.includes('en-US')) {
        setCurrency('USD');
      } else if (locale.includes('en-GB')) {
        setCurrency('GBP');
      } else if (locale.includes('en') || locale.includes('EU')) {
        setCurrency('EUR');
      }
    }
  }, []);

  return currency;
}

/**
 * Hook pour convertir un montant dans la devise de l'utilisateur
 */
export function useConvertToUserCurrency(amount: number, fromCurrency: Currency): number {
  const userCurrency = useUserCurrency();
  return convertCurrency(amount, fromCurrency, userCurrency);
}







