import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Star, Heart, Eye, CheckCircle, Clock, TrendingUp, Loader2 } from "lucide-react";
import { initiateMonerooPayment } from "@/lib/moneroo-payment";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ProductBanner } from "@/components/ui/ResponsiveProductImage";

interface ProductCardProfessionalProps {
  product: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    short_description?: string;
    image_url?: string;
    price: number;
    promotional_price?: number;
    currency?: string;
    rating?: number;
    reviews_count?: number;
    purchases_count?: number;
    category?: string;
    product_type?: string;
    store_id?: string;
    stores?: {
      id: string;
      name: string;
      slug: string;
      logo_url?: string;
    };
    tags?: string[];
    created_at?: string;
  };
  storeSlug: string;
}

const ProductCardProfessional = ({ product, storeSlug }: ProductCardProfessionalProps) => {
  const [loading, setLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const { toast } = useToast();

  const price = product.promotional_price ?? product.price;
  const hasPromo = product.promotional_price && product.promotional_price < product.price;
  const discountPercent = hasPromo
    ? Math.round(((product.price - product.promotional_price!) / product.price) * 100)
    : 0;

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
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

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('fr-FR');
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'SEO': 'bg-blue-100 text-blue-800',
      'Marketing': 'bg-green-100 text-green-800',
      'Design': 'bg-purple-100 text-purple-800',
      'Développement': 'bg-orange-100 text-orange-800',
      'Rédaction': 'bg-pink-100 text-pink-800',
      'Traduction': 'bg-indigo-100 text-indigo-800',
      'Audio': 'bg-yellow-100 text-yellow-800',
      'Vidéo': 'bg-red-100 text-red-800',
      'Business': 'bg-gray-100 text-gray-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="group relative overflow-hidden bg-white border border-gray-200 hover:border-gray-300 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      {/* Image avec overlay et badges */}
      <div className="relative">
        <ProductBanner
          src={product.image_url}
          alt={product.name}
          className="w-full h-48 object-cover"
          fallbackIcon={<ShoppingCart className="h-16 w-16 opacity-20" />}
        />
        
        {/* Overlay avec texte promotionnel */}
        {hasPromo && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent">
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-yellow-500 text-white font-bold text-sm px-3 py-1 rounded-full inline-block mb-2">
                -{discountPercent}% OFF
              </div>
              <h3 className="text-white font-bold text-lg leading-tight">
                {product.name.toUpperCase()}
              </h3>
            </div>
          </div>
        )}

        {/* Bouton favori */}
        <button
          onClick={handleFavorite}
          className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
        >
          <Heart 
            className={`h-5 w-5 ${
              isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'
            }`} 
          />
        </button>

        {/* Badge de catégorie */}
        {product.category && (
          <div className="absolute top-3 left-3">
            <Badge className={`${getCategoryColor(product.category)} border-0`}>
              {product.category}
            </Badge>
          </div>
        )}

        {/* Bouton d'action rapide */}
        <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
          <Button
            variant="outline"
            size="sm"
            className="w-full bg-white/90 backdrop-blur-sm border-gray-300 text-gray-800 hover:bg-white shadow-lg"
            asChild
          >
            <Link to={`/stores/${storeSlug}/products/${product.slug}`}>
              <Eye className="h-4 w-4 mr-2" />
              Voir rapidement
            </Link>
          </Button>
        </div>
      </div>

      {/* Contenu de la carte */}
      <CardContent className="p-4">
        {/* Informations du vendeur */}
        <div className="flex items-center gap-2 mb-3">
          {product.stores?.logo_url ? (
            <img 
              src={product.stores.logo_url} 
              alt={product.stores.name}
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-xs font-semibold text-gray-600">
                {product.stores?.name?.charAt(0) || 'S'}
              </span>
            </div>
          )}
          <span className="text-sm font-medium text-gray-700">
            {product.stores?.name || 'Vendeur'}
          </span>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </div>

        {/* Titre du produit */}
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 leading-tight">
          {product.name}
        </h3>

        {/* Description courte */}
        {product.short_description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {product.short_description}
          </p>
        )}

        {/* Rating et avis */}
        <div className="flex items-center gap-2 mb-3">
          {product.rating ? (
            <>
              {renderStars(product.rating)}
              <span className="text-sm font-medium text-gray-700">
                {product.rating.toFixed(1)}
              </span>
              <span className="text-sm text-gray-500">
                ({product.reviews_count || 0})
              </span>
            </>
          ) : (
            <div className="flex items-center gap-1 text-gray-400">
              <Star className="h-4 w-4" />
              <span className="text-sm">Nouveau</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {product.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Prix et actions */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            {hasPromo && (
              <span className="text-sm text-gray-500 line-through">
                {formatPrice(product.price)} {product.currency || 'FCFA'}
              </span>
            )}
            <span className="text-lg font-bold text-gray-900">
              À partir de {formatPrice(price)} {product.currency || 'FCFA'}
            </span>
          </div>
          
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <TrendingUp className="h-4 w-4" />
            <span>{product.purchases_count || 0}</span>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            className="flex-1"
            asChild
          >
            <Link to={`/stores/${storeSlug}/products/${product.slug}`}>
              Voir le produit
            </Link>
          </Button>
          
          <Button
            onClick={handleBuyNow}
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Paiement...
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Acheter
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCardProfessional;
