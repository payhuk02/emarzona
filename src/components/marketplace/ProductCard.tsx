import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Star, Percent, Loader2 } from "lucide-react";
import { initiateMonerooPayment } from "@/lib/moneroo-payment";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ProductBanner } from "@/components/ui/ResponsiveProductImage";

interface ProductCardProps {
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
    purchases_count?: number;
    category?: string;
    store_id?: string;
  };
  storeSlug: string;
}

const ProductCard = ({ product, storeSlug }: ProductCardProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const price = product.promo_price ?? product.price;
  const hasPromo = product.promo_price && product.promo_price < product.price;

  const discountPercent = hasPromo
    ? Math.round(((product.price - product.promo_price!) / product.price) * 100)
    : 0;

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
          }`}
        />
      ))}
    </div>
  );

  const handleBuyNow = async () => {
    if (!product.store_id) {
      toast({
        title: "Erreur",
        description: "Boutique non disponible",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const result = await initiateMonerooPayment({
        storeId: product.store_id,
        productId: product.id,
        amount: price,
        currency: product.currency ?? "XOF",
        description: `Achat de ${product.name}`,
        customerEmail: "client@example.com",
        metadata: { productName: product.name, storeSlug },
      });

      if (result.checkout_url) {
        window.location.href = result.checkout_url;
      }
    } catch (error: any) {
      console.error("Erreur Moneroo:", error);
      toast({
        title: "Erreur de paiement",
        description: error.message || "Impossible d'initialiser le paiement",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="group relative flex flex-col rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 product-card product-card-mobile sm:product-card-tablet lg:product-card-desktop">
      {/* Bannière produit avec ratio 16:9 */}
      <div className="product-card-container">
        <ProductBanner
          src={product.image_url}
          alt={product.name}
          className="w-full product-banner"
          fallbackIcon={<ShoppingCart className="h-16 w-16 opacity-20" />}
          badges={
            hasPromo ? (
              <div className="product-badge">
                <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                  <Percent className="h-3 w-3" /> -{discountPercent}%
                </div>
              </div>
            ) : undefined
          }
        />
      </div>

      <div className="flex-1 flex flex-col p-4 space-y-2 product-card-content-mobile sm:product-card-content-tablet lg:product-card-content-desktop">
        {product.category && (
          <span className="text-xs font-medium text-primary uppercase tracking-wide">
            {product.category}
          </span>
        )}

        <h3 className="text-base font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {product.name}
        </h3>

        {product.rating ? (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            {renderStars(product.rating)}
            <span className="ml-1 text-xs">({product.reviews_count ?? 0})</span>
          </div>
        ) : (
          <div className="h-5" />
        )}

        <div className="flex items-baseline gap-2 mt-1">
          {hasPromo && (
            <span className="text-sm text-muted-foreground line-through">
              {product.price.toLocaleString()} {product.currency ?? "FCFA"}
            </span>
          )}
          <span className="text-lg font-bold text-primary">
            {price.toLocaleString()} {product.currency ?? "FCFA"}
          </span>
        </div>

        <span className="text-xs text-muted-foreground">
          {product.purchases_count
            ? `${product.purchases_count} ventes`
            : "Aucune vente"}
        </span>

        <div className="mt-3 flex gap-2">
          <Link to={`/stores/${storeSlug}/products/${product.slug}`} className="flex-1">
            <Button variant="outline" className="w-full product-button-mobile">
              Voir le produit
            </Button>
          </Link>

          <Button
            onClick={handleBuyNow}
            disabled={loading}
            className="bg-primary text-primary-foreground flex items-center gap-1 product-button-mobile"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Paiement...</span>
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4" />
                <span>Acheter</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
