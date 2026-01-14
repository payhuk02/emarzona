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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
    } catch (_error) {
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
    const colors: Record<string, string> = {
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
      <CardContent className="p-3 sm:p-4 md:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 lg:gap-6">
          {/* Checkbox de sélection */}
          {onSelect && (
            <div className="flex-shrink-0 order-1 sm:order-none self-start sm:self-center">
              <Checkbox
                checked={isSelected}
                onCheckedChange={onSelect}
                aria-label={t('products.selectProduct', 'Sélectionner ce produit')}
                className="min-h-[44px] min-w-[44px] touch-manipulation"
              />
            </div>
          )}

          {/* Image */}
          <div className="flex-shrink-0 order-2 sm:order-none">
            {product.image_url && !imageError ? (
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-lg overflow-hidden bg-muted">
                <LazyImage
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              </div>
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-lg bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                <Package className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Informations principales */}
          <div className="flex-1 min-w-0 space-y-2 sm:space-y-3 order-3 sm:order-none w-full">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base sm:text-lg md:text-xl lg:text-2xl break-words hover:text-primary transition-colors">
                  {product.name}
                </h3>
              </div>

              <Badge
                variant={product.is_active ? 'default' : 'secondary'}
                className="flex-shrink-0 text-xs sm:text-sm w-fit self-start sm:self-center"
              >
                {product.is_active
                  ? t('products.status.active', 'Actif')
                  : t('products.status.inactive', 'Inactif')}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {product.category && (
                <Badge
                  variant="outline"
                  className={`text-xs sm:text-sm ${getCategoryColor(product.category)}`}
                >
                  {product.category}
                </Badge>
              )}
              {product.product_type && (
                <Badge variant="outline" className="text-xs sm:text-sm">
                  {product.product_type}
                </Badge>
              )}
              {/* Badge de stock pour produits physiques */}
              {product.track_inventory !== false && product.product_type !== 'digital' && (
                <Badge
                  variant="outline"
                  className={`text-xs sm:text-sm flex items-center gap-1 ${stockInfo.status === 'out_of_stock' ? 'bg-red-500/20 text-red-400 border-red-500/30' : stockInfo.status === 'low_stock' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : 'bg-green-500/20 text-green-400 border-green-500/30'}`}
                >
                  {stockInfo.status === 'out_of_stock' ? (
                    <>
                      <AlertTriangle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />{' '}
                      <span className="hidden sm:inline">
                        {t('products.stock.outOfStock', 'Rupture de stock')}
                      </span>
                      <span className="sm:hidden">
                        {t('products.stock.outOfStockShort', 'Rupture')}
                      </span>
                    </>
                  ) : stockInfo.status === 'low_stock' ? (
                    <>
                      <AlertTriangle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />{' '}
                      <span className="hidden sm:inline">
                        {t('products.stock.lowStock', 'Stock faible')} ({product.stock_quantity})
                      </span>
                      <span className="sm:hidden">
                        {t('products.stock.lowStockShort', 'Faible')} ({product.stock_quantity})
                      </span>
                    </>
                  ) : (
                    <>
                      <PackageCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5" />{' '}
                      <span className="hidden sm:inline">
                        {t('products.stock.inStock', 'En stock')} (
                        {formatStockQuantity(product.stock_quantity, product.track_inventory)})
                      </span>
                      <span className="sm:hidden">
                        {t('products.stock.inStockShort', 'Stock')} (
                        {formatStockQuantity(product.stock_quantity, product.track_inventory)})
                      </span>
                    </>
                  )}
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                <span className="font-semibold text-green-600 text-sm sm:text-base">
                  {product.price.toLocaleString()} {product.currency}
                </span>
              </div>
              {product.rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-500 fill-current flex-shrink-0" />
                  <span>{product.rating.toFixed(1)}</span>
                  <span className="text-muted-foreground hidden sm:inline">
                    ({product.reviews_count})
                  </span>
                  <span className="text-muted-foreground sm:hidden">({product.reviews_count})</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="hidden md:inline">{formatDate(product.created_at)}</span>
                <span className="md:hidden">
                  {new Date(product.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="hidden sm:inline">
                  {t('products.salesCount', '{{count}} ventes', { count: 0 })}
                </span>
                <span className="sm:hidden">
                  {t('products.salesCountShort', '{{count}} v.', { count: 0 })}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex-shrink-0 flex items-center gap-2 order-4 sm:order-none w-full sm:w-auto justify-end sm:justify-start mt-2 sm:mt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="flex items-center justify-center gap-1.5 flex-1 sm:flex-initial min-w-[44px] sm:min-w-[100px] lg:min-w-[120px] min-h-[44px] touch-manipulation"
              aria-label={t('products.actions.edit', 'Modifier')}
            >
              <Edit className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline whitespace-nowrap">
                {t('products.actions.edit', 'Modifier')}
              </span>
            </Button>

            <Select
              onValueChange={value => {
                // Gérer les actions selon la valeur sélectionnée
                switch (value) {
                  case 'quickview':
                    onQuickView?.();
                    break;
                  case 'copylink':
                    handleCopyLink();
                    break;
                  case 'preview':
                    handlePreview();
                    break;
                  case 'duplicate':
                    onDuplicate?.();
                    break;
                  case 'toggle':
                    onToggleStatus?.();
                    break;
                  case 'delete':
                    onDelete();
                    break;
                  default:
                    break;
                }
              }}
            >
              <SelectTrigger
                className="flex items-center justify-center min-w-[44px] min-h-[44px] touch-manipulation border-border"
                aria-label={t('products.actionsForProduct', 'Actions pour le produit {{name}}', {
                  name: product.name || product.id,
                })}
              >
                <MoreVertical className="h-4 w-4" />
              </SelectTrigger>
              <SelectContent mobileVariant="sheet" className="min-w-[200px]">
                {onQuickView && (
                  <SelectItem value="quickview">
                    <span className="flex items-center">
                      <Eye className="h-4 w-4 mr-2" />
                      {t('products.quickView.title', 'Aperçu rapide')}
                    </span>
                  </SelectItem>
                )}
                <SelectItem value="copylink">
                  <span className="flex items-center">
                    <Copy className="h-4 w-4 mr-2" />
                    {t('products.copyLink', 'Copier le lien')}
                  </span>
                </SelectItem>
                <SelectItem value="preview">
                  <span className="flex items-center">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {t('products.preview', 'Prévisualiser')}
                  </span>
                </SelectItem>
                {onDuplicate && (
                  <SelectItem value="duplicate">
                    <span className="flex items-center">
                      <FileStack className="h-4 w-4 mr-2" />
                      {t('products.actions.duplicate', 'Dupliquer')}
                    </span>
                  </SelectItem>
                )}
                {onToggleStatus && (
                  <SelectItem value="toggle">
                    <span className="flex items-center">
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
                    </span>
                  </SelectItem>
                )}
                <SelectItem value="delete" className="text-destructive">
                  <span className="flex items-center">
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('products.actions.delete', 'Supprimer')}
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
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
