/**
 * Composant CartItem - Item individuel du panier
 * Date: 26 Janvier 2025
 * Optimisé avec React.memo pour performance mobile
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LazyImage } from '@/components/ui/lazy-image';
import { Trash2, Plus, Minus } from '@/components/icons';
import type { CartItem as CartItemType } from '@/types/cart';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  isLoading?: boolean;
}

const CartItemComponent = ({ item, onUpdateQuantity, onRemove, isLoading }: CartItemProps) => {
  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) {
      onRemove(item.id!);
      return;
    }
    onUpdateQuantity(item.id!, newQuantity);
  };

  const itemTotal = ((item.unit_price - (item.discount_amount || 0)) * item.quantity).toLocaleString('fr-FR');
  const hasDiscount = (item.discount_amount || 0) > 0;

  return (
    <article className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors" aria-labelledby={`cart-item-${item.id}-name`}>
      {/* Image */}
      <div className="relative w-full sm:w-24 h-48 sm:h-24 rounded-lg overflow-hidden flex-shrink-0 border">
        <LazyImage
          src={item.product_image_url || '/placeholder-product.png'}
          alt={item.product_name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Infos produit */}
      <div className="flex-1 min-w-0">
        <h3 id={`cart-item-${item.id}-name`} className="font-semibold text-base sm:text-lg mb-1 truncate">{item.product_name}</h3>
        
        {item.variant_name && (
          <p className="text-xs sm:text-sm text-muted-foreground mb-2">
            Variant: {item.variant_name}
          </p>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mt-2">
          {/* Quantité */}
          <div className="flex items-center gap-2" role="group" aria-label={`Quantité pour ${item.product_name}`}>
            <Button
              variant="outline"
              size="icon"
              className="min-h-[44px] min-w-[44px] h-11 w-11"
              onClick={() => handleQuantityChange(item.quantity - 1)}
              disabled={isLoading}
              aria-label={`Diminuer la quantité de ${item.product_name}`}
            >
              <Minus className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
            </Button>
            <Input
              type="number"
              min="1"
              value={item.quantity}
              onChange={(e) => {
                const newQty = parseInt(e.target.value) || 1;
                handleQuantityChange(newQty);
              }}
              className="w-20 sm:w-16 text-center min-h-[44px] h-11"
              disabled={isLoading}
              aria-label={`Quantité de ${item.product_name}`}
            />
            <Button
              variant="outline"
              size="icon"
              className="min-h-[44px] min-w-[44px] h-11 w-11"
              onClick={() => handleQuantityChange(item.quantity + 1)}
              disabled={isLoading}
              aria-label={`Augmenter la quantité de ${item.product_name}`}
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
            </Button>
          </div>

          {/* Prix */}
          <div className="flex-1 text-left sm:text-right">
            {hasDiscount && (
              <p className="text-xs sm:text-sm text-muted-foreground line-through">
                {(item.unit_price * item.quantity).toLocaleString('fr-FR')} {item.currency}
              </p>
            )}
            <p className="font-semibold text-base sm:text-lg">
              {itemTotal} {item.currency}
            </p>
            {hasDiscount && (
              <p className="text-xs text-green-600">
                Économie: {((item.discount_amount || 0) * item.quantity).toLocaleString('fr-FR')} {item.currency}
              </p>
            )}
          </div>

          {/* Supprimer */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(item.id!)}
            disabled={isLoading}
            className="min-h-[44px] min-w-[44px] h-11 w-11 text-destructive hover:text-destructive self-start sm:self-auto"
            aria-label={`Supprimer ${item.product_name} du panier`}
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </article>
  );
};

// Optimisation avec React.memo pour éviter les re-renders inutiles
export const CartItem = React.memo(CartItemComponent, (prevProps, nextProps) => {
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

CartItem.displayName = 'CartItem';

