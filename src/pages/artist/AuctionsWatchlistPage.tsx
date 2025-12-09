/**
 * Page Watchlist des Enchères
 * Date: 1 Février 2025
 * 
 * Interface pour gérer la watchlist des enchères :
 * - Liste des enchères suivies
 * - Notifications
 * - Accès rapide
 */

import { useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Heart,
  Eye,
  Clock,
  Gavel,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  useUserWatchlist,
  useUpdateWatchlistPreferences,
  useRemoveFromWatchlist,
  type ArtistProductAuction,
} from '@/hooks/artist/useArtistAuctions';
import { CountdownTimer } from '@/components/artist/AuctionCountdownTimer';

export default function AuctionsWatchlistPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: watchlist, isLoading } = useUserWatchlist(user?.id || '');
  const updatePreferences = useUpdateWatchlistPreferences();
  const removeFromWatchlist = useRemoveFromWatchlist();

  const handleRemove = async (auctionId: string) => {
    try {
      await removeFromWatchlist.mutateAsync(auctionId);
      toast({
        title: 'Retiré de la watchlist',
        description: 'L\'enchère a été retirée de votre watchlist.',
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleToggleNotification = async (
    auctionId: string,
    notificationType: 'notify_on_new_bid' | 'notify_on_ending_soon' | 'notify_on_ending',
    currentValue: boolean
  ) => {
    try {
      await updatePreferences.mutateAsync({
        auctionId,
        [notificationType]: !currentValue,
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1 p-8">
            <Skeleton className="h-8 w-64 mb-4" />
            <Skeleton className="h-64 w-full" />
          </main>
        </div>
      </SidebarProvider>
    );
  }

  const activeAuctions = watchlist?.filter((item) => item.auctions?.status === 'active') || [];
  const endedAuctions = watchlist?.filter((item) => 
    item.auctions?.status === 'ended' || item.auctions?.status === 'sold'
  ) || [];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Heart className="h-8 w-8 fill-red-500 text-red-500" />
                Ma Watchlist d'Enchères
              </h1>
              <p className="text-muted-foreground mt-2">
                Suivez vos enchères favorites et recevez des notifications
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total</CardTitle>
                  <Heart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{watchlist?.length || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Actives</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activeAuctions.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Terminées</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{endedAuctions.length}</div>
                </CardContent>
              </Card>
            </div>

            {/* Active Auctions */}
            {activeAuctions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Enchères Actives</CardTitle>
                  <CardDescription>Enchères que vous suivez actuellement</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activeAuctions.map((item) => {
                      const auction = item.auctions as ArtistProductAuction;
                      if (!auction) return null;

                      return (
                        <div
                          key={item.id}
                          className="border rounded-lg p-4 hover:bg-accent transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                {auction?.artist_products?.products?.image_url && (
                                  <img
                                    src={auction.artist_products.products.image_url}
                                    alt={auction.auction_title}
                                    className="h-16 w-16 rounded object-cover"
                                  />
                                )}
                                <div className="flex-1">
                                  <h3 className="font-semibold text-lg">{auction?.auction_title}</h3>
                                  <p className="text-sm text-muted-foreground">
                                    {auction?.artist_products?.artwork_title} par {auction?.artist_products?.artist_name}
                                  </p>
                                </div>
                              </div>

                              {auction && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                  <div>
                                    <p className="text-sm text-muted-foreground">Offre actuelle</p>
                                    <p className="font-semibold text-lg">
                                      {auction.current_bid.toLocaleString('fr-FR')} XOF
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Offres</p>
                                    <p className="font-semibold">{auction.total_bids}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Temps restant</p>
                                    <CountdownTimer endDate={auction.end_date} />
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Enchérisseurs</p>
                                    <p className="font-semibold">{auction.unique_bidders}</p>
                                  </div>
                                </div>
                              )}

                              {/* Notifications Settings */}
                              <div className="mt-4 pt-4 border-t space-y-2">
                                <p className="text-sm font-medium">Notifications</p>
                                <div className="flex flex-wrap gap-4">
                                  {auction && (
                                    <>
                                      <div className="flex items-center gap-2">
                                        <Switch
                                          checked={item.notify_on_new_bid}
                                          onCheckedChange={() =>
                                            handleToggleNotification(auction.id, 'notify_on_new_bid', item.notify_on_new_bid)
                                          }
                                          disabled={updatePreferences.isPending}
                                        />
                                        <Label className="text-sm">Nouvelles offres</Label>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Switch
                                          checked={item.notify_on_ending_soon}
                                          onCheckedChange={() =>
                                            handleToggleNotification(
                                              auction.id,
                                              'notify_on_ending_soon',
                                              item.notify_on_ending_soon
                                            )
                                          }
                                          disabled={updatePreferences.isPending}
                                        />
                                        <Label className="text-sm">Se termine bientôt</Label>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Switch
                                          checked={item.notify_on_ending}
                                          onCheckedChange={() =>
                                            handleToggleNotification(auction.id, 'notify_on_ending', item.notify_on_ending)
                                          }
                                          disabled={updatePreferences.isPending}
                                        />
                                        <Label className="text-sm">Fin d'enchère</Label>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {auction && (
                              <div className="flex flex-col gap-2 ml-4">
                                <Button
                                  onClick={() => navigate(`/auctions/${auction.auction_slug}`)}
                                  size="sm"
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Voir
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRemove(auction.id)}
                                  disabled={removeFromWatchlist.isPending}
                                >
                                  <Heart className="h-4 w-4 mr-2 fill-current" />
                                  Retirer
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Ended Auctions */}
            {endedAuctions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Enchères Terminées</CardTitle>
                  <CardDescription>Enchères terminées que vous suiviez</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Œuvre</TableHead>
                        <TableHead>Titre</TableHead>
                        <TableHead>Prix final</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {endedAuctions.map((item) => {
                        const auction = item.auctions as ArtistProductAuction;
                        if (!auction) return null;

                        return (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {auction.artist_products?.products?.image_url && (
                                  <img
                                    src={auction.artist_products.products.image_url}
                                    alt={auction.auction_title}
                                    className="h-10 w-10 rounded object-cover"
                                  />
                                )}
                                <div>
                                  <p className="font-medium">{auction.artist_products?.artwork_title}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {auction.artist_products?.artist_name}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{auction.auction_title}</TableCell>
                            <TableCell className="font-semibold">
                              {auction.current_bid.toLocaleString('fr-FR')} XOF
                            </TableCell>
                            <TableCell>
                              <Badge variant={auction.status === 'sold' ? 'default' : 'secondary'}>
                                {auction.status === 'sold' ? 'Vendue' : 'Terminée'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/auctions/${auction.auction_slug}`)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Voir
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {(!watchlist || watchlist.length === 0) && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Heart className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucune enchère dans la watchlist</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Ajoutez des enchères à votre watchlist pour les suivre et recevoir des notifications
                  </p>
                  <Button onClick={() => navigate('/auctions')}>
                    <Gavel className="h-4 w-4 mr-2" />
                    Voir les enchères
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
