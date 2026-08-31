import { useNavigate } from 'react-router-dom';
import { Star, FileText, ShoppingCart, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ResponsiveProductImage } from '@/components/ui/ResponsiveProductImage';
import { MarketplaceGuestBuyDialogs } from '@/components/marketplace/MarketplaceGuestBuyDialogs';
import { useMarketplaceGuestBuy } from '@/hooks/marketplace/useMarketplaceGuestBuy';
import { htmlToPlainText } from '@/lib/html-sanitizer';
import { resolveDigitalDisplayPrice } from '@/lib/digital/digital-product-display';

export type DigitalSearchProduct = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  short_description?: string | null;
  price: number;
  promotional_price?: number | null;
  currency: string;
  image_url?: string | null;
  store_id: string;
  average_rating?: number | null;
  stores?: { id: string; name: string; slug: string } | null;
};

type DigitalSearchProductCardProps = {
  product: DigitalSearchProduct;
};

export function DigitalSearchProductCard({ product }: DigitalSearchProductCardProps) {
  const navigate = useNavigate();
  const { displayPrice, compareAtPrice, hasPromo } = resolveDigitalDisplayPrice(
    product.price,
    product.promotional_price
  );
  const summary = htmlToPlainText(product.short_description || product.description || '');

  const marketplaceBuy = useMarketplaceGuestBuy({
    product: {
      id: product.id,
      slug: product.slug,
      name: product.name,
      store_id: product.store_id,
      product_type: 'digital',
      currency: product.currency,
    },
    price: displayPrice,
    storeSlug: product.stores?.slug,
  });

  return (
    <>
      <Card
        className="group hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col"
        onClick={() => navigate(`/digital/${product.id}`)}
      >
        <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
          <ResponsiveProductImage
            src={product.image_url}
            alt={product.name}
            className="w-full h-full"
            fit="cover"
            context="grid"
            fallbackIcon={<FileText className="h-16 w-16 text-muted-foreground" />}
          />
        </div>
        <CardContent className="p-4 flex flex-col flex-1">
          <h3 className="font-semibold mb-2 line-clamp-2">{product.name}</h3>
          {summary && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2 flex-1">{summary}</p>
          )}
          <div className="flex items-center justify-between gap-2 mt-auto pt-2">
            <div className="flex items-baseline gap-2 min-w-0 flex-wrap">
              <span className="text-lg font-bold text-primary whitespace-nowrap">
                {displayPrice.toLocaleString()} {product.currency}
              </span>
              {hasPromo && compareAtPrice != null && (
                <span className="text-sm line-through text-muted-foreground whitespace-nowrap">
                  {compareAtPrice.toLocaleString()} {product.currency}
                </span>
              )}
            </div>
            <Button
              size="sm"
              className="shrink-0"
              disabled={marketplaceBuy.loading}
              onClick={e => {
                e.stopPropagation();
                void marketplaceBuy.handleBuyClick();
              }}
            >
              {marketplaceBuy.loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4 mr-1" />
                  Acheter
                </>
              )}
            </Button>
          </div>
          {product.average_rating != null && product.average_rating > 0 && (
            <div className="flex items-center gap-1 mt-2">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm">{product.average_rating.toFixed(1)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <MarketplaceGuestBuyDialogs
        product={marketplaceBuy.product}
        price={displayPrice}
        guestOpen={marketplaceBuy.guestOpen}
        setGuestOpen={marketplaceBuy.setGuestOpen}
        physicalOpen={marketplaceBuy.physicalOpen}
        setPhysicalOpen={marketplaceBuy.setPhysicalOpen}
        loading={marketplaceBuy.loading}
        onGuestConfirm={marketplaceBuy.proceedWithCustomer}
      />
    </>
  );
}
