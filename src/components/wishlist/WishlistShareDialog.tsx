/**
 * Dialog pour partager la wishlist
 * Date: 27 Janvier 2025
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Share2,
  Copy,
  Check,
  Link as LinkIcon,
  Calendar,
  Eye,
  X,
} from 'lucide-react';
import { useWishlistShare, useCreateWishlistShare, useDeactivateWishlistShare } from '@/hooks/wishlist/useWishlistShare';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

interface WishlistShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const WishlistShareDialog = ({
  open,
  onOpenChange,
}: WishlistShareDialogProps) => {
  const { toast } = useToast();
  const { data: share, isLoading } = useWishlistShare();
  const createShare = useCreateWishlistShare();
  const deactivateShare = useDeactivateWishlistShare();
  const [copied, setCopied] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState(30);

  const shareUrl = share
    ? `${window.location.origin}/wishlist/shared/${share.share_token}`
    : null;

  const handleCopyLink = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: 'Lien copié',
        description: 'Le lien a été copié dans le presse-papiers',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      logger.error('Error copying link', { error });
      toast({
        title: 'Erreur',
        description: 'Impossible de copier le lien',
        variant: 'destructive',
      });
    }
  };

  const handleCreateShare = async () => {
    try {
      await createShare.mutateAsync(expiresInDays);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDeactivate = async () => {
    if (!share) return;
    try {
      await deactivateShare.mutateAsync(share.share_token);
      onOpenChange(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Partager ma wishlist
          </DialogTitle>
          <DialogDescription>
            Créez un lien pour partager votre wishlist avec vos proches
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-4">Chargement...</div>
          ) : share && shareUrl ? (
            <>
              <div className="space-y-2">
                <Label>Lien de partage</Label>
                <div className="flex gap-2">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyLink}
                    aria-label="Copier le lien de la liste de souhaits"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{share.view_count} vue{share.view_count > 1 ? 's' : ''}</span>
                </div>
                {share.expires_at && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Expire le {new Date(share.expires_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={handleDeactivate}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Désactiver le lien
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open(shareUrl, '_blank')}
                >
                  <LinkIcon className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Durée de validité (jours)</Label>
                <Input
                  type="number"
                  min="1"
                  max="365"
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(parseInt(e.target.value) || 30)}
                />
                <p className="text-xs text-muted-foreground">
                  Le lien expirera automatiquement après {expiresInDays} jour{expiresInDays > 1 ? 's' : ''}
                </p>
              </div>

              <Button
                onClick={handleCreateShare}
                disabled={createShare.isPending}
                className="w-full"
              >
                <Share2 className="h-4 w-4 mr-2" />
                {createShare.isPending ? 'Création...' : 'Créer le lien de partage'}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

