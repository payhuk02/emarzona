/**
 * Sélection dynamique du moyen de paiement (RPC get_store_payment_options)
 */

import { useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Wallet, CreditCard, CheckCircle2, AlertCircle, Loader2 } from '@/components/icons';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { useAuth } from '@/contexts/AuthContext';
import {
  useStorePaymentOptions,
  rpcProviderToCheckout,
  checkoutProviderToRpc,
  type CheckoutPaymentProvider,
} from '@/hooks/payments/useStorePaymentOptions';
import { isPaymentOrchestrationV2Enabled } from '@/lib/payments/feature-flags';

export type PaymentProvider = CheckoutPaymentProvider;

interface PaymentProviderOption {
  value: CheckoutPaymentProvider;
  label: string;
  description: string;
  icon: React.ReactNode;
  available: boolean;
  features: string[];
}

const PROVIDER_META: Record<
  CheckoutPaymentProvider,
  Omit<PaymentProviderOption, 'value' | 'available'>
> = {
  moneroo: {
    label: 'Moneroo',
    description: 'Mobile money et paiements locaux (XOF, Afrique)',
    icon: <Wallet className="h-5 w-5" />,
    features: ['Mobile Money', 'XOF / XAF', 'Paiement local'],
  },
  stripe_connect: {
    label: 'Carte bancaire (Stripe)',
    description: 'Visa, Mastercard, Apple Pay — paiement international',
    icon: <CreditCard className="h-5 w-5" />,
    features: ['Cartes internationales', 'USD / EUR / GBP'],
  },
  paypal_commerce: {
    label: 'PayPal',
    description: 'Compte PayPal ou carte via PayPal',
    icon: <Wallet className="h-5 w-5" />,
    features: ['PayPal', 'Protection acheteur'],
  },
  flutterwave_connect: {
    label: 'Flutterwave',
    description: 'Paiements Afrique anglophone et cartes',
    icon: <CreditCard className="h-5 w-5" />,
    features: ['NGN, GHS, KES', 'Cartes'],
  },
};

interface PaymentProviderSelectorProps {
  value?: PaymentProvider;
  onChange: (provider: PaymentProvider) => void;
  storeId?: string;
  amount?: number;
  currency?: string;
  buyerCountry?: string | null;
}

export function PaymentProviderSelector({
  value,
  onChange,
  storeId,
  amount,
  currency = 'XOF',
  buyerCountry,
}: PaymentProviderSelectorProps) {
  const { user } = useAuth();
  const orchestrationV2 = isPaymentOrchestrationV2Enabled();

  const {
    data: rpcOptions,
    isLoading,
    isError,
  } = useStorePaymentOptions({
    storeId,
    currency,
    buyerCountry,
    enabled: orchestrationV2 && !!storeId,
  });

  const providers = useMemo((): PaymentProviderOption[] => {
    if (!orchestrationV2 || !storeId) {
      return [
        {
          value: 'moneroo',
          ...PROVIDER_META.moneroo,
          available: true,
        },
      ];
    }

    const source = (rpcOptions ?? []).filter(opt => opt.provider !== 'flutterwave_connect');
    return source.map(opt => {
      const checkoutValue = rpcProviderToCheckout(opt.provider);
      const meta = PROVIDER_META[checkoutValue] ?? PROVIDER_META.moneroo;
      return {
        value: checkoutValue,
        label: opt.label || meta.label,
        description: meta.description,
        icon: meta.icon,
        features: meta.features,
        available: true,
      };
    });
  }, [orchestrationV2, storeId, rpcOptions]);

  useEffect(() => {
    const loadUserPreference = async () => {
      if (!user || value) return;
      try {
        const { data } = await supabase
          .from('profiles')
          .select('payment_provider_preference')
          .eq('user_id', user.id)
          .single();

        const pref = data?.payment_provider_preference;
        if (!pref) return;

        const checkoutPref: CheckoutPaymentProvider =
          pref === 'moneroo' || pref === 'moneroo_platform'
            ? 'moneroo'
            : pref === 'stripe_connect' ||
                pref === 'paypal_commerce' ||
                pref === 'flutterwave_connect'
              ? pref
              : 'moneroo';

        const match = providers.find(p => p.value === checkoutPref);
        if (match) onChange(match.value);
      } catch (error) {
        logger.error('Error loading user preference:', { error });
      }
    };

    loadUserPreference();
  }, [user, value, onChange, providers]);

  const handleProviderChange = async (provider: CheckoutPaymentProvider) => {
    onChange(provider);

    if (user) {
      try {
        const dbPref = checkoutProviderToRpc(provider);
        await supabase
          .from('profiles')
          .update({ payment_provider_preference: dbPref })
          .eq('user_id', user.id);
      } catch (error) {
        logger.debug('Could not save payment preference', { error, provider });
      }
    }
  };

  const availableProviders = providers.filter(p => p.available);
  const selectedProvider = providers.find(p => p.value === value);

  useEffect(() => {
    if (availableProviders.length === 1 && value !== availableProviders[0].value) {
      handleProviderChange(availableProviders[0].value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- auto-select single option
  }, [availableProviders.length, availableProviders[0]?.value]);

  if (isLoading && orchestrationV2 && storeId) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (isError && availableProviders.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Impossible de charger les moyens de paiement.</AlertDescription>
      </Alert>
    );
  }

  if (availableProviders.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Aucun moyen de paiement disponible pour cette boutique.</AlertDescription>
      </Alert>
    );
  }

  if (availableProviders.length === 1) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Moyen de paiement</CardTitle>
        <CardDescription>Choisissez comment vous souhaitez payer</CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={value}
          onValueChange={v => handleProviderChange(v as CheckoutPaymentProvider)}
        >
          <div className="space-y-3">
            {providers.map(provider => (
              <div
                key={provider.value}
                className={`
                  relative flex items-start space-x-3 rounded-lg border p-4
                  ${
                    provider.available
                      ? 'cursor-pointer hover:bg-accent'
                      : 'opacity-50 cursor-not-allowed'
                  }
                  ${value === provider.value ? 'border-primary bg-accent' : ''}
                `}
                onClick={() => provider.available && handleProviderChange(provider.value)}
              >
                <RadioGroupItem
                  value={provider.value}
                  id={`payment-${provider.value}`}
                  disabled={!provider.available}
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label
                    htmlFor={`payment-${provider.value}`}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <div className="text-primary">{provider.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{provider.label}</span>
                        {value === provider.value && (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{provider.description}</p>
                    </div>
                  </Label>
                  {provider.features.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {provider.features.map(feature => (
                        <Badge key={feature} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </RadioGroup>

        {selectedProvider && amount != null && amount > 0 && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Montant à payer :</strong>{' '}
              {amount.toLocaleString(undefined, {
                style: 'currency',
                currency: currency.length === 3 ? currency : 'XOF',
                maximumFractionDigits: 0,
              })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Vous serez redirigé vers {selectedProvider.label} pour finaliser votre paiement.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
