/**
 * Options de checkout pour produits physiques (wizard vendeur)
 * — Paiement en ligne, à la livraison, ou garantie + solde à la livraison
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
import { CreditCard, Info, Truck, MousePointerClick, ShieldCheck } from 'lucide-react';
import {
  PHYSICAL_CHECKOUT_METHOD_LABELS,
  PHYSICAL_CTA_BUTTON_PRESETS,
  isPhysicalCheckoutMethod,
  type PhysicalCheckoutMethod,
} from '@/constants/physical-checkout-options';
import {
  computePhysicalGuaranteeBreakdown,
  suggestedGuaranteeAmount,
  validateGuaranteeAmount,
} from '@/lib/physical/physical-guarantee';
import { formatPrice } from '@/lib/product-helpers';
import type { PhysicalProductPaymentOptions } from '@/types/physical-product';

type PhysicalCheckoutOptionsFormProps = {
  data: Partial<PhysicalProductPaymentOptions>;
  onUpdate: (data: PhysicalProductPaymentOptions) => void;
  productPrice?: number;
  currency?: string;
};

export function PhysicalCheckoutOptionsForm({
  data,
  onUpdate,
  productPrice = 0,
  currency = 'XOF',
}: PhysicalCheckoutOptionsFormProps) {
  const checkoutMethod: PhysicalCheckoutMethod = isPhysicalCheckoutMethod(data.checkout_method)
    ? data.checkout_method
    : 'online';
  const ctaLabel = data.cta_button_label ?? 'Commander';
  const isPreset = PHYSICAL_CTA_BUTTON_PRESETS.includes(
    ctaLabel as (typeof PHYSICAL_CTA_BUTTON_PRESETS)[number]
  );
  const guaranteeAmount =
    Number(data.guarantee_amount) > 0
      ? Number(data.guarantee_amount)
      : checkoutMethod === 'guarantee'
        ? suggestedGuaranteeAmount(productPrice)
        : 0;
  const breakdown = computePhysicalGuaranteeBreakdown({
    unitPrice: productPrice,
    quantity: 1,
    guaranteeAmount,
  });
  const guaranteeError =
    checkoutMethod === 'guarantee'
      ? validateGuaranteeAmount(guaranteeAmount, productPrice, currency)
      : null;

  const patch = (partial: Partial<PhysicalProductPaymentOptions>) => {
    const nextMethod = isPhysicalCheckoutMethod(partial.checkout_method)
      ? partial.checkout_method
      : checkoutMethod;
    onUpdate({
      checkout_method: nextMethod,
      cta_button_label: ctaLabel,
      payment_type: data.payment_type ?? 'full',
      percentage_rate: data.percentage_rate ?? 30,
      guarantee_amount: nextMethod === 'guarantee' ? guaranteeAmount : data.guarantee_amount,
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
            Choisissez comment vos clients règlent ce produit physique. Un seul mode par produit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={checkoutMethod}
            onValueChange={value => {
              const method = value as PhysicalCheckoutMethod;
              const next: Partial<PhysicalProductPaymentOptions> = { checkout_method: method };
              if (method === 'guarantee' && !(Number(data.guarantee_amount) > 0)) {
                next.guarantee_amount = suggestedGuaranteeAmount(productPrice);
              }
              if (method === 'guarantee' && (ctaLabel === 'Commander' || !ctaLabel.trim())) {
                next.cta_button_label = 'Payer la garantie';
              }
              patch(next);
            }}
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
                  Le client paie 100 % en ligne (carte, mobile money) à la commande.
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
                  Le client confirme sa commande et paie la totalité à la livraison. Idéal pour la
                  confiance locale.
                </p>
              </Label>
            </div>

            <div className="flex items-start gap-3 rounded-lg border p-4 hover:border-primary transition-colors">
              <RadioGroupItem value="guarantee" id="checkout-guarantee" className="mt-1" />
              <Label htmlFor="checkout-guarantee" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2 font-semibold mb-1">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  {PHYSICAL_CHECKOUT_METHOD_LABELS.guarantee}
                </div>
                <p className="text-sm text-muted-foreground font-normal">
                  Le client paie une garantie en ligne dès maintenant, puis le solde à la réception
                  du colis.
                </p>
              </Label>
            </div>
          </RadioGroup>

          {checkoutMethod === 'guarantee' && (
            <div className="mt-5 space-y-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
              <div className="space-y-2">
                <Label htmlFor="guarantee-amount">
                  Montant de garantie par article ({currency})
                </Label>
                <Input
                  id="guarantee-amount"
                  type="number"
                  min={1}
                  step="1"
                  value={guaranteeAmount || ''}
                  onChange={e => patch({ guarantee_amount: Number(e.target.value) || 0 })}
                  placeholder="Ex. 5000"
                />
                {guaranteeError ? (
                  <p className="text-sm text-destructive">{guaranteeError}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    À la commande :{' '}
                    <strong>{formatPrice(breakdown.guaranteeDueNow, currency)}</strong>
                    {' · '}
                    Reste à la livraison :{' '}
                    <strong>{formatPrice(breakdown.remainderOnDelivery, currency)}</strong>
                    {' · '}
                    Prix article : {formatPrice(productPrice, currency)}
                  </p>
                )}
              </div>
            </div>
          )}
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
