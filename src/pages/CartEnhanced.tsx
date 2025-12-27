/**
 * Page CartEnhanced - Panier utilisateur amélioré
 * Date: 31 Janvier 2025
 *
 * Améliorations:
 * - Animations fluides
 * - Feedback visuel amélioré
 * - Performance optimisée
 * - UX mobile améliorée
 */

import { useState, useCallback } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCart } from '@/hooks/cart/useCart';
import { CartItemEnhanced } from '@/components/cart/CartItemEnhanced';
import { CartSummary } from '@/components/cart/CartSummary';
import { CartEmpty } from '@/components/cart/CartEmpty';
import { ShoppingBag, Trash2, Sparkles, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

export default function CartEnhanced() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { items, summary, isLoading, updateItem, removeItem, clearCart, isEmpty } = useCart();
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleUpdateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      try {
        await updateItem({ item_id: itemId, quantity });
      } catch ( _error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        toast({
          title: 'Erreur',
          description: errorMessage || 'Impossible de mettre à jour la quantité',
          variant: 'destructive',
        });
      }
    },
    [updateItem, toast]
  );

  const handleRemove = useCallback(
    async (itemId: string) => {
      try {
        await removeItem(itemId);
        toast({
          title: 'Article supprimé',
          description: "L'article a été retiré de votre panier",
        });
      } catch ( _error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        toast({
          title: 'Erreur',
          description: errorMessage || "Impossible de supprimer l'article",
          variant: 'destructive',
        });
      }
    },
    [removeItem, toast]
  );

  const handleClearCart = useCallback(async () => {
    setIsClearing(true);
    try {
      await clearCart();
      setShowClearDialog(false);
      toast({
        title: 'Panier vidé',
        description: 'Tous les articles ont été retirés de votre panier',
      });
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: 'Erreur',
        description: errorMessage || 'Impossible de vider le panier',
        variant: 'destructive',
      });
    } finally {
      setIsClearing(false);
    }
  }, [clearCart, toast]);

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
            {/* Header avec animations */}
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(-1)}
                  className="hover:bg-muted transition-colors"
                  aria-label="Retour"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold flex items-center gap-1.5 sm:gap-2">
                    <ShoppingBag
                      className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-primary"
                      aria-hidden="true"
                    />
                    Mon Panier
                  </h1>
                  <p
                    className="text-xs sm:text-sm md:text-base text-muted-foreground mt-0.5 sm:mt-1 flex items-center gap-2"
                    id="cart-description"
                  >
                    <span>
                      {summary.item_count} {summary.item_count > 1 ? 'articles' : 'article'}
                    </span>
                    {summary.discount_amount > 0 && (
                      <span className="flex items-center gap-1 text-green-600 font-medium">
                        <Sparkles className="h-3 w-3" />
                        Économie: {summary.discount_amount.toLocaleString('fr-FR')} XOF
                      </span>
                    )}
                  </p>
                </div>
              </div>
              {items.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setShowClearDialog(true)}
                  className="min-h-[44px] text-destructive hover:text-destructive hover:bg-destructive/10 transition-all duration-200 w-full sm:w-auto"
                  aria-label="Vider le panier"
                >
                  <Trash2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2" aria-hidden="true" />
                  <span className="text-xs sm:text-sm md:text-base">Vider le panier</span>
                </Button>
              )}
            </header>

            {/* Alertes promotionnelles */}
            {summary.discount_amount > 0 && (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20 animate-in fade-in slide-in-from-top-2 duration-500">
                <Sparkles className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  Félicitations ! Vous économisez {summary.discount_amount.toLocaleString('fr-FR')}{' '}
                  XOF grâce à vos codes promo.
                </AlertDescription>
              </Alert>
            )}

            {/* Content avec animations */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Liste articles avec animations stagger */}
              <section className="lg:col-span-2 space-y-4" aria-label="Articles du panier">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className={cn(
                      'animate-in fade-in slide-in-from-left-4 duration-500',
                      'opacity-0'
                    )}
                    style={{
                      animationDelay: `${index * 100}ms`,
                      animationFillMode: 'forwards',
                    }}
                  >
                    <CartItemEnhanced
                      item={item}
                      onUpdateQuantity={handleUpdateQuantity}
                      onRemove={handleRemove}
                      isLoading={isLoading}
                    />
                  </div>
                ))}
              </section>

              {/* Récapitulatif sticky */}
              <aside className="lg:col-span-1" aria-label="Récapitulatif du panier">
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <CartSummary summary={summary} />
                </div>
              </aside>
            </div>
          </div>
        </main>
      </div>

      {/* Dialog de confirmation vider panier */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Vider le panier ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir retirer tous les articles de votre panier ? Cette action est
              irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isClearing}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearCart}
              disabled={isClearing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isClearing ? 'Suppression...' : 'Vider le panier'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}






