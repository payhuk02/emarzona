import { Product } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ShoppingCart, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { ProductBanner } from "@/components/ui/ResponsiveProductImage";

interface ProductCardProps {
  product: Product;
  storeSlug: string;
}

const ProductCard = ({ product, storeSlug }: ProductCardProps) => {
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${
              star <= rating
                ? "fill-primary text-primary"
                : "fill-muted text-muted"
            }`}
          />
        ))}
        {product.reviews_count > 0 && (
          <span className="text-xs text-muted-foreground ml-1">
            ({product.reviews_count})
          </span>
        )}
      </div>
    );
  };

  return (
    <Card className="group overflow-hidden hover:shadow-large transition-all duration-300 hover:-translate-y-1 border border-border bg-card touch-manipulation touch-friendly product-card product-card-mobile sm:product-card-tablet lg:product-card-desktop">
      <Link to={`/stores/${storeSlug}/products/${product.slug}`} className="block">
        <div className="product-card-container">
          <ProductBanner
            src={product.image_url}
            alt={product.name}
            className="w-full product-banner"
            fallbackIcon={<ShoppingCart className="h-16 w-16 opacity-20" />}
            overlay={
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            }
          />
        </div>
      </Link>
      
      <CardContent className="p-3 sm:p-4 product-card-content-mobile sm:product-card-content-tablet lg:product-card-content-desktop">
        <Link to={`/stores/${storeSlug}/products/${product.slug}`}>
          <h3 className="font-semibold line-clamp-2 hover:text-primary transition-colors mb-2 text-sm sm:text-base min-h-[2.5rem] sm:min-h-[3rem]">
            {product.name}
          </h3>
        </Link>
        
        {product.rating > 0 && (
          <div className="mt-2 mb-2 sm:mb-3">{renderStars(product.rating)}</div>
        )}
        
        <div className="mt-2 sm:mt-3 flex items-baseline gap-1 sm:gap-2">
          <span className="text-xl sm:text-2xl font-bold text-foreground">
            {product.price.toLocaleString()}
          </span>
          <span className="text-xs sm:text-sm text-muted-foreground font-medium">
            {product.currency}
          </span>
        </div>
      </CardContent>
      
      <CardFooter className="p-3 sm:p-4 pt-0">
        <Button 
          className="w-full gradient-primary hover:opacity-90 transition-opacity font-semibold touch-manipulation active:scale-95 transition-transform touch-target product-button-mobile" 
          size="sm"
        >
          <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
          <span className="text-xs sm:text-sm">ACHETER</span>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
