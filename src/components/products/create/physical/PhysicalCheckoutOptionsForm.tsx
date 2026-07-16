/**
 * Options de checkout pour produits physiques (wizard vendeur)
 * — Mode : paiement en ligne ou à la livraison
 * — Libellé du bouton sur la carte produit
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { CreditCard, Info, Truck, MousePointerClick } from 'lucide-react';
import {
  PHYSICAL_CHECKOUT_METHOD_LABELS,
  PHYSICAL_CTA_BUTTON_PRESETS,
  type PhysicalCheckoutMethod,
} from '@/constants/physical-checkout-options';
import type { PhysicalProductPaymentOptions } from '@/types/physical-product';

type PhysicalCheckoutOptionsFormProps = {
  data: Partial<PhysicalProductPaymentOptions>;
  onUpdate: (data: PhysicalProductPaymentOptions) => void;
};

export function PhysicalCheckoutOptionsForm({ data, onUpdate }: PhysicalCheckoutOptionsFormProps) {
  const checkoutMethod: PhysicalCheckoutMethod =
    data.checkout_method === 'cash_on_delivery' ? 'cash_on_delivery' : 'online';
  const ctaLabel = data.cta_button_label ?? 'Commander';
  const isPreset = PHYSICAL_CTA_BUTTON_PRESETS.includes(
    ctaLabel as (typeof PHYSICAL_CTA_BUTTON_PRESETS)[number]
  );

  const patch = (partial: Partial<PhysicalProductPaymentOptions>) => {
    onUpdate({
      checkout_method: checkoutMethod,
      cta_button_label: ctaLabel,
      payment_type: data.payment_type ?? 'full',
      percentage_rate: data.percentage_rate ?? 30,
      ...partial,
    });
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Ces réglages s&apos;affichent sur la carte produit : le mode de paiement juste sous le
          nom, et le libellé du bouton d&apos;action choisi par vos clients.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Mode de paiement proposé</CardTitle>
          <CardDescription>
            Choisissez comment vos clients règlent ce produit physique
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={checkoutMethod}
            onValueChange={value => patch({ checkout_method: value as PhysicalCheckoutMethod })}
            className="space-y-3"
          >
            <div className="flex items-start gap-3 rounded-lg border p-4 hover:border-primary transition-colors">
              <RadioGroupItem value="online" id="checkout-online" className="mt-1" />
              <Label htmlFor="checkout-online" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2 font-semibold mb-1">
                  <CreditCard className="h-4 w-4 text-primary" />
                  {PHYSICAL_CHECKOUT_METHOD_LABELS.online}
                </div>
                <p className="text-sm text-muted-foreground font-normal">
                  Le client paie en ligne (GeniusPay, carte, mobile money) avant ou à la commande.
                </p>
              </Label>
            </div>

            <div className="flex items-start gap-3 rounded-lg border p-4 hover:border-primary transition-colors">
              <RadioGroupItem value="cash_on_delivery" id="checkout-cod" className="mt-1" />
              <Label htmlFor="checkout-cod" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2 font-semibold mb-1">
                  <Truck className="h-4 w-4 text-amber-600" />
                  {PHYSICAL_CHECKOUT_METHOD_LABELS.cash_on_delivery}
                </div>
                <p className="text-sm text-muted-foreground font-normal">
                  Le client confirme sa commande et paie à la livraison. Idéal pour la confiance
                  locale.
                </p>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MousePointerClick className="h-5 w-5" />
            Texte du bouton sur la carte
          </CardTitle>
          <CardDescription>
            Ce libellé remplace « Acheter » sur la carte produit physique
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cta-preset">Suggestions</Label>
            <Select
              value={isPreset ? ctaLabel : 'custom'}
              onValueChange={value => {
                if (value !== 'custom') {
                  patch({ cta_button_label: value });
                }
              }}
            >
              <SelectTrigger id="cta-preset">
                <SelectValue placeholder="Choisir un libellé" />
              </SelectTrigger>
              <SelectContent>
                {PHYSICAL_CTA_BUTTON_PRESETS.map(label => (
                  <SelectItem key={label} value={label}>
                    {label}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Personnalisé…</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cta-custom">Libellé affiché</Label>
            <Input
              id="cta-custom"
              value={ctaLabel}
              maxLength={40}
              onChange={e => patch({ cta_button_label: e.target.value })}
              placeholder="Ex. Commander maintenant"
            />
            <p className="text-xs text-muted-foreground">
              Aperçu bouton :{' '}
              <span className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1 text-xs text-white">
                {ctaLabel || 'Commander'}
              </span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
