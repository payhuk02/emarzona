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
    <Card className="group overflow-hidden transition-all duration-300 hover:-translate-y-1 border border-border bg-card touch-manipulation touch-friendly product-card product-card-mobile sm:product-card-tablet lg:product-card-desktop">
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
      
      <CardContent className="product-card-content">
        <div className="flex-1">
          <Link to={`/stores/${storeSlug}/products/${product.slug}`}>
            <h3 className="product-title hover:text-primary transition-colors mb-2">
              {product.name}
            </h3>
          </Link>
          
          {product.rating > 0 && (
            <div className="product-rating mb-3">{renderStars(product.rating)}</div>
          )}

          {/* ✨ NOUVEAU: Description courte */}
          {product.short_description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
              {product.short_description}
            </p>
          )}
          
          <div className="flex items-baseline gap-2 mb-4">
            <span className="product-price">
              {product.price.toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground font-medium">
              {product.currency}
            </span>
          </div>
        </div>
        
        <div className="product-actions">
          <Button 
            className="product-button product-button-primary" 
            size="sm"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            <span>Acheter</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
