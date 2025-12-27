/**
 * Page de Détail d'Enchère - Participation
 * Date: 1 Février 2025
 * 
 * Interface pour participer aux enchères :
 * - Affichage détaillé de l'enchère
 * - Système d'offres (manuel et proxy)
 * - Historique des offres
 * - Watchlist
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Gavel,
  Clock,
  Users,
  DollarSign,
  Heart,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Timer,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  useAuctionBySlug,
  useAuctionBids,
  usePlaceBid,
  useProxyBid,
  useToggleWatchlist,
  useWatchlistStatus,
} from '@/hooks/artist/useArtistAuctions';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CountdownTimer } from '@/components/artist/AuctionCountdownTimer';

export default function AuctionDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [bidAmount, setBidAmount] = useState('');
  const [isProxyBid, setIsProxyBid] = useState(false);
  const [maxBidAmount, setMaxBidAmount] = useState('');

  const { data: auction, isLoading: auctionLoading } = useAuctionBySlug(slug || '');
  const { data: bids, isLoading: bidsLoading } = useAuctionBids(auction?.id || '');
  const { data: isWatching } = useWatchlistStatus(auction?.id || '', user?.id || '');
  
  const placeBid = usePlaceBid();
  const proxyBid = useProxyBid();
  const toggleWatchlist = useToggleWatchlist();

  const handlePlaceBid = async () => {
    if (!auction || !user) return;

    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Montant invalide',
        description: 'Veuillez entrer un montant valide.',
        variant: 'destructive',
      });
      return;
    }

    if (amount < (auction.current_bid + auction.minimum_bid_increment)) {
      toast({
        title: 'Offre trop faible',
        description: `L'offre doit être d'au moins ${(auction.current_bid + auction.minimum_bid_increment).toLocaleString('fr-FR')} XOF.`,
        variant: 'destructive',
      });
      return;
    }

    try {
      if (isProxyBid && maxBidAmount) {
        await proxyBid.mutateAsync({
          auctionId: auction.id,
          maxBidAmount: parseFloat(maxBidAmount),
        });
      } else {
        await placeBid.mutateAsync({
          auctionId: auction.id,
          bidAmount: amount,
        });
      }
      setBidAmount('');
      setMaxBidAmount('');
      setIsProxyBid(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleWatchlistToggle = async () => {
    if (!auction || !user) return;

    try {
      await toggleWatchlist.mutateAsync({
        auction_id: auction.id,
        add: !isWatching,
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (auctionLoading) {
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

  if (!auction) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1 p-8">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Enchère introuvable</h3>
                <Button onClick={() => navigate('/auctions')}>Retour aux enchères</Button>
              </CardContent>
            </Card>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  const isActive = auction.status === 'active';
  const isEnded = auction.status === 'ended' || auction.status === 'sold';
  const canBid = isActive && user && !isEnded;
  const myBids = bids?.filter(b => b.bidder_id === user?.id) || [];
  const winningBid = bids?.find(b => b.status === 'winning');

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Back Button */}
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Artwork Image */}
                <Card>
                  <CardContent className="p-0">
                    {auction.artist_products?.products?.image_url && (
                      <img
                        src={auction.artist_products.products.image_url}
                        alt={auction.auction_title}
                        className="w-full h-96 object-cover rounded-t-lg"
                      />
                    )}
                  </CardContent>
                </Card>

                {/* Auction Details */}
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-2xl">{auction.auction_title}</CardTitle>
                        <CardDescription className="mt-2">
                          {auction.artist_products?.artwork_title} par {auction.artist_products?.artist_name}
                        </CardDescription>
                      </div>
                      <Button
                        variant={isWatching ? 'default' : 'outline'}
                        size="sm"
                        onClick={handleWatchlistToggle}
                        disabled={!user}
                      >
                        <Heart className={`h-4 w-4 mr-2 ${isWatching ? 'fill-current' : ''}`} />
                        {isWatching ? 'Dans la watchlist' : 'Ajouter à la watchlist'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {auction.auction_description && (
                      <div className="prose dark:prose-invert max-w-none mb-6">
                        <p>{auction.auction_description}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Prix de départ</p>
                        <p className="text-lg font-semibold">{auction.starting_price.toLocaleString('fr-FR')} XOF</p>
                      </div>
                      {auction.reserve_price && (
                        <div>
                          <p className="text-sm text-muted-foreground">Prix de réserve</p>
                          <p className="text-lg font-semibold">{auction.reserve_price.toLocaleString('fr-FR')} XOF</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-muted-foreground">Incrément minimum</p>
                        <p className="text-lg font-semibold">{auction.minimum_bid_increment.toLocaleString('fr-FR')} XOF</p>
                      </div>
                      {auction.buy_now_price && (
                        <div>
                          <p className="text-sm text-muted-foreground">Achat immédiat</p>
                          <p className="text-lg font-semibold">{auction.buy_now_price.toLocaleString('fr-FR')} XOF</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Bids History */}
                <Card>
                  <CardHeader>
                    <CardTitle>Historique des Offres</CardTitle>
                    <CardDescription>
                      {bids?.length || 0} offres au total • {auction.unique_bidders} enchérisseurs
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {bidsLoading ? (
                      <Skeleton className="h-32" />
                    ) : bids && bids.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Enchérisseur</TableHead>
                            <TableHead>Montant</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Statut</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {bids.map((bid) => (
                            <TableRow key={bid.id}>
                              <TableCell>
                                {bid.bidder_id === user?.id ? (
                                  <span className="font-semibold">Vous</span>
                                ) : (
                                  <span className="text-muted-foreground">Enchérisseur</span>
                                )}
                              </TableCell>
                              <TableCell className="font-semibold">
                                {bid.bid_amount.toLocaleString('fr-FR')} XOF
                              </TableCell>
                              <TableCell>
                                <Badge variant={bid.is_proxy_bid ? 'secondary' : 'outline'}>
                                  {bid.is_proxy_bid ? 'Proxy' : 'Manuel'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {format(new Date(bid.created_at), 'PPp', { locale: fr })}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    bid.status === 'winning'
                                      ? 'default'
                                      : bid.status === 'outbid'
                                      ? 'destructive'
                                      : 'secondary'
                                  }
                                >
                                  {bid.status === 'winning' && 'Gagnante'}
                                  {bid.status === 'outbid' && 'Dépassée'}
                                  {bid.status === 'active' && 'Active'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">Aucune offre pour le moment</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Current Bid & Timer */}
                <Card>
                  <CardHeader>
                    <CardTitle>Offre Actuelle</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-primary">
                        {auction.current_bid.toLocaleString('fr-FR')} XOF
                      </p>
                      {winningBid && winningBid.bidder_id === user?.id && (
                        <Badge className="mt-2 bg-green-500">Vous êtes en tête !</Badge>
                      )}
                    </div>

                    {isActive && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Temps restant</span>
                          <Clock className="h-4 w-4" />
                        </div>
                        <CountdownTimer endDate={auction.end_date} />
                      </div>
                    )}

                    {isEnded && (
                      <Badge variant="secondary" className="w-full justify-center py-2">
                        Enchère terminée
                      </Badge>
                    )}
                  </CardContent>
                </Card>

                {/* Place Bid */}
                {canBid && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Placer une Offre</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="bid_amount">Montant de l'offre (XOF)</Label>
                        <Input
                          id="bid_amount"
                          type="number"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          placeholder={`Minimum: ${(auction.current_bid + auction.minimum_bid_increment).toLocaleString('fr-FR')}`}
                          min={auction.current_bid + auction.minimum_bid_increment}
                        />
                        <p className="text-xs text-muted-foreground">
                          Offre minimum: {(auction.current_bid + auction.minimum_bid_increment).toLocaleString('fr-FR')} XOF
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="proxy_bid">Enchère proxy (automatique)</Label>
                        <Switch
                          id="proxy_bid"
                          checked={isProxyBid}
                          onCheckedChange={setIsProxyBid}
                        />
                      </div>

                      {isProxyBid && (
                        <div className="space-y-2">
                          <Label htmlFor="max_bid">Montant maximum (XOF)</Label>
                          <Input
                            id="max_bid"
                            type="number"
                            value={maxBidAmount}
                            onChange={(e) => setMaxBidAmount(e.target.value)}
                            placeholder="Votre limite maximum"
                            min={auction.current_bid + auction.minimum_bid_increment}
                          />
                          <p className="text-xs text-muted-foreground">
                            Le système enchérira automatiquement jusqu'à ce montant
                          </p>
                        </div>
                      )}

                      <Button
                        className="w-full"
                        onClick={handlePlaceBid}
                        disabled={placeBid.isPending || proxyBid.isPending || !bidAmount}
                      >
                        {placeBid.isPending || proxyBid.isPending ? (
                          <>
                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                            En cours...
                          </>
                        ) : (
                          <>
                            <Gavel className="h-4 w-4 mr-2" />
                            Placer l'offre
                          </>
                        )}
                      </Button>

                      {auction.buy_now_price && auction.status === 'active' && (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={async () => {
                            if (!user) {
                              toast({
                                title: 'Connexion requise',
                                description: 'Vous devez être connecté pour acheter immédiatement.',
                                variant: 'destructive',
                              });
                              return;
                            }
                            
                            // Rediriger vers le checkout avec le prix buy now
                            navigate(`/checkout?auction=${auction.id}&buy_now=true`);
                          }}
                        >
                          Acheter maintenant ({auction.buy_now_price.toLocaleString('fr-FR')} XOF)
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* My Bids */}
                {user && myBids.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Mes Offres</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {myBids.map((bid) => (
                          <div key={bid.id} className="flex items-center justify-between p-2 border rounded">
                            <div>
                              <p className="font-semibold">{bid.bid_amount.toLocaleString('fr-FR')} XOF</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(bid.created_at), 'PPp', { locale: fr })}
                              </p>
                            </div>
                            <Badge
                              variant={
                                bid.status === 'winning'
                                  ? 'default'
                                  : bid.status === 'outbid'
                                  ? 'destructive'
                                  : 'secondary'
                              }
                            >
                              {bid.status === 'winning' && 'Gagnante'}
                              {bid.status === 'outbid' && 'Dépassée'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Auction Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Informations</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Début</p>
                      <p className="font-medium">{format(new Date(auction.start_date), 'PPp', { locale: fr })}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Fin</p>
                      <p className="font-medium">{format(new Date(auction.end_date), 'PPp', { locale: fr })}</p>
                    </div>
                    {auction.allow_automatic_extension && (
                      <div>
                        <p className="text-muted-foreground">Prolongation automatique</p>
                        <p className="font-medium">Oui ({auction.extension_minutes} minutes)</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}








