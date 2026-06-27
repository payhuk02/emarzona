import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import CouponInput from '@/components/checkout/CouponInput';
import type { CartItem } from '@/types/cart';
import type {
  AppliedCoupon,
  AppliedGiftCard,
  CheckoutStoreGroup,
  TaxBreakdownItem,
} from '@/pages/checkout/cart/checkout-types';
import { CreditCard, ArrowRight, AlertCircle, Loader2, Tag } from 'lucide-react';
import { useMemo } from 'react';
import { EmarzonaProtectBadge } from '@/components/trust/EmarzonaProtectBadge';
import { assessCartProtectEligibility } from '@/lib/trust/emarzona-protect-policy';

export interface CheckoutOrderSummaryProps {
  items: CartItem[];
  summary: { subtotal: number; item_count: number };
  isCheckingStores: boolean;
  isMultiStore: boolean;
  storeGroups: Map<string, CheckoutStoreGroup>;
  appliedCouponCode: AppliedCoupon | null;
  couponDiscount: number;
  giftCardAmount: number;
  appliedGiftCard: AppliedGiftCard | null;
  taxLoading: boolean;
  taxBreakdown: TaxBreakdownItem[];
  taxAmount: number;
  itemDiscounts: number;
  shippingAmount: number;
  finalTotal: number;
  storeId: string | null;
  customerId: string | null;
  isFirstOrder: boolean;
  isProcessing: boolean;
  checkoutBlocked: boolean;
  handleCheckout: () => void;
  onCouponApply: (promotionId: string, discountAmount: number, code: string) => void;
  onCouponRemove: () => void;
}

