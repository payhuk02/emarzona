/**
 * Commande directe sur la fiche service (prix fixe, sans formules publiées ni créneaux).
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Shield, TrendingUp } from 'lucide-react';
import { PaymentOptionsBadge, getPaymentOptions } from '@/components/products/PaymentOptionsBadge';
import { PricingModelBadge } from '@/components/products/PricingModelBadge';
import { ServicePriceDisplay } from '@/components/service/ServicePriceDisplay';
import { ServiceProjectMilestoneTimeline } from '@/components/service/ServiceProjectMilestoneTimeline';
import {
  computeServiceProjectMilestoneAmounts,
  amountDueAtProjectCheckout,
  serviceCheckoutMilestonesEnabled,
  type ServicePaymentOptionsWithMilestones,
} from '@/lib/service/service-project-milestones';
import { resolveServicePayableAmount } from '@/lib/service/service-payable-amount';
import type { ServiceDisplayPrice } from '@/lib/service/service-pricing';

export interface ServiceSimpleOrderPanelProps {
  serviceCtaLabel: string;
  displayPrice: ServiceDisplayPrice;
  currency?: string;
  paymentOptions?: ServicePaymentOptionsWithMilestones | null;
  pricingModel?: string | null;
  licensingType?: string | null;
  depositRequired?: boolean;
  depositAmount?: number;
  depositType?: 'fixed' | 'percentage';
  affiliateEnabled?: boolean;
  commissionRate?: number;
  isLoading?: boolean;
  onCheckout: () => void;
}

export function ServiceSimpleOrderPanel({
  serviceCtaLabel,
  displayPrice,
  currency = 'XOF',
  paymentOptions,
  pricingModel,
  licensingType,
  depositRequired,
  depositAmount,
  depositType,
  affiliateEnabled,
  commissionRate,
  isLoading = false,
  onCheckout,
}: ServiceSimpleOrderPanelProps) {
  const amount = displayPrice.amount;
  const milestonesActive = serviceCheckoutMilestonesEnabled(paymentOptions, {
    isFixedPriceBuyNow: true,
  });
  const milestonePreview = milestonesActive
    ? computeServiceProjectMilestoneAmounts(amount, paymentOptions?.project_milestones)
    : null;
  const milestoneDueNow = milestonePreview ? amountDueAtProjectCheckout(milestonePreview) : 0;
  const milestoneRemaining =
    milestonePreview && milestoneDueNow > 0 ? Math.max(0, amount - milestoneDueNow) : 0;

  const payable = resolveServicePayableAmount(
    amount,
    paymentOptions ?? { payment_type: 'full' },
    depositRequired
      ? { deposit_required: true, deposit_amount: depositAmount, deposit_type: depositType }
      : undefined
  );

  return (
    <Card className="lg:sticky lg:top-4 min-w-0 overflow-hidden">
      <CardHeader>
        <CardTitle>{serviceCtaLabel}</CardTitle>
        <CardDescription>
          Choisissez cette offre puis finalisez le paiement en toute sécurité.
        </CardDescription>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <PricingModelBadge pricingModel={pricingModel} size="sm" />
          <PaymentOptionsBadge
            paymentOptions={getPaymentOptions({ payment_options: paymentOptions ?? null })}
            size="sm"
          />
          {licensingType && (
            <Badge variant="outline" className="text-sm">
              <Shield className="h-3 w-3 mr-1" />
              {licensingType === 'plr'
                ? 'PLR'
                : licensingType === 'copyrighted'
                  ? "Droit d'auteur"
                  : 'Standard'}
            </Badge>
          )}
          {affiliateEnabled && commissionRate && commissionRate > 0 && (
            <Badge
              variant="secondary"
              className="text-sm bg-gradient-to-r from-orange-500 to-pink-500 text-white border-0"
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              {commissionRate}% commission
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ServicePriceDisplay display={displayPrice} currency={currency} size="md" align="left" />

        {milestonePreview && milestonePreview.length > 0 && (
          <ServiceProjectMilestoneTimeline milestones={milestonePreview} currency={currency} />
        )}

        {milestoneDueNow > 0 && milestoneRemaining > 0 && (
          <p className="text-sm text-muted-foreground">
            À payer maintenant :{' '}
            <span className="font-medium text-foreground">
              {milestoneDueNow.toLocaleString()} {currency}
            </span>
            {' · '}
            Solde : {milestoneRemaining.toLocaleString()} {currency}
          </p>
        )}

        {!milestonesActive && payable.remainingAmount > 0 && (
          <p className="text-sm text-muted-foreground">
            À payer maintenant :{' '}
            <span className="font-medium text-foreground">
              {payable.amountToPay.toLocaleString()} {currency}
            </span>
            {' · '}
            Solde : {payable.remainingAmount.toLocaleString()} {currency}
          </p>
        )}

        <Button className="w-full min-h-11" size="lg" disabled={isLoading} onClick={onCheckout}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Redirection…
            </>
          ) : (
            `${serviceCtaLabel} et payer`
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
