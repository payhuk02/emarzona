/**
 * StorePaymentSettings Component
 * Configuration des paramètres de paiement avancés pour une boutique
 * Date: 2025-02-02
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, Save, Loader2, Info, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface StorePaymentSettingsProps {
  storeId: string;
  store: {
    minimum_order_amount?: number | null;
    maximum_order_amount?: number | null;
    accepted_currencies?: string[] | null;
    allow_partial_payment?: boolean;
    payment_terms?: string | null;
    invoice_prefix?: string | null;
    invoice_numbering?: 'sequential' | 'random' | null;
    free_shipping_threshold?: number | null;
    enabled_payment_providers?: string[] | null;
  };
  onUpdate?: () => void;
}

const AVAILABLE_CURRENCIES = [
  { code: 'XOF', name: 'Franc CFA Ouest-Africain', symbol: 'CFA' },
  { code: 'XAF', name: 'Franc CFA Centrafricain', symbol: 'FCFA' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'USD', name: 'Dollar US', symbol: '$' },
  { code: 'GBP', name: 'Livre Sterling', symbol: '£' },
  { code: 'NGN', name: 'Naira Nigérien', symbol: '₦' },
  { code: 'GHS', name: 'Cedi Ghanéen', symbol: '₵' },
];

const AVAILABLE_PAYMENT_PROVIDERS = [{ value: 'moneroo', label: 'Moneroo' }];

export const StorePaymentSettings: React.FC<StorePaymentSettingsProps> = ({
  storeId,
  store,
  onUpdate,
}) => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // État local pour les formulaires
  const [minimumOrderAmount, setMinimumOrderAmount] = useState<string>(
    store.minimum_order_amount?.toString() || '0'
  );
  const [maximumOrderAmount, setMaximumOrderAmount] = useState<string>(
    store.maximum_order_amount?.toString() || ''
  );
  const [acceptedCurrencies, setAcceptedCurrencies] = useState<string[]>(
    store.accepted_currencies || ['XOF']
  );
  const [allowPartialPayment, setAllowPartialPayment] = useState<boolean>(
    store.allow_partial_payment ?? false
  );
  const [paymentTerms, setPaymentTerms] = useState<string>(store.payment_terms || '');
  const [invoicePrefix, setInvoicePrefix] = useState<string>(store.invoice_prefix || 'INV-');
  const [invoiceNumbering, setInvoiceNumbering] = useState<'sequential' | 'random'>(
    store.invoice_numbering || 'sequential'
  );
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<string>(
    store.free_shipping_threshold?.toString() || ''
  );
  const [enabledProviders, setEnabledProviders] = useState<string[]>(
    store.enabled_payment_providers || ['moneroo']
  );

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates: Record<string, unknown> = {
        minimum_order_amount: minimumOrderAmount ? parseFloat(minimumOrderAmount) : 0,
        maximum_order_amount: maximumOrderAmount ? parseFloat(maximumOrderAmount) : null,
        accepted_currencies: acceptedCurrencies.length > 0 ? acceptedCurrencies : ['XOF'],
        allow_partial_payment: allowPartialPayment,
        payment_terms: paymentTerms || null,
        invoice_prefix: invoicePrefix || 'INV-',
        invoice_numbering: invoiceNumbering,
        free_shipping_threshold: freeShippingThreshold ? parseFloat(freeShippingThreshold) : null,
        enabled_payment_providers: enabledProviders.length > 0 ? enabledProviders : ['moneroo'],
      };

      const { error } = await supabase.from('stores').update(updates).eq('id', storeId);

      if (error) throw error;

      toast({
        title: 'Paramètres enregistrés',
        description: 'Les paramètres de paiement ont été mis à jour avec succès.',
      });

      if (onUpdate) onUpdate();
    } catch (error) {
      logger.error('Error saving payment settings', { error });
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder les paramètres. Veuillez réessayer.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleCurrency = (currency: string) => {
    if (acceptedCurrencies.includes(currency)) {
      if (acceptedCurrencies.length > 1) {
        setAcceptedCurrencies(acceptedCurrencies.filter(c => c !== currency));
      } else {
        toast({
          title: 'Action impossible',
          description: 'Au moins une devise doit être sélectionnée.',
          variant: 'destructive',
        });
      }
    } else {
      setAcceptedCurrencies([...acceptedCurrencies, currency]);
    }
  };

  const toggleProvider = (provider: string) => {
    if (enabledProviders.includes(provider)) {
      if (enabledProviders.length > 1) {
        setEnabledProviders(enabledProviders.filter(p => p !== provider));
      } else {
        toast({
          title: 'Action impossible',
          description: 'Au moins un moyen de paiement doit être activé.',
          variant: 'destructive',
        });
      }
    } else {
      setEnabledProviders([...enabledProviders, provider]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Méthodes de paiement acceptées */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Méthodes de paiement
          </CardTitle>
          <CardDescription>
            Configurez les méthodes de paiement acceptées par votre boutique
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Providers de paiement activés</Label>
            <div className="flex flex-wrap gap-3">
              {AVAILABLE_PAYMENT_PROVIDERS.map(provider => (
                <div key={provider.value} className="flex items-center space-x-2">
                  <Switch
                    checked={enabledProviders.includes(provider.value)}
                    onCheckedChange={() => toggleProvider(provider.value)}
                  />
                  <Label>{provider.label}</Label>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Les clients pourront payer avec les méthodes activées ci-dessus
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Devises acceptées */}
      <Card>
        <CardHeader>
          <CardTitle>Devises acceptées</CardTitle>
          <CardDescription>
            Sélectionnez les devises que vos clients peuvent utiliser
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {AVAILABLE_CURRENCIES.map(currency => (
              <div
                key={currency.code}
                className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  acceptedCurrencies.includes(currency.code)
                    ? 'border-primary bg-primary/5'
                    : 'border-muted hover:border-primary/50'
                }`}
                onClick={() => toggleCurrency(currency.code)}
              >
                <Switch
                  checked={acceptedCurrencies.includes(currency.code)}
                  onCheckedChange={() => toggleCurrency(currency.code)}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{currency.code}</span>
                    <span className="text-sm text-muted-foreground">{currency.symbol}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{currency.name}</p>
                </div>
                {acceptedCurrencies.includes(currency.code) && (
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                )}
              </div>
            ))}
          </div>
          {acceptedCurrencies.length === 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Au moins une devise doit être sélectionnée</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Montants de commande */}
      <Card>
        <CardHeader>
          <CardTitle>Montants de commande</CardTitle>
          <CardDescription>
            Configurez les montants minimum et maximum pour les commandes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minimum_order_amount">Montant minimum (en CFA)</Label>
              <Input
                id="minimum_order_amount"
                type="number"
                min="0"
                step="0.01"
                value={minimumOrderAmount}
                onChange={e => setMinimumOrderAmount(e.target.value)}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Montant minimum requis pour valider une commande (0 = pas de minimum)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maximum_order_amount">Montant maximum (en CFA)</Label>
              <Input
                id="maximum_order_amount"
                type="number"
                min="0"
                step="0.01"
                value={maximumOrderAmount}
                onChange={e => setMaximumOrderAmount(e.target.value)}
                placeholder="Aucune limite"
              />
              <p className="text-xs text-muted-foreground">
                Montant maximum autorisé (laisser vide = pas de maximum)
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="free_shipping_threshold">Seuil livraison gratuite (en CFA)</Label>
            <Input
              id="free_shipping_threshold"
              type="number"
              min="0"
              step="0.01"
              value={freeShippingThreshold}
              onChange={e => setFreeShippingThreshold(e.target.value)}
              placeholder="Aucune livraison gratuite"
            />
            <p className="text-xs text-muted-foreground">
              Montant de commande minimum pour bénéficier de la livraison gratuite
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Options de paiement */}
      <Card>
        <CardHeader>
          <CardTitle>Options de paiement</CardTitle>
          <CardDescription>Configurez les options supplémentaires de paiement</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Autoriser le paiement partiel</Label>
              <p className="text-xs text-muted-foreground">
                Permet aux clients de payer une commande en plusieurs fois
              </p>
            </div>
            <Switch checked={allowPartialPayment} onCheckedChange={setAllowPartialPayment} />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="payment_terms">Conditions de paiement</Label>
            <Textarea
              id="payment_terms"
              value={paymentTerms}
              onChange={e => setPaymentTerms(e.target.value)}
              placeholder="Ex: Paiement à la livraison, 30 jours net, etc."
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Conditions de paiement personnalisées affichées aux clients
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Facturation */}
      <Card>
        <CardHeader>
          <CardTitle>Paramètres de facturation</CardTitle>
          <CardDescription>Configurez le format des factures générées</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoice_prefix">Préfixe des factures</Label>
              <Input
                id="invoice_prefix"
                value={invoicePrefix}
                onChange={e => setInvoicePrefix(e.target.value)}
                placeholder="INV-"
                maxLength={20}
              />
              <p className="text-xs text-muted-foreground">
                Préfixe ajouté avant le numéro de facture (ex: "INV-", "FAC-")
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoice_numbering">Type de numérotation</Label>
              <Select
                value={invoiceNumbering}
                onValueChange={(value: 'sequential' | 'random') => setInvoiceNumbering(value)}
              >
                <SelectTrigger id="invoice_numbering">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sequential">Séquentielle</SelectItem>
                  <SelectItem value="random">Aléatoire</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Séquentielle: 001, 002, 003... | Aléatoire: Numéros uniques
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informations */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Ces paramètres s'appliquent à toutes les commandes passées sur votre boutique. Les
          modifications prendront effet immédiatement après sauvegarde.
        </AlertDescription>
      </Alert>

      {/* Bouton de sauvegarde */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Enregistrer les paramètres
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
