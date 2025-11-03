import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Star, Heart, Eye, CheckCircle, Clock, TrendingUp, Loader2, BarChart3, Download, Shield, ShoppingBag } from "lucide-react";
import { initiateMonerooPayment } from "@/lib/moneroo-payment";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { safeRedirect } from "@/lib/url-validator";
import { ProductBanner } from "@/components/ui/ResponsiveProductImage";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { useMarketplaceFavorites } from "@/hooks/useMarketplaceFavorites";
import { useCart } from "@/hooks/cart/useCart";
import "@/styles/product-grid-professional.css";

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
    licensing_type?: string;
    license_terms?: string;
    downloadable_files?: string[];
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
  const { addItem } = useCart();
  
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
        safeRedirect(result.checkout_url, () => {
          toast({
            title: "Erreur de paiement",
            description: "URL de paiement invalide. Veuillez réessayer.",
            variant: "destructive",
          });
        });
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

  const handleAddToCart = async () => {
    if (!product.store_id) {
      toast({
        title: "Erreur",
        description: "Boutique non disponible",
        variant: "destructive",
      });
      return;
    }

    try {
      await addItem({
        product_id: product.id,
        product_type: (product.product_type || 'digital') as any,
        quantity: 1,
      });
    } catch (error: any) {
      logger.error("Erreur lors de l'ajout au panier:", error);
      // Error already handled in hook
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
    <Card className="product-card-professional group relative overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 hover:-translate-y-2 rounded-lg" role="article" aria-label={`Produit: ${product.name}`}>
      {/* Image avec overlay et badges - OPTIMISÉE ET EXTRA AGRANDIE */}
      <div className="product-image-container relative overflow-hidden">
        <OptimizedImage
          src={product.image_url || '/placeholder-image.png'}
          alt={product.name}
          width={1280}
          height={720}
          className="product-image w-full h-[36rem] md:h-[48rem] lg:h-[56rem] object-cover rounded-t-lg"
          priority={false}
        />
        <div className="product-image-overlay" aria-hidden="true"></div>
        
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

        {/* Badge Licensing (PLR / Copyrighted) - Amélioré pour meilleure visibilité */}
        {product && (product as any).licensing_type && (
          <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
            {(product as any).licensing_type === 'plr' && (
              <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0 shadow-lg hover:shadow-xl transition-all hover:scale-105" aria-label="Licence: PLR - Private Label Rights" title="PLR (Private Label Rights) : peut être modifié et revendu selon conditions">
                <Shield className="h-3.5 w-3.5 mr-1.5" /> PLR
              </Badge>
            )}
            {(product as any).licensing_type === 'copyrighted' && (
              <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0 shadow-lg hover:shadow-xl transition-all hover:scale-105" aria-label="Produit protégé par droit d'auteur" title="Protégé par droit d'auteur : revente/modification non autorisées">
                <Shield className="h-3.5 w-3.5 mr-1.5" /> Droit d'auteur
              </Badge>
            )}
            {(product as any).licensing_type === 'standard' && (
              <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-all hover:scale-105" aria-label="Licence standard" title="Licence standard : utilisation personnelle uniquement">
                <Shield className="h-3.5 w-3.5 mr-1.5" /> Standard
              </Badge>
            )}
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

      {/* Contenu de la carte - PADDING EXTRA AUGMENTÉ */}
      <CardContent className="p-6">
        {/* Informations du vendeur */}
        <div className="flex items-center gap-2 mb-4" role="group" aria-label="Informations du vendeur">
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
        <h3 className="font-semibold text-lg text-gray-900 mb-3 line-clamp-2 leading-tight" id={`product-title-${product.id}`}>
          {product.name}
        </h3>

        {/* Description courte */}
        {shortDescription && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {shortDescription}
          </p>
        )}

        {/* Rating et avis */}
        <div className="flex items-center gap-2 mb-4" role="group" aria-label="Évaluation du produit">
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
        
        {/* Licensing details (short) - Amélioré */}
        {(product as any).licensing_type && (
          <div className="mb-3 flex items-center gap-2">
            <Shield className={`h-3.5 w-3.5 flex-shrink-0 ${
              (product as any).licensing_type === 'plr' ? 'text-emerald-500' : 
              (product as any).licensing_type === 'copyrighted' ? 'text-red-500' : 
              'text-blue-500'
            }`} />
            <span className={`text-xs font-medium ${
              (product as any).licensing_type === 'plr' ? 'text-emerald-700' : 
              (product as any).licensing_type === 'copyrighted' ? 'text-red-700' : 
              'text-blue-700'
            }`}>
              {(product as any).licensing_type === 'plr' ? 'Licence PLR (droits de label privé)' : (product as any).licensing_type === 'copyrighted' ? 'Protégé par droit d\'auteur' : 'Licence standard'}
            </span>
          </div>
        )}

        {/* 📎 NOUVEAU: Badge fichiers téléchargeables */}
        {product.downloadable_files && Array.isArray(product.downloadable_files) && product.downloadable_files.length > 0 && (
          <div className="mb-3">
            <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-700 border-green-500/20">
              <Download className="h-3 w-3 mr-1" />
              {product.downloadable_files.length} fichier{product.downloadable_files.length > 1 ? 's' : ''}
            </Badge>
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

        {/* Boutons d'action - OPTIMISÉS SANS DÉBORDEMENT */}
        <div className="flex flex-col gap-2 mt-5" role="group" aria-label="Actions du produit">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="product-action-button flex-1 h-10 px-3 text-sm border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              asChild
            >
              <Link 
                to={`/stores/${storeSlug}/products/${product.slug}`}
                aria-label={`Voir les détails de ${product.name}`}
                className="flex items-center justify-center gap-1.5 truncate"
              >
                <Eye className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                <span className="hidden lg:inline truncate">Voir</span>
                <span className="lg:hidden truncate">Voir</span>
              </Link>
            </Button>
            
            <Button
              onClick={handleAddToCart}
              disabled={loading}
              size="sm"
              variant="outline"
              className="product-action-button h-10 px-3 text-sm border-purple-300 dark:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-400 dark:hover:border-purple-500 transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50"
              aria-label={`Ajouter ${product.name} au panier`}
            >
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
          
          <Button
            onClick={handleBuyNow}
            disabled={loading}
            size="sm"
            className="product-action-button w-full h-10 px-3 text-sm bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 active:from-blue-800 active:to-purple-800 text-white font-medium transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            aria-label={loading ? `Traitement de l'achat de ${product.name} en cours` : `Acheter ${product.name} pour ${formatPrice(price)} ${product.currency || 'FCFA'}`}
          >
            <div className="flex items-center justify-center gap-1.5 truncate w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" aria-hidden="true" />
                  <span className="truncate">Paiement...</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                  <span className="truncate">Acheter maintenant</span>
                </>
              )}
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCardProfessional;
