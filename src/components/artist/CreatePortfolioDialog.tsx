/**
 * Dialog de Création de Portfolio
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
import { useCreatePortfolio } from '@/hooks/artist/useArtistPortfolios';
import { useStore } from '@/hooks/useStore';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface CreatePortfolioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  storeId: string;
}

export function CreatePortfolioDialog({
  open,
  onOpenChange,
  onSuccess,
  storeId,
}: CreatePortfolioDialogProps) {
  const { store } = useStore();
  const createPortfolio = useCreatePortfolio();
  
  const [formData, setFormData] = useState({
    portfolio_name: '',
    portfolio_description: '',
    portfolio_bio: '',
    portfolio_image_url: '',
    is_public: true,
    is_featured: false,
    artist_product_id: '',
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

  // Récupérer les produits artistes du store
  const { data: artistProducts = [] } = useQuery({
    queryKey: ['store-artist-products', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artist_products')
        .select(`
          id,
          artist_name,
          products!inner (
            id,
            name,
            store_id
          )
        `)
        .eq('products.store_id', storeId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!storeId && open,
  });

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.portfolio_name || !formData.artist_product_id) {
      return;
    }

    // Filtrer les liens vides
    const links = Object.fromEntries(
      Object.entries(portfolioLinks).filter(([_, value]) => value.trim() !== '')
    );

    try {
      await createPortfolio.mutateAsync({
        artist_product_id: formData.artist_product_id,
        store_id: storeId,
        portfolio_name: formData.portfolio_name,
        portfolio_description: formData.portfolio_description || undefined,
        portfolio_bio: formData.portfolio_bio || undefined,
        portfolio_image_url: formData.portfolio_image_url || undefined,
        portfolio_links: Object.keys(links).length > 0 ? links : undefined,
        is_public: formData.is_public,
      });

      // Reset form
      setFormData({
        portfolio_name: '',
        portfolio_description: '',
        portfolio_bio: '',
        portfolio_image_url: '',
        is_public: true,
        is_featured: false,
        artist_product_id: '',
      });
      setPortfolioLinks({
        website: '',
        instagram: '',
        facebook: '',
        twitter: '',
        youtube: '',
        tiktok: '',
        linkedin: '',
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      // Error handled in hook
    }
  }, [formData, portfolioLinks, storeId, createPortfolio, onSuccess, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer un nouveau portfolio</DialogTitle>
          <DialogDescription>
            Créez un portfolio pour présenter vos œuvres d'artiste
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Produit artiste */}
          <div className="space-y-2">
            <Label htmlFor="artist_product">Artiste *</Label>
            <Select
              value={formData.artist_product_id}
              onValueChange={(value) => setFormData({ ...formData, artist_product_id: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un artiste" />
              </SelectTrigger>
              <SelectContent>
                {artistProducts.map((ap: any) => (
                  <SelectItem key={ap.id} value={ap.id}>
                    {ap.artist_name} - {(ap.products as any)?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Nom du portfolio */}
          <div className="space-y-2">
            <Label htmlFor="portfolio_name">Nom du portfolio *</Label>
            <Input
              id="portfolio_name"
              value={formData.portfolio_name}
              onChange={(e) => setFormData({ ...formData, portfolio_name: e.target.value })}
              placeholder="Mon Portfolio"
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
              placeholder="Description courte du portfolio..."
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
              placeholder="Biographie détaillée de l'artiste..."
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
              placeholder="https://..."
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
            <Button type="submit" disabled={createPortfolio.isPending}>
              {createPortfolio.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                'Créer le portfolio'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}







