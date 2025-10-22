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
    <article 
      className="group relative flex flex-col rounded-2xl border border-border bg-card overflow-hidden transition-all duration-300 hover:-translate-y-1 product-card product-card-mobile sm:product-card-tablet lg:product-card-desktop"
      role="article"
      aria-labelledby={`product-title-${product.id}`}
      aria-describedby={`product-description-${product.id}`}
    >
      {/* Bannière produit avec ratio 16:9 */}
      <div className="product-card-container">
        <ProductBanner
          src={product.image_url}
          alt={`Image du produit ${product.name}`}
          className="w-full product-banner"
          fallbackIcon={<ShoppingCart className="h-16 w-16 opacity-20" />}
          badges={
            hasPromo ? (
              <div className="product-badge" role="img" aria-label={`Réduction de ${discountPercent}%`}>
                <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                  <Percent className="h-3 w-3" /> -{discountPercent}%
                </div>
              </div>
            ) : undefined
          }
        />
      </div>

      <div className="product-card-content">
        <div className="flex-1">
          {product.category && (
            <span className="text-xs font-medium text-primary uppercase tracking-wide mb-2 block" aria-label={`Catégorie: ${product.category}`}>
              {product.category}
            </span>
          )}

          <h3 
            id={`product-title-${product.id}`}
            className="product-title group-hover:text-primary transition-colors mb-2"
          >
            {product.name}
          </h3>

          {product.rating ? (
            <div className="product-rating mb-3" role="img" aria-label={`Note: ${product.rating} sur 5 étoiles`}>
              {renderStars(product.rating)}
              <span className="ml-1 text-xs" aria-label={`${product.reviews_count ?? 0} avis`}>({product.reviews_count ?? 0})</span>
            </div>
          ) : (
            <div className="h-5 mb-3" />
          )}

          <div className="flex items-baseline gap-2 mb-4" aria-label="Prix du produit">
            {hasPromo && (
              <span className="text-sm text-muted-foreground line-through" aria-label="Prix original">
                {product.price.toLocaleString()} {product.currency ?? "FCFA"}
              </span>
            )}
            <span className="product-price" aria-label="Prix actuel">
              {price.toLocaleString()} {product.currency ?? "FCFA"}
            </span>
          </div>

          <span className="text-xs text-muted-foreground mb-4 block" aria-label="Nombre de ventes">
            {product.purchases_count
              ? `${product.purchases_count} ventes`
              : "Aucune vente"}
          </span>
        </div>

        <div className="product-actions" role="group" aria-label="Actions du produit">
          <Link to={`/stores/${storeSlug}/products/${product.slug}`} className="flex-1">
            <Button 
              variant="outline" 
              className="product-button product-button-secondary"
              aria-label={`Voir les détails du produit ${product.name}`}
            >
              Voir le produit
            </Button>
          </Link>

          <Button
            onClick={handleBuyNow}
            disabled={loading}
            className="product-button product-button-primary"
            aria-label={`Acheter le produit ${product.name} pour ${price.toLocaleString()} ${product.currency ?? "FCFA"}`}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Paiement...</span>
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                <span>Acheter</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
