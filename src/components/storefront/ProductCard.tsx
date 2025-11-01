import { useState } from "react";
import { Product } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingCart, 
  Star, 
  Download, 
  Crown, 
  Sparkles, 
  Package, 
  Zap,
  RefreshCw,
  DollarSign,
  Gift,
  Heart,
  Eye,
  TrendingUp,
  CheckCircle,
  Loader2,
  Shield
} from "lucide-react";
import { Link } from "react-router-dom";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { initiateMonerooPayment } from "@/lib/moneroo-payment";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { safeRedirect } from "@/lib/url-validator";
import "@/styles/product-grid-professional.css";

interface ProductCardProps {
  product: Product;
  storeSlug: string;
}

const ProductCard = ({ product, storeSlug }: ProductCardProps) => {
  const [loading, setLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const { toast } = useToast();

  const price = (product as any).promotional_price ?? product.price;
  const hasPromo = (product as any).promotional_price && (product as any).promotional_price < product.price;
  const discountPercent = hasPromo
    ? Math.round(((product.price - (product as any).promotional_price!) / product.price) * 100)
    : 0;

  // Vérifier si le produit est nouveau (< 7 jours)
  const isNew = () => {
    if (!product.created_at) return false;
    const createdDate = new Date(product.created_at);
    const now = new Date();
    const daysDiff = (now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24);
    return daysDiff < 7;
  };

  // Formater le prix
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount);
  };

  // Nettoyer les balises HTML de la description
  const stripHtmlTags = (html: string): string => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  };

  // Générer une description courte
  const getShortDescription = (): string | undefined => {
    let rawText = '';
    
    if ((product as any).short_description && (product as any).short_description.trim()) {
      rawText = (product as any).short_description;
    } else if (product.description && product.description.trim()) {
      rawText = product.description;
    } else {
      return undefined;
    }
    
    const cleanText = stripHtmlTags(rawText).trim();
    
    if (cleanText.length > 120) {
      return cleanText.substring(0, 117) + '...';
    }
    
    return cleanText;
  };
  
  const shortDescription = getShortDescription();

  // Gérer les favoris
  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    toast({
      title: isFavorite ? "Retiré des favoris" : "Ajouté aux favoris",
      description: isFavorite ? `${product.name} a été retiré de vos favoris` : `${product.name} a été ajouté à vos favoris`,
    });
  };

  // Gérer l'achat
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
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        toast({
          title: "Authentification requise",
          description: "Veuillez vous connecter pour effectuer un achat",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const result = await initiateMonerooPayment({
        storeId: product.store_id,
        productId: product.id,
        amount: price,
        currency: product.currency ?? "XOF",
        description: `Achat de ${product.name}`,
        customerEmail: user.email,
        customerName: user.user_metadata?.full_name || user.email.split('@')[0],
        metadata: { 
          productName: product.name, 
          storeSlug,
          userId: user.id
        }
      });

      if (result.success && result.checkout_url) {
        safeRedirect(result.checkout_url, () => {
          toast({
            title: "Erreur",
            description: "URL de paiement invalide. Veuillez réessayer.",
            variant: "destructive",
          });
        });
      } else {
        throw new Error("Échec de l'initialisation du paiement");
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'initier le paiement",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

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

  return (
    <Card className="product-card-professional group relative overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 rounded-lg">
      {/* Image avec overlay et badges */}
      <div className="product-image-container relative overflow-hidden">
        <OptimizedImage
          src={product.image_url || '/placeholder-image.png'}
          alt={product.name}
          width={1280}
          height={720}
          className="product-image w-full h-80 md:h-96 object-cover rounded-t-lg"
          priority={false}
        />
        <div className="product-image-overlay" aria-hidden="true"></div>
        
        {/* Overlay avec badge promotionnel */}
        {hasPromo && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent">
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-yellow-500 text-white font-bold text-sm px-3 py-1 rounded-full inline-block">
                -{discountPercent}% OFF
              </div>
            </div>
          </div>
        )}

        {/* Licensing badges */}
        {(product as any).licensing_type && (
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            {(product as any).licensing_type === 'plr' && (
              <Badge className="bg-emerald-100 text-emerald-800 border-0" title="PLR (Private Label Rights) : peut être modifié et revendu selon conditions">
                <Shield className="h-3 w-3 mr-1" /> PLR
              </Badge>
            )}
            {(product as any).licensing_type === 'copyrighted' && (
              <Badge className="bg-red-100 text-red-800 border-0" title="Protégé par droit d'auteur : revente/modification non autorisées">
                <Shield className="h-3 w-3 mr-1" /> Droit d'auteur
              </Badge>
            )}
          </div>
        )}

        {/* Bouton favori */}
        <button
          onClick={handleFavorite}
          className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
          aria-label={isFavorite ? `Retirer ${product.name} des favoris` : `Ajouter ${product.name} aux favoris`}
        >
          <Heart 
            className={`h-5 w-5 ${
              isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'
            }`} 
          />
        </button>

        {/* Badges Nouveau et Vedette */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {isNew() && (
            <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 shadow-lg">
              <Sparkles className="h-3 w-3 mr-1" />
              Nouveau
            </Badge>
          )}
          
          {(product as any).is_featured && (
            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-lg">
              <Crown className="h-3 w-3 mr-1" />
              Vedette
            </Badge>
          )}
        </div>
      </div>

      {/* Contenu de la carte */}
      <CardContent className="p-5">
        {/* Titre du produit */}
        <Link to={`/stores/${storeSlug}/products/${product.slug}`}>
          <h3 className="font-semibold text-lg text-gray-900 mb-3 line-clamp-2 leading-tight hover:text-blue-600 transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Description courte */}
        {shortDescription && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {shortDescription}
          </p>
        )}

        {/* Rating et avis */}
        <div className="flex items-center gap-2 mb-3">
          {product.rating > 0 ? (
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
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Vérifié</span>
            </div>
          )}
        </div>

        {/* Badges type, catégorie et pricing model */}
        <div className="flex flex-wrap gap-1 mb-3">
          {product.category && (
            <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-800 border-0">
              <Package className="h-3 w-3 mr-1" />
              {product.category}
            </Badge>
          )}
          
          {product.product_type && (
            <Badge 
              variant="secondary"
              className={`text-xs border-0 ${
                product.product_type === 'digital' ? 'bg-blue-100 text-blue-800' :
                product.product_type === 'physical' ? 'bg-green-100 text-green-800' :
                'bg-purple-100 text-purple-800'
              }`}
            >
              <Zap className="h-3 w-3 mr-1" />
              {product.product_type === 'digital' ? 'Numérique' : 
               product.product_type === 'physical' ? 'Physique' : 'Service'}
            </Badge>
          )}
          
          {(product as any).pricing_model && (
            <Badge variant="secondary" className="text-xs bg-indigo-100 text-indigo-800 border-0">
              {(product as any).pricing_model === 'subscription' && (
                <>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Abonnement
                </>
              )}
              {(product as any).pricing_model === 'one-time' && (
                <>
                  <DollarSign className="h-3 w-3 mr-1" />
                  Achat unique
                </>
              )}
              {(product as any).pricing_model === 'free' && (
                <>
                  <Gift className="h-3 w-3 mr-1" />
                  Gratuit
                </>
              )}
              {(product as any).pricing_model === 'pay-what-you-want' && (
                <>
                  <DollarSign className="h-3 w-3 mr-1" />
                  Prix libre
                </>
              )}
            </Badge>
          )}
        </div>

        {/* Badge fichiers téléchargeables */}
        {(product as any).downloadable_files && Array.isArray((product as any).downloadable_files) && (product as any).downloadable_files.length > 0 && (
          <div className="mb-3">
            <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-700 border-green-500/20">
              <Download className="h-3 w-3 mr-1" />
              {(product as any).downloadable_files.length} fichier{(product as any).downloadable_files.length > 1 ? 's' : ''}
            </Badge>
          </div>
        )}

        {/* Licensing short note */}
        {(product as any).licensing_type && (
          <div className="mb-3">
            <span className="text-xs text-gray-600">
              {(product as any).licensing_type === 'plr' ? 'Licence PLR (droits de label privé)' : (product as any).licensing_type === 'copyrighted' ? 'Protégé par droit d\'auteur' : 'Licence standard'}
            </span>
          </div>
        )}

        {/* Prix et ventes */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col">
            {hasPromo && (
              <span className="text-sm text-gray-500 line-through">
                {formatPrice(product.price)} {product.currency || 'XOF'}
              </span>
            )}
            <span className="text-lg font-bold text-gray-900">
              {formatPrice(price)} {product.currency || 'XOF'}
            </span>
          </div>
          
          {(product as any).purchases_count !== undefined && (
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <TrendingUp className="h-4 w-4" />
              <span>{(product as any).purchases_count || 0}</span>
            </div>
          )}
        </div>

        {/* Boutons d'action */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="product-action-button flex-1 h-10 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
            asChild
          >
            <Link 
              to={`/stores/${storeSlug}/products/${product.slug}`}
              className="flex items-center justify-center gap-1.5"
            >
              <Eye className="h-4 w-4" />
              <span className="font-medium">Voir</span>
            </Link>
          </Button>
          
          <Button
            onClick={handleBuyNow}
            disabled={loading}
            size="sm"
            className="product-action-button flex-1 h-10 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium shadow-sm hover:shadow-md"
          >
            <div className="flex items-center justify-center gap-1.5">
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
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
