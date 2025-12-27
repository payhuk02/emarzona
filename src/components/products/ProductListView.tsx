import React, { useMemo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Product } from '@/hooks/useProducts';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { LazyImage } from '@/components/ui/lazy-image';
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
  AlertTriangle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getStockInfo, formatStockQuantity } from '@/lib/stockUtils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ProductListViewProps {
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

const ProductListView = ({
  product,
  storeSlug,
  onEdit,
  onDelete,
  onToggleStatus,
  onDuplicate,
  onQuickView,
  isSelected = false,
  onSelect,
}: ProductListViewProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [imageError, setImageError] = useState(false);

  // Mémoriser l'URL du produit
  const productUrl = useMemo(
    () => `${window.location.origin}/stores/${storeSlug}/products/${product.slug}`,
    [storeSlug, product.slug]
  );

  // Calculer les informations de stock - mémorisé
  const stockInfo = useMemo(
    () =>
      getStockInfo(
        product.stock_quantity,
        product.low_stock_threshold,
        product.track_inventory ?? product.product_type !== 'digital'
      ),
    [
      product.stock_quantity,
      product.low_stock_threshold,
      product.track_inventory,
      product.product_type,
    ]
  );

  // Handlers mémorisés
  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      toast({
        title: t('products.linkCopied', 'Lien copié'),
        description: t(
          'products.linkCopiedDescription',
          'Le lien du produit a été copié dans le presse-papiers'
        ),
      });
    } catch (error) {
      toast({
        title: t('common.error', 'Erreur'),
        description: t('products.linkCopyError', 'Impossible de copier le lien'),
        variant: 'destructive',
      });
    }
  }, [productUrl, toast, t]);

  const handlePreview = useCallback(() => {
    window.open(productUrl, '_blank');
  }, [productUrl]);

  // Formater la date - mémorisé
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, []);

  // Obtenir la couleur de catégorie - mémorisé
  const getCategoryColor = useCallback((category: string | null) => {
    const  colors: Record<string, string> = {
      Formation: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
      Digital: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
      Service: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
      Ebook: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
      Logiciel: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100',
    };
    return (
      colors[category || ''] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
    );
  }, []);

  return (
    <Card
      className={`hover:shadow-md transition-all border-border/50 ${isSelected ? 'ring-2 ring-primary' : ''}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Checkbox de sélection */}
          {onSelect && (
            <div className="flex-shrink-0">
              <Checkbox
                checked={isSelected}
                onCheckedChange={onSelect}
                aria-label={t('products.selectProduct', 'Sélectionner ce produit')}
              />
            </div>
          )}

          {/* Image */}
          <div className="flex-shrink-0">
            {product.image_url && !imageError ? (
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted">
                <LazyImage
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

          {/* Informations principales */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base truncate hover:text-primary transition-colors">
                  {product.name}
                </h3>
              </div>

              <Badge
                variant={product.is_active ? 'default' : 'secondary'}
                className="flex-shrink-0 text-xs"
              >
                {product.is_active
                  ? t('products.status.active', 'Actif')
                  : t('products.status.inactive', 'Inactif')}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {product.category && (
                <Badge
                  variant="outline"
                  className={`text-xs ${getCategoryColor(product.category)}`}
                >
                  {product.category}
                </Badge>
              )}
              {product.product_type && (
                <Badge variant="outline" className="text-xs">
                  {product.product_type}
                </Badge>
              )}
              {/* Badge de stock pour produits physiques */}
              {product.track_inventory !== false && product.product_type !== 'digital' && (
                <Badge
                  variant="outline"
                  className={`text-xs flex items-center gap-1 ${stockInfo.status === 'out_of_stock' ? 'bg-red-500/20 text-red-400 border-red-500/30' : stockInfo.status === 'low_stock' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : 'bg-green-500/20 text-green-400 border-green-500/30'}`}
                >
                  {stockInfo.status === 'out_of_stock' ? (
                    <>
                      <AlertTriangle className="h-3 w-3" />{' '}
                      {t('products.stock.outOfStock', 'Rupture de stock')}
                    </>
                  ) : stockInfo.status === 'low_stock' ? (
                    <>
                      <AlertTriangle className="h-3 w-3" />{' '}
                      {t('products.stock.lowStock', 'Stock faible')} ({product.stock_quantity})
                    </>
                  ) : (
                    <>
                      <PackageCheck className="h-3 w-3" /> {t('products.stock.inStock', 'En stock')}{' '}
                      ({formatStockQuantity(product.stock_quantity, product.track_inventory)})
                    </>
                  )}
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3 text-green-600" />
                <span className="font-semibold text-green-600">
                  {product.price.toLocaleString()} {product.currency}
                </span>
              </div>
              {product.rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-yellow-500 fill-current" />
                  <span>{product.rating.toFixed(1)}</span>
                  <span className="text-muted-foreground">({product.reviews_count})</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(product.created_at)}</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                <span>{t('products.salesCount', '{{count}} ventes', { count: 0 })}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="flex items-center justify-center gap-1.5 min-w-[100px] lg:min-w-[120px]"
              aria-label={t('products.actions.edit', 'Modifier')}
            >
              <Edit className="h-4 w-4 flex-shrink-0" />
              <span className="hidden lg:inline whitespace-nowrap">
                {t('products.actions.edit', 'Modifier')}
              </span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center justify-center min-w-[40px]"
                  aria-label={t('products.actionsForProduct', 'Actions pour le produit {{name}}', {
                    name: product.name || product.id,
                  })}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-[calc(100vw-2rem)] sm:w-48 max-w-[calc(100vw-2rem)] sm:max-w-xs"
                mobileOptimized
              >
                {onQuickView && (
                  <DropdownMenuItem onClick={onQuickView}>
                    <Eye className="h-4 w-4 mr-2" />
                    {t('products.quickView.title', 'Aperçu rapide')}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleCopyLink}>
                  <Copy className="h-4 w-4 mr-2" />
                  {t('products.copyLink', 'Copier le lien')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handlePreview}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {t('products.preview', 'Prévisualiser')}
                </DropdownMenuItem>
                {onDuplicate && (
                  <DropdownMenuItem onClick={onDuplicate}>
                    <FileStack className="h-4 w-4 mr-2" />
                    {t('products.actions.duplicate', 'Dupliquer')}
                  </DropdownMenuItem>
                )}
                {onToggleStatus && (
                  <DropdownMenuItem onClick={onToggleStatus}>
                    {product.is_active ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-2" />
                        {t('products.deactivate', 'Désactiver')}
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        {t('products.activate', 'Activer')}
                      </>
                    )}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('products.actions.delete', 'Supprimer')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(ProductListView, (prevProps, nextProps) => {
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.updated_at === nextProps.product.updated_at &&
    prevProps.product.is_active === nextProps.product.is_active &&
    prevProps.product.price === nextProps.product.price &&
    prevProps.isSelected === nextProps.isSelected
  );
});






