/**
 * Page Publique de Liste des Enchères
 * Date: 1 Février 2025
 * 
 * Page publique listant toutes les enchères actives disponibles
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Gavel,
  Search,
  _Clock,
  DollarSign,
  Users,
  Eye,
  Heart,
  TrendingUp,
} from 'lucide-react';
import {
  useActiveAuctions,
  useToggleWatchlist,
  useUserWatchlist,
  type _ArtistProductAuction,
} from '@/hooks/artist/useArtistAuctions';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CountdownTimer } from '@/components/artist/AuctionCountdownTimer';

export default function AuctionsListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: auctions, isLoading } = useActiveAuctions();
  const { data: userWatchlist } = useUserWatchlist(user?.id || '');
  const toggleWatchlist = useToggleWatchlist();

  const isInWatchlist = (auctionId: string) => {
    if (!userWatchlist) return false;
    return userWatchlist.some((item) => item.auction_id === auctionId);
  };

  const handleToggleWatchlist = async (auctionId: string) => {
    if (!user) {
      toast({
        title: 'Connexion requise',
        description: 'Vous devez être connecté pour ajouter une enchère à votre watchlist.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await toggleWatchlist.mutateAsync({
        auction_id: auctionId,
        add: !isInWatchlist(auctionId),
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const filteredAuctions = auctions?.filter((auction) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      auction.auction_title.toLowerCase().includes(query) ||
      auction.artist_products?.artwork_title?.toLowerCase().includes(query) ||
      auction.artist_products?.artist_name?.toLowerCase().includes(query)
    );
  }) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-8 w-64 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-96" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <Gavel className="h-10 w-10" />
            <h1 className="text-4xl font-bold">Enchères d'Œuvres d'Art</h1>
          </div>
          <p className="text-lg text-white/90">
            Découvrez et participez aux ventes aux enchères d'œuvres d'artistes
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Rechercher une enchère, un artiste ou une œuvre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Enchères Actives</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredAuctions.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Offres</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredAuctions.reduce((sum, a) => sum + a.total_bids, 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Enchérisseurs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredAuctions.reduce((sum, a) => sum + a.unique_bidders, 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valeur Totale</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredAuctions.reduce((sum, a) => sum + a.current_bid, 0).toLocaleString('fr-FR')} XOF
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Auctions Grid */}
        {filteredAuctions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Gavel className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune enchère trouvée</h3>
              <p className="text-muted-foreground text-center">
                {searchQuery
                  ? 'Aucune enchère ne correspond à votre recherche.'
                  : 'Il n\'y a actuellement aucune enchère active.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAuctions.map((auction) => (
              <Card key={auction.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  {auction.artist_products?.products?.image_url && (
                    <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden">
                      <img
                        src={auction.artist_products.products.image_url}
                        alt={auction.auction_title}
                        className="w-full h-full object-cover"
                      />
                      <Badge className="absolute top-2 right-2" variant="default">
                        {auction.status === 'active' ? 'Active' : auction.status}
                      </Badge>
                    </div>
                  )}
                  <CardTitle className="text-xl">{auction.auction_title}</CardTitle>
                  <CardDescription>
                    {auction.artist_products?.artwork_title} par {auction.artist_products?.artist_name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
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
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Temps restant</p>
                    <CountdownTimer endDate={auction.end_date} />
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{auction.unique_bidders} enchérisseur(s)</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Eye className="h-4 w-4" />
                    <span>{auction.views_count} vue(s)</span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      className="flex-1"
                      onClick={() => navigate(`/auctions/${auction.auction_slug}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Voir
                    </Button>
                    {user && (
                      <Button
                        variant={isInWatchlist(auction.id) ? "default" : "outline"}
                        size="icon"
                        onClick={() => handleToggleWatchlist(auction.id)}
                        disabled={toggleWatchlist.isPending}
                      >
                        <Heart className={`h-4 w-4 ${isInWatchlist(auction.id) ? 'fill-current' : ''}`} />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}







