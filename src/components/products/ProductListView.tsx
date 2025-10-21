import { Product } from "@/hooks/useProducts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  MoreVertical
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

interface ProductListViewProps {
  product: Product;
  storeSlug: string;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus?: () => void;
}

const ProductListView = ({
  product,
  storeSlug,
  onEdit,
  onDelete,
  onToggleStatus,
}: ProductListViewProps) => {
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
    <Card className="hover:shadow-md transition-shadow border-border/50">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Image */}
          <div className="flex-shrink-0">
            {product.image_url && !imageError ? (
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Contenu principal */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg truncate hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                  <Badge 
                    variant={product.is_active ? "default" : "secondary"}
                    className="text-xs flex-shrink-0"
                  >
                    {product.is_active ? "Actif" : "Inactif"}
                  </Badge>
                </div>
                
                {product.description && (
                  <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                    {product.description.replace(/<[^>]*>/g, '')}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3 text-green-600" />
                    <span className="font-semibold text-green-600">
                      {product.price.toLocaleString()} {product.currency}
                    </span>
                  </div>
                  
                  {product.category && (
                    <Badge variant="outline" className={`text-xs ${getCategoryColor(product.category)}`}>
                      {product.category}
                    </Badge>
                  )}
                  
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(product.created_at)}</span>
                  </div>
                  
                  {product.rating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                      <span>{product.rating.toFixed(1)}</span>
                      <span>({product.reviews_count})</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
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
                    <DropdownMenuItem onClick={handleCopyLink}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copier le lien
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handlePreview}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Prévisualiser
                    </DropdownMenuItem>
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
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductListView;
