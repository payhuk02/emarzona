import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  X, 
  Heart, 
  Star, 
  ShoppingCart, 
  Share2, 
  Eye,
  CheckCircle2,
  Crown,
  TrendingUp,
  DollarSign,
  Package,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Trash2,
  Download,
  ExternalLink,
  Loader2,
  Sparkles,
  Zap,
  Target,
  Flame
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

interface FavoritesManagerProps {
  favorites: Product[];
  onRemoveFavorite: (productId: string) => void;
  onClearAll: () => void;
  onClose: () => void;
}

const FavoritesManager = ({
  favorites,
  onRemoveFavorite,
  onClearAll,
  onClose
}: FavoritesManagerProps) => {
  const { toast } = useToast();
  const [isAnimating, setIsAnimating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "price" | "rating" | "created_at">("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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

  // Filtrage et tri des favoris
  const filteredAndSortedFavorites = favorites
    .filter(product => 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.stores?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "price":
          aValue = a.promotional_price || a.price;
          bValue = b.promotional_price || b.price;
          break;
        case "rating":
          aValue = a.rating;
          bValue = b.rating;
          break;
        case "created_at":
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        default:
          return 0;
      }
      
      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handleShareAll = async () => {
    const urls = favorites.map(product => 
      `${window.location.origin}/${product.stores?.slug}/${product.slug}`
    ).join('\n\n');
    
    try {
      await navigator.clipboard.writeText(urls);
      toast({
        title: "Liens copiés",
        description: `${favorites.length} liens de favoris copiés dans le presse-papiers`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de copier les liens",
        variant: "destructive",
      });
    }
  };

  const handleExportFavorites = () => {
    const data = favorites.map(product => ({
      nom: product.name,
      prix: product.promotional_price || product.price,
      devise: product.currency,
      note: product.rating,
      boutique: product.stores?.name,
      catégorie: product.category,
      type: product.product_type,
      lien: `${window.location.origin}/${product.stores?.slug}/${product.slug}`
    }));
    
    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mes-favoris-payhuk.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Export réussi",
      description: "Vos favoris ont été exportés en CSV",
    });
  };

  if (favorites.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <Card className={cn(
        "relative w-full max-w-6xl max-h-[90vh] overflow-hidden bg-slate-800 border-slate-600 shadow-2xl",
        isAnimating ? "animate-out zoom-out-95 duration-300" : "animate-in zoom-in-95 duration-300"
      )}>
        <CardHeader className="border-b border-slate-600 bg-gradient-to-r from-red-600/20 to-pink-600/20">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-400" />
              Mes favoris ({favorites.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShareAll}
                className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
              >
                <Share2 className="h-4 w-4 mr-1" />
                Partager tout
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportFavorites}
                className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
              >
                <Download className="h-4 w-4 mr-1" />
                Exporter
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onClearAll}
                className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
              >
                <Trash2 className="h-4 w-4 mr-1" />
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

        <CardContent className="p-0">
          {/* Barre de recherche et contrôles */}
          <div className="p-6 border-b border-slate-600 bg-slate-800/50">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Recherche */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher dans vos favoris..."
                    className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Contrôles */}
              <div className="flex items-center gap-3">
                {/* Tri */}
                <div className="flex items-center gap-2">
                  <label className="text-sm text-slate-300">Trier par:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="p-2 bg-slate-700 border-slate-600 text-white rounded-md text-sm"
                  >
                    <option value="created_at">Date d'ajout</option>
                    <option value="name">Nom</option>
                    <option value="price">Prix</option>
                    <option value="rating">Note</option>
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                    className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                  >
                    {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                  </Button>
                </div>

                {/* Mode de vue */}
                <div className="flex items-center gap-1">
                  <Button
                    variant={viewMode === "grid" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                  >
                    <Package className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Liste des favoris */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {filteredAndSortedFavorites.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  {searchQuery ? "Aucun favori trouvé" : "Aucun favori"}
                </h3>
                <p className="text-slate-400">
                  {searchQuery 
                    ? "Essayez d'autres mots-clés" 
                    : "Commencez à ajouter des produits à vos favoris !"
                  }
                </p>
              </div>
            ) : (
              <div className={cn(
                "gap-6",
                viewMode === "grid" 
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" 
                  : "space-y-4"
              )}>
                {filteredAndSortedFavorites.map((product) => (
                  <Card key={product.id} className="group bg-slate-800/80 backdrop-blur-sm border-slate-600 hover:border-slate-500 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                    <CardContent className={cn("p-0", viewMode === "list" && "flex")}>
                      {/* Image */}
                      <div className={cn(
                        "relative overflow-hidden bg-slate-700",
                        viewMode === "grid" ? "aspect-square" : "w-32 h-32 flex-shrink-0"
                      )}>
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-8 w-8 text-slate-400" />
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
                          onClick={() => onRemoveFavorite(product.id)}
                          className="absolute top-2 right-2 bg-slate-800/90 backdrop-blur-sm border-slate-600 text-white hover:bg-slate-700 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Contenu */}
                      <div className={cn("p-4", viewMode === "list" && "flex-1")}>
                        <div className="flex items-center gap-2 mb-2">
                          {product.category && (
                            <Badge variant="secondary" className="bg-slate-700 text-slate-300 text-xs">
                              {product.category}
                            </Badge>
                          )}
                          {product.stores?.verified && (
                            <Badge className="bg-green-600 text-white text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Vérifié
                            </Badge>
                          )}
                        </div>

                        <h3 className="font-semibold text-white mb-2 line-clamp-2">
                          {product.name}
                        </h3>

                        <div className="flex items-center gap-1 mb-3">
                          {renderStars(product.rating)}
                        </div>

                        <div className="flex items-center justify-between mb-3">
                          <div className="text-sm text-slate-400">
                            Par {product.stores?.name}
                          </div>
                          <div className="text-sm text-slate-400">
                            {product.sales_count || 0} vente{(product.sales_count || 0) !== 1 ? "s" : ""}
                          </div>
                        </div>

                        <div className="flex items-center justify-between mb-4">
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

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
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
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FavoritesManager;