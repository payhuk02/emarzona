/**
 * Component: ShortLinkManager
 * Description: Gestion des liens courts pour un lien d'affiliation
 * Date: 31/01/2025
 */

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Copy, Link as LinkIcon, Plus, Trash2, Loader2, CheckCircle2, XCircle } from '@/components/icons';
import { useAffiliateShortLinks } from '@/hooks/useAffiliateShortLinks';
import { CreateShortLinkForm } from '@/types/affiliate';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';

interface ShortLinkManagerProps {
  affiliateLinkId: string;
  fullUrl: string;
}

export const ShortLinkManager = ({ affiliateLinkId, fullUrl }: ShortLinkManagerProps) => {
  const { shortLinks, loading, createShortLink, deleteShortLink, toggleShortLink, refetch } = useAffiliateShortLinks(affiliateLinkId);
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [customAlias, setCustomAlias] = useState('');
  const [codeLength, setCodeLength] = useState(6);

  const handleCreateShortLink = useCallback(async () => {
    setIsCreating(true);
    try {
      const formData: CreateShortLinkForm = {
        affiliate_link_id: affiliateLinkId,
        custom_alias: customAlias.trim() || undefined,
        short_code_length: codeLength,
      };

      const result = await createShortLink(formData);
      if (result) {
        setCustomAlias('');
        setIsDialogOpen(false);
      }
    } finally {
      setIsCreating(false);
    }
  }, [affiliateLinkId, customAlias, codeLength, createShortLink]);

  const handleCopyShortLink = useCallback(async (shortCode: string) => {
    const shortUrl = `${window.location.origin}/aff/${shortCode}`;
    await navigator.clipboard.writeText(shortUrl);
    toast({
      title: 'Lien court copié !',
      description: `Le lien court a été copié dans le presse-papier`,
    });
  }, [toast]);

  const handleDelete = useCallback(async (shortLinkId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce lien court ?')) {
      await deleteShortLink(shortLinkId);
    }
  }, [deleteShortLink]);

  const handleToggle = useCallback(async (shortLinkId: string, isActive: boolean) => {
    await toggleShortLink(shortLinkId, !isActive);
  }, [toggleShortLink]);

  const getShortUrl = (shortCode: string) => `${window.location.origin}/aff/${shortCode}`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LinkIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Liens courts</span>
          {shortLinks.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {shortLinks.length}
            </Badge>
          )}
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-2">
              <Plus className="h-3.5 w-3.5" />
              Créer un lien court
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Créer un lien court</DialogTitle>
              <DialogDescription>
                Générez un lien court pour partager plus facilement votre lien d'affiliation
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="custom_alias">Alias personnalisé (optionnel)</Label>
                <Input
                  id="custom_alias"
                  placeholder="ex: youtube, facebook"
                  value={customAlias}
                  onChange={(e) => setCustomAlias(e.target.value)}
                  maxLength={20}
                />
                <p className="text-xs text-muted-foreground">
                  Si laissé vide, un code aléatoire sera généré
                </p>
              </div>
              
              {!customAlias.trim() && (
                <div className="space-y-2">
                  <Label htmlFor="code_length">Longueur du code</Label>
                  <Input
                    id="code_length"
                    type="number"
                    min="4"
                    max="10"
                    value={codeLength}
                    onChange={(e) => setCodeLength(Math.max(4, Math.min(10, parseInt(e.target.value) || 6)))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Entre 4 et 10 caractères (défaut: 6)
                  </p>
                </div>
              )}

              <div className="pt-2">
                <Button
                  onClick={handleCreateShortLink}
                  disabled={isCreating}
                  className="w-full gap-2"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Créer le lien court
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : shortLinks.length === 0 ? (
        <div className="text-center py-4 space-y-2">
          <p className="text-sm text-muted-foreground">
            Aucun lien court créé. Créez-en un pour partager plus facilement votre lien.
          </p>
          <p className="text-xs text-muted-foreground/70">
            💡 Les liens courts permettent de partager vos liens d'affiliation de manière plus simple et professionnelle.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {shortLinks.map((shortLink) => (
            <div
              key={shortLink.id}
              className="flex items-center justify-between p-3 border rounded-lg bg-card/50 hover:bg-card transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <code className="text-sm font-mono text-primary">
                    {getShortUrl(shortLink.short_code)}
                  </code>
                  {shortLink.is_active ? (
                    <Badge variant="default" className="text-xs">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Actif
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      <XCircle className="h-3 w-3 mr-1" />
                      Inactif
                    </Badge>
                  )}
                  {shortLink.custom_alias && (
                    <Badge variant="outline" className="text-xs">
                      {shortLink.custom_alias}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{shortLink.total_clicks} clics</span>
                  {shortLink.expires_at && (
                    <span>
                      Expire: {new Date(shortLink.expires_at).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCopyShortLink(shortLink.short_code)}
                  className="h-8 w-8 p-0"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleToggle(shortLink.id, shortLink.is_active)}
                  className="h-8 w-8 p-0"
                >
                  {shortLink.is_active ? (
                    <XCircle className="h-3.5 w-3.5" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(shortLink.id)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

