/**
 * Page Cart - Panier utilisateur complet
 * Date: 26 Janvier 2025
 *
 * Fonctionnalités:
 * - Affichage tous les articles
 * - Modification quantités
 * - Suppression articles
 * - Récapitulatif avec code promo
 * - Responsive et professionnel
 */

import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCart } from '@/hooks/cart/useCart';
import { CartItem } from '@/components/cart/CartItem';
import { CartSummary } from '@/components/cart/CartSummary';
import { CartEmpty } from '@/components/cart/CartEmpty';
import { ShoppingBag, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePageCustomization } from '@/hooks/usePageCustomization';

export default function Cart() {
  const { getValue } = usePageCustomization('cart');
  const { items, summary, isLoading, updateItem, removeItem, clearCart, isEmpty } = useCart();

  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    try {
      await updateItem({ item_id: itemId, quantity });
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleRemove = async (itemId: string) => {
    try {
      await removeItem(itemId);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleClearCart = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir vider votre panier ?')) {
      try {
        await clearCart();
      } catch (error) {
        // Error handled in hook
      }
    }
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1 p-6 pb-16 md:pb-0">
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
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (isEmpty) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1 p-6 pb-16 md:pb-0">
            <div className="max-w-4xl mx-auto">
              <CartEmpty />
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 pb-16 md:pb-0">
          <div className="max-w-7xl mx-auto space-y-4 sm:space-y-5 md:space-y-6">
            {/* Header */}
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
                  aria-label="Vider le panier"
                >
                  <Trash2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2" aria-hidden="true" />
                  <span className="text-xs sm:text-sm md:text-base">
                    {getValue('cart.clearCart')}
                  </span>
                </Button>
              )}
            </header>

            {/* Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Liste articles */}
              <section className="lg:col-span-2 space-y-4" aria-label="Articles du panier">
                {items.map(item => (
                  <CartItem
                    key={item.id}
                    item={item}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemove={handleRemove}
                    isLoading={isLoading}
                  />
                ))}
              </section>

              {/* Récapitulatif */}
              <aside className="lg:col-span-1" aria-label="Récapitulatif du panier">
                <CartSummary summary={summary} />
              </aside>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}






