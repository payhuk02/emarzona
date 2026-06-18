/**
 * Liste vendeur — œuvres d'artiste de la boutique (gestion catalogue).
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppPageShell } from '@/components/layout/AppPageShell';
import { useStore } from '@/hooks/useStore';
import { useSellerArtistProducts } from '@/hooks/artist/useSellerArtistProducts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Palette, Plus, Search, Edit, ImageIcon, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { formatFcfa } from '@/lib/format/fcfa';

const EDITION_LABELS: Record<string, string> = {
  original: 'Originale',
  limited_edition: 'Édition limitée',
  print: 'Tirage',
  reproduction: 'Reproduction',
};

export default function SellerArtistProductsList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { store } = useStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: artworks = [], isLoading } = useSellerArtistProducts(store?.id);

  const filtered = artworks.filter(item => {
    const meta = item.artist_products?.[0];
    const haystack = [item.name, meta?.artwork_title, meta?.artist_name, meta?.artwork_medium]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('products').delete().eq('id', deleteId);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ['seller-artist-products', store?.id] });
      toast({ title: t('artist.seller.deleted', 'Œuvre supprimée') });
      setDeleteId(null);
    } catch {
      toast({
        title: t('common.error', 'Erreur'),
        description: t('artist.seller.deleteError', 'Impossible de supprimer cette œuvre'),
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppPageShell mainClassName="overflow-x-hidden">
      <div className="container mx-auto space-y-4 p-3 sm:space-y-6 sm:p-4 md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-base font-bold sm:text-xl md:text-2xl lg:text-3xl">
              <Palette className="h-6 w-6 text-amber-500" aria-hidden />
              {t('artist.seller.title', "Mes œuvres d'artiste")}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              {t(
                'artist.seller.subtitle',
                'Gérez votre catalogue, éditions et certificats d’authenticité'
              )}
            </p>
          </div>
          <Button
            onClick={() => navigate('/dashboard/products/new/artist')}
            size="sm"
            className="text-xs sm:text-sm"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
            {t('artist.seller.create', 'Nouvelle œuvre')}
          </Button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('artist.seller.search', 'Rechercher une œuvre ou un artiste...')}
            className="min-h-[44px] pl-9 text-xs sm:text-sm"
          />
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <ImageIcon className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {t('artist.seller.empty', 'Aucune œuvre pour le moment')}
              </p>
              <Button className="mt-4" onClick={() => navigate('/dashboard/products/new/artist')}>
                {t('artist.seller.createFirst', 'Publier votre première œuvre')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(item => {
              const meta = item.artist_products?.[0];
              const title = meta?.artwork_title || item.name;
              const image =
                item.image_url || (item.images && item.images.length > 0 ? item.images[0] : null);
              const editionKey = meta?.artwork_edition_type || 'original';

              return (
                <Card key={item.id} className="overflow-hidden">
                  {image ? (
                    <img src={image} alt="" className="h-36 w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-36 items-center justify-center bg-muted">
                      <Palette className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h2 className="line-clamp-2 font-semibold leading-snug">{title}</h2>
                        {meta?.artist_name && (
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {meta.artist_name}
                          </p>
                        )}
                      </div>
                      <Badge variant={item.is_draft ? 'secondary' : 'default'}>
                        {item.is_draft
                          ? t('artist.seller.draft', 'Brouillon')
                          : item.is_active
                            ? t('artist.seller.published', 'Publiée')
                            : t('artist.seller.inactive', 'Inactive')}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {EDITION_LABELS[editionKey] ?? editionKey}
                      </Badge>
                      {meta?.artwork_edition_type === 'limited_edition' &&
                        meta.edition_number != null &&
                        meta.total_editions != null && (
                          <span className="text-xs text-muted-foreground">
                            {meta.edition_number}/{meta.total_editions}
                          </span>
                        )}
                      {meta?.certificate_of_authenticity && (
                        <span className="inline-flex items-center gap-0.5 text-xs text-emerald-600">
                          <Shield className="h-3 w-3" />
                          {t('artist.seller.certified', 'Certifiée')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium">{formatFcfa(item.price)}</p>
                    <div className="flex gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => navigate(`/dashboard/products/${item.id}/edit`)}
                      >
                        <Edit className="mr-1 h-3.5 w-3.5" />
                        {t('common.edit', 'Modifier')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(item.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        {t('common.delete', 'Supprimer')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <AlertDialog open={Boolean(deleteId)} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('artist.seller.deleteTitle', 'Supprimer cette œuvre ?')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'artist.seller.deleteDesc',
                'Cette action est irréversible. Les enchères ou commandes liées peuvent être affectées.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              {t('common.cancel', 'Annuler')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete', 'Supprimer')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppPageShell>
  );
}
