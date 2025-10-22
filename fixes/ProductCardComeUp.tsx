// src/components/marketplace/ProductCardComeUp.tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Star, Percent, Heart, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductBanner } from "@/components/ui/ResponsiveProductImage";

interface ProductCardComeUpProps {
  product: {
    id: string;
    name: string;
    slug: string;
    image_url?: string;
    price: number;
    promo_price?: number;
    currency?: string;
    rating?: number;
    reviews_count?: number;
    category?: string;
  };
  storeSlug: string;
}

const ProductCardComeUp = ({ product, storeSlug }: ProductCardComeUpProps) => {
  const [isFavorite, setIsFavorite] = useState(false);
  
  const price = product.promo_price ?? product.price;
  const hasPromo = product.promo_price && product.promo_price < product.price;
  const discountPercent = hasPromo
    ? Math.round(((product.price - product.promo_price!) / product.price) * 100)
    : 0;

  return (
    <article 
      className="group relative flex flex-col rounded-xl border border-border bg-card overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-2 hover:scale-105"
      role="article"
      aria-labelledby={`product-title-${product.id}`}
    >
      {/* Image avec ratio 16:9 ComeUp-style */}
      <div className="relative aspect-[16/9] overflow-hidden">
        <ProductBanner
          src={product.image_url}
          alt={`Image du produit ${product.name}`}
          className="w-full h-full"
          fallbackIcon={<ShoppingCart className="h-12 w-12 text-muted-foreground" />}
          badges={
            hasPromo ? (
              <div className="absolute top-3 right-3 z-10">
                <Badge className="bg-red-500 text-white text-xs font-bold px-2 py-1 animate-pulse">
                  <Percent className="h-3 w-3 mr-1" /> -{discountPercent}%
                </Badge>
              </div>
            ) : undefined
          }
        />
        
        {/* Actions overlay ComeUp-style */}
        <div className="absolute top-3 left-3 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0 touch-manipulation min-h-[44px] min-w-[44px]"
            onClick={() => setIsFavorite(!isFavorite)}
            aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0 touch-manipulation min-h-[44px] min-w-[44px]"
            aria-label="Partager le produit"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Contenu de la carte */}
      <div className="flex-1 flex flex-col justify-between p-4">
        <div className="flex-1">
          {product.category && (
            <span className="text-xs font-medium text-primary uppercase tracking-wide mb-2 block">
              {product.category}
            </span>
          )}

          <h3 
            id={`product-title-${product.id}`}
            className="font-semibold text-sm sm:text-base leading-tight line-clamp-2 mb-2 group-hover:text-primary transition-colors"
          >
            {product.name}
          </h3>

          {product.rating ? (
            <div className="flex items-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-3 w-3 sm:h-4 sm:w-4 ${
                    star <= product.rating! ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                  }`}
                />
              ))}
              <span className="text-xs text-muted-foreground">
                ({product.reviews_count ?? 0})
              </span>
            </div>
          ) : (
            <div className="h-5 mb-3" />
          )}

          <div className="flex items-baseline gap-2 mb-3">
            {hasPromo && (
              <span className="text-sm text-muted-foreground line-through">
                {product.price.toLocaleString()} {product.currency ?? "FCFA"}
              </span>
            )}
            <span className="text-lg font-bold text-primary">
              {price.toLocaleString()} {product.currency ?? "FCFA"}
            </span>
          </div>
        </div>

        {/* Actions ComeUp-style */}
        <div className="flex gap-2">
          <Link to={`/stores/${storeSlug}/products/${product.slug}`} className="flex-1">
            <Button 
              variant="outline" 
              className="w-full text-xs sm:text-sm py-2 px-3 touch-manipulation min-h-[44px] focus-visible:ring-2 focus-visible:ring-primary"
            >
              Voir
            </Button>
          </Link>

          <Button
            className="flex-1 text-xs sm:text-sm py-2 px-3 touch-manipulation min-h-[44px] focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ShoppingCart className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Acheter</span>
            <span className="sm:hidden">Achat</span>
          </Button>
        </div>
      </div>
    </article>
  );
};

export default ProductCardComeUp;