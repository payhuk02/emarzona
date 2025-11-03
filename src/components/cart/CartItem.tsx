/**
 * Composant CartItem - Item individuel du panier
 * Date: 26 Janvier 2025
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, Minus } from 'lucide-react';
import type { CartItem as CartItemType } from '@/types/cart';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  isLoading?: boolean;
}

export function CartItem({ item, onUpdateQuantity, onRemove, isLoading }: CartItemProps) {
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
    <div className="flex gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      {/* Image */}
      <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 border">
        <img
          src={item.product_image_url || '/placeholder-product.png'}
          alt={item.product_name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Infos produit */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-lg mb-1 truncate">{item.product_name}</h3>
        
        {item.variant_name && (
          <p className="text-sm text-muted-foreground mb-2">
            Variant: {item.variant_name}
          </p>
        )}

        <div className="flex items-center gap-4 mt-2">
          {/* Quantité */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleQuantityChange(item.quantity - 1)}
              disabled={isLoading}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              type="number"
              min="1"
              value={item.quantity}
              onChange={(e) => {
                const newQty = parseInt(e.target.value) || 1;
                handleQuantityChange(newQty);
              }}
              className="w-16 text-center h-8"
              disabled={isLoading}
            />
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleQuantityChange(item.quantity + 1)}
              disabled={isLoading}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Prix */}
          <div className="flex-1 text-right">
            {hasDiscount && (
              <p className="text-sm text-muted-foreground line-through">
                {(item.unit_price * item.quantity).toLocaleString('fr-FR')} {item.currency}
              </p>
            )}
            <p className="font-semibold text-lg">
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
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

