/**
 * Coupon Input Component
 * Date: 27 Janvier 2025
 * 
 * Composant pour saisir et valider un code promo dans le checkout
 */

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle, X, Tag } from 'lucide-react';
import { useValidateUnifiedPromotion } from '@/hooks/physical/usePromotions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface CouponInputProps {
  storeId?: string;
  productId?: string; // Legacy: pour un seul produit
  productIds?: string[]; // Nouveau: liste de produits du panier
  productType?: string;
  customerId?: string;
  orderAmount: number;
  onApply: (promotionId: string, discountAmount: number, code: string) => void;
  onRemove: () => void;
  appliedCouponId?: string | null;
  appliedCouponCode?: string | null;
  appliedDiscountAmount?: number | null;
  isFirstOrder?: boolean; // Pour les promotions "nouveaux clients"
}

export const CouponInput = ({
  storeId,
  productId,
  productIds: productIdsProp,
  customerId,
  orderAmount,
  onApply,
  onRemove,
  appliedCouponId,
  appliedCouponCode,
  appliedDiscountAmount,
  isFirstOrder = false,
}: CouponInputProps) => {
  const [couponCode, setCouponCode] = useState('');
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [collectionIds, setCollectionIds] = useState<string[]>([]);
  const { toast } = useToast();

  // Déterminer la liste de produits à utiliser
  const productIds = useMemo(() => {
    if (productIdsProp && productIdsProp.length > 0) {
      return productIdsProp;
    }
    if (productId) {
      return [productId];
    }
    return [];
  }, [productIdsProp, productId]);

  // Charger les catégories et collections des produits du panier
  useEffect(() => {
    if (productIds.length === 0) {
      setCategoryIds([]);
      setCollectionIds([]);
      return;
    }

    const loadProductData = async () => {
      try {
        // Charger les catégories
        const { data: products } = await supabase
          .from('products')
          .select('category_id')
          .in('id', productIds);

        if (products) {
          const categories = products
            .map(p => p.category_id)
            .filter((id): id is string => id !== null && id !== undefined);
          setCategoryIds([...new Set(categories)]);
        }

        // Charger les collections - désactivé temporairement si la table n'existe pas
        // Les collections seront chargées via une autre méthode si nécessaire
        setCollectionIds([]);
      } catch (error) {
        logger.error('Error loading product categories/collections', { error });
      }
    };

    loadProductData();
  }, [productIds]);

  // Validation du coupon avec le système unifié
  const { data: validation, isLoading: isValidating } = useValidateUnifiedPromotion(
    couponCode || undefined,
    {
      storeId,
      productIds: productIds.length > 0 ? productIds : undefined,
      categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
      collectionIds: collectionIds.length > 0 ? collectionIds : undefined,
      orderAmount,
      customerId,
      isFirstOrder,
    }
  );

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
        description: validation?.message || validation?.error || 'Ce code promo n\'est pas valide',
        variant: 'destructive',
      });
      return;
    }

    if (!validation.promotion_id || !validation.discount_amount) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'appliquer ce code promo',
        variant: 'destructive',
      });
      return;
    }

    // Appeler onApply avec les données de la promotion
    onApply(
      validation.promotion_id,
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
            aria-label={`Retirer le code promo ${appliedCouponCode}`}
          >
            <X className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Retirer le code promo</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2" role="region" aria-labelledby="coupon-label">
      <Label htmlFor="coupon-code" id="coupon-label">Code promo</Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            id="coupon-code"
            placeholder="Entrez votre code promo"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            className={cn(
              "pl-10 pr-10 min-h-[44px] text-base",
              validation && !validation.valid && couponCode && "border-red-500",
              validation && validation.valid && "border-green-500"
            )}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && validation?.valid) {
                handleApply();
              }
            }}
            aria-label="Code promo"
            aria-describedby={validation ? (validation.valid ? "coupon-valid" : "coupon-invalid") : undefined}
            aria-invalid={validation && !validation.valid && couponCode ? true : false}
            autoComplete="off"
          />
          {isValidating && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" aria-label="Validation du code en cours" aria-live="polite" />
          )}
          {!isValidating && validation && validation.valid && (
            <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-600" aria-label="Code promo valide" aria-hidden="true" />
          )}
          {!isValidating && validation && !validation.valid && couponCode && (
            <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" aria-label="Code promo invalide" aria-hidden="true" />
          )}
        </div>
        <Button
          onClick={handleApply}
          disabled={!validation?.valid || isValidating}
          variant="outline"
          className="min-h-[44px]"
          aria-label="Appliquer le code promo"
          aria-describedby={validation?.valid ? "coupon-valid" : undefined}
        >
          {isValidating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span className="sr-only">Validation en cours</span>
            </>
          ) : (
            'Appliquer'
          )}
        </Button>
      </div>

      {/* Messages de validation */}
      {validation && !validation.valid && couponCode && (
        <Alert variant="destructive" id="coupon-invalid" role="alert" aria-live="assertive">
          <XCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>{validation.message || 'Code promo invalide'}</AlertDescription>
        </Alert>
      )}

      {validation && validation.valid && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950" id="coupon-valid" role="alert" aria-live="polite">
          <CheckCircle2 className="h-4 w-4 text-green-600" aria-hidden="true" />
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

