/**
 * Composant CartSummary - Récapitulatif du panier
 * Date: 26 Janvier 2025
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShoppingBag, Ticket, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '@/hooks/cart/useCart';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import type { CartSummary as CartSummaryType } from '@/types/cart';

interface CartSummaryProps {
  summary: CartSummaryType;
  onCheckout?: () => void;
}

export function CartSummary({ summary, onCheckout }: CartSummaryProps) {
  const { applyCoupon, isLoading } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast({
        title: 'Code promo requis',
        description: 'Veuillez entrer un code promo',
        variant: 'destructive',
      });
      return;
    }

    setApplyingCoupon(true);
    try {
      await applyCoupon(couponCode);
      setCouponCode('');
    } catch (error) {
      // Error handled in hook
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleCheckout = () => {
    if (summary.item_count === 0) {
      toast({
        title: 'Panier vide',
        description: 'Ajoutez des produits avant de procéder au paiement',
        variant: 'destructive',
      });
      return;
    }

    if (onCheckout) {
      onCheckout();
    } else {
      navigate('/checkout');
    }
  };

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5" />
          Récapitulatif
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Code promo */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Ticket className="h-4 w-4" />
            Code promo
          </label>
          <div className="flex gap-2">
            <Input
              placeholder="Entrez le code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleApplyCoupon();
                }
              }}
              disabled={applyingCoupon || isLoading}
            />
            <Button
              onClick={handleApplyCoupon}
              disabled={applyingCoupon || isLoading || !couponCode.trim()}
              variant="outline"
            >
              Appliquer
            </Button>
          </div>
        </div>

        <Separator />

        {/* Détails prix */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Sous-total</span>
            <span>{summary.subtotal.toLocaleString('fr-FR')} XOF</span>
          </div>

          {summary.discount_amount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Remise</span>
              <span>-{summary.discount_amount.toLocaleString('fr-FR')} XOF</span>
            </div>
          )}

          {summary.shipping_amount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Livraison</span>
              <span>{summary.shipping_amount.toLocaleString('fr-FR')} XOF</span>
            </div>
          )}

          {summary.tax_amount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Taxes</span>
              <span>{summary.tax_amount.toLocaleString('fr-FR')} XOF</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Total */}
        <div className="flex justify-between items-center text-lg font-bold">
          <span>Total</span>
          <span className="text-2xl text-primary">
            {summary.total.toLocaleString('fr-FR')} XOF
          </span>
        </div>

        {/* Bouton checkout */}
        <Button
          onClick={handleCheckout}
          disabled={summary.item_count === 0 || isLoading}
          className="w-full"
          size="lg"
        >
          Procéder au paiement
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          {summary.item_count} {summary.item_count > 1 ? 'articles' : 'article'}
        </p>
      </CardContent>
    </Card>
  );
}

