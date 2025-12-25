import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  orderCount: number;
}

interface TopProductsCardProps {
  products: Product[];
}

const TopProductsCardComponent = ({ products }: TopProductsCardProps) => {
  const navigate = useNavigate();

  if (products.length === 0) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-soft">
        <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 md:p-6">
          <CardTitle className="text-xs sm:text-sm md:text-base lg:text-lg">
            Produits populaires
          </CardTitle>
          <CardDescription className="text-[10px] sm:text-[11px] md:text-xs text-muted-foreground">
            Vos produits les plus vendus
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
          <div className="text-center py-4 sm:py-6">
            <Package className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-1.5 sm:mb-2 opacity-50" />
            <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">
              Aucun produit vendu pour le moment
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-soft">
      <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xs sm:text-sm md:text-base lg:text-lg">
              Produits populaires
            </CardTitle>
            <CardDescription className="text-[10px] sm:text-[11px] md:text-xs text-muted-foreground">
              Top 5 des produits les plus vendus
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard/products')}
            className="gap-1 h-8 sm:h-9 text-[10px] sm:text-xs"
          >
            Voir tout
            <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
        <div className="space-y-4">
          {products.map((product, index) => (
            <div
              key={product.id}
              className="flex items-center gap-2 sm:gap-2.5 md:gap-3 p-2 sm:p-3 md:p-4 rounded-lg border hover:bg-muted/50 transition-colors touch-manipulation min-h-[50px] sm:min-h-[60px] cursor-pointer"
              style={{ willChange: 'transform' }}
              onClick={() => navigate('/dashboard/products')}
            >
              <div className="flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary/10 text-primary font-semibold flex-shrink-0 text-[10px] sm:text-xs md:text-sm">
                {index + 1}
              </div>
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="h-10 w-10 sm:h-12 sm:w-12 object-cover rounded-md flex-shrink-0"
                />
              ) : (
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
                  <Package className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs md:text-sm font-medium truncate mb-0.5 sm:mb-1">
                  {product.name}
                </p>
                <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground">
                  {product.orderCount} vente{product.orderCount > 1 ? 's' : ''}
                </p>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                <p className="text-[10px] sm:text-xs md:text-sm font-semibold">
                  {product.price.toLocaleString()} FCFA
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Optimisation avec React.memo pour éviter les re-renders inutiles
export const TopProductsCard = React.memo(TopProductsCardComponent, (prevProps, nextProps) => {
  if (prevProps.products.length !== nextProps.products.length) return false;

  return prevProps.products.every((product, index) => {
    const nextProduct = nextProps.products[index];
    return (
      product.id === nextProduct.id &&
      product.name === nextProduct.name &&
      product.price === nextProduct.price &&
      product.image_url === nextProduct.image_url &&
      product.orderCount === nextProduct.orderCount
    );
  });
});

TopProductsCard.displayName = 'TopProductsCard';
