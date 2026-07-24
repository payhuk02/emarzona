import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { PRODUCT_TYPE_CONFIG, type ProductType } from '@/constants/product-types';
import { LazyImage } from '@/components/ui/lazy-image';
import { formatFcfa } from '@/lib/format-currency';

interface Product {
  id: string;
  name: string;
  price: number;
  revenue?: number;
  image_url: string | null;
  orderCount: number;
  product_type?: string;
}

interface TopProductsCardProps {
  products: Product[];
  variant?: 'default' | 'premium';
}

const TopProductsCardComponent = ({ products, variant = 'default' }: TopProductsCardProps) => {
  const isPremium = variant === 'premium';
  const shellClass = isPremium
    ? 'dashboard-premium-panel h-full flex flex-col'
    : 'dashboard-inner-card border-border/50 shadow-none';
  const navigate = useNavigate();

  if (products.length === 0) {
    return (
      <Card className={shellClass}>
        <CardHeader className="pb-3 p-4 sm:p-5 md:p-6">
          <CardTitle className="dashboard-text-responsive">Produits populaires</CardTitle>
          <CardDescription className="dashboard-text-responsive-small mt-1">
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

  const Wrap = isPremium ? 'div' : Card;
  const HeaderWrap = isPremium ? 'div' : CardHeader;
  const ContentWrap = isPremium ? 'div' : CardContent;

  return (
    <Wrap className={shellClass}>
      <HeaderWrap className={cn(!isPremium && 'pb-3 p-4 sm:p-5 md:p-6', isPremium && 'mb-5')}>
        <div className="flex items-center justify-between gap-3">
          <div>
            {isPremium ? (
              <>
                <h2 className="dashboard-premium-panel-title">Top produits</h2>
                <p className="dashboard-premium-panel-subtitle">Les 5 meilleures ventes</p>
              </>
            ) : (
              <>
                <CardTitle className="dashboard-text-responsive">Produits populaires</CardTitle>
                <CardDescription className="dashboard-text-responsive-small mt-1">
                  Top 5 des produits les plus vendus
                </CardDescription>
              </>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard/products')}
            className="gap-1 h-9 sm:h-10 text-sm shrink-0"
          >
            Voir tout
            <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </HeaderWrap>
      <ContentWrap
        className={cn(!isPremium && 'p-3 sm:p-4 md:p-6 pt-0', isPremium && 'flex-1 space-y-0')}
      >
        <div className={isPremium ? 'divide-y divide-border/40' : 'space-y-4'}>
          {products.map((product, index) => (
            <div
              key={product.id}
              className={cn(
                'cursor-pointer transition-colors touch-manipulation',
                isPremium
                  ? 'dashboard-order-row'
                  : 'flex items-center gap-3 p-2 sm:p-3 md:p-4 rounded-lg border hover:bg-muted/50 min-h-[50px] sm:min-h-[60px]'
              )}
              style={{ willChange: 'transform' }}
              onClick={() => navigate('/dashboard/products')}
            >
              <div
                className={cn(
                  'shrink-0',
                  isPremium
                    ? 'dashboard-order-avatar text-primary'
                    : 'flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full font-bold bg-primary/10 text-primary text-sm'
                )}
              >
                {index + 1}
              </div>
              {product.image_url ? (
                <LazyImage
                  src={product.image_url}
                  alt={product.name}
                  className="h-10 w-10 sm:h-12 sm:w-12 object-cover rounded-md flex-shrink-0"
                  width={48}
                  height={48}
                  placeholder="/api/placeholder/48/48"
                />
              ) : (
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
                  <Package className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-0.5 sm:mb-1">
                  <p
                    className={cn(
                      'font-medium truncate',
                      isPremium ? 'text-sm sm:text-base' : 'text-sm'
                    )}
                  >
                    {product.name}
                  </p>
                  {product.product_type &&
                    (() => {
                      const productType = product.product_type as ProductType;
                      const config = PRODUCT_TYPE_CONFIG[productType];
                      if (!config) return null;
                      const Icon = config.icon;
                      return (
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[8px] sm:text-[9px] md:text-[10px] px-1.5 sm:px-2 py-0.5 flex items-center gap-1',
                            config.bgColor,
                            config.textColor
                          )}
                        >
                          <Icon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          <span>{config.label}</span>
                        </Badge>
                      );
                    })()}
                </div>
                <p
                  className={cn(
                    'text-muted-foreground',
                    isPremium ? 'text-xs sm:text-sm' : 'text-xs'
                  )}
                >
                  {product.orderCount} vente{product.orderCount > 1 ? 's' : ''}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p
                  className={cn(
                    'font-bold tabular-nums',
                    isPremium ? 'text-sm sm:text-base' : 'text-sm'
                  )}
                >
                  {formatFcfa(product.revenue ?? product.price)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ContentWrap>
    </Wrap>
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
