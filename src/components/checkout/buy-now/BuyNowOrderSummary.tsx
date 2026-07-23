import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import CouponInput from '@/components/checkout/CouponInput';
import { formatPrice } from '@/lib/product-helpers';
import { htmlToPlainText } from '@/lib/html-sanitizer';
import { getBuyNowBasePrice } from '@/pages/checkout/buy-now/checkout-buy-now-pricing';
import type {
  AppliedBuyNowCoupon,
  CheckoutProduct,
  CheckoutStore,
  CheckoutUser,
  CheckoutVariant,
} from '@/pages/checkout/buy-now/checkout-buy-now-types';
import { ShoppingBag, Loader2, Lock, Tag, Truck, ArrowRight, AlertTriangle } from 'lucide-react';
import { MONEYFUSION_MIN_AMOUNT_XOF } from '@/lib/moneyfusion-client';
import { MoneyFusionCheckoutMethods } from '@/components/checkout/MoneyFusionCheckoutMethods';

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  digital: 'Produit digital',
  physical: 'Produit physique',
  service: 'Service',
  course: 'Formation',
  artist: 'Œuvre d’artiste',
};

export interface BuyNowOrderSummaryProps {
  product: CheckoutProduct;
  store: CheckoutStore;
  selectedVariant: CheckoutVariant;
  appliedCouponCode: AppliedBuyNowCoupon | null;
  displayPrice: number;
  currency: string;
  storeId: string | null;
  productId: string | null;
  user: CheckoutUser;
  submitting: boolean;
  submitButtonLabel?: string;
  isCashOnDelivery?: boolean;
  onCouponApply: (couponId: string, discountAmount: number, code: string) => void;
  onCouponRemove: () => void;
}

