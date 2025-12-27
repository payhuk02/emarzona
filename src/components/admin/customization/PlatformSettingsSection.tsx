/**
 * Section Paramètres Plateforme
 * Commissions, retraits, limites
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { DollarSign, Wallet, Users, Info, CreditCard, ShoppingCart } from '@/components/icons';
import { usePlatformCustomization } from '@/hooks/admin/usePlatformCustomization';
import { usePlatformSettingsDirect } from '@/hooks/usePlatformSettingsDirect';

interface PlatformSettingsSectionProps {
  onChange?: () => void;
}

export const PlatformSettingsSection = ({ onChange }: PlatformSettingsSectionProps) => {
  const { customizationData, save } = usePlatformCustomization();
  const { settings, updateSettings, isLoading } = usePlatformSettingsDirect();

  const handleSettingChange = (updates: Record<string, unknown>) => {
    if (settings) {
      updateSettings(updates);
    }
    if (onChange) onChange();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Chargement des paramètres...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Commissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Commissions
          </CardTitle>
          <CardDescription>
            Configurez les taux de commission de la plateforme
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="platform-commission">
              Commission plateforme (%)
            </Label>
            <Input
              id="platform-commission"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={settings?.platform_commission_rate || 10}
              onChange={(e) => {
                handleSettingChange({
                  platform_commission_rate: parseFloat(e.target.value),
                });
              }}
            />
            <p className="text-xs text-muted-foreground">
              Pourcentage prélevé sur chaque vente
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="referral-commission">
              Commission parrainage (%)
            </Label>
            <Input
              id="referral-commission"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={settings?.referral_commission_rate || 2}
              onChange={(e) => {
                handleSettingChange({
                  referral_commission_rate: parseFloat(e.target.value),
                });
              }}
            />
            <p className="text-xs text-muted-foreground">
              Pourcentage versé aux parrains
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Retraits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet  className ="h-5 w-5" />
            Retraits
          </CardTitle>
          <CardDescription>
            Paramètres de retrait pour les vendeurs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="min-withdrawal">
              Montant minimum de retrait (FCFA)
            </Label>
            <Input
              id="min-withdrawal"
              type="number"
              min="0"
              value={settings?.min_withdrawal_amount || 10000}
              onChange={(e) => {
                handleSettingChange({
                  min_withdrawal_amount: parseInt(e.target.value),
                });
              }}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Approbation automatique</Label>
              <p className="text-xs text-muted-foreground">
                Les retraits sont approuvés automatiquement
              </p>
            </div>
            <Switch
              checked={settings?.auto_approve_withdrawals || false}
              onCheckedChange={(checked) => {
                handleSettingChange({
                  auto_approve_withdrawals: checked,
                });
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Limites */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Limites
          </CardTitle>
          <CardDescription>
            Limites par utilisateur ou boutique
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="max-products">
              Nombre maximum de produits par boutique
            </Label>
            <Input
              id="max-products"
              type="number"
              min="0"
              value={customizationData?.settings?.limits?.maxProducts || 0}
              onChange={(e) => {
                save('settings', {
                  ...customizationData?.settings,
                  limits: {
                    ...customizationData?.settings?.limits,
                    maxProducts: parseInt(e.target.value) || 0,
                  },
                });
              }}
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Info className="h-3 w-3" />
              0 = illimité
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="max-stores">
              Nombre maximum de boutiques par utilisateur
            </Label>
            <Input
              id="max-stores"
              type="number"
              min="0"
              value={customizationData?.settings?.limits?.maxStores || 0}
              onChange={(e) => {
                save('settings', {
                  ...customizationData?.settings,
                  limits: {
                    ...customizationData?.settings?.limits,
                    maxStores: parseInt(e.target.value) || 0,
                  },
                });
              }}
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Info className="h-3 w-3" />
              0 = illimité
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Paramètres de paiement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Paiements
          </CardTitle>
          <CardDescription>
            Configuration des délais et méthodes de paiement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="payment-delay">
              Délai de paiement aux vendeurs (jours)
            </Label>
            <Input
              id="payment-delay"
              type="number"
              min="0"
              max="30"
              value={customizationData?.settings?.payment?.delayDays || 7}
              onChange={(e) => {
                save('settings', {
                  ...customizationData?.settings,
                  payment: {
                    ...customizationData?.settings?.payment,
                    delayDays: parseInt(e.target.value) || 7,
                  },
                });
              }}
            />
            <p className="text-xs text-muted-foreground">
              Nombre de jours avant le paiement aux vendeurs après une vente
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Devises supportées</Label>
            <div className="flex flex-wrap gap-2">
              {['XOF', 'EUR', 'USD', 'XAF'].map((currency) => (
                <div key={currency} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={customizationData?.settings?.payment?.currencies?.includes(currency) ?? true}
                    onChange={(e) => {
                      const currencies = customizationData?.settings?.payment?.currencies || ['XOF'];
                      const updated = e.target.checked
                        ? [...currencies, currency]
                        : currencies.filter(c => c !== currency);
                      save('settings', {
                        ...customizationData?.settings,
                        payment: {
                          ...customizationData?.settings?.payment,
                          currencies: updated,
                        },
                      });
                    }}
                    className="rounded"
                  />
                  <Label className="text-sm">{currency}</Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Paramètres Marketplace */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Marketplace
          </CardTitle>
          <CardDescription>
            Configuration de la marketplace
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="marketplace-commission">
              Commission marketplace (%)
            </Label>
            <Input
              id="marketplace-commission"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={customizationData?.settings?.marketplace?.commissionRate || 5}
              onChange={(e) => {
                save('settings', {
                  ...customizationData?.settings,
                  marketplace: {
                    ...customizationData?.settings?.marketplace,
                    commissionRate: parseFloat(e.target.value) || 5,
                  },
                });
              }}
            />
            <p className="text-xs text-muted-foreground">
              Commission prélevée sur les ventes de la marketplace
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="listing-fee">
              Frais de listing par produit (FCFA)
            </Label>
            <Input
              id="listing-fee"
              type="number"
              min="0"
              value={customizationData?.settings?.marketplace?.listingFee || 0}
              onChange={(e) => {
                save('settings', {
                  ...customizationData?.settings,
                  marketplace: {
                    ...customizationData?.settings?.marketplace,
                    listingFee: parseInt(e.target.value) || 0,
                  },
                });
              }}
            />
            <p className="text-xs text-muted-foreground">
              Frais à payer pour lister un produit (0 = gratuit)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Limites supplémentaires */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Limites supplémentaires
          </CardTitle>
          <CardDescription>
            Limites de commandes et retraits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="max-orders-per-day">
              Commandes maximum par jour
            </Label>
            <Input
              id="max-orders-per-day"
              type="number"
              min="0"
              value={customizationData?.settings?.limits?.maxOrdersPerDay || 0}
              onChange={(e) => {
                save('settings', {
                  ...customizationData?.settings,
                  limits: {
                    ...customizationData?.settings?.limits,
                    maxOrdersPerDay: parseInt(e.target.value) || 0,
                  },
                });
              }}
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Info className="h-3 w-3" />
              0 = illimité
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="max-withdrawals-per-month">
              Retraits maximum par mois
            </Label>
            <Input
              id="max-withdrawals-per-month"
              type="number"
              min="0"
              value={customizationData?.settings?.limits?.maxWithdrawalsPerMonth || 0}
              onChange={(e) => {
                save('settings', {
                  ...customizationData?.settings,
                  limits: {
                    ...customizationData?.settings?.limits,
                    maxWithdrawalsPerMonth: parseInt(e.target.value) || 0,
                  },
                });
              }}
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Info className="h-3 w-3" />
              0 = illimité
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="max-file-size">
              Taille maximum de fichier (MB)
            </Label>
            <Input
              id="max-file-size"
              type="number"
              min="1"
              value={customizationData?.settings?.limits?.maxFileSizeMB || 10}
              onChange={(e) => {
                save('settings', {
                  ...customizationData?.settings,
                  limits: {
                    ...customizationData?.settings?.limits,
                    maxFileSizeMB: parseInt(e.target.value) || 10,
                  },
                });
              }}
            />
            <p className="text-xs text-muted-foreground">
              Taille maximum pour les uploads de fichiers
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};







