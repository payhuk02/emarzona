/**
 * Dialog d'Édition de Portfolio
 * Date: 28 Janvier 2025
 */

import { useState, useCallback, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useArtistPortfolio } from '@/hooks/artist/useArtistPortfolios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { Loader2 } from 'lucide-react';

interface EditPortfolioDialogProps {
  portfolioId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditPortfolioDialog({
  portfolioId,
  open,
  onOpenChange,
  onSuccess,
}: EditPortfolioDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: portfolio, isLoading } = useArtistPortfolio(portfolioId);

  const [formData, setFormData] = useState({
    portfolio_name: '',
    portfolio_description: '',
    portfolio_bio: '',
    portfolio_image_url: '',
    is_public: true,
    is_featured: false,
  });

  const [portfolioLinks, setPortfolioLinks] = useState({
    website: '',
    instagram: '',
    facebook: '',
    twitter: '',
    youtube: '',
    tiktok: '',
    linkedin: '',
  });

  // Charger les données du portfolio
  useEffect(() => {
    if (portfolio) {
      setFormData({
        portfolio_name: portfolio.portfolio_name,
        portfolio_description: portfolio.portfolio_description || '',
        portfolio_bio: portfolio.portfolio_bio || '',
        portfolio_image_url: portfolio.portfolio_image_url || '',
        is_public: portfolio.is_public,
        is_featured: portfolio.is_featured,
      });

      const links = portfolio.portfolio_links || {};
      setPortfolioLinks({
        website: links.website || '',
        instagram: links.instagram || '',
        facebook: links.facebook || '',
        twitter: links.twitter || '',
        youtube: links.youtube || '',
        tiktok: links.tiktok || '',
        linkedin: links.linkedin || '',
      });
    }
  }, [portfolio]);

  const updatePortfolio = useMutation({
    mutationFn: async () => {
      // Filtrer les liens vides
      const links = Object.fromEntries(
        Object.entries(portfolioLinks).filter(([_, value]) => value.trim() !== '')
      );

      const { data, error } = await supabase
        .from('artist_portfolios')
        .update({
          portfolio_name: formData.portfolio_name,
          portfolio_description: formData.portfolio_description || null,
          portfolio_bio: formData.portfolio_bio || null,
          portfolio_image_url: formData.portfolio_image_url || null,
          portfolio_links: Object.keys(links).length > 0 ? links : null,
          is_public: formData.is_public,
          is_featured: formData.is_featured,
        })
        .eq('id', portfolioId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artist-portfolio', portfolioId] });
      queryClient.invalidateQueries({ queryKey: ['store-portfolios'] });
      
      toast({
        title: '✅ Portfolio mis à jour',
        description: 'Les modifications ont été enregistrées.',
      });

      onSuccess();
      onOpenChange(false);
    },
    onError: (error: any) => {
      logger.error('Error updating portfolio', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Une erreur est survenue lors de la mise à jour.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    await updatePortfolio.mutateAsync();
  }, [updatePortfolio]);

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le portfolio</DialogTitle>
          <DialogDescription>
            Modifiez les informations de votre portfolio
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nom du portfolio */}
          <div className="space-y-2">
            <Label htmlFor="portfolio_name">Nom du portfolio *</Label>
            <Input
              id="portfolio_name"
              value={formData.portfolio_name}
              onChange={(e) => setFormData({ ...formData, portfolio_name: e.target.value })}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="portfolio_description">Description</Label>
            <Textarea
              id="portfolio_description"
              value={formData.portfolio_description}
              onChange={(e) => setFormData({ ...formData, portfolio_description: e.target.value })}
              rows={3}
            />
          </div>

          {/* Biographie */}
          <div className="space-y-2">
            <Label htmlFor="portfolio_bio">Biographie</Label>
            <Textarea
              id="portfolio_bio"
              value={formData.portfolio_bio}
              onChange={(e) => setFormData({ ...formData, portfolio_bio: e.target.value })}
              rows={4}
            />
          </div>

          {/* Image de couverture */}
          <div className="space-y-2">
            <Label htmlFor="portfolio_image_url">URL de l'image de couverture</Label>
            <Input
              id="portfolio_image_url"
              type="url"
              value={formData.portfolio_image_url}
              onChange={(e) => setFormData({ ...formData, portfolio_image_url: e.target.value })}
            />
          </div>

          {/* Réseaux sociaux */}
          <div className="space-y-2">
            <Label>Réseaux sociaux</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Site web"
                value={portfolioLinks.website}
                onChange={(e) => setPortfolioLinks({ ...portfolioLinks, website: e.target.value })}
              />
              <Input
                placeholder="Instagram"
                value={portfolioLinks.instagram}
                onChange={(e) => setPortfolioLinks({ ...portfolioLinks, instagram: e.target.value })}
              />
              <Input
                placeholder="Facebook"
                value={portfolioLinks.facebook}
                onChange={(e) => setPortfolioLinks({ ...portfolioLinks, facebook: e.target.value })}
              />
              <Input
                placeholder="Twitter"
                value={portfolioLinks.twitter}
                onChange={(e) => setPortfolioLinks({ ...portfolioLinks, twitter: e.target.value })}
              />
              <Input
                placeholder="YouTube"
                value={portfolioLinks.youtube}
                onChange={(e) => setPortfolioLinks({ ...portfolioLinks, youtube: e.target.value })}
              />
              <Input
                placeholder="TikTok"
                value={portfolioLinks.tiktok}
                onChange={(e) => setPortfolioLinks({ ...portfolioLinks, tiktok: e.target.value })}
              />
            </div>
          </div>

          {/* Options */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="is_public">Portfolio public</Label>
              <Switch
                id="is_public"
                checked={formData.is_public}
                onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="is_featured">Mettre en avant</Label>
              <Switch
                id="is_featured"
                checked={formData.is_featured}
                onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={updatePortfolio.isPending}>
              {updatePortfolio.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

