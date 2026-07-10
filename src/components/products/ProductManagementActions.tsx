import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  Edit,
  ExternalLink,
  Copy,
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
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export interface ProductManagementActionsProps {
  product: {
    id: string;
    slug: string;
    name?: string;
    is_active?: boolean | null;
  };
  storeSlug?: string;
  storeSubdomain?: string;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onToggleStatus?: (id: string, isActive: boolean) => void;
  onQuickView?: (id: string) => void;
  triggerProps?: React.ComponentProps<typeof Button>;
}

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

  const productUrl = React.useMemo(() => {
    return storeSlug && product.slug
      ? generateProductUrl(storeSlug, product.slug, storeSubdomain)
      : `/products/${product.slug || product.id}`;
  }, [storeSlug, product.slug, product.id, storeSubdomain]);

  const checkoutUrl = React.useMemo(() => {
    // URL relative au domaine courant (on ajoute juste /checkout/)
    return `${window.location.origin}/checkout/${product.id}`;
  }, [product.id]);

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const fullUrl = productUrl.startsWith('http')
        ? productUrl
        : `${window.location.origin}${productUrl}`;
      await navigator.clipboard.writeText(fullUrl);
      toast({
        title: 'Lien copié',
        description: 'Le lien du produit a été copié dans le presse-papiers.',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de copier le lien.',
        variant: 'destructive',
      });
    }
  };

  const handleCopyCheckoutLink = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(checkoutUrl);
      toast({
        title: 'Lien de paiement copié',
        description: 'Le lien de paiement direct a été copié.',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de copier le lien.',
        variant: 'destructive',
      });
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const fullUrl = productUrl.startsWith('http')
      ? productUrl
      : `${window.location.origin}${productUrl}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: product.name || 'Produit',
          text: `Découvrez ce produit : ${product.name || 'Génial !'}`,
          url: fullUrl,
        });
      } else {
        await handleCopyLink(e);
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
  };

  const handlePreview = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(productUrl, '_blank');
  };

  const defaultDuplicate = (id: string) => {
    navigate(`/dashboard/products/new?duplicate=${id}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={e => e.stopPropagation()}
          className="h-8 w-8 text-muted-foreground hover:text-foreground touch-manipulation"
          aria-label="Actions du produit"
          {...triggerProps}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56" onClick={e => e.stopPropagation()}>
        {onEdit && (
          <DropdownMenuItem onClick={() => onEdit(product.id)}>
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </DropdownMenuItem>
        )}

        {onQuickView && (
          <DropdownMenuItem onClick={() => onQuickView(product.id)}>
            <Eye className="h-4 w-4 mr-2" />
            Aperçu rapide
          </DropdownMenuItem>
        )}

        <DropdownMenuItem onClick={handlePreview}>
          <ExternalLink className="h-4 w-4 mr-2" />
          Voir la page produit
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleCopyLink}>
          <LinkIcon className="h-4 w-4 mr-2" />
          Copier le lien
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleCopyCheckoutLink}>
          <DollarSign className="h-4 w-4 mr-2" />
          Copier lien de paiement
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleShare}>
          <Share2 className="h-4 w-4 mr-2" />
          Partager
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => (onDuplicate ? onDuplicate(product.id) : defaultDuplicate(product.id))}
        >
          <FileStack className="h-4 w-4 mr-2" />
          Dupliquer
        </DropdownMenuItem>

        {onToggleStatus && product.is_active !== undefined && product.is_active !== null && (
          <DropdownMenuItem onClick={() => onToggleStatus(product.id, !product.is_active)}>
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

        {onDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(product.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