export default function CheckoutOrderSummary({
  items,
  summary,
  isCheckingStores,
  isMultiStore,
  storeGroups,
  appliedCouponCode,
  couponDiscount,
  giftCardAmount,
  appliedGiftCard,
  taxLoading,
  taxBreakdown,
  taxAmount,
  itemDiscounts,
  shippingAmount,
  finalTotal,
  storeId,
  customerId,
  isFirstOrder,
  isProcessing,
  checkoutBlocked,
  handleCheckout,
  onCouponApply,
  onCouponRemove,
}: CheckoutOrderSummaryProps) {
  const protectEligibility = useMemo(
    () => assessCartProtectEligibility(items, finalTotal),
    [items, finalTotal]
  );

  return (
    <Card className="sticky top-4" role="region" aria-labelledby="summary-title">
      <CardHeader>
        <CardTitle id="summary-title">
          Récapitulatif
          {isMultiStore && storeGroups.size > 1 && (
            <span className="ml-2 text-sm text-orange-600 font-normal">
              ({storeGroups.size} boutique{storeGroups.size > 1 ? 's' : ''})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isCheckingStores ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : isMultiStore && storeGroups.size > 1 ? (
          // Affichage multi-stores
          <div className="space-y-4">
            {Array.from(storeGroups.entries()).map(([storeId, group]) => (
              <div key={storeId} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm">
                    {group.store_name || `Boutique ${storeId.substring(0, 8)}`}
                  </h4>
                  <span className="text-xs text-muted-foreground">
                    {group.items.length} article{group.items.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {group.items.map(item => (
                    <div key={item.id || item.product_id} className="flex gap-2 text-xs">
                      <div className="w-8 h-8 rounded border overflow-hidden flex-shrink-0">
                        <img
                          src={item.product_image_url || '/placeholder-product.png'}
                          alt={item.product_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-xs">{item.product_name}</p>
                        {item.variant_name && (
                          <p className="text-xs text-muted-foreground">{item.variant_name}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} × {item.unit_price.toLocaleString('fr-FR')} XOF
                        </p>
                      </div>
                      <p className="font-medium whitespace-nowrap text-xs">
                        {(
                          (item.unit_price - (item.discount_amount || 0)) *
                          item.quantity
                        ).toLocaleString('fr-FR')}{' '}
                        XOF
                      </p>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="space-y-1 text-xs pt-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sous-total:</span>
                    <span>{(group.subtotal || 0).toLocaleString('fr-FR')} XOF</span>
                  </div>
                  {(group.tax_amount || 0) > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Taxes:</span>
                      <span>{(group.tax_amount || 0).toLocaleString('fr-FR')} XOF</span>
                    </div>
                  )}
                  {(group.shipping_amount || 0) > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Livraison:</span>
                      <span>{(group.shipping_amount || 0).toLocaleString('fr-FR')} XOF</span>
                    </div>
                  )}
                  {(group.discount_amount || 0) > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Réduction panier:</span>
                      <span>-{(group.discount_amount || 0).toLocaleString('fr-FR')} XOF</span>
                    </div>
                  )}
                  {appliedCouponCode && couponDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Code promo ({appliedCouponCode.code}):</span>
                      <span>-{couponDiscount.toLocaleString('fr-FR')} XOF</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold pt-1 border-t">
                    <span>Total:</span>
                    <span>{(group.total || 0).toLocaleString('fr-FR')} XOF</span>
                  </div>
                </div>
              </div>
            ))}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Votre commande sera divisée en {storeGroups.size} commande(s) distincte(s), une par
                boutique.
              </AlertDescription>
            </Alert>
            <Separator />
            <div className="space-y-2 text-sm pt-2">
              {appliedCouponCode && couponDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Code promo ({appliedCouponCode.code}):</span>
                  <span>-{couponDiscount.toLocaleString('fr-FR')} XOF</span>
                </div>
              )}
              <div className="flex justify-between items-center text-lg font-bold pt-2 border-t">
                <span>Total Général:</span>
                <span className="text-base sm:text-xl md:text-2xl text-primary">
                  {Math.max(
                    0,
                    Array.from(storeGroups.values()).reduce(
                      (sum, group) => sum + (group.total || 0),
                      0
                    ) - (appliedCouponCode ? couponDiscount : 0)
                  ).toLocaleString('fr-FR')}{' '}
                  XOF
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Réparti sur {storeGroups.size} commande{storeGroups.size > 1 ? 's' : ''}
            </p>

            {/* Bouton checkout pour multi-stores */}
            <Button
              onClick={handleCheckout}
              disabled={isProcessing || items.length === 0 || isCheckingStores || checkoutBlocked}
              className="w-full mt-4"
              size="lg"
              aria-label={
                isProcessing
                  ? 'Traitement de la commande en cours'
                  : `Finaliser les commandes pour ${Array.from(storeGroups.values())
                      .reduce((sum, group) => sum + (group.total || 0), 0)
                      .toLocaleString('fr-FR')} XOF`
              }
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Traitement...
                </>
              ) : isCheckingStores ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Vérification des boutiques...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" aria-hidden="true" />
                  Payer{' '}
                  {Array.from(storeGroups.values())
                    .reduce((sum, group) => sum + (group.total || 0), 0)
                    .toLocaleString('fr-FR')}{' '}
                  XOF
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground mt-2">
              {items.length} {items.length > 1 ? 'articles' : 'article'}
            </p>
          </div>
        ) : (
          // Affichage normal (un seul store)
          <>
            {/* Articles */}
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {items.map(item => (
                <div key={item.id} className="flex gap-3 text-sm">
                  <div className="w-12 h-12 rounded border overflow-hidden flex-shrink-0">
                    <img
                      src={item.product_image_url || '/placeholder-product.png'}
                      alt={item.product_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.product_name}</p>
                    {item.variant_name && (
                      <p className="text-xs text-muted-foreground">{item.variant_name}</p>
                    )}
                    <p className="text-xs text-muted-foreground">Quantité: {item.quantity}</p>
                  </div>
                  <p className="font-medium whitespace-nowrap">
                    {(
                      (item.unit_price - (item.discount_amount || 0)) *
                      item.quantity
                    ).toLocaleString('fr-FR')}{' '}
                    XOF
                  </p>
                </div>
              ))}
            </div>

            <Separator />

            {/* Code promo - Visible et proéminent dans le récapitulatif */}
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
                productIds={items.map(item => item.product_id)}
                customerId={customerId || undefined}
                orderAmount={summary.subtotal}
                isFirstOrder={isFirstOrder}
                onApply={onCouponApply}
                onRemove={onCouponRemove}
                appliedCouponId={appliedCouponCode?.id || null}
                appliedCouponCode={appliedCouponCode?.code || null}
                appliedDiscountAmount={appliedCouponCode?.discountAmount || null}
              />
            </div>

            <Separator />

            {/* Détails prix */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sous-total</span>
                <span>{summary.subtotal.toLocaleString('fr-FR')} XOF</span>
              </div>

              {itemDiscounts > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Remise panier</span>
                  <span>-{itemDiscounts.toLocaleString('fr-FR')} XOF</span>
                </div>
              )}

              {appliedCouponCode && couponDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Code promo ({appliedCouponCode.code})</span>
                  <span>-{couponDiscount.toLocaleString('fr-FR')} XOF</span>
                </div>
              )}

              {appliedGiftCard && giftCardAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Carte cadeau ({appliedGiftCard.code})</span>
                  <span>-{giftCardAmount.toLocaleString('fr-FR')} XOF</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-muted-foreground">Livraison</span>
                <span>{shippingAmount.toLocaleString('fr-FR')} XOF</span>
              </div>

              {/* Affichage détaillé des taxes */}
              {taxLoading ? (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Taxes</span>
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : taxBreakdown.length > 0 ? (
                <div className="space-y-1">
                  {taxBreakdown.map((tax, index) => (
                    <div key={index} className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        {tax.name} ({tax.rate}%)
                        {tax.applies_to_shipping && ' + Livraison'}
                        {tax.is_default && ' (par défaut)'}
                      </span>
                      <span>{Number(tax.amount).toLocaleString('fr-FR')} XOF</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-medium pt-1 border-t">
                    <span className="text-muted-foreground">Total Taxes</span>
                    <span>{taxAmount.toLocaleString('fr-FR')} XOF</span>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxes</span>
                  <span>{taxAmount.toLocaleString('fr-FR')} XOF</span>
                </div>
              )}
            </div>

            <Separator />

            {/* Total */}
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total</span>
              <span className="text-2xl text-primary">
                {finalTotal.toLocaleString('fr-FR')} XOF
              </span>
            </div>

            {/* Bouton checkout */}
            <Button
              onClick={handleCheckout}
              disabled={isProcessing || items.length === 0 || isCheckingStores || checkoutBlocked}
              className="w-full"
              size="lg"
              aria-label={
                isProcessing
                  ? 'Traitement de la commande en cours'
                  : `Finaliser la commande pour ${finalTotal.toLocaleString('fr-FR')} XOF`
              }
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Traitement...
                </>
              ) : isCheckingStores ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Vérification des boutiques...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" aria-hidden="true" />
                  Payer {finalTotal.toLocaleString('fr-FR')} XOF
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </>
              )}
            </Button>

            {protectEligibility.eligible && (
              <EmarzonaProtectBadge eligible compact className="text-left" />
            )}

            <p className="text-xs text-center text-muted-foreground">
              {summary.item_count} {summary.item_count > 1 ? 'articles' : 'article'}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
