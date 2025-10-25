import { Product } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingCart, 
  Star, 
  Download, 
  Crown, 
  Sparkles, 
  Tag, 
  Package, 
  Zap,
  RefreshCw,
  DollarSign,
  Gift,
  Clock
} from "lucide-react";
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

  // Vérifier si le produit est nouveau (< 7 jours)
  const isNew = () => {
    if (!product.created_at) return false;
    const createdDate = new Date(product.created_at);
    const now = new Date();
    const daysDiff = (now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24);
    return daysDiff < 7;
  };

  // Vérifier si en promotion
  const hasPromotion = () => {
    return product.promotional_price && product.promotional_price < product.price;
  };

  // Calculer le pourcentage de réduction
  const getDiscountPercentage = () => {
    if (!hasPromotion()) return 0;
    return Math.round(((product.price - product.promotional_price!) / product.price) * 100);
  };

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:-translate-y-1 border border-border bg-card touch-manipulation touch-friendly product-card product-card-mobile sm:product-card-tablet lg:product-card-desktop">
      <Link to={`/stores/${storeSlug}/products/${product.slug}`} className="block">
        <div className="product-card-container relative">
          {/* 🏷️ Badges en overlay */}
          <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
            {/* Badge Nouveau */}
            {isNew() && (
              <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 shadow-lg">
                <Sparkles className="h-3 w-3 mr-1" />
                Nouveau
              </Badge>
            )}
            
            {/* Badge Vedette */}
            {product.is_featured && (
              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-lg">
                <Crown className="h-3 w-3 mr-1" />
                Vedette
              </Badge>
            )}
            
            {/* Badge Promotion */}
            {hasPromotion() && (
              <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white border-0 shadow-lg animate-pulse">
                <Tag className="h-3 w-3 mr-1" />
                -{getDiscountPercentage()}%
              </Badge>
            )}
          </div>

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
          
          {/* 🏷️ Badges type & catégorie */}
          <div className="flex flex-wrap gap-1 mb-2">
            {/* Badge Catégorie */}
            {product.category && (
              <Badge variant="outline" className="text-xs">
                <Package className="h-3 w-3 mr-1" />
                {product.category}
              </Badge>
            )}
            
            {/* Badge Type produit */}
            {product.product_type && (
              <Badge 
                variant="outline" 
                className={`text-xs ${
                  product.product_type === 'digital' ? 'bg-blue-500/10 text-blue-700 border-blue-500/20' :
                  product.product_type === 'physical' ? 'bg-green-500/10 text-green-700 border-green-500/20' :
                  'bg-purple-500/10 text-purple-700 border-purple-500/20'
                }`}
              >
                <Zap className="h-3 w-3 mr-1" />
                {product.product_type === 'digital' ? 'Numérique' : 
                 product.product_type === 'physical' ? 'Physique' : 'Service'}
              </Badge>
            )}
            
            {/* Badge Pricing Model */}
            {product.pricing_model && (
              <Badge variant="outline" className="text-xs">
                {product.pricing_model === 'subscription' && (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Abonnement
                  </>
                )}
                {product.pricing_model === 'one-time' && (
                  <>
                    <DollarSign className="h-3 w-3 mr-1" />
                    Achat unique
                  </>
                )}
                {product.pricing_model === 'free' && (
                  <>
                    <Gift className="h-3 w-3 mr-1" />
                    Gratuit
                  </>
                )}
                {product.pricing_model === 'pay-what-you-want' && (
                  <>
                    <DollarSign className="h-3 w-3 mr-1" />
                    Prix libre
                  </>
                )}
              </Badge>
            )}
          </div>
          
          {product.rating > 0 && (
            <div className="product-rating mb-3">{renderStars(product.rating)}</div>
          )}

          {/* 📎 NOUVEAU: Badges informatifs */}
          {(product.downloadable_files && Array.isArray(product.downloadable_files) && product.downloadable_files.length > 0) && (
            <div className="flex flex-wrap gap-1 mb-2">
              <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-700 border-green-500/20">
                <Download className="h-3 w-3 mr-1" />
                {product.downloadable_files.length} fichier{product.downloadable_files.length > 1 ? 's' : ''}
              </Badge>
            </div>
          )}

          {/* ✨ NOUVEAU: Description courte */}
          {product.short_description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
              {product.short_description}
            </p>
          )}
          
          {/* 💰 Prix avec promotion */}
          <div className="flex items-baseline gap-2 mb-4">
            {hasPromotion() && (
              <span className="text-sm text-muted-foreground line-through">
                {product.price.toLocaleString()} {product.currency}
              </span>
            )}
            <span className={`product-price ${hasPromotion() ? 'text-red-600' : ''}`}>
              {hasPromotion() ? product.promotional_price!.toLocaleString() : product.price.toLocaleString()}
            </span>
            {!hasPromotion() && (
              <span className="text-sm text-muted-foreground font-medium">
                {product.currency}
              </span>
            )}
            {hasPromotion() && (
              <span className="text-sm text-red-600 font-medium">
                {product.currency}
              </span>
            )}
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
