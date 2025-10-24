import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Star, Heart, Eye, CheckCircle, Clock, TrendingUp, Loader2, BarChart3 } from "lucide-react";
import { initiateMonerooPayment } from "@/lib/moneroo-payment";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ProductBanner } from "@/components/ui/ResponsiveProductImage";
import { ProductImage } from "@/components/ui/OptimizedImage";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { useMarketplaceFavorites } from "@/hooks/useMarketplaceFavorites";

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
  onAddToComparison?: () => void;
  isInComparison?: boolean;
}

const ProductCardProfessional = ({ 
  product, 
  storeSlug,
  onAddToComparison,
  isInComparison = false
}: ProductCardProfessionalProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  // Hook centralisé pour favoris synchronisés
  const { favorites, toggleFavorite } = useMarketplaceFavorites();
  const isFavorite = favorites.has(product.id);

  const price = product.promotional_price ?? product.price;
  const hasPromo = product.promotional_price && product.promotional_price < product.price;
  const discountPercent = hasPromo
    ? Math.round(((product.price - product.promotional_price!) / product.price) * 100)
    : 0;

  // Fonction pour nettoyer les balises HTML
  const stripHtmlTags = (html: string): string => {
    // Créer un élément temporaire pour parser le HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;
    // Extraire le texte sans balises
    return temp.textContent || temp.innerText || '';
  };

  // Générer une description courte si manquante (fallback frontend)
  const getShortDescription = (): string | undefined => {
    let rawText = '';
    
    if (product.short_description && product.short_description.trim()) {
      rawText = product.short_description;
    } else if (product.description && product.description.trim()) {
      rawText = product.description;
    } else {
      return undefined; // Pas de description du tout
    }
    
    // Nettoyer les balises HTML
    const cleanText = stripHtmlTags(rawText).trim();
    
    // Tronquer si trop long
    if (cleanText.length > 120) {
      return cleanText.substring(0, 117) + '...';
    }
    
    return cleanText;
  };
  
  const shortDescription = getShortDescription();

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5" role="img" aria-label={`Note: ${rating.toFixed(1)} sur 5 étoiles`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          }`}
          aria-hidden="true"
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
      
      // Récupérer l'utilisateur authentifié
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
        },
      });

      if (result.checkout_url) {
        window.location.href = result.checkout_url;
      }
    } catch (error: any) {
      logger.error("Erreur lors de l'achat:", error);
      toast({
        title: "Erreur de paiement",
        description: error.message || "Impossible d'initialiser le paiement",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleFavorite(product.id);
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
    <Card className="group relative overflow-hidden bg-white border border-gray-200 hover:border-gray-300 transition-all duration-300 hover:-translate-y-1" role="article" aria-label={`Produit: ${product.name}`}>
      {/* Image avec overlay et badges - OPTIMISÉE */}
      <div className="relative">
        <ProductImage
          src={product.image_url}
          alt={product.name}
          className="w-full h-48 object-cover"
          showSkeleton={true}
          priority={false}
          containerClassName="w-full h-48"
        />
        
        {/* Overlay avec badge promotionnel seulement */}
        {hasPromo && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" aria-hidden="true">
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-yellow-500 text-white font-bold text-sm px-3 py-1 rounded-full inline-block" role="status" aria-label={`Promotion de ${discountPercent}%`}>
                -{discountPercent}% OFF
              </div>
            </div>
          </div>
        )}

        {/* Bouton favori */}
        <button
          onClick={handleFavorite}
          className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
          aria-label={isFavorite ? `Retirer ${product.name} des favoris` : `Ajouter ${product.name} aux favoris`}
          aria-pressed={isFavorite}
        >
          <Heart 
            className={`h-5 w-5 ${
              isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'
            }`} 
            aria-hidden="true"
          />
        </button>

        {/* Bouton comparer */}
        {onAddToComparison && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAddToComparison();
            }}
            disabled={isInComparison}
            className={`absolute top-3 right-14 p-2 backdrop-blur-sm rounded-full transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none ${
              isInComparison 
                ? 'bg-blue-500/90 cursor-not-allowed' 
                : 'bg-white/90 hover:bg-white'
            }`}
            aria-label={isInComparison ? `${product.name} déjà dans la comparaison` : `Ajouter ${product.name} à la comparaison`}
            aria-pressed={isInComparison}
          >
            <BarChart3 
              className={`h-5 w-5 ${
                isInComparison ? 'text-white' : 'text-gray-600'
              }`} 
              aria-hidden="true"
            />
          </button>
        )}

        {/* Badge de catégorie */}
        {product.category && (
          <div className="absolute top-3 left-3">
            <Badge className={`${getCategoryColor(product.category)} border-0`} aria-label={`Catégorie: ${product.category}`}>
              {product.category}
            </Badge>
          </div>
        )}
      </div>

      {/* Contenu de la carte */}
      <CardContent className="p-4">
        {/* Informations du vendeur */}
        <div className="flex items-center gap-2 mb-3" role="group" aria-label="Informations du vendeur">
          {product.stores?.logo_url ? (
            <img 
              src={product.stores.logo_url} 
              alt={`Logo de ${product.stores.name}`}
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center" aria-hidden="true">
              <span className="text-xs font-semibold text-gray-600">
                {product.stores?.name?.charAt(0) || 'S'}
              </span>
            </div>
          )}
          <span className="text-sm font-medium text-gray-700">
            {product.stores?.name || 'Vendeur'}
          </span>
          <CheckCircle className="h-4 w-4 text-green-500" aria-label="Vendeur vérifié" />
        </div>

        {/* Titre du produit */}
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 leading-tight" id={`product-title-${product.id}`}>
          {product.name}
        </h3>

        {/* Description courte */}
        {shortDescription && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {shortDescription}
          </p>
        )}

        {/* Rating et avis */}
        <div className="flex items-center gap-2 mb-3" role="group" aria-label="Évaluation du produit">
          {product.rating ? (
            <>
              {renderStars(product.rating)}
              <span className="text-sm font-medium text-gray-700" aria-hidden="true">
                {product.rating.toFixed(1)}
              </span>
              <span className="text-sm text-gray-500" aria-label={`${product.reviews_count || 0} avis client${(product.reviews_count || 0) !== 1 ? 's' : ''}`}>
                ({product.reviews_count || 0})
              </span>
            </>
          ) : (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="h-4 w-4" aria-hidden="true" />
              <span className="text-sm">Vérifié</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3" role="list" aria-label="Tags du produit">
            {product.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs" role="listitem">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Prix et actions */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col" role="group" aria-label="Prix du produit">
            {hasPromo && (
              <span className="text-sm text-gray-500 line-through" aria-label={`Prix original: ${formatPrice(product.price)} ${product.currency || 'FCFA'}`}>
                {formatPrice(product.price)} {product.currency || 'FCFA'}
              </span>
            )}
            <span className="text-lg font-bold text-gray-900">
              {formatPrice(price)} {product.currency || 'FCFA'}
            </span>
          </div>
          
          <div className="flex items-center gap-1 text-sm text-gray-500" aria-label={`${product.purchases_count || 0} vente${(product.purchases_count || 0) !== 1 ? 's' : ''}`}>
            <TrendingUp className="h-4 w-4" aria-hidden="true" />
            <span aria-hidden="true">{product.purchases_count || 0}</span>
          </div>
        </div>

        {/* Boutons d'action - OPTIMISÉS */}
        <div className="flex gap-2 mt-4" role="group" aria-label="Actions du produit">
          <Button
            variant="outline"
            size="default"
            className="flex-1 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            asChild
          >
            <Link 
              to={`/stores/${storeSlug}/products/${product.slug}`}
              aria-label={`Voir les détails de ${product.name}`}
              className="flex items-center justify-center"
            >
              <Eye className="h-4 w-4 mr-2 flex-shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">Voir le produit</span>
              <span className="sm:hidden">Détails</span>
            </Link>
          </Button>
          
          <Button
            onClick={handleBuyNow}
            disabled={loading}
            size="default"
            className="flex-1 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 shadow-sm hover:shadow-md"
            aria-label={loading ? `Traitement de l'achat de ${product.name} en cours` : `Acheter ${product.name} pour ${formatPrice(price)} ${product.currency || 'FCFA'}`}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2 flex-shrink-0" aria-hidden="true" />
                <span className="hidden sm:inline">Paiement...</span>
                <span className="sm:hidden">...</span>
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4 mr-2 flex-shrink-0" aria-hidden="true" />
                <span>Acheter</span>
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCardProfessional;
