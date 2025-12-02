import React, { useState, useEffect } from "react";
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
  Shield,
  MessageSquare
} from "lucide-react";
import { Link } from "react-router-dom";
import { ResponsiveProductImage } from "@/components/ui/ResponsiveProductImage";
import { initiateMonerooPayment } from "@/lib/moneroo-payment";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { safeRedirect } from "@/lib/url-validator";
import { PriceStockAlertButton } from "@/components/marketplace/PriceStockAlertButton";
import "@/styles/product-grid-professional.css";

interface ProductCardProps {
  product: Product;
  storeSlug: string;
}

const ProductCardComponent = ({ product, storeSlug }: ProductCardProps) => {
  const [loading, setLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  // Récupérer l'utilisateur pour les alertes
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    fetchUser();
  }, []);

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
    // SÉCURISÉ : Extraire le texte sans utiliser innerHTML (évite XSS)
    if (!html.includes('<')) {
      // Pas de HTML, retourner directement
      return html;
    }
    
    // Si contient du HTML, utiliser la fonction sécurisée de utils
    // qui utilise htmlToPlainText de html-sanitizer
    try {
      // Utiliser la fonction sécurisée de utils
      const { stripHtmlTags: safeStripHtml } = require('@/lib/utils');
      return safeStripHtml(html);
    } catch (e) {
      // Fallback : utiliser textContent (plus sûr que innerHTML)
      const temp = document.createElement('div');
      temp.textContent = html; // textContent échappe automatiquement
      return temp.textContent || '';
    }
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
    <Card 
      className="product-card-professional group relative overflow-hidden bg-transparent rounded-lg flex flex-col min-h-[500px] md:min-h-[600px] lg:min-h-[700px]"
      role="article"
      aria-labelledby={`product-title-${product.id}`}
      aria-describedby={`product-price-${product.id}`}
      tabIndex={0}
    >
      {/* Image avec overlay et badges - Prend plus d'espace, contenu repoussé en bas */}
      <div className="product-image-container relative overflow-hidden bg-muted/30 flex-grow">
        <ResponsiveProductImage
          src={product.image_url || '/placeholder-image.png'}
          alt={product.name}
          className="w-full h-full product-image"
          priority={true}
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

        {/* Badges Nouveau et Vedette */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
          {isNew() && (
            <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
              <Sparkles className="h-3 w-3 mr-1" />
              Nouveau
            </Badge>
          )}
          
          {(product as any).is_featured && (
            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
              <Crown className="h-3 w-3 mr-1" />
              Vedette
            </Badge>
          )}
        </div>

        {/* Licensing badges - Position après les badges Nouveau/Vedette pour éviter conflit */}
        {(product as any).licensing_type && (
          <div className="absolute top-3 left-3 flex flex-col gap-1 z-10" style={{ marginTop: (isNew() || (product as any).is_featured) ? '48px' : '0px' }}>
            {(product as any).licensing_type === 'plr' && (
              <Badge className="bg-emerald-500 text-white border-0 hover:bg-emerald-600" title="PLR (Private Label Rights) : peut être modifié et revendu selon conditions" aria-label="Licence PLR - Droits de label privé">
                <Shield className="h-3 w-3 mr-1" /> PLR
              </Badge>
            )}
            {(product as any).licensing_type === 'copyrighted' && (
              <Badge className="bg-red-500 text-white border-0 hover:bg-red-600" title="Protégé par droit d'auteur : revente/modification non autorisées" aria-label="Protégé par droit d'auteur">
                <Shield className="h-3 w-3 mr-1" /> Droit d'auteur
              </Badge>
            )}
            {(product as any).licensing_type === 'standard' && (
              <Badge className="bg-blue-500 text-white border-0 hover:bg-blue-600" title="Licence standard : utilisation personnelle uniquement" aria-label="Licence standard">
                <Shield className="h-3 w-3 mr-1" /> Standard
              </Badge>
            )}
          </div>
        )}


        {/* Bouton favori */}
        <button
          onClick={handleFavorite}
          className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none z-10"
          aria-label={isFavorite ? `Retirer ${product.name} des favoris` : `Ajouter ${product.name} aux favoris`}
        >
          <Heart 
            className={`h-5 w-5 ${
              isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'
            }`} 
          />
        </button>
      </div>

      {/* Contenu de la carte - Repoussé en bas pour laisser plus d'espace à l'image */}
      <CardContent className="p-4 sm:p-5 flex-shrink-0 flex flex-col gap-2 sm:gap-3">
        {/* Titre du produit */}
        <Link to={`/stores/${storeSlug}/products/${product.slug}`}>
          <h3 className="font-semibold text-lg text-white mb-3 line-clamp-2 leading-tight">
            {product.name}
          </h3>
        </Link>

        {/* Rating et avis */}
        <div className="flex items-center gap-2 mb-3">
          {product.rating > 0 ? (
            <>
              {renderStars(product.rating)}
              <span className="text-sm font-medium text-gray-700">
                {product.rating.toFixed(1)}
              </span>
              <span className="text-sm text-gray-600">
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

          {/* Badge taux d'affiliation */}
          {(() => {
            // Gérer le cas où Supabase retourne un objet, un tableau, ou null
            let affiliateSettings = null;
            
            if (product.product_affiliate_settings) {
              if (Array.isArray(product.product_affiliate_settings)) {
                // Tableau : prendre le premier élément s'il existe
                affiliateSettings = product.product_affiliate_settings.length > 0 
                  ? product.product_affiliate_settings[0] 
                  : null;
              } else {
                // Objet direct
                affiliateSettings = product.product_affiliate_settings;
              }
            }
            
            // Afficher le badge si l'affiliation est activée et le taux > 0
            if (affiliateSettings?.affiliate_enabled && affiliateSettings?.commission_rate > 0) {
              return (
                <Badge 
                  variant="secondary" 
                  className="text-xs bg-gradient-to-r from-orange-500 to-pink-500 text-white border-0"
                  title={`Taux de commission d'affiliation: ${affiliateSettings.commission_rate}%`}
                >
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {affiliateSettings.commission_rate}% commission
                </Badge>
              );
            }
            
            return null;
          })()}
          
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

        {/* Licensing details (amélioré) */}
        {(product as any).licensing_type && (
          <div className="mb-3 flex items-center gap-2">
            <Shield className={`h-3.5 w-3.5 flex-shrink-0 ${
              (product as any).licensing_type === 'plr' ? 'text-emerald-500' : 
              (product as any).licensing_type === 'copyrighted' ? 'text-red-500' : 
              'text-blue-500'
            }`} />
            <span className={`text-xs font-medium ${
              (product as any).licensing_type === 'plr' ? 'text-emerald-700 dark:text-emerald-400' : 
              (product as any).licensing_type === 'copyrighted' ? 'text-red-700 dark:text-red-400' : 
              'text-blue-700 dark:text-blue-400'
            }`}>
              {(product as any).licensing_type === 'plr' ? 'Licence PLR (droits de label privé)' : (product as any).licensing_type === 'copyrighted' ? 'Protégé par droit d\'auteur' : 'Licence standard'}
            </span>
          </div>
        )}

        {/* Prix et ventes */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col flex-1">
            <div className="flex items-center gap-2 mb-1">
              {hasPromo && (
                <span className="text-sm text-gray-500 line-through">
                  {formatPrice(product.price)} {product.currency || 'XOF'}
                </span>
              )}
              <span className="text-lg font-bold text-blue-600">
                {formatPrice(price)} {product.currency || 'XOF'}
              </span>
              <PriceStockAlertButton
                productId={product.id}
                productName={product.name}
                currentPrice={price}
                currency={product.currency || 'XOF'}
                productType={product.product_type || 'digital'}
                stockQuantity={(product as any).stock_quantity}
                variant="outline"
                size="sm"
                className="flex-shrink-0 h-7"
              />
            </div>
            {(product as any).purchases_count !== undefined && (
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <TrendingUp className="h-4 w-4" />
                <span>{(product as any).purchases_count || 0}</span>
              </div>
            )}
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="product-action-button flex-1 h-10 text-white bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 border-amber-500 transition-all duration-200"
            asChild
          >
            <Link 
              to={`/stores/${storeSlug}/products/${product.slug}`}
              className="flex items-center justify-center gap-1.5"
            >
              <Eye className="h-4 w-4 text-white" />
              <span className="font-medium text-white">Voir</span>
            </Link>
          </Button>
          
          {product.store_id && (
            <Button
              variant="outline"
              size="sm"
              className="product-action-button flex-1 h-10 text-white bg-gradient-to-r from-purple-700 to-purple-900 hover:from-purple-800 hover:to-purple-950 border-purple-700 transition-all duration-200"
              asChild
            >
              <Link 
                to={`/vendor/messaging/${product.store_id}?productId=${product.id}`}
                className="flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="h-4 w-4 text-white" />
                <span className="font-medium hidden sm:inline text-white">Contacter</span>
              </Link>
            </Button>
          )}
          
          <Button
            onClick={handleBuyNow}
            disabled={loading}
            size="sm"
            className="product-action-button flex-1 h-10 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium"
            aria-label={loading ? `Traitement de l'achat de ${product.name} en cours` : `Acheter ${product.name} pour ${formatPrice(price)} ${product.currency || 'XOF'}`}
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

// Optimisation avec React.memo pour éviter les re-renders inutiles
const ProductCard = React.memo(ProductCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.price === nextProps.product.price &&
    (prevProps.product as any).promotional_price === (nextProps.product as any).promotional_price &&
    prevProps.product.image_url === nextProps.product.image_url &&
    prevProps.product.name === nextProps.product.name &&
    prevProps.product.rating === nextProps.product.rating &&
    prevProps.product.reviews_count === nextProps.product.reviews_count &&
    prevProps.storeSlug === nextProps.storeSlug
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
