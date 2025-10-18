import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  BarChart3, 
  Star, 
  ShoppingCart, 
  Heart, 
  Share2, 
  Eye,
  CheckCircle2,
  Crown,
  TrendingUp,
  DollarSign,
  Package,
  Users,
  Calendar,
  Award,
  Zap,
  Target,
  Flame,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  store_id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description?: string | null;
  price: number;
  promotional_price?: number | null;
  currency: string;
  image_url: string | null;
  images?: string[];
  category: string | null;
  product_type: string | null;
  rating: number;
  reviews_count: number;
  sales_count?: number;
  is_active: boolean;
  is_featured?: boolean;
  created_at: string;
  updated_at: string;
  tags?: string[];
  specifications?: Record<string, any>;
  stores?: {
    name: string;
    slug: string;
    logo_url: string | null;
    verified: boolean;
    rating: number;
    total_products: number;
    joined_at: string;
  } | null;
}

interface ProductComparisonProps {
  products: Product[];
  onRemoveProduct: (productId: string) => void;
  onClearAll: () => void;
  onClose: () => void;
}

const ProductComparison = ({
  products,
  onRemoveProduct,
  onClearAll,
  onClose
}: ProductComparisonProps) => {
  const { toast } = useToast();
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClose = () => {
    setIsAnimating(true);
    setTimeout(() => {
      onClose();
      setIsAnimating(false);
    }, 300);
  };

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-slate-400"
          }`}
        />
      ))}
      <span className="text-sm text-slate-400 ml-1">({rating})</span>
    </div>
  );

  const formatPrice = (price: number, currency: string) => {
    return `${price.toLocaleString()} ${currency}`;
  };

  const getDiscountPercent = (product: Product) => {
    if (!product.promotional_price || product.promotional_price >= product.price) return 0;
    return Math.round(((product.price - product.promotional_price) / product.price) * 100);
  };

  const comparisonData = [
    { label: "Nom", key: "name", type: "text" },
    { label: "Catégorie", key: "category", type: "text" },
    { label: "Type", key: "product_type", type: "text" },
    { label: "Prix", key: "price", type: "price" },
    { label: "Prix promo", key: "promotional_price", type: "price" },
    { label: "Note", key: "rating", type: "rating" },
    { label: "Avis", key: "reviews_count", type: "number" },
    { label: "Ventes", key: "sales_count", type: "number" },
    { label: "Boutique", key: "stores.name", type: "text" },
    { label: "Vérifiée", key: "stores.verified", type: "boolean" },
    { label: "En vedette", key: "is_featured", type: "boolean" },
    { label: "Créé le", key: "created_at", type: "date" }
  ];

  if (products.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <Card className={cn(
        "relative w-full max-w-7xl max-h-[90vh] overflow-hidden bg-slate-800 border-slate-600 shadow-2xl",
        isAnimating ? "animate-out zoom-out-95 duration-300" : "animate-in zoom-in-95 duration-300"
      )}>
        <CardHeader className="border-b border-slate-600 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-400" />
              Comparaison de produits ({products.length}/4)
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onClearAll}
                className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
              >
                Effacer tout
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <div className="min-w-full">
            {/* En-tête avec images des produits */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6 border-b border-slate-600">
              {products.map((product, index) => (
                <div key={product.id} className="relative">
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-slate-700 mb-3">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-12 w-12 text-slate-400" />
                      </div>
                    )}
                    
                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {getDiscountPercent(product) > 0 && (
                        <Badge className="bg-red-600 text-white text-xs">
                          -{getDiscountPercent(product)}%
                        </Badge>
                      )}
                      {product.is_featured && (
                        <Badge className="bg-yellow-600 text-white text-xs">
                          <Crown className="h-3 w-3 mr-1" />
                          Vedette
                        </Badge>
                      )}
                    </div>

                    {/* Bouton de suppression */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRemoveProduct(product.id)}
                      className="absolute top-2 right-2 bg-slate-800/90 backdrop-blur-sm border-slate-600 text-white hover:bg-slate-700 h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <h3 className="font-semibold text-white text-sm line-clamp-2 mb-2">
                    {product.name}
                  </h3>
                  
                  <div className="flex items-center gap-2 mb-2">
                    {renderStars(product.rating)}
                  </div>
                  
                  <div className="text-sm text-slate-400 mb-2">
                    Par {product.stores?.name}
                    {product.stores?.verified && (
                      <CheckCircle2 className="h-3 w-3 inline ml-1 text-green-400" />
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-white">
                      {product.promotional_price ? (
                        <div>
                          <div className="text-xs text-slate-400 line-through">
                            {formatPrice(product.price, product.currency)}
                          </div>
                          <div className="text-green-400">
                            {formatPrice(product.promotional_price, product.currency)}
                          </div>
                        </div>
                      ) : (
                        formatPrice(product.price, product.currency)
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tableau de comparaison */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <tbody>
                  {comparisonData.map((item, rowIndex) => (
                    <tr key={item.key} className={cn(
                      "border-b border-slate-600",
                      rowIndex % 2 === 0 ? "bg-slate-800/50" : "bg-slate-800/30"
                    )}>
                      <td className="px-6 py-4 font-medium text-slate-300 w-48 sticky left-0 bg-slate-800/80 backdrop-blur-sm">
                        {item.label}
                      </td>
                      {products.map((product) => (
                        <td key={product.id} className="px-6 py-4 text-center">
                          {item.type === "text" && (
                            <span className="text-white">
                              {item.key.includes('.') 
                                ? product.stores?.[item.key.split('.')[1] as keyof typeof product.stores] || 'N/A'
                                : product[item.key as keyof Product] || 'N/A'
                              }
                            </span>
                          )}
                          
                          {item.type === "price" && (
                            <span className="text-white font-medium">
                              {item.key === "promotional_price" && product.promotional_price
                                ? formatPrice(product.promotional_price, product.currency)
                                : item.key === "price"
                                ? formatPrice(product.price, product.currency)
                                : 'N/A'
                              }
                            </span>
                          )}
                          
                          {item.type === "rating" && (
                            <div className="flex justify-center">
                              {renderStars(product.rating)}
                            </div>
                          )}
                          
                          {item.type === "number" && (
                            <span className="text-white">
                              {product[item.key as keyof Product] || 0}
                            </span>
                          )}
                          
                          {item.type === "boolean" && (
                            <div className="flex justify-center">
                              {item.key.includes('.') 
                                ? product.stores?.[item.key.split('.')[1] as keyof typeof product.stores] 
                                  ? <CheckCircle2 className="h-4 w-4 text-green-400" />
                                  : <X className="h-4 w-4 text-red-400" />
                                : product[item.key as keyof Product]
                                  ? <CheckCircle2 className="h-4 w-4 text-green-400" />
                                  : <X className="h-4 w-4 text-red-400" />
                              }
                            </div>
                          )}
                          
                          {item.type === "date" && (
                            <span className="text-slate-400 text-sm">
                              {new Date(product.created_at).toLocaleDateString('fr-FR')}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions en bas */}
            <div className="p-6 border-t border-slate-600 bg-slate-800/50">
              <div className="flex flex-wrap gap-3 justify-center">
                {products.map((product) => (
                  <div key={product.id} className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => window.open(`/${product.stores?.slug}/${product.slug}`, '_blank')}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Voir
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/${product.stores?.slug}/${product.slug}`);
                        toast({
                          title: "Lien copié",
                          description: "Le lien du produit a été copié",
                        });
                      }}
                    >
                      <Share2 className="h-4 w-4 mr-1" />
                      Partager
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductComparison;