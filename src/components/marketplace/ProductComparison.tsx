import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  ShoppingCart, 
  Star, 
  TrendingUp, 
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Heart,
  Share2
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
  const [purchasing, setPurchasing] = useState<Set<string>>(new Set());

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

  const getBestValue = () => {
    if (products.length < 2) return null;
    
    return products.reduce((best, current) => {
      const currentPrice = current.promotional_price || current.price;
      const bestPrice = best.promotional_price || best.price;
      
      // Comparer le rapport qualité/prix (rating / prix)
      const currentValue = current.rating / currentPrice;
      const bestValue = best.rating / bestPrice;
      
      return currentValue > bestValue ? current : best;
    });
  };

  const getCheapest = () => {
    if (products.length < 2) return null;
    
    return products.reduce((cheapest, current) => {
      const currentPrice = current.promotional_price || current.price;
      const cheapestPrice = cheapest.promotional_price || cheapest.price;
      
      return currentPrice < cheapestPrice ? current : cheapest;
    });
  };

  const getHighestRated = () => {
    if (products.length < 2) return null;
    
    return products.reduce((highest, current) => {
      return current.rating > highest.rating ? current : highest;
    });
  };

  const bestValue = getBestValue();
  const cheapest = getCheapest();
  const highestRated = getHighestRated();

  if (products.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-7xl max-h-[90vh] overflow-y-auto bg-slate-800 border-slate-600">
        <CardHeader className="border-b border-slate-600">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Comparaison de produits ({products.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={onClearAll}
                className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
              >
                Effacer tout
              </Button>
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
          {/* Recommandations */}
          {products.length >= 2 && (
            <div className="mb-6 p-4 bg-slate-700 rounded-lg">
              <h3 className="text-white font-semibold mb-3">Recommandations</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {bestValue && (
                  <div className="flex items-center gap-2 p-2 bg-green-600/20 rounded">
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                    <span className="text-sm text-white">
                      <strong>Meilleur rapport qualité/prix:</strong> {bestValue.name}
                    </span>
                  </div>
                )}
                {cheapest && (
                  <div className="flex items-center gap-2 p-2 bg-blue-600/20 rounded">
                    <TrendingUp className="h-4 w-4 text-blue-400" />
                    <span className="text-sm text-white">
                      <strong>Prix le plus bas:</strong> {cheapest.name}
                    </span>
                  </div>
                )}
                {highestRated && (
                  <div className="flex items-center gap-2 p-2 bg-yellow-600/20 rounded">
                    <Star className="h-4 w-4 text-yellow-400" />
                    <span className="text-sm text-white">
                      <strong>Mieux noté:</strong> {highestRated.name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tableau de comparaison */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-600">
                  <th className="text-left p-3 text-white font-semibold">Critères</th>
                  {products.map(product => (
                    <th key={product.id} className="text-center p-3 min-w-[200px]">
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveProduct(product.id)}
                          className="absolute -top-2 -right-2 h-6 w-6 p-0 bg-red-600 hover:bg-red-700 text-white"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                        
                        <div className="space-y-2">
                          <div className="w-20 h-20 mx-auto rounded-lg overflow-hidden bg-slate-700">
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
                          </div>
                          <h4 className="text-sm font-semibold text-white line-clamp-2">
                            {product.name}
                          </h4>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Prix */}
                <tr className="border-b border-slate-600">
                  <td className="p-3 text-white font-medium">Prix</td>
                  {products.map(product => {
                    const price = product.promotional_price || product.price;
                    const hasPromo = product.promotional_price && product.promotional_price < product.price;
                    const isCheapest = cheapest?.id === product.id;
                    
                    return (
                      <td key={product.id} className="p-3 text-center">
                        <div className={`p-2 rounded ${isCheapest ? 'bg-green-600/20' : 'bg-slate-700'}`}>
                          {hasPromo && (
                            <div className="text-xs text-slate-400 line-through mb-1">
                              {product.price.toLocaleString()} {product.currency}
                            </div>
                          )}
                          <div className="text-white font-semibold">
                            {price.toLocaleString()} {product.currency}
                          </div>
                          {isCheapest && (
                            <Badge className="mt-1 bg-green-600 text-white text-xs">
                              Prix le plus bas
                            </Badge>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {/* Note */}
                <tr className="border-b border-slate-600">
                  <td className="p-3 text-white font-medium">Note</td>
                  {products.map(product => {
                    const isHighest = highestRated?.id === product.id;
                    
                    return (
                      <td key={product.id} className="p-3 text-center">
                        <div className={`p-2 rounded ${isHighest ? 'bg-yellow-600/20' : 'bg-slate-700'}`}>
                          {renderStars(product.rating)}
                          {isHighest && (
                            <Badge className="mt-1 bg-yellow-600 text-white text-xs">
                              Mieux noté
                            </Badge>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {/* Ventes */}
                <tr className="border-b border-slate-600">
                  <td className="p-3 text-white font-medium">Ventes</td>
                  {products.map(product => (
                    <td key={product.id} className="p-3 text-center">
                      <div className="p-2 bg-slate-700 rounded">
                        <div className="text-white font-semibold">
                          {product.sales_count}
                        </div>
                        <div className="text-xs text-slate-400">
                          vente{product.sales_count !== 1 ? "s" : ""}
                        </div>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Catégorie */}
                <tr className="border-b border-slate-600">
                  <td className="p-3 text-white font-medium">Catégorie</td>
                  {products.map(product => (
                    <td key={product.id} className="p-3 text-center">
                      <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                        {product.category || "N/A"}
                      </Badge>
                    </td>
                  ))}
                </tr>

                {/* Type */}
                <tr className="border-b border-slate-600">
                  <td className="p-3 text-white font-medium">Type</td>
                  {products.map(product => (
                    <td key={product.id} className="p-3 text-center">
                      <Badge variant="outline" className="border-slate-600 text-slate-300">
                        {product.product_type || "N/A"}
                      </Badge>
                    </td>
                  ))}
                </tr>

                {/* Boutique */}
                <tr className="border-b border-slate-600">
                  <td className="p-3 text-white font-medium">Boutique</td>
                  {products.map(product => (
                    <td key={product.id} className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-white text-sm">
                          {product.stores?.name || "N/A"}
                        </span>
                        {product.stores?.verified && (
                          <CheckCircle2 className="h-4 w-4 text-green-400" />
                        )}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Actions */}
                <tr>
                  <td className="p-3 text-white font-medium">Actions</td>
                  {products.map(product => (
                    <td key={product.id} className="p-3 text-center">
                      <div className="space-y-2">
                        <Button
                          onClick={() => handlePurchase(product)}
                          disabled={purchasing.has(product.id)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {purchasing.has(product.id) ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                              Achat...
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              Acheter
                            </>
                          )}
                        </Button>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                          >
                            <Heart className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                          >
                            <Share2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductComparison;
