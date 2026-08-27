import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  Edit,
  ExternalLink,
  BarChart3,
  Link as LinkIcon,
  Share2,
  FileStack,
  Trash2,
  MoreVertical,
  Eye,
  EyeOff,
  DollarSign,
} from 'lucide-react';
import { generateProductUrl } from '@/lib/store-utils';
import { buildWwwProductPublicPath } from '@/lib/seo/product-public-url';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export interface ProductManagementActionsProps {
  product: {
    id: string;
    slug: string;
    name?: string;
    is_active?: boolean | null;
    product_type?: string | null;
  };
  storeSlug?: string;
  storeSubdomain?: string;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onToggleStatus?: (id: string, isActive: boolean) => void;
  onQuickView?: (id: string) => void;
  /** @deprecated Prefer className via Select; kept for ServiceCard / digital card callers */
  triggerProps?: React.ComponentProps<typeof Button>;
}

type ActionValue =
  | 'edit'
  | 'quick-view'
  | 'view-product'
  | 'analytics'
  | 'copy-link'
  | 'copy-payment'
  | 'share'
  | 'duplicate'
  | 'toggle-status'
  | 'delete';

/**
 * Menu actions produit (⋯).
 * Utilise Select (bottom sheet mobile, z-[1060]) — même pattern stable que
 * la liste digitale — plutôt qu’un DropdownMenu flottant (z-50, instable au tactile).
 */
export const ProductManagementActions: React.FC<ProductManagementActionsProps> = ({
  product,
  storeSlug,
  storeSubdomain,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleStatus,
  onQuickView,
  triggerProps,
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  /** Remount after each action so the same item can be chosen again (Select keeps value). */
  const [menuKey, setMenuKey] = React.useState(0);

  const productUrl = React.useMemo(() => {
    const marketplacePath = buildWwwProductPublicPath({
      id: product.id,
      slug: product.slug,
      product_type: product.product_type,
    });
    if (marketplacePath) return marketplacePath;
    return storeSlug && product.slug
      ? generateProductUrl(storeSlug, product.slug, storeSubdomain)
      : `/products/${product.slug || product.id}`;
  }, [storeSlug, product.slug, product.id, product.product_type, storeSubdomain]);

  const checkoutUrl = React.useMemo(() => {
    return `${window.location.origin}/checkout/${product.id}`;
  }, [product.id]);

  const fullProductUrl = productUrl.startsWith('http')
    ? productUrl
    : `${window.location.origin}${productUrl}`;

  const copyText = async (text: string, title: string, description: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title, description });
    } catch {
      toast({
        title: 'Erreur',
        description: 'Impossible de copier le lien.',
        variant: 'destructive',
      });
    }
  };

  const defaultDuplicate = (id: string) => {
    if (product.product_type === 'service') {
      navigate(`/dashboard/products/new/service?duplicate=${encodeURIComponent(id)}`);
      return;
    }
    navigate(`/dashboard/products/new?duplicate=${id}`);
  };

  const runAction = async (action: ActionValue) => {
    switch (action) {
      case 'edit':
        onEdit?.(product.id);
        break;
      case 'quick-view':
        onQuickView?.(product.id);
        break;
      case 'view-product':
        window.open(productUrl, '_blank', 'noopener,noreferrer');
        break;
      case 'analytics':
        navigate(`/dashboard/services/${product.id}/analytics`);
        break;
      case 'copy-link':
        await copyText(
          fullProductUrl,
          'Lien copié',
          'Le lien du produit a été copié dans le presse-papiers.'
        );
        break;
      case 'copy-payment':
        await copyText(
          checkoutUrl,
          'Lien de paiement copié',
          'Le lien de paiement direct a été copié.'
        );
        break;
      case 'share':
        try {
          if (navigator.share) {
            await navigator.share({
              title: product.name || 'Produit',
              text: `Découvrez ce produit : ${product.name || 'Génial !'}`,
              url: fullProductUrl,
            });
          } else {
            await copyText(
              fullProductUrl,
              'Lien copié',
              'Le lien du produit a été copié dans le presse-papiers.'
            );
          }
        } catch (error) {
          if (error instanceof Error && error.name !== 'AbortError') {
            toast({
              title: 'Erreur',
              description: 'Erreur lors du partage.',
              variant: 'destructive',
            });
          }
        }
        break;
      case 'duplicate':
        if (onDuplicate) onDuplicate(product.id);
        else defaultDuplicate(product.id);
        break;
      case 'toggle-status':
        if (onToggleStatus && product.is_active !== undefined && product.is_active !== null) {
          onToggleStatus(product.id, !product.is_active);
        }
        break;
      case 'delete':
        onDelete?.(product.id);
        break;
      default:
        break;
    }
  };

  const triggerClassName = cn(
    'h-9 w-9 sm:h-10 sm:w-10 min-h-[44px] min-w-[44px] px-0 border-0 bg-transparent shadow-none',
    'text-muted-foreground hover:text-foreground hover:bg-accent',
    'flex items-center justify-center [&>svg:last-child]:hidden',
    triggerProps?.className
  );

  return (
    <Select
      key={menuKey}
      onValueChange={value => {
        void runAction(value as ActionValue);
        setMenuKey(k => k + 1);
      }}
    >
      <SelectTrigger
        aria-label="Actions du produit"
        className={triggerClassName}
        onPointerDown={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
      >
        <MoreVertical className="h-4 w-4" />
      </SelectTrigger>
      <SelectContent align="end" className="w-56" onClick={e => e.stopPropagation()}>
        {onEdit && (
          <SelectItem value="edit">
            <span className="flex items-center">
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </span>
          </SelectItem>
        )}

        {onQuickView && (
          <SelectItem value="quick-view">
            <span className="flex items-center">
              <Eye className="h-4 w-4 mr-2" />
              Aperçu rapide
            </span>
          </SelectItem>
        )}

        <SelectItem value="view-product">
          <span className="flex items-center">
            <ExternalLink className="h-4 w-4 mr-2" />
            Voir la page produit
          </span>
        </SelectItem>

        {product.product_type === 'service' && (
          <SelectItem value="analytics">
            <span className="flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </span>
          </SelectItem>
        )}

        <SelectItem value="copy-link">
          <span className="flex items-center">
            <LinkIcon className="h-4 w-4 mr-2" />
            Copier le lien
          </span>
        </SelectItem>

        <SelectItem value="copy-payment">
          <span className="flex items-center">
            <DollarSign className="h-4 w-4 mr-2" />
            Copier lien de paiement
          </span>
        </SelectItem>

        <SelectItem value="share">
          <span className="flex items-center">
            <Share2 className="h-4 w-4 mr-2" />
            Partager
          </span>
        </SelectItem>

        <SelectItem value="duplicate">
          <span className="flex items-center">
            <FileStack className="h-4 w-4 mr-2" />
            Dupliquer
          </span>
        </SelectItem>

        {onToggleStatus && product.is_active !== undefined && product.is_active !== null && (
          <SelectItem value="toggle-status">
            <span className="flex items-center">
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
            </span>
          </SelectItem>
        )}

        {onDelete && (
          <SelectItem
            value="delete"
            className="text-destructive font-medium focus:text-destructive focus:bg-destructive/10"
          >
            <span className="flex items-center">
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </span>
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
};
