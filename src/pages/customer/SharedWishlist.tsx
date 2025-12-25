/**
 * Page pour afficher une wishlist partagée
 * Date: 27 Janvier 2025
 */

import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSharedWishlist } from '@/hooks/wishlist/useWishlistShare';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  Package,
  Download,
  BookOpen,
  Calendar,
  AlertCircle,
  ShoppingCart,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SharedWishlist() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data, isLoading, error } = useSharedWishlist(token || '');

  const getProductTypeIcon = (type: string) => {
    switch (type) {
      case 'digital':
        return <Download className="h-4 w-4" />;
      case 'physical':
        return <Package className="h-4 w-4" />;
      case 'service':
        return <Calendar className="h-4 w-4" />;
      case 'course':
        return <BookOpen className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  interface WishlistProductItem {
    product_type: string;
    stores?: { slug: string };
    id: string;
    slug?: string;
  }
  const handleViewProduct = (product: WishlistProductItem) => {
    const productType = product.product_type;
    const storeSlug = product.stores?.slug;

    if (!storeSlug) {
      toast({
        title: 'Erreur',
        description: 'Boutique introuvable',
        variant: 'destructive',
      });
      return;
    }

    switch (productType) {
      case 'digital':
        navigate(`/digital/${product.id}`);
        break;
      case 'physical':
        navigate(`/products/physical/${product.id}`);
        break;
      case 'service':
        navigate(`/services/${product.id}`);
        break;
      case 'course':
        navigate(`/courses/${product.id}`);
        break;
      default:
        navigate(`/marketplace/${storeSlug}/${product.slug}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <Skeleton className="h-10 w-64 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-96" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error instanceof Error ? error.message : 'Lien de partage invalide ou expiré'}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const { share, products } = data;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-lg sm:text-2xl md:text-3xl font-bold flex items-center gap-1.5 sm:gap-2 mb-2">
            <Heart className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-red-500" />
            Wishlist partagée
          </h1>
          <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground">
            {products.length} produit{products.length > 1 ? 's' : ''} dans cette wishlist
          </p>
        </div>

        {/* Liste des produits */}
        {products.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Cette wishlist est vide
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((item: WishlistProduct) => {
              const product = item.products;
              return (
                <Card key={product.id} className="hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <img
                      src={product.image_url || '/placeholder-product.png'}
                      alt={product.name}
                      className="w-full h-48 object-cover rounded-t-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-product.png';
                      }}
                    />
                    <Badge
                      className="absolute top-2 left-2"
                      variant="secondary"
                    >
                      {getProductTypeIcon(product.product_type)}
                      <span className="ml-1 capitalize">{product.product_type}</span>
                    </Badge>
                  </div>
                  <CardHeader>
                    <CardTitle className="line-clamp-2">{product.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {product.description || 'Aucune description'}
                    </CardDescription>
                    {product.stores && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Boutique: {product.stores.name}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      {product.promotional_price ? (
                        <div className="flex flex-col">
                          <span className="text-2xl font-bold text-primary">
                            {product.promotional_price.toLocaleString('fr-FR')} {product.currency}
                          </span>
                          <span className="text-sm line-through text-muted-foreground">
                            {product.price.toLocaleString('fr-FR')} {product.currency}
                          </span>
                        </div>
                      ) : (
                        <span className="text-2xl font-bold">
                          {product.price.toLocaleString('fr-FR')} {product.currency}
                        </span>
                      )}
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => handleViewProduct(product)}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Voir le produit
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

