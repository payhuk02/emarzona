/**
 * Dynamic Bundle Selector - Permet aux clients de créer leur propre bundle
 * Date: 2025-01-27
 * 
 * Le client peut sélectionner les produits qu'il veut dans un bundle
 * et obtenir un prix personnalisé basé sur sa sélection
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Package,
  ShoppingCart,
  Percent,
  DollarSign,
  CheckCircle2,
  X,
  Info,
  TrendingDown,
} from '@/components/icons';
import { cn } from '@/lib/utils';

// =====================================================
// TYPES
// =====================================================

export interface DynamicBundleProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency?: string;
  image_url?: string;
  category?: string;
  isAvailable: boolean;
}

export interface DynamicBundleConfig {
  id: string;
  name: string;
  description?: string;
  minProducts: number; // Nombre minimum de produits à sélectionner
  maxProducts?: number; // Nombre maximum (optionnel)
  discountType: 'percentage' | 'fixed' | 'progressive'; // Type de remise
  baseDiscount: number; // Remise de base (% ou montant fixe)
  progressiveDiscounts?: Array<{ minProducts: number; discount: number }>; // Remises progressives
  availableProducts: string[]; // IDs des produits disponibles dans ce bundle
}

export interface DynamicBundleSelectorProps {
  config: DynamicBundleConfig;
  products: DynamicBundleProduct[];
  onSelectionChange?: (selectedProductIds: string[], totalPrice: number, discount: number) => void;
  onAddToCart?: (selectedProductIds: string[], bundlePrice: number) => void;
  className?: string;
}

// =====================================================
// COMPONENT
// =====================================================

export const DynamicBundleSelector = ({
  config,
  products,
  onSelectionChange,
  onAddToCart,
  className,
}: DynamicBundleSelectorProps) => {
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Filtrer les produits disponibles
  const availableProducts = useMemo(() => {
    return products.filter(
      (p) => config.availableProducts.includes(p.id) && p.isAvailable
    );
  }, [products, config.availableProducts]);

  // Produits sélectionnés
  const selectedProducts = useMemo(() => {
    return availableProducts.filter((p) => selectedProductIds.includes(p.id));
  }, [availableProducts, selectedProductIds]);

  // Calculer le prix total sans réduction
  const originalTotal = useMemo(() => {
    return selectedProducts.reduce((sum, p) => sum + p.price, 0);
  }, [selectedProducts]);

  // Calculer la remise
  const discount = useMemo(() => {
    if (selectedProducts.length < config.minProducts) {
      return 0;
    }

    if (config.discountType === 'percentage') {
      return originalTotal * (config.baseDiscount / 100);
    } else if (config.discountType === 'fixed') {
      return config.baseDiscount;
    } else if (config.discountType === 'progressive' && config.progressiveDiscounts) {
      // Trouver la remise progressive la plus élevée applicable
      let maxDiscount = 0;
      for (const progDiscount of config.progressiveDiscounts.sort(
        (a, b) => b.minProducts - a.minProducts
      )) {
        if (selectedProducts.length >= progDiscount.minProducts) {
          maxDiscount = originalTotal * (progDiscount.discount / 100);
          break;
        }
      }
      return maxDiscount > 0 ? maxDiscount : originalTotal * (config.baseDiscount / 100);
    }

    return 0;
  }, [selectedProducts, originalTotal, config]);

  // Prix final après remise
  const finalPrice = useMemo(() => {
    return Math.max(0, originalTotal - discount);
  }, [originalTotal, discount]);

  // Pourcentage d'économie
  const savingsPercentage = useMemo(() => {
    if (originalTotal === 0) return 0;
    return (discount / originalTotal) * 100;
  }, [discount, originalTotal]);

  // Vérifier si la sélection est valide
  const isValidSelection = useMemo(() => {
    const count = selectedProductIds.length;
    return (
      count >= config.minProducts &&
      (config.maxProducts === undefined || count <= config.maxProducts)
    );
  }, [selectedProductIds, config.minProducts, config.maxProducts]);

  // Toggle sélection
  const toggleProduct = (productId: string) => {
    setSelectedProductIds((prev) => {
      const newSelection = prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId];

      // Notifier le parent
      if (onSelectionChange) {
        const selected = availableProducts.filter((p) => newSelection.includes(p.id));
        const total = selected.reduce((sum, p) => sum + p.price, 0);
        const discountAmount = calculateDiscount(total, newSelection.length);
        onSelectionChange(newSelection, total, discountAmount);
      }

      return newSelection;
    });
  };

  // Calculer la remise pour un nombre donné de produits
  const calculateDiscount = (total: number, count: number): number => {
    if (count < config.minProducts) return 0;

    if (config.discountType === 'percentage') {
      return total * (config.baseDiscount / 100);
    } else if (config.discountType === 'fixed') {
      return config.baseDiscount;
    } else if (config.discountType === 'progressive' && config.progressiveDiscounts) {
      for (const progDiscount of config.progressiveDiscounts.sort(
        (a, b) => b.minProducts - a.minProducts
      )) {
        if (count >= progDiscount.minProducts) {
          return total * (progDiscount.discount / 100);
        }
      }
      return total * (config.baseDiscount / 100);
    }

    return 0;
  };

  // Gérer l'ajout au panier
  const handleAddToCart = () => {
    if (!isValidSelection || !onAddToCart) return;
    onAddToCart(selectedProductIds, finalPrice);
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {config.name}
            </CardTitle>
            {config.description && (
              <CardDescription className="mt-2">{config.description}</CardDescription>
            )}
          </div>
          <Badge variant="secondary" className="flex items-center gap-1">
            <TrendingDown className="h-3 w-3" />
            Bundle Dynamique
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Info sur les conditions */}
        <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
          <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
          <div className="text-sm text-muted-foreground">
            <p>
              Sélectionnez entre <strong>{config.minProducts}</strong>
              {config.maxProducts && ` et ${config.maxProducts}`} produit(s) pour bénéficier
              d'une remise.
            </p>
            {config.discountType === 'progressive' && config.progressiveDiscounts && (
              <p className="mt-1">
                Plus vous sélectionnez de produits, plus la remise est importante !
              </p>
            )}
          </div>
        </div>

        {/* Liste des produits */}
        <div className="space-y-4">
          <Label>Produits disponibles ({availableProducts.length})</Label>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {availableProducts.map((product) => {
                const isSelected = selectedProductIds.includes(product.id);
                return (
                  <Card
                    key={product.id}
                    className={cn(
                      'cursor-pointer transition-all hover:shadow-md',
                      isSelected && 'ring-2 ring-primary'
                    )}
                    onClick={() => toggleProduct(product.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleProduct(product.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        {product.image_url && (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold">{product.name}</h4>
                          {product.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {product.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline">
                              {product.price.toLocaleString()} XOF
                            </Badge>
                            {product.category && (
                              <Badge variant="secondary" className="text-xs">
                                {product.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        <Separator />

        {/* Résumé de la sélection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Résumé</Label>
            <Badge variant={isValidSelection ? 'default' : 'destructive'}>
              {selectedProductIds.length} / {config.minProducts}
              {config.maxProducts && ` - ${config.maxProducts}`} produit(s)
            </Badge>
          </div>

          {selectedProducts.length > 0 && (
            <div className="space-y-2 p-4 bg-muted rounded-lg">
              <div className="flex justify-between text-sm">
                <span>Prix total:</span>
                <span className="font-semibold">
                  {originalTotal.toLocaleString()} XOF
                </span>
              </div>
              {discount > 0 && (
                <>
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Remise:</span>
                    <span className="font-semibold">
                      -{discount.toLocaleString()} XOF ({savingsPercentage.toFixed(1)}%)
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Prix final:</span>
                    <span className="text-primary">
                      {finalPrice.toLocaleString()} XOF
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Bouton Ajouter au panier */}
          <Button
            className="w-full"
            size="lg"
            disabled={!isValidSelection || !onAddToCart}
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {isValidSelection
              ? `Ajouter ${selectedProductIds.length} produit(s) au panier - ${finalPrice.toLocaleString()} XOF`
              : `Sélectionnez au moins ${config.minProducts} produit(s)`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

