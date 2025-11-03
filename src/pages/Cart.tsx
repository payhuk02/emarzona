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

export default function Cart() {
  const {
    items,
    summary,
    isLoading,
    updateItem,
    removeItem,
    clearCart,
    isEmpty,
  } = useCart();

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
          <main className="flex-1 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              <Skeleton className="h-8 w-64" />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  {[1, 2, 3].map((i) => (
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
          <main className="flex-1 p-6">
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
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <ShoppingBag className="h-8 w-8" />
                  Mon Panier
                </h1>
                <p className="text-muted-foreground mt-1">
                  {summary.item_count} {summary.item_count > 1 ? 'articles' : 'article'}
                </p>
              </div>
              {items.length > 0 && (
                <Button
                  variant="outline"
                  onClick={handleClearCart}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Vider le panier
                </Button>
              )}
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Liste articles */}
              <div className="lg:col-span-2 space-y-4">
                {items.map((item) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemove={handleRemove}
                    isLoading={isLoading}
                  />
                ))}
              </div>

              {/* Récapitulatif */}
              <div className="lg:col-span-1">
                <CartSummary summary={summary} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

