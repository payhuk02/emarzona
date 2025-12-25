/**
 * Hook pour la gestion des devises et taux de change
 * Date: 28 Janvier 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  decimal_places: number;
  symbol_position: 'before' | 'after';
  thousands_separator: string;
  decimal_separator: string;
  is_active: boolean;
  is_base_currency: boolean;
  country_code?: string;
  region?: string;
  created_at: string;
  updated_at: string;
}

export interface ExchangeRate {
  id: string;
  from_currency: string;
  to_currency: string;
  rate: number;
  source: string;
  auto_update: boolean;
  last_updated: string;
  valid_from: string;
  valid_to?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RegionalPrice {
  id: string;
  product_id: string;
  currency_code: string;
  price: number;
  promotional_price?: number;
  country_codes?: string[];
  region?: string;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Récupérer toutes les devises actives
 */
export function useCurrencies(activeOnly: boolean = true) {
  return useQuery({
    queryKey: ['currencies', activeOnly],
    queryFn: async () => {
      let query = supabase
        .from('currencies')
        .select('*')
        .order('is_base_currency', { ascending: false })
        .order('name', { ascending: true });

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Currency[];
    },
  });
}

/**
 * Récupérer les taux de change
 */
export function useExchangeRates(fromCurrency?: string, toCurrency?: string) {
  return useQuery({
    queryKey: ['exchange-rates', fromCurrency, toCurrency],
    queryFn: async () => {
      let query = supabase
        .from('exchange_rates')
        .select('*')
        .eq('is_active', true)
        .order('last_updated', { ascending: false });

      if (fromCurrency) {
        query = query.eq('from_currency', fromCurrency);
      }

      if (toCurrency) {
        query = query.eq('to_currency', toCurrency);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as ExchangeRate[];
    },
  });
}

/**
 * Récupérer les prix régionaux d'un produit
 */
export function useRegionalPrices(productId: string | null) {
  return useQuery({
    queryKey: ['regional-prices', productId],
    queryFn: async () => {
      if (!productId) return [];

      const { data, error } = await supabase
        .from('regional_prices')
        .select('*')
        .eq('product_id', productId)
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (error) throw error;
      return data as RegionalPrice[];
    },
    enabled: !!productId,
  });
}

/**
 * Convertir un montant d'une devise à une autre
 */
export function useConvertCurrency() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      amount,
      fromCurrency,
      toCurrency,
    }: {
      amount: number;
      fromCurrency: string;
      toCurrency: string;
    }) => {
      const { data, error } = await supabase.rpc('convert_currency', {
        p_amount: amount,
        p_from_currency: fromCurrency,
        p_to_currency: toCurrency,
      });

      if (error) throw error;
      return data as number;
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur de conversion',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Obtenir le prix d'un produit dans une devise spécifique
 */
export function useProductPriceInCurrency() {
  return useMutation({
    mutationFn: async ({
      productId,
      currencyCode,
      countryCode,
    }: {
      productId: string;
      currencyCode: string;
      countryCode?: string;
    }) => {
      const { data, error } = await supabase.rpc('get_product_price_in_currency', {
        p_product_id: productId,
        p_currency_code: currencyCode,
        p_country_code: countryCode || null,
      });

      if (error) throw error;
      return data as number;
    },
  });
}

/**
 * Créer un prix régional
 */
export function useCreateRegionalPrice() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      product_id: string;
      currency_code: string;
      price: number;
      promotional_price?: number;
      country_codes?: string[];
      region?: string;
      priority?: number;
    }) => {
      const { data: regionalPrice, error } = await supabase
        .from('regional_prices')
        .insert({
          ...data,
          is_active: true,
          priority: data.priority || 0,
        })
        .select()
        .single();

      if (error) throw error;
      return regionalPrice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regional-prices'] });
      toast({
        title: 'Prix régional créé',
        description: 'Le prix régional a été ajouté avec succès',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Mettre à jour les taux de change
 */
export function useUpdateExchangeRates() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rates: Array<{
      from_currency: string;
      to_currency: string;
      rate: number;
      source?: string;
    }>) => {
      const updates = [];

      for (const rateData of rates) {
        const { error } = await supabase
          .from('exchange_rates')
          .upsert({
            from_currency: rateData.from_currency,
            to_currency: rateData.to_currency,
            rate: rateData.rate,
            source: rateData.source || 'manual',
            last_updated: new Date().toISOString(),
          }, {
            onConflict: 'from_currency,to_currency',
          });

        if (error) {
          updates.push({ ...rateData, success: false, error: error.message });
        } else {
          updates.push({ ...rateData, success: true });
        }
      }

      return updates;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['exchange-rates'] });
      const successCount = results.filter((r) => r.success).length;
      toast({
        title: 'Taux mis à jour',
        description: `${successCount} taux de change mis à jour`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Formater un montant selon les règles d'une devise
 */
export function useFormatCurrency() {
  const { data: currencies } = useCurrencies(true);

  const formatCurrency = (amount: number, currencyCode: string) => {
    const currency = currencies?.find((c) => c.code === currencyCode);
    if (!currency) {
      return `${amount} ${currencyCode}`;
    }

    const formattedAmount = amount.toLocaleString('fr-FR', {
      minimumFractionDigits: currency.decimal_places,
      maximumFractionDigits: currency.decimal_places,
    });

    if (currency.symbol_position === 'before') {
      return `${currency.symbol} ${formattedAmount}`;
    } else {
      return `${formattedAmount} ${currency.symbol}`;
    }
  };

  return { formatCurrency };
}

