import { Product } from "@/hooks/useProducts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Edit, 
  Trash2, 
  Copy, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  Star,
  TrendingUp,
  Calendar,
  DollarSign,
  Package,
  MoreVertical,
  FileStack,
  PackageCheck,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { getStockInfo, formatStockQuantity } from "@/lib/stockUtils";

interface ProductCardDashboardProps {
  product: Product;
  storeSlug: string;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus?: () => void;
  onDuplicate?: () => void;
  onQuickView?: () => void;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
}

const ProductCardDashboard = ({
  product,
  storeSlug,
  onEdit,
  onDelete,
  onToggleStatus,
  onDuplicate,
  onQuickView,
  isSelected = false,
  onSelect,
}: ProductCardDashboardProps) => {
  const { toast } = useToast();
  const [imageError, setImageError] = useState(false);

  const productUrl = `${window.location.origin}/stores/${storeSlug}/products/${product.slug}`;
  
  // Calculer les informations de stock
  const stockInfo = getStockInfo(
    product.stock_quantity,
    product.low_stock_threshold,
    product.track_inventory ?? (product.product_type !== 'digital')
  );

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      toast({
        title: "Lien copié",
        description: "Le lien du produit a été copié dans le presse-papiers",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de copier le lien",
        variant: "destructive",
      });
    }
  };

  const handlePreview = () => {
    window.open(productUrl, "_blank");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getCategoryColor = (category: string | null) => {
    const colors: Record<string, string> = {
      'Formation': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
      'Digital': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
      'Service': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
      'Ebook': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
      'Logiciel': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100',
    };
    return colors[category || ''] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
  };

  return (
    <Card className={`group shadow-sm hover:shadow-md transition-all duration-300 border-border/50 hover:border-primary/30 bg-card/50 backdrop-blur-sm ${isSelected ? 'ring-2 ring-primary shadow-primary/20' : ''}`}>
      <CardHeader className="p-0 relative overflow-hidden rounded-t-lg">
        {product.image_url && !imageError ? (
          <div className="aspect-square rounded-t-lg overflow-hidden bg-muted relative">
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
              onError={() => setImageError(true)}
              loading="lazy"
            />
            <div className="absolute top-2 left-2 z-10">
              {onSelect && (
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={onSelect}
                  className="bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white transition-all duration-200"
                  aria-label="Sélectionner ce produit"
                />
              )}
            </div>
            <div className="absolute top-2 right-2 flex flex-col gap-1.5 z-10">
              <Badge 
                variant={product.is_active ? "default" : "secondary"}
                className="text-[10px] sm:text-xs font-semibold shadow-md animate-in zoom-in-95 duration-200"
              >
                {product.is_active ? "Actif" : "Inactif"}
              </Badge>
              {product.track_inventory !== false && product.product_type !== 'digital' && (
                <Badge 
                  variant="outline"
                  className={`text-[10px] sm:text-xs font-semibold shadow-md animate-in zoom-in-95 duration-200 ${stockInfo.status === 'out_of_stock' ? 'bg-red-500/90 text-white border-red-600' : stockInfo.status === 'low_stock' ? 'bg-orange-500/90 text-white border-orange-600' : 'bg-green-500/90 text-white border-green-600'}`}
                >
                  {stockInfo.status === 'out_of_stock' ? (
                    <><AlertTriangle className="h-3 w-3 mr-1" /> Rupture</>
                  ) : stockInfo.status === 'low_stock' ? (
                    <><AlertTriangle className="h-3 w-3 mr-1" /> {product.stock_quantity}</>
                  ) : (
                    <><PackageCheck className="h-3 w-3 mr-1" /> {product.stock_quantity}</>
                  )}
                </Badge>
              )}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        ) : (
          <div className="aspect-square rounded-t-lg bg-gradient-to-br from-muted via-muted/80 to-muted/50 flex items-center justify-center relative">
            <div className="text-center">
              <Package className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-2 group-hover:scale-110 transition-transform duration-200" />
              <span className="text-muted-foreground text-xs sm:text-sm">Pas d'image</span>
            </div>
            <div className="absolute top-2 left-2 z-10">
              {onSelect && (
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={onSelect}
                  className="bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white transition-all duration-200"
                  aria-label="Sélectionner ce produit"
                />
              )}
            </div>
            <div className="absolute top-2 right-2 flex flex-col gap-1.5 z-10">
              <Badge 
                variant={product.is_active ? "default" : "secondary"}
                className="text-[10px] sm:text-xs font-semibold shadow-md animate-in zoom-in-95 duration-200"
              >
                {product.is_active ? "Actif" : "Inactif"}
              </Badge>
              {product.track_inventory !== false && product.product_type !== 'digital' && (
                <Badge 
                  variant="outline"
                  className={`text-[10px] sm:text-xs font-semibold shadow-md animate-in zoom-in-95 duration-200 ${stockInfo.status === 'out_of_stock' ? 'bg-red-500/90 text-white border-red-600' : stockInfo.status === 'low_stock' ? 'bg-orange-500/90 text-white border-orange-600' : 'bg-green-500/90 text-white border-green-600'}`}
                >
                  {stockInfo.status === 'out_of_stock' ? (
                    <><AlertTriangle className="h-3 w-3 mr-1" /> Rupture</>
                  ) : stockInfo.status === 'low_stock' ? (
                    <><AlertTriangle className="h-3 w-3 mr-1" /> {product.stock_quantity}</>
                  ) : (
                    <><PackageCheck className="h-3 w-3 mr-1" /> {product.stock_quantity}</>
                  )}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-3 sm:p-4 space-y-2.5 sm:space-y-3">
        <div className="space-y-2">
          <CardTitle className="line-clamp-2 text-base sm:text-lg leading-tight group-hover:text-primary transition-colors duration-200 font-semibold">
            {product.name}
          </CardTitle>
          {product.description && (
            <CardDescription className="line-clamp-2 text-xs sm:text-sm leading-relaxed text-muted-foreground">
              {product.description.replace(/<[^>]*>/g, '')}
            </CardDescription>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
            <span className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400">
              {product.price.toLocaleString()} {product.currency}
            </span>
          </div>
          {product.rating > 0 && (
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-500 fill-current" />
              <span className="text-xs sm:text-sm font-medium">{product.rating.toFixed(1)}</span>
              <span className="text-[10px] sm:text-xs text-muted-foreground">({product.reviews_count})</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          {product.category && (
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <Badge variant="outline" className={`text-[10px] sm:text-xs ${getCategoryColor(product.category)}`}>
                {product.category}
              </Badge>
              {product.product_type && (
                <Badge variant="outline" className="text-[10px] sm:text-xs">
                  {product.product_type}
                </Badge>
              )}
            </div>
          )}
          
          <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(product.created_at)}</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              <span>0 ventes</span>
            </div>
          </div>

          {/* Information de stock pour les produits physiques */}
          {product.track_inventory !== false && product.product_type !== 'digital' && (
            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs flex-wrap">
              <PackageCheck className={`h-3 w-3 ${stockInfo.color}`} />
              <span className={`font-medium ${stockInfo.color}`}>
                {stockInfo.label}: {formatStockQuantity(product.stock_quantity, product.track_inventory)}
              </span>
              {stockInfo.status === 'low_stock' && product.low_stock_threshold && (
                <span className="text-muted-foreground">
                  (Seuil: {product.low_stock_threshold})
                </span>
              )}
            </div>
          )}
        </div>

        <div className="space-y-1 text-[10px] sm:text-xs text-muted-foreground pt-1 border-t border-border/30">
          <div className="flex items-center gap-1">
            <span className="font-medium">Lien:</span>
            <code className="flex-1 truncate bg-muted/50 px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-mono">
              {product.slug}
            </code>
          </div>
        </div>

        <div className="flex gap-1.5 sm:gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs sm:text-sm hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all duration-200 hover:scale-105 active:scale-95"
            onClick={onEdit}
          >
            <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
            <span className="hidden sm:inline">Modifier</span>
            <span className="sm:hidden">Modif.</span>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="hover:bg-accent/50 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <MoreVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {onQuickView && (
                <DropdownMenuItem onClick={onQuickView}>
                  <Eye className="h-4 w-4 mr-2" />
                  Aperçu rapide
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleCopyLink}>
                <Copy className="h-4 w-4 mr-2" />
                Copier le lien
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handlePreview}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Prévisualiser
              </DropdownMenuItem>
              {onDuplicate && (
                <DropdownMenuItem onClick={onDuplicate}>
                  <FileStack className="h-4 w-4 mr-2" />
                  Dupliquer
                </DropdownMenuItem>
              )}
              {onToggleStatus && (
                <DropdownMenuItem onClick={onToggleStatus}>
                  {product.is_active ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Désactiver
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Activer
                    </>
                  )}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCardDashboard;
