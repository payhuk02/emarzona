/**
 * Coupon Input Component
 * Date: 27 Janvier 2025
 * 
 * Composant pour saisir et valider un code promo dans le checkout
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle, X, Tag } from 'lucide-react';
import { useValidateCoupon, useApplyCoupon } from '@/hooks/digital/useCoupons';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface CouponInputProps {
  storeId?: string;
  productId?: string;
  productType?: string;
  customerId?: string;
  orderAmount: number;
  onApply: (couponId: string, discountAmount: number, code: string) => void;
  onRemove: () => void;
  appliedCouponId?: string | null;
  appliedCouponCode?: string | null;
  appliedDiscountAmount?: number | null;
}

export const CouponInput = ({
  storeId,
  productId,
  productType,
  customerId,
  orderAmount,
  onApply,
  onRemove,
  appliedCouponId,
  appliedCouponCode,
  appliedDiscountAmount,
}: CouponInputProps) => {
  const [couponCode, setCouponCode] = useState('');
  const { toast } = useToast();

  // Validation du coupon (se déclenche quand on tape)
  const { data: validation, isLoading: isValidating } = useValidateCoupon(
    couponCode || undefined,
    {
      productId,
      productType,
      storeId,
      customerId,
      orderAmount,
    }
  );

  // Application du coupon
  const applyCoupon = useApplyCoupon();

  const handleApply = async () => {
    if (!couponCode.trim()) {
      toast({
        title: 'Code requis',
        description: 'Veuillez entrer un code promo',
        variant: 'destructive',
      });
      return;
    }

    if (!validation || !validation.valid) {
      toast({
        title: 'Code invalide',
        description: validation?.message || 'Ce code promo n\'est pas valide',
        variant: 'destructive',
      });
      return;
    }

    if (!validation.coupon_id || !validation.discount_amount) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'appliquer ce code promo',
        variant: 'destructive',
      });
      return;
    }

    // Appeler onApply avec les données du coupon
    onApply(
      validation.coupon_id,
      validation.discount_amount,
      validation.code || couponCode.toUpperCase()
    );

    setCouponCode('');
    toast({
      title: '✅ Code appliqué',
      description: `Réduction de ${validation.discount_amount.toLocaleString()} XOF appliquée`,
    });
  };

  const handleRemove = () => {
    setCouponCode('');
    onRemove();
    toast({
      title: 'Code retiré',
      description: 'Le code promo a été retiré',
    });
  };

  // Si un coupon est déjà appliqué, afficher les informations
  if (appliedCouponId && appliedCouponCode) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-900 dark:text-green-100">
                Code promo: {appliedCouponCode}
              </p>
              {appliedDiscountAmount && (
                <p className="text-sm text-green-700 dark:text-green-300">
                  Réduction de {appliedDiscountAmount.toLocaleString()} XOF
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className="text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="coupon-code">Code promo</Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="coupon-code"
            placeholder="Entrez votre code promo"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            className={cn(
              "pl-10 pr-10",
              validation && !validation.valid && couponCode && "border-red-500",
              validation && validation.valid && "border-green-500"
            )}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && validation?.valid) {
                handleApply();
              }
            }}
          />
          {isValidating && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {!isValidating && validation && validation.valid && (
            <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-600" />
          )}
          {!isValidating && validation && !validation.valid && couponCode && (
            <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
          )}
        </div>
        <Button
          onClick={handleApply}
          disabled={!validation?.valid || isValidating || applyCoupon.isPending}
          variant="outline"
        >
          {applyCoupon.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Appliquer'
          )}
        </Button>
      </div>

      {/* Messages de validation */}
      {validation && !validation.valid && couponCode && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{validation.message || 'Code promo invalide'}</AlertDescription>
        </Alert>
      )}

      {validation && validation.valid && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900 dark:text-green-100">
            <div className="font-medium mb-1">Code promo valide !</div>
            <div className="text-sm">
              Réduction de {validation.discount_amount?.toLocaleString()} XOF
              {validation.discount_type === 'percentage' && (
                <span> ({validation.discount_value}%)</span>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Aperçu du montant après réduction */}
      {validation && validation.valid && validation.order_total_after && (
        <div className="text-sm text-muted-foreground">
          Total après réduction: <span className="font-semibold text-foreground">
            {validation.order_total_after.toLocaleString()} XOF
          </span>
        </div>
      )}
    </div>
  );
};

export default CouponInput;

