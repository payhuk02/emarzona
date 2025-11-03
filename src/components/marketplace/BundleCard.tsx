/**
 * Composant BundleCard - Carte bundle pour le marketplace
 * Date: 26 Janvier 2025
 */

import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, ShoppingBag, TrendingDown, Star } from 'lucide-react';
import { useCart } from '@/hooks/cart/useCart';
import { useToast } from '@/hooks/use-toast';
import type { DigitalBundle } from '@/hooks/digital/useDigitalBundles';

interface BundleCardProps {
  bundle: DigitalBundle;
  storeSlug: string;
}

export function BundleCard({ bundle, storeSlug }: BundleCardProps) {
  const { addItem } = useCart();
  const { toast } = useToast();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await addItem.mutateAsync({
        productId: bundle.id,
        productType: 'digital' as const,
        quantity: 1,
        price: bundle.bundle_price,
        metadata: {
          is_bundle: true,
          bundle_id: bundle.id,
        },
      });

      toast({
        title: 'Bundle ajouté au panier',
        description: `${bundle.name} a été ajouté à votre panier`,
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'ajouter au panier',
        variant: 'destructive',
      });
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('fr-FR');
  };

  return (
    <Card className="group relative overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-primary transition-all duration-300 hover:shadow-xl rounded-lg">
      {/* Badge Bundle */}
      <div className="absolute top-3 left-3 z-10">
        <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0">
          <Package className="h-3 w-3 mr-1" />
          Bundle
        </Badge>
      </div>

      {/* Badge Économie */}
      {bundle.savings_percentage > 0 && (
        <div className="absolute top-3 right-3 z-10">
          <Badge variant="destructive" className="flex items-center gap-1">
            <TrendingDown className="h-3 w-3" />
            -{bundle.savings_percentage.toFixed(0)}%
          </Badge>
        </div>
      )}

      {/* Image */}
      <Link to={`/bundles/${bundle.id}`}>
        <div className="relative w-full h-48 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 overflow-hidden">
          {bundle.image_url ? (
            <img
              src={bundle.image_url}
              alt={bundle.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-16 w-16 text-purple-400" />
            </div>
          )}
          
          {/* Overlay au hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        </div>
      </Link>

      <CardContent className="p-4 space-y-3">
        {/* Nom et description */}
        <div>
          <Link to={`/bundles/${bundle.id}`}>
            <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors mb-1">
              {bundle.name}
            </h3>
          </Link>
          {bundle.short_description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {bundle.short_description}
            </p>
          )}
        </div>

        {/* Nombre de produits */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Package className="h-4 w-4" />
          <span>{bundle.bundle_items?.length || 0} produit{bundle.bundle_items?.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Prix */}
        <div className="flex items-baseline gap-2">
          {bundle.original_price > bundle.bundle_price && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(bundle.original_price)} XOF
            </span>
          )}
          <span className="text-2xl font-bold text-primary">
            {formatPrice(bundle.bundle_price)} XOF
          </span>
        </div>

        {/* Économie */}
        {bundle.savings > 0 && (
          <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
            <TrendingDown className="h-4 w-4" />
            <span>Économisez {formatPrice(bundle.savings)} XOF</span>
          </div>
        )}

        {/* Rating (si disponible) */}
        {bundle.average_rating && bundle.average_rating > 0 && (
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{bundle.average_rating.toFixed(1)}</span>
            {bundle.reviews_count && bundle.reviews_count > 0 && (
              <span className="text-xs text-muted-foreground">
                ({bundle.reviews_count})
              </span>
            )}
          </div>
        )}

        {/* Boutons d'action */}
        <div className="flex gap-2 pt-2">
          <Button
            asChild
            variant="outline"
            className="flex-1"
          >
            <Link to={`/bundles/${bundle.id}`}>
              Voir détails
            </Link>
          </Button>
          <Button
            onClick={handleAddToCart}
            disabled={addItem.isPending || !bundle.is_available}
            className="flex-1"
          >
            {addItem.isPending ? (
              <>
                <div className="h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Ajout...
              </>
            ) : (
              <>
                <ShoppingBag className="h-4 w-4 mr-2" />
                Ajouter
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

