/**
 * Composant CartItemEnhanced - Item individuel du panier avec animations
 * Date: 31 Janvier 2025
 * Version améliorée avec animations et meilleure UX
 */

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LazyImage } from '@/components/ui/lazy-image';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Minus, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CartItem as CartItemType } from '@/types/cart';

interface CartItemEnhancedProps {
  item: CartItemType;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  isLoading?: boolean;
}

export const CartItemEnhanced = React.memo(({ 
  item, 
  onUpdateQuantity, 
  onRemove, 
  isLoading 
}: CartItemEnhancedProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  const handleQuantityChange = useCallback(async (newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemove();
      return;
    }

    setIsUpdating(true);
    setAnimationKey(prev => prev + 1);
    
    try {
      await onUpdateQuantity(item.id!, newQuantity);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      // Error handled in parent
    } finally {
      setIsUpdating(false);
    }
  }, [item.id, onUpdateQuantity]);

  const handleRemove = useCallback(async () => {
    setIsRemoving(true);
    // Animation de sortie avant suppression
    await new Promise(resolve => setTimeout(resolve, 300));
    try {
      await onRemove(item.id!);
    } catch (error) {
      setIsRemoving(false);
      // Error handled in parent
    }
  }, [item.id, onRemove]);

  const itemTotal = ((item.unit_price - (item.discount_amount || 0)) * item.quantity).toLocaleString('fr-FR');
  const hasDiscount = (item.discount_amount || 0) > 0;
  const discountAmount = ((item.discount_amount || 0) * item.quantity).toLocaleString('fr-FR');

  // Animation classes
  const itemClasses = cn(
    "flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg",
    "hover:bg-muted/50 transition-all duration-300",
    "group relative overflow-hidden",
    isRemoving && "animate-out fade-out slide-out-to-left duration-300",
    showSuccess && "ring-2 ring-green-500 ring-offset-2"
  );

  return (
    <article 
      className={itemClasses}
      aria-labelledby={`cart-item-${item.id}-name`}
      key={animationKey}
    >
      {/* Effet de brillance au survol */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
      
      {/* Image avec animation */}
      <div className="relative w-full sm:w-24 h-48 sm:h-24 rounded-lg overflow-hidden flex-shrink-0 border group-hover:scale-105 transition-transform duration-300">
        <LazyImage
          src={item.product_image_url || '/placeholder-product.png'}
          alt={item.product_name}
          className="w-full h-full object-cover"
        />
        {hasDiscount && (
          <Badge 
            className="absolute top-2 right-2 bg-green-600 text-white animate-in fade-in zoom-in duration-300"
            variant="default"
          >
            <Sparkles className="h-3 w-3 mr-1" />
            Promo
          </Badge>
        )}
      </div>

      {/* Infos produit */}
      <div className="flex-1 min-w-0">
        <h3 
          id={`cart-item-${item.id}-name`} 
          className="font-semibold text-base sm:text-lg mb-1 truncate group-hover:text-primary transition-colors"
        >
          {item.product_name}
        </h3>
        
        {item.variant_name && (
          <p className="text-xs sm:text-sm text-muted-foreground mb-2 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary" />
            Variant: {item.variant_name}
          </p>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mt-2">
          {/* Quantité avec animations */}
          <div className="flex items-center gap-2" role="group" aria-label={`Quantité pour ${item.product_name}`}>
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "min-h-[44px] min-w-[44px] h-11 w-11",
                "transition-all duration-200",
                "hover:scale-110 active:scale-95",
                "disabled:opacity-50"
              )}
              onClick={() => handleQuantityChange(item.quantity - 1)}
              disabled={isLoading || isUpdating || item.quantity <= 1}
              aria-label={`Diminuer la quantité de ${item.product_name}`}
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Minus className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
              )}
            </Button>
            <Input
              type="number"
              min="1"
              value={item.quantity}
              onChange={(e) => {
                const newQty = parseInt(e.target.value) || 1;
                handleQuantityChange(newQty);
              }}
              className={cn(
                "w-20 sm:w-16 text-center min-h-[44px] h-11 font-semibold",
                "transition-all duration-200",
                showSuccess && "ring-2 ring-green-500"
              )}
              disabled={isLoading || isUpdating}
              aria-label={`Quantité de ${item.product_name}`}
            />
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "min-h-[44px] min-w-[44px] h-11 w-11",
                "transition-all duration-200",
                "hover:scale-110 active:scale-95",
                "disabled:opacity-50"
              )}
              onClick={() => handleQuantityChange(item.quantity + 1)}
              disabled={isLoading || isUpdating}
              aria-label={`Augmenter la quantité de ${item.product_name}`}
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
              )}
            </Button>
          </div>

          {/* Prix avec animations */}
          <div className="flex-1 text-left sm:text-right space-y-1">
            {hasDiscount && (
              <p className="text-xs sm:text-sm text-muted-foreground line-through animate-in fade-in duration-300">
                {(item.unit_price * item.quantity).toLocaleString('fr-FR')} {item.currency}
              </p>
            )}
            <p className={cn(
              "font-semibold text-base sm:text-lg transition-all duration-300",
              showSuccess && "scale-110 text-green-600"
            )}>
              {itemTotal} {item.currency}
            </p>
            {hasDiscount && (
              <p className="text-xs text-green-600 font-medium animate-in fade-in slide-in-from-bottom-2 duration-300">
                Économie: {discountAmount} {item.currency}
              </p>
            )}
          </div>

          {/* Supprimer avec animation */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRemove}
            disabled={isLoading || isRemoving}
            className={cn(
              "min-h-[44px] min-w-[44px] h-11 w-11 text-destructive hover:text-destructive",
              "hover:bg-destructive/10 transition-all duration-200",
              "hover:scale-110 active:scale-95",
              "self-start sm:self-auto",
              isRemoving && "opacity-50"
            )}
            aria-label={`Supprimer ${item.product_name} du panier`}
          >
            {isRemoving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Trash2 className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </article>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.quantity === nextProps.item.quantity &&
    prevProps.item.unit_price === nextProps.item.unit_price &&
    prevProps.item.discount_amount === nextProps.item.discount_amount &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.onUpdateQuantity === nextProps.onUpdateQuantity &&
    prevProps.onRemove === nextProps.onRemove
  );
});

CartItemEnhanced.displayName = 'CartItemEnhanced';







