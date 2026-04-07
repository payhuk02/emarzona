/**
 * Combined Coupon Input Component
 * Date: 2025-01-27
 * 
 * Composant pour appliquer plusieurs coupons combinés
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Tag,
  Plus,
  X,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Percent,
  DollarSign,
} from 'lucide-react';
import { useValidateCombinedCoupons, useRecordCouponUsage } from '@/hooks/digital/useCouponEnhancements';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';

interface CombinedCouponInputProps {
  orderTotal: number;
  customerId?: string;
  onCouponsApplied?: (couponIds: string[], totalDiscount: number) => void;
  className?: string;
}

export const CombinedCouponInput = ({
  orderTotal,
  customerId,
  onCouponsApplied,
  className,
}: CombinedCouponInputProps) => {
  const { toast } = useToast();
  const [couponCodes, setCouponCodes] = useState<string[]>(['']);
  const [appliedCoupons, setAppliedCoupons] = useState<Array<{
    id: string;
    code: string;
    discount: number;
  }>>([]);
  
  const validateCoupons = useValidateCombinedCoupons();
  const recordUsage = useRecordCouponUsage();

  const handleAddCouponField = () => {
    setCouponCodes([...couponCodes, '']);
  };

  const handleRemoveCouponField = (index: number) => {
    setCouponCodes(couponCodes.filter((_, i) => i !== index));
  };

  const handleCouponCodeChange = (index: number, value: string) => {
    const newCodes = [...couponCodes];
    newCodes[index] = value.toUpperCase();
    setCouponCodes(newCodes);
  };

  const handleValidateCoupons = async () => {
    // Récupérer les IDs des coupons depuis les codes
    const { data: coupons } = await supabase
      .from('digital_product_coupons')
      .select('id, code')
      .in('code', couponCodes.filter(c => c.trim() !== ''));

    if (!coupons || coupons.length === 0) {
      toast({
        title: 'Erreur',
        description: 'Aucun coupon valide trouvé',
        variant: 'destructive',
      });
      return;
    }

    const couponIds = coupons.map(c => c.id);

    try {
      const result = await validateCoupons.mutateAsync({
        couponIds,
        orderTotal,
        customerId,
      });

      if (result.valid) {
        setAppliedCoupons(result.coupons);
        toast({
          title: 'Coupons validés',
          description: `${result.coupons.length} coupon(s) appliqué(s). Réduction totale: ${result.totalDiscount.toLocaleString()} XOF`,
        });
        onCouponsApplied?.(couponIds, result.totalDiscount);
      } else {
        toast({
          title: 'Erreur',
          description: result.error || 'Les coupons ne peuvent pas être appliqués',
          variant: 'destructive',
        });
      }
    } catch ( _error: any) {
      logger.error('Error validating coupons', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la validation des coupons',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveCoupon = (couponId: string) => {
    setAppliedCoupons(appliedCoupons.filter(c => c.id !== couponId));
    onCouponsApplied?.(
      appliedCoupons.filter(c => c.id !== couponId).map(c => c.id),
      appliedCoupons.filter(c => c.id !== couponId).reduce((sum, c) => sum + c.discount, 0)
    );
  };

  const totalDiscount = appliedCoupons.reduce((sum, c) => sum + c.discount, 0);
  const finalTotal = orderTotal - totalDiscount;

  return (
    <Card className={className}>
      <CardContent className="p-4 space-y-4">
        <Label className="text-base font-semibold">Codes promo</Label>
        
        {/* Champs de saisie des coupons */}
        <div className="space-y-2">
          {couponCodes.map((code, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                placeholder="Code promo"
                value={code}
                onChange={(e) => handleCouponCodeChange(index, e.target.value)}
                className="flex-1"
              />
              {couponCodes.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveCouponField(index)}
                  aria-label="Supprimer ce champ de code promo"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddCouponField}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un autre code
          </Button>
        </div>

        {/* Bouton de validation */}
        <Button
          onClick={handleValidateCoupons}
          disabled={validateCoupons.isPending || couponCodes.every(c => !c.trim())}
          className="w-full"
        >
          <Tag className="h-4 w-4 mr-2" />
          Valider les coupons
        </Button>

        {/* Coupons appliqués */}
        {appliedCoupons.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Coupons appliqués</Label>
            {appliedCoupons.map((coupon) => (
              <div
                key={coupon.id}
                className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <Badge variant="outline">{coupon.code}</Badge>
                  <span className="text-sm text-green-700 dark:text-green-300">
                    -{coupon.discount.toLocaleString()} XOF
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveCoupon(coupon.id)}
                  aria-label={`Supprimer le code promo ${coupon.code}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Résumé */}
        {appliedCoupons.length > 0 && (
          <div className="pt-4 border-t space-y-2">
            <div className="flex justify-between text-sm">
              <span>Sous-total:</span>
              <span>{orderTotal.toLocaleString()} XOF</span>
            </div>
            <div className="flex justify-between text-sm text-green-600">
              <span>Réduction:</span>
              <span>-{totalDiscount.toLocaleString()} XOF</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Total:</span>
              <span>{finalTotal.toLocaleString()} XOF</span>
            </div>
          </div>
        )}

        {/* Info */}
        {appliedCoupons.length > 1 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {appliedCoupons.length} coupons combinés appliqués. La réduction totale est limitée à 50% par défaut.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};