export default function BuyNowOrderSummary({
  product,
  store: _store,
  selectedVariant,
  appliedCouponCode,
  displayPrice,
  currency,
  storeId,
  productId,
  user,
  submitting,
  submitButtonLabel = 'Procéder au paiement',
  isCashOnDelivery = false,
  onCouponApply,
  onCouponRemove,
}: BuyNowOrderSummaryProps) {
  const basePrice = getBuyNowBasePrice(product, selectedVariant);
  const promoPrice = product?.promotional_price;
  const originalPrice = Number(product?.price) || 0;
  const hasPromo = promoPrice && Number(promoPrice) < originalPrice && Number(promoPrice) > 0;
  const savings = hasPromo ? originalPrice - Number(promoPrice) : 0;
  const totalAmount = Number(displayPrice) || 0;
  const belowMoneyFusionMin =
    !isCashOnDelivery &&
    (currency || 'XOF').toUpperCase() === 'XOF' &&
    totalAmount < MONEYFUSION_MIN_AMOUNT_XOF;

  return (
    <Card className="lg:sticky lg:top-4 rounded-2xl border-border/50 shadow-none sm:shadow-sm overflow-hidden bg-card">
      <CardHeader className="px-4 pt-5 pb-3 sm:px-6 sm:pt-6 sm:pb-4 border-b border-border/40">
        <CardTitle className="flex items-center gap-2.5 sm:gap-3 text-base sm:text-xl font-semibold tracking-tight text-foreground">
          <ShoppingBag
            className="h-5 w-5 shrink-0 text-foreground"
            aria-hidden="true"
            strokeWidth={1.75}
          />
          Résumé de la commande
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 py-4 sm:p-6 space-y-4 sm:space-y-5">
        {/* Produit */}
        <div className="flex gap-3 sm:gap-4">
          {product?.image_url && (
            <img
              src={product.image_url}
              alt={product.name ? htmlToPlainText(product.name) : 'Produit'}
              className="w-14 h-14 sm:w-20 sm:h-20 object-cover rounded-xl flex-shrink-0 ring-1 ring-border/50"
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm sm:text-[15px] leading-snug line-clamp-2 text-foreground">
              {product?.name ? htmlToPlainText(product.name) : 'Produit sans nom'}
            </h3>
            {selectedVariant && (
              <p className="text-xs text-muted-foreground mt-1">
                Variante :{' '}
                {htmlToPlainText(
                  selectedVariant.option1_value || selectedVariant.name || 'Variante sélectionnée'
                )}
              </p>
            )}
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {product?.product_type && (
                <Badge
                  variant="secondary"
                  className="text-[10px] sm:text-[11px] font-medium rounded-md px-2 py-0.5"
                >
                  {PRODUCT_TYPE_LABELS[product.product_type] ?? product.product_type}
                </Badge>
              )}
              {hasPromo && (
                <Badge className="text-[10px] sm:text-[11px] font-medium rounded-md px-2 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 border-0">
                  −{Math.round((savings / originalPrice) * 100)}%
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Code promo */}
        <div className="rounded-xl border border-border/60 bg-muted/30 p-3 sm:p-4 space-y-2.5 sm:space-y-3">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-foreground" aria-hidden="true" strokeWidth={1.75} />
            <Label htmlFor="coupon-code" className="text-sm font-medium text-foreground">
              Code promo
            </Label>
          </div>
          <CouponInput
            storeId={storeId || undefined}
            productId={productId || undefined}
            productType={product?.product_type}
            customerId={user?.id || undefined}
            orderAmount={basePrice}
            onApply={onCouponApply}
            onRemove={onCouponRemove}
            appliedCouponId={appliedCouponCode?.id || null}
            appliedCouponCode={appliedCouponCode?.code || null}
            appliedDiscountAmount={appliedCouponCode?.discountAmount || null}
          />
        </div>

        {/* Détail des montants */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Sous-total</span>
            <span className="font-medium tabular-nums text-foreground">
              {formatPrice(basePrice, currency)}
            </span>
          </div>
          {appliedCouponCode && appliedCouponCode.discountAmount > 0 && (
            <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400">
              <span>Code promo ({appliedCouponCode.code})</span>
              <span className="font-medium tabular-nums">
                −{formatPrice(appliedCouponCode.discountAmount, currency)}
              </span>
            </div>
          )}
        </div>

        <Separator className="bg-border/60" />

        {/* Total */}
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-semibold text-sm sm:text-base text-foreground">Total</span>
          <span className="font-bold text-xl sm:text-2xl tracking-tight tabular-nums text-foreground">
            {formatPrice(totalAmount, currency)}
          </span>
        </div>

        {belowMoneyFusionMin && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs sm:text-sm text-amber-900 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
            <p className="leading-snug">
              Montant minimum MoneyFusion : {MONEYFUSION_MIN_AMOUNT_XOF} XOF. Augmentez le prix du
              produit pour pouvoir payer en ligne.
            </p>
          </div>
        )}

        {!isCashOnDelivery && !belowMoneyFusionMin && (
          <MoneyFusionCheckoutMethods className="rounded-xl border border-border/60 bg-muted/30 px-3 py-2.5" />
        )}

        {/* CTA — sticky on mobile at bottom of card flow */}
        <div className="pt-1 sm:pt-0">
          <Button
            type="submit"
            form="checkout-form"
            size="lg"
            className="w-full min-h-12 sm:min-h-[50px] text-[15px] sm:text-base font-semibold rounded-xl shadow-sm transition-opacity hover:opacity-95 active:scale-[0.99]"
            disabled={submitting || belowMoneyFusionMin}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                Traitement en cours...
              </>
            ) : (
              <>
                {isCashOnDelivery ? (
                  <Truck className="mr-2 h-5 w-5" aria-hidden="true" />
                ) : (
                  <Lock className="mr-2 h-[18px] w-[18px]" aria-hidden="true" />
                )}
                {submitButtonLabel}
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </>
            )}
          </Button>
        </div>

        {isCashOnDelivery && (
          <div className="flex items-start justify-center gap-2 text-[11px] sm:text-xs text-muted-foreground pt-0.5">
            <Truck className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <p className="text-center leading-snug">
              Paiement à la livraison — vous réglez à la réception.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
