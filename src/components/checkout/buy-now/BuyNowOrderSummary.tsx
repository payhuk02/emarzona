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
import { ShoppingBag, Loader2, Lock, Tag, Truck, ArrowRight } from 'lucide-react';

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

  return (
    <Card className="lg:sticky lg:top-4 rounded-2xl border-border/60 shadow-sm overflow-hidden">
      <CardHeader className="p-5 sm:p-6 pb-4 bg-muted/40 border-b border-border/50">
        <CardTitle className="flex items-center gap-3 text-lg sm:text-xl tracking-tight">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShoppingBag className="h-[18px] w-[18px]" aria-hidden="true" />
          </div>
          Résumé de la commande
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 sm:p-6 space-y-5">
        {/* Produit */}
        <div className="flex gap-4">
          {product?.image_url && (
            <img
              src={product.image_url}
              alt={product.name ? htmlToPlainText(product.name) : 'Produit'}
              className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl flex-shrink-0 ring-1 ring-border/60"
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm sm:text-[15px] leading-snug line-clamp-2">
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
                <Badge variant="secondary" className="text-[11px] font-medium rounded-full px-2.5">
                  {PRODUCT_TYPE_LABELS[product.product_type] ?? product.product_type}
                </Badge>
              )}
              {hasPromo && (
                <Badge className="text-[11px] font-medium rounded-full px-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 border-0">
                  −{Math.round((savings / originalPrice) * 100)}%
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Code promo */}
        <div className="rounded-xl border border-primary/15 bg-gradient-to-br from-primary/[0.04] to-primary/[0.09] p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10">
              <Tag className="h-4 w-4 text-primary" aria-hidden="true" />
            </div>
            <Label htmlFor="coupon-code" className="text-sm font-semibold">
              Avez-vous un code promo ?
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
        <div className="space-y-2.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Sous-total</span>
            <span className="font-medium tabular-nums">{formatPrice(basePrice, currency)}</span>
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

        <Separator />

        {/* Total */}
        <div className="flex items-baseline justify-between">
          <span className="font-semibold text-base">Total</span>
          <span className="font-bold text-2xl tracking-tight tabular-nums">
            {formatPrice(Number(displayPrice) || 0, currency)}
          </span>
        </div>

        {/* CTA */}
        <Button
          type="submit"
          form="checkout-form"
          size="lg"
          className="w-full min-h-[50px] text-base font-semibold rounded-xl shadow-md shadow-primary/20 transition-all hover:shadow-lg hover:shadow-primary/25"
          disabled={submitting}
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

        {/* Note paiement à la livraison uniquement */}
        {isCashOnDelivery && (
          <div className="flex items-start justify-center gap-2 text-xs text-muted-foreground pt-1">
            <Truck className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <p className="text-center">
              Paiement à la livraison — aucun paiement en ligne requis, vous réglez à la réception.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
