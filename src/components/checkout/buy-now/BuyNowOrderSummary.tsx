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
import { ShoppingBag, CreditCard, Loader2, Shield, Tag, Truck } from 'lucide-react';

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

  return (
    <Card className="lg:sticky lg:top-4">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
          Résumé de la commande
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-4">
        <div className="flex gap-4">
          {product?.image_url && (
            <img
              src={product.image_url}
              alt={product.name ? htmlToPlainText(product.name) : 'Produit'}
              className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-md flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm line-clamp-2">
              {product?.name ? htmlToPlainText(product.name) : 'Produit sans nom'}
            </h3>
            {selectedVariant && (
              <p className="text-xs text-muted-foreground mt-1">
                Variante:{' '}
                {htmlToPlainText(
                  selectedVariant.option1_value || selectedVariant.name || 'Variante sélectionnée'
                )}
              </p>
            )}
            {product?.product_type && (
              <Badge variant="outline" className="mt-1 text-xs">
                {product.product_type}
              </Badge>
            )}
            {product?.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {htmlToPlainText(product.description).substring(0, 100)}
                {htmlToPlainText(product.description).length > 100 ? '...' : ''}
              </p>
            )}
          </div>
        </div>

        <Separator />

        <div className="space-y-3 py-3 border-t border-b border-border/50 bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10">
              <Tag className="h-4 w-4 text-primary" />
            </div>
            <Label htmlFor="coupon-code" className="text-sm font-semibold text-foreground">
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

        <Separator />

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Sous-total</span>
            <span className="font-semibold">{formatPrice(basePrice, currency)}</span>
          </div>
          {appliedCouponCode && appliedCouponCode.discountAmount > 0 && (
            <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
              <span>Code promo ({appliedCouponCode.code})</span>
              <span className="font-semibold">
                -{formatPrice(appliedCouponCode.discountAmount, currency)}
              </span>
            </div>
          )}
          {hasPromo && (
            <>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Prix original</span>
                <span className="line-through">{formatPrice(originalPrice, currency)}</span>
              </div>
              <div className="flex justify-between text-xs text-green-600 dark:text-green-400">
                <span>Économie</span>
                <span className="font-semibold">
                  {formatPrice(originalPrice - Number(promoPrice), currency)}
                </span>
              </div>
            </>
          )}
        </div>

        <Separator />

        <div className="flex justify-between items-center pt-2 border-t">
          <span className="font-bold text-lg">Total</span>
          <span className="font-bold text-lg">
            {formatPrice(Number(displayPrice) || 0, currency)}
          </span>
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            {isCashOnDelivery ? (
              <>
                <Truck className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>
                  Paiement à la livraison. Aucun paiement en ligne requis — vous réglez à la
                  réception.
                </p>
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>Paiement sécurisé par Moneroo. Vos informations sont protégées.</p>
              </>
            )}
          </div>
        </div>

        <div className="pt-6 border-t">
          <Button
            type="submit"
            form="checkout-form"
            size="lg"
            className="w-full min-h-[44px] text-base sm:text-lg"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                <span className="text-sm sm:text-base">Traitement en cours...</span>
              </>
            ) : (
              <>
                {isCashOnDelivery ? (
                  <Truck className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <CreditCard className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                )}
                <span className="text-sm sm:text-base">{submitButtonLabel}</span>
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
