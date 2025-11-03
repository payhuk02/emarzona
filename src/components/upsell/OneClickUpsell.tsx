/**
 * Composant OneClickUpsell - Popup d'upsell après achat
 * Date: 26 Janvier 2025
 * 
 * Fonctionnalités:
 * - Popup après achat réussi
 * - Suggestions produits complémentaires
 * - Remise bundle automatique
 * - Tracking conversions
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { X, ShoppingBag, TrendingDown, Sparkles, Check } from 'lucide-react';
import { useCart } from '@/hooks/cart/useCart';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface UpsellProduct {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  price: number;
  original_price?: number;
  currency: string;
  slug: string;
  store_slug: string;
  discount_percentage?: number;
}

interface OneClickUpsellProps {
  purchasedProductId: string;
  purchasedProductType: string;
  isOpen: boolean;
  onClose: () => void;
  onPurchase?: (productId: string) => void;
}

export function OneClickUpsell({
  purchasedProductId,
  purchasedProductType,
  isOpen,
  onClose,
  onPurchase,
}: OneClickUpsellProps) {
  const [suggestedProducts, setSuggestedProducts] = useState<UpsellProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<UpsellProduct | null>(null);
  const { addItem } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Charger les suggestions
  useEffect(() => {
    if (isOpen && purchasedProductId) {
      loadSuggestions();
    }
  }, [isOpen, purchasedProductId, purchasedProductType]);

  const loadSuggestions = async () => {
    try {
      setLoading(true);

      // Stratégie 1: Produits de la même catégorie
      const { data: categoryProducts } = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          image_url,
          price,
          currency,
          slug,
          category,
          stores!inner (slug)
        `)
        .eq('product_type', purchasedProductType)
        .neq('id', purchasedProductId)
        .eq('is_active', true)
        .eq('is_draft', false)
        .limit(3);

      // Stratégie 2: Bundles contenant ce produit
      const { data: bundles } = await supabase
        .from('digital_bundles')
        .select(`
          id,
          name,
          short_description,
          image_url,
          bundle_price,
          original_price,
          savings_percentage,
          slug,
          stores!inner (slug)
        `)
        .eq('status', 'active')
        .eq('is_available', true)
        .limit(2);

      // Mapper les résultats
      const mappedProducts: UpsellProduct[] = [];

      if (categoryProducts) {
        categoryProducts.forEach((product: any) => {
          mappedProducts.push({
            id: product.id,
            name: product.name,
            description: product.description,
            image_url: product.image_url,
            price: product.price,
            currency: product.currency || 'XOF',
            slug: product.slug,
            store_slug: product.stores.slug,
          });
        });
      }

      if (bundles) {
        bundles.forEach((bundle: any) => {
          mappedProducts.push({
            id: bundle.id,
            name: bundle.name,
            description: bundle.short_description,
            image_url: bundle.image_url,
            price: bundle.bundle_price,
            original_price: bundle.original_price,
            currency: 'XOF',
            slug: bundle.slug,
            store_slug: bundle.stores.slug,
            discount_percentage: bundle.savings_percentage,
          });
        });
      }

      // Mélanger et limiter à 3
      const shuffled = mappedProducts.sort(() => Math.random() - 0.5);
      setSuggestedProducts(shuffled.slice(0, 3));
    } catch (error) {
      logger.error('Error loading upsell suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdd = async (product: UpsellProduct) => {
    try {
      setSelectedProduct(product);

      // Déterminer le type de produit
      const productType = product.discount_percentage ? 'digital' : purchasedProductType;

      await addItem.mutateAsync({
        productId: product.id,
        productType: productType as any,
        quantity: 1,
        price: product.price,
        metadata: {
          is_upsell: true,
          original_purchase: purchasedProductId,
        },
      });

      // Tracking
      try {
        await supabase.from('upsell_tracking').insert({
          original_product_id: purchasedProductId,
          upsell_product_id: product.id,
          action: 'added_to_cart',
        });
      } catch (trackError) {
        // Ignore tracking errors
      }

      toast({
        title: '✅ Ajouté au panier',
        description: `${product.name} a été ajouté à votre panier`,
      });

      onClose();
      navigate('/cart');
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'ajouter au panier',
        variant: 'destructive',
      });
    } finally {
      setSelectedProduct(null);
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('fr-FR');
  };

  if (!isOpen || suggestedProducts.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-yellow-500" />
                Offre Spéciale pour Vous !
              </DialogTitle>
              <DialogDescription className="text-base mt-2">
                Complétez votre achat avec ces produits complémentaires à prix réduit
              </DialogDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
          {suggestedProducts.map((product) => (
            <Card key={product.id} className="hover:shadow-lg transition-shadow">
              <div className="relative">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-40 object-cover rounded-t-lg"
                  />
                ) : (
                  <div className="w-full h-40 bg-gray-100 dark:bg-gray-800 rounded-t-lg flex items-center justify-center">
                    <ShoppingBag className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                {product.discount_percentage && (
                  <Badge className="absolute top-2 right-2 bg-red-500">
                    -{product.discount_percentage.toFixed(0)}%
                  </Badge>
                )}
              </div>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold line-clamp-2">{product.name}</h3>
                {product.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {product.description}
                  </p>
                )}
                <div className="flex items-baseline gap-2">
                  {product.original_price && product.original_price > product.price && (
                    <span className="text-sm text-muted-foreground line-through">
                      {formatPrice(product.original_price)} {product.currency}
                    </span>
                  )}
                  <span className="text-xl font-bold text-primary">
                    {formatPrice(product.price)} {product.currency}
                  </span>
                </div>
                <Button
                  className="w-full"
                  onClick={() => handleQuickAdd(product)}
                  disabled={selectedProduct?.id === product.id || addItem.isPending}
                >
                  {selectedProduct?.id === product.id ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Ajouté
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Ajouter au panier
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Separator />

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Non merci, continuer
          </Button>
          <Button onClick={() => navigate('/cart')} className="flex-1">
            Voir mon panier
          </Button>
        </DialogFooter>

        <p className="text-xs text-center text-muted-foreground mt-2">
          Offre valable uniquement maintenant. Ne manquez pas cette opportunité !
        </p>
      </DialogContent>
    </Dialog>
  );
}

