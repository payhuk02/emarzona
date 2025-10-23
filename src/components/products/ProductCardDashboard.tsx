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
  FileStack
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
    <Card className={`group shadow-medium hover:shadow-lg transition-all duration-200 border-border/50 hover:border-primary/20 ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="p-0 relative">
        {product.image_url && !imageError ? (
          <div className="aspect-square rounded-t-lg overflow-hidden bg-muted relative">
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
              onError={() => setImageError(true)}
            />
            <div className="absolute top-2 left-2">
              {onSelect && (
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={onSelect}
                  className="bg-white shadow-lg"
                  aria-label="Sélectionner ce produit"
                />
              )}
            </div>
            <div className="absolute top-2 right-2 flex gap-1">
              <Badge 
                variant={product.is_active ? "default" : "secondary"}
                className="text-xs"
              >
                {product.is_active ? "Actif" : "Inactif"}
              </Badge>
            </div>
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
          </div>
        ) : (
          <div className="aspect-square rounded-t-lg bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center relative">
            <div className="text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <span className="text-muted-foreground text-sm">Pas d'image</span>
            </div>
            <div className="absolute top-2 left-2">
              {onSelect && (
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={onSelect}
                  className="bg-white shadow-lg"
                  aria-label="Sélectionner ce produit"
                />
              )}
            </div>
            <div className="absolute top-2 right-2">
              <Badge 
                variant={product.is_active ? "default" : "secondary"}
                className="text-xs"
              >
                {product.is_active ? "Actif" : "Inactif"}
              </Badge>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-4 space-y-3">
        <div className="space-y-2">
          <CardTitle className="line-clamp-2 text-lg leading-tight group-hover:text-primary transition-colors">
            {product.name}
          </CardTitle>
          {product.description && (
            <CardDescription className="line-clamp-2 text-sm leading-relaxed">
              {product.description.replace(/<[^>]*>/g, '')}
            </CardDescription>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="text-xl font-bold text-green-600">
              {product.price.toLocaleString()} {product.currency}
            </span>
          </div>
          {product.rating > 0 && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
              <span className="text-sm font-medium">{product.rating.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">({product.reviews_count})</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          {product.category && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`text-xs ${getCategoryColor(product.category)}`}>
                {product.category}
              </Badge>
              {product.product_type && (
                <Badge variant="outline" className="text-xs">
                  {product.product_type}
                </Badge>
              )}
            </div>
          )}
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(product.created_at)}</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              <span>0 ventes</span>
            </div>
          </div>
        </div>

        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="font-medium">Lien:</span>
            <code className="flex-1 truncate bg-muted px-1 rounded text-xs">
              {product.slug}
            </code>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onEdit}
          >
            <Edit className="h-4 w-4 mr-1" />
            Modifier
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="h-4 w-4" />
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
