/**
 * Page Cart - Panier utilisateur complet
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppPageShell } from '@/components/layout/AppPageShell';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useCart } from '@/hooks/cart/useCart';
import { useCartThemedStore } from '@/hooks/cart/useCartThemedStore';
import { validateCheckoutCart } from '@/lib/checkout/cart-validation';
import { summarizeCartProductTypes } from '@/lib/cart/cart-product-type';
import { groupCartItemsByStore, isMultiStoreCart } from '@/lib/cart/cart-store-groups';
import { useCartStoreMedia, resolveCartItemPlaceholder } from '@/hooks/cart/useCartStoreMedia';
import { CartItem } from '@/components/cart/CartItem';
import { CartSummary } from '@/components/cart/CartSummary';
import { CartEmpty } from '@/components/cart/CartEmpty';
import { StoreThemeProvider } from '@/components/storefront/StoreThemeProvider';
import { ShoppingBag, Trash2, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePageCustomization } from '@/hooks/usePageCustomization';

export default function Cart() {
  const { t } = useTranslation();
  const { getValue } = usePageCustomization('cart');
  const { items, summary, isLoading, updateItem, removeItem, clearCart, isEmpty } = useCart();
  const { data: themedStore } = useCartThemedStore(items);
  const { data: storeMediaMap } = useCartStoreMedia(items);
  const checkoutValidation = useMemo(() => validateCheckoutCart(items), [items]);
  const typeSummary = useMemo(() => summarizeCartProductTypes(items), [items]);
  const storeGroups = useMemo(() => groupCartItemsByStore(items), [items]);
  const multiStore = useMemo(() => isMultiStoreCart(items), [items]);

  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    try {
      await updateItem({ item_id: itemId, quantity });
    } catch {
      // Error handled in hook
    }
  };

  const handleRemove = async (itemId: string) => {
    try {
      await removeItem(itemId);
    } catch {
      // Error handled in hook
    }
  };

  const handleClearCart = async () => {
    if (window.confirm(t('cart.multiStore.clearConfirm'))) {
      try {
        await clearCart();
      } catch {
        // Error handled in hook
      }
    }
  };

  if (isLoading) {
    return (
      <AppPageShell mainClassName="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
            <Skeleton className="h-96" />
          </div>
        </div>
      </AppPageShell>
    );
  }

  if (isEmpty) {
    return (
      <AppPageShell mainClassName="p-6">
        <div className="max-w-4xl mx-auto">
          <CartEmpty />
        </div>
      </AppPageShell>
    );
  }

  return (
    <StoreThemeProvider store={themedStore ?? null}>
      <AppPageShell mainClassName="p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-5 md:space-y-6 store-theme-active">
          <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold flex items-center gap-1.5 sm:gap-2">
                <ShoppingBag
                  className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7"
                  aria-hidden="true"
                />
                {getValue('cart.title')}
              </h1>
              <p
                className="text-xs sm:text-sm md:text-base text-muted-foreground mt-0.5 sm:mt-1"
                id="cart-description"
              >
                {summary.item_count}{' '}
                {getValue('cart.itemCount') || (summary.item_count > 1 ? 'articles' : 'article')}
              </p>
            </div>
            {items.length > 0 && (
              <Button
                variant="outline"
                onClick={handleClearCart}
                className="min-h-[44px] text-destructive hover:text-destructive w-full sm:w-auto"
                aria-label={t('cart.multiStore.clearAriaLabel')}
              >
                <Trash2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2" aria-hidden="true" />
                <span className="text-xs sm:text-sm md:text-base">
                  {getValue('cart.clearCart')}
                </span>
              </Button>
            )}
          </header>

          {multiStore && (
            <Alert>
              <Store className="h-4 w-4" aria-hidden="true" />
              <AlertTitle>{t('cart.multiStore.alertTitle')}</AlertTitle>
              <AlertDescription>{t('cart.multiStore.alertDescription')}</AlertDescription>
            </Alert>
          )}

          {typeSummary.length > 1 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {t('cart.multiStore.multiTypeLabel')}
              </span>
              {typeSummary.map(entry => (
                <Badge key={entry.type} variant="outline">
                  {entry.count} {entry.label}
                  {entry.count > 1 ? 's' : ''}
                </Badge>
              ))}
            </div>
          )}

          {checkoutValidation.hasMixedWithService && checkoutValidation.canCheckout && (
            <Alert>
              <AlertDescription>{t('cart.multiStore.mixedServiceHint')}</AlertDescription>
            </Alert>
          )}

          {!checkoutValidation.canCheckout && checkoutValidation.message && (
            <Alert variant="destructive">
              <AlertDescription>{checkoutValidation.message}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <section className="lg:col-span-2 space-y-4" aria-label="Articles du panier">
              {storeGroups.map(group => {
                const storeLabel =
                  group.storeName ||
                  t('cart.multiStore.unknownStore') +
                    (group.storeId ? ` ${group.storeId.substring(0, 8)}` : '');

                return (
                  <div key={group.storeId ?? 'unknown'} className="space-y-3">
                    {multiStore && (
                      <Card className="border-dashed">
                        <CardHeader className="py-3 px-4">
                          <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Store className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                            {t('cart.multiStore.sectionLabel', { storeName: storeLabel })}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 pt-0">
                          <div className="space-y-3 px-4 pb-4">
                            {group.items.map(item => (
                              <CartItem
                                key={item.id}
                                item={item}
                                onUpdateQuantity={handleUpdateQuantity}
                                onRemove={handleRemove}
                                isLoading={isLoading}
                                placeholderImageUrl={resolveCartItemPlaceholder(
                                  item,
                                  storeMediaMap
                                )}
                              />
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    {!multiStore &&
                      group.items.map(item => (
                        <CartItem
                          key={item.id}
                          item={item}
                          onUpdateQuantity={handleUpdateQuantity}
                          onRemove={handleRemove}
                          isLoading={isLoading}
                          placeholderImageUrl={
                            resolveCartItemPlaceholder(item, storeMediaMap) ??
                            themedStore?.placeholder_image_url
                          }
                        />
                      ))}
                  </div>
                );
              })}
            </section>

            <aside className="lg:col-span-1" aria-label="Récapitulatif du panier">
              <CartSummary summary={summary} />
            </aside>
          </div>
        </div>
      </AppPageShell>
    </StoreThemeProvider>
  );
}
