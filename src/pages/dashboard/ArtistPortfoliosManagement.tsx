/**
 * Page de Gestion des Portfolios d'Artistes
 * Date: 28 Janvier 2025
 * 
 * Interface dashboard pour créer, éditer et gérer les portfolios
 */

import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Palette, 
  Eye, 
  Heart, 
  Edit, 
  Trash2, 
  ExternalLink,
  Search,
  Filter,
  Grid,
  List,
} from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { 
  useStorePortfolios, 
  useCreatePortfolio,
  useArtistPortfolio,
} from '@/hooks/artist/useArtistPortfolios';
import { useToast } from '@/hooks/use-toast';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useDebounce } from '@/hooks/useDebounce';
import { CreatePortfolioDialog } from '@/components/artist/CreatePortfolioDialog';
import { EditPortfolioDialog } from '@/components/artist/EditPortfolioDialog';
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
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';

export default function ArtistPortfoliosManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { store, loading: storeLoading } = useStore();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState<string | null>(null);
  const [deletingPortfolio, setDeletingPortfolio] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [statusFilter, setStatusFilter] = useState<'all' | 'public' | 'private'>('all');
  
  const debouncedSearch = useDebounce(searchQuery, 300);
  const headerRef = useScrollAnimation<HTMLDivElement>();

  // Récupérer les portfolios
  const { data: portfolios = [], isLoading: portfoliosLoading, refetch } = useStorePortfolios(
    store?.id,
    {
      publicOnly: statusFilter === 'public' ? true : statusFilter === 'private' ? false : undefined,
    }
  );

  // Filtrer les portfolios selon la recherche
  const filteredPortfolios = useMemo(() => {
    if (!debouncedSearch) return portfolios;
    
    const query = debouncedSearch.toLowerCase();
    return portfolios.filter(
      (p) =>
        p.portfolio_name.toLowerCase().includes(query) ||
        p.portfolio_slug.toLowerCase().includes(query) ||
        p.portfolio_description?.toLowerCase().includes(query)
    );
  }, [portfolios, debouncedSearch]);

  // Statistiques
  const stats = useMemo(() => {
    const total = portfolios.length;
    const publicCount = portfolios.filter((p) => p.is_public).length;
    const featuredCount = portfolios.filter((p) => p.is_featured).length;
    const totalViews = portfolios.reduce((sum, p) => sum + p.total_views, 0);
    const totalLikes = portfolios.reduce((sum, p) => sum + p.total_likes, 0);
    const totalArtworks = portfolios.reduce((sum, p) => sum + p.total_artworks, 0);

    return {
      total,
      publicCount,
      featuredCount,
      totalViews,
      totalLikes,
      totalArtworks,
    };
  }, [portfolios]);

  const handleDelete = async () => {
    if (!deletingPortfolio) return;

    try {
      const { error } = await supabase
        .from('artist_portfolios')
        .delete()
        .eq('id', deletingPortfolio);

      if (error) throw error;

      toast({
        title: '✅ Portfolio supprimé',
        description: 'Le portfolio a été supprimé avec succès.',
      });

      refetch();
      setDeletingPortfolio(null);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error deleting portfolio', { error });
      toast({
        title: '❌ Erreur',
        description: errorMessage || 'Une erreur est survenue lors de la suppression.',
        variant: 'destructive',
      });
    }
  };

  if (storeLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              <Skeleton className="h-8 w-64" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-64" />
                ))}
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (!store) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 p-6">
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">Aucune boutique trouvée.</p>
              </CardContent>
            </Card>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-4 md:p-6 space-y-6">
            {/* Header */}
            <div
              ref={headerRef}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
            >
              <div>
                <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                  <Palette className="h-6 w-6 md:h-8 md:w-8 text-purple-600" />
                  Portfolios d'Artistes
                </h1>
                <p className="text-muted-foreground mt-1">
                  Gérez vos portfolios et galeries d'œuvres
                </p>
              </div>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Portfolio
              </Button>
            </div>

            {/* Statistiques */}
            {!portfoliosLoading && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground mb-1">Total</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground mb-1">Publics</p>
                    <p className="text-2xl font-bold text-green-600">{stats.publicCount}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground mb-1">Mis en avant</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.featuredCount}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground mb-1">Vues</p>
                    <p className="text-2xl font-bold">{stats.totalViews}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground mb-1">Likes</p>
                    <p className="text-2xl font-bold text-red-600">{stats.totalLikes}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground mb-1">Œuvres</p>
                    <p className="text-2xl font-bold">{stats.totalArtworks}</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Filtres et recherche */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher un portfolio..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={statusFilter === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setStatusFilter('all')}
                    >
                      Tous
                    </Button>
                    <Button
                      variant={statusFilter === 'public' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setStatusFilter('public')}
                    >
                      Publics
                    </Button>
                    <Button
                      variant={statusFilter === 'private' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setStatusFilter('private')}
                    >
                      Privés
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Liste des portfolios */}
            {portfoliosLoading ? (
              <div className={cn(
                'grid gap-4',
                viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
              )}>
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-64" />
                ))}
              </div>
            ) : filteredPortfolios.length > 0 ? (
              <div className={cn(
                'grid gap-4',
                viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
              )}>
                {filteredPortfolios.map((portfolio) => (
                  <Card key={portfolio.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2">{portfolio.portfolio_name}</CardTitle>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {portfolio.is_public ? (
                              <Badge variant="default">Public</Badge>
                            ) : (
                              <Badge variant="secondary">Privé</Badge>
                            )}
                            {portfolio.is_featured && (
                              <Badge variant="outline" className="bg-purple-50 text-purple-700">
                                Mis en avant
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {portfolio.portfolio_description && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {portfolio.portfolio_description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {portfolio.total_views}
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          {portfolio.total_likes}
                        </div>
                        <div>
                          {portfolio.total_artworks} œuvres
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => navigate(`/portfolio/${portfolio.portfolio_slug}`)}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Voir
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingPortfolio(portfolio.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeletingPortfolio(portfolio.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Palette className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucun portfolio</h3>
                  <p className="text-muted-foreground mb-6">
                    {searchQuery
                      ? 'Aucun portfolio ne correspond à votre recherche.'
                      : 'Créez votre premier portfolio pour présenter vos œuvres.'}
                  </p>
                  {!searchQuery && (
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Créer un portfolio
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Dialogs */}
          <CreatePortfolioDialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
            onSuccess={refetch}
            storeId={store.id}
          />

          {editingPortfolio && (
            <EditPortfolioDialog
              portfolioId={editingPortfolio}
              open={!!editingPortfolio}
              onOpenChange={(open) => !open && setEditingPortfolio(null)}
              onSuccess={refetch}
            />
          )}

          <AlertDialog open={!!deletingPortfolio} onOpenChange={(open) => !open && setDeletingPortfolio(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer le portfolio ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. Toutes les galeries et œuvres associées seront également supprimées.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </main>
      </div>
    </SidebarProvider>
  );
}

