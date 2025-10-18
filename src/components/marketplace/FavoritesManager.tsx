import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  X, 
  ShoppingCart, 
  Star, 
  Heart,
  Share2,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Trash2,
  Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { initiateMonerooPayment } from "@/lib/moneroo-payment";

interface Product {
  id: string;
  store_id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  price: number;
  promotional_price: number | null;
  currency: string;
  image_url: string | null;
  category: string | null;
  product_type: string | null;
  rating: number;
  reviews_count: number;
  sales_count: number;
  stores?: {
    name: string;
    slug: string;
    verified: boolean;
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
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "price" | "rating" | "created_at">("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterCategory, setFilterCategory] = useState("all");
  const [purchasing, setPurchasing] = useState<Set<string>>(new Set());

  // Filtrer et trier les favoris
  const filteredFavorites = favorites
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === "all" || product.category === filterCategory;
      return matchesSearch && matchesCategory;
    })
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
        default:
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
      }
      
      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const categories = Array.from(new Set(favorites.map(p => p.category).filter(Boolean))) as string[];

  const handlePurchase = async (product: Product) => {
    if (!product.store_id) {
      toast({
        title: "Erreur",
        description: "Boutique non disponible",
        variant: "destructive",
      });
      return;
    }

    try {
      setPurchasing(prev => new Set(prev).add(product.id));

      const price = product.promotional_price || product.price;
      
      const result = await initiateMonerooPayment({
        storeId: product.store_id,
        productId: product.id,
        amount: price,
        currency: product.currency,
        description: `Achat de ${product.name}`,
        customerEmail: "client@example.com",
        metadata: { 
          productName: product.name, 
          storeSlug: product.stores?.slug || "" 
        },
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
      setPurchasing(prev => {
        const newSet = new Set(prev);
        newSet.delete(product.id);
        return newSet;
      });
    }
  };

  const handleShare = async (product: Product) => {
    const url = `${window.location.origin}/${product.stores?.slug}/${product.slug}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description || "",
          url: url,
        });
      } catch (error) {
        console.log("Partage annulé");
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Lien copié",
        description: "Le lien du produit a été copié dans le presse-papiers",
      });
    }
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

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-slate-800 border-slate-600">
        <CardHeader className="border-b border-slate-600">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Mes favoris ({favorites.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              {favorites.length > 0 && (
                <Button
                  variant="outline"
                  onClick={onClearAll}
                  className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Effacer tout
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {favorites.length === 0 ? (
            <div className="text-center py-16">
              <div className="h-20 w-20 rounded-full bg-slate-700 mx-auto mb-4 flex items-center justify-center">
                <Heart className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-2">
                Aucun favori
              </h3>
              <p className="text-slate-400 mb-6">
                Ajoutez des produits à vos favoris pour les retrouver facilement
              </p>
            </div>
          ) : (
            <>
              {/* Filtres et recherche */}
              <div className="mb-6 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                      <Input
                        type="text"
                        placeholder="Rechercher dans vos favoris..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="p-2 bg-slate-700 border-slate-600 text-white rounded-md"
                    >
                      <option value="all">Toutes les catégories</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="p-2 bg-slate-700 border-slate-600 text-white rounded-md"
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
                </div>
              </div>

              {/* Liste des favoris */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFavorites.map((product) => {
                  const price = product.promotional_price || product.price;
                  const hasPromo = product.promotional_price && product.promotional_price < product.price;
                  const discountPercent = hasPromo
                    ? Math.round(((product.price - product.promotional_price!) / product.price) * 100)
                    : 0;

                  return (
                    <Card key={product.id} className="bg-slate-700 border-slate-600 hover:border-slate-500 transition-all duration-300">
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          {/* Image */}
                          <div className="flex-shrink-0">
                            <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-slate-600">
                              {product.image_url ? (
                                <img
                                  src={product.image_url}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ShoppingCart className="h-6 w-6 text-slate-400" />
                                </div>
                              )}
                              {hasPromo && (
                                <Badge className="absolute -top-1 -right-1 bg-red-600 text-white text-xs">
                                  -{discountPercent}%
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Contenu */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  {product.category && (
                                    <Badge variant="secondary" className="bg-slate-600 text-slate-300 text-xs">
                                      {product.category}
                                    </Badge>
                                  )}
                                  {product.stores?.verified && (
                                    <Badge className="bg-green-600 text-white text-xs">
                                      Vérifié
                                    </Badge>
                                  )}
                                </div>
                                <h3 className="text-sm font-semibold text-white mb-1 line-clamp-2">
                                  {product.name}
                                </h3>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onRemoveFavorite(product.id)}
                                className="text-slate-400 hover:text-red-400 h-6 w-6 p-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>

                            <div className="flex items-center gap-1 mb-2">
                              {renderStars(product.rating)}
                            </div>

                            <div className="flex items-center justify-between mb-3">
                              <div className="text-sm text-slate-400">
                                {product.sales_count} vente{product.sales_count !== 1 ? "s" : ""}
                              </div>
                              <div className="text-right">
                                {hasPromo && (
                                  <div className="text-xs text-slate-400 line-through">
                                    {product.price.toLocaleString()} {product.currency}
                                  </div>
                                )}
                                <div className="text-sm font-bold text-white">
                                  {price.toLocaleString()} {product.currency}
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-1">
                              <Button
                                onClick={() => handlePurchase(product)}
                                disabled={purchasing.has(product.id)}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
                              >
                                {purchasing.has(product.id) ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1" />
                                    Achat...
                                  </>
                                ) : (
                                  <>
                                    <ShoppingCart className="h-3 w-3 mr-1" />
                                    Acheter
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleShare(product)}
                                className="bg-slate-600 border-slate-500 text-white hover:bg-slate-500 h-8 w-8 p-0"
                              >
                                <Share2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {filteredFavorites.length === 0 && searchQuery && (
                <div className="text-center py-8">
                  <p className="text-slate-400">
                    Aucun produit trouvé pour "{searchQuery}"
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FavoritesManager;
