/**
 * Composant de sélection du provider de paiement
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Wallet, CheckCircle2, AlertCircle } from '@/components/icons';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { useAuth } from '@/contexts/AuthContext';

export type PaymentProvider = 'moneroo';

interface PaymentProviderOption {
  value: PaymentProvider;
  label: string;
  description: string;
  icon: React.ReactNode;
  available: boolean;
  features: string[];
}

interface PaymentProviderSelectorProps {
  value?: PaymentProvider;
  onChange: (provider: PaymentProvider) => void;
  storeId?: string;
  amount?: number;
}

export function PaymentProviderSelector({
  value,
  onChange,
  storeId,
  amount,
}: PaymentProviderSelectorProps) {
  const { user } = useAuth();

  const [providers, setProviders] = useState<PaymentProviderOption[]>([
    {
      value: 'moneroo',
      label: 'Moneroo',
      description: 'Paiement sécurisé par Moneroo',
      icon: <Wallet  className ="h-5 w-5" />,
      available: true,
      features: ['Multi-devises', 'Remboursements', 'Notifications'],
    },
  ]);
  // (Réservé) on garde seulement l'état nécessaire
  const [userPreference, setUserPreference] = useState<PaymentProvider | null>(null);

  // Charger les préférences de l'utilisateur
  useEffect(() => {
    const loadUserPreference = async () => {
      if (!user) return;

      try {
        const { data } = await supabase
          .from('profiles')
          .select('payment_provider_preference')
          .eq('user_id', user.id)
          .single();

        if (data?.payment_provider_preference) {
          setUserPreference(data.payment_provider_preference as PaymentProvider);
          if (!value) {
            onChange(data.payment_provider_preference as PaymentProvider);
          }
        }
      } catch (error) {
        logger.error('Error loading user preference:', { error });
      }
    };

    loadUserPreference();
  }, [user, value, onChange]);

  // Charger les paramètres de la boutique
  useEffect(() => {
    const loadStoreSettings = async () => {
      if (!storeId) return;

      try {
        const { data } = await supabase
          .from('stores')
          .select('enabled_payment_providers')
          .eq('id', storeId)
          .single();

        if (data?.enabled_payment_providers) {
          // Désactiver les providers non autorisés
          setProviders(prev =>
            prev.map(p => ({
              ...p,
              available: data.enabled_payment_providers.includes(p.value),
            }))
          );
        }
      } catch (error) {
        logger.error('Error loading store settings:', { error });
      }
    };

    loadStoreSettings();
  }, [storeId]);

  // Sauvegarder la préférence de l'utilisateur
  const handleProviderChange = async (provider: PaymentProvider) => {
    onChange(provider);

    if (user) {
      try {
        await supabase
          .from('profiles')
          .update({ payment_provider_preference: provider })
          .eq('user_id', user.id);
      } catch (error) {
        logger.error('Error saving user preference:', { error });
      }
    }
  };

  const availableProviders = providers.filter(p => p.available);
  const selectedProvider = providers.find(p => p.value === value);

  if (availableProviders.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Aucun moyen de paiement disponible pour cette boutique.</AlertDescription>
      </Alert>
    );
  }

  if (availableProviders.length === 1) {
    // Si un seul provider est disponible, le sélectionner automatiquement
    if (value !== availableProviders[0].value) {
      handleProviderChange(availableProviders[0].value);
    }
    return null; // Ne pas afficher le sélecteur
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Moyen de paiement</CardTitle>
        <CardDescription>Choisissez votre moyen de paiement préféré</CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup value={value} onValueChange={handleProviderChange}>
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
                  id={provider.value}
                  disabled={!provider.available}
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label
                    htmlFor={provider.value}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <div className="text-primary">{provider.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{provider.label}</span>
                        {value === provider.value && (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        )}
                        {!provider.available && (
                          <Badge variant="secondary" className="text-xs">
                            Non disponible
                          </Badge>
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

        {selectedProvider && amount && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Montant à payer:</strong> {amount.toLocaleString()} XOF
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






