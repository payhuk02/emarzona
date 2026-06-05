/**
 * Section Paramètres Plateforme
 * Commissions, retraits, limites
 */

import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { DollarSign, Users, Info, CreditCard, ShoppingCart } from '@/components/icons';
import { ArrowRight } from 'lucide-react';
import { usePlatformCustomization } from '@/hooks/admin/usePlatformCustomization';

interface PlatformCustomizationSettings {
  payment?: {
    delayDays?: number;
    currencies?: string[];
  };
  marketplace?: {
    commissionRate?: number;
    listingFee?: number;
  };
  limits?: {
    maxProducts?: number;
    maxStores?: number;
    maxOrdersPerDay?: number;
    maxWithdrawalsPerMonth?: number;
    maxFileSizeMB?: number;
  };
}

interface PlatformSettingsSectionProps {
  onChange?: () => void;
}

export const PlatformSettingsSection = ({ onChange: _onChange }: PlatformSettingsSectionProps) => {
  const { customizationData, save } = usePlatformCustomization();
  const settings = (customizationData?.settings ?? {}) as PlatformCustomizationSettings;

  return (
    <div className="space-y-4 sm:space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="space-y-3">
          <p>
            Les commissions, retraits et notifications financières sont gérés sur la page dédiée
            (source unique <code className="bg-muted px-1 rounded text-xs">platform_settings</code>
            ).
          </p>
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link to="/admin/commission-settings">
              <DollarSign className="h-4 w-4" />
              Paramètres de commission
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </AlertDescription>
      </Alert>

      {/* Limites */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Limites
          </CardTitle>
          <CardDescription>Limites par utilisateur ou boutique</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="max-products">Nombre maximum de produits par boutique</Label>
            <Input
              id="max-products"
              type="number"
              min="0"
              value={settings.limits?.maxProducts || 0}
              onChange={e => {
                save('settings', {
                  ...settings,
                  limits: {
                    ...settings.limits,
                    maxProducts: parseInt(e.target.value) || 0,
                  },
                });
              }}
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Info className="h-3 w-3" />0 = illimité
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="max-stores">Nombre maximum de boutiques par utilisateur</Label>
            <Input
              id="max-stores"
              type="number"
              min="0"
              value={settings.limits?.maxStores || 0}
              onChange={e => {
                save('settings', {
                  ...settings,
                  limits: {
                    ...settings.limits,
                    maxStores: parseInt(e.target.value) || 0,
                  },
                });
              }}
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Info className="h-3 w-3" />0 = illimité
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
          <CardDescription>Configuration des délais et méthodes de paiement</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="payment-delay">Délai de paiement aux vendeurs (jours)</Label>
            <Input
              id="payment-delay"
              type="number"
              min="0"
              max="30"
              value={settings.payment?.delayDays || 7}
              onChange={e => {
                save('settings', {
                  ...settings,
                  payment: {
                    ...settings.payment,
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
              {['XOF', 'EUR', 'USD', 'XAF'].map(currency => (
                <div key={currency} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.payment?.currencies?.includes(currency) ?? true}
                    onChange={e => {
                      const currencies = settings.payment?.currencies || ['XOF'];
                      const updated = e.target.checked
                        ? [...currencies, currency]
                        : currencies.filter(c => c !== currency);
                      save('settings', {
                        ...settings,
                        payment: {
                          ...settings.payment,
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
          <CardDescription>Configuration de la marketplace</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="marketplace-commission">Commission marketplace (%)</Label>
            <Input
              id="marketplace-commission"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={settings.marketplace?.commissionRate || 5}
              onChange={e => {
                save('settings', {
                  ...settings,
                  marketplace: {
                    ...settings.marketplace,
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
            <Label htmlFor="listing-fee">Frais de listing par produit (FCFA)</Label>
            <Input
              id="listing-fee"
              type="number"
              min="0"
              value={settings.marketplace?.listingFee || 0}
              onChange={e => {
                save('settings', {
                  ...settings,
                  marketplace: {
                    ...settings.marketplace,
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
          <CardDescription>Limites de commandes et retraits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="max-orders-per-day">Commandes maximum par jour</Label>
            <Input
              id="max-orders-per-day"
              type="number"
              min="0"
              value={settings.limits?.maxOrdersPerDay || 0}
              onChange={e => {
                save('settings', {
                  ...settings,
                  limits: {
                    ...settings.limits,
                    maxOrdersPerDay: parseInt(e.target.value) || 0,
                  },
                });
              }}
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Info className="h-3 w-3" />0 = illimité
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="max-withdrawals-per-month">Retraits maximum par mois</Label>
            <Input
              id="max-withdrawals-per-month"
              type="number"
              min="0"
              value={settings.limits?.maxWithdrawalsPerMonth || 0}
              onChange={e => {
                save('settings', {
                  ...settings,
                  limits: {
                    ...settings.limits,
                    maxWithdrawalsPerMonth: parseInt(e.target.value) || 0,
                  },
                });
              }}
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Info className="h-3 w-3" />0 = illimité
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="max-file-size">Taille maximum de fichier (MB)</Label>
            <Input
              id="max-file-size"
              type="number"
              min="1"
              value={settings.limits?.maxFileSizeMB || 10}
              onChange={e => {
                save('settings', {
                  ...settings,
                  limits: {
                    ...settings.limits,
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
